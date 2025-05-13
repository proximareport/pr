// This script migrates data from the old tags and categories tables 
// to the new unified taxonomy table in the database
require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function migrateTaxonomy() {
  try {
    await client.connect();
    console.log('Connected to database');

    // Begin transaction
    await client.query('BEGIN');
    console.log('Starting migration transaction');

    // 1. Create the new article_taxonomy table if it doesn't exist yet
    console.log('Ensuring article_taxonomy table exists...');
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS article_taxonomy (
          id SERIAL PRIMARY KEY,
          article_id INTEGER NOT NULL,
          taxonomy_id INTEGER NOT NULL,
          is_primary BOOLEAN NOT NULL DEFAULT false,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          UNIQUE(article_id, taxonomy_id)
        )
      `);
      console.log('Created or verified article_taxonomy table');
    } catch (error) {
      console.error('Error creating article_taxonomy table:', error);
      throw error;
    }

    // 2. Create the new taxonomy table if it doesn't exist yet
    console.log('Ensuring taxonomy table exists...');
    try {
      await client.query(`
        CREATE TYPE IF NOT EXISTS taxonomy_type AS ENUM ('tag', 'category');
        
        CREATE TABLE IF NOT EXISTS taxonomy (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          slug VARCHAR(255) NOT NULL,
          description TEXT,
          type taxonomy_type NOT NULL,
          parent_id INTEGER REFERENCES taxonomy(id),
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
          UNIQUE(slug, type)
        )
      `);
      console.log('Created or verified taxonomy table');
    } catch (error) {
      console.error('Error creating taxonomy table:', error);
      throw error;
    }

    // 3. Migrate tags to the taxonomy table
    console.log('Migrating tags to taxonomy table...');
    try {
      // Get existing taxonomy items to avoid duplication
      const existingTaxonomyItems = await client.query(`
        SELECT slug, type FROM taxonomy
      `);
      
      const existingSlugs = new Set(existingTaxonomyItems.rows.map(item => 
        `${item.slug}:${item.type}`
      ));

      const tags = await client.query('SELECT * FROM tags');
      console.log(`Found ${tags.rows.length} tags to migrate`);

      for (const tag of tags.rows) {
        // Skip if this tag already exists in taxonomy
        if (existingSlugs.has(`${tag.slug}:tag`)) {
          console.log(`Skipping tag "${tag.name}" (already exists in taxonomy table)`);
          continue;
        }

        // Insert tag into taxonomy with type 'tag'
        await client.query(`
          INSERT INTO taxonomy (name, slug, description, type, created_at, updated_at)
          VALUES ($1, $2, $3, 'tag', $4, $5)
          RETURNING id
        `, [tag.name, tag.slug, tag.description, tag.created_at, tag.updated_at]);
        
        console.log(`Migrated tag "${tag.name}"`);
      }
    } catch (error) {
      console.error('Error migrating tags:', error);
      throw error;
    }

    // 4. Migrate categories to the taxonomy table
    console.log('Migrating categories to taxonomy table...');
    try {
      // Get existing taxonomy items again in case we added new ones
      const existingTaxonomyItems = await client.query(`
        SELECT slug, type FROM taxonomy
      `);
      
      const existingSlugs = new Set(existingTaxonomyItems.rows.map(item => 
        `${item.slug}:${item.type}`
      ));

      const categories = await client.query('SELECT * FROM categories');
      console.log(`Found ${categories.rows.length} categories to migrate`);

      for (const category of categories.rows) {
        // Skip if this category already exists in taxonomy
        if (existingSlugs.has(`${category.slug}:category`)) {
          console.log(`Skipping category "${category.name}" (already exists in taxonomy table)`);
          continue;
        }

        // Insert category into taxonomy with type 'category'
        await client.query(`
          INSERT INTO taxonomy (name, slug, description, type, created_at, updated_at)
          VALUES ($1, $2, $3, 'category', $4, $5)
          RETURNING id
        `, [category.name, category.slug, category.description, category.created_at, category.updated_at]);
        
        console.log(`Migrated category "${category.name}"`);
      }
    } catch (error) {
      console.error('Error migrating categories:', error);
      throw error;
    }

    // 5. Migrate article-tag relationships
    console.log('Migrating article-tag relationships...');
    try {
      // Get all articles with tags
      const articlesWithTags = await client.query(`
        SELECT id, tags FROM articles WHERE tags IS NOT NULL AND array_length(tags, 1) > 0
      `);
      console.log(`Found ${articlesWithTags.rows.length} articles with tags`);

      // Get mapping of tag IDs to taxonomy IDs
      const tagToTaxonomyMap = new Map();
      const tagsResult = await client.query(`
        SELECT t.id as old_id, taxonomy.id as new_id 
        FROM tags t
        JOIN taxonomy ON t.slug = taxonomy.slug AND taxonomy.type = 'tag'
      `);
      
      tagsResult.rows.forEach(row => {
        tagToTaxonomyMap.set(row.old_id, row.new_id);
      });

      // Process each article
      for (const article of articlesWithTags.rows) {
        const articleId = article.id;
        const tagIds = article.tags;
        
        console.log(`Processing article ID ${articleId} with ${tagIds.length} tags`);
        
        // Convert old tag IDs to new taxonomy IDs
        const taxonomyIds = tagIds
          .map(tagId => tagToTaxonomyMap.get(tagId))
          .filter(id => id !== undefined);
        
        if (taxonomyIds.length === 0) {
          console.log(`No valid taxonomy IDs found for article ${articleId}, skipping`);
          continue;
        }
        
        // Insert article-taxonomy relationships
        for (let i = 0; i < taxonomyIds.length; i++) {
          const taxonomyId = taxonomyIds[i];
          const isPrimary = i === 0; // Make the first tag primary
          
          await client.query(`
            INSERT INTO article_taxonomy (article_id, taxonomy_id, is_primary)
            VALUES ($1, $2, $3)
            ON CONFLICT (article_id, taxonomy_id) DO UPDATE
            SET is_primary = $3
          `, [articleId, taxonomyId, isPrimary]);
        }
        
        // If this is the first tag, also update the article's primaryTaxonomyId
        if (taxonomyIds.length > 0) {
          await client.query(`
            ALTER TABLE articles ADD COLUMN IF NOT EXISTS primary_taxonomy_id INTEGER;
            
            UPDATE articles 
            SET primary_taxonomy_id = $1 
            WHERE id = $2
          `, [taxonomyIds[0], articleId]);
        }
        
        console.log(`Added ${taxonomyIds.length} taxonomy items to article ${articleId}`);
      }
    } catch (error) {
      console.error('Error migrating article-tag relationships:', error);
      throw error;
    }

    // 6. Migrate article categories
    console.log('Migrating article categories...');
    try {
      // Get all articles with categories
      const articlesWithCategories = await client.query(`
        SELECT id, category FROM articles WHERE category IS NOT NULL AND category != ''
      `);
      console.log(`Found ${articlesWithCategories.rows.length} articles with categories`);

      // Get mapping of category names to taxonomy IDs
      const categoryToTaxonomyMap = new Map();
      const categoriesResult = await client.query(`
        SELECT c.name as old_name, taxonomy.id as new_id 
        FROM categories c
        JOIN taxonomy ON c.slug = taxonomy.slug AND taxonomy.type = 'category'
      `);
      
      categoriesResult.rows.forEach(row => {
        categoryToTaxonomyMap.set(row.old_name, row.new_id);
      });

      // Process each article
      for (const article of articlesWithCategories.rows) {
        const articleId = article.id;
        const categoryName = article.category;
        
        const taxonomyId = categoryToTaxonomyMap.get(categoryName);
        
        if (!taxonomyId) {
          console.log(`No taxonomy ID found for category "${categoryName}", skipping article ${articleId}`);
          continue;
        }
        
        console.log(`Processing article ID ${articleId} with category "${categoryName}" (taxonomy ID: ${taxonomyId})`);
        
        // Check if this article already has a primary taxonomy
        const existingPrimary = await client.query(`
          SELECT taxonomy_id FROM article_taxonomy 
          WHERE article_id = $1 AND is_primary = true
        `, [articleId]);
        
        if (existingPrimary.rows.length > 0) {
          console.log(`Article ${articleId} already has a primary taxonomy, adding category as non-primary`);
          
          // Insert the category as non-primary
          await client.query(`
            INSERT INTO article_taxonomy (article_id, taxonomy_id, is_primary)
            VALUES ($1, $2, false)
            ON CONFLICT (article_id, taxonomy_id) DO NOTHING
          `, [articleId, taxonomyId]);
        } else {
          console.log(`Adding category "${categoryName}" as primary for article ${articleId}`);
          
          // Insert the category as primary
          await client.query(`
            INSERT INTO article_taxonomy (article_id, taxonomy_id, is_primary)
            VALUES ($1, $2, true)
            ON CONFLICT (article_id, taxonomy_id) DO UPDATE
            SET is_primary = true
          `, [articleId, taxonomyId]);
          
          // Update the article's primaryTaxonomyId
          await client.query(`
            ALTER TABLE articles ADD COLUMN IF NOT EXISTS primary_taxonomy_id INTEGER;
            
            UPDATE articles 
            SET primary_taxonomy_id = $1 
            WHERE id = $2
          `, [taxonomyId, articleId]);
        }
      }
    } catch (error) {
      console.error('Error migrating article categories:', error);
      throw error;
    }

    // 7. Add indexes for better performance
    console.log('Adding indexes for better performance...');
    try {
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_article_taxonomy_article_id ON article_taxonomy(article_id);
        CREATE INDEX IF NOT EXISTS idx_article_taxonomy_taxonomy_id ON article_taxonomy(taxonomy_id);
        CREATE INDEX IF NOT EXISTS idx_taxonomy_type ON taxonomy(type);
        CREATE INDEX IF NOT EXISTS idx_taxonomy_slug ON taxonomy(slug);
      `);
      console.log('Added indexes to taxonomy tables');
    } catch (error) {
      console.error('Error adding indexes:', error);
      throw error;
    }

    // Commit transaction
    await client.query('COMMIT');
    console.log('Migration completed successfully');
  } catch (error) {
    // Rollback transaction in case of any error
    await client.query('ROLLBACK');
    console.error('Migration failed, transaction rolled back:', error);
  } finally {
    await client.end();
    console.log('Database connection closed');
  }
}

// Run the migration
migrateTaxonomy().catch(console.error);
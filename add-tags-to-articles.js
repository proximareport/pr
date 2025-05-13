import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create database pool
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function addTagsToArticles() {
  console.log("Starting to add tags to articles...");
  
  try {
    // First, check if we have any tags in the database
    const tagsResult = await pool.query(`SELECT * FROM tags ORDER BY name`);
    
    if (tagsResult.rows.length === 0) {
      console.log("No tags found in the database. Creating some sample tags first...");
      
      // Create some sample tags if none exist
      await pool.query(`
        INSERT INTO tags (name, slug, description) 
        VALUES 
          ('Space', 'space', 'Space exploration and astronomy'),
          ('Technology', 'technology', 'Latest in tech and innovation'),
          ('Science', 'science', 'Scientific discoveries and research'),
          ('Mars', 'mars', 'Mars exploration and colonization')
        ON CONFLICT (name) DO NOTHING
      `);
      
      console.log("Sample tags created.");
    }
    
    // Get the current tags
    const tags = (await pool.query(`SELECT * FROM tags ORDER BY name`)).rows;
    console.log(`Found ${tags.length} tags in the database:`, tags.map(t => t.name).join(', '));
    
    // Get articles that don't have tags
    const articlesResult = await pool.query(`
      SELECT id, title FROM articles 
      WHERE tags IS NULL OR tags = '{}'
      LIMIT 10
    `);
    
    if (articlesResult.rows.length === 0) {
      console.log("No articles without tags found.");
      return;
    }
    
    console.log(`Found ${articlesResult.rows.length} articles without tags.`);
    
    // Assign random tags to each article
    for (const article of articlesResult.rows) {
      // Randomly select 1-2 tags for each article
      const tagCount = Math.floor(Math.random() * 2) + 1;
      const selectedTags = [];
      
      for (let i = 0; i < tagCount; i++) {
        const randomTag = tags[Math.floor(Math.random() * tags.length)];
        if (!selectedTags.includes(randomTag.id)) {
          selectedTags.push(randomTag.id);
        }
      }
      
      // Update the article with the selected tags
      await pool.query(`
        UPDATE articles
        SET tags = $1
        WHERE id = $2
      `, [selectedTags, article.id]);
      
      console.log(`Updated article ${article.id}: "${article.title}" with tags: ${selectedTags.join(', ')}`);
    }
    
    console.log("Tags have been added to articles successfully!");
    
  } catch (error) {
    console.error("Error adding tags to articles:", error);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

// Run the function
addTagsToArticles()
  .then(() => console.log('Script completed.'))
  .catch(err => console.error('Script failed:', err));
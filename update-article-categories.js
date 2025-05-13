// This script updates article categories to match our category system
import pkg from 'pg';
const { Pool } = pkg;

async function updateArticleCategories() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log("Starting article category update...");
    
    // First, get all available categories
    const categoriesResult = await pool.query(`
      SELECT id, name, slug FROM categories
    `);
    
    const categories = categoriesResult.rows;
    console.log(`Found ${categories.length} categories in the database.`);
    
    if (categories.length === 0) {
      console.log("No categories found. Exiting.");
      return;
    }
    
    // Get list of unique category values in articles
    const uniqueCategoriesResult = await pool.query(`
      SELECT DISTINCT category FROM articles
    `);
    
    const uniqueCategories = uniqueCategoriesResult.rows.map(row => row.category);
    console.log(`Found ${uniqueCategories.length} unique category values in articles: ${JSON.stringify(uniqueCategories)}`);
    
    // For each unique category that doesn't match a category slug, update it to a valid category
    const defaultCategory = categories[0].slug; // Use the first category as default
    
    for (const articleCategory of uniqueCategories) {
      // Check if this category matches any of our valid categories
      const matchingCategory = categories.find(cat => cat.slug === articleCategory);
      
      if (!matchingCategory) {
        console.log(`Category '${articleCategory}' is not valid. Updating to '${defaultCategory}'...`);
        
        // Update all articles with this invalid category
        const updateResult = await pool.query(`
          UPDATE articles 
          SET category = $1 
          WHERE category = $2
        `, [defaultCategory, articleCategory]);
        
        console.log(`Updated ${updateResult.rowCount} articles from '${articleCategory}' to '${defaultCategory}'.`);
      } else {
        console.log(`Category '${articleCategory}' is valid, no update needed.`);
      }
    }
    
    console.log("Article category update completed successfully.");
  } catch (error) {
    console.error("Error updating article categories:", error);
  } finally {
    await pool.end();
  }
}

updateArticleCategories();
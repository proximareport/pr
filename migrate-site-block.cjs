// This script creates the site_blocks table and inserts default data
require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function migrateSiteBlock() {
  try {
    await client.connect();
    console.log('Connected to database');

    // Begin transaction
    await client.query('BEGIN');
    console.log('Starting site block migration');

    // Create the site_blocks table
    console.log('Creating site_blocks table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS site_blocks (
        id SERIAL PRIMARY KEY,
        is_enabled BOOLEAN DEFAULT FALSE NOT NULL,
        title TEXT DEFAULT 'Site Temporarily Unavailable' NOT NULL,
        subtitle TEXT DEFAULT 'We are currently performing maintenance or updates.' NOT NULL,
        message TEXT DEFAULT 'Our team is working to bring the site back online as quickly as possible. Thank you for your patience.' NOT NULL,
        background_image_url TEXT,
        logo_url TEXT,
        primary_color TEXT DEFAULT '#4f46e5',
        secondary_color TEXT DEFAULT '#0f172a',
        show_login_form BOOLEAN DEFAULT TRUE NOT NULL,
        login_form_title TEXT DEFAULT 'Admin Access',
        login_form_subtitle TEXT DEFAULT 'Enter your credentials to access the site',
        custom_css TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        created_by INTEGER REFERENCES users(id),
        updated_by INTEGER REFERENCES users(id)
      )
    `);
    console.log('✅ Created site_blocks table');

    // Create index for faster lookups
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_site_blocks_enabled ON site_blocks(is_enabled)
    `);
    console.log('✅ Created index on is_enabled');

    // Create trigger function for updating updated_at
    await client.query(`
      CREATE OR REPLACE FUNCTION update_site_blocks_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);
    console.log('✅ Created trigger function');

    // Create trigger
    await client.query(`
      DROP TRIGGER IF EXISTS trigger_update_site_blocks_updated_at ON site_blocks;
      CREATE TRIGGER trigger_update_site_blocks_updated_at
        BEFORE UPDATE ON site_blocks
        FOR EACH ROW
        EXECUTE FUNCTION update_site_blocks_updated_at()
    `);
    console.log('✅ Created trigger');

    // Insert default site block configuration if none exists
    const existingBlocks = await client.query('SELECT COUNT(*) FROM site_blocks');
    if (parseInt(existingBlocks.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO site_blocks (
          is_enabled,
          title,
          subtitle,
          message,
          show_login_form,
          login_form_title,
          login_form_subtitle
        ) VALUES (
          FALSE,
          'Site Temporarily Unavailable',
          'We are currently performing maintenance or updates.',
          'Our team is working to bring the site back online as quickly as possible. Thank you for your patience.',
          TRUE,
          'Admin Access',
          'Enter your credentials to access the site'
        )
      `);
      console.log('✅ Inserted default site block configuration');
    } else {
      console.log('ℹ️  Site block configuration already exists, skipping default insert');
    }

    // Commit transaction
    await client.query('COMMIT');
    console.log('🎉 Site block migration completed successfully!');

  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run the migration
migrateSiteBlock()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });

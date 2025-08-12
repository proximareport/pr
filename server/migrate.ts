import { db } from './db';
import * as schema from '../shared/schema';
import { sql } from 'drizzle-orm';

async function main() {
  console.log('Creating database tables...');
  
  // Create session table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS sessions (
      sid VARCHAR(255) PRIMARY KEY,
      sess JSONB NOT NULL,
      expire TIMESTAMP(6) NOT NULL
    )
  `);
  
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "sessions" ("expire")
  `);
  
  // Create users table with role enum
  await db.execute(sql`
    DO $$ BEGIN
        CREATE TYPE role AS ENUM ('user', 'author', 'editor', 'admin');
    EXCEPTION
        WHEN duplicate_object THEN null;
    END $$;
  `);
  
  await db.execute(sql`
    DO $$ BEGIN
        CREATE TYPE membership_tier AS ENUM ('free', 'supporter', 'pro');
    EXCEPTION
        WHEN duplicate_object THEN null;
    END $$;
  `);
  
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(255) NOT NULL UNIQUE,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      role role NOT NULL DEFAULT 'user',
      membership_tier membership_tier NOT NULL DEFAULT 'free',
      profile_picture VARCHAR(255),
      bio TEXT,
      stripe_customer_id VARCHAR(255),
      stripe_subscription_id VARCHAR(255),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Create articles table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS articles (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      slug VARCHAR(255) NOT NULL UNIQUE,
      summary TEXT,
      content TEXT,
      status VARCHAR(50) DEFAULT 'draft',
      featured_image VARCHAR(255),
      category VARCHAR(100),
      is_featured BOOLEAN DEFAULT FALSE,
      view_count INTEGER DEFAULT 0,
      share_count INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      published_at TIMESTAMP WITH TIME ZONE
    )
  `);
  
  // Create article_authors junction table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS article_authors (
      article_id INTEGER REFERENCES articles(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      role VARCHAR(50) DEFAULT 'author',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (article_id, user_id)
    )
  `);
  
  // Create categories table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      slug VARCHAR(100) NOT NULL UNIQUE,
      description TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Create comments table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS comments (
      id SERIAL PRIMARY KEY,
      content TEXT NOT NULL,
      article_id INTEGER REFERENCES articles(id) ON DELETE CASCADE,
      ghost_post_id TEXT,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
      upvotes INTEGER DEFAULT 0,
      downvotes INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Add ghost_post_id column to existing comments table if it doesn't exist
  await db.execute(sql`
    DO $$ 
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'comments' AND column_name = 'ghost_post_id'
      ) THEN
        ALTER TABLE comments ADD COLUMN ghost_post_id TEXT;
      END IF;
    END $$;
  `);
  
  // Make article_id nullable for Ghost post support
  await db.execute(sql`
    DO $$ 
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'comments' AND column_name = 'article_id' 
        AND is_nullable = 'NO'
      ) THEN
        ALTER TABLE comments ALTER COLUMN article_id DROP NOT NULL;
      END IF;
    END $$;
  `);
  
  // Create index for ghost_post_id if it doesn't exist
  await db.execute(sql`
    DO $$ 
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_comments_ghost_post_id'
      ) THEN
        CREATE INDEX idx_comments_ghost_post_id ON comments(ghost_post_id);
      END IF;
    END $$;
  `);
  
  // Create votes table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS votes (
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      comment_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
      vote_type VARCHAR(10) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, comment_id)
    )
  `);

  // Create saved_articles table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS saved_articles (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      ghost_post_id TEXT,
      article_id INTEGER REFERENCES articles(id) ON DELETE CASCADE,
      saved_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create indexes for saved_articles table
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_saved_articles_user_id ON saved_articles(user_id)
  `);
  
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_saved_articles_ghost_post_id ON saved_articles(ghost_post_id)
  `);
  
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_saved_articles_article_id ON saved_articles(article_id)
  `);
  
  // Create astronomy_photos table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS astronomy_photos (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      image_url VARCHAR(255) NOT NULL,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      approved BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Create job_listings table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS job_listings (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      company VARCHAR(255) NOT NULL,
      location VARCHAR(255),
      description TEXT NOT NULL,
      requirements TEXT,
      salary_range VARCHAR(100),
      application_url VARCHAR(255),
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      approved BOOLEAN DEFAULT FALSE,
      expires_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Create advertisements table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS advertisements (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      company VARCHAR(255) NOT NULL,
      image_url VARCHAR(255) NOT NULL,
      destination_url VARCHAR(255) NOT NULL,
      placement VARCHAR(100) NOT NULL,
      start_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      end_date TIMESTAMP WITH TIME ZONE,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      approved BOOLEAN DEFAULT FALSE,
      impressions INTEGER DEFAULT 0,
      clicks INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Create emergency_banners table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS emergency_banners (
      id SERIAL PRIMARY KEY,
      message TEXT NOT NULL,
      type VARCHAR(50) NOT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      expires_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Create api_keys table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS api_keys (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      key VARCHAR(255) NOT NULL UNIQUE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      permissions TEXT[] NOT NULL DEFAULT '{}',
      last_used_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  console.log('Database tables created successfully!');
  process.exit(0);
}

main().catch((error) => {
  console.error('Error creating database tables:', error);
  process.exit(1);
});

async function runRoleMigration() {
  console.log('Running role-based features migration...');
  
  try {
    // Update specific users to admin role
    await db.execute(sql`UPDATE users SET role = 'admin' WHERE username IN ('sam', 'admin', 'tyler', 'jack')`);
    console.log('✅ Updated admin users');

    // Add new columns if they don't exist
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'inactive'`);
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE`);
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_cancel_at_period_end BOOLEAN DEFAULT false`);
    console.log('✅ Added subscription columns');

    // Set admin users to pro tier
    await db.execute(sql`UPDATE users SET membership_tier = 'pro' WHERE role = 'admin'`);
    console.log('✅ Updated admin membership tiers');

    console.log('🎉 Role migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

async function runCommentsMigration() {
  console.log('Running comments migration for Ghost post support...');
  
  try {
    // Add ghost_post_id column to existing comments table if it doesn't exist
    await db.execute(sql`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'comments' AND column_name = 'ghost_post_id'
        ) THEN
          ALTER TABLE comments ADD COLUMN ghost_post_id TEXT;
          RAISE NOTICE 'Added ghost_post_id column';
        ELSE
          RAISE NOTICE 'ghost_post_id column already exists';
        END IF;
      END $$;
    `);
    console.log('✅ Added ghost_post_id column');

    // Make article_id nullable for Ghost post support
    await db.execute(sql`
      DO $$ 
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'comments' AND column_name = 'article_id' 
          AND is_nullable = 'NO'
        ) THEN
          ALTER TABLE comments ALTER COLUMN article_id DROP NOT NULL;
          RAISE NOTICE 'Made article_id nullable';
        ELSE
          RAISE NOTICE 'article_id is already nullable';
        END IF;
      END $$;
    `);
    console.log('✅ Made article_id nullable');

    // Create index for ghost_post_id if it doesn't exist
    await db.execute(sql`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_indexes 
          WHERE indexname = 'idx_comments_ghost_post_id'
        ) THEN
          CREATE INDEX idx_comments_ghost_post_id ON comments(ghost_post_id);
          RAISE NOTICE 'Created ghost_post_id index';
        ELSE
          RAISE NOTICE 'ghost_post_id index already exists';
        END IF;
      END $$;
    `);
    console.log('✅ Created ghost_post_id index');

    console.log('🎉 Comments migration completed successfully!');
  } catch (error) {
    console.error('❌ Comments migration failed:', error);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  runCommentsMigration().then(() => runRoleMigration()).then(() => process.exit(0));
}
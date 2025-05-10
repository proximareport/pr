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
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
      upvotes INTEGER DEFAULT 0,
      downvotes INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
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
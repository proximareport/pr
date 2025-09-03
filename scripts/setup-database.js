#!/usr/bin/env node

/**
 * Database Setup Script
 * 
 * This script sets up the database with all required tables and subscription data.
 * Run this after setting up your database connection.
 */

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Setting up Proxima Report database...\n');

try {
  // Run the migration script
  console.log('📊 Running database migration...');
  execSync('npx tsx server/migrate.ts', { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
  
  console.log('\n✅ Database setup completed successfully!');
  console.log('\n📋 Next steps:');
  console.log('1. Set up your Stripe account and create products/prices');
  console.log('2. Add the Stripe price IDs to your environment variables');
  console.log('3. Test the subscription flow');
  
} catch (error) {
  console.error('\n❌ Database setup failed:', error.message);
  console.log('\n🔧 Troubleshooting:');
  console.log('1. Make sure your DATABASE_URL is correctly set');
  console.log('2. Ensure your database is running and accessible');
  console.log('3. Check that you have the required permissions');
  process.exit(1);
}

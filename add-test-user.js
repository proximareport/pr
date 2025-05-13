import bcrypt from 'bcryptjs';
import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

async function addTestUser() {
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash('testpass123', 10);
    
    // Add the user directly to the database
    await db.execute(
      'INSERT INTO users (username, email, password, role, created_at, updated_at) VALUES (, , , , , ) ON CONFLICT (username) DO UPDATE SET password = ',
      ['testuser', 'test@example.com', hashedPassword, 'admin', new Date(), new Date()]
    );
    
    console.log('Test user created successfully');
    console.log('Username: testuser');
    console.log('Password: testpass123');
    console.log('Role: admin');
  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    await pool.end();
  }
}

addTestUser();

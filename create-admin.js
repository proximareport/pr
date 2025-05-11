const { storage } = require('./server/storage');
const bcrypt = require('bcryptjs');

async function createAdminUser() {
  try {
    // Check if admin exists
    const adminUser = await storage.getUserByEmail('admin@proxima.report');
    
    if (adminUser) {
      console.log('Admin user already exists:', adminUser.username);
      return;
    }
    
    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const newAdmin = await storage.createUser({
      username: 'admin',
      email: 'admin@proxima.report',
      password: hashedPassword,
      role: 'admin',
      bio: 'Administrator',
      membershipTier: 'pro',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log('Created new admin user:', newAdmin.username);
  } catch (error) {
    console.error('Error creating admin:', error);
  }
}

createAdminUser();

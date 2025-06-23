const { storage } = require('./server/storage');
const bcrypt = require('bcryptjs');

async function createSecureAdmin() {
  try {
    console.log('🔧 Starting admin creation process...');
    
    // Get admin credentials from environment variables
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    
    console.log('📧 Admin email:', adminEmail);
    console.log('👤 Admin username:', adminUsername);
    
    if (!adminEmail || !adminPassword) {
      console.error('ERROR: ADMIN_EMAIL and ADMIN_PASSWORD environment variables must be set');
      console.log('Usage: ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=secure_password node create-secure-admin.js');
      process.exit(1);
    }
    
    // Validate password strength
    if (adminPassword.length < 8) {
      console.error('ERROR: Admin password must be at least 8 characters long');
      process.exit(1);
    }
    
    // Check if admin exists
    const existingAdmin = await storage.getUserByEmail(adminEmail.toLowerCase());
    
    if (existingAdmin) {
      console.log(`Admin user with email ${adminEmail} already exists`);
      console.log('Username:', existingAdmin.username);
      console.log('Role:', existingAdmin.role);
      return;
    }
    
    // Check if username exists
    const existingUsername = await storage.getUserByUsername(adminUsername.toLowerCase());
    if (existingUsername) {
      console.error(`ERROR: Username ${adminUsername} already exists`);
      process.exit(1);
    }
    
    // Hash password securely
    const hashedPassword = await bcrypt.hash(adminPassword, 12); // Higher salt rounds for admin
    
    // Create admin user
    const newAdmin = await storage.createUser({
      username: adminUsername.toLowerCase(),
      email: adminEmail.toLowerCase(),
      password: hashedPassword,
      role: 'admin',
      bio: 'System Administrator',
      membershipTier: 'pro',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log('✅ Admin user created successfully!');
    console.log('Username:', newAdmin.username);
    console.log('Email:', newAdmin.email);
    console.log('Role:', newAdmin.role);
    console.log('');
    console.log('🔐 IMPORTANT: Store these credentials securely and delete this script output from your terminal history');
    
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

createSecureAdmin(); 
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Payment = require('../models/Payment');

// Load .env from backend directory
dotenv.config({ path: path.join(__dirname, '../../.env') });

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('❌ MongoDB Connection Failed:', error.message);
    process.exit(1);
  }
};

const seedAdminOnly = async () => {
  try {
    console.log('\n🌱 Starting Database Seeding...\n');
    
    await connectDB();
    
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Payment.deleteMany({});
    console.log('✅ Database cleared\n');
    
    // Get admin credentials from .env
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin@123';
    const adminPhone = process.env.ADMIN_PHONE || '1234567890';

    console.log('Creating admin user from .env credentials...');
    
    const adminUser = await User.create({
      name: 'System Administrator',
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
      phone: adminPhone,
      status: 'active',
      isEmailVerified: true,
      isApproved: true,
      approvedAt: new Date(),
      registrationType: 'admin-created',
      isAdminFixed: true
    });

    console.log('\n✅ Seeding completed successfully!\n');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📝 ADMIN ACCOUNT (From .env)\n');
    console.log('👨‍💼 Admin:');
    console.log(`    Name:     System Administrator`);
    console.log(`    Email:    ${adminEmail}`);
    console.log(`    Password: ${adminPassword}\n`);
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📋 System Setup Complete!\n');
    console.log('✅ Teachers and Students MUST register via UI');
    console.log('✅ After registration, they will be in PENDING status');
    console.log('✅ Admin must APPROVE them before they can login');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('🔗 Quick Links:\n');
    console.log('Admin Login:   👉 http://localhost:5174/admin-login');
    console.log('Teacher Register: 👉 http://localhost:5174/teacher-register');
    console.log('Student Register: 👉 http://localhost:5174/student-register\n');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedAdminOnly();

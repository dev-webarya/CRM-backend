const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Teacher = require('../models/Teacher');
const User = require('../models/User');

dotenv.config();

async function run() {
  try {
    await connectDB();

    const teachers = await Teacher.find({});
    let created = 0;
    let updated = 0;

    for (const t of teachers) {
      const email = t.email?.toLowerCase().trim();
      if (!email) continue;

      let user = await User.findOne({ email });

      if (!user) {
        // Create linked user with default password = teacher mobile
        user = await User.create({
          name: t.name,
          email,
          password: String(t.mobile || '').replace(/[^\d]/g, ''),
          role: 'teacher',
          phone: String(t.mobile || ''),
          status: 'active',
          isApproved: true,
        });
        created++;
        console.log(`+ Created user for teacher ${t.name} (${email})`);
      } else {
        // Ensure role and approval are correct
        let needsSave = false;
        if (user.role !== 'teacher') {
          user.role = 'teacher';
          needsSave = true;
        }
        if (!user.isApproved) {
          user.isApproved = true;
          needsSave = true;
        }
        if (!user.phone && t.mobile) {
          user.phone = String(t.mobile);
          needsSave = true;
        }
        if (needsSave) {
          await user.save();
          updated++;
          console.log(`~ Updated user flags for ${email}`);
        }
      }
    }

    console.log(`\nSync complete. Created: ${created}, Updated: ${updated}`);
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('Sync failed:', err);
    process.exit(1);
  }
}

run();


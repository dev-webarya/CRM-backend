const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'teacher', 'admin'], default: 'student' },
  profileImage: { type: String },
  phone: { type: String },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  lastLogin: { type: Date },
  isEmailVerified: { type: Boolean, default: false },
  isAdminFixed: { type: Boolean, default: false },
  isApproved: { type: Boolean, default: false },
  approvedAt: { type: Date },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  registrationType: { type: String, enum: ['self-registered', 'admin-created'], default: 'self-registered' },
  
  // Teacher-specific fields
  hourlyRate: { type: Number, default: 0 }, // Currency per hour
  totalHoursTaught: { type: Number, default: 0 },
  totalEarnings: { type: Number, default: 0 },
  bankAccount: String, // For salary transfers
  bankName: String,
  
  // Student-specific fields
  monthlyFeeAmount: { type: Number, default: 0 }, // Fixed monthly fee
  totalHoursStudied: { type: Number, default: 0 },
  totalFeePaid: { type: Number, default: 0 },
  parentEmailId: { type: String },
  fatherName: { type: String },
  motherName: { type: String },
  parentContact: { type: String },
  grade: { type: String },
  schoolName: { type: String },
  address: { type: String },
  courseName: { type: String },
  preferredTeacherId: { type: String }, // For student self-registration
  
  verificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Hash password before saving
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error) {
    throw error;
  }
});

// Method to compare passwords
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Remove password from response
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.resetPasswordToken;
  delete user.resetPasswordExpire;
  delete user.verificationToken;
  return user;
};

module.exports = mongoose.model('User', userSchema);

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const Course = require('../models/Course');
const AppError = require('../utils/AppError');
const { generateTeacherId, generateStudentId, generateRegistrationNumber, generateCourseId } = require('../utils/crmUtils');
const { TEACHER_STATUS, STUDENT_STATUS } = require('../constants/enums');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your_jwt_secret', {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @desc    Register a new user (Teachers and Students only)
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { 
      name, email, password, confirmPassword, role, phone, 
      hourlyRate, monthlyFeeAmount,
      parentEmailId, fatherName, motherName, parentContact,
      grade, schoolName, address, courseName, preferredTeacherId
    } = req.body;

    // Validation
    if (!name || !email || !password || !role) {
      throw new AppError('Please provide name, email, password, and role', 400);
    }

    // Only allow teacher and student roles for registration
    if (!['teacher', 'student'].includes(role)) {
      throw new AppError('Only teachers and students can self-register. Contact admin for admin account.', 400);
    }

    if (password !== confirmPassword) {
      throw new AppError('Passwords do not match', 400);
    }

    if (password.length < 6) {
      throw new AppError('Password must be at least 6 characters', 400);
    }

    // Teacher-specific validation
    if (role === 'teacher' && (!hourlyRate || hourlyRate <= 0)) {
      throw new AppError('Please provide a valid hourly rate for teachers', 400);
    }

    // Student-specific validation
    if (role === 'student') {
      if (!fatherName || !motherName || !parentContact || !grade) {
        throw new AppError('Please provide all mandatory student details (Parent names, contact, and grade)', 400);
      }
    }

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      throw new AppError('Email already registered', 400);
    }

    // Create user with pending approval status
    user = await User.create({
      name,
      email,
      password,
      role,
      phone: phone || '',
      hourlyRate: role === 'teacher' ? hourlyRate : 0,
      monthlyFeeAmount: role === 'student' ? (monthlyFeeAmount || 0) : 0,
      parentEmailId: role === 'student' ? parentEmailId : undefined,
      fatherName: role === 'student' ? fatherName : undefined,
      motherName: role === 'student' ? motherName : undefined,
      parentContact: role === 'student' ? parentContact : undefined,
      grade: role === 'student' ? grade : undefined,
      schoolName: role === 'student' ? schoolName : undefined,
      address: role === 'student' ? address : undefined,
      courseName: role === 'student' ? courseName : undefined,
      preferredTeacherId: role === 'student' ? preferredTeacherId : undefined,
      isApproved: false, // Requires admin approval
      registrationType: 'self-registered'
    });

    res.status(201).json({
      success: true,
      user: user.toJSON(),
      message: `Registration successful! Your account is pending admin approval. You will receive an email once approved.`
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user with email or phone
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, phone, password } = req.body;

    // Validation - must provide either email or phone, and password
    if ((!email && !phone) || !password) {
      throw new AppError('Please provide email or phone number, and password', 400);
    }

    // Check if user exists (by email or phone)
    let user = null;
    if (email) {
      user = await User.findOne({ email }).select('+password');
    } else if (phone) {
      user = await User.findOne({ phone }).select('+password');
    }

    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    // Check if user is approved (not required for admin)
    if (user.role !== 'admin' && !user.isApproved) {
      throw new AppError('Your account is pending admin approval. Please wait for approval email.', 403);
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      throw new AppError('Invalid credentials', 401);
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: user.toJSON(),
      message: 'Login successful'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({
      success: true,
      user: user.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/update-profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, profileImage } = req.body;

    // Check if user is trying to modify a fixed admin account
    const user = await User.findById(req.user.id);
    if (user.isAdminFixed) {
      throw new AppError('Admin profile cannot be modified. Contact system administrator.', 403);
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { name, phone, profileImage, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      user: updatedUser.toJSON(),
      message: 'Profile updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change password
// @route   POST /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      throw new AppError('Please provide all required fields', 400);
    }

    if (newPassword !== confirmPassword) {
      throw new AppError('Passwords do not match', 400);
    }

    if (newPassword.length < 6) {
      throw new AppError('Password must be at least 6 characters', 400);
    }

    const user = await User.findById(req.user.id).select('+password');

    // Check if user is trying to change password of a fixed admin account
    if (user.isAdminFixed) {
      throw new AppError('Admin password cannot be changed. Contact system administrator.', 403);
    }

    // Check current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      throw new AppError('Current password is incorrect', 401);
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot Password - Send OTP
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      throw new AppError('Please provide email address', 400);
    }

    const user = await User.findOne({ email });
    if (!user) {
      throw new AppError('User not found with this email', 404);
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    user.resetPasswordToken = require('crypto')
      .createHash('sha256')
      .update(otp)
      .digest('hex');
    user.resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await user.save({ validateBeforeSave: false });

    // In real app, send OTP via email
    console.log(`\n📧 Password Reset OTP for ${email}:\n【 ${otp} 】 (valid for 10 minutes)\n`);

    res.status(200).json({
      success: true,
      message: 'OTP sent to your email',
      otp: otp // For testing only - remove in production
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset Password with OTP
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword, confirmPassword } = req.body;

    if (!email || !otp || !newPassword || !confirmPassword) {
      throw new AppError('Please provide all required fields', 400);
    }

    if (newPassword !== confirmPassword) {
      throw new AppError('Passwords do not match', 400);
    }

    if (newPassword.length < 6) {
      throw new AppError('Password must be at least 6 characters', 400);
    }

    // Hash OTP and find user
    const hashedOtp = require('crypto')
      .createHash('sha256')
      .update(otp)
      .digest('hex');

    const user = await User.findOne({
      email,
      resetPasswordToken: hashedOtp,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      throw new AppError('Invalid or expired OTP', 400);
    }

    // Update password
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    // Generate new token for auto-login
    const loginToken = generateToken(user._id);

    res.status(200).json({
      success: true,
      token: loginToken,
      user: user.toJSON(),
      message: 'Password set successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Set/Reset User Credentials (Password and Mobile)
// @route   POST /api/auth/admin/set-credentials
// @access  Private (Admin only)
exports.adminSetCredentials = async (req, res, next) => {
  try {
    const { userId, password, phone } = req.body;

    // Validation
    if (!userId) {
      throw new AppError('Please provide userId', 400);
    }

    if (!password || password.length < 6) {
      throw new AppError('Password must be at least 6 characters', 400);
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Prevent admin from resetting fixed admin password
    if (user.isAdminFixed) {
      throw new AppError('Cannot modify fixed admin account', 403);
    }

    // Update credentials
    user.password = password;
    if (phone) {
      user.phone = phone;
    }
    user.updatedAt = new Date();

    await user.save();

    res.status(200).json({
      success: true,
      user: user.toJSON(),
      message: `Credentials set successfully for ${user.name}`
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all pending user approvals (Admin only)
// @route   GET /api/auth/pending-approvals
// @access  Private/Admin
exports.getPendingApprovals = async (req, res, next) => {
  try {
    // Check if user is admin
    const adminUser = await User.findById(req.user?.id);
    if (!adminUser || adminUser.role !== 'admin') {
      throw new AppError('Only admin can view pending approvals', 403);
    }

    // Get all pending users (not approved)
    const pendingUsers = await User.find({
      isApproved: false,
      role: { $in: ['teacher', 'student'] }
    }).select('-password -resetPasswordToken -resetPasswordExpire');

    res.status(200).json({
      success: true,
      count: pendingUsers.length,
      data: pendingUsers
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve a user (Admin only)
// @route   POST /api/auth/approve-user/:userId
// @access  Private/Admin
exports.approveUser = async (req, res, next) => {
  try {
    // Check if user is admin
    const adminUser = await User.findById(req.user?.id);
    if (!adminUser || adminUser.role !== 'admin') {
      throw new AppError('Only admin can approve users', 403);
    }

    const { userId } = req.params;

    // Find user to approve
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Check if user is already approved
    if (user.isApproved) {
      throw new AppError('User is already approved', 400);
    }

    // Approve user
    user.isApproved = true;
    user.approvedAt = new Date();
    user.approvedBy = adminUser._id;
    user.status = 'active';

    await user.save();

    // If the approved user is a teacher or student, create a corresponding profile
    if (user.role === 'teacher') {
      await Teacher.create({
        teacherId: generateTeacherId(),
        userId: user._id,
        name: user.name,
        email: user.email,
        mobile: user.phone,
        subjects: [],
        compensationPerHour: user.hourlyRate || 500,
        status: TEACHER_STATUS.ACTIVE,
        dateOfJoining: new Date(),
        createdBy: adminUser._id
      });
    } else if (user.role === 'student') {
      const student = await Student.create({
        studentId: generateStudentId(),
        userId: user._id,
        registrationNumber: generateRegistrationNumber(),
        name: user.name,
        email: user.email,
        mobile: user.phone,
        parentEmailId: user.parentEmailId,
        fatherName: user.fatherName,
        motherName: user.motherName,
        parentContact: user.parentContact,
        grade: user.grade,
        schoolName: user.schoolName,
        address: user.address,
        status: STUDENT_STATUS.ACTIVE,
        dateOfEnrollment: new Date(),
        createdBy: adminUser._id
      });

      // If a course was specified during registration, create it
      if (user.courseName && user.preferredTeacherId) {
        await Course.create({
          courseId: generateCourseId(),
          studentId: student.studentId,
          teacherId: user.preferredTeacherId,
          subject: user.courseName,
          billingRatePerHour: user.monthlyFeeAmount || 500, // Or some default
          cycleType: '12hrs', // Default cycle
          startDate: new Date(),
          createdBy: adminUser._id
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `User ${user.name} has been approved and their profile has been created.`
    });
  } catch (error) {
    next(error);
  }
};
const Teacher = require('../models/Teacher');
const User = require('../models/User');
const LogEntry = require('../models/LogEntry');
const AppError = require('../utils/AppError');
const asyncHandler = require('../middleware/asyncHandler');
const { generateTeacherId, generateLogId } = require('../utils/crmUtils');
const { TEACHER_STATUS, ACTION_TYPES, OBJECT_TYPES } = require('../constants/enums');
const crypto = require('crypto');

/**
 * @desc    Get all teachers with pagination and filtering
 * @route   GET /api/teachers
 * @query   page, limit, status, search
 */
exports.getAllTeachers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, search } = req.query;
  const skip = (page - 1) * limit;

  // Build filter
  const filter = {};
  if (status) filter.status = status;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { teacherId: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  const teachers = await Teacher.find(filter)
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });

  const total = await Teacher.countDocuments(filter);

  res.status(200).json({
    success: true,
    data: teachers,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    }
  });
});

/**
 * @desc    Get single teacher by ID
 * @route   GET /api/teachers/:id
 */
exports.getTeacherById = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findOne({ teacherId: req.params.id });

  if (!teacher) {
    throw AppError.notFound('Teacher not found');
  }

  res.status(200).json({
    success: true,
    data: teacher
  });
});

/**
 * @desc    Get logged-in teacher profile (Teacher collection)
 * @route   GET /api/teachers/me/profile
 * @access  Private (Teacher)
 */
exports.getMyTeacherProfile = asyncHandler(async (req, res) => {
  if (req.user.role !== 'teacher') {
    throw AppError.forbidden('Only teachers can access this route');
  }

  const teacherId = req.user.teacherId;
  const teacher = teacherId
    ? await Teacher.findOne({ teacherId })
    : await Teacher.findOne({ email: req.user.email });

  if (!teacher) {
    throw AppError.notFound('Teacher profile not found');
  }

  res.status(200).json({
    success: true,
    data: teacher
  });
});

/**
 * @desc    Create new teacher
 * @route   POST /api/teachers
 */
exports.createTeacher = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    mobile,
    subjects,
    compensationPerHour,
    compensationPerHourHigh,
    dateOfJoining,
    password,
    status = TEACHER_STATUS.ACTIVE,
    notes,
    createdBy
  } = req.body;

  // Validation
  if (!name || !email || !mobile || !compensationPerHour || !dateOfJoining) {
    throw AppError.badRequest('Missing required fields');
  }

  // Validate mobile number - must be exactly 10 digits
  if (!/^\d{10}$/.test(String(mobile).trim())) {
    throw AppError.badRequest('Mobile number must be exactly 10 digits');
  }

  // Check if email already exists in Teacher collection
  const existingTeacher = await Teacher.findOne({ email });
  if (existingTeacher) {
    throw AppError.conflict('Email already exists');
  }

  // Check if email already exists in User collection
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw AppError.conflict('Email already registered in system');
  }

  const teacherData = {
    teacherId: generateTeacherId(),
    name,
    email,
    mobile,
    subjects: subjects || [],
    compensationPerHour,
    compensationPerHourHigh,
    dateOfJoining,
    status,
    notes,
    createdBy
  };

  // Create teacher record
  const teacher = await Teacher.create(teacherData);

  // Create User account for login
  const userPassword = password || mobile; // Use mobile number as default password
  const user = await User.create({
    name,
    email,
    password: userPassword,
    role: 'teacher',
    phone: mobile,
    status: 'active',
    isApproved: true, // Admin-created teachers are auto-approved
    isEmailVerified: false,
    teacherId: teacher.teacherId
  });

  // Log the action
  await LogEntry.create({
    logId: generateLogId(),
    actorUserId: createdBy || 'system',
    actorRole: 'Admin',
    actionType: ACTION_TYPES.CREATE,
    objectType: OBJECT_TYPES.TEACHER,
    objectId: teacher.teacherId,
    after: teacherData,
    remarks: `Created new teacher: ${name}`
  });

  res.status(201).json({
    success: true,
    message: 'Teacher created successfully',
    data: teacher,
    credentials: {
      email: user.email,
      password: userPassword,
      note: 'Share these credentials with the teacher. They can change the password after first login.'
    }
  });
});

/**
 * @desc    Update teacher
 * @route   PUT /api/teachers/:id
 */
exports.updateTeacher = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findOne({ teacherId: req.params.id });

  if (!teacher) {
    throw AppError.notFound('Teacher not found');
  }

  const oldData = teacher.toObject();

  // Update fields
  const allowedFields = [
    'name', 'email', 'mobile', 'subjects',
    'compensationPerHour', 'compensationPerHourHigh',
    'status', 'notes', 'updatedBy'
  ];

  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      teacher[field] = req.body[field];
    }
  });

  const updatedTeacher = await teacher.save();

  // Log the action
  await LogEntry.create({
    logId: generateLogId(),
    actorUserId: req.body.updatedBy || 'system',
    actorRole: 'Admin',
    actionType: ACTION_TYPES.UPDATE,
    objectType: OBJECT_TYPES.TEACHER,
    objectId: teacher.teacherId,
    before: oldData,
    after: updatedTeacher.toObject(),
    remarks: `Updated teacher: ${teacher.name}`
  });

  res.status(200).json({
    success: true,
    message: 'Teacher updated successfully',
    data: updatedTeacher
  });
});

/**
 * @desc    Delete teacher
 * @route   DELETE /api/teachers/:id
 */
exports.deleteTeacher = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findOneAndDelete({ teacherId: req.params.id });

  if (!teacher) {
    throw AppError.notFound('Teacher not found');
  }

  // Log the action
  await LogEntry.create({
    logId: generateLogId(),
    actorUserId: req.body?.deletedBy || 'system',
    actorRole: 'Admin',
    actionType: ACTION_TYPES.DELETE,
    objectType: OBJECT_TYPES.TEACHER,
    objectId: teacher.teacherId,
    before: teacher.toObject(),
    remarks: `Deleted teacher: ${teacher.name}`
  });

  res.status(200).json({
    success: true,
    message: 'Teacher deleted successfully',
    data: teacher
  });
});

/**
 * @desc    Get teacher statistics
 * @route   GET /api/teachers/stats/overview
 */
exports.getTeacherStats = asyncHandler(async (req, res) => {
  const stats = await Teacher.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const totalTeachers = await Teacher.countDocuments();

  res.status(200).json({
    success: true,
    data: {
      totalTeachers,
      statusWise: stats
    }
  });
});

/**
 * @desc    Teacher self-registration
 * @route   POST /api/teachers/register
 * @access  Public
 */
exports.registerTeacher = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    mobile,
    subjects,
    compensationPerHour,
    compensationPerHourHigh,
    dateOfJoining,
    password,
    confirmPassword
  } = req.body;

  // Validation
  if (!name || !email || !mobile || !password || !confirmPassword) {
    throw AppError.badRequest('Missing required fields');
  }

  // Validate mobile number - must be exactly 10 digits
  if (!/^\d{10}$/.test(String(mobile).trim())) {
    throw AppError.badRequest('Mobile number must be exactly 10 digits');
  }

  if (password !== confirmPassword) {
    throw AppError.badRequest('Passwords do not match');
  }

  if (password.length < 6) {
    throw AppError.badRequest('Password must be at least 6 characters');
  }

  // Check if email already exists in Teacher collection
  const existingTeacher = await Teacher.findOne({ email });
  if (existingTeacher) {
    throw AppError.conflict('Email already exists');
  }

  // Check if email already exists in User collection
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw AppError.conflict('Email already registered in system');
  }

  const teacherId = generateTeacherId();

  const teacherData = {
    teacherId,
    name,
    email,
    mobile,
    subjects: subjects || [],
    compensationPerHour: compensationPerHour || 0,
    compensationPerHourHigh: compensationPerHourHigh,
    dateOfJoining: dateOfJoining || new Date(),
    status: TEACHER_STATUS.ACTIVE
  };

  // Create teacher record
  const teacher = await Teacher.create(teacherData);

  // Create User account for login
  const user = await User.create({
    name,
    email,
    password,
    role: 'teacher',
    phone: mobile,
    status: 'active',
    isEmailVerified: false,
    teacherId: teacher.teacherId
  });

  // Log the action
  await LogEntry.create({
    logId: generateLogId(),
    actorUserId: user._id,
    actorRole: 'Teacher',
    actionType: ACTION_TYPES.CREATE,
    objectType: OBJECT_TYPES.TEACHER,
    objectId: teacher.teacherId,
    after: teacherData,
    remarks: `Teacher self-registered: ${name}`
  });

  // Generate JWT token for auto-login
  const jwt = require('jsonwebtoken');
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'your_jwt_secret', {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });

  res.status(201).json({
    success: true,
    message: 'Teacher registered successfully',
    token,
    teacher,
    user: user.toJSON()
  });
});


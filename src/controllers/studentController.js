const Student = require('../models/Student');
const User = require('../models/User');
const LogEntry = require('../models/LogEntry');
const AppError = require('../utils/AppError');
const asyncHandler = require('../middleware/asyncHandler');
const { generateStudentId, generateRegistrationNumber, generateLogId } = require('../utils/crmUtils');
const { STUDENT_STATUS, ACTION_TYPES, OBJECT_TYPES } = require('../constants/enums');
const crypto = require('crypto');

/**
 * @desc    Get all students with pagination and filtering
 * @route   GET /api/students
 * @query   page, limit, status, grade, search
 */
exports.getAllStudents = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, grade, search } = req.query;
  const skip = (page - 1) * limit;

  // Build filter
  const filter = {};
  if (status) filter.status = status;
  if (grade) filter.grade = grade;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { studentId: { $regex: search, $options: 'i' } },
      { registrationNumber: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  const students = await Student.find(filter)
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });

  const total = await Student.countDocuments(filter);

  res.status(200).json({
    success: true,
    data: students,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    }
  });
});

/**
 * @desc    Get single student by ID
 * @route   GET /api/students/:id
 */
exports.getStudentById = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ studentId: req.params.id });

  if (!student) {
    throw AppError.notFound('Student not found');
  }

  res.status(200).json({
    success: true,
    data: student
  });
});

/**
 * @desc    Create new student (Admin adds student)
 * @route   POST /api/students
 */
exports.createStudent = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    dateOfEnrollment,
    mobile,
    parentEmailId,
    fatherName,
    motherName,
    parentContact,
    grade,
    courseName,
    address,
    password,
    status = STUDENT_STATUS.ACTIVE,
    notes,
    createdBy
  } = req.body;

  // Validation
  if (!name || !dateOfEnrollment || !mobile || !parentEmailId || !fatherName || !motherName || !parentContact || !grade) {
    throw AppError.badRequest('Missing required fields');
  }

  // Validate mobile number - must be exactly 10 digits
  if (!/^\d{10}$/.test(String(mobile).trim())) {
    throw AppError.badRequest('Mobile number must be exactly 10 digits');
  }

  // Validate parent contact - must be exactly 10 digits
  if (!/^\d{10}$/.test(String(parentContact).trim())) {
    throw AppError.badRequest('Parent contact must be exactly 10 digits');
  }

  // Check if email already exists in Student collection
  if (email) {
    const existingStudent = await Student.findOne({ email });
    if (existingStudent) {
      throw AppError.conflict('Email already exists');
    }
  }

  // Check if email already exists in User collection
  if (email) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw AppError.conflict('Email already registered in system');
    }
  }

  const studentId = generateStudentId();

  const studentData = {
    studentId,
    registrationNumber: generateRegistrationNumber(),
    name,
    email,
    dateOfEnrollment,
    mobile,
    parentEmailId,
    fatherName,
    motherName,
    parentContact,
    grade,
    courseName,
    address,
    status,
    notes,
    createdBy
  };

  // Create student record
  const student = await Student.create(studentData);

  // Create User account for login if email is provided
  let userPassword = null;
  let user = null;

  if (email) {
    userPassword = password || mobile; // Use mobile number as default password
    user = await User.create({
      name,
      email,
      password: userPassword,
      role: 'student',
      phone: mobile,
      status: 'active',
      isEmailVerified: false,
      studentId: student.studentId
    });
  }

  // Log the action
  await LogEntry.create({
    logId: generateLogId(),
    actorUserId: createdBy || 'system',
    actorRole: 'Admin',
    actionType: ACTION_TYPES.CREATE,
    objectType: OBJECT_TYPES.STUDENT,
    objectId: student.studentId,
    after: studentData,
    remarks: `Created new student: ${name}`
  });

  res.status(201).json({
    success: true,
    message: 'Student created successfully',
    data: student,
    ...(user && {
      credentials: {
        email: user.email,
        password: userPassword,
        note: 'Share these credentials with the student. They can change the password after first login.'
      }
    })
  });
});

/**
 * @desc    Update student
 * @route   PUT /api/students/:id
 */
exports.updateStudent = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ studentId: req.params.id });

  if (!student) {
    throw AppError.notFound('Student not found');
  }

  const oldData = student.toObject();

  // Update fields
  const allowedFields = [
    'name', 'email', 'mobile', 'parentEmailId',
    'fatherName', 'motherName', 'parentContact', 'grade',
    'courseName', 'address', 'status', 'notes', 'updatedBy'
  ];

  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      student[field] = req.body[field];
    }
  });

  const updatedStudent = await student.save();

  // Log the action
  await LogEntry.create({
    logId: generateLogId(),
    actorUserId: req.body.updatedBy || 'system',
    actorRole: 'Admin',
    actionType: ACTION_TYPES.UPDATE,
    objectType: OBJECT_TYPES.STUDENT,
    objectId: student.studentId,
    before: oldData,
    after: updatedStudent.toObject(),
    remarks: `Updated student: ${student.name}`
  });

  res.status(200).json({
    success: true,
    message: 'Student updated successfully',
    data: updatedStudent
  });
});

/**
 * @desc    Delete student
 * @route   DELETE /api/students/:id
 */
exports.deleteStudent = asyncHandler(async (req, res) => {
  const student = await Student.findOneAndDelete({ studentId: req.params.id });

  if (!student) {
    throw AppError.notFound('Student not found');
  }

  // Log the action
  await LogEntry.create({
    logId: generateLogId(),
    actorUserId: req.body?.deletedBy || 'system',
    actorRole: 'Admin',
    actionType: ACTION_TYPES.DELETE,
    objectType: OBJECT_TYPES.STUDENT,
    objectId: student.studentId,
    before: student.toObject(),
    remarks: `Deleted student: ${student.name}`
  });

  res.status(200).json({
    success: true,
    message: 'Student deleted successfully',
    data: student
  });
});

/**
 * @desc    Bulk update student status
 * @route   PATCH /api/students/bulk/status
 */
exports.bulkUpdateStatus = asyncHandler(async (req, res) => {
  const { studentIds, status } = req.body;

  if (!studentIds || !Array.isArray(studentIds) || !status) {
    throw AppError.badRequest('Invalid request data');
  }

  const result = await Student.updateMany(
    { studentId: { $in: studentIds } },
    { status, updatedBy: req.body.updatedBy || 'system' }
  );

  res.status(200).json({
    success: true,
    message: 'Students updated successfully',
    data: {
      modifiedCount: result.modifiedCount,
      matchedCount: result.matchedCount
    }
  });
});

/**
 * @desc    Get student statistics
 * @route   GET /api/students/stats/overview
 */
exports.getStudentStats = asyncHandler(async (req, res) => {
  const stats = await Student.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const gradeStats = await Student.aggregate([
    {
      $group: {
        _id: '$grade',
        count: { $sum: 1 }
      }
    }
  ]);

  const totalStudents = await Student.countDocuments();

  res.status(200).json({
    success: true,
    data: {
      totalStudents,
      statusWise: stats,
      gradeWise: gradeStats
    }
  });
});

/**
 * @desc    Student self-registration
 * @route   POST /api/students/register
 * @access  Public
 */
exports.registerStudent = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    mobile,
    parentEmailId,
    fatherName,
    motherName,
    parentContact,
    grade,
    courseName,
    address,
    password,
    confirmPassword
  } = req.body;

  // Validation
  if (!name || !email || !mobile || !parentEmailId || !fatherName || !motherName || !parentContact || !grade || !password || !confirmPassword) {
    throw AppError.badRequest('Missing required fields');
  }

  // Validate mobile number - must be exactly 10 digits
  if (!/^\d{10}$/.test(String(mobile).trim())) {
    throw AppError.badRequest('Mobile number must be exactly 10 digits');
  }

  // Validate parent contact - must be exactly 10 digits
  if (!/^\d{10}$/.test(String(parentContact).trim())) {
    throw AppError.badRequest('Parent contact must be exactly 10 digits');
  }

  if (password !== confirmPassword) {
    throw AppError.badRequest('Passwords do not match');
  }

  if (password.length < 6) {
    throw AppError.badRequest('Password must be at least 6 characters');
  }

  // Check if email already exists in Student collection
  const existingStudent = await Student.findOne({ email });
  if (existingStudent) {
    throw AppError.conflict('Email already exists');
  }

  // Check if email already exists in User collection
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw AppError.conflict('Email already registered in system');
  }

  const studentId = generateStudentId();

  const studentData = {
    studentId,
    registrationNumber: generateRegistrationNumber(),
    name,
    email,
    dateOfEnrollment: new Date(),
    mobile,
    parentEmailId,
    fatherName,
    motherName,
    parentContact,
    grade,
    courseName,
    address,
    status: STUDENT_STATUS.ACTIVE
  };

  // Create student record
  const student = await Student.create(studentData);

  // Create User account for login
  const user = await User.create({
    name,
    email,
    password,
    role: 'student',
    phone: mobile,
    status: 'active',
    isApproved: true, // Admin-created students are auto-approved
    isEmailVerified: false,
    studentId: student.studentId
  });

  // Log the action
  await LogEntry.create({
    logId: generateLogId(),
    actorUserId: user._id,
    actorRole: 'Student',
    actionType: ACTION_TYPES.CREATE,
    objectType: OBJECT_TYPES.STUDENT,
    objectId: student.studentId,
    after: studentData,
    remarks: `Student self-registered: ${name}`
  });

  // Generate JWT token for auto-login
  const jwt = require('jsonwebtoken');
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'your_jwt_secret', {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });

  res.status(201).json({
    success: true,
    message: 'Student registered successfully',
    token,
    student,
    user: user.toJSON()
  });
});

/**
 * @desc    Get all students for the logged-in teacher
 * @route   GET /api/students/teacher
 * @access  Private (Teacher)
 */
exports.getStudentsForTeacher = asyncHandler(async (req, res) => {
  // Get teacher by email from authenticated user
  const Teacher = require('../models/Teacher');
  const Course = require('../models/Course');
  
  const teacher = await Teacher.findOne({ email: req.user.email });

  if (!teacher) {
    throw AppError.notFound('Teacher profile not found');
  }

  // Get all courses for this teacher
  const courses = await Course.find({ teacherId: teacher.teacherId });
  const studentIds = courses.map(course => course.studentId);

  // Get all unique students for those courses
  const students = await Student.find({ studentId: { $in: studentIds } })
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: students
  });
});

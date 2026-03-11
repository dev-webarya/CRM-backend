const Course = require('../models/Course');
const LogEntry = require('../models/LogEntry');
const AppError = require('../utils/AppError');
const asyncHandler = require('../middleware/asyncHandler');
const { generateCourseId, generateLogId } = require('../utils/crmUtils');
const { COURSE_STATUS, FEE_STATUS, ACTION_TYPES, OBJECT_TYPES } = require('../constants/enums');

/**
 * @desc    Get all courses with pagination and filtering
 * @route   GET /api/courses
 * @query   page, limit, status, studentId, teacherId, search
 */
exports.getAllCourses = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, studentId, teacherId, search } = req.query;
  const skip = (page - 1) * limit;

  // Build filter
  const filter = {};
  if (status) filter.status = status;
  if (studentId) filter.studentId = studentId;
  if (teacherId) filter.teacherId = teacherId;
  if (search) {
    filter.$or = [
      { courseId: { $regex: search, $options: 'i' } },
      { subject: { $regex: search, $options: 'i' } }
    ];
  }

  const courses = await Course.find(filter)
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });

  const total = await Course.countDocuments(filter);

  res.status(200).json({
    success: true,
    data: courses,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    }
  });
});

/**
 * @desc    Get single course by ID
 * @route   GET /api/courses/:id
 */
exports.getCourseById = asyncHandler(async (req, res) => {
  const course = await Course.findOne({ courseId: req.params.id });

  if (!course) {
    throw AppError.notFound('Course not found');
  }

  res.status(200).json({
    success: true,
    data: course
  });
});

/**
 * @desc    Create new course
 * @route   POST /api/courses
 */
exports.createCourse = asyncHandler(async (req, res) => {
  const {
    studentId,
    subject,
    teacherId,
    timeSlot1,
    timeSlot2,
    timeSlot3,
    cycleType,
    cycleTargetHours,
    billingRatePerHour,
    billingRatePerHourHigh,
    startDate,
    endDate,
    status = COURSE_STATUS.ACTIVE,
    feeStatus = FEE_STATUS.NOT_DUE,
    completedHours = 0,
    lastDueDate,
    createdBy
  } = req.body;

  // Validation
  if (!studentId || !subject || !teacherId || !cycleType || !billingRatePerHour || !startDate) {
    throw AppError.badRequest('Missing required fields');
  }

  const courseData = {
    courseId: generateCourseId(),
    studentId,
    subject,
    teacherId,
    timeSlot1,
    timeSlot2,
    timeSlot3,
    cycleType,
    cycleTargetHours,
    billingRatePerHour,
    billingRatePerHourHigh,
    startDate,
    endDate,
    status,
    feeStatus,
    completedHours,
    lastDueDate,
    createdBy
  };

  const course = await Course.create(courseData);

  // Log the action
  await LogEntry.create({
    logId: generateLogId(),
    actorUserId: createdBy || 'system',
    actorRole: 'Admin',
    actionType: ACTION_TYPES.CREATE,
    objectType: OBJECT_TYPES.COURSE,
    objectId: course.courseId,
    after: courseData,
    remarks: `Created new course: ${subject}`
  });

  res.status(201).json({
    success: true,
    message: 'Course created successfully',
    data: course
  });
});

/**
 * @desc    Update course
 * @route   PUT /api/courses/:id
 */
exports.updateCourse = asyncHandler(async (req, res) => {
  const course = await Course.findOne({ courseId: req.params.id });

  if (!course) {
    throw AppError.notFound('Course not found');
  }

  const oldData = course.toObject();

  // Update fields
  const allowedFields = [
    'subject', 'teacherId', 'timeSlot1', 'timeSlot2', 'timeSlot3',
    'cycleType', 'cycleTargetHours', 'billingRatePerHour', 'billingRatePerHourHigh',
    'endDate', 'status', 'feeStatus', 'completedHours', 'lastDueDate', 'updatedBy'
  ];

  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      course[field] = req.body[field];
    }
  });

  const updatedCourse = await course.save();

  // Log the action
  await LogEntry.create({
    logId: generateLogId(),
    actorUserId: req.body.updatedBy || 'system',
    actorRole: 'Admin',
    actionType: ACTION_TYPES.UPDATE,
    objectType: OBJECT_TYPES.COURSE,
    objectId: course.courseId,
    before: oldData,
    after: updatedCourse.toObject(),
    remarks: `Updated course: ${course.subject}`
  });

  res.status(200).json({
    success: true,
    message: 'Course updated successfully',
    data: updatedCourse
  });
});

/**
 * @desc    Delete course
 * @route   DELETE /api/courses/:id
 */
exports.deleteCourse = asyncHandler(async (req, res) => {
  const course = await Course.findOneAndDelete({ courseId: req.params.id });

  if (!course) {
    throw AppError.notFound('Course not found');
  }

  // Log the action
  await LogEntry.create({
    logId: generateLogId(),
    actorUserId: req.body?.deletedBy || 'system',
    actorRole: 'Admin',
    actionType: ACTION_TYPES.DELETE,
    objectType: OBJECT_TYPES.COURSE,
    objectId: course.courseId,
    before: course.toObject(),
    remarks: `Deleted course: ${course.subject}`
  });

  res.status(200).json({
    success: true,
    message: 'Course deleted successfully',
    data: course
  });
});

/**
 * @desc    Update course fee status
 * @route   PATCH /api/courses/:id/fee-status
 */
exports.updateFeeStatus = asyncHandler(async (req, res) => {
  const { feeStatus } = req.body;

  if (!feeStatus) {
    throw AppError.badRequest('Fee status is required');
  }

  const course = await Course.findOneAndUpdate(
    { courseId: req.params.id },
    { feeStatus, updatedBy: req.body.updatedBy || 'system' },
    { new: true }
  );

  if (!course) {
    throw AppError.notFound('Course not found');
  }

  res.status(200).json({
    success: true,
    message: 'Fee status updated successfully',
    data: course
  });
});

/**
 * @desc    Get course statistics
 * @route   GET /api/courses/stats/overview
 */
exports.getCourseStats = asyncHandler(async (req, res) => {
  const stats = await Course.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const feeStats = await Course.aggregate([
    {
      $group: {
        _id: '$feeStatus',
        count: { $sum: 1 }
      }
    }
  ]);

  const totalCourses = await Course.countDocuments();

  res.status(200).json({
    success: true,
    data: {
      totalCourses,
      statusWise: stats,
      feeStatusWise: feeStats
    }
  });
});

/**
 * @desc    Get all courses for the logged-in teacher
 * @route   GET /api/courses/teacher
 * @access  Private (Teacher)
 */
exports.getCoursesForTeacher = asyncHandler(async (req, res) => {
  // Get teacher by email from authenticated user
  const Teacher = require('../models/Teacher');
  const teacher = await Teacher.findOne({ email: req.user.email });

  if (!teacher) {
    throw AppError.notFound('Teacher profile not found');
  }

  const courses = await Course.find({ teacherId: teacher.teacherId })
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: courses
  });
});

/**
 * @desc    Get all courses for the logged-in student
 * @route   GET /api/courses/student
 * @access  Private (Student)
 */
exports.getCoursesForStudent = asyncHandler(async (req, res) => {
  if (req.user.role !== 'student') {
    throw AppError.forbidden('Only students can access this route');
  }

  const studentId = req.user.studentId;
  if (!studentId) {
    throw AppError.badRequest('Student profile not linked to this account');
  }

  const courses = await Course.find({ studentId }).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: courses
  });
});

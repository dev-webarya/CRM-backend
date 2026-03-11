const Class = require('../models/Class');
const LogEntry = require('../models/LogEntry');
const AppError = require('../utils/AppError');
const asyncHandler = require('../middleware/asyncHandler');
const { generateClassId, generateLogId, detectDuplicateClass } = require('../utils/crmUtils');
const { CLASS_STATUS, ACTION_TYPES, OBJECT_TYPES } = require('../constants/enums');

/**
 * @desc    Get all classes with pagination and filtering
 * @route   GET /api/classes
 * @query   page, limit, status, studentId, teacherId, search
 */
exports.getAllClasses = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, studentId, teacherId, fromDate, toDate } = req.query;
  const skip = (page - 1) * limit;

  // Build filter
  const filter = {};
  if (status) filter.status = status;
  if (studentId) filter.studentId = studentId;
  if (teacherId) filter.teacherId = teacherId;

  // Date range filter
  if (fromDate || toDate) {
    filter.startDateTime = {};
    if (fromDate) filter.startDateTime.$gte = new Date(fromDate);
    if (toDate) filter.startDateTime.$lte = new Date(toDate);
  }

  const classes = await Class.find(filter)
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ startDateTime: -1 });

  const total = await Class.countDocuments(filter);

  res.status(200).json({
    success: true,
    data: classes,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    }
  });
});

/**
 * @desc    Get single class by ID
 * @route   GET /api/classes/:id
 */
exports.getClassById = asyncHandler(async (req, res) => {
  const cls = await Class.findOne({ classId: req.params.id });

  if (!cls) {
    throw AppError.notFound('Class not found');
  }

  res.status(200).json({
    success: true,
    data: cls
  });
});

/**
 * @desc    Create new class
 * @route   POST /api/classes
 */
exports.createClass = asyncHandler(async (req, res) => {
  const {
    studentId,
    courseId,
    teacherId,
    startDateTime,
    durationMinutes,
    topicCovered,
    activity,
    comments,
    createdByRole,
    status = CLASS_STATUS.SCHEDULED,
    createdBy
  } = req.body;

  // Validation
  if (!studentId || !courseId || !teacherId || !startDateTime || !durationMinutes) {
    throw AppError.badRequest('Missing required fields');
  }

  if (!createdByRole || !['Admin', 'Teacher'].includes(createdByRole)) {
    throw AppError.badRequest('Invalid createdByRole');
  }

  // Check for duplicate/overlapping classes
  const classData = {
    studentId,
    teacherId,
    startDateTime,
    durationMinutes,
    classId: generateClassId()
  };

  const duplicateCheck = await detectDuplicateClass(Class, classData);
  if (duplicateCheck.isDuplicate) {
    throw AppError.conflict(duplicateCheck.message);
  }

  const newClass = await Class.create({
    classId: classData.classId,
    studentId,
    courseId,
    teacherId,
    startDateTime,
    durationMinutes,
    topicCovered,
    activity,
    comments,
    createdByRole,
    status,
    createdBy
  });

  // Log the action
  await LogEntry.create({
    logId: generateLogId(),
    actorUserId: createdBy || 'system',
    actorRole: createdByRole,
    actionType: ACTION_TYPES.CREATE,
    objectType: OBJECT_TYPES.CLASS,
    objectId: newClass.classId,
    after: newClass.toObject(),
    remarks: `Created new class for student ${studentId}`
  });

  res.status(201).json({
    success: true,
    message: 'Class created successfully',
    data: newClass
  });
});

/**
 * @desc    Update class
 * @route   PUT /api/classes/:id
 */
exports.updateClass = asyncHandler(async (req, res) => {
  const cls = await Class.findOne({ classId: req.params.id });

  if (!cls) {
    throw AppError.notFound('Class not found');
  }

  const oldData = cls.toObject();

  // Check for duplicate only if time/student/teacher changed
  if (req.body.startDateTime || req.body.durationMinutes || req.body.studentId || req.body.teacherId) {
    const updateData = {
      studentId: req.body.studentId || cls.studentId,
      teacherId: req.body.teacherId || cls.teacherId,
      startDateTime: req.body.startDateTime || cls.startDateTime,
      durationMinutes: req.body.durationMinutes || cls.durationMinutes,
      classId: cls.classId
    };

    const duplicateCheck = await detectDuplicateClass(Class, updateData);
    if (duplicateCheck.isDuplicate) {
      throw AppError.conflict(duplicateCheck.message);
    }
  }

  // Update fields
  const allowedFields = [
    'topicCovered', 'activity', 'comments', 'status', 'updatedBy'
  ];

  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      cls[field] = req.body[field];
    }
  });

  const updatedClass = await cls.save();

  // Log the action
  await LogEntry.create({
    logId: generateLogId(),
    actorUserId: req.body.updatedBy || 'system',
    actorRole: 'Admin',
    actionType: ACTION_TYPES.UPDATE,
    objectType: OBJECT_TYPES.CLASS,
    objectId: cls.classId,
    before: oldData,
    after: updatedClass.toObject(),
    remarks: `Updated class: ${cls.classId}`
  });

  res.status(200).json({
    success: true,
    message: 'Class updated successfully',
    data: updatedClass
  });
});

/**
 * @desc    Delete class
 * @route   DELETE /api/classes/:id
 */
exports.deleteClass = asyncHandler(async (req, res) => {
  const cls = await Class.findOneAndDelete({ classId: req.params.id });

  if (!cls) {
    throw AppError.notFound('Class not found');
  }

  // Log the action
  await LogEntry.create({
    logId: generateLogId(),
    actorUserId: req.body?.deletedBy || 'system',
    actorRole: 'Admin',
    actionType: ACTION_TYPES.DELETE,
    objectType: OBJECT_TYPES.CLASS,
    objectId: cls.classId,
    before: cls.toObject(),
    remarks: `Deleted class: ${cls.classId}`
  });

  res.status(200).json({
    success: true,
    message: 'Class deleted successfully',
    data: cls
  });
});

/**
 * @desc    Mark class as completed
 * @route   PATCH /api/classes/:id/complete
 */
exports.completeClass = asyncHandler(async (req, res) => {
  const cls = await Class.findOne({ classId: req.params.id });

  if (!cls) throw AppError.notFound('Class not found');

  // Authorization:
  // - Admin can complete any class
  // - Teacher can complete only their own class
  if (req.user.role === 'teacher') {
    const Teacher = require('../models/Teacher');
    const teacher = await Teacher.findOne({ email: req.user.email });
    if (!teacher) throw AppError.notFound('Teacher profile not found');
    if (teacher.teacherId !== cls.teacherId) {
      throw AppError.forbidden('You can only complete your own classes');
    }
  } else if (req.user.role !== 'admin') {
    throw AppError.forbidden('Not authorized to complete classes');
  }

  const oldStatus = cls.status;
  cls.status = CLASS_STATUS.COMPLETED;
  cls.updatedBy = req.user._id?.toString?.() || req.user.id || 'system';
  const updated = await cls.save();

  await LogEntry.create({
    logId: generateLogId(),
    actorUserId: cls.updatedBy,
    actorRole: req.user.role === 'teacher' ? 'Teacher' : 'Admin',
    actionType: ACTION_TYPES.UPDATE,
    objectType: OBJECT_TYPES.CLASS,
    objectId: updated.classId,
    before: { status: oldStatus },
    after: { status: updated.status },
    remarks: `Marked class as completed: ${updated.classId}`
  });

  res.status(200).json({
    success: true,
    message: 'Class marked as completed',
    data: updated
  });
});

/**
 * @desc    Cancel class
 * @route   PATCH /api/classes/:id/cancel
 */
exports.cancelClass = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const cls = await Class.findOne({ classId: req.params.id });

  if (!cls) throw AppError.notFound('Class not found');

  if (req.user.role === 'teacher') {
    const Teacher = require('../models/Teacher');
    const teacher = await Teacher.findOne({ email: req.user.email });
    if (!teacher) throw AppError.notFound('Teacher profile not found');
    if (teacher.teacherId !== cls.teacherId) {
      throw AppError.forbidden('You can only cancel your own classes');
    }
  } else if (req.user.role !== 'admin') {
    throw AppError.forbidden('Not authorized to cancel classes');
  }

  const oldStatus = cls.status;
  cls.status = CLASS_STATUS.CANCELLED;
  cls.comments = reason || '';
  cls.updatedBy = req.user._id?.toString?.() || req.user.id || 'system';
  const updated = await cls.save();

  await LogEntry.create({
    logId: generateLogId(),
    actorUserId: cls.updatedBy,
    actorRole: req.user.role === 'teacher' ? 'Teacher' : 'Admin',
    actionType: ACTION_TYPES.UPDATE,
    objectType: OBJECT_TYPES.CLASS,
    objectId: updated.classId,
    before: { status: oldStatus },
    after: { status: updated.status, comments: updated.comments },
    remarks: `Cancelled class: ${updated.classId}`
  });

  res.status(200).json({
    success: true,
    message: 'Class cancelled',
    data: updated
  });
});

/**
 * @desc    Get class statistics
 * @route   GET /api/classes/stats/overview
 */
exports.getClassStats = asyncHandler(async (req, res) => {
  const stats = await Class.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const totalClasses = await Class.countDocuments();

  res.status(200).json({
    success: true,
    data: {
      totalClasses,
      statusWise: stats
    }
  });
});

/**
 * @desc    Get all classes for the logged-in teacher
 * @route   GET /api/classes/teacher
 * @access  Private (Teacher)
 */
exports.getClassesForTeacher = asyncHandler(async (req, res) => {
  // Get teacher by email from authenticated user
  const Teacher = require('../models/Teacher');
  const teacher = await Teacher.findOne({ email: req.user.email });

  if (!teacher) {
    throw AppError.notFound('Teacher profile not found');
  }

  const classes = await Class.find({ teacherId: teacher.teacherId })
    .sort({ startDateTime: -1 });

  res.status(200).json({
    success: true,
    data: classes
  });
});

/**
 * @desc    Get all classes for the logged-in student
 * @route   GET /api/classes/student
 * @access  Private (Student)
 */
exports.getClassesForStudent = asyncHandler(async (req, res) => {
  if (req.user.role !== 'student') {
    throw AppError.forbidden('Only students can access this route');
  }

  const studentId = req.user.studentId;
  if (!studentId) {
    throw AppError.badRequest('Student profile not linked to this account');
  }

  const classes = await Class.find({ studentId }).sort({ startDateTime: -1 });

  res.status(200).json({
    success: true,
    data: classes
  });
});

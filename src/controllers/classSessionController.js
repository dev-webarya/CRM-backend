const ClassSession = require('../models/ClassSession');
const User = require('../models/User');
const AppError = require('../utils/AppError');

// @desc    Create a new class session
// @route   POST /api/classes
// @access  Private (Teachers)
exports.createClass = async (req, res, next) => {
  try {
    const { title, description, courseId, scheduledDate, startTime, endTime, maxStudents } = req.body;

    // Validation
    if (!title || !scheduledDate || !startTime || !endTime) {
      throw new AppError('Please provide title, date, start time, and end time', 400);
    }

    // Only teachers can create classes
    const user = await User.findById(req.user.id);
    if (user.role !== 'teacher') {
      throw new AppError('Only teachers can create classes', 403);
    }

    // Create class
    const classSession = await ClassSession.create({
      title,
      description: description || '',
      teacher: req.user.id,
      courseId: courseId || null,
      scheduledDate: new Date(scheduledDate),
      startTime,
      endTime,
      maxStudents: maxStudents || 30,
      teacherHourlyRate: user.hourlyRate || 0
    });

    await classSession.populate('teacher', 'name email phone');

    res.status(201).json({
      success: true,
      class: classSession,
      message: 'Class created successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all classes for logged-in user
// @route   GET /api/classes
// @access  Private
exports.getMyClasses = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    let classes;

    if (user.role === 'teacher') {
      // Get classes taught by this teacher
      classes = await ClassSession.find({ teacher: req.user.id })
        .populate('teacher', 'name email phone')
        .populate('enrolledStudents', 'name email phone')
        .sort({ scheduledDate: -1 });
    } else if (user.role === 'student') {
      // Get classes enrolled by this student
      classes = await ClassSession.find({ enrolledStudents: req.user.id })
        .populate('teacher', 'name email phone')
        .populate('enrolledStudents', 'name email phone')
        .sort({ scheduledDate: -1 });
    } else {
      // Admin can see all classes
      classes = await ClassSession.find()
        .populate('teacher', 'name email phone')
        .populate('enrolledStudents', 'name email phone')
        .sort({ scheduledDate: -1 });
    }

    res.status(200).json({
      success: true,
      count: classes.length,
      classes
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single class
// @route   GET /api/classes/:id
// @access  Private
exports.getClass = async (req, res, next) => {
  try {
    const classSession = await ClassSession.findById(req.params.id)
      .populate('teacher', 'name email phone hourlyRate')
      .populate('enrolledStudents', 'name email phone')
      .populate('attendanceRecords.student', 'name email');

    if (!classSession) {
      throw new AppError('Class not found', 404);
    }

    res.status(200).json({
      success: true,
      class: classSession
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Enroll student in a class
// @route   POST /api/classes/:id/enroll
// @access  Private (Students)
exports.enrollClass = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (user.role !== 'student') {
      throw new AppError('Only students can enroll in classes', 403);
    }

    const classSession = await ClassSession.findById(req.params.id);
    if (!classSession) {
      throw new AppError('Class not found', 404);
    }

    // Check if already enrolled
    if (classSession.enrolledStudents.includes(req.user.id)) {
      throw new AppError('You are already enrolled in this class', 400);
    }

    // Check max students
    if (classSession.enrolledStudents.length >= classSession.maxStudents) {
      throw new AppError('Class is full', 400);
    }

    // Add student to class
    classSession.enrolledStudents.push(req.user.id);
    
    // Create attendance record for student
    classSession.attendanceRecords.push({
      student: req.user.id,
      attended: false
    });

    await classSession.save();
    await classSession.populate('teacher', 'name email phone');

    res.status(200).json({
      success: true,
      message: 'Enrolled successfully',
      class: classSession
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Record attendance for a class
// @route   POST /api/classes/:id/attendance
// @access  Private (Teachers)
exports.recordAttendance = async (req, res, next) => {
  try {
    const { attendanceData } = req.body; // [{studentId, attended}, ...]

    const classSession = await ClassSession.findById(req.params.id);
    if (!classSession) {
      throw new AppError('Class not found', 404);
    }

    // Only teacher can record attendance
    if (classSession.teacher.toString() !== req.user.id) {
      throw new AppError('Only the class teacher can record attendance', 403);
    }

    // Update attendance records
    attendanceData.forEach(record => {
      const attendanceRecord = classSession.attendanceRecords.find(
        ar => ar.student.toString() === record.studentId
      );

      if (attendanceRecord) {
        attendanceRecord.attended = record.attended;
        if (record.attended) {
          attendanceRecord.attendedAt = new Date();
          attendanceRecord.hoursAttended = classSession.durationHours || 0;
        } else {
          attendanceRecord.hoursAttended = 0;
        }
      }
    });

    classSession.status = 'completed';
    classSession.completedAt = new Date();
    await classSession.save();

    res.status(200).json({
      success: true,
      message: 'Attendance recorded successfully',
      class: classSession
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark class as completed
// @route   POST /api/classes/:id/complete
// @access  Private (Teachers)
exports.completeClass = async (req, res, next) => {
  try {
    const classSession = await ClassSession.findById(req.params.id);
    if (!classSession) {
      throw new AppError('Class not found', 404);
    }

    // Only teacher can mark as completed
    if (classSession.teacher.toString() !== req.user.id) {
      throw new AppError('Only the class teacher can complete this class', 403);
    }

    classSession.status = 'completed';
    classSession.completedAt = new Date();
    await classSession.save();

    res.status(200).json({
      success: true,
      message: 'Class marked as completed',
      class: classSession
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update teacher's hourly rate
// @route   PUT /api/classes/teacher/rate
// @access  Private (Teachers)
exports.updateHourlyRate = async (req, res, next) => {
  try {
    const { hourlyRate } = req.body;

    if (!hourlyRate || hourlyRate < 0) {
      throw new AppError('Please provide a valid hourly rate', 400);
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { hourlyRate },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Hourly rate updated successfully',
      hourlyRate: user.hourlyRate
    });
  } catch (error) {
    next(error);
  }
};

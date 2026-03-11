const TeacherPayroll = require('../models/TeacherPayroll');
const StudentInvoice = require('../models/StudentInvoice');
const Class = require('../models/Class');
const Course = require('../models/Course');
const Teacher = require('../models/Teacher');
const User = require('../models/User');
const Payment = require('../models/Payment');
const AppError = require('../utils/AppError');

// @desc    Generate monthly payroll for all teachers
// @route   POST /api/payroll/generate-monthly
// @access  Private (Admin)
exports.generateMonthlyPayroll = async (req, res, next) => {
  try {
    const { billingMonth } = req.body; // Format: YYYY-MM

    // Only admin can generate payroll
    const user = await User.findById(req.user._id);
    if (user.role !== 'admin') {
      throw new AppError('Only admin can generate payroll', 403);
    }

    if (!billingMonth || !/^\d{4}-\d{2}$/.test(billingMonth)) {
      throw new AppError('Please provide billingMonth in YYYY-MM format', 400);
    }

    const [year, month] = billingMonth.split('-');
    const startDate = new Date(Number(year), Number(month) - 1, 1);
    const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59);

    // Get all completed classes in the billing period (CRM scheduled classes)
    const completedClasses = await Class.find({
      status: 'Completed',
      startDateTime: { $gte: startDate, $lte: endDate }
    }).sort({ startDateTime: 1 });

    // Group by teacherId (CRM teacherId string)
    const teacherAgg = new Map(); // teacherId -> { hours, classes: ObjectId[] }
    for (const cls of completedClasses) {
      const key = cls.teacherId;
      const hours = (cls.durationMinutes || 0) / 60;
      const cur = teacherAgg.get(key) || { hours: 0, classes: [] };
      cur.hours += hours;
      cur.classes.push(cls._id);
      teacherAgg.set(key, cur);
    }

    // Create payroll records
    const payrolls = [];
    for (const [teacherCrmId, data] of teacherAgg.entries()) {
      const teacherProfile = await Teacher.findOne({ teacherId: teacherCrmId });
      if (!teacherProfile) continue;

      const teacherUser = await User.findOne({ role: 'teacher', teacherId: teacherCrmId });
      if (!teacherUser) continue;

      // Check if payroll already exists
      let payroll = await TeacherPayroll.findOne({
        teacher: teacherUser._id,
        billingMonth
      });

      if (payroll) {
        // Update existing payroll
        payroll.totalHoursTaught = data.hours;
        payroll.classSessions = data.classes;
        payroll.hourlyRate = teacherProfile.compensationPerHour || 0;
      } else {
        // Create new payroll
        payroll = await TeacherPayroll.create({
          teacher: teacherUser._id,
          billingMonth,
          billingYear: Number(year),
          totalHoursTaught: data.hours,
          classSessions: data.classes,
          hourlyRate: teacherProfile.compensationPerHour || 0,
          status: 'pending'
        });
      }

      await payroll.save();
      payrolls.push(payroll);
    }

    res.status(201).json({
      success: true,
      data: payrolls,
      count: payrolls.length,
      message: `Monthly payroll for ${billingMonth} generated successfully`
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get pending payrolls for approval
// @route   GET /api/payroll/pending
// @access  Private (Admin)
exports.getPendingPayrolls = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (user.role !== 'admin') {
      throw new AppError('Only admin can view pending payrolls', 403);
    }

    const payrolls = await TeacherPayroll.find({ status: 'pending' })
      .populate('teacher', 'name email phone teacherId')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: payrolls,
      count: payrolls.length
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve and process teacher payroll
// @route   POST /api/payroll/:id/approve
// @access  Private (Admin)
exports.approvePayroll = async (req, res, next) => {
  try {
    const { deductions } = req.body;
    const adminId = req.user._id;

    const admin = await User.findById(adminId);
    if (admin.role !== 'admin') {
      throw new AppError('Only admin can approve payroll', 403);
    }

    const payroll = await TeacherPayroll.findById(req.params.id)
      .populate('teacher', 'name email phone');

    if (!payroll) {
      throw new AppError('Payroll not found', 404);
    }

    if (payroll.status !== 'pending') {
      throw new AppError('Only pending payrolls can be approved', 400);
    }

    payroll.deductions = deductions || 0;
    payroll.status = 'approved';
    payroll.processedBy = adminId;
    payroll.processedAt = new Date();
    await payroll.save();

    res.status(200).json({
      success: true,
      payroll,
      message: 'Payroll approved successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark payroll as paid
// @route   POST /api/payroll/:id/pay
// @access  Private (Admin)
exports.markPayrollAsPaid = async (req, res, next) => {
  try {
    const { paymentMethod, transactionId } = req.body;
    const admin = await User.findById(req.user._id);
    if (admin.role !== 'admin') {
      throw new AppError('Only admin can mark payroll as paid', 403);
    }

    const payroll = await TeacherPayroll.findById(req.params.id)
      .populate('teacher');

    if (!payroll) {
      throw new AppError('Payroll not found', 404);
    }

    if (payroll.status !== 'approved') {
      throw new AppError('Only approved payrolls can be marked as paid', 400);
    }

    payroll.status = 'paid';
    payroll.paidAt = new Date();
    await payroll.save();

    // Create payment record
    await Payment.create({
      userId: payroll.teacher._id,
      amount: payroll.netAmount,
      status: 'completed',
      paymentMethod: paymentMethod || 'bank_transfer',
      description: `Teacher salary for ${payroll.billingMonth}`,
      metadata: {
        paymentType: 'TEACHER_SALARY',
        payrollId: payroll._id.toString(),
        transactionId: transactionId || null
      }
    });

    // Update teacher's total earnings
    await User.findByIdAndUpdate(
      payroll.teacher._id,
      {
        $inc: {
          totalEarnings: payroll.netAmount,
          totalHoursTaught: payroll.totalHoursTaught
        }
      }
    );

    res.status(200).json({
      success: true,
      payroll,
      message: 'Payroll marked as paid'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get payroll history for a teacher
// @route   GET /api/payroll/teacher/:teacherId
// @access  Private
exports.getTeacherPayroll = async (req, res, next) => {
  try {
    let teacherUserId = req.user._id;

    if (req.params.teacherId) {
      // Admin can query by CRM teacherId (e.g., TCH-000001)
      const admin = await User.findById(req.user._id);
      if (admin.role !== 'admin') {
        throw new AppError('Only admin can query other teachers payroll', 403);
      }
      const teacherUser = await User.findOne({ role: 'teacher', teacherId: req.params.teacherId });
      if (!teacherUser) throw new AppError('Teacher user not found', 404);
      teacherUserId = teacherUser._id;
    } else {
      // Teacher can query own payroll
      const self = await User.findById(req.user._id);
      if (self.role !== 'teacher' && self.role !== 'admin') {
        throw new AppError('Not authorized', 403);
      }
    }

    const payrolls = await TeacherPayroll.find({ teacher: teacherUserId })
      .populate('teacher', 'name email teacherId')
      .sort({ billingMonth: -1 });

    res.status(200).json({
      success: true,
      data: payrolls,
      count: payrolls.length
    });
  } catch (error) {
    next(error);
  }
};

// ======================== STUDENT INVOICING ========================

// @desc    Generate monthly invoices for all students
// @route   POST /api/invoices/generate-monthly
// @access  Private (Admin)
exports.generateMonthlyInvoices = async (req, res, next) => {
  try {
    const { billingMonth } = req.body;

    const user = await User.findById(req.user._id);
    if (user.role !== 'admin') {
      throw new AppError('Only admin can generate invoices', 403);
    }

    if (!billingMonth || !/^\d{4}-\d{2}$/.test(billingMonth)) {
      throw new AppError('Please provide billingMonth in YYYY-MM format', 400);
    }

    const [year, month] = billingMonth.split('-');
    const startDate = new Date(Number(year), Number(month) - 1, 1);
    const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59);
    const dueDate = new Date(Number(year), Number(month), 15); // Due on 15th of next month

    const completedClasses = await Class.find({
      status: 'Completed',
      startDateTime: { $gte: startDate, $lte: endDate }
    }).sort({ startDateTime: 1 });

    const courses = await Course.find({}).select('courseId billingRatePerHour');
    const rateByCourseId = new Map(courses.map(c => [c.courseId, c.billingRatePerHour || 0]));

    // Group by student CRM id -> invoice data (mapped to User)
    const studentAgg = new Map(); // studentCrmId -> { classes: ObjectId[], lineItems: [], totalHours }
    for (const cls of completedClasses) {
      const hours = (cls.durationMinutes || 0) / 60;
      const rate = rateByCourseId.get(cls.courseId) || 0;
      const amount = hours * rate;
      const cur = studentAgg.get(cls.studentId) || { classes: [], lineItems: [] };
      cur.classes.push(cls._id);
      cur.lineItems.push({
        classId: cls.classId,
        courseId: cls.courseId,
        hours,
        ratePerHour: rate,
        amount
      });
      studentAgg.set(cls.studentId, cur);
    }

    // Create invoice records
    const invoices = [];
    for (const [studentCrmId, data] of studentAgg.entries()) {
      const studentUser = await User.findOne({ role: 'student', studentId: studentCrmId });
      if (!studentUser) continue;

      let invoice = await StudentInvoice.findOne({
        student: studentUser._id,
        billingMonth
      });

      if (invoice) {
        // Update existing invoice
        invoice.classesAttended = data.classes;
        invoice.lineItems = data.lineItems;
        invoice.totalClassesAttended = data.classes.length;
        invoice.dueDate = dueDate;
      } else {
        // Create new invoice
        invoice = await StudentInvoice.create({
          student: studentUser._id,
          billingMonth,
          billingYear: Number(year),
          classesAttended: data.classes,
          totalClassesAttended: data.classes.length,
          totalHoursAttended: 0,
          hourlyRate: 0,
          lineItems: data.lineItems,
          dueDate,
          status: 'pending',
          generatedBy: req.user._id
        });
      }

      await invoice.save();
      invoices.push(invoice);
    }

    res.status(201).json({
      success: true,
      data: invoices,
      count: invoices.length,
      message: `Monthly invoices for ${billingMonth} generated successfully`
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get pending invoices for a student
// @route   GET /api/invoices/my-invoices
// @access  Private (Student)
exports.getMyInvoices = async (req, res, next) => {
  try {
    const invoices = await StudentInvoice.find({ student: req.user._id })
      .populate('classesAttended', 'classId courseId teacherId startDateTime durationMinutes status')
      .sort({ billingMonth: -1 });

    res.status(200).json({
      success: true,
      data: invoices,
      count: invoices.length
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all pending invoices (Admin view)
// @route   GET /api/invoices/pending
// @access  Private (Admin)
exports.getPendingInvoices = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (user.role !== 'admin') {
      throw new AppError('Only admin can view pending invoices', 403);
    }

    const invoices = await StudentInvoice.find({ status: { $in: ['pending', 'overdue'] } })
      .populate('student', 'name email phone')
      .sort({ billingMonth: -1 });

    res.status(200).json({
      success: true,
      data: invoices,
      count: invoices.length
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Record student payment towards invoice
// @route   POST /api/invoices/:id/pay
// @access  Private
exports.payInvoice = async (req, res, next) => {
  try {
    const { amountPaid, paymentMethod, transactionId } = req.body;

    const invoice = await StudentInvoice.findById(req.params.id);
    if (!invoice) {
      throw new AppError('Invoice not found', 404);
    }

    // Check authorization
    if (invoice.student.toString() !== req.user._id.toString()) {
      const user = await User.findById(req.user._id);
      if (user.role !== 'admin') {
        throw new AppError('You can only pay your own invoices', 403);
      }
    }

    if (!amountPaid || amountPaid <= 0) {
      throw new AppError('Please provide a valid payment amount', 400);
    }

    if (amountPaid > invoice.remainingAmount) {
      throw new AppError(`Payment exceeds remaining amount of ${invoice.remainingAmount}`, 400);
    }

    invoice.amountPaid += amountPaid;
    if (invoice.amountPaid >= invoice.totalAmount) {
      invoice.status = 'paid';
      invoice.paidAt = new Date();
    } else {
      invoice.status = 'partially-paid';
    }
    await invoice.save();

    // Create payment record
    await Payment.create({
      userId: invoice.student,
      amount: amountPaid,
      status: 'completed',
      paymentMethod: paymentMethod || 'bank_transfer',
      description: `Student fees for ${invoice.billingMonth}`,
      metadata: {
        paymentType: 'STUDENT_FEES',
        invoiceId: invoice._id.toString(),
        invoiceNumber: invoice.invoiceNumber,
        transactionId: transactionId || null
      }
    });

    res.status(200).json({
      success: true,
      data: invoice,
      message: `Payment of ${amountPaid} recorded successfully`
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get invoice details
// @route   GET /api/invoices/:id
// @access  Private
exports.getInvoice = async (req, res, next) => {
  try {
    const invoice = await StudentInvoice.findById(req.params.id)
      .populate('student', 'name email phone')
      .populate('classesAttended', 'classId courseId teacherId startDateTime durationMinutes status')
      .populate('generatedBy', 'name email');

    if (!invoice) {
      throw new AppError('Invoice not found', 404);
    }

    res.status(200).json({
      success: true,
      data: invoice
    });
  } catch (error) {
    next(error);
  }
};

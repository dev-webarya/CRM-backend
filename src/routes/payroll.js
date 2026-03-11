const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  generateMonthlyPayroll,
  getPendingPayrolls,
  approvePayroll,
  markPayrollAsPaid,
  getTeacherPayroll,
  generateMonthlyInvoices,
  getMyInvoices,
  getPendingInvoices,
  payInvoice,
  getInvoice
} = require('../controllers/payrollController');

// ==================== TEACHER PAYROLL ROUTES ====================
// Admin only routes
router.post('/payroll/generate-monthly', protect, generateMonthlyPayroll);
router.get('/payroll/pending', protect, getPendingPayrolls);
router.post('/payroll/:id/approve', protect, approvePayroll);
router.post('/payroll/:id/pay', protect, markPayrollAsPaid);

// Teacher routes - get own payroll
router.get('/payroll/teacher', protect, getTeacherPayroll);
// Teacher routes - get specific teacher's payroll (admin)
router.get('/payroll/teacher/:teacherId', protect, getTeacherPayroll);

// ==================== STUDENT INVOICE ROUTES ====================
// Admin only routes
router.post('/invoices/generate-monthly', protect, generateMonthlyInvoices);
router.get('/invoices/pending', protect, getPendingInvoices);

// Student and Admin routes
router.get('/invoices/my-invoices', protect, getMyInvoices);
router.get('/invoices/:id', protect, getInvoice);
router.post('/invoices/:id/pay', protect, payInvoice);

module.exports = router;

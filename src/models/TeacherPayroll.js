const mongoose = require('mongoose');

const teacherPayrollSchema = new mongoose.Schema({
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  billingMonth: { type: String, required: true }, // Format: YYYY-MM (e.g., 2024-01)
  billingYear: { type: Number, required: true },
  
  // Hour tracking
  classSessions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }],
  totalHoursTaught: { type: Number, default: 0, required: true },
  hourlyRate: { type: Number, required: true }, // Locked rate for this period
  
  // Payment calculation
  grossAmount: { type: Number, default: 0 }, // totalHoursTaught * hourlyRate
  deductions: { type: Number, default: 0 }, // Tax, etc.
  netAmount: { type: Number, default: 0 }, // grossAmount - deductions
  
  // Status and tracking
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'paid'], 
    default: 'pending' 
  },
  payslipNumber: { type: String, unique: true },
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Admin who processed
  processedAt: Date,
  paidAt: Date,
  paymentNotes: String,
  
  // Metadata
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Ensure unique payroll per teacher per month
teacherPayrollSchema.index({ teacher: 1, billingMonth: 1 }, { unique: true });

// Pre-save middleware to calculate amounts
teacherPayrollSchema.pre('save', function(next) {
  this.grossAmount = this.totalHoursTaught * this.hourlyRate;
  this.netAmount = this.grossAmount - (this.deductions || 0);
  
  // Generate payslip number if not exists
  if (!this.payslipNumber) {
    const timestamp = this.createdAt.getTime();
    this.payslipNumber = `PS-${this.billingMonth.replace('-', '')}-${timestamp}`;
  }
  
  next();
});

module.exports = mongoose.model('TeacherPayroll', teacherPayrollSchema);

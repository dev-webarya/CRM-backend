const mongoose = require('mongoose');

const studentInvoiceSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  billingMonth: { type: String, required: true }, // Format: YYYY-MM (e.g., 2024-01)
  billingYear: { type: Number, required: true },
  
  // Attendance tracking
  classesAttended: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }],
  totalClassesScheduled: { type: Number, default: 0 },
  totalClassesAttended: { type: Number, default: 0 },
  totalHoursAttended: { type: Number, default: 0, required: true },
  
  // Billing calculation
  // When courses have different rates, use `lineItems` (preferred).
  // `hourlyRate` is kept for backward-compat / institute-wide pricing.
  hourlyRate: { type: Number, default: 0 }, // Cost per hour the student pays
  totalAmount: { type: Number, default: 0 }, // totalHoursAttended * hourlyRate

  // Detailed billing (recommended)
  lineItems: [
    {
      classId: { type: String },
      courseId: { type: String },
      hours: { type: Number, default: 0 },
      ratePerHour: { type: Number, default: 0 },
      amount: { type: Number, default: 0 }
    }
  ],
  
  // Payment status
  status: { 
    type: String, 
    enum: ['pending', 'partially-paid', 'paid', 'overdue'], 
    default: 'pending' 
  },
  invoiceNumber: { type: String, unique: true },
  dueDate: { type: Date, required: true },
  
  // Payment tracking
  amountPaid: { type: Number, default: 0 },
  remainingAmount: { type: Number, default: 0 },
  paidAt: Date,
  
  // Admin notes
  notes: String,
  generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Admin
  
  // Metadata
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Ensure unique invoice per student per month
studentInvoiceSchema.index({ student: 1, billingMonth: 1 }, { unique: true });

// Pre-save middleware to calculate amounts
studentInvoiceSchema.pre('save', function(next) {
  if (Array.isArray(this.lineItems) && this.lineItems.length > 0) {
    this.totalHoursAttended = this.lineItems.reduce((sum, li) => sum + (li.hours || 0), 0);
    this.totalAmount = this.lineItems.reduce((sum, li) => sum + (li.amount || 0), 0);
  } else {
    this.totalAmount = this.totalHoursAttended * (this.hourlyRate || 0);
  }
  this.remainingAmount = this.totalAmount - (this.amountPaid || 0);
  
  // Update status based on payment
  if (this.remainingAmount <= 0) {
    this.status = 'paid';
  } else if (this.amountPaid > 0) {
    this.status = 'partially-paid';
  } else if (new Date() > this.dueDate && this.status === 'pending') {
    this.status = 'overdue';
  }
  
  // Generate invoice number if not exists
  if (!this.invoiceNumber) {
    const timestamp = this.createdAt.getTime();
    this.invoiceNumber = `INV-${this.billingMonth.replace('-', '')}-${timestamp}`;
  }
  
  next();
});

module.exports = mongoose.model('StudentInvoice', studentInvoiceSchema);

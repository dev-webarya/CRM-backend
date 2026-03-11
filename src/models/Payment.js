const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // Our Course model uses string `courseId` (CRS-xxxx). Store that identifier.
  courseId: { type: String },
  stripePaymentId: String,
  amount: { type: Number, required: true },
  currency: { type: String, default: 'inr' },
  description: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: { type: String, enum: ['stripe', 'credit_card', 'bank_transfer'], required: true },
  metadata: mongoose.Schema.Types.Mixed,
  receiptEmail: String,
  referenceNumber: { type: String, unique: true },
  failureReason: String,
  createdAt: { type: Date, default: Date.now },
  completedAt: Date,
  refundedAt: Date
});

// Generate reference number before saving
paymentSchema.pre('save', async function(next) {
  if (!this.referenceNumber) {
    this.referenceNumber = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  next();
});

module.exports = mongoose.model('Payment', paymentSchema);

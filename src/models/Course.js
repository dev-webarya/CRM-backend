const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  courseId: { type: String, required: true, unique: true },
  studentId: { type: String, ref: 'Student', required: true },
  subject: { type: String, required: true },
  teacherId: { type: String, ref: 'Teacher', required: true },
  timeSlot1: { type: String },
  timeSlot2: { type: String },
  timeSlot3: { type: String },
  cycleType: { 
    type: String, 
    enum: ["6hrs", "8hrs", "12hrs", "16hrs", "monthly"],
    required: true 
  },
  cycleTargetHours: { type: Number },
  billingRatePerHour: { type: Number, required: true },
  billingRatePerHourHigh: { type: Number },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  status: { type: String, enum: ["Active", "Paused", "Completed"], default: "Active" },
  feeStatus: { type: String, enum: ["NotDue", "Due", "PartiallyPaid", "Paid"], default: "NotDue" },
  completedHours: { type: Number, default: 0 },
  lastDueDate: { type: Date },
  createdBy: { type: String },
  updatedBy: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Course', courseSchema);

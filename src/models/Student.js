const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  studentId: { type: String, required: true, unique: true },
  registrationNumber: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String },
  dateOfEnrollment: { type: Date, required: true },
  mobile: { type: String, required: true },
  parentEmailId: { type: String, required: true },
  fatherName: { type: String, required: true },
  motherName: { type: String, required: true },
  parentContact: { type: String, required: true },
  grade: {
    type: String,
    enum: ["6", "7", "8", "9", "10", "11", "12", "12thPass", "UG", "FreshGrad", "Professional"],
    required: true
  },
  courseName: { type: String },
  address: { type: String },
  status: { type: String, enum: ["Active", "Paused", "Completed", "Inactive"], default: "Active" },
  notes: { type: String },
  createdBy: { type: String },
  updatedBy: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);

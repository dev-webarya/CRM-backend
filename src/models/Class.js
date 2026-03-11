const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  classId: { type: String, required: true, unique: true },
  studentId: { type: String, ref: 'Student', required: true },
  courseId: { type: String, ref: 'Course', required: true },
  teacherId: { type: String, ref: 'Teacher', required: true },
  startDateTime: { type: Date, required: true },
  durationMinutes: { type: Number, required: true },
  topicCovered: { type: String },
  activity: { type: String },
  comments: { type: String },
  createdByRole: { type: String, enum: ["Admin", "Teacher"], required: true },
  status: { type: String, enum: ["Scheduled", "Completed", "Cancelled"], default: "Scheduled" },
  createdBy: { type: String },
  updatedBy: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Class', classSchema);

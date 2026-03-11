const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  notificationId: { type: String, required: true, unique: true },
  recipientId: { type: String, required: true }, // Can be Admin ID, Teacher ID, or Student ID
  recipientRole: { type: String, enum: ["Admin", "Teacher", "Student"], required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ["INFO", "WARNING", "SUCCESS", "ERROR"], default: "INFO" },
  status: { type: String, enum: ["Unread", "Read"], default: "Unread" },
  relatedObjectType: { type: String, enum: ["Teacher", "Student", "Course", "Class", "General"] },
  relatedObjectId: { type: String },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);

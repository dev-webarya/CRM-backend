const mongoose = require('mongoose');

const logEntrySchema = new mongoose.Schema({
  logId: { type: String, required: true, unique: true },
  timestamp: { type: Date, default: Date.now },
  actorUserId: { type: String, required: true },
  actorRole: { type: String, enum: ["Admin", "Teacher"], required: true },
  actionType: { type: String, enum: ["CREATE", "UPDATE", "DELETE", "LOGIN", "NOTIFICATION", "EXPORT"], required: true },
  objectType: { type: String, enum: ["Teacher", "Student", "Course", "Class", "Settings"], required: true },
  objectId: { type: String, required: true },
  before: { type: mongoose.Schema.Types.Mixed },
  after: { type: mongoose.Schema.Types.Mixed },
  ipAddress: { type: String },
  userAgent: { type: String },
  remarks: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('LogEntry', logEntrySchema);

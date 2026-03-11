const mongoose = require('mongoose');

const classSessionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  
  // Session timing
  scheduledDate: { type: Date, required: true },
  startTime: String, // HH:mm format
  endTime: String, // HH:mm format
  durationHours: { type: Number, default: 0 }, // Auto-calculated from start/end time
  
  // Enrollment
  maxStudents: { type: Number, default: 30 },
  enrolledStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  
  // Attendance tracking
  status: { 
    type: String, 
    enum: ['scheduled', 'in-progress', 'completed', 'cancelled'], 
    default: 'scheduled' 
  },
  attendanceRecords: [{
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    attended: { type: Boolean, default: false },
    attendedAt: Date,
    hoursAttended: { type: Number, default: 0 }
  }],
  
  // Payment related
  pricePerStudent: { type: Number, default: 0 }, // Optional per-student fee for this class
  teacherHourlyRate: { type: Number, required: true }, // Locked rate for payment calculation
  
  // Metadata
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  completedAt: Date
});

// Middleware to calculate duration in hours
classSessionSchema.pre('save', async function(next) {
  if (this.startTime && this.endTime) {
    const [startHour, startMin] = this.startTime.split(':').map(Number);
    const [endHour, endMin] = this.endTime.split(':').map(Number);
    
    const startTotalMin = startHour * 60 + startMin;
    const endTotalMin = endHour * 60 + endMin;
    
    if (endTotalMin > startTotalMin) {
      this.durationHours = (endTotalMin - startTotalMin) / 60;
    }
  }
  
  // Lock teacher's hourly rate if not set
  if (!this.teacherHourlyRate && this.teacher) {
    const teacher = await mongoose.model('User').findById(this.teacher);
    if (teacher) {
      this.teacherHourlyRate = teacher.hourlyRate || 0;
    }
  }
  
  next();
});

module.exports = mongoose.model('ClassSession', classSessionSchema);

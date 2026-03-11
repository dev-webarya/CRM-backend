const crypto = require('crypto');

// ============= ID GENERATION =============
const generateTeacherId = () => {
  return `TCH-${crypto.randomInt(100000, 999999)}`;
};

const generateStudentId = () => {
  return `STD-${crypto.randomInt(100000, 999999)}`;
};

const generateRegistrationNumber = () => {
  const year = new Date().getFullYear();
  const randomNum = crypto.randomInt(100, 999);
  return `STU-${year}-${randomNum}`;
};

const generateCourseId = () => {
  return `CRS-${crypto.randomInt(100000, 999999)}`;
};

const generateClassId = () => {
  return `CLS-${crypto.randomInt(100000, 999999)}`;
};

const generateLogId = () => {
  return `LOG-${crypto.randomInt(100000, 999999)}`;
};

// ============= DUPLICATE CLASS DETECTION =============
const detectDuplicateClass = async (ClassModel, newClass) => {
  const { studentId, teacherId, startDateTime, durationMinutes, classId } = newClass;

  if (!studentId || !teacherId || !startDateTime || !durationMinutes) {
    return { isDuplicate: false };
  }

  const newStart = new Date(startDateTime).getTime();
  const newEnd = newStart + durationMinutes * 60 * 1000;

  // Find existing classes for same student and teacher that are not cancelled
  const existingClasses = await ClassModel.find({
    studentId,
    teacherId,
    status: { $ne: 'Cancelled' },
    classId: { $ne: classId } // Exclude the current class if we're updating
  });

  for (const existing of existingClasses) {
    const existingStart = new Date(existing.startDateTime).getTime();
    const existingEnd = existingStart + existing.durationMinutes * 60 * 1000;

    // Check for time overlap
    if (newStart < existingEnd && newEnd > existingStart) {
      return {
        isDuplicate: true,
        conflictingClassId: existing.classId,
        message: `Duplicate/overlapping class detected with ${existing.classId} (${existing.startDateTime})`,
      };
    }
  }

  return { isDuplicate: false };
};

module.exports = {
  generateTeacherId,
  generateStudentId,
  generateRegistrationNumber,
  generateCourseId,
  generateClassId,
  generateLogId,
  detectDuplicateClass
};

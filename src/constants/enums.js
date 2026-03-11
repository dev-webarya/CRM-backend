// Grade enums
const GRADES = {
  GRADE_6: '6',
  GRADE_7: '7',
  GRADE_8: '8',
  GRADE_9: '9',
  GRADE_10: '10',
  GRADE_11: '11',
  GRADE_12: '12',
  GRADE_12_PASS: '12thPass',
  UG: 'UG',
  FRESH_GRAD: 'FreshGrad',
  PROFESSIONAL: 'Professional'
};

// Student status
const STUDENT_STATUS = {
  ACTIVE: 'Active',
  PAUSED: 'Paused',
  COMPLETED: 'Completed',
  INACTIVE: 'Inactive'
};

// Teacher status
const TEACHER_STATUS = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive'
};

// Class status
const CLASS_STATUS = {
  SCHEDULED: 'Scheduled',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled'
};

// Course status
const COURSE_STATUS = {
  ACTIVE: 'Active',
  PAUSED: 'Paused',
  COMPLETED: 'Completed'
};

// Fee status
const FEE_STATUS = {
  NOT_DUE: 'NotDue',
  DUE: 'Due',
  PARTIALLY_PAID: 'PartiallyPaid',
  PAID: 'Paid'
};

// Cycle types
const CYCLE_TYPES = {
  HOURS_6: '6hrs',
  HOURS_8: '8hrs',
  HOURS_12: '12hrs',
  HOURS_16: '16hrs',
  MONTHLY: 'monthly'
};

// Notification types
const NOTIFICATION_TYPES = {
  INFO: 'INFO',
  WARNING: 'WARNING',
  SUCCESS: 'SUCCESS',
  ERROR: 'ERROR'
};

// Notification status
const NOTIFICATION_STATUS = {
  UNREAD: 'Unread',
  READ: 'Read'
};

// Roles
const ROLES = {
  ADMIN: 'Admin',
  TEACHER: 'Teacher',
  STUDENT: 'Student'
};

// Action types
const ACTION_TYPES = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  LOGIN: 'LOGIN',
  NOTIFICATION: 'NOTIFICATION',
  EXPORT: 'EXPORT'
};

// Object types
const OBJECT_TYPES = {
  TEACHER: 'Teacher',
  STUDENT: 'Student',
  COURSE: 'Course',
  CLASS: 'Class',
  SETTINGS: 'Settings'
};

module.exports = {
  GRADES,
  STUDENT_STATUS,
  TEACHER_STATUS,
  CLASS_STATUS,
  COURSE_STATUS,
  FEE_STATUS,
  CYCLE_TYPES,
  NOTIFICATION_TYPES,
  NOTIFICATION_STATUS,
  ROLES,
  ACTION_TYPES,
  OBJECT_TYPES
};

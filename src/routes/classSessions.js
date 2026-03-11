const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createClass,
  getMyClasses,
  getClass,
  enrollClass,
  recordAttendance,
  completeClass,
  updateHourlyRate
} = require('../controllers/classSessionController');

// More specific routes first (to avoid matching with /:id)
router.put('/teacher/hourly-rate', protect, updateHourlyRate);

// General routes
router.get('/', protect, getMyClasses);
router.get('/:id', protect, getClass);

// Create class route
router.post('/', protect, createClass);

// Class management routes
router.post('/:id/enroll', protect, enrollClass);
router.post('/:id/attendance', protect, recordAttendance);
router.post('/:id/complete', protect, completeClass);

module.exports = router;

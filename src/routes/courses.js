const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { protect, authorize } = require('../middleware/auth');

// GET routes - Protected routes (must come before generic routes to avoid conflicts)
router.get('/teacher', protect, courseController.getCoursesForTeacher);
router.get('/student', protect, courseController.getCoursesForStudent);

// GET routes - Admin only
router.get('/stats/overview', protect, authorize('admin'), courseController.getCourseStats);
router.get('/', protect, authorize('admin'), courseController.getAllCourses);
router.get('/:id', protect, authorize('admin'), courseController.getCourseById);

// POST routes
router.post('/', protect, authorize('admin'), courseController.createCourse);

// PUT routes
router.put('/:id', protect, authorize('admin'), courseController.updateCourse);

// PATCH routes
router.patch('/:id/fee-status', protect, authorize('admin'), courseController.updateFeeStatus);

// DELETE routes
router.delete('/:id', protect, authorize('admin'), courseController.deleteCourse);

module.exports = router;

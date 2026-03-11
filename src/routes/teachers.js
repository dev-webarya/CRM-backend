const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.post('/register', teacherController.registerTeacher);

// Teacher self routes
router.get('/me/profile', protect, teacherController.getMyTeacherProfile);

// GET routes (Admin only)
router.get('/stats/overview', protect, authorize('admin'), teacherController.getTeacherStats);
router.get('/', protect, authorize('admin'), teacherController.getAllTeachers);
router.get('/:id', protect, authorize('admin'), teacherController.getTeacherById);

// POST routes (Admin only - requires authentication)
router.post('/', protect, teacherController.createTeacher);

// PUT routes
router.put('/:id', protect, authorize('admin'), teacherController.updateTeacher);

// DELETE routes
router.delete('/:id', protect, authorize('admin'), teacherController.deleteTeacher);

module.exports = router;

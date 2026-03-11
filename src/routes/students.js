const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.post('/register', studentController.registerStudent);

// GET routes - Protected routes (must come before generic routes to avoid conflicts)
router.get('/teacher', protect, studentController.getStudentsForTeacher);

// GET routes - Admin only
router.get('/stats/overview', protect, authorize('admin'), studentController.getStudentStats);
router.get('/', protect, authorize('admin'), studentController.getAllStudents);
router.get('/:id', protect, authorize('admin'), studentController.getStudentById);

// POST routes (Admin only - requires authentication)
router.post('/', protect, studentController.createStudent);

// PUT routes
router.put('/:id', protect, authorize('admin'), studentController.updateStudent);

// PATCH routes
router.patch('/bulk/status', protect, authorize('admin'), studentController.bulkUpdateStatus);

// DELETE routes
router.delete('/:id', protect, authorize('admin'), studentController.deleteStudent);

module.exports = router;

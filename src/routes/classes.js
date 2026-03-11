const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');
const { protect, authorize } = require('../middleware/auth');

// GET routes - Protected routes (must come before generic routes to avoid conflicts)
router.get('/teacher', protect, classController.getClassesForTeacher);
router.get('/student', protect, classController.getClassesForStudent);

// GET routes - Admin only
router.get('/stats/overview', protect, authorize('admin'), classController.getClassStats);
router.get('/', protect, authorize('admin'), classController.getAllClasses);
router.get('/:id', protect, authorize('admin'), classController.getClassById);

// POST routes
router.post('/', protect, authorize('admin'), classController.createClass);

// PUT routes
router.put('/:id', protect, authorize('admin'), classController.updateClass);

// PATCH routes
router.patch('/:id/complete', protect, classController.completeClass);
router.patch('/:id/cancel', protect, classController.cancelClass);

// DELETE routes
router.delete('/:id', protect, authorize('admin'), classController.deleteClass);

module.exports = router;

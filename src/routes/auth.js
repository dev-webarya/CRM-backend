const express = require('express');
const router = express.Router();
const { register, login, getMe, updateProfile, changePassword, logout, forgotPassword, resetPassword, adminSetCredentials, getPendingApprovals, approveUser } = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/me', protect, getMe);
router.put('/update-profile', protect, updateProfile);
router.post('/change-password', protect, changePassword);
router.post('/logout', protect, logout);

// Admin-only routes
router.post('/admin/set-credentials', protect, authorize('admin'), adminSetCredentials);
router.get('/admin/pending-approvals', protect, authorize('admin'), getPendingApprovals);
router.post('/admin/approve/:userId', protect, authorize('admin'), approveUser);

module.exports = router;

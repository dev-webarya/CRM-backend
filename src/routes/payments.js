const express = require('express');
const router = express.Router();
const { 
  createPaymentIntent, 
  processPayment, 
  getMyPayments, 
  getPayment,
  getAllPayments,
  refundPayment,
  getPaymentStats
} = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/auth');

// Protected routes for all users
router.post('/create-intent', protect, createPaymentIntent);
router.post('/process', protect, processPayment);
router.get('/my-payments', protect, getMyPayments);
router.get('/:id', protect, getPayment);

// Admin routes
router.get('/', protect, authorize('admin'), getAllPayments);
router.post('/:id/refund', protect, authorize('admin'), refundPayment);
router.get('/stats', protect, authorize('admin'), getPaymentStats);

module.exports = router;

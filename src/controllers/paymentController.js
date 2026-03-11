const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy');
const Payment = require('../models/Payment');
const Course = require('../models/Course');
const User = require('../models/User');
const AppError = require('../utils/AppError');

// @desc    Create a payment intent
// @route   POST /api/payments/create-intent
// @access  Private
exports.createPaymentIntent = async (req, res, next) => {
  try {
    const { courseId, amount, description } = req.body;

    if (!amount || !description) {
      throw new AppError('Please provide amount and description', 400);
    }

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'inr',
      metadata: {
        userId: req.user._id.toString(),
        courseId: courseId || '',
        description
      }
    });

    res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Process payment
// @route   POST /api/payments/process
// @access  Private
exports.processPayment = async (req, res, next) => {
  try {
    const { courseId, amount, paymentIntentId, paymentMethod, description, transactionId } = req.body;

    if (!amount || amount <= 0 || !description) {
      throw new AppError('Please provide a valid amount and description', 400);
    }

    const method = paymentMethod || 'bank_transfer';

    // Stripe: confirm intent must be succeeded
    if (method === 'stripe') {
      if (!paymentIntentId) {
        throw new AppError('Please provide paymentIntentId for Stripe payments', 400);
      }

      const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
      if (intent.status !== 'succeeded') {
        throw new AppError('Payment was not successful', 400);
      }

      const payment = await Payment.create({
        userId: req.user._id,
        courseId: courseId || null,
        stripePaymentId: paymentIntentId,
        amount,
        description,
        paymentMethod: 'stripe',
        status: 'completed',
        completedAt: new Date(),
        receiptEmail: req.user.email,
        metadata: {
          userEmail: req.user.email,
          userName: req.user.name
        }
      });

      return res.status(201).json({
        success: true,
        payment,
        message: 'Payment processed successfully'
      });
    }

    // Non-stripe methods: create a pending payment record (internal CRM)
    const payment = await Payment.create({
      userId: req.user._id,
      courseId: courseId || null,
      amount,
      description,
      paymentMethod: method,
      status: 'pending',
      receiptEmail: req.user.email,
      metadata: {
        userEmail: req.user.email,
        userName: req.user.name,
        transactionId: transactionId || null
      }
    });

    res.status(201).json({
      success: true,
      payment,
      message: 'Payment recorded successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all payments for user
// @route   GET /api/payments/my-payments
// @access  Private
exports.getMyPayments = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const skip = (page - 1) * limit;

    const payments = await Payment.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Payment.countDocuments({ userId: req.user._id });

    res.status(200).json({
      success: true,
      data: payments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get payment by ID
// @route   GET /api/payments/:id
// @access  Private
exports.getPayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('userId', 'name email')
      ;

    if (!payment) {
      throw new AppError('Payment not found', 404);
    }

    // Check if user owns this payment
    if (payment.userId._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      throw new AppError('Unauthorized to access this payment', 403);
    }

    res.status(200).json({
      success: true,
      data: payment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all payments (Admin only)
// @route   GET /api/payments
// @access  Private/Admin
exports.getAllPayments = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, userId } = req.query;
    
    const skip = (page - 1) * limit;
    const filter = {};

    if (status) filter.status = status;
    if (userId) filter.userId = userId;

    const payments = await Payment.find(filter)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Payment.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: payments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Refund payment
// @route   POST /api/payments/:id/refund
// @access  Private/Admin
exports.refundPayment = async (req, res, next) => {
  try {
    const { reason } = req.body;

    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      throw new AppError('Payment not found', 404);
    }

    if (payment.status === 'refunded') {
      throw new AppError('Payment already refunded', 400);
    }

    if (payment.status !== 'completed') {
      throw new AppError('Only completed payments can be refunded', 400);
    }

    // Process refund with Stripe
    if (payment.stripePaymentId) {
      await stripe.refunds.create({
        payment_intent: payment.stripePaymentId,
        reason: reason || 'requested_by_customer'
      });
    }

    // Update payment status
    payment.status = 'refunded';
    payment.refundedAt = new Date();
    await payment.save();

    res.status(200).json({
      success: true,
      payment,
      message: 'Payment refunded successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get payment statistics
// @route   GET /api/payments/stats
// @access  Private/Admin
exports.getPaymentStats = async (req, res, next) => {
  try {
    const stats = await Payment.aggregate([
      {
        $match: { status: 'completed' }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          totalPayments: { $sum: 1 },
          averageAmount: { $avg: '$amount' }
        }
      }
    ]);

    const statsByStatus = await Payment.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      overall: stats[0] || { totalAmount: 0, totalPayments: 0, averageAmount: 0 },
      byStatus: statsByStatus
    });
  } catch (error) {
    next(error);
  }
};

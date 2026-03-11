const Notification = require('../models/Notification');
const AppError = require('../utils/AppError');
const asyncHandler = require('../middleware/asyncHandler');
const { generateLogId } = require('../utils/crmUtils');
const { NOTIFICATION_TYPES, NOTIFICATION_STATUS, ROLES } = require('../constants/enums');

/**
 * @desc    Get all notifications with filtering
 * @route   GET /api/notifications
 * @query   recipientId, recipientRole, status, type, page, limit
 */
exports.getAllNotifications = asyncHandler(async (req, res) => {
  const { recipientId, recipientRole, status, type, page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  // Build filter
  const filter = {};
  if (recipientId) filter.recipientId = recipientId;
  if (recipientRole) filter.recipientRole = recipientRole;
  if (status) filter.status = status;
  if (type) filter.type = type;

  const notifications = await Notification.find(filter)
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ timestamp: -1 });

  const total = await Notification.countDocuments(filter);

  res.status(200).json({
    success: true,
    data: notifications,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    }
  });
});

/**
 * @desc    Get single notification by ID
 * @route   GET /api/notifications/:id
 */
exports.getNotificationById = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({ notificationId: req.params.id });

  if (!notification) {
    throw AppError.notFound('Notification not found');
  }

  res.status(200).json({
    success: true,
    data: notification
  });
});

/**
 * @desc    Create new notification
 * @route   POST /api/notifications
 */
exports.createNotification = asyncHandler(async (req, res) => {
  const {
    notificationId,
    recipientId,
    recipientRole,
    title,
    message,
    type = NOTIFICATION_TYPES.INFO,
    status = NOTIFICATION_STATUS.UNREAD,
    relatedObjectType,
    relatedObjectId
  } = req.body;

  // Validation
  if (!recipientId || !recipientRole || !title || !message) {
    throw AppError.badRequest('Missing required fields');
  }

  if (!Object.values(ROLES).includes(recipientRole)) {
    throw AppError.badRequest('Invalid recipient role');
  }

  if (!Object.values(NOTIFICATION_TYPES).includes(type)) {
    throw AppError.badRequest('Invalid notification type');
  }

  const notification = await Notification.create({
    notificationId: notificationId || generateLogId().replace('LOG-', 'NOT-'),
    recipientId,
    recipientRole,
    title,
    message,
    type,
    status,
    relatedObjectType,
    relatedObjectId,
    timestamp: new Date()
  });

  res.status(201).json({
    success: true,
    message: 'Notification created successfully',
    data: notification
  });
});

/**
 * @desc    Update notification status
 * @route   PATCH /api/notifications/:id/status
 */
exports.updateNotificationStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (!status || !Object.values(NOTIFICATION_STATUS).includes(status)) {
    throw AppError.badRequest('Invalid status');
  }

  const notification = await Notification.findOneAndUpdate(
    { notificationId: req.params.id },
    { status },
    { new: true }
  );

  if (!notification) {
    throw AppError.notFound('Notification not found');
  }

  res.status(200).json({
    success: true,
    message: 'Notification status updated',
    data: notification
  });
});

/**
 * @desc    Mark multiple notifications as read
 * @route   PATCH /api/notifications/bulk/read
 */
exports.markMultipleAsRead = asyncHandler(async (req, res) => {
  const { notificationIds } = req.body;

  if (!notificationIds || !Array.isArray(notificationIds)) {
    throw AppError.badRequest('Invalid request data');
  }

  const result = await Notification.updateMany(
    { notificationId: { $in: notificationIds } },
    { status: NOTIFICATION_STATUS.READ }
  );

  res.status(200).json({
    success: true,
    message: 'Notifications marked as read',
    data: {
      modifiedCount: result.modifiedCount,
      matchedCount: result.matchedCount
    }
  });
});

/**
 * @desc    Delete notification
 * @route   DELETE /api/notifications/:id
 */
exports.deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndDelete({ notificationId: req.params.id });

  if (!notification) {
    throw AppError.notFound('Notification not found');
  }

  res.status(200).json({
    success: true,
    message: 'Notification deleted successfully',
    data: notification
  });
});

/**
 * @desc    Get unread notification count
 * @route   GET /api/notifications/count/unread
 * @query   recipientId, recipientRole
 */
exports.getUnreadCount = asyncHandler(async (req, res) => {
  const { recipientId, recipientRole } = req.query;

  const filter = {
    status: NOTIFICATION_STATUS.UNREAD
  };

  if (recipientId) filter.recipientId = recipientId;
  if (recipientRole) filter.recipientRole = recipientRole;

  const count = await Notification.countDocuments(filter);

  res.status(200).json({
    success: true,
    data: { unreadCount: count }
  });
});

/**
 * @desc    Clear old notifications
 * @route   DELETE /api/notifications/bulk/old
 * @body    daysOld (default: 30)
 */
exports.clearOldNotifications = asyncHandler(async (req, res) => {
  const { daysOld = 30 } = req.body;

  const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);

  const result = await Notification.deleteMany({
    timestamp: { $lt: cutoffDate },
    status: NOTIFICATION_STATUS.READ
  });

  res.status(200).json({
    success: true,
    message: `Deleted ${result.deletedCount} old notifications`,
    data: { deletedCount: result.deletedCount }
  });
});

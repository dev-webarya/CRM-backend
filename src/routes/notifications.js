const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

// GET routes
router.get('/count/unread', notificationController.getUnreadCount);
router.get('/', notificationController.getAllNotifications);
router.get('/:id', notificationController.getNotificationById);

// POST routes
router.post('/', notificationController.createNotification);

// PATCH routes
router.patch('/:id/status', notificationController.updateNotificationStatus);
router.patch('/bulk/read', notificationController.markMultipleAsRead);

// DELETE routes
router.delete('/bulk/old', notificationController.clearOldNotifications);
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;

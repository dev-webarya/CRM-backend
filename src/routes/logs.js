const express = require('express');
const router = express.Router();
const logController = require('../controllers/logController');
const { protect, authorize } = require('../middleware/auth');

// GET routes
router.get('/stats/overview', protect, authorize('admin'), logController.getLogStats);
router.get('/audit/trail', protect, authorize('admin'), logController.getAuditTrail);
router.get('/export/json', protect, authorize('admin'), logController.exportLogs);
router.get('/actor/:actorUserId', protect, authorize('admin'), logController.getActorLogs);
router.get('/object/:objectId', protect, authorize('admin'), logController.getObjectLogs);
router.get('/', protect, authorize('admin'), logController.getAllLogs);
router.get('/:id', protect, authorize('admin'), logController.getLogById);

// DELETE routes
router.delete('/cleanup', protect, authorize('admin'), logController.deletOldLogs);

module.exports = router;

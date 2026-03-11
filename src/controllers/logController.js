const LogEntry = require('../models/LogEntry');
const AppError = require('../utils/AppError');
const asyncHandler = require('../middleware/asyncHandler');
const { ACTION_TYPES, OBJECT_TYPES } = require('../constants/enums');

/**
 * @desc    Get all audit logs with filtering
 * @route   GET /api/logs
 * @query   actorRole, actionType, objectType, page, limit, fromDate, toDate
 */
exports.getAllLogs = asyncHandler(async (req, res) => {
  const { actorRole, actionType, objectType, page = 1, limit = 20, fromDate, toDate } = req.query;
  const skip = (page - 1) * limit;

  // Build filter
  const filter = {};
  if (actorRole) filter.actorRole = actorRole;
  if (actionType) filter.actionType = actionType;
  if (objectType) filter.objectType = objectType;

  // Date range filter
  if (fromDate || toDate) {
    filter.timestamp = {};
    if (fromDate) filter.timestamp.$gte = new Date(fromDate);
    if (toDate) filter.timestamp.$lte = new Date(toDate);
  }

  const logs = await LogEntry.find(filter)
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ timestamp: -1 });

  const total = await LogEntry.countDocuments(filter);

  res.status(200).json({
    success: true,
    data: logs,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    }
  });
});

/**
 * @desc    Get single log entry by ID
 * @route   GET /api/logs/:id
 */
exports.getLogById = asyncHandler(async (req, res) => {
  const log = await LogEntry.findOne({ logId: req.params.id });

  if (!log) {
    throw AppError.notFound('Log entry not found');
  }

  res.status(200).json({
    success: true,
    data: log
  });
});

/**
 * @desc    Get logs for a specific object
 * @route   GET /api/logs/object/:objectId
 * @query   objectType
 */
exports.getObjectLogs = asyncHandler(async (req, res) => {
  const { objectType } = req.query;
  const { objectId } = req.params;

  if (!objectType) {
    throw AppError.badRequest('Object type is required');
  }

  const filter = {
    objectId,
    objectType
  };

  const logs = await LogEntry.find(filter).sort({ timestamp: -1 });

  res.status(200).json({
    success: true,
    data: logs
  });
});

/**
 * @desc    Get logs by actor/user
 * @route   GET /api/logs/actor/:actorUserId
 */
exports.getActorLogs = asyncHandler(async (req, res) => {
  const { actorUserId } = req.params;
  const { page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;

  const logs = await LogEntry.find({ actorUserId })
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ timestamp: -1 });

  const total = await LogEntry.countDocuments({ actorUserId });

  res.status(200).json({
    success: true,
    data: logs,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    }
  });
});

/**
 * @desc    Get audit trail for change tracking
 * @route   GET /api/logs/audit/trail
 * @query   objectId, objectType
 */
exports.getAuditTrail = asyncHandler(async (req, res) => {
  const { objectId, objectType } = req.query;

  if (!objectId || !objectType) {
    throw AppError.badRequest('Object ID and type are required');
  }

  const logs = await LogEntry.find({
    objectId,
    objectType,
    actionType: { $in: [ACTION_TYPES.CREATE, ACTION_TYPES.UPDATE, ACTION_TYPES.DELETE] }
  }).sort({ timestamp: 1 });

  // Build audit trail with before/after comparison
  const auditTrail = logs.map((log, index) => ({
    logId: log.logId,
    timestamp: log.timestamp,
    actorUserId: log.actorUserId,
    actorRole: log.actorRole,
    actionType: log.actionType,
    before: log.before,
    after: log.after,
    remarks: log.remarks,
    sequenceNumber: index + 1
  }));

  res.status(200).json({
    success: true,
    data: auditTrail
  });
});

/**
 * @desc    Get log statistics
 * @route   GET /api/logs/stats/overview
 */
exports.getLogStats = asyncHandler(async (req, res) => {
  const actionStats = await LogEntry.aggregate([
    {
      $group: {
        _id: '$actionType',
        count: { $sum: 1 }
      }
    }
  ]);

  const objectStats = await LogEntry.aggregate([
    {
      $group: {
        _id: '$objectType',
        count: { $sum: 1 }
      }
    }
  ]);

  const roleStats = await LogEntry.aggregate([
    {
      $group: {
        _id: '$actorRole',
        count: { $sum: 1 }
      }
    }
  ]);

  const totalLogs = await LogEntry.countDocuments();

  res.status(200).json({
    success: true,
    data: {
      totalLogs,
      actionTypeWise: actionStats,
      objectTypeWise: objectStats,
      actorRoleWise: roleStats
    }
  });
});

/**
 * @desc    Export logs to JSON
 * @route   GET /api/logs/export/json
 * @query   fromDate, toDate, actionType, objectType
 */
exports.exportLogs = asyncHandler(async (req, res) => {
  const { fromDate, toDate, actionType, objectType } = req.query;

  const filter = {};
  if (actionType) filter.actionType = actionType;
  if (objectType) filter.objectType = objectType;

  if (fromDate || toDate) {
    filter.timestamp = {};
    if (fromDate) filter.timestamp.$gte = new Date(fromDate);
    if (toDate) filter.timestamp.$lte = new Date(toDate);
  }

  const logs = await LogEntry.find(filter).sort({ timestamp: -1 });

  res.status(200).json({
    success: true,
    data: logs,
    exportedAt: new Date().toISOString(),
    recordCount: logs.length
  });
});

/**
 * @desc    Delete old logs
 * @route   DELETE /api/logs/cleanup
 * @body    daysOld (default: 90)
 */
exports.deletOldLogs = asyncHandler(async (req, res) => {
  const { daysOld = 90 } = req.body;

  const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);

  const result = await LogEntry.deleteMany({
    timestamp: { $lt: cutoffDate }
  });

  res.status(200).json({
    success: true,
    message: `Deleted ${result.deletedCount} old log entries`,
    data: { deletedCount: result.deletedCount }
  });
});

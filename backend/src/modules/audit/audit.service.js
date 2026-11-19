/**
 * @file audit.service.js
 * @description Domain query, analytics, export, and retention service for immutable audit logs.
 */

import { AuditLog } from '../../models/auditLog.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { AuditService } from '../../services/audit.service.js';
import dayjs from 'dayjs';

/**
 * Build Mongoose query from filters
 */
const buildAuditFilterQuery = (filters = {}) => {
  const query = {};

  if (filters.module) {
    query.module = filters.module.toLowerCase();
  }

  if (filters.action) {
    query.action = filters.action;
  }

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.severity) {
    query.severity = filters.severity;
  }

  if (filters.category) {
    query.category = filters.category;
  }

  if (filters.actorRole) {
    query.actorRole = filters.actorRole;
  }

  if (filters.actorId) {
    query.actorId = filters.actorId;
  }

  if (filters.targetId) {
    query.targetId = filters.targetId;
  }

  if (filters.targetModel) {
    query.targetModel = filters.targetModel;
  }

  if (typeof filters.isArchived === 'boolean') {
    query.isArchived = filters.isArchived;
  }

  // Date range filters based on createdAt (UTC)
  if (filters.startDate || filters.endDate) {
    query.createdAt = {};
    if (filters.startDate) {
      query.createdAt.$gte = dayjs(filters.startDate).startOf('day').toDate();
    }
    if (filters.endDate) {
      query.createdAt.$lte = dayjs(filters.endDate).endOf('day').toDate();
    }
  }

  // Text search on actorEmail, action, targetModel, description, or module
  if (filters.search) {
    const escapedSearch = filters.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const searchRegex = new RegExp(escapedSearch, 'i');
    query.$or = [
      { actorEmail: searchRegex },
      { action: searchRegex },
      { targetModel: searchRegex },
      { description: searchRegex },
      { module: searchRegex }
    ];
  }

  return query;
};

/**
 * Query paginated audit log entries with granular filter parameters
 * @param {Object} filters
 * @param {Object} pagination
 * @returns {Promise<{ items: Array, total: number, page: number, limit: number, totalPages: number }>}
 */
export const queryAuditLogs = async (filters = {}, pagination = {}) => {
  const page = Math.max(1, parseInt(pagination.page, 10) || 1);
  const limit = Math.min(200, Math.max(1, parseInt(pagination.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const query = buildAuditFilterQuery(filters);

  const [items, total] = await Promise.all([
    AuditLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('actorId', 'email firstName lastName profilePicture')
      .lean(),
    AuditLog.countDocuments(query)
  ]);

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1
  };
};

/**
 * Retrieve a single audit log entry by ID for forensic inspection
 * @param {string} id
 * @returns {Promise<Object>}
 */
export const getAuditLogById = async (id) => {
  const log = await AuditLog.findById(id)
    .populate('actorId', 'email firstName lastName profilePicture')
    .lean();

  if (!log) {
    throw new ApiError(404, 'Audit log entry not found');
  }

  return log;
};

/**
 * Compute real-time dashboard statistics across audit logs
 * @param {Object} filters
 * @returns {Promise<Object>}
 */
export const getAuditStats = async (filters = {}) => {
  const now = dayjs();
  const startOfToday = now.startOf('day').toDate();
  const startOfWeek = now.subtract(7, 'day').startOf('day').toDate();
  const startOfMonth = now.subtract(30, 'day').startOf('day').toDate();

  const baseQuery = buildAuditFilterQuery(filters);

  const [
    totalEvents,
    todayEvents,
    thisWeekEvents,
    thisMonthEvents,
    successEvents,
    failureEvents,
    securityEvents,
    adminEvents,
    criticalEvents,
    uniqueActors
  ] = await Promise.all([
    AuditLog.countDocuments(baseQuery),
    AuditLog.countDocuments({ ...baseQuery, createdAt: { $gte: startOfToday } }),
    AuditLog.countDocuments({ ...baseQuery, createdAt: { $gte: startOfWeek } }),
    AuditLog.countDocuments({ ...baseQuery, createdAt: { $gte: startOfMonth } }),
    AuditLog.countDocuments({ ...baseQuery, status: 'SUCCESS' }),
    AuditLog.countDocuments({ ...baseQuery, status: 'FAILURE' }),
    AuditLog.countDocuments({ ...baseQuery, category: 'SECURITY' }),
    AuditLog.countDocuments({ ...baseQuery, category: 'ADMINISTRATIVE' }),
    AuditLog.countDocuments({ ...baseQuery, severity: { $in: ['HIGH', 'CRITICAL'] } }),
    AuditLog.distinct('actorEmail', baseQuery)
  ]);

  const successRate = totalEvents > 0 ? Number(((successEvents / totalEvents) * 100).toFixed(1)) : 100;

  return {
    totalEvents,
    todayEvents,
    thisWeekEvents,
    thisMonthEvents,
    successEvents,
    failureEvents,
    successRate,
    securityEvents,
    adminEvents,
    criticalEvents,
    activeActorsCount: uniqueActors.length
  };
};

/**
 * Aggregate activity velocity timeline, module distributions, and security trends
 * @param {Object} params
 * @returns {Promise<Object>}
 */
export const getAuditAnalytics = async (params = {}) => {
  const { timeRange = '7d', module: moduleFilter, startDate, endDate } = params;

  let start = dayjs().subtract(7, 'day').startOf('day').toDate();
  let end = dayjs().endOf('day').toDate();
  let groupFormat = '%Y-%m-%d';

  if (timeRange === '24h') {
    start = dayjs().subtract(24, 'hour').toDate();
    groupFormat = '%Y-%m-%d %H:00';
  } else if (timeRange === '30d') {
    start = dayjs().subtract(30, 'day').startOf('day').toDate();
  } else if (timeRange === '90d') {
    start = dayjs().subtract(90, 'day').startOf('day').toDate();
  } else if (timeRange === 'custom' && startDate && endDate) {
    start = dayjs(startDate).startOf('day').toDate();
    end = dayjs(endDate).endOf('day').toDate();
  }

  const matchStage = {
    createdAt: { $gte: start, $lte: end }
  };

  if (moduleFilter) {
    matchStage.module = String(moduleFilter).toLowerCase();
  }

  // 1. Timeline throughput
  const timelineData = await AuditLog.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: { $dateToString: { format: groupFormat, date: '$createdAt' } },
        total: { $sum: 1 },
        success: {
          $sum: { $cond: [{ $eq: ['$status', 'SUCCESS'] }, 1, 0] }
        },
        failure: {
          $sum: { $cond: [{ $eq: ['$status', 'FAILURE'] }, 1, 0] }
        }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // 2. Module distribution
  const moduleDistribution = await AuditLog.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$module',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);

  // 3. Top actions
  const actionDistribution = await AuditLog.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$action',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);

  // 4. Category breakdown
  const categoryDistribution = await AuditLog.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);

  // 5. Severity breakdown
  const severityDistribution = await AuditLog.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$severity',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);

  // 6. Security trends
  const securityTrends = await AuditLog.aggregate([
    {
      $match: {
        ...matchStage,
        $or: [
          { category: 'SECURITY' },
          { severity: { $in: ['HIGH', 'CRITICAL'] } },
          { status: 'FAILURE' }
        ]
      }
    },
    {
      $group: {
        _id: '$action',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 8 }
  ]);

  return {
    timeRange,
    timeline: timelineData.map((d) => ({
      date: d._id,
      total: d.total,
      success: d.success,
      failure: d.failure
    })),
    moduleDistribution: moduleDistribution.map((m) => ({
      module: m._id || 'unknown',
      count: m.count
    })),
    actionDistribution: actionDistribution.map((a) => ({
      action: a._id || 'unknown',
      count: a.count
    })),
    categoryDistribution: categoryDistribution.map((c) => ({
      category: c._id || 'DATA_CHANGE',
      count: c.count
    })),
    severityDistribution: severityDistribution.map((s) => ({
      severity: s._id || 'LOW',
      count: s.count
    })),
    securityTrends: securityTrends.map((st) => ({
      action: st._id || 'unknown',
      count: st.count
    }))
  };
};

/**
 * Stream-friendly export of audit log records (CSV format)
 * @param {Object} filters
 * @param {Object} actor
 * @returns {Promise<string>}
 */
export const exportAuditLogs = async (filters = {}, actor = null) => {
  const query = buildAuditFilterQuery(filters);

  // Maximum cap of 10,000 records to prevent memory exhaustion
  const logs = await AuditLog.find(query)
    .sort({ createdAt: -1 })
    .limit(10000)
    .lean();

  const headers = [
    'Event ID',
    'Timestamp (UTC)',
    'Timestamp (PKT)',
    'Actor Email',
    'Actor Role',
    'Action',
    'Module',
    'Target Model',
    'Target ID',
    'Category',
    'Severity',
    'Status',
    'Description',
    'Client IP',
    'Browser',
    'OS',
    'Device Type'
  ];

  const escapeCsv = (str) => {
    if (str === null || str === undefined) return '""';
    const s = String(str).replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows = logs.map((log) => [
    escapeCsv(log._id),
    escapeCsv(dayjs(log.createdAt).toISOString()),
    escapeCsv(dayjs(log.createdAt).add(5, 'hour').format('YYYY-MM-DD HH:mm:ss')),
    escapeCsv(log.actorEmail),
    escapeCsv(log.actorRole),
    escapeCsv(log.action),
    escapeCsv(log.module),
    escapeCsv(log.targetModel || 'N/A'),
    escapeCsv(log.targetId || 'N/A'),
    escapeCsv(log.category || 'DATA_CHANGE'),
    escapeCsv(log.severity || 'LOW'),
    escapeCsv(log.status || 'SUCCESS'),
    escapeCsv(log.description || ''),
    escapeCsv(log.ipAddress || 'Internal'),
    escapeCsv(log.device?.browser || 'Unknown'),
    escapeCsv(log.device?.os || 'Unknown'),
    escapeCsv(log.device?.deviceType || 'Unknown')
  ]);

  const csvContent = '\ufeff' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

  // Record audit log for the export operation itself
  if (actor) {
    await AuditService.log({
      actorId: actor._id || null,
      actorEmail: actor.email || 'system',
      actorRole: actor.roles?.[0]?.name || actor.roles?.[0] || 'SYSTEM',
      action: 'AUDIT_LOGS_EXPORTED',
      module: 'audit',
      status: 'SUCCESS',
      severity: 'MEDIUM',
      category: 'ADMINISTRATIVE',
      description: `Audit trail records exported (${logs.length} rows) by ${actor.email || 'system'}`,
      details: {
        exportedRows: logs.length,
        filterParams: filters
      }
    });
  }

  return csvContent;
};

/**
 * Retrieve statutory retention and archival summary
 * @returns {Promise<Object>}
 */
export const getRetentionSummary = async () => {
  const [totalActive, totalArchived, oldestRecord, newestRecord] = await Promise.all([
    AuditLog.countDocuments({ isArchived: { $ne: true } }),
    AuditLog.countDocuments({ isArchived: true }),
    AuditLog.findOne({}).sort({ createdAt: 1 }).select('createdAt').lean(),
    AuditLog.findOne({}).sort({ createdAt: -1 }).select('createdAt').lean()
  ]);

  return {
    totalActive,
    totalArchived,
    oldestRecordDate: oldestRecord?.createdAt || null,
    newestRecordDate: newestRecord?.createdAt || null,
    statutoryRetentionDays: 365,
    immutablePolicyEnforced: true
  };
};

/**
 * Soft-archive audit logs older than N days (retained in DB, flagged archived)
 * @param {Object} options
 * @param {Object} actor
 * @returns {Promise<{ archivedCount: number }>}
 */
export const archiveAuditLogs = async ({ olderThanDays = 90 }, actor = null) => {
  const cutoffDate = dayjs().subtract(olderThanDays, 'day').toDate();

  const result = await AuditLog.updateMany(
    {
      createdAt: { $lt: cutoffDate },
      isArchived: false
    },
    {
      $set: {
        isArchived: true,
        archivedAt: new Date()
      }
    }
  );

  if (actor) {
    await AuditService.log({
      actorId: actor._id || null,
      actorEmail: actor.email || 'system',
      actorRole: actor.roles?.[0]?.name || actor.roles?.[0] || 'SYSTEM',
      action: 'AUDIT_LOGS_ARCHIVED',
      module: 'audit',
      status: 'SUCCESS',
      severity: 'HIGH',
      category: 'ADMINISTRATIVE',
      description: `Soft-archived ${result.modifiedCount} audit log records older than ${olderThanDays} days`,
      details: {
        olderThanDays,
        cutoffDate,
        archivedCount: result.modifiedCount
      }
    });
  }

  return {
    archivedCount: result.modifiedCount
  };
};

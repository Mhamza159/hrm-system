/**
 * @file audit.service.js
 * @description Domain query service for immutable audit logs and forensic state diffs.
 */

import { AuditLog } from '../../models/auditLog.model.js';
import { ApiError } from '../../utils/ApiError.js';
import dayjs from 'dayjs';

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

  const query = {};

  if (filters.module) {
    query.module = filters.module.toLowerCase();
  }

  if (filters.action) {
    query.action = filters.action;
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

  // Text search on actorEmail, action, or targetModel
  if (filters.search) {
    const escapedSearch = filters.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const searchRegex = new RegExp(escapedSearch, 'i');
    query.$or = [
      { actorEmail: searchRegex },
      { action: searchRegex },
      { targetModel: searchRegex }
    ];
  }

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

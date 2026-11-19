/**
 * @file audit.controller.js
 * @description HTTP Controller for system audit logs, real-time analytics, export, and retention.
 */

import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { auditQuerySchema, auditStatsQuerySchema, auditAnalyticsQuerySchema } from './audit.validation.js';
import * as auditService from './audit.service.js';

/**
 * GET /api/v1/audit-logs
 * Retrieve paginated audit logs matching filter parameters
 */
export const getAuditLogs = asyncHandler(async (req, res) => {
  const validatedQuery = auditQuerySchema.parse(req.query);

  const filters = {
    module: validatedQuery.module,
    action: validatedQuery.action,
    status: validatedQuery.status,
    severity: validatedQuery.severity,
    category: validatedQuery.category,
    actorRole: validatedQuery.actorRole,
    actorId: validatedQuery.actorId,
    targetId: validatedQuery.targetId,
    targetModel: validatedQuery.targetModel,
    isArchived: validatedQuery.isArchived,
    startDate: validatedQuery.startDate,
    endDate: validatedQuery.endDate,
    search: validatedQuery.search
  };

  const pagination = {
    page: validatedQuery.page,
    limit: validatedQuery.limit
  };

  const result = await auditService.queryAuditLogs(filters, pagination);

  return res.status(200).json(
    new ApiResponse(200, result.items, 'Audit logs retrieved successfully', {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages
    })
  );
});

/**
 * GET /api/v1/audit-logs/stats
 * Retrieve real-time dashboard summary metrics
 */
export const getAuditStats = asyncHandler(async (req, res) => {
  const validatedQuery = auditStatsQuerySchema.parse(req.query);
  const stats = await auditService.getAuditStats(validatedQuery);

  return res.status(200).json(
    new ApiResponse(200, stats, 'Audit statistics retrieved successfully')
  );
});

/**
 * GET /api/v1/audit-logs/analytics
 * Retrieve activity velocity, module distributions, and security trends
 */
export const getAuditAnalytics = asyncHandler(async (req, res) => {
  const validatedQuery = auditAnalyticsQuerySchema.parse(req.query);
  const analytics = await auditService.getAuditAnalytics(validatedQuery);

  return res.status(200).json(
    new ApiResponse(200, analytics, 'Audit analytics retrieved successfully')
  );
});

/**
 * GET /api/v1/audit-logs/export
 * Export audit logs in CSV format
 */
export const exportAuditLogs = asyncHandler(async (req, res) => {
  const validatedQuery = auditQuerySchema.parse(req.query);
  const csvData = await auditService.exportAuditLogs(validatedQuery, req.user);

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="audit-logs-${new Date().toISOString().slice(0, 10)}.csv"`
  );

  return res.status(200).send(csvData);
});

/**
 * GET /api/v1/audit-logs/retention
 * Retrieve retention and archival statistics
 */
export const getRetentionSummary = asyncHandler(async (req, res) => {
  const summary = await auditService.getRetentionSummary();

  return res.status(200).json(
    new ApiResponse(200, summary, 'Retention summary retrieved successfully')
  );
});

/**
 * POST /api/v1/audit-logs/archive
 * Soft-archive records older than specified days
 */
export const archiveAuditLogs = asyncHandler(async (req, res) => {
  const olderThanDays = Math.max(30, parseInt(req.body.olderThanDays, 10) || 90);
  const result = await auditService.archiveAuditLogs({ olderThanDays }, req.user);

  return res.status(200).json(
    new ApiResponse(200, result, `Archived ${result.archivedCount} records successfully`)
  );
});

/**
 * GET /api/v1/audit-logs/:id
 * Retrieve a single audit log with full before/after diff metadata
 */
export const getAuditLog = asyncHandler(async (req, res) => {
  const log = await auditService.getAuditLogById(req.params.id);

  return res.status(200).json(
    new ApiResponse(200, log, 'Audit log retrieved successfully')
  );
});

/**
 * @file audit.controller.js
 * @description HTTP Controller for system audit logs and forensic state diffs.
 */

import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { auditQuerySchema } from './audit.validation.js';
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
    actorId: validatedQuery.actorId,
    targetId: validatedQuery.targetId,
    targetModel: validatedQuery.targetModel,
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
 * GET /api/v1/audit-logs/:id
 * Retrieve a single audit log with full before/after diff metadata
 */
export const getAuditLog = asyncHandler(async (req, res) => {
  const log = await auditService.getAuditLogById(req.params.id);

  return res.status(200).json(
    new ApiResponse(200, log, 'Audit log retrieved successfully')
  );
});

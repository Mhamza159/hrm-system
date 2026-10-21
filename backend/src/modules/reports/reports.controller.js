/**
 * @file reports.controller.js
 * @description HTTP Controllers for Multi-Axis Reports and Streaming Exporters.
 */

import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { ApiError } from '../../utils/ApiError.js';
import { reportQuerySchema } from './reports.validation.js';
import * as reportsService from './reports.service.js';
import { generateExcelReport, generatePdfReport } from '../../services/reportExport.service.js';
import { recordAuditLog } from '../../services/audit.service.js';

export const getReport = asyncHandler(async (req, res) => {
  // 1. Merge type param into query and validate via Zod
  const queryParams = {
    type: req.params.type,
    ...req.query
  };
  const validatedQuery = reportQuerySchema.parse(queryParams);

  // 2. Extract user scope from CASL / request user
  const userRoles = Array.isArray(req.user?.roles)
    ? req.user.roles.map((r) => (typeof r === 'object' ? r.name : r))
    : [];
  const isSuperAdminOrHr =
    req.user?.isSuperAdmin ||
    userRoles.includes('Super Admin') ||
    userRoles.includes('HR Manager');
  const userScope = req.permissionScope || (isSuperAdminOrHr ? 'all' : 'team');

  // 3. Generate Report Data
  const reportData = await reportsService.generateReportData({
    ...validatedQuery,
    user: req.user,
    userScope
  });

  // 4. Handle Streaming Exports
  if (validatedQuery.format === 'xlsx' || validatedQuery.format === 'pdf') {
    const canExport =
      !req.ability ||
      req.ability.can('manage', 'all') ||
      req.ability.can('report.export', 'all') ||
      req.ability.can('report.export', 'Report') ||
      req.ability.can('report.export', 'team') ||
      req.ability.can('report.export', 'department') ||
      req.ability.can('report.export', 'own');

    if (!canExport) {
      throw new ApiError(
        403,
        "Forbidden: You lack the required permission ('report.export') to export reports."
      );
    }

    if (validatedQuery.format === 'xlsx') {
      const buffer = await generateExcelReport({
        title: reportData.title,
        columns: reportData.columns,
        rows: reportData.items
      });

      await recordAuditLog({
        actor: req.user,
        action: 'report.export',
        entity: 'Report',
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        details: {
          type: validatedQuery.type,
          format: 'xlsx',
          totalRecords: reportData.totalRecords || (reportData.items ? reportData.items.length : 0)
        }
      });

      const filename = `${validatedQuery.type}-report_${new Date().toISOString().slice(0, 10)}.xlsx`;
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.status(200).send(buffer);
    }

    if (validatedQuery.format === 'pdf') {
      const buffer = await generatePdfReport({
        title: reportData.title,
        columns: reportData.columns,
        rows: reportData.items
      });

      await recordAuditLog({
        actor: req.user,
        action: 'report.export',
        entity: 'Report',
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        details: {
          type: validatedQuery.type,
          format: 'pdf',
          totalRecords: reportData.totalRecords || (reportData.items ? reportData.items.length : 0)
        }
      });

      const filename = `${validatedQuery.type}-report_${new Date().toISOString().slice(0, 10)}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.status(200).send(buffer);
    }
  }

  // 5. Default JSON Response
  return res.status(200).json(
    new ApiResponse(200, reportData, 'Report generated successfully')
  );
});

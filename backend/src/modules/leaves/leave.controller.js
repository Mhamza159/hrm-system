/**
 * @file leave.controller.js
 * @description HTTP Controllers for Module M6 Leave & Holidays.
 * 
 * SPECIFICATION:
 * - Module: M6 Leave & Holidays (BUILD-GUIDE Section 11 · Rows 6.1 - 6.15)
 * - Layer: Controller (Parses input, calls service, formats standard envelope)
 */

import fs from 'fs';
import path from 'path';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/apiError.js';
import { Employee } from '../../models/employee.model.js';
import { isCloudinaryConfigured, uploadBufferToCloudinary } from '../../config/cloudinary.js';
import { seedPakistanHolidays } from '../../seed/holidays.seed.js';
import * as leaveService from './leave.service.js';

/**
 * 6.1: Create a new leave type
 * POST /api/v1/leave-types
 */
export const createLeaveType = asyncHandler(async (req, res) => {
  const leaveType = await leaveService.createLeaveType(req.body, req.user);
  res.status(201).json({
    success: true,
    statusCode: 201,
    data: leaveType,
    message: 'Leave type created successfully'
  });
});

/**
 * 6.1: Get all leave types
 * GET /api/v1/leave-types
 */
export const getLeaveTypes = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.activeOnly === 'true') {
    filter.isActive = true;
  }
  const leaveTypes = await leaveService.getLeaveTypes(filter);
  res.status(200).json({
    success: true,
    statusCode: 200,
    data: leaveTypes,
    message: 'Leave types retrieved successfully'
  });
});

/**
 * 6.1: Get leave type by ID
 * GET /api/v1/leave-types/:id
 */
export const getLeaveTypeById = asyncHandler(async (req, res) => {
  const leaveType = await leaveService.getLeaveTypeById(req.params.id);
  res.status(200).json({
    success: true,
    statusCode: 200,
    data: leaveType,
    message: 'Leave type retrieved successfully'
  });
});

/**
 * 6.1: Update leave type by ID
 * PATCH /api/v1/leave-types/:id
 */
export const updateLeaveType = asyncHandler(async (req, res) => {
  const leaveType = await leaveService.updateLeaveType(req.params.id, req.body, req.user);
  res.status(200).json({
    success: true,
    statusCode: 200,
    data: leaveType,
    message: 'Leave type updated successfully'
  });
});

/**
 * 6.1: Soft-delete / deactivate leave type
 * DELETE /api/v1/leave-types/:id
 */
export const deleteLeaveType = asyncHandler(async (req, res) => {
  const leaveType = await leaveService.deleteLeaveType(req.params.id, req.user);
  res.status(200).json({
    success: true,
    statusCode: 200,
    data: leaveType,
    message: 'Leave type deactivated successfully'
  });
});

/**
 * 6.11: Create a public holiday
 * POST /api/v1/holidays
 */
export const createHoliday = asyncHandler(async (req, res) => {
  const holiday = await leaveService.createHoliday(req.body, req.user);
  res.status(201).json({
    success: true,
    statusCode: 201,
    data: holiday,
    message: 'Holiday created successfully'
  });
});

/**
 * 6.11: Get all holidays
 * GET /api/v1/holidays
 */
export const getHolidays = asyncHandler(async (req, res) => {
  const holidays = await leaveService.getHolidays(req.query);
  res.status(200).json({
    success: true,
    statusCode: 200,
    data: holidays,
    message: 'Holidays retrieved successfully'
  });
});

/**
 * 6.11: Get holiday by ID
 * GET /api/v1/holidays/:id
 */
export const getHolidayById = asyncHandler(async (req, res) => {
  const holiday = await leaveService.getHolidayById(req.params.id);
  res.status(200).json({
    success: true,
    statusCode: 200,
    data: holiday,
    message: 'Holiday retrieved successfully'
  });
});

/**
 * 6.11: Update holiday
 * PATCH /api/v1/holidays/:id
 */
export const updateHoliday = asyncHandler(async (req, res) => {
  const holiday = await leaveService.updateHoliday(req.params.id, req.body, req.user);
  res.status(200).json({
    success: true,
    statusCode: 200,
    data: holiday,
    message: 'Holiday updated successfully'
  });
});

/**
 * 6.11: Delete / deactivate holiday
 * DELETE /api/v1/holidays/:id
 */
export const deleteHoliday = asyncHandler(async (req, res) => {
  const holiday = await leaveService.deleteHoliday(req.params.id, req.user);
  res.status(200).json({
    success: true,
    statusCode: 200,
    data: holiday,
    message: 'Holiday deleted successfully'
  });
});

/**
 * 6.11: Seed Pakistan official gazetted and public holidays
 * POST /api/v1/holidays/seed
 */
export const seedHolidays = asyncHandler(async (req, res) => {
  const year = req.body.year ? parseInt(req.body.year, 10) : new Date().getUTCFullYear();
  const actorId = req.user?._id;
  const result = await seedPakistanHolidays(year, actorId);
  res.status(200).json({
    success: true,
    statusCode: 200,
    data: result,
    message: `Successfully seeded ${result.seeded} Pakistan official holidays for year ${year}`
  });
});

/**
 * 6.9: Get live leave balance for authenticated user or scoped subordinate
 * GET /api/v1/leaves/balance?employeeId=xxx&year=2026
 */
export const getLeaveBalance = asyncHandler(async (req, res) => {
  let targetEmployeeId;
  const requestedEmployeeId = req.query.employeeId;
  const year = req.query.year ? parseInt(req.query.year, 10) : new Date().getUTCFullYear();
  const callerEmployeeId = req.user.employeeId?.toString();
  const scope = req.permissionScope || 'own';

  if (requestedEmployeeId) {
    if (callerEmployeeId && requestedEmployeeId === callerEmployeeId) {
      targetEmployeeId = requestedEmployeeId;
    } else {
      if (scope === 'own') {
        throw new ApiError(403, 'Forbidden: You only have permission to view your own leave balance.');
      } else if (scope === 'team') {
        const targetEmp = await Employee.findById(requestedEmployeeId).lean();
        if (!targetEmp) {
          throw new ApiError(404, 'Employee record not found');
        }
        const isTeamMember =
          String(targetEmp.managerId) === String(callerEmployeeId) ||
          String(targetEmp.managerId) === String(req.user._id);
        if (!isTeamMember) {
          throw new ApiError(403, 'Forbidden: This employee is not in your direct team reporting line.');
        }
        targetEmployeeId = requestedEmployeeId;
      } else {
        // 'department' or 'all'
        targetEmployeeId = requestedEmployeeId;
      }
    }
  } else {
    targetEmployeeId = await leaveService.resolveEmployeeId(req.user);
  }

  const balance = await leaveService.getEmployeeLeaveBalance(targetEmployeeId, year);
  res.status(200).json({
    success: true,
    statusCode: 200,
    data: balance,
    message: 'Leave balance retrieved successfully'
  });
});

/**
 * 6.3: Apply for leave
 * POST /api/v1/leaves
 */
export const applyLeave = asyncHandler(async (req, res) => {
  const employeeId = await leaveService.resolveEmployeeId(req.user);
  let attachmentUrl = req.body.attachmentUrl || null;

  if (req.file) {
    if (isCloudinaryConfigured() && req.file.buffer) {
      const cloudRes = await uploadBufferToCloudinary(req.file.buffer, {
        folder: 'hrm/leaves',
        resource_type: 'auto'
      });
      attachmentUrl = cloudRes.secure_url;
    } else {
      const leavesDir = path.resolve(process.cwd(), 'uploads/leaves');
      if (!fs.existsSync(leavesDir)) {
        fs.mkdirSync(leavesDir, { recursive: true });
      }
      const ext = path.extname(req.file.originalname) || '.pdf';
      const filename = `leave_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
      const filePath = path.join(leavesDir, filename);
      fs.writeFileSync(filePath, req.file.buffer);
      attachmentUrl = `/uploads/leaves/${filename}`;
    }
  }

  const payload = {
    ...req.body,
    attachmentUrl
  };

  const leave = await leaveService.applyLeave(employeeId, payload, req.user);
  res.status(201).json({
    success: true,
    statusCode: 201,
    data: leave,
    message: 'Leave application submitted successfully'
  });
});

/**
 * 6.3: Get my leave applications
 * GET /api/v1/leaves/my
 */
export const getMyLeaves = asyncHandler(async (req, res) => {
  const employeeId = await leaveService.resolveEmployeeId(req.user);
  const result = await leaveService.getMyLeaves(employeeId, req.query);
  res.status(200).json({
    success: true,
    statusCode: 200,
    data: result.items,
    meta: result.meta,
    message: 'Leave applications retrieved successfully'
  });
});

/**
 * 6.6 & 6.7: Get pending leave applications for approval
 * GET /api/v1/leaves/approvals
 */
export const getPendingApprovals = asyncHandler(async (req, res) => {
  const result = await leaveService.getPendingApprovals(req.user, req.query);
  res.status(200).json({
    success: true,
    statusCode: 200,
    data: result.items,
    meta: result.meta,
    message: 'Pending approvals retrieved successfully'
  });
});

/**
 * 6.7: Make approval or rejection decision
 * PATCH /api/v1/leaves/:id/decide
 */
export const decideLeave = asyncHandler(async (req, res) => {
  const { action, reason } = req.body;
  const leave = await leaveService.decideLeave(req.params.id, action, reason, req.user);
  res.status(200).json({
    success: true,
    statusCode: 200,
    data: leave,
    message: `Leave application ${action}d successfully`
  });
});

/**
 * 6.8: Cancel leave application
 * PATCH /api/v1/leaves/:id/cancel
 */
export const cancelLeave = asyncHandler(async (req, res) => {
  const { cancellationReason } = req.body;
  const leave = await leaveService.cancelLeave(req.params.id, cancellationReason, req.user);
  res.status(200).json({
    success: true,
    statusCode: 200,
    data: leave,
    message: 'Leave application cancelled and quota restored successfully'
  });
});

/**
 * 6.10: Get Team Leave Calendar & Conflict Heatmap
 * GET /api/v1/leaves/calendar
 */
export const getLeaveCalendar = asyncHandler(async (req, res) => {
  const data = await leaveService.getLeaveCalendar(req.query, req.user);
  res.status(200).json({
    success: true,
    statusCode: 200,
    data,
    message: 'Leave calendar and team conflict map retrieved successfully'
  });
});

/**
 * 6.13: Submit Leave Encashment Request
 * POST /api/v1/leaves/encash
 */
export const requestLeaveEncashment = asyncHandler(async (req, res) => {
  const employeeId = await leaveService.resolveEmployeeId(req.user);
  const encashment = await leaveService.requestLeaveEncashment(employeeId, req.body, req.user);
  res.status(201).json({
    success: true,
    statusCode: 201,
    data: encashment,
    message: 'Leave encashment request submitted successfully'
  });
});

/**
 * 6.13: Get Leave Encashment Records
 * GET /api/v1/leaves/encash
 */
export const getLeaveEncashments = asyncHandler(async (req, res) => {
  const data = await leaveService.getLeaveEncashments(req.query, req.user);
  res.status(200).json({
    success: true,
    statusCode: 200,
    data,
    message: 'Leave encashment records retrieved successfully'
  });
});

/**
 * 6.13: Decide Leave Encashment Request
 * PATCH /api/v1/leaves/encash/:id
 */
export const decideLeaveEncashment = asyncHandler(async (req, res) => {
  const data = await leaveService.decideLeaveEncashment(req.params.id, req.body, req.user);
  res.status(200).json({
    success: true,
    statusCode: 200,
    data,
    message: `Leave encashment request ${req.body.action}d successfully`
  });
});

/**
 * 6.14: HR Manual Leave Balance Adjustment & Audit Trail
 * PATCH /api/v1/leaves/balance/:id
 */
export const adjustLeaveBalance = asyncHandler(async (req, res) => {
  const data = await leaveService.adjustLeaveBalance(req.params.id, req.body, req.user);
  res.status(200).json({
    success: true,
    statusCode: 200,
    data,
    message: 'Leave balance adjusted and audit log recorded successfully'
  });
});

/**
 * 6.15: Leave Analytics & ExcelJS Report Export
 * GET /api/v1/leaves/export or /api/v1/reports/leaves
 */
export const exportLeaveReport = asyncHandler(async (req, res) => {
  const buffer = await leaveService.generateLeaveExcel({
    ...req.query,
    user: req.user
  });
  const filename = `Leave_Report_${req.query.year || new Date().toISOString().split('T')[0]}.xlsx`;

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  return res.status(200).send(buffer);
});

/**
 * @file project.controller.js
 * @description Controller Handlers for Module M22 Projects & Timesheets.
 * 
 * SPECIFICATION & SECURITY:
 * - Module: M22 Projects & Timesheets (BUILD-GUIDE Section 23 · Rows 22.1 to 22.7)
 * - Layer: Controller Layer (Extracts request parameters, delegates to service, standardized envelope)
 * - Standard Envelope: { success: true, statusCode, data, message, meta }
 */

import { asyncHandler } from '../../utils/asyncHandler.js';
import * as projectService from './project.service.js';
import { Employee } from '../../models/employee.model.js';
import { ApiError } from '../../utils/ApiError.js';

// =========================================================================
// ROW 22.1: CLIENT CONTROLLERS
// =========================================================================

export const createClient = asyncHandler(async (req, res) => {
  const client = await projectService.createClient({
    clientData: req.body,
    user: req.user,
    ipAddress: req.ip,
    userAgent: req.get('user-agent')
  });

  res.status(201).json({
    success: true,
    statusCode: 201,
    data: client,
    message: 'Client created successfully.'
  });
});

export const getClients = asyncHandler(async (req, res) => {
  const result = await projectService.getClients({ query: req.query });

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: result.data,
    meta: result.meta,
    message: 'Clients retrieved successfully.'
  });
});

export const getClientById = asyncHandler(async (req, res) => {
  const client = await projectService.getClientById(req.params.id);

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: client,
    message: 'Client details retrieved successfully.'
  });
});

export const updateClient = asyncHandler(async (req, res) => {
  const client = await projectService.updateClient({
    id: req.params.id,
    updateData: req.body,
    user: req.user,
    ipAddress: req.ip,
    userAgent: req.get('user-agent')
  });

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: client,
    message: 'Client updated successfully.'
  });
});

export const deleteClient = asyncHandler(async (req, res) => {
  const result = await projectService.deleteClient({
    id: req.params.id,
    user: req.user,
    ipAddress: req.ip,
    userAgent: req.get('user-agent')
  });

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: result.message
  });
});

// =========================================================================
// ROW 22.1: PROJECT CONTROLLERS
// =========================================================================

export const createProject = asyncHandler(async (req, res) => {
  const project = await projectService.createProject({
    projectData: req.body,
    user: req.user,
    ipAddress: req.ip,
    userAgent: req.get('user-agent')
  });

  res.status(201).json({
    success: true,
    statusCode: 201,
    data: project,
    message: 'Project created successfully.'
  });
});

export const getProjects = asyncHandler(async (req, res) => {
  const result = await projectService.getProjects({
    query: req.query,
    user: req.user,
    scope: req.permissionScope || 'all'
  });

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: result.data,
    meta: result.meta,
    message: 'Projects retrieved successfully.'
  });
});

export const getProjectById = asyncHandler(async (req, res) => {
  const project = await projectService.getProjectById(req.params.id);

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: project,
    message: 'Project details retrieved successfully.'
  });
});

export const updateProject = asyncHandler(async (req, res) => {
  const project = await projectService.updateProject({
    id: req.params.id,
    updateData: req.body,
    user: req.user,
    ipAddress: req.ip,
    userAgent: req.get('user-agent')
  });

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: project,
    message: 'Project updated successfully.'
  });
});

export const deleteProject = asyncHandler(async (req, res) => {
  const result = await projectService.deleteProject({
    id: req.params.id,
    user: req.user,
    ipAddress: req.ip,
    userAgent: req.get('user-agent')
  });

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: result.message
  });
});

// =========================================================================
// ROW 22.2: PROJECT MEMBERS ASSIGNMENT CONTROLLER
// =========================================================================

export const assignProjectMembers = asyncHandler(async (req, res) => {
  const project = await projectService.assignProjectMembers({
    projectId: req.params.id,
    members: req.body.members,
    user: req.user,
    ipAddress: req.ip,
    userAgent: req.get('user-agent')
  });

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: project,
    message: 'Project team members assigned successfully.'
  });
});

// =========================================================================
// ROW 22.3: TIMESHEET LOGGING CONTROLLERS
// =========================================================================

export const logTimeEntry = asyncHandler(async (req, res) => {
  // Resolve employee linked to user
  const employee = await Employee.findOne({ userId: req.user._id, isDeleted: false });
  if (!employee && !req.user.roles.includes('Super Admin')) {
    throw new ApiError(400, 'Current user does not have an active employee profile linked');
  }

  const timesheet = await projectService.logTimeEntry({
    employeeId: employee?._id || req.body.employeeId,
    projectId: req.body.projectId,
    date: req.body.date,
    hours: req.body.hours,
    taskDescription: req.body.taskDescription,
    isBillable: req.body.isBillable !== undefined ? req.body.isBillable : true,
    user: req.user,
    ipAddress: req.ip,
    userAgent: req.get('user-agent')
  });

  res.status(201).json({
    success: true,
    statusCode: 201,
    data: timesheet,
    message: 'Timesheet entry logged successfully.'
  });
});

export const getMyWeeklyTimesheets = asyncHandler(async (req, res) => {
  const employee = await Employee.findOne({ userId: req.user._id, isDeleted: false });
  if (!employee) {
    throw new ApiError(400, 'Current user is not linked to an employee profile');
  }

  const weekStartDate = req.query.weekStartDate || new Date().toISOString();
  const result = await projectService.getMyWeeklyTimesheets({
    employeeId: employee._id,
    weekStartDate
  });

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: result,
    message: 'Weekly timesheets retrieved successfully.'
  });
});

export const updateTimesheet = asyncHandler(async (req, res) => {
  const timesheet = await projectService.updateTimesheet({
    id: req.params.id,
    updateData: req.body,
    user: req.user,
    ipAddress: req.ip,
    userAgent: req.get('user-agent')
  });

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: timesheet,
    message: 'Timesheet entry updated successfully.'
  });
});

export const deleteTimesheet = asyncHandler(async (req, res) => {
  const result = await projectService.deleteTimesheet({
    id: req.params.id,
    user: req.user,
    ipAddress: req.ip,
    userAgent: req.get('user-agent')
  });

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: result.message
  });
});

// =========================================================================
// ROW 22.4: TIMESHEET SUBMISSION & APPROVAL CONTROLLERS
// =========================================================================

export const submitWeekTimesheets = asyncHandler(async (req, res) => {
  const employee = await Employee.findOne({ userId: req.user._id, isDeleted: false });
  if (!employee) {
    throw new ApiError(400, 'Current user is not linked to an employee profile');
  }

  const result = await projectService.submitWeekTimesheets({
    employeeId: employee._id,
    weekStartDate: req.body.weekStartDate,
    user: req.user,
    ipAddress: req.ip,
    userAgent: req.get('user-agent')
  });

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: result,
    message: result.message
  });
});

export const getPendingTimesheets = asyncHandler(async (req, res) => {
  const result = await projectService.getPendingTimesheets({
    query: req.query,
    user: req.user,
    scope: req.permissionScope || 'team'
  });

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: result.data,
    meta: result.meta,
    message: 'Pending timesheets retrieved successfully.'
  });
});

export const decideTimesheet = asyncHandler(async (req, res) => {
  const timesheet = await projectService.decideTimesheet({
    id: req.params.id,
    decision: req.body.decision,
    rejectionReason: req.body.rejectionReason,
    user: req.user,
    ipAddress: req.ip,
    userAgent: req.get('user-agent')
  });

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: timesheet,
    message: `Timesheet entry ${req.body.decision} successfully.`
  });
});

// =========================================================================
// ROW 22.5: UTILIZATION REPORT CONTROLLER
// =========================================================================

export const getUtilizationReport = asyncHandler(async (req, res) => {
  const report = await projectService.getUtilizationReport({
    query: req.query,
    user: req.user,
    scope: req.permissionScope || 'all'
  });

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: report,
    message: 'Utilization report generated successfully.'
  });
});

// =========================================================================
// ROW 22.6: PROJECT PROFITABILITY CONTROLLER (Super Admin ONLY)
// =========================================================================

export const getProjectProfitabilityReport = asyncHandler(async (req, res) => {
  const report = await projectService.getProjectProfitabilityReport({
    user: req.user
  });

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: report,
    message: 'Project profitability intelligence report retrieved successfully.'
  });
});

// =========================================================================
// ROW 22.7: HR COMPLIANCE CONTROLLERS
// =========================================================================

export const getMissingTimesheets = asyncHandler(async (req, res) => {
  const weekStartDate = req.query.weekStartDate || new Date().toISOString();
  const report = await projectService.getMissingTimesheets({
    weekStartDate,
    departmentId: req.query.departmentId
  });

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: report,
    message: 'Missing timesheets compliance report retrieved successfully.'
  });
});

export const remindMissingTimesheets = asyncHandler(async (req, res) => {
  const result = await projectService.remindMissingTimesheets({
    weekStartDate: req.body.weekStartDate,
    employeeIds: req.body.employeeIds,
    user: req.user,
    ipAddress: req.ip,
    userAgent: req.get('user-agent')
  });

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: result,
    message: result.message
  });
});


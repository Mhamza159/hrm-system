/**
 * @file onboarding.controller.js
 * @description Controller Handlers for Module M18 Onboarding & Offboarding Lifecycle.
 * 
 * SPECIFICATION:
 * - Layer: Controller Layer (Extracts request payload, calls domain service, returns standard envelope)
 * - Standard Envelope: { success: true, statusCode, data, message, meta }
 */

import { asyncHandler } from '../../utils/asyncHandler.js';
import * as onboardingService from './onboarding.service.js';

// =========================================================================
// SLICE 1: CHECKLIST TEMPLATE CONTROLLER HANDLERS (18.1)
// =========================================================================

export const createChecklistTemplate = asyncHandler(async (req, res) => {
  const template = await onboardingService.createChecklistTemplate({
    templateData: req.body,
    user: req.user,
    ipAddress: req.ip,
    userAgent: req.get('user-agent')
  });

  res.status(201).json({
    success: true,
    statusCode: 201,
    data: template,
    message: 'Checklist template created successfully.'
  });
});

export const getChecklistTemplates = asyncHandler(async (req, res) => {
  const templates = await onboardingService.getChecklistTemplates({
    filters: req.query,
    user: req.user
  });

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: templates,
    message: 'Checklist templates retrieved successfully.'
  });
});

export const getChecklistTemplateById = asyncHandler(async (req, res) => {
  const template = await onboardingService.getChecklistTemplateById(req.params.id);

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: template,
    message: 'Checklist template retrieved successfully.'
  });
});

export const updateChecklistTemplate = asyncHandler(async (req, res) => {
  const template = await onboardingService.updateChecklistTemplate({
    id: req.params.id,
    updateData: req.body,
    user: req.user,
    ipAddress: req.ip,
    userAgent: req.get('user-agent')
  });

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: template,
    message: 'Checklist template updated successfully.'
  });
});

export const deleteChecklistTemplate = asyncHandler(async (req, res) => {
  const result = await onboardingService.deleteChecklistTemplate({
    id: req.params.id,
    user: req.user,
    ipAddress: req.ip,
    userAgent: req.get('user-agent')
  });

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: result,
    message: 'Checklist template deleted successfully.'
  });
});

// =========================================================================
// SLICE 2: ONBOARDING INSTANCES (18.2)
// =========================================================================

export const getOnboardings = asyncHandler(async (req, res) => {
  const checklists = await onboardingService.getOnboardings({
    query: req.query,
    user: req.user
  });

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: checklists,
    message: 'Onboarding workflows retrieved successfully.'
  });
});

export const getOnboardingById = asyncHandler(async (req, res) => {
  const checklist = await onboardingService.getOnboardingById(req.params.id, req.user);

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: checklist,
    message: 'Onboarding checklist details retrieved successfully.'
  });
});

// =========================================================================
// SLICE 3: ASSIGNED TASKS & COMPLETION (18.3)
// =========================================================================

export const getMyTasks = asyncHandler(async (req, res) => {
  const tasks = await onboardingService.getMyAssignedTasks({ user: req.user });

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: tasks,
    message: 'Assigned tasks retrieved successfully.'
  });
});

export const completeTask = asyncHandler(async (req, res) => {
  const result = await onboardingService.completeChecklistTask({
    taskId: req.params.taskId,
    user: req.user,
    notes: req.body?.notes || '',
    ipAddress: req.ip,
    userAgent: req.get('user-agent')
  });

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: result,
    message: 'Task marked as completed successfully.'
  });
});

// =========================================================================
// SLICE 4 & 5: RESIGNATIONS (18.5, 18.6)
// =========================================================================

export const submitResignation = asyncHandler(async (req, res) => {
  const resignation = await onboardingService.submitResignation({
    resignationData: req.body,
    user: req.user,
    ipAddress: req.ip,
    userAgent: req.get('user-agent')
  });

  res.status(201).json({
    success: true,
    statusCode: 201,
    data: resignation,
    message: 'Resignation submitted successfully to management.'
  });
});

export const getMyResignation = asyncHandler(async (req, res) => {
  const resignation = await onboardingService.getMyResignation({ user: req.user });

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: resignation,
    message: 'Employee resignation status retrieved.'
  });
});

export const getResignations = asyncHandler(async (req, res) => {
  const resignations = await onboardingService.getResignations({
    query: req.query,
    user: req.user
  });

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: resignations,
    message: 'Resignations retrieved successfully.'
  });
});

export const decideResignation = asyncHandler(async (req, res) => {
  const resignation = await onboardingService.decideResignation({
    id: req.params.id,
    decisionData: req.body,
    user: req.user,
    ipAddress: req.ip,
    userAgent: req.get('user-agent')
  });

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: resignation,
    message: `Resignation ${resignation.status} successfully.`
  });
});

// =========================================================================
// SLICE 6: EXIT CLEARANCE (18.7)
// =========================================================================

export const getOffboardings = asyncHandler(async (req, res) => {
  const checklists = await onboardingService.getOffboardings({
    query: req.query,
    user: req.user
  });

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: checklists,
    message: 'Exit clearance workflows retrieved successfully.'
  });
});

export const signoffDepartmentClearance = asyncHandler(async (req, res) => {
  const checklist = await onboardingService.signoffDepartmentClearance({
    id: req.params.id,
    departmentCategory: req.body.departmentCategory,
    user: req.user,
    notes: req.body.notes || '',
    ipAddress: req.ip,
    userAgent: req.get('user-agent')
  });

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: checklist,
    message: 'Department clearance signed off successfully.'
  });
});

// =========================================================================
// SLICE 7: FINAL SETTLEMENT SUMMARY (18.9)
// =========================================================================

export const getSettlementSummary = asyncHandler(async (req, res) => {
  const summary = await onboardingService.getEmployeeSettlementSummary(req.params.id);

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: summary,
    message: 'Final settlement summary retrieved successfully.'
  });
});

// =========================================================================
// SLICE 8: DEACTIVATION TRIGGER (18.11)
// =========================================================================

export const triggerDeactivation = asyncHandler(async (req, res) => {
  const result = await onboardingService.runAccountDeactivationJob();

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: result,
    message: `Account deactivation evaluation finished: ${result.deactivatedCount} accounts updated.`
  });
});

// =========================================================================
// SLICE 9: WELCOME EMAIL (18.4)
// =========================================================================

export const sendWelcomeEmail = asyncHandler(async (req, res) => {
  const result = await onboardingService.sendWelcomeEmail({
    id: req.params.id,
    user: req.user
  });

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: result,
    message: result.message
  });
});

// =========================================================================
// SLICE 10: EXIT INTERVIEW (18.8)
// =========================================================================

export const submitExitInterview = asyncHandler(async (req, res) => {
  const interview = await onboardingService.submitExitInterview({
    interviewData: req.body,
    user: req.user,
    ipAddress: req.ip,
    userAgent: req.get('user-agent')
  });

  res.status(201).json({
    success: true,
    statusCode: 201,
    data: interview,
    message: 'Confidential exit interview submitted successfully.'
  });
});

export const getExitInterview = asyncHandler(async (req, res) => {
  const interview = await onboardingService.getExitInterviewByResignation({
    resignationId: req.params.resignationId,
    user: req.user
  });

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: interview,
    message: 'Exit interview details retrieved successfully.'
  });
});

// =========================================================================
// SLICE 11: EXPERIENCE & RELIEVING LETTER PDF (18.10)
// =========================================================================

export const streamServiceLetter = asyncHandler(async (req, res) => {
  await onboardingService.streamServiceLetterPdf({
    employeeId: req.params.id,
    type: req.params.type,
    user: req.user,
    res
  });
});

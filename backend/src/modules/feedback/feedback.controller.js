/**
 * @file feedback.controller.js
 * @description Controller for Module M21: Anonymous Feedback & Grievance.
 */

import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import * as feedbackService from './feedback.service.js';

function userHasCommitteeAccess(user) {
  if (!user) return false;
  const roles = user.roles || [];
  const isSuperAdmin =
    user.role === 'Super Admin' ||
    user.role?.name === 'Super Admin' ||
    roles.some((r) => r === 'Super Admin' || r?.name === 'Super Admin');

  if (isSuperAdmin) return true;

  const userPerms = user.permissions || [];
  if (userPerms.some((p) => p === 'grievance.committee' || p?.action === 'grievance.committee')) {
    return true;
  }

  return roles.some((r) =>
    Array.isArray(r?.permissions) &&
    r.permissions.some((p) => p === 'grievance.committee' || p?.action === 'grievance.committee')
  );
}

export const submitFeedback = asyncHandler(async (req, res) => {
  const result = await feedbackService.submitFeedback(req.body, req.user);
  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        result,
        'Feedback/grievance submitted successfully. Please retain your confidential tracking code.'
      )
    );
});

export const getFeedbackList = asyncHandler(async (req, res) => {
  const hasCommittee = userHasCommitteeAccess(req.user);
  const result = await feedbackService.getFeedbackList(req.query, req.user, hasCommittee);
  return res
    .status(200)
    .json(new ApiResponse(200, result.items, 'Feedback list retrieved successfully', result.meta));
});

export const getFeedbackById = asyncHandler(async (req, res) => {
  const hasCommittee = userHasCommitteeAccess(req.user);
  const caseItem = await feedbackService.getFeedbackById(req.params.id, req.user, hasCommittee);
  return res
    .status(200)
    .json(new ApiResponse(200, caseItem, 'Feedback details retrieved successfully'));
});

export const getTrackedFeedback = asyncHandler(async (req, res) => {
  const trackedCase = await feedbackService.getTrackedFeedbackByCode(req.params.code);
  return res
    .status(200)
    .json(new ApiResponse(200, trackedCase, 'Case tracking status retrieved successfully'));
});

export const updateFeedbackStatus = asyncHandler(async (req, res) => {
  const hasCommittee = userHasCommitteeAccess(req.user);
  const updated = await feedbackService.updateFeedbackStatus(
    req.params.id,
    req.body,
    req.user,
    hasCommittee
  );
  return res.status(200).json(new ApiResponse(200, updated, 'Case status updated successfully'));
});

export const addCaseNote = asyncHandler(async (req, res) => {
  const hasCommittee = userHasCommitteeAccess(req.user);
  const updated = await feedbackService.addCaseNote(
    req.params.id,
    req.body,
    req.user,
    hasCommittee
  );
  return res.status(200).json(new ApiResponse(200, updated, 'Case note added successfully'));
});

export const escalateFeedback = asyncHandler(async (req, res) => {
  const updated = await feedbackService.escalateFeedback(req.params.id, req.body, req.user);
  return res
    .status(200)
    .json(new ApiResponse(200, updated, 'Grievance escalated to Super Admin successfully'));
});

export const getMySubmissions = asyncHandler(async (req, res) => {
  const result = await feedbackService.getMySubmissions(req.user, req.query);
  return res
    .status(200)
    .json(new ApiResponse(200, result.items, 'User submissions retrieved successfully', result.meta));
});

export const getGrievanceStats = asyncHandler(async (req, res) => {
  const hasCommittee = userHasCommitteeAccess(req.user);
  const stats = await feedbackService.getGrievanceStats(req.user, hasCommittee);
  return res
    .status(200)
    .json(new ApiResponse(200, stats, 'Grievance summary statistics retrieved successfully'));
});

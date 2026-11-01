/**
 * @file performance.controller.js
 * @description Controller Handlers for Module M19 Performance & Appraisal.
 * 
 * SPECIFICATION:
 * - Layer: Controller Layer (Extracts request payload, calls domain service, returns standard envelope)
 * - Standard Envelope: { success: true, statusCode, data, message, meta }
 */

import { asyncHandler } from '../../utils/asyncHandler.js';
import * as performanceService from './performance.service.js';

// =========================================================================
// SLICE 1: KPI TEMPLATE CONTROLLER HANDLERS (19.1)
// =========================================================================

export const createKpiTemplate = asyncHandler(async (req, res) => {
  const template = await performanceService.createKpiTemplate({
    templateData: req.body,
    user: req.user,
    ipAddress: req.ip,
    userAgent: req.get('user-agent')
  });

  res.status(201).json({
    success: true,
    statusCode: 201,
    data: template,
    message: 'KPI Template created successfully.'
  });
});

export const getKpiTemplates = asyncHandler(async (req, res) => {
  const templates = await performanceService.getKpiTemplates({
    query: req.query,
    user: req.user
  });

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: templates,
    message: 'KPI Templates retrieved successfully.'
  });
});

export const getKpiTemplateById = asyncHandler(async (req, res) => {
  const template = await performanceService.getKpiTemplateById(req.params.id);

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: template,
    message: 'KPI Template retrieved successfully.'
  });
});

export const updateKpiTemplate = asyncHandler(async (req, res) => {
  const template = await performanceService.updateKpiTemplate({
    id: req.params.id,
    templateData: req.body,
    user: req.user,
    ipAddress: req.ip,
    userAgent: req.get('user-agent')
  });

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: template,
    message: 'KPI Template updated successfully.'
  });
});

export const deleteKpiTemplate = asyncHandler(async (req, res) => {
  const result = await performanceService.deleteKpiTemplate({
    id: req.params.id,
    user: req.user,
    ipAddress: req.ip,
    userAgent: req.get('user-agent')
  });

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: result,
    message: 'KPI Template deleted successfully.'
  });
});

// =========================================================================
// SLICE 2: REVIEW CYCLES CONTROLLER HANDLERS (19.2)
// =========================================================================

export const launchReviewCycle = asyncHandler(async (req, res) => {
  const cycle = await performanceService.launchReviewCycle({
    cycleData: req.body,
    user: req.user,
    ipAddress: req.ip,
    userAgent: req.get('user-agent')
  });

  res.status(201).json({
    success: true,
    statusCode: 201,
    data: cycle,
    message: 'Review Cycle launched and employee reviews instantiated successfully.'
  });
});

export const getReviewCycles = asyncHandler(async (req, res) => {
  const cycles = await performanceService.getReviewCycles({
    query: req.query,
    user: req.user
  });

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: cycles,
    message: 'Review Cycles retrieved successfully.'
  });
});

export const getReviewCycleById = asyncHandler(async (req, res) => {
  const cycle = await performanceService.getReviewCycleById(req.params.id);

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: cycle,
    message: 'Review Cycle details retrieved successfully.'
  });
});

export const updateCycleStatus = asyncHandler(async (req, res) => {
  const cycle = await performanceService.updateCycleStatus({
    id: req.params.id,
    status: req.body.status,
    user: req.user,
    ipAddress: req.ip,
    userAgent: req.get('user-agent')
  });

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: cycle,
    message: 'Review Cycle status updated successfully.'
  });
});

// =========================================================================
// SLICE 3: GOALS / OKRs MANAGEMENT (19.3)
// =========================================================================

export const updateReviewGoals = asyncHandler(async (req, res) => {
  const review = await performanceService.updateReviewGoals({
    reviewId: req.params.id,
    goals: req.body.goals,
    user: req.user,
    ipAddress: req.ip,
    userAgent: req.get('user-agent')
  });

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: review,
    message: 'Review goals updated successfully.'
  });
});

// =========================================================================
// SLICE 4: SELF REVIEW SUBMISSION (19.4)
// =========================================================================

export const submitSelfReview = asyncHandler(async (req, res) => {
  const review = await performanceService.submitSelfReview({
    reviewId: req.params.id,
    kpiRatings: req.body.kpiRatings,
    goalRatings: req.body.goalRatings,
    overallSummary: req.body.overallSummary,
    user: req.user,
    ipAddress: req.ip,
    userAgent: req.get('user-agent')
  });

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: review,
    message: 'Self-review submitted successfully.'
  });
});

// =========================================================================
// SLICE 5: MANAGER REVIEW & SCORING (19.5)
// =========================================================================

export const submitManagerReview = asyncHandler(async (req, res) => {
  const review = await performanceService.submitManagerReview({
    reviewId: req.params.id,
    managerKpiRatings: req.body.managerKpiRatings || req.body.kpiRatings,
    managerGoalRatings: req.body.managerGoalRatings || req.body.goalRatings,
    strengths: req.body.strengths,
    improvements: req.body.improvements,
    recommendedIncrementPercent: req.body.recommendedIncrementPercent,
    recommendationNotes: req.body.recommendationNotes,
    user: req.user,
    ipAddress: req.ip,
    userAgent: req.get('user-agent')
  });

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: review,
    message: 'Manager review submitted successfully.'
  });
});

// =========================================================================
// SLICE 6: FINAL APPRAISAL & SALARY REVISION LINKAGE (19.7)
// =========================================================================

export const finalizeReview = asyncHandler(async (req, res) => {
  const review = await performanceService.finalizeReview({
    reviewId: req.params.id,
    finalRating: req.body.finalRating,
    finalScore: req.body.finalScore,
    finalComments: req.body.finalComments,
    approvedIncrementPercent: req.body.approvedIncrementPercent,
    user: req.user,
    ipAddress: req.ip,
    userAgent: req.get('user-agent')
  });

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: review,
    message: 'Review finalized and compensation recommendations applied successfully.'
  });
});

// =========================================================================
// SLICE 7: REVIEW CYCLE PROGRESS & TRACKING (19.9)
// =========================================================================

export const getReviewCycleProgress = asyncHandler(async (req, res) => {
  const progress = await performanceService.getReviewCycleProgress(req.params.id);

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: progress,
    message: 'Review Cycle progress metrics retrieved successfully.'
  });
});

// =========================================================================
// SLICE 8: 360° PEER FEEDBACK (19.6)
// =========================================================================

export const requestPeerFeedback = asyncHandler(async (req, res) => {
  const review = await performanceService.requestPeerFeedback({
    reviewId: req.params.id,
    peerEmployeeId: req.body.peerEmployeeId,
    user: req.user,
    ipAddress: req.ip,
    userAgent: req.get('user-agent')
  });

  res.status(201).json({
    success: true,
    statusCode: 201,
    data: review,
    message: 'Peer feedback request dispatched successfully.'
  });
});

export const submitPeerFeedback = asyncHandler(async (req, res) => {
  const result = await performanceService.submitPeerFeedback({
    requestId: req.params.requestId,
    rating: req.body.rating,
    comments: req.body.comments,
    user: req.user,
    ipAddress: req.ip,
    userAgent: req.get('user-agent')
  });

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: result,
    message: 'Peer feedback submitted successfully.'
  });
});

// =========================================================================
// SLICE 9: HISTORICAL PERFORMANCE TIMELINE (19.8)
// =========================================================================

export const getEmployeePerformanceHistory = asyncHandler(async (req, res) => {
  const history = await performanceService.getEmployeePerformanceHistory({
    employeeId: req.params.id,
    user: req.user,
    dataScope: req.permissionScope || 'own'
  });

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: history,
    message: 'Employee appraisal history retrieved successfully.'
  });
});

// =========================================================================
// COMMON REVIEWS QUERY
// =========================================================================

export const getReviews = asyncHandler(async (req, res) => {
  const reviews = await performanceService.getReviews({
    query: req.query,
    user: req.user,
    dataScope: req.permissionScope || 'own'
  });

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: reviews,
    message: 'Performance reviews retrieved successfully.'
  });
});

export const getReviewById = asyncHandler(async (req, res) => {
  const review = await performanceService.getReviewById({
    id: req.params.id,
    user: req.user,
    dataScope: req.permissionScope || 'own'
  });

  res.status(200).json({
    success: true,
    statusCode: 200,
    data: review,
    message: 'Performance review details retrieved successfully.'
  });
});


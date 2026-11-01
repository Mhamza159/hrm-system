/**
 * @file performance.routes.js
 * @description Express Routes for Module M19 Performance & Appraisal.
 * 
 * SPECIFICATION & SECURITY:
 * - Module: M19 Performance & Appraisal (BUILD-GUIDE Section 22 · Rows 19.1 to 19.9)
 * - Middleware Defensive Hierarchy: authenticate -> checkPermission -> validate -> controller
 */

import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { checkPermission } from '../../middlewares/checkPermission.js';
import { validate } from '../../middlewares/validate.js';
import * as performanceController from './performance.controller.js';
import {
  createKpiTemplateSchema,
  updateKpiTemplateSchema,
  createReviewCycleSchema,
  updateCycleStatusSchema,
  setGoalsSchema,
  submitSelfReviewSchema,
  submitManagerReviewSchema,
  finalizeReviewSchema,
  peerFeedbackRequestSchema,
  submitPeerFeedbackSchema,
  paramIdSchema
} from './performance.validation.js';

const router = Router();
router.use(authenticate);

// =========================================================================
// SLICE 1: KPI TEMPLATES (Row 19.1)
// =========================================================================
router.get(
  '/templates',
  checkPermission('performance.template.view'),
  performanceController.getKpiTemplates
);

router.post(
  '/templates',
  checkPermission('performance.template.manage'),
  validate(createKpiTemplateSchema),
  performanceController.createKpiTemplate
);

router.get(
  '/templates/:id',
  checkPermission('performance.template.view'),
  validate(paramIdSchema),
  performanceController.getKpiTemplateById
);

router.put(
  '/templates/:id',
  checkPermission('performance.template.manage'),
  validate(updateKpiTemplateSchema),
  performanceController.updateKpiTemplate
);

router.delete(
  '/templates/:id',
  checkPermission('performance.template.manage'),
  validate(paramIdSchema),
  performanceController.deleteKpiTemplate
);

// =========================================================================
// SLICE 2: REVIEW CYCLES (Row 19.2)
// =========================================================================
router.get(
  '/cycles',
  checkPermission('performance.cycle.view'),
  performanceController.getReviewCycles
);

router.post(
  '/cycles',
  checkPermission('performance.cycle.manage'),
  validate(createReviewCycleSchema),
  performanceController.launchReviewCycle
);

router.get(
  '/cycles/:id',
  checkPermission('performance.cycle.view'),
  validate(paramIdSchema),
  performanceController.getReviewCycleById
);

router.patch(
  '/cycles/:id/status',
  checkPermission('performance.cycle.manage'),
  validate(updateCycleStatusSchema),
  performanceController.updateCycleStatus
);

// =========================================================================
// SLICE 7: CYCLE PROGRESS & TRACKING (Row 19.9)
// =========================================================================
router.get(
  '/cycles/:id/progress',
  checkPermission('performance.cycle.manage'),
  validate(paramIdSchema),
  performanceController.getReviewCycleProgress
);

// =========================================================================
// SLICES 3, 4, 5, 6, 8: REVIEWS, GOALS, APPRAISALS & PEER FEEDBACK
// =========================================================================
router.get(
  '/reviews',
  checkPermission('performance.review.view'),
  performanceController.getReviews
);

router.get(
  '/reviews/:id',
  checkPermission('performance.review.view'),
  validate(paramIdSchema),
  performanceController.getReviewById
);

router.patch(
  '/reviews/:id/goals',
  checkPermission('performance.review.submit'),
  validate(setGoalsSchema),
  performanceController.updateReviewGoals
);

router.patch(
  '/reviews/:id/self',
  checkPermission('performance.review.submit'),
  validate(submitSelfReviewSchema),
  performanceController.submitSelfReview
);

router.patch(
  '/reviews/:id/manager',
  checkPermission('performance.review.submit'),
  validate(submitManagerReviewSchema),
  performanceController.submitManagerReview
);

router.post(
  '/reviews/:id/peer-request',
  checkPermission('performance.peer.manage'),
  validate(peerFeedbackRequestSchema),
  performanceController.requestPeerFeedback
);

router.post(
  '/peer-feedback/:requestId',
  checkPermission('performance.peer.manage'),
  validate(submitPeerFeedbackSchema),
  performanceController.submitPeerFeedback
);

router.patch(
  '/reviews/:id/finalize',
  checkPermission('performance.review.finalize'),
  validate(finalizeReviewSchema),
  performanceController.finalizeReview
);

// =========================================================================
// SLICE 9: HISTORICAL APPRAISAL TIMELINE (Row 19.8)
// =========================================================================
router.get(
  '/employees/:id/history',
  checkPermission('performance.review.view'),
  validate(paramIdSchema),
  performanceController.getEmployeePerformanceHistory
);

export default router;


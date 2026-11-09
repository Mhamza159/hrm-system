/**
 * @file feedback.routes.js
 * @description Express Router for Module M21: Anonymous Feedback & Grievance (BUILD-GUIDE Section 28).
 */

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate } from '../../middlewares/authenticate.js';
import { checkPermission } from '../../middlewares/checkPermission.js';
import { validate } from '../../middlewares/validate.js';
import { ApiError } from '../../utils/ApiError.js';
import * as feedbackController from './feedback.controller.js';
import * as v from './feedback.validation.js';

const router = Router();

// Rate limiter for feedback submission to prevent spam/abuse
const feedbackSubmissionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many submissions, please wait a few minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});

// ==========================================
// 1. PUBLIC / UNPROTECTED ROUTES (Row 21.4)
// ==========================================

// Public tracking lookup by confidential tracking code
router.get('/track/:code', feedbackController.getTrackedFeedback);

// ==========================================
// 2. AUTHENTICATED USER ROUTES
// ==========================================
router.use(authenticate);

// 21.1: Submit feedback or grievance (Anonymous or named)
router.post(
  '/',
  feedbackSubmissionLimiter,
  checkPermission('feedback.submit', 'Feedback'),
  validate(v.submitFeedbackSchema),
  feedbackController.submitFeedback
);

// Get submissions created by the currently logged-in user
router.get('/my', feedbackController.getMySubmissions);

// ==========================================
// 3. ADMINISTRATIVE & COMMITTEE ROUTES (Rows 21.2, 21.3, 21.5, 21.6)
// ==========================================

// Summary stats for dashboard
router.get(
  '/stats/summary',
  checkPermission(['feedback.manage', 'grievance.committee'], 'Feedback'),
  feedbackController.getGrievanceStats
);

// List grievances (with automatic harassment quarantine filter)
router.get(
  '/',
  checkPermission(['feedback.manage', 'grievance.committee'], 'Feedback'),
  validate(v.feedbackFilterSchema),
  feedbackController.getFeedbackList
);

// View grievance case details
router.get(
  '/:id',
  checkPermission(['feedback.manage', 'grievance.committee'], 'Feedback'),
  feedbackController.getFeedbackById
);

// 21.2: Update status
router.patch(
  '/:id/status',
  checkPermission(['feedback.manage', 'grievance.committee'], 'Feedback'),
  validate(v.updateFeedbackStatusSchema),
  feedbackController.updateFeedbackStatus
);

// 21.2: Add investigation case note
router.post(
  '/:id/notes',
  checkPermission(['feedback.manage', 'grievance.committee'], 'Feedback'),
  validate(v.addCaseNoteSchema),
  feedbackController.addCaseNote
);

// 21.5: Escalate grievance to Super Admin
router.patch(
  '/:id/escalate',
  checkPermission('feedback.escalate', 'Feedback'),
  validate(v.escalateFeedbackSchema),
  feedbackController.escalateFeedback
);

export default router;

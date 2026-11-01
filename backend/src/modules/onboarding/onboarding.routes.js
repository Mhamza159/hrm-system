/**
 * @file onboarding.routes.js
 * @description Express Routes for Module M18 Onboarding & Offboarding Lifecycle.
 * 
 * SPECIFICATION & SECURITY:
 * - Module: M18 Onboarding & Offboarding (BUILD-GUIDE Section 21 · Rows 18.1 to 18.11)
 * - Middleware Defensive Hierarchy: authenticate -> checkPermission -> validate -> controller
 */

import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { checkPermission } from '../../middlewares/checkPermission.js';
import { validate } from '../../middlewares/validate.js';
import * as onboardingController from './onboarding.controller.js';
import {
  createChecklistTemplateSchema,
  updateChecklistTemplateSchema,
  getTemplateByIdSchema,
  getChecklistByIdSchema,
  completeTaskSchema,
  submitResignationSchema,
  decideResignationSchema,
  exitClearanceSignoffSchema,
  submitExitInterviewSchema,
  getExitInterviewSchema,
  objectIdSchema
} from './onboarding.validation.js';

// =========================================================================
// ROUTER 1: ONBOARDING & TEMPLATES ROUTER (/api/v1/onboarding)
// =========================================================================
const onboardingRouter = Router();
onboardingRouter.use(authenticate);

// 18.1: Templates
onboardingRouter.get(
  '/templates',
  checkPermission('onboard.view'),
  onboardingController.getChecklistTemplates
);

onboardingRouter.post(
  '/templates',
  checkPermission('onboard.manage'),
  validate(createChecklistTemplateSchema),
  onboardingController.createChecklistTemplate
);

onboardingRouter.get(
  '/templates/:id',
  checkPermission('onboard.view'),
  validate(getTemplateByIdSchema),
  onboardingController.getChecklistTemplateById
);

onboardingRouter.put(
  '/templates/:id',
  checkPermission('onboard.manage'),
  validate(updateChecklistTemplateSchema),
  onboardingController.updateChecklistTemplate
);

onboardingRouter.delete(
  '/templates/:id',
  checkPermission('onboard.manage'),
  validate(getTemplateByIdSchema),
  onboardingController.deleteChecklistTemplate
);

// 18.3: My Assigned Tasks
onboardingRouter.get(
  '/tasks/my',
  checkPermission('onboard.view', 'own'),
  onboardingController.getMyTasks
);

onboardingRouter.patch(
  '/tasks/:taskId/complete',
  checkPermission('onboard.view'),
  validate(completeTaskSchema),
  onboardingController.completeTask
);

// 18.4: Resend Welcome Email
onboardingRouter.post(
  '/:id/welcome-email',
  checkPermission('onboard.manage'),
  onboardingController.sendWelcomeEmail
);

// 18.2: Onboarding Workflows
onboardingRouter.get(
  '/',
  checkPermission('onboard.view'),
  onboardingController.getOnboardings
);

onboardingRouter.get(
  '/:id',
  checkPermission('onboard.view'),
  validate(getChecklistByIdSchema),
  onboardingController.getOnboardingById
);

// =========================================================================
// ROUTER 2: RESIGNATIONS ROUTER (/api/v1/resignations)
// =========================================================================
export const resignationRouter = Router();
resignationRouter.use(authenticate);

resignationRouter.get(
  '/my',
  checkPermission('resignation.submit', 'own'),
  onboardingController.getMyResignation
);

resignationRouter.post(
  '/',
  checkPermission('resignation.submit', 'own'),
  validate(submitResignationSchema),
  onboardingController.submitResignation
);

resignationRouter.get(
  '/',
  checkPermission('offboard.view'),
  onboardingController.getResignations
);

resignationRouter.patch(
  '/:id/decide',
  checkPermission('offboard.manage'),
  validate(decideResignationSchema),
  onboardingController.decideResignation
);

// =========================================================================
// ROUTER 3: OFFBOARDING & EXIT CLEARANCE ROUTER (/api/v1/offboarding)
// =========================================================================
export const offboardingRouter = Router();
offboardingRouter.use(authenticate);

offboardingRouter.get(
  '/',
  checkPermission('offboard.view'),
  onboardingController.getOffboardings
);

offboardingRouter.post(
  '/:id/clear',
  checkPermission('offboard.manage'),
  validate(exitClearanceSignoffSchema),
  onboardingController.signoffDepartmentClearance
);

offboardingRouter.get(
  '/:id/settlement-summary',
  checkPermission('offboard.manage'),
  onboardingController.getSettlementSummary
);

offboardingRouter.post(
  '/trigger-deactivation',
  checkPermission('offboard.manage'),
  onboardingController.triggerDeactivation
);

// =========================================================================
// ROUTER 4: EXIT INTERVIEWS ROUTER (/api/v1/exit-interviews)
// =========================================================================
export const exitInterviewRouter = Router();
exitInterviewRouter.use(authenticate);

exitInterviewRouter.post(
  '/',
  checkPermission('offboard.view', 'own'),
  validate(submitExitInterviewSchema),
  onboardingController.submitExitInterview
);

exitInterviewRouter.get(
  '/:resignationId',
  checkPermission('offboard.manage'),
  validate(getExitInterviewSchema),
  onboardingController.getExitInterview
);

export default onboardingRouter;

/**
 * @file attrition.routes.js
 * @description Express Router for Module M17 Attrition Prediction.
 * 
 * SPECIFICATION:
 * - Module: M17 Attrition Prediction (BUILD-GUIDE Section 26 · Rows 17.1 to 17.5)
 * - Middleware Stack: authenticate -> checkPermission -> validate -> controller
 * - Confidentiality Guard: Strict PBAC checks on all routes. Regular Employees receive HTTP 403.
 */

import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { checkPermission } from '../../middlewares/checkPermission.js';
import { validate } from '../../middlewares/validate.js';
import * as attritionController from './attrition.controller.js';
import * as v from './attrition.validation.js';

const router = Router();

// All attrition routes require valid authentication
router.use(authenticate);

/**
 * 17.1: Manual on-demand company-wide risk recalculation
 * Permission: ATTRITION_MANAGE (Super Admin & HR Manager only)
 */
router.post(
  '/calculate',
  checkPermission('attrition.manage', 'Attrition'),
  attritionController.recalculateScores
);

/**
 * 17.3: Department risk distribution analytics for Recharts
 * Permission: ATTRITION_READ (Super Admin, HR Manager, Dept Manager)
 */
router.get(
  '/departments',
  checkPermission('attrition.view', 'Attrition'),
  attritionController.getDepartmentAnalytics
);

/**
 * 17.2: List paginated scored employees with filters & search
 * Permission: ATTRITION_READ (Super Admin, HR Manager, Dept Manager)
 */
router.get(
  '/scores',
  checkPermission('attrition.view', 'Attrition'),
  validate(v.getAttritionQuerySchema),
  attritionController.getScores
);

/**
 * 17.2: Single employee detailed attrition profile
 * Permission: ATTRITION_READ (Super Admin, HR Manager, Dept Manager)
 */
router.get(
  '/scores/:id',
  checkPermission('attrition.view', 'Attrition'),
  attritionController.getScoreById
);

/**
 * 17.4: Add retention intervention note
 * Permission: ATTRITION_MANAGE (Super Admin, HR Manager, Dept Manager)
 */
router.post(
  '/:id/notes',
  checkPermission('attrition.manage', 'Attrition'),
  validate(v.addRetentionNoteSchema),
  attritionController.addNote
);

/**
 * 17.4: Get retention intervention notes history
 * Permission: ATTRITION_READ (Super Admin, HR Manager, Dept Manager)
 */
router.get(
  '/:id/notes',
  checkPermission('attrition.view', 'Attrition'),
  attritionController.getNotes
);

export default router;


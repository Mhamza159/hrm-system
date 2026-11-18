/**
 * @file designation.routes.js
 * @description Express Router for Module M4 Designations & Grade Tiers.
 * 
 * SPECIFICATION & SECURITY:
 * - Module: M4 Departments, Designations, Shifts & Org Chart (BUILD-GUIDE Section 7 · Row 4.3)
 * - Middleware Pipeline: authenticate -> checkPermission -> validate -> controller
 */

import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { checkPermission } from '../../middlewares/checkPermission.js';
import { validate } from '../../middlewares/validate.js';
import {
  createDesignationSchema,
  updateDesignationSchema
} from './department.validation.js';
import * as departmentController from './department.controller.js';

const router = Router();

// Universal requirement: All routes require active authenticated session
router.use(authenticate);

/**
 * 4.3: Designations Master Endpoints
 */
router.get(
  '/',
  checkPermission('org.view'),
  departmentController.getDesignations
);

router.get(
  '/stats',
  checkPermission('org.view'),
  departmentController.getDesignationStats
);

router.get(
  '/analytics',
  checkPermission('org.view'),
  departmentController.getDesignationAnalytics
);

router.get(
  '/archived',
  checkPermission('org.view'),
  departmentController.getArchivedDesignations
);

router.get(
  '/:id',
  checkPermission('org.view'),
  departmentController.getDesignationById
);

router.post(
  '/',
  checkPermission('org.manage'),
  validate(createDesignationSchema),
  departmentController.createDesignation
);

router.patch(
  '/:id/archive',
  checkPermission('org.manage'),
  departmentController.archiveDesignation
);

router.patch(
  '/:id/restore',
  checkPermission('org.manage'),
  departmentController.restoreDesignation
);

router.patch(
  '/:id',
  checkPermission('org.manage'),
  validate(updateDesignationSchema),
  departmentController.updateDesignation
);

router.delete(
  '/:id/permanent',
  checkPermission('org.manage'),
  departmentController.permanentDeleteDesignation
);

router.delete(
  '/:id',
  checkPermission('org.manage'),
  departmentController.deleteDesignation
);

export default router;

/**
 * @file shift.routes.js
 * @description Express Router for Module M4 Work Shifts & Cross-Midnight Rosters.
 * 
 * SPECIFICATION & SECURITY:
 * - Module: M4 Departments, Designations, Shifts & Org Chart (BUILD-GUIDE Section 7 · Row 4.4)
 * - Middleware Pipeline: authenticate -> checkPermission -> validate -> controller
 */

import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { checkPermission } from '../../middlewares/checkPermission.js';
import { validate } from '../../middlewares/validate.js';
import {
  createShiftSchema,
  updateShiftSchema
} from './department.validation.js';
import * as departmentController from './department.controller.js';

const router = Router();

// Universal requirement: All routes require active authenticated session
router.use(authenticate);

/**
 * 4.4: Shifts Master Endpoints
 */
router.get(
  '/',
  checkPermission('org.view'),
  departmentController.getShifts
);

router.get(
  '/:id',
  checkPermission('org.view'),
  departmentController.getShiftById
);

router.post(
  '/',
  checkPermission('org.manage'),
  validate(createShiftSchema),
  departmentController.createShift
);

router.patch(
  '/:id',
  checkPermission('org.manage'),
  validate(updateShiftSchema),
  departmentController.updateShift
);

router.delete(
  '/:id',
  checkPermission('org.manage'),
  departmentController.deleteShift
);

export default router;

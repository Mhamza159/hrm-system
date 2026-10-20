/**
 * @file leaveType.routes.js
 * @description Express Routes for Leave Types Management (Module M6 Row 6.1).
 * 
 * SPECIFICATION:
 * - Module: M6 Leave & Holidays (BUILD-GUIDE Section 11 · Row 6.1)
 * - Middleware: authenticate -> validate -> checkPermission -> controller
 */

import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { validate } from '../../middlewares/validate.js';
import { checkPermission } from '../../middlewares/checkPermission.js';
import * as leaveController from './leave.controller.js';
import {
  createLeaveTypeSchema,
  updateLeaveTypeSchema,
  leaveTypeIdParamSchema
} from './leave.validation.js';

const router = Router();

router.use(authenticate);

// 6.1: List all leave types (accessible to all authenticated employees to populate forms)
router.get(
  '/',
  checkPermission('leave.view', 'own'),
  leaveController.getLeaveTypes
);

// 6.1: Get specific leave type details
router.get(
  '/:id',
  checkPermission('leave.view', 'own'),
  validate(leaveTypeIdParamSchema),
  leaveController.getLeaveTypeById
);

// 6.1: Create new leave type (Super Admin / HR Manager only)
router.post(
  '/',
  checkPermission('leave.settings', 'all'),
  validate(createLeaveTypeSchema),
  leaveController.createLeaveType
);

// 6.1: Update leave type (Super Admin / HR Manager only)
router.patch(
  '/:id',
  checkPermission('leave.settings', 'all'),
  validate(updateLeaveTypeSchema),
  leaveController.updateLeaveType
);

// 6.1: Deactivate leave type (Super Admin / HR Manager only)
router.delete(
  '/:id',
  checkPermission('leave.settings', 'all'),
  validate(leaveTypeIdParamSchema),
  leaveController.deleteLeaveType
);

export default router;

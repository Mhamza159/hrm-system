/**
 * @file department.routes.js
 * @description Express Router for Module M4 Departments, Designations, Shifts & Org Chart.
 * 
 * SPECIFICATION & SECURITY:
 * - Module: M4 Departments, Designations, Shifts & Org Chart (BUILD-GUIDE Section 7 · Rows 4.1 - 4.7)
 * - Middleware Pipeline: authenticate -> checkPermission -> validate -> controller
 */

import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { checkPermission } from '../../middlewares/checkPermission.js';
import { validate } from '../../middlewares/validate.js';
import {
  createDepartmentSchema,
  updateDepartmentSchema,
  assignHeadSchema
} from './department.validation.js';
import * as departmentController from './department.controller.js';

const router = Router();

// Universal requirement: All routes require active authenticated session
router.use(authenticate);

/**
 * 4.1: Departments Master Endpoints
 */
router.get(
  '/',
  checkPermission('org.view'),
  departmentController.getDepartments
);

router.get(
  '/heads/candidates',
  checkPermission('org.view'),
  departmentController.getHeadCandidates
);

router.get(
  '/org-chart',
  checkPermission('org.view'),
  departmentController.getOrgChart
);

router.get(
  '/teams/my',
  checkPermission('org.view'),
  departmentController.getMyTeam
);

router.get(
  '/:id',
  checkPermission('org.view'),
  departmentController.getDepartmentById
);

router.post(
  '/',
  checkPermission('org.manage'),
  validate(createDepartmentSchema),
  departmentController.createDepartment
);

router.patch(
  '/:id',
  checkPermission('org.manage'),
  validate(updateDepartmentSchema),
  departmentController.updateDepartment
);

router.patch(
  '/:id/head',
  checkPermission('org.manage'),
  validate(assignHeadSchema),
  departmentController.assignDepartmentHead
);

router.delete(
  '/:id',
  checkPermission('org.manage'),
  departmentController.deleteDepartment
);

export default router;

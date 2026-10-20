/**
 * @file salaryStructure.routes.js
 * @description Express Router for Salary Structure Management.
 * 
 * SPECIFICATION & SECURITY:
 * - Module: M9 Payroll (BUILD-GUIDE Section 12 · Rows 9.1 & 9.2)
 * - Middleware Order: authenticate -> checkPermission -> validate -> controller
 */

import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { checkPermission } from '../../middlewares/checkPermission.js';
import { validate } from '../../middlewares/validate.js';
import * as payrollController from './payroll.controller.js';
import {
  createSalaryStructureSchema,
  reviseSalaryStructureSchema,
  getSalaryStructuresQuerySchema,
  employeeIdParamSchema
} from './payroll.validation.js';

const router = Router();

// 9.1: List salary structures
router.get(
  '/',
  authenticate,
  checkPermission('payroll.manage', 'all'),
  validate(getSalaryStructuresQuerySchema),
  payrollController.getSalaryStructures
);

// 9.1: Assign initial salary structure
router.post(
  '/',
  authenticate,
  checkPermission('payroll.manage', 'all'),
  validate(createSalaryStructureSchema),
  payrollController.createSalaryStructure
);

// 9.2: Get employee structure and revision history
router.get(
  '/employee/:id',
  authenticate,
  checkPermission('payroll.view'),
  validate(employeeIdParamSchema),
  payrollController.getEmployeeSalaryStructure
);

// 9.2: Revise / Increment salary structure
router.put(
  '/employee/:id',
  authenticate,
  checkPermission('payroll.manage', 'all'),
  validate(reviseSalaryStructureSchema),
  payrollController.reviseSalaryStructure
);

export default router;

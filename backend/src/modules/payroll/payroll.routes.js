/**
 * @file payroll.routes.js
 * @description Express Router for Monthly Payroll Runs, Approvals & Bank Exports.
 * 
 * SPECIFICATION & SECURITY:
 * - Module: M9 Payroll (BUILD-GUIDE Section 12 · Rows 9.7 - 9.17)
 * - Middleware Order: authenticate -> checkPermission -> validate -> controller
 */

import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { checkPermission } from '../../middlewares/checkPermission.js';
import { validate } from '../../middlewares/validate.js';
import * as payrollController from './payroll.controller.js';
import {
  generatePayrollRunSchema,
  runIdParamSchema,
  adjustPayslipLineItemSchema
} from './payroll.validation.js';

const router = Router();

// 9.7: Generate Batch Monthly Payroll Run
router.post(
  '/runs/generate',
  authenticate,
  checkPermission('payroll.run', 'all'),
  validate(generatePayrollRunSchema),
  payrollController.generatePayrollRun
);

// 9.7: List Paginated Payroll Runs
router.get(
  '/runs',
  authenticate,
  checkPermission('payroll.view'),
  payrollController.getPayrollRuns
);

// 9.8: Get Detailed Payroll Run with Payslips
router.get(
  '/runs/:id',
  authenticate,
  checkPermission('payroll.view'),
  validate(runIdParamSchema),
  payrollController.getPayrollRunById
);

// 9.9: Adjust Line Item on Draft Payslip
router.patch(
  '/runs/:id/payslips/:slipId',
  authenticate,
  checkPermission('payroll.run', 'all'),
  validate(adjustPayslipLineItemSchema),
  payrollController.adjustPayslipLineItem
);

// 9.8: Approve Payroll Run (Super Admin Executive Release)
router.patch(
  '/runs/:id/approve',
  authenticate,
  checkPermission('payroll.approve', 'all'),
  validate(runIdParamSchema),
  payrollController.approvePayrollRun
);

// 9.8: Mark Payroll Run as Paid (Super Admin Only)
router.patch(
  '/runs/:id/mark-paid',
  authenticate,
  checkPermission('payroll.approve', 'all'),
  validate(runIdParamSchema),
  payrollController.markPayrollPaid
);

// 9.11: Self-Service Employee Payslips
router.get(
  '/my-slips',
  authenticate,
  checkPermission('payroll.view', 'own'),
  payrollController.getMyPayslips
);

export default router;

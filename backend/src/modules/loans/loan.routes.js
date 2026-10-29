/**
 * @file loan.routes.js
 * @description Express Router for Loans & Salary Advances (Module M10 / Slices 10.1 to 10.6).
 * 
 * SPECIFICATION:
 * - Module: M10 Loans & Advances (BUILD-GUIDE Section 15 · Rows 10.1 - 10.6)
 * - Layer: Routes (API contracts guarded by JWT auth & CASL authorization)
 */

import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { checkPermission } from '../../middlewares/checkPermission.js';
import { validate } from '../../middlewares/validate.js';
import {
  createLoanSchema,
  queryLoansSchema,
  approvalDecisionSchema,
  earlyPrepaymentSchema,
  loanIdParamSchema
} from './loan.validation.js';
import * as loanController from './loan.controller.js';

const router = Router();

// ==========================================
// 10.2: Live Borrowing Limit & Eligibility
// ==========================================
router.get(
  '/my-eligibility',
  authenticate,
  checkPermission('loan.view', 'own'),
  loanController.getMyEligibility
);

// ==========================================
// 10.6: Company-wide Loan Ledger Summary (Executive KPI)
// ==========================================
router.get(
  '/ledger/summary',
  authenticate,
  checkPermission('loan.view', 'all'),
  loanController.getLedgerSummary
);

// ==========================================
// 10.1 & 10.2: Apply for Loan / Salary Advance
// ==========================================
router.post(
  '/',
  authenticate,
  checkPermission('loan.create', 'own'),
  validate(createLoanSchema),
  loanController.createLoan
);

// ==========================================
// List Loans (Scoped by CASL ability: own/team/dept/all)
// ==========================================
router.get(
  '/',
  authenticate,
  checkPermission('loan.view', 'own'),
  validate(queryLoansSchema),
  loanController.getLoans
);

// ==========================================
// 10.4: Specific Loan Details & Installment Schedule
// ==========================================
router.get(
  '/:id/schedule',
  authenticate,
  checkPermission('loan.view', 'own'),
  validate(loanIdParamSchema),
  loanController.getLoanSchedule
);

router.get(
  '/:id',
  authenticate,
  checkPermission('loan.view', 'own'),
  validate(loanIdParamSchema),
  loanController.getLoanById
);

// ==========================================
// 10.3: Multi-Tier Approval Decision (Recommend / Forward / Approve / Reject)
// ==========================================
router.patch(
  '/:id/decide',
  authenticate,
  checkPermission('loan.recommend', 'team'),
  validate(approvalDecisionSchema),
  loanController.decideLoan
);

// ==========================================
// 10.6: Early Prepayment & Full Settlement
// ==========================================
router.post(
  '/:id/prepay',
  authenticate,
  checkPermission('loan.prepay', 'all'),
  validate(earlyPrepaymentSchema),
  loanController.prepayLoan
);

export default router;

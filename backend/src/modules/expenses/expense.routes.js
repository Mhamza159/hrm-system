/**
 * @file expense.routes.js
 * @description Express Routes for Expense Claims & Categories (Module M11 / Slices 11.1 to 11.5).
 * 
 * SPECIFICATION:
 * - Module: M11 Expense Claims
 * - Security: Protected by authenticate, validate, and CASL checkPermission.
 */

import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { authenticate } from '../../middlewares/authenticate.js';
import { checkPermission } from '../../middlewares/checkPermission.js';
import { validate } from '../../middlewares/validate.js';
import { ApiError } from '../../utils/ApiError.js';
import * as expenseController from './expense.controller.js';
import {
  createExpenseCategorySchema,
  updateExpenseCategorySchema,
  categoryIdParamSchema,
  createExpenseSchema,
  queryExpenseSchema,
  expenseIdParamSchema,
  decideExpenseSchema,
  reimburseExpenseSchema,
  queryExpenseReportSchema
} from './expense.validation.js';

const router = Router();

// Multer memory storage configuration for receipt files
const receiptUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB maximum
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'application/pdf'];
    const allowedExts = ['.png', '.jpg', '.jpeg', '.webp', '.pdf'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedMimes.includes(file.mimetype) && allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new ApiError(400, 'Invalid receipt format. Only PNG, JPEG, WEBP, and PDF documents are supported (Max 5MB).'));
    }
  }
});

// All expense routes require authentication
router.use(authenticate);

// ============================================================================
// 1. Expense Categories Routes (BUILD-GUIDE Row 11.1)
// ============================================================================

router
  .route('/categories')
  .get(
    checkPermission('expense.view', 'Expense'),
    expenseController.getAllCategories
  )
  .post(
    checkPermission('expense.settings', 'ExpenseCategory'),
    validate(createExpenseCategorySchema),
    expenseController.createCategory
  );

router
  .route('/categories/:id')
  .get(
    validate(categoryIdParamSchema),
    checkPermission('expense.view', 'Expense'),
    expenseController.getCategoryById
  )
  .put(
    validate(updateExpenseCategorySchema),
    checkPermission('expense.settings', 'ExpenseCategory'),
    expenseController.updateCategory
  )
  .delete(
    validate(categoryIdParamSchema),
    checkPermission('expense.settings', 'ExpenseCategory'),
    expenseController.deleteCategory
  );

// ============================================================================
// 2. Expense Reports (BUILD-GUIDE Row 11.5)
// ============================================================================

router.get(
  '/reports/monthly',
  validate(queryExpenseReportSchema),
  checkPermission('report.view', 'Report'),
  expenseController.getExpenseMonthlyReport
);

// ============================================================================
// 3. Approvals & Claims Routes (BUILD-GUIDE Rows 11.2, 11.3, 11.4)
// ============================================================================

router.get(
  '/my',
  validate(queryExpenseSchema),
  checkPermission('expense.view', 'Expense'),
  expenseController.getMyExpenses
);

router.get(
  '/pending-approvals',
  validate(queryExpenseSchema),
  checkPermission('expense.approve', 'Expense'),
  expenseController.getPendingApprovals
);

router
  .route('/')
  .post(
    checkPermission('expense.create', 'Expense'),
    receiptUpload.single('receipt'),
    validate(createExpenseSchema),
    expenseController.createExpense
  );

router
  .route('/:id')
  .get(
    validate(expenseIdParamSchema),
    checkPermission('expense.view', 'Expense'),
    expenseController.getExpenseById
  );

router.patch(
  '/:id/decide',
  validate(decideExpenseSchema),
  checkPermission('expense.approve', 'Expense'),
  expenseController.decideExpense
);

router.patch(
  '/:id/reimburse',
  validate(reimburseExpenseSchema),
  checkPermission('expense.reimburse', 'Expense'),
  expenseController.reimburseExpense
);

export default router;


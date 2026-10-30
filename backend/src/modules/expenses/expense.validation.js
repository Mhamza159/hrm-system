/**
 * @file expense.validation.js
 * @description Zod Schemas for Expense Claims & Categories (Module M11 / Slices 11.1 to 11.5).
 * 
 * SPECIFICATION:
 * - Module: M11 Expense Claims
 * - Invariant: Validated with { body, query, params } structure to match validate.js middleware.
 * - Invariant: All monetary limits/amounts validated strictly as positive integer paisa.
 */

import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

// ----------------------------------------------------
// 11.1: Expense Category Validation Schemas
// ----------------------------------------------------
export const createExpenseCategorySchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: 'Category name is required' })
      .trim()
      .min(2, 'Category name must be at least 2 characters')
      .max(100, 'Category name cannot exceed 100 characters'),
    code: z
      .string({ required_error: 'Category code is required' })
      .trim()
      .min(2, 'Category code must be at least 2 characters')
      .max(30, 'Category code cannot exceed 30 characters')
      .transform((val) => val.toUpperCase()),
    description: z.string().trim().max(500).default('').optional(),
    maxLimitPaisa: z
      .number({ required_error: 'Max limit is required' })
      .int('Max limit must be integer paisa')
      .min(0, 'Max limit cannot be negative')
      .default(0),
    requiresReceipt: z.boolean().default(true).optional(),
    isActive: z.boolean().default(true).optional()
  })
});

export const updateExpenseCategorySchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid category ObjectId format')
  }),
  body: z.object({
    name: z.string().trim().min(2).max(100).optional(),
    description: z.string().trim().max(500).optional(),
    maxLimitPaisa: z.number().int().min(0).optional(),
    requiresReceipt: z.boolean().optional(),
    isActive: z.boolean().optional()
  })
});

export const categoryIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid category ObjectId format')
  })
});

// ----------------------------------------------------
// 11.2: Expense Claim Submission & Inspection
// ----------------------------------------------------
export const createExpenseSchema = z.object({
  body: z.object({
    categoryId: z
      .string({ required_error: 'Category ID is required' })
      .regex(objectIdRegex, 'Invalid category ID format'),
    amount: z.coerce
      .number({ required_error: 'Amount is required' })
      .int('Amount must be positive integer paisa')
      .positive('Amount must be greater than zero'),
    expenseDate: z
      .string({ required_error: 'Expense date is required' })
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expense date must be YYYY-MM-DD format'),
    description: z
      .string({ required_error: 'Description is required' })
      .trim()
      .min(5, 'Description must be at least 5 characters')
      .max(500, 'Description cannot exceed 500 characters')
  })
});

export const queryExpenseSchema = z.object({
  query: z
    .object({
      page: z.coerce.number().int().min(1).default(1).optional(),
      limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
      status: z
        .enum(['pending_manager', 'pending_admin', 'approved', 'rejected', 'reimbursed'])
        .optional(),
      categoryId: z.string().regex(objectIdRegex).optional(),
      employeeId: z.string().regex(objectIdRegex).optional(),
      departmentId: z.string().regex(objectIdRegex).optional(),
      startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      search: z.string().trim().optional()
    })
    .optional()
});

export const expenseIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid expense claim ObjectId format')
  })
});

// ----------------------------------------------------
// 11.3: Approval Decisions
// ----------------------------------------------------
export const decideExpenseSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid expense claim ID')
  }),
  body: z.object({
    decision: z.enum(['recommend', 'approve', 'reject'], {
      errorMap: () => ({ message: "Decision must be 'recommend', 'approve', or 'reject'" })
    }),
    comments: z
      .string({ required_error: 'Remarks/comments are required' })
      .trim()
      .min(3, 'Comments must be at least 3 characters')
      .max(500, 'Comments cannot exceed 500 characters'),
    approvedAmount: z
      .number()
      .int('Approved amount must be positive integer paisa')
      .positive('Approved amount must be greater than zero')
      .optional()
  })
});

// ----------------------------------------------------
// 11.4: Reimbursement Execution
// ----------------------------------------------------
export const reimburseExpenseSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid expense claim ID')
  }),
  body: z.object({
    method: z.enum(['payroll', 'direct'], {
      errorMap: () => ({ message: "Reimbursement method must be 'payroll' or 'direct'" })
    }),
    paymentReference: z
      .string()
      .trim()
      .max(100, 'Reference cannot exceed 100 characters')
      .optional(),
    remarks: z.string().trim().max(500).optional()
  })
});

// ----------------------------------------------------
// 11.5: Reports & Aggregations
// ----------------------------------------------------
export const queryExpenseReportSchema = z.object({
  query: z
    .object({
      month: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format').optional(),
      departmentId: z.string().regex(objectIdRegex).optional(),
      format: z.enum(['json', 'csv']).default('json').optional()
    })
    .optional()
});


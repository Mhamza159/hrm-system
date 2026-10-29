/**
 * @file loan.validation.js
 * @description Zod Schemas for Loans & Salary Advances (Module M10 / Slices 10.1 to 10.6).
 * 
 * SPECIFICATION:
 * - Module: M10 Loans & Advances
 * - Invariant: Validated with { body, query, params } structure to match validate.js middleware.
 * - Invariant: Monetary amounts validated strictly as positive integers in minor currency units (paisa).
 */

import { z } from 'zod';

export const createLoanSchema = z.object({
  body: z.object({
    type: z.enum(['loan', 'advance'], {
      errorMap: () => ({ message: "Type must be either 'loan' or 'advance'" })
    }),
    amount: z
      .number({ required_error: 'Amount is required' })
      .int('Amount must be in integer paisa')
      .positive('Amount must be greater than zero'),
    repaymentTenureMonths: z
      .number()
      .int('Tenure must be a whole number of months')
      .min(1, 'Tenure must be at least 1 month')
      .max(24, 'Tenure cannot exceed 24 months')
      .default(1),
    reason: z
      .string({ required_error: 'Reason is required' })
      .trim()
      .min(5, 'Reason must be at least 5 characters')
      .max(500, 'Reason cannot exceed 500 characters'),
    effectiveStartMonth: z
      .string({ required_error: 'Effective start month is required' })
      .regex(/^\d{4}-\d{2}$/, 'Start month must be in YYYY-MM format')
  })
});

export const queryLoansSchema = z.object({
  query: z
    .object({
      page: z.coerce.number().int().min(1).default(1).optional(),
      limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
      status: z
        .enum([
          'pending_recommendation',
          'pending_hr',
          'pending_admin',
          'approved',
          'active',
          'rejected',
          'closed'
        ])
        .optional(),
      type: z.enum(['loan', 'advance']).optional(),
      employeeId: z.string().optional(),
      search: z.string().trim().optional()
    })
    .optional()
});

export const loanIdParamSchema = z.object({
  params: z.object({
    id: z
      .string({ required_error: 'Loan ID is required' })
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid Loan ID parameter. Must be a 24-character hexadecimal ObjectId')
  })
});

export const approvalDecisionSchema = z.object({
  params: z.object({
    id: z
      .string({ required_error: 'Loan ID is required' })
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid Loan ID parameter. Must be a 24-character hexadecimal ObjectId')
  }),
  body: z.object({
    decision: z.enum(['recommend', 'forward', 'approve', 'reject', 'decline'], {
      errorMap: () => ({
        message: "Decision must be one of: 'recommend', 'forward', 'approve', 'reject', 'decline'"
      })
    }),
    comments: z
      .string()
      .trim()
      .min(3, 'Comments are required for audit trail')
      .max(500, 'Comments cannot exceed 500 characters'),
    disbursementMethod: z
      .enum(['bank_transfer', 'cash', 'payroll_addition'])
      .optional()
      .default('bank_transfer')
  })
});

export const earlyPrepaymentSchema = z.object({
  params: z.object({
    id: z
      .string({ required_error: 'Loan ID is required' })
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid Loan ID parameter. Must be a 24-character hexadecimal ObjectId')
  }),
  body: z.object({
    amount: z
      .number({ required_error: 'Prepayment amount is required' })
      .int('Prepayment amount must be in integer paisa')
      .positive('Prepayment amount must be greater than zero'),
    paymentMethod: z.enum(['bank_transfer', 'cash'], {
      errorMap: () => ({ message: "Payment method must be 'bank_transfer' or 'cash'" })
    }),
    reference: z
      .string({ required_error: 'Payment reference or receipt note is required' })
      .trim()
      .min(2, 'Payment reference must be at least 2 characters')
      .max(100, 'Payment reference cannot exceed 100 characters')
  })
});

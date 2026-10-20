/**
 * @file payroll.validation.js
 * @description Zod Validation Schemas for Payroll & Statutory Compliance (M9).
 * 
 * SPECIFICATION:
 * - Module: M9 Payroll & Pakistan Statutory Compliance (BUILD-GUIDE Section 12 · Rows 9.1 - 9.17)
 * - Layer: Validation (Request payload sanitization and constraint checking)
 * - Integer Paisa Invariant: All financial amounts must be non-negative integers (PKR × 100).
 */

import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
export const objectIdSchema = z.string().regex(objectIdRegex, 'Invalid ObjectId format');

/**
 * 9.1: Create Initial Salary Structure Schema
 */
export const createSalaryStructureSchema = z.object({
  body: z.object({
    employeeId: objectIdSchema,
    effectiveFrom: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
    currency: z.string().trim().default('PKR'),
    basicSalary: z.number({ required_error: 'Basic salary is required' }).int('Must be integer paisa').min(0),
    houseRentAllowance: z.number().int('Must be integer paisa').min(0).optional().default(0),
    medicalAllowance: z.number().int('Must be integer paisa').min(0).optional().default(0),
    conveyanceAllowance: z.number().int('Must be integer paisa').min(0).optional().default(0),
    otherAllowances: z.number().int('Must be integer paisa').min(0).optional().default(0),
    eobiEnabled: z.boolean().optional().default(true),
    pessiEnabled: z.boolean().optional().default(false),
    providentFundEnabled: z.boolean().optional().default(false),
    providentFundRate: z.number().min(0).max(100).optional().default(0)
  })
});

/**
 * 9.2: Revise / Increment Salary Structure Schema
 */
export const reviseSalaryStructureSchema = z.object({
  params: z.object({
    id: objectIdSchema // employeeId
  }),
  body: z.object({
    effectiveFrom: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
    basicSalary: z.number({ required_error: 'Basic salary is required' }).int('Must be integer paisa').min(0),
    houseRentAllowance: z.number().int().min(0).optional().default(0),
    medicalAllowance: z.number().int().min(0).optional().default(0),
    conveyanceAllowance: z.number().int().min(0).optional().default(0),
    otherAllowances: z.number().int().min(0).optional().default(0),
    eobiEnabled: z.boolean().optional().default(true),
    pessiEnabled: z.boolean().optional().default(false),
    providentFundEnabled: z.boolean().optional().default(false),
    providentFundRate: z.number().min(0).max(100).optional().default(0),
    revisionReason: z.string({ required_error: 'Revision reason is required' }).trim().min(3, 'Reason must be at least 3 characters')
  })
});

/**
 * Query schema for listing salary structures
 */
export const getSalaryStructuresQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    search: z.string().optional(),
    status: z.enum(['active', 'historical', 'superseded']).optional(),
    departmentId: objectIdSchema.optional(),
    sort: z.string().optional()
  }).optional()
});

/**
 * Employee ID Param Schema
 */
export const employeeIdParamSchema = z.object({
  params: z.object({
    id: objectIdSchema
  })
});

/**
 * 9.7: Generate Payroll Run Schema
 */
export const generatePayrollRunSchema = z.object({
  body: z.object({
    month: z.number().int().min(1).max(12),
    year: z.number().int().min(2020).max(2100)
  })
});

/**
 * 9.8 / 9.9: Run ID Param Schema
 */
export const runIdParamSchema = z.object({
  params: z.object({
    id: objectIdSchema
  })
});

/**
 * 9.9: Adjust Payslip Line Item Schema
 */
export const adjustPayslipLineItemSchema = z.object({
  params: z.object({
    id: objectIdSchema, // runId
    slipId: objectIdSchema
  }),
  body: z.object({
    type: z.enum(['earning', 'deduction']),
    name: z.string().trim().min(2, 'Item name must be at least 2 characters'),
    category: z.enum([
      'basic', 'house_rent', 'medical', 'conveyance', 'allowance', 'overtime', 'bonus', 'arrears', 'encashment',
      'tax', 'eobi', 'pessi', 'provident_fund', 'unpaid_leave', 'late_penalty', 'loan_installment', 'advance', 'manual'
    ]),
    amount: z.number().int('Amount must be integer paisa').min(0),
    description: z.string().trim().default('')
  })
});

/**
 * 9.12: Bank Advice Query Schema
 */
export const bankAdviceQuerySchema = z.object({
  params: z.object({
    id: objectIdSchema // runId
  }),
  query: z.object({
    bank: z.enum(['meezan', 'hbl', 'ubl', 'mcb', 'standard']).optional().default('standard')
  }).optional()
});

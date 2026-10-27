/**
 * @file reports.validation.js
 * @description Zod validation schema for Multi-Axis Report generation and filtering.
 */

import { z } from 'zod';

export const reportQuerySchema = z
  .object({
    type: z.enum(
      ['attendance', 'leave', 'payroll', 'headcount', 'turnover', 'department-cost'],
      { required_error: 'Report type is required' }
    ),
    from: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'From date must be in YYYY-MM-DD format')
      .optional(),
    to: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'To date must be in YYYY-MM-DD format')
      .optional(),
    departmentId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid department ID').optional(),
    employeeId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid employee ID').optional(),
    status: z.string().max(40).regex(/^[a-zA-Z0-9_\s-]+$/, 'Invalid status format').optional(),
    view: z.enum(['daily', 'employee']).default('daily').optional(),
    format: z.enum(['json', 'xlsx', 'pdf']).default('json'),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(500).default(25)
  })
  .refine(
    (data) => {
      if (data.from && data.to) {
        return data.from <= data.to;
      }
      return true;
    },
    {
      message: "'from' date must be earlier than or equal to 'to' date",
      path: ['from']
    }
  );

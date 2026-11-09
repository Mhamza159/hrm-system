/**
 * @file attrition.validation.js
 * @description Zod Validation Schemas for Attrition Risk Queries and Retention Notes.
 * 
 * SPECIFICATION:
 * - Module: M17 Attrition Prediction (BUILD-GUIDE Section 26 · Rows 17.2 & 17.4)
 * - Layer: Validation (Applied prior to controller execution)
 */

import { z } from 'zod';

export const getAttritionQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    departmentId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid department ID').optional(),
    riskLevel: z.enum(['Low', 'Medium', 'High']).optional(),
    search: z.string().trim().max(100).optional(),
    sortBy: z.enum(['riskScore', 'calculatedAt', 'employeeName']).default('riskScore'),
    sortOrder: z.enum(['asc', 'desc']).default('desc')
  }).optional()
});

export const addRetentionNoteSchema = z.object({
  body: z.object({
    note: z
      .string({ required_error: 'Retention note is required' })
      .trim()
      .min(3, 'Retention note must be at least 3 characters')
      .max(1000, 'Retention note cannot exceed 1000 characters'),
    actionTaken: z
      .enum(
        [
          'Compensation Review',
          'One-on-One Wellness Check',
          'Career Pathing / Promotion',
          'Workload Rebalancing',
          'Performance Counseling',
          'Other'
        ],
        { errorMap: () => ({ message: 'Invalid actionTaken category' }) }
      )
      .default('One-on-One Wellness Check'),
    followUpDate: z
      .union([z.string(), z.date()])
      .optional()
      .nullable()
      .transform((val) => (val ? new Date(val) : null))
  })
});


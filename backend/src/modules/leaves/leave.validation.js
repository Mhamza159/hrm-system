/**
 * @file leave.validation.js
 * @description Zod Validation Schemas for Leave & Holidays Module (M6).
 * 
 * SPECIFICATION:
 * - Module: M6 Leave & Holidays (BUILD-GUIDE Section 11 · Rows 6.1 - 6.15)
 * - Layer: Validation (Request payload sanitization and constraint checking)
 */

import { z } from 'zod';

// Helper for Mongo ObjectId string validation
const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const objectIdSchema = z.string().regex(objectIdRegex, 'Invalid ObjectId format');

/**
 * 6.1: Leave Type Creation Schema
 */
export const createLeaveTypeSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Leave type name is required' }).trim().min(2).max(100),
    code: z.string({ required_error: 'Leave type code is required' }).trim().min(2).max(20).toUpperCase(),
    description: z.string().trim().max(500).optional().default(''),
    daysPerYear: z.number({ required_error: 'Allocated days per year is required' }).min(0).max(365),
    isPaid: z.boolean().optional().default(true),
    carryForwardMax: z.number().min(0).max(100).optional().default(0),
    requiresAttachment: z.boolean().optional().default(false),
    minDaysForAttachment: z.number().min(1).max(30).optional().default(3),
    genderConstraint: z.enum(['any', 'male', 'female']).optional().default('any'),
    isActive: z.boolean().optional().default(true)
  })
});

/**
 * 6.1: Leave Type Update Schema
 */
export const updateLeaveTypeSchema = z.object({
  params: z.object({
    id: objectIdSchema
  }),
  body: z.object({
    name: z.string().trim().min(2).max(100).optional(),
    code: z.string().trim().min(2).max(20).toUpperCase().optional(),
    description: z.string().trim().max(500).optional(),
    daysPerYear: z.number().min(0).max(365).optional(),
    isPaid: z.boolean().optional(),
    carryForwardMax: z.number().min(0).max(100).optional(),
    requiresAttachment: z.boolean().optional(),
    minDaysForAttachment: z.number().min(1).max(30).optional(),
    genderConstraint: z.enum(['any', 'male', 'female']).optional(),
    isActive: z.boolean().optional()
  })
});

/**
 * Common ID Param Schema
 */
export const leaveTypeIdParamSchema = z.object({
  params: z.object({
    id: objectIdSchema
  })
});

/**
 * 6.11: Holiday Creation Schema
 */
export const createHolidaySchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Holiday name is required' }).trim().min(2).max(120),
    date: z.string({ required_error: 'Holiday date is required' }).datetime().or(
      z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format')
    ),
    year: z.number().int().min(2020).max(2050).optional(),
    type: z.enum(['gazetted', 'optional', 'restricted']).optional().default('gazetted'),
    isLunar: z.boolean().optional().default(false),
    description: z.string().trim().max(500).optional().default(''),
    isActive: z.boolean().optional().default(true)
  })
});

/**
 * 6.11: Holiday Update Schema
 */
export const updateHolidaySchema = z.object({
  params: z.object({
    id: objectIdSchema
  }),
  body: z.object({
    name: z.string().trim().min(2).max(120).optional(),
    date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
    year: z.number().int().min(2020).max(2050).optional(),
    type: z.enum(['gazetted', 'optional', 'restricted']).optional(),
    isLunar: z.boolean().optional(),
    description: z.string().trim().max(500).optional(),
    isActive: z.boolean().optional()
  })
});

export const holidayIdParamSchema = z.object({
  params: z.object({
    id: objectIdSchema
  })
});

/**
 * 6.3: Apply Leave Schema
 */
export const applyLeaveSchema = z.object({
  body: z.object({
    leaveTypeId: objectIdSchema,
    startDate: z.string({ required_error: 'Start date is required' }).datetime().or(
      z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format')
    ),
    endDate: z.string({ required_error: 'End date is required' }).datetime().or(
      z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format')
    ),
    halfDay: z.enum(['none', 'first_half', 'second_half']).optional().default('none'),
    reason: z.string({ required_error: 'Reason is required' }).trim().min(5).max(1000),
    attachmentUrl: z.string().trim().optional().nullable()
  })
});

/**
 * 6.7: Decide Leave Schema (Approve/Reject)
 */
export const decideLeaveSchema = z.object({
  params: z.object({
    id: objectIdSchema
  }),
  body: z.object({
    action: z.enum(['approve', 'reject']),
    reason: z.string().trim().max(1000).optional().default('')
  })
});

/**
 * 6.8: Cancel Leave Schema
 */
export const cancelLeaveSchema = z.object({
  params: z.object({
    id: objectIdSchema
  }),
  body: z.object({
    cancellationReason: z.string({ required_error: 'Cancellation reason is required' }).trim().min(3).max(1000)
  })
});

/**
 * 6.13: Request Leave Encashment Schema
 */
export const requestEncashmentSchema = z.object({
  body: z.object({
    leaveTypeId: objectIdSchema,
    year: z.number().int().min(2020).max(2050).optional(),
    days: z.number({ required_error: 'Number of days to encash is required' }).min(0.5).max(30),
    remarks: z.string().trim().max(500).optional().default('')
  })
});

/**
 * 6.13: Decide Leave Encashment Schema
 */
export const decideEncashmentSchema = z.object({
  params: z.object({
    id: objectIdSchema
  }),
  body: z.object({
    action: z.enum(['approve', 'reject']),
    rejectionReason: z.string().trim().max(1000).optional()
  })
});

/**
 * 6.14: HR Manual Leave Balance Adjustment Schema
 */
export const adjustBalanceSchema = z.object({
  params: z.object({
    id: objectIdSchema
  }),
  body: z.object({
    balances: z.array(
      z.object({
        leaveTypeId: objectIdSchema,
        allocatedDays: z.number().min(0).max(365).optional(),
        carriedForwardDays: z.number().min(0).max(100).optional(),
        usedDays: z.number().min(0).max(365).optional(),
        pendingDays: z.number().min(0).max(365).optional(),
        encashedDays: z.number().min(0).max(100).optional()
      })
    ).min(1, 'At least one balance category must be provided'),
    overrideReason: z.string({ required_error: 'Override reason is required' }).trim().min(5).max(1000)
  })
});

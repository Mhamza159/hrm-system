/**
 * @file project.validation.js
 * @description Zod Validation Schemas for Module M22 Projects & Timesheets.
 * 
 * SPECIFICATION & SECURITY:
 * - Module: M22 Projects & Timesheets (BUILD-GUIDE Section 23 · Rows 22.1 to 22.7)
 * - Validation Pipeline: Request parameters, query filters, and body payloads.
 */

import { z } from 'zod';

export const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format');

export const paramIdSchema = z.object({
  params: z.object({
    id: objectIdSchema
  })
});

// =========================================================================
// ROW 22.1: CLIENTS & PROJECTS SCHEMAS
// =========================================================================

export const createClientSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, 'Contact name must be at least 2 characters').max(100),
    companyName: z.string().trim().min(2, 'Company name must be at least 2 characters').max(150),
    email: z.string().trim().email('Invalid email address format'),
    phone: z.string().trim().max(30).optional().default(''),
    address: z.string().trim().max(300).optional().default(''),
    currency: z.enum(['PKR', 'USD', 'EUR', 'GBP', 'AED']).default('PKR')
  })
});

export const updateClientSchema = z.object({
  params: z.object({ id: objectIdSchema }),
  body: z.object({
    name: z.string().trim().min(2).max(100).optional(),
    companyName: z.string().trim().min(2).max(150).optional(),
    email: z.string().trim().email().optional(),
    phone: z.string().trim().max(30).optional(),
    address: z.string().trim().max(300).optional(),
    currency: z.enum(['PKR', 'USD', 'EUR', 'GBP', 'AED']).optional()
  })
});

export const createProjectSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, 'Project name must be at least 2 characters').max(150),
    code: z
      .string()
      .trim()
      .min(2, 'Project code must be at least 2 characters')
      .max(30)
      .transform((val) => val.toUpperCase()),
    description: z.string().trim().max(1000).optional().default(''),
    clientId: objectIdSchema,
    departmentId: objectIdSchema,
    managerId: objectIdSchema,
    billingType: z.enum(['hourly', 'fixed', 'non_billable']).default('hourly'),
    hourlyBillingRatePaisa: z.number().int().min(0, 'Hourly billing rate in paisa cannot be negative').default(0),
    budgetPaisa: z.number().int().min(0, 'Budget in paisa cannot be negative').default(0),
    status: z.enum(['active', 'on_hold', 'completed', 'archived']).default('active'),
    startDate: z.string().datetime().optional().nullable().or(z.date()).optional().nullable(),
    endDate: z.string().datetime().optional().nullable().or(z.date()).optional().nullable()
  })
});

export const updateProjectSchema = z.object({
  params: z.object({ id: objectIdSchema }),
  body: z.object({
    name: z.string().trim().min(2).max(150).optional(),
    description: z.string().trim().max(1000).optional(),
    clientId: objectIdSchema.optional(),
    departmentId: objectIdSchema.optional(),
    managerId: objectIdSchema.optional(),
    billingType: z.enum(['hourly', 'fixed', 'non_billable']).optional(),
    hourlyBillingRatePaisa: z.number().int().min(0).optional(),
    budgetPaisa: z.number().int().min(0).optional(),
    status: z.enum(['active', 'on_hold', 'completed', 'archived']).optional(),
    startDate: z.string().datetime().optional().nullable().or(z.date()).optional().nullable(),
    endDate: z.string().datetime().optional().nullable().or(z.date()).optional().nullable()
  })
});

// =========================================================================
// ROW 22.2: PROJECT MEMBERS ASSIGNMENT SCHEMA
// =========================================================================

export const projectMemberItemSchema = z.object({
  employeeId: objectIdSchema,
  projectRole: z.enum(['Developer', 'Lead', 'QA', 'Designer', 'DevOps', 'Consultant']).default('Developer'),
  customHourlyRatePaisa: z.number().int().min(0).default(0)
});

export const assignProjectMembersSchema = z.object({
  params: z.object({ id: objectIdSchema }),
  body: z.object({
    members: z.array(projectMemberItemSchema)
  })
});

// =========================================================================
// ROW 22.3: TIMESHEET LOGGING SCHEMA
// =========================================================================

export const logTimesheetSchema = z.object({
  body: z.object({
    projectId: objectIdSchema,
    date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid calendar date format' }),
    hours: z
      .number()
      .min(0.25, 'Minimum logged duration is 0.25 hours (15 mins)')
      .max(24.0, 'Daily logged duration cannot exceed 24.0 hours')
      .refine((h) => Number.isInteger(h * 100), { message: 'Hours must have at most 2 decimal places' }),
    taskDescription: z.string().trim().min(3, 'Task description must be at least 3 characters').max(1000),
    isBillable: z.boolean().default(true)
  })
});

export const updateTimesheetSchema = z.object({
  params: z.object({ id: objectIdSchema }),
  body: z.object({
    hours: z.number().min(0.25).max(24.0).optional(),
    taskDescription: z.string().trim().min(3).max(1000).optional(),
    isBillable: z.boolean().optional()
  })
});

// =========================================================================
// ROW 22.4: TIMESHEET SUBMISSION & APPROVAL SCHEMA
// =========================================================================

export const submitWeekTimesheetSchema = z.object({
  body: z.object({
    weekStartDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid week start date' })
  })
});

export const decideTimesheetSchema = z.object({
  params: z.object({ id: objectIdSchema }),
  body: z.object({
    decision: z.enum(['approved', 'rejected']),
    rejectionReason: z.string().trim().max(500).optional()
  }).refine(
    (data) => {
      if (data.decision === 'rejected') {
        return Boolean(data.rejectionReason && data.rejectionReason.length >= 3);
      }
      return true;
    },
    { message: 'Rejection reason of at least 3 characters is mandatory when rejecting a timesheet', path: ['rejectionReason'] }
  )
});

// =========================================================================
// ROW 22.7: COMPLIANCE REMINDER SCHEMA
// =========================================================================

export const remindMissingSchema = z.object({
  body: z.object({
    weekStartDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid week start date' }),
    employeeIds: z.array(objectIdSchema).optional()
  })
});


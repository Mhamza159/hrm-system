/**
 * @file onboarding.validation.js
 * @description Zod Validation Schemas for Module M18 Onboarding & Offboarding Lifecycle.
 * 
 * SPECIFICATION & SECURITY:
 * - Module: M18 Onboarding & Offboarding (BUILD-GUIDE Section 21 · Rows 18.1 to 18.11)
 * - Middleware Defensive Hierarchy: validate(schema) blocks invalid payloads before domain service execution.
 */

import { z } from 'zod';

export const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format');

const taskCategoryEnum = z.enum(['it', 'hr', 'department', 'finance', 'admin']);
const roleAssigneeEnum = z.enum(['employee', 'manager', 'hr', 'it_admin']);
const checklistTypeEnum = z.enum(['onboarding', 'offboarding']);

const templateTaskSchema = z.object({
  title: z.string().trim().min(2, 'Task title must be at least 2 characters').max(150),
  description: z.string().trim().max(1000).optional().default(''),
  category: taskCategoryEnum.default('hr'),
  roleAssignee: roleAssigneeEnum.default('employee'),
  dueDaysOffset: z.number().int().min(-30).max(180).default(0),
  isMandatory: z.boolean().default(true)
});

// -------------------------------------------------------------------------
// 18.1: Checklist Template Master Authoring
// -------------------------------------------------------------------------
export const createChecklistTemplateSchema = z.object({
  body: z.object({
    name: z.string().trim().min(3, 'Template name must be at least 3 characters').max(100),
    type: checklistTypeEnum.default('onboarding'),
    departmentId: objectIdSchema.nullable().optional(),
    tasks: z.array(templateTaskSchema).min(1, 'Template must contain at least one task').max(100),
    isActive: z.boolean().optional().default(true)
  })
});

export const updateChecklistTemplateSchema = z.object({
  params: z.object({
    id: objectIdSchema
  }),
  body: z.object({
    name: z.string().trim().min(3).max(100).optional(),
    type: checklistTypeEnum.optional(),
    departmentId: objectIdSchema.nullable().optional(),
    tasks: z.array(templateTaskSchema).min(1).max(100).optional(),
    isActive: z.boolean().optional()
  })
});

export const getTemplateByIdSchema = z.object({
  params: z.object({
    id: objectIdSchema
  })
});

// -------------------------------------------------------------------------
// 18.2 & 18.3: Onboarding Instances & Task Completion
// -------------------------------------------------------------------------
export const getChecklistByIdSchema = z.object({
  params: z.object({
    id: objectIdSchema
  })
});

export const queryChecklistsSchema = z.object({
  query: z.object({
    type: checklistTypeEnum.optional(),
    status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
    employeeId: objectIdSchema.optional(),
    departmentId: objectIdSchema.optional(),
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(20)
  }).optional()
});

export const completeTaskSchema = z.object({
  params: z.object({
    taskId: objectIdSchema
  }),
  body: z.object({
    notes: z.string().trim().max(500).optional().default('')
  }).optional().default({})
});

// -------------------------------------------------------------------------
// 18.5 & 18.6: Resignation Submission & Decision
// -------------------------------------------------------------------------
export const submitResignationSchema = z.object({
  body: z.object({
    intendedLastWorkingDay: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'Invalid date format')),
    reason: z.enum([
      'better_opportunity',
      'career_change',
      'higher_education',
      'personal_reasons',
      'relocation',
      'health_reasons',
      'other'
    ]),
    comments: z.string().trim().max(1000).optional().default('')
  })
});

export const decideResignationSchema = z.object({
  params: z.object({
    id: objectIdSchema
  }),
  body: z.object({
    status: z.enum(['accepted', 'rejected']),
    officialLastWorkingDay: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional(),
    rejectionReason: z.string().trim().max(500).optional(),
    handoverEmployeeId: objectIdSchema.nullable().optional(),
    comments: z.string().trim().max(1000).optional()
  }).refine((data) => {
    if (data.status === 'accepted' && !data.officialLastWorkingDay) {
      return false;
    }
    if (data.status === 'rejected' && !data.rejectionReason) {
      return false;
    }
    return true;
  }, {
    message: 'Official last working day is required when accepting; rejection reason required when rejecting.'
  })
});

// -------------------------------------------------------------------------
// 18.7: Exit Clearance Sign-off
// -------------------------------------------------------------------------
export const exitClearanceSignoffSchema = z.object({
  params: z.object({
    id: objectIdSchema
  }),
  body: z.object({
    departmentCategory: z.enum(['it', 'hr', 'finance', 'admin', 'department']),
    notes: z.string().trim().max(500).optional().default('')
  })
});

// -------------------------------------------------------------------------
// 18.8: Confidential Exit Interview
// -------------------------------------------------------------------------
export const submitExitInterviewSchema = z.object({
  body: z.object({
    resignationId: objectIdSchema,
    ratings: z.object({
      cultureRating: z.number().int().min(1).max(5),
      managementRating: z.number().int().min(1).max(5),
      compensationRating: z.number().int().min(1).max(5),
      workLifeBalanceRating: z.number().int().min(1).max(5),
      careerGrowthRating: z.number().int().min(1).max(5)
    }),
    primaryReason: z.string().trim().min(3).max(200),
    feedbackManagement: z.string().trim().max(2000).optional().default(''),
    feedbackCompany: z.string().trim().max(2000).optional().default(''),
    wouldRecommend: z.boolean().default(true)
  })
});

export const getExitInterviewSchema = z.object({
  params: z.object({
    resignationId: objectIdSchema
  })
});


export const streamServiceLetterSchema = z.object({
  params: z.object({
    id: objectIdSchema,
    type: z.enum(['experience', 'relieving'])
  })
});

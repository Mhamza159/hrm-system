/**
 * @file performance.validation.js
 * @description Zod Validation Schemas for Module M19 Performance & Appraisal.
 * 
 * SPECIFICATION & SECURITY:
 * - Module: M19 Performance & Appraisal (BUILD-GUIDE Section 22 · Rows 19.1 to 19.9)
 * - Defensive validation pipeline enforcing weightage totals, rating bounds, and chronological deadlines.
 */

import { z } from 'zod';

export const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format');

// -------------------------------------------------------------------------
// 19.1: KPI Template Master Authoring
// -------------------------------------------------------------------------
export const kpiItemSchema = z.object({
  title: z.string().trim().min(3, 'KPI title must be at least 3 characters').max(150),
  description: z.string().trim().max(1000).optional().default(''),
  weightage: z.number().int().min(1, 'Weightage must be at least 1%').max(100, 'Weightage cannot exceed 100%'),
  targetCriteria: z.string().trim().min(3, 'Target criteria must be at least 3 characters').max(500)
});

export const createKpiTemplateSchema = z.object({
  body: z.object({
    name: z.string().trim().min(3, 'Template name must be at least 3 characters').max(120),
    designationId: objectIdSchema,
    description: z.string().trim().max(1000).optional().default(''),
    kpis: z.array(kpiItemSchema).min(1, 'At least one KPI is required').superRefine((kpis, ctx) => {
      const sum = kpis.reduce((acc, k) => acc + (k.weightage || 0), 0);
      if (sum !== 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Total KPI weightage must sum up to exactly 100% (currently ${sum}%)`
        });
      }
    }),
    isActive: z.boolean().optional().default(true)
  })
});

export const updateKpiTemplateSchema = z.object({
  params: z.object({ id: objectIdSchema }),
  body: z.object({
    name: z.string().trim().min(3).max(120).optional(),
    designationId: objectIdSchema.optional(),
    description: z.string().trim().max(1000).optional(),
    kpis: z.array(kpiItemSchema).min(1).superRefine((kpis, ctx) => {
      const sum = kpis.reduce((acc, k) => acc + (k.weightage || 0), 0);
      if (sum !== 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Total KPI weightage must sum up to exactly 100% (currently ${sum}%)`
        });
      }
    }).optional(),
    isActive: z.boolean().optional()
  })
});

// -------------------------------------------------------------------------
// 19.2: Review Cycle Management
// -------------------------------------------------------------------------
export const createReviewCycleSchema = z.object({
  body: z.object({
    title: z.string().trim().min(3, 'Cycle title must be at least 3 characters').max(150),
    periodType: z.enum(['quarterly', 'annual']).default('quarterly'),
    periodQuarter: z.enum(['Q1', 'Q2', 'Q3', 'Q4', 'None']).default('None'),
    periodYear: z.number().int().min(2000).max(2100),
    startDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)),
    endDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)),
    selfReviewDeadline: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)),
    managerReviewDeadline: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}/))
  }).superRefine((data, ctx) => {
    const start = new Date(data.startDate).getTime();
    const end = new Date(data.endDate).getTime();
    const selfDeadline = new Date(data.selfReviewDeadline).getTime();
    const mgrDeadline = new Date(data.managerReviewDeadline).getTime();

    if (end <= start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endDate'],
        message: 'End date must be after start date'
      });
    }
    if (selfDeadline >= mgrDeadline) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['selfReviewDeadline'],
        message: 'Self-review deadline must be strictly before manager review deadline'
      });
    }
  })
});

export const updateCycleStatusSchema = z.object({
  params: z.object({ id: objectIdSchema }),
  body: z.object({
    status: z.enum(['Draft', 'Active', 'Closed'])
  })
});

// -------------------------------------------------------------------------
// 19.3: Goals / OKRs Management
// -------------------------------------------------------------------------
export const goalItemSchema = z.object({
  title: z.string().trim().min(3, 'Goal title must be at least 3 characters').max(150),
  description: z.string().trim().max(1000).optional().default(''),
  targetValue: z.string().trim().max(100).optional().default(''),
  metricUnit: z.string().trim().max(50).optional().default(''),
  weightage: z.number().min(0).max(100).optional().default(0)
});

export const setGoalsSchema = z.object({
  params: z.object({ id: objectIdSchema }),
  body: z.object({
    goals: z.array(goalItemSchema).max(20)
  })
});

// -------------------------------------------------------------------------
// 19.4: Self Review Submission
// -------------------------------------------------------------------------
export const submitSelfReviewSchema = z.object({
  params: z.object({ id: objectIdSchema }),
  body: z.object({
    kpiRatings: z.array(z.object({
      kpiId: objectIdSchema,
      rating: z.number().int().min(1).max(5),
      comments: z.string().trim().max(1000).optional().default('')
    })).min(1),
    goalRatings: z.array(z.object({
      goalId: objectIdSchema,
      rating: z.number().int().min(1).max(5),
      comments: z.string().trim().max(1000).optional().default('')
    })).optional().default([]),
    overallSummary: z.string().trim().max(2000).optional().default('')
  })
});

// -------------------------------------------------------------------------
// 19.5: Manager Review & Scoring
// -------------------------------------------------------------------------
export const submitManagerReviewSchema = z.object({
  params: z.object({ id: objectIdSchema }),
  body: z.object({
    kpiRatings: z.array(z.object({
      kpiId: objectIdSchema,
      rating: z.number().int().min(1).max(5),
      comments: z.string().trim().max(1000).optional().default('')
    })).min(1),
    goalRatings: z.array(z.object({
      goalId: objectIdSchema,
      rating: z.number().int().min(1).max(5),
      comments: z.string().trim().max(1000).optional().default('')
    })).optional().default([]),
    strengths: z.string().trim().max(2000).optional().default(''),
    improvements: z.string().trim().max(2000).optional().default(''),
    recommendedIncrementPercent: z.number().min(0).max(100).optional().default(0),
    recommendationNotes: z.string().trim().max(1000).optional().default('')
  })
});

// -------------------------------------------------------------------------
// 19.6: 360 Peer Feedback
// -------------------------------------------------------------------------
export const peerFeedbackRequestSchema = z.object({
  params: z.object({ id: objectIdSchema }),
  body: z.object({
    peerEmployeeId: objectIdSchema
  })
});

export const submitPeerFeedbackSchema = z.object({
  params: z.object({ requestId: objectIdSchema }),
  body: z.object({
    rating: z.number().int().min(1).max(5),
    comments: z.string().trim().min(5, 'Feedback comments must be at least 5 characters').max(1000)
  })
});

// -------------------------------------------------------------------------
// 19.7: Final Appraisal & M9 Linkage
// -------------------------------------------------------------------------
export const finalizeReviewSchema = z.object({
  params: z.object({ id: objectIdSchema }),
  body: z.object({
    finalRating: z.number().int().min(1).max(5),
    finalScore: z.number().min(1).max(5).optional(),
    finalComments: z.string().trim().max(2000).optional().default(''),
    approvedIncrementPercent: z.number().min(0).max(100).optional().default(0)
  })
});

// -------------------------------------------------------------------------
// Common Route Param Schema
// -------------------------------------------------------------------------
export const paramIdSchema = z.object({
  params: z.object({ id: objectIdSchema })
});


/**
 * @file recruitment.validation.js
 * @description Zod Validation Schemas for Module M15 Recruitment & AI Screening.
 * 
 * SPECIFICATION:
 * - Module: M15 Recruitment & AI Screening (BUILD-GUIDE Section 24 · Rows 15.1 to 15.13)
 * - Layer: Request Validation Pipeline
 * - Financial Invariant: All salaries strictly non-negative integers in minor units (paisa).
 */

import { z } from 'zod';

export const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format');

// 15.1: Create Requisition
export const createRequisitionSchema = z.object({
  body: z.object({
    departmentId: objectIdSchema,
    designationId: objectIdSchema,
    openingsCount: z.number().int().min(1, 'At least 1 opening is required').default(1),
    employmentType: z.enum(['Full-time', 'Part-time', 'Contract', 'Remote', 'Internship']).default('Full-time'),
    minExperienceYears: z.number().min(0).default(0),
    minSalaryPaisa: z.number().int().min(0, 'Minimum salary must be non-negative'),
    maxSalaryPaisa: z.number().int().min(0, 'Maximum salary must be non-negative'),
    justification: z.string().trim().min(5, 'Justification must be at least 5 characters'),
    requiredSkills: z.array(z.string().trim()).optional().default([])
  }).refine((data) => data.maxSalaryPaisa >= data.minSalaryPaisa, {
    message: 'Maximum salary cannot be less than minimum salary',
    path: ['maxSalaryPaisa']
  })
});

// 15.2: Decide Requisition
export const decideRequisitionSchema = z.object({
  params: z.object({
    id: objectIdSchema
  }),
  body: z.object({
    decision: z.enum(['approved', 'rejected']),
    remarks: z.string().trim().optional().default('')
  })
});

// 15.3: Create Job
export const createJobSchema = z.object({
  body: z.object({
    requisitionId: objectIdSchema.optional().nullable(),
    title: z.string().trim().min(3, 'Job title must be at least 3 characters').max(100),
    departmentId: objectIdSchema,
    designationId: objectIdSchema,
    employmentType: z.enum(['Full-time', 'Part-time', 'Contract', 'Remote', 'Internship']).default('Full-time'),
    location: z.string().trim().default('Headquarters (Islamabad, PK)'),
    description: z.string().trim().min(10, 'Job description must be at least 10 characters'),
    requirements: z.array(z.string().trim()).default([]),
    responsibilities: z.array(z.string().trim()).default([]),
    minExperienceYears: z.number().min(0).default(0),
    minSalaryPaisa: z.number().int().min(0).optional().default(0),
    maxSalaryPaisa: z.number().int().min(0).optional().default(0),
    isSalaryDisclosed: z.boolean().optional().default(false),
    status: z.enum(['Draft', 'Published', 'Closed']).default('Draft'),
    closingDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional().nullable()
  })
});

// 15.3: Update Job
export const updateJobSchema = z.object({
  params: z.object({
    id: objectIdSchema
  }),
  body: z.object({
    title: z.string().trim().min(3).max(100).optional(),
    departmentId: objectIdSchema.optional(),
    designationId: objectIdSchema.optional(),
    employmentType: z.enum(['Full-time', 'Part-time', 'Contract', 'Remote', 'Internship']).optional(),
    location: z.string().trim().optional(),
    description: z.string().trim().min(10).optional(),
    requirements: z.array(z.string().trim()).optional(),
    responsibilities: z.array(z.string().trim()).optional(),
    minExperienceYears: z.number().min(0).optional(),
    minSalaryPaisa: z.number().int().min(0).optional(),
    maxSalaryPaisa: z.number().int().min(0).optional(),
    isSalaryDisclosed: z.boolean().optional(),
    status: z.enum(['Draft', 'Published', 'Closed']).optional(),
    closingDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional().nullable()
  })
});

// 15.4: Apply for Job (Public)
export const applyJobSchema = z.object({
  params: z.object({
    id: objectIdSchema
  }),
  body: z.object({
    name: z.string().trim().min(2, 'Full name is required').max(100),
    email: z.string().trim().email('Valid email is required'),
    phone: z.string().trim().min(7, 'Valid contact phone number is required'),
    linkedinUrl: z.string().trim().url().optional().or(z.literal('')),
    portfolioUrl: z.string().trim().url().optional().or(z.literal(''))
  })
});

// 15.7: Update Candidate Stage (Kanban)
export const updateCandidateStageSchema = z.object({
  params: z.object({
    id: objectIdSchema
  }),
  body: z.object({
    stage: z.enum(['Applied', 'Shortlisted', 'Interview', 'Technical_Test', 'Offer', 'Hired', 'Rejected']),
    notes: z.string().trim().optional().default('')
  })
});

// 15.8: Schedule Interview
export const scheduleInterviewSchema = z.object({
  params: z.object({
    id: objectIdSchema // candidateId
  }),
  body: z.object({
    roundNumber: z.number().int().min(1).default(1),
    roundType: z.enum(['Screening', 'Technical', 'Cultural', 'Executive', 'HR']).default('Technical'),
    interviewers: z.array(objectIdSchema).min(1, 'At least one interviewer is required'),
    scheduledDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?)?/)),
    durationMinutes: z.number().int().min(15).max(240).default(45),
    meetingLink: z.string().trim().optional().default('')
  })
});

// 15.8: Submit Scorecard
export const submitScorecardSchema = z.object({
  params: z.object({
    id: objectIdSchema // interviewId
  }),
  body: z.object({
    technicalRating: z.number().int().min(1).max(5),
    communicationRating: z.number().int().min(1).max(5),
    culturalRating: z.number().int().min(1).max(5),
    recommendation: z.enum(['Strong_Hire', 'Hire', 'Hold', 'No_Hire']),
    notes: z.string().trim().optional().default('')
  })
});

// 15.9: Send Technical Test
export const sendTechnicalTestSchema = z.object({
  params: z.object({
    id: objectIdSchema
  }),
  body: z.object({
    testUrl: z.string().trim().url('Valid test URL is required'),
    instructions: z.string().trim().optional().default('')
  })
});

// 15.10: Issue Offer Letter
export const issueOfferSchema = z.object({
  params: z.object({
    id: objectIdSchema
  }),
  body: z.object({
    baseSalaryPaisa: z.number().int().min(100, 'Base salary must be at least 1 PKR'),
    joiningDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)),
    allowances: z.array(
      z.object({
        name: z.string().trim().min(1),
        amountPaisa: z.number().int().min(0)
      })
    ).optional().default([]),
    probationMonths: z.number().int().min(0).max(12).default(3)
  })
});

// 15.11: Hire Candidate
export const hireCandidateSchema = z.object({
  params: z.object({
    id: objectIdSchema
  }),
  body: z.object({
    joiningDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional(),
    initialSalaryPaisa: z.number().int().min(100).optional(),
    managerId: objectIdSchema.optional()
  }).optional().default({})
});

// 15.12: Submit Employee Referral
export const submitReferralSchema = z.object({
  body: z.object({
    jobId: objectIdSchema,
    name: z.string().trim().min(2, 'Candidate name is required'),
    email: z.string().trim().email('Valid candidate email is required'),
    phone: z.string().trim().min(7, 'Valid contact phone number is required'),
    linkedinUrl: z.string().trim().url().optional().or(z.literal('')),
    portfolioUrl: z.string().trim().url().optional().or(z.literal('')),
    referralNotes: z.string().trim().min(5, 'Please provide notes on why you are referring this candidate')
  })
});

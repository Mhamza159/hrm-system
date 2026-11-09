/**
 * @file rewards.validation.js
 * @description Zod Validation Schemas for Rewards, Celebrations & Surveys (Module M20).
 */

import { z } from 'zod';
import { RECOGNITION_BADGES } from '../../models/appreciation.model.js';

export const idParamSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format')
  })
});

export const awardIdParamSchema = z.object({
  params: z.object({
    awardId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid award ID format')
  })
});

export const createAwardSchema = z.object({
  body: z.object({
    title: z.string().trim().min(3).max(150),
    month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Month must be in YYYY-MM format'),
    departmentId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid department ID').nullable().optional(),
    nominationDeadline: z.coerce.date(),
    votingDeadline: z.coerce.date(),
    prizeDetails: z.string().trim().max(500).optional().default('')
  }).refine((data) => data.nominationDeadline < data.votingDeadline, {
    message: 'Nomination deadline must be earlier than voting deadline',
    path: ['votingDeadline']
  })
});

export const nominateSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid award ID format')
  }),
  body: z.object({
    employeeId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid employee ID'),
    reason: z.string().trim().min(10, 'Citation reason must be at least 10 characters').max(1000)
  })
});

export const shortlistSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid award ID format'),
    nominationId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid nomination ID format')
  }),
  body: z.object({
    shortlisted: z.boolean()
  })
});

export const voteSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid award ID format')
  }),
  body: z.object({
    nomineeId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid nominee ID')
  })
});

export const announceWinnerSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid award ID format')
  }),
  body: z.object({
    winnerId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid winner employee ID'),
    winnerCitation: z.string().trim().min(5, 'Winner citation must be at least 5 characters').max(1000),
    prizeDetails: z.string().trim().max(500).optional()
  })
});

export const createKudosSchema = z.object({
  body: z.object({
    receiverId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid receiver employee ID'),
    badge: z.enum(RECOGNITION_BADGES, {
      errorMap: () => ({ message: 'Invalid recognition badge' })
    }),
    message: z.string().trim().min(5, 'Message must be at least 5 characters').max(500),
    isPublic: z.boolean().default(true)
  })
});

export const getKudosQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(50).default(10),
    badge: z.string().optional(),
    receiverId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid receiver ID').optional()
  }).optional()
});

export const createSurveySchema = z.object({
  body: z.object({
    title: z.string().trim().min(3).max(150),
    description: z.string().trim().max(1000).optional().default(''),
    type: z.enum(['pulse', 'poll', 'quarterly', 'culture']).default('pulse'),
    isAnonymous: z.boolean().default(true),
    targetAudience: z.enum(['company', 'department']).default('company'),
    departmentId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid department ID').nullable().optional(),
    expiresAt: z.coerce.date(),
    questions: z.array(
      z.object({
        id: z.string().min(1),
        questionText: z.string().trim().min(3).max(300),
        questionType: z.enum(['rating_5', 'text', 'multiple_choice']).default('rating_5'),
        options: z.array(z.string().trim()).optional().default([]),
        required: z.boolean().default(true)
      })
    ).min(1, 'At least one question is required')
  })
});

export const submitSurveyResponseSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid survey ID format')
  }),
  body: z.object({
    answers: z.array(
      z.object({
        questionId: z.string().min(1),
        answerValue: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())])
      })
    ).min(1, 'Answers cannot be empty')
  })
});


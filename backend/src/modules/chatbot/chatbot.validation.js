/**
 * @file chatbot.validation.js
 * @description Zod validation schemas for Module M16 HR Chatbot.
 * 
 * SPECIFICATION:
 * - Module: M16 HR Chatbot (BUILD-GUIDE Section 25 · Rows 16.1 to 16.9)
 */

import { z } from 'zod';

export const policyUploadSchema = z.object({
  body: z.object({
    title: z.string().trim().min(3, 'Title must be at least 3 characters').max(200, 'Title cannot exceed 200 characters'),
    category: z.enum(['General', 'Leave', 'Attendance', 'Conduct', 'Benefits', 'Travel', 'Security', 'Probation']).default('General'),
    description: z.string().trim().max(1000).optional().default('')
  })
});

export const policyUpdateSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Policy Document ID')
  }),
  body: z.object({
    title: z.string().trim().min(3).max(200).optional(),
    category: z.enum(['General', 'Leave', 'Attendance', 'Conduct', 'Benefits', 'Travel', 'Security', 'Probation']).optional(),
    description: z.string().trim().max(1000).optional(),
    isActive: z.boolean().optional()
  })
});

export const policyIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Policy Document ID')
  })
});

export const askChatbotSchema = z.object({
  body: z.object({
    message: z.string().trim().min(1, 'Message cannot be empty').max(2000, 'Message cannot exceed 2000 characters')
  })
});

export const escalateQuestionSchema = z.object({
  body: z.object({
    question: z.string().trim().min(3, 'Question must be at least 3 characters').max(1000, 'Question cannot exceed 1000 characters'),
    userLanguage: z.enum(['en', 'ur-roman']).optional().default('en')
  })
});

export const answerQuestionSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Unanswered Question ID')
  }),
  body: z.object({
    answer: z.string().trim().min(2, 'Answer must be at least 2 characters').max(2000, 'Answer cannot exceed 2000 characters')
  })
});

export const chatbotSettingsSchema = z.object({
  body: z.object({
    enabled: z.boolean().optional(),
    dailyLimitPerUser: z.number().int().min(1).max(1000).optional(),
    allowedRoles: z.array(z.string()).optional()
  })
});


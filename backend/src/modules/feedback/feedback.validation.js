/**
 * @file feedback.validation.js
 * @description Zod validation schemas for Feedback & Grievance endpoints.
 */

import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const trackingCodeRegex = /^TRK-[A-Za-z0-9]{4,16}$/;

export const idParamSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid feedback ID format')
  })
});

export const trackCodeParamSchema = z.object({
  params: z.object({
    code: z.string().trim().regex(trackingCodeRegex, 'Invalid tracking code format')
  })
});

export const submitFeedbackSchema = z.object({
  body: z.object({
    title: z
      .string({ required_error: 'Title is required' })
      .trim()
      .min(3, 'Title must be at least 3 characters')
      .max(150, 'Title cannot exceed 150 characters'),
    description: z
      .string({ required_error: 'Description is required' })
      .trim()
      .min(10, 'Description must be at least 10 characters')
      .max(3000, 'Description cannot exceed 3000 characters'),
    category: z.enum(
      ['Suggestion', 'Grievance', 'Workplace Issue', 'Harassment', 'Safety', 'Other'],
      { required_error: 'Valid category is required' }
    ),
    priority: z.enum(['Low', 'Medium', 'High', 'Urgent']).optional().default('Medium'),
    isAnonymous: z.boolean().optional().default(false),
    departmentId: z
      .string()
      .regex(objectIdRegex, 'Invalid department ID format')
      .optional()
      .nullable(),
    attachments: z
      .array(
        z
          .string()
          .url('Invalid attachment URL')
          .refine((url) => url.startsWith('https://'), 'Attachments must use secure HTTPS URLs')
      )
      .max(5, 'Maximum 5 attachments allowed')
      .optional()
      .default([])
  })
});

export const updateFeedbackStatusSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid feedback ID format')
  }).optional(),
  body: z.object({
    status: z.enum(['Submitted', 'Under Review', 'In Investigation', 'Resolved', 'Dismissed', 'Escalated'], {
      required_error: 'Status is required'
    }),
    resolutionNote: z.string().trim().max(2000, 'Resolution note cannot exceed 2000 characters').optional().default('')
  })
});

export const addCaseNoteSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid feedback ID format')
  }).optional(),
  body: z.object({
    note: z
      .string({ required_error: 'Note text is required' })
      .trim()
      .min(2, 'Note must be at least 2 characters')
      .max(2000, 'Note cannot exceed 2000 characters'),
    isPublicToComplainant: z.boolean().optional().default(true)
  })
});

export const escalateFeedbackSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid feedback ID format')
  }).optional(),
  body: z.object({
    reason: z
      .string({ required_error: 'Escalation reason is required' })
      .trim()
      .min(5, 'Escalation reason must be at least 5 characters')
      .max(1000, 'Escalation reason cannot exceed 1000 characters')
  })
});

export const feedbackFilterSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
    status: z.enum(['Submitted', 'Under Review', 'In Investigation', 'Resolved', 'Dismissed', 'Escalated']).optional(),
    category: z.enum(['Suggestion', 'Grievance', 'Workplace Issue', 'Harassment', 'Safety', 'Other']).optional(),
    priority: z.enum(['Low', 'Medium', 'High', 'Urgent']).optional(),
    isEscalated: z.coerce.boolean().optional(),
    search: z.string().trim().max(100, 'Search term too long').optional()
  }).optional()
});

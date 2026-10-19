/**
 * @file announcement.validation.js
 * @description Zod Validation Schemas for Announcements (Module M8 / Slices 8.6 & 8.7).
 */

import { z } from 'zod';
import mongoose from 'mongoose';

const objectIdSchema = z.string().refine((val) => !val || mongoose.Types.ObjectId.isValid(val), {
  message: 'Invalid ObjectId format'
});

export const createAnnouncementSchema = z.object({
  body: z.object({
    title: z
      .string({ required_error: 'Title is required' })
      .trim()
      .min(3, 'Title must be at least 3 characters')
      .max(150, 'Title cannot exceed 150 characters'),
    content: z
      .string({ required_error: 'Content is required' })
      .trim()
      .min(5, 'Content must be at least 5 characters'),
    targetAudience: z
      .enum(['company', 'department'], {
        errorMap: () => ({ message: "Target audience must be 'company' or 'department'" })
      })
      .default('company'),
    departmentId: objectIdSchema.nullable().optional(),
    priority: z
      .enum(['low', 'normal', 'high', 'urgent'], {
        errorMap: () => ({ message: "Priority must be 'low', 'normal', 'high', or 'urgent'" })
      })
      .default('normal'),
    pinned: z.boolean().optional().default(false)
  })
});

export const updateAnnouncementSchema = z.object({
  body: z.object({
    title: z.string().trim().min(3).max(150).optional(),
    content: z.string().trim().min(5).optional(),
    targetAudience: z.enum(['company', 'department']).optional(),
    departmentId: objectIdSchema.nullable().optional(),
    priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
    pinned: z.boolean().optional()
  })
});

export const queryAnnouncementSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
    targetAudience: z.enum(['company', 'department']).optional(),
    departmentId: objectIdSchema.optional(),
    pinnedOnly: z.coerce.boolean().optional(),
    search: z.string().trim().optional()
  }).optional()
});

export const pinAnnouncementSchema = z.object({
  body: z.object({
    pinned: z.boolean({ required_error: 'Pinned boolean status is required' })
  })
});

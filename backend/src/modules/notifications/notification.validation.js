/**
 * @file notification.validation.js
 * @description Zod Validation Schemas for Notification Queries and Preferences (Module M8 / Slice 8.2 & 8.5).
 */

import { z } from 'zod';

export const getNotificationsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    unreadOnly: z.enum(['true', 'false']).optional().default('false'),
    isArchived: z.enum(['true', 'false']).optional().default('false'),
    module: z.string().trim().optional(),
    type: z.string().trim().optional(),
    priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
    search: z.string().trim().optional()
  })
});

export const updatePreferencesSchema = z.object({
  body: z.object({
    attendance: z.object({
      inApp: z.boolean().optional(),
      email: z.boolean().optional(),
      whatsapp: z.boolean().optional()
    }).optional(),
    leave: z.object({
      inApp: z.boolean().optional(),
      email: z.boolean().optional(),
      whatsapp: z.boolean().optional()
    }).optional(),
    payroll: z.object({
      inApp: z.boolean().optional(),
      email: z.boolean().optional(),
      whatsapp: z.boolean().optional()
    }).optional(),
    announcement: z.object({
      inApp: z.boolean().optional(),
      email: z.boolean().optional(),
      whatsapp: z.boolean().optional()
    }).optional()
  }).passthrough()
});

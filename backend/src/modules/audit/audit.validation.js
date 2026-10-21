/**
 * @file audit.validation.js
 * @description Zod validation schema for Audit Log queries and forensic filtering.
 */

import { z } from 'zod';

export const auditQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(200).default(20),
    module: z.string().max(50).regex(/^[a-zA-Z0-9_-]+$/, 'Invalid module format').optional(),
    action: z.string().max(80).regex(/^[a-zA-Z0-9_.-]+$/, 'Invalid action format').optional(),
    actorId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid actor ID').optional(),
    targetId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid target ID').optional(),
    targetModel: z.string().max(50).regex(/^[a-zA-Z0-9_]+$/, 'Invalid target model format').optional(),
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format')
      .optional(),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format')
      .optional(),
    search: z.string().max(100).optional()
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return data.startDate <= data.endDate;
      }
      return true;
    },
    {
      message: "'startDate' must be earlier than or equal to 'endDate'",
      path: ['startDate']
    }
  );

/**
 * @file user.validation.js
 * @description Zod validation schemas for User Access & Security administration endpoints.
 */

import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const getUsersQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(10),
    search: z.string().trim().optional(),
    roleId: z.string().trim().optional(),
    departmentId: z.string().trim().optional(),
    status: z.enum(['all', 'active', 'inactive', 'locked']).optional().default('all'),
    accessStatus: z.enum(['all', 'assigned', 'unassigned']).optional().default('all'),
    has2fa: z.enum(['all', 'true', 'false']).optional().default('all'),
    sortBy: z.enum(['createdAt', 'name', 'email', 'lastLoginAt', 'isActive']).optional().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
  })
});

export const unlockUserSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid user ID')
  }),
  body: z.object({
    reason: z.string().trim().max(500).optional()
  }).optional()
});

export const revokeSessionsSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid user ID')
  }),
  body: z.object({
    reason: z.string().trim().min(3, 'Revocation reason must be at least 3 characters')
  })
});

export const forcePasswordChangeSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid user ID')
  }),
  body: z.object({
    reason: z.string().trim().optional()
  }).optional()
});

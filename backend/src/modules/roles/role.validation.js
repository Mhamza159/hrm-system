/**
 * @file role.validation.js
 * @description Zod Validation Schemas for Module M26 Roles & Permissions.
 * 
 * SPECIFICATION:
 * - Module: M26 Roles & Permissions (BUILD-GUIDE Section 5 · Rows 26.1 - 26.11)
 * - Layer: Validation (Runtime Type Safety & Payload Integrity Guard)
 */

import { z } from 'zod';

// Permission rule schema embedded inside role
const permissionRuleSchema = z.object({
  action: z.string().min(1, 'Permission action is required'),
  subject: z.string().min(1, 'Permission subject is required'),
  scope: z.enum(['own', 'team', 'department', 'all']).default('all'),
  fields: z.array(z.string()).optional().default([]),
  limit: z.number().nonnegative().optional()
});

/**
 * 26.7: Schema for creating a new custom role
 */
export const createRoleSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: 'Role name is required' })
      .trim()
      .min(2, 'Role name must be at least 2 characters')
      .max(50, 'Role name cannot exceed 50 characters'),
    description: z.string().trim().max(200).optional().default(''),
    permissions: z.array(permissionRuleSchema).optional().default([])
  })
});

/**
 * 26.7 & 26.8: Schema for updating existing role
 */
export const updateRoleSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid role ObjectId format')
  }),
  body: z.object({
    name: z.string().trim().min(2).max(50).optional(),
    description: z.string().trim().max(200).optional(),
    permissions: z.array(permissionRuleSchema).optional()
  })
});

/**
 * 26.10: Schema for cloning a role
 */
export const cloneRoleSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid source role ObjectId format')
  }),
  body: z.object({
    newName: z
      .string({ required_error: 'New role name is required' })
      .trim()
      .min(2, 'New role name must be at least 2 characters')
      .max(50, 'New role name cannot exceed 50 characters')
  })
});

/**
 * 26.11: Schema for assigning roles to a user
 */
export const assignRolesSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ObjectId format')
  }),
  body: z.object({
    roleIds: z
      .array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid role ID'))
      .min(1, 'At least one role must be assigned to the user')
  })
});

/**
 * @file policy.validation.js
 * @description Zod Validation Schemas for Company Policies Module.
 * 
 * SPECIFICATION:
 * - Module: Company Policies (Phase 21)
 * - Validates policy creation, updating, approval, publishing, and acknowledgement.
 */

import { z } from 'zod';

const mongoIdRegex = /^[0-9a-fA-F]{24}$/;

export const mongoIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(mongoIdRegex, 'Invalid MongoDB ObjectId')
  })
});

export const createPolicySchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Title must be at least 3 characters').max(200, 'Title cannot exceed 200 characters'),
    policyCode: z.string().min(2, 'Policy code must be at least 2 characters').max(50, 'Code cannot exceed 50 characters').trim(),
    categoryId: z.string().regex(mongoIdRegex, 'Valid category ID is required'),
    description: z.string().max(1000, 'Description cannot exceed 1000 characters').optional().default(''),
    content: z.string().min(10, 'Policy content must be at least 10 characters'),
    scope: z.enum(['All Employees', 'Department Specific', 'Role Specific', 'Management Only']).optional().default('All Employees'),
    applicableDepartmentIds: z.array(z.string().regex(mongoIdRegex, 'Invalid Department ObjectId')).optional().default([]),
    applicableRoleNames: z.array(z.string()).optional().default([]),
    requiresAcknowledgement: z.boolean().optional().default(false),
    acknowledgementGracePeriodDays: z.number().int().min(1).max(180).optional().default(7),
    effectiveDate: z.string().optional().nullable(),
    reviewDate: z.string().optional().nullable(),
    expiryDate: z.string().optional().nullable(),
    fileUrl: z.string().optional().nullable(),
    fileType: z.string().optional().nullable(),
    fileSize: z.number().optional().default(0)
  })
});

export const updatePolicySchema = z.object({
  params: z.object({
    id: z.string().regex(mongoIdRegex, 'Invalid Policy ObjectId')
  }),
  body: z.object({
    title: z.string().min(3).max(200).optional(),
    categoryId: z.string().regex(mongoIdRegex).optional(),
    description: z.string().max(1000).optional(),
    content: z.string().min(10).optional(),
    scope: z.enum(['All Employees', 'Department Specific', 'Role Specific', 'Management Only']).optional(),
    applicableDepartmentIds: z.array(z.string().regex(mongoIdRegex)).optional(),
    applicableRoleNames: z.array(z.string()).optional(),
    requiresAcknowledgement: z.boolean().optional(),
    acknowledgementGracePeriodDays: z.number().int().min(1).max(180).optional(),
    effectiveDate: z.string().optional().nullable(),
    reviewDate: z.string().optional().nullable(),
    expiryDate: z.string().optional().nullable(),
    fileUrl: z.string().optional().nullable(),
    fileType: z.string().optional().nullable(),
    fileSize: z.number().optional(),
    changeSummary: z.string().max(500).optional()
  })
});

export const policyCategorySchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name cannot exceed 100 characters'),
    code: z.string().min(2, 'Code must be at least 2 characters').max(50, 'Code cannot exceed 50 characters').trim(),
    description: z.string().max(500, 'Description cannot exceed 500 characters').optional().default(''),
    icon: z.string().optional().default('FileText'),
    color: z.string().optional().default('#00C471'),
    displayOrder: z.number().int().optional().default(0)
  })
});

export const approvePolicySchema = z.object({
  params: z.object({
    id: z.string().regex(mongoIdRegex, 'Invalid Policy ObjectId')
  }),
  body: z.object({
    notes: z.string().max(500).optional().default('')
  })
});

export const rejectPolicySchema = z.object({
  params: z.object({
    id: z.string().regex(mongoIdRegex, 'Invalid Policy ObjectId')
  }),
  body: z.object({
    reason: z.string().min(3, 'Rejection reason must be at least 3 characters').max(500, 'Reason cannot exceed 500 characters')
  })
});

export const publishPolicySchema = z.object({
  params: z.object({
    id: z.string().regex(mongoIdRegex, 'Invalid Policy ObjectId')
  }),
  body: z.object({
    effectiveDate: z.string().optional().nullable(),
    notifyWorkforce: z.boolean().optional().default(true)
  })
});

export const acknowledgePolicySchema = z.object({
  params: z.object({
    id: z.string().regex(mongoIdRegex, 'Invalid Policy ObjectId')
  }),
  body: z.object({
    signatureText: z.string().min(2, 'Digital signature confirmation is required').max(100)
  })
});

export const policyQuerySchema = z.object({
  query: z.object({
    search: z.string().optional(),
    category: z.string().optional(),
    status: z.string().optional(),
    scope: z.string().optional(),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
    myPoliciesOnly: z.coerce.boolean().optional().default(false)
  })
});

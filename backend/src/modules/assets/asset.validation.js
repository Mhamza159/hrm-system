/**
 * @file asset.validation.js
 * @description Zod Validation Schemas for Module M23 Asset Management.
 * 
 * SPECIFICATION & SECURITY:
 * - Layer: Validation Pipeline (Zod)
 * - Financial Invariants: Monetary amounts must be non-negative integers (in minor units / paisa).
 * - Enums strictly match Mongoose schema enums.
 */

import { z } from 'zod';

const assetTypeEnum = z.enum([
  'laptop',
  'desktop',
  'monitor',
  'smartphone',
  'tablet',
  'printer',
  'network_device',
  'software_license',
  'other'
]);

const assetStatusEnum = z.enum([
  'available',
  'assigned',
  'under_repair',
  'retired',
  'lost'
]);

const conditionEnum = z.enum([
  'new',
  'good',
  'fair',
  'damaged',
  'unusable'
]);

export const createAssetSchema = z.object({
  body: z.object({
    assetTag: z.string().trim().min(3, 'Asset tag must be at least 3 characters').max(30),
    name: z.string().trim().min(2, 'Asset name is required').max(100),
    type: assetTypeEnum,
    modelNumber: z.string().trim().max(100).optional().default(''),
    serialNumber: z.string().trim().min(2, 'Serial number or license key is required').max(100),
    specifications: z.object({
      processor: z.string().trim().max(100).optional().default(''),
      ramGb: z.number().int().positive().nullable().optional(),
      storageGb: z.number().int().positive().nullable().optional(),
      os: z.string().trim().max(100).optional().default(''),
      licenseKey: z.string().trim().max(200).optional().default('')
    }).optional().default({}),
    purchaseDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional().nullable(),
    purchaseCostPaisa: z.number().int().nonnegative('Cost must be positive integer paisa').optional().default(0),
    vendorName: z.string().trim().max(100).optional().default(''),
    warrantyExpiresAt: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional().nullable(),
    licenseExpiresAt: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional().nullable()
  })
});

export const updateAssetSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(100).optional(),
    type: assetTypeEnum.optional(),
    modelNumber: z.string().trim().max(100).optional(),
    specifications: z.object({
      processor: z.string().trim().max(100).optional(),
      ramGb: z.number().int().positive().nullable().optional(),
      storageGb: z.number().int().positive().nullable().optional(),
      os: z.string().trim().max(100).optional(),
      licenseKey: z.string().trim().max(200).optional()
    }).optional(),
    purchaseDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional().nullable(),
    purchaseCostPaisa: z.number().int().nonnegative().optional(),
    vendorName: z.string().trim().max(100).optional(),
    warrantyExpiresAt: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional().nullable(),
    licenseExpiresAt: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional().nullable(),
    status: assetStatusEnum.optional()
  })
});

export const queryAssetsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(10),
    status: assetStatusEnum.or(z.literal('all')).optional(),
    type: assetTypeEnum.or(z.literal('all')).optional(),
    search: z.string().trim().optional(),
    assignedTo: z.string().trim().optional(),
    expiringSoon: z.enum(['true', 'false', '1', '0']).optional()
  }).optional().default({})
});

export const assignAssetSchema = z.object({
  body: z.object({
    employeeId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid employee ID format'),
    assignedDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional(),
    condition: conditionEnum.optional().default('good'),
    notes: z.string().trim().max(500).optional().default('')
  })
});

export const returnAssetSchema = z.object({
  body: z.object({
    returnDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional(),
    condition: conditionEnum.optional().default('good'),
    notes: z.string().trim().max(500).optional().default('')
  })
});

export const repairAssetSchema = z.object({
  body: z.object({
    issueDescription: z.string().trim().min(3, 'Issue description is required').max(500),
    vendorName: z.string().trim().min(2, 'Vendor name is required').max(100),
    repairCostPaisa: z.number().int().nonnegative().optional().default(0),
    sentDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional(),
    expectedReturnDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional().nullable()
  })
});

export const updateRepairSchema = z.object({
  body: z.object({
    status: z.enum(['in_progress', 'completed', 'unrepairable']),
    actualReturnDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional(),
    finalCostPaisa: z.number().int().nonnegative().optional(),
    resolutionNotes: z.string().trim().max(500).optional().default('')
  })
});

export const reportIssueSchema = z.object({
  body: z.object({
    issueType: z.enum([
      'hardware_failure',
      'screen_damage',
      'battery_problem',
      'software_license',
      'keyboard_trackpad',
      'network_wifi',
      'other'
    ]),
    description: z.string().trim().min(5, 'Detailed description is required').max(1000),
    severity: z.enum(['low', 'medium', 'high', 'critical']).optional().default('medium')
  })
});

export const createAssetRequestSchema = z.object({
  body: z.object({
    employeeId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid employee ID format'),
    assetType: assetTypeEnum,
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional().default('medium'),
    specificationsRequired: z.string().trim().max(500).optional().default(''),
    justification: z.string().trim().min(5, 'Requisition justification is required').max(1000)
  })
});

export const approveAssetRequestSchema = z.object({
  body: z.object({
    allocatedAssetId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid asset ID format')
  })
});

export const rejectAssetRequestSchema = z.object({
  body: z.object({
    rejectionReason: z.string().trim().min(3, 'Rejection reason is required').max(500)
  })
});


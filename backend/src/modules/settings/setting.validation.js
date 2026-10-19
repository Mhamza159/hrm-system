/**
 * @file setting.validation.js
 * @description Zod Validation Schemas for Module M2 Company Settings.
 * 
 * SPECIFICATION & SECURITY:
 * - Module: M2 Company Settings (BUILD-GUIDE Section 6 · Rows 2.1 to 2.11)
 * - Layer: Validation (Runtime Type Safety & Contract Enforcement)
 */

import { z } from 'zod';

// Time string regex (HH:mm)
const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

// 2.2: Company Profile Schema
export const companyProfileSchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters').max(100),
  address: z.string().min(5, 'Address must be at least 5 characters').max(300),
  phone: z.string().min(8, 'Valid phone number is required').max(25),
  email: z.string().email('Valid company email is required'),
  website: z.string().url('Valid website URL is required').optional().or(z.literal('')),
  ntn: z.string().min(5, 'National Tax Number (NTN) is required').max(30),
  strn: z.string().max(30).optional().or(z.literal('')),
  logoUrl: z.string().optional().or(z.literal(''))
});

// 2.3: Working Days & Office Hours Schema
export const workingDaysSchema = z.array(
  z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])
).min(1, 'At least one working day must be active');

export const officeHoursSchema = z.object({
  startTime: z.string().regex(timeRegex, 'Start time must be in HH:mm format (e.g. 09:00)'),
  endTime: z.string().regex(timeRegex, 'End time must be in HH:mm format (e.g. 18:00)'),
  halfDayMinutes: z.number().int().min(60).max(480).default(240),
  flexibleShiftAllowed: z.boolean().default(false)
});

// 2.4: Late Arrival Rules Schema
export const lateRulesSchema = z.object({
  graceMinutes: z.number().int().min(0, 'Grace minutes cannot be negative').max(60, 'Grace minutes cannot exceed 60'),
  lateThresholdMinutes: z.number().int().min(1, 'Late threshold must be at least 1 minute').max(180),
  halfDayThresholdLateCount: z.number().int().min(1, 'Late threshold count must be at least 1').max(10),
  penaltyPerLatePaisa: z.number().int().min(0, 'Penalty must be non-negative integer in paisa').default(0)
});

// 2.5: Leave Policy Schema
export const leavePolicySchema = z.object({
  fiscalYearStart: z.enum(['January', 'July'], { required_error: 'Fiscal year start must be January or July' }),
  approvalChainLevels: z.number().int().min(1).max(3).default(2),
  carryForwardLimit: z.number().int().min(0).max(365).default(5),
  encashmentAllowed: z.boolean().default(true),
  sandwichRule: z.boolean().default(true),
  probationLeaveAllowed: z.boolean().default(false)
});

// 2.6: Payroll Cycle Schema
export const payrollCycleSchema = z.object({
  cycleType: z.enum(['calendar_month', 'custom_range']).default('calendar_month'),
  startDay: z.number().int().min(1).max(31).default(1),
  endDay: z.number().int().min(1).max(31).default(30),
  disbursementDay: z.number().int().min(1).max(31).default(5)
});

// 2.7: Pakistan Statutory Compliance Schemas
export const taxSlabItemSchema = z.object({
  minPaisa: z.number().int().min(0, 'Min salary must be non-negative paisa'),
  maxPaisa: z.number().int().min(0).nullable().optional(),
  fixedTaxPaisa: z.number().int().min(0).default(0),
  ratePercent: z.number().min(0).max(100, 'Rate cannot exceed 100%')
});

export const taxSlabsSchema = z.object({
  taxYear: z.string().default('2024-2025'),
  slabs: z.array(taxSlabItemSchema).min(1, 'At least one tax slab must be defined')
});

export const eobiSchema = z.object({
  enabled: z.boolean().default(true),
  employerRatePercent: z.number().min(0).max(100).default(5),
  employeeRatePercent: z.number().min(0).max(100).default(1),
  minWagePaisa: z.number().int().min(0).default(3700000) // 37,000 PKR
});

export const pessiSchema = z.object({
  enabled: z.boolean().default(false),
  employerRatePercent: z.number().min(0).max(100).default(6),
  wageCeilingPaisa: z.number().int().min(0).default(0)
});

export const providentFundSchema = z.object({
  enabled: z.boolean().default(false),
  employerPercent: z.number().min(0).max(100).default(8.33),
  employeePercent: z.number().min(0).max(100).default(8.33)
});

// 2.8: Geo-Fence Location Schema
export const geoFenceItemSchema = z.object({
  name: z.string().min(1, 'Geo-fence name is required'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radiusMeters: z.number().int().min(10, 'Radius must be at least 10 meters').max(5000),
  isActive: z.boolean().default(true)
});

export const geoFencesSchema = z.array(geoFenceItemSchema).min(1, 'At least one office geo-fence location is required');

// 2.9: Templates Schema
export const templateItemSchema = z.object({
  subject: z.string().optional(),
  body: z.string().min(1, 'Template body is required')
});

export const templatesSchema = z.record(templateItemSchema);

// Admin System Notifications & Channel Configuration Schema
export const notificationsSettingSchema = z.object({
  channels: z.object({
    inApp: z.boolean().default(true),
    email: z.boolean().default(true),
    whatsapp: z.boolean().default(false)
  }).default({ inApp: true, email: true, whatsapp: false }),
  announcements: z.object({
    inApp: z.boolean().default(true),
    email: z.boolean().default(true),
    whatsapp: z.boolean().default(false)
  }).default({ inApp: true, email: true, whatsapp: false }),
  categories: z.object({
    attendance: z.object({ inApp: z.boolean(), email: z.boolean(), whatsapp: z.boolean() }).optional(),
    leave: z.object({ inApp: z.boolean(), email: z.boolean(), whatsapp: z.boolean() }).optional(),
    payroll: z.object({ inApp: z.boolean(), email: z.boolean(), whatsapp: z.boolean() }).optional(),
    announcement: z.object({ inApp: z.boolean(), email: z.boolean(), whatsapp: z.boolean() }).optional()
  }).optional()
});

// Map of key to Zod validator schema
export const SETTING_SCHEMAS = {
  company: companyProfileSchema,
  workingDays: workingDaysSchema,
  officeHours: officeHoursSchema,
  lateRules: lateRulesSchema,
  leavePolicy: leavePolicySchema,
  payrollCycle: payrollCycleSchema,
  taxSlabs: taxSlabsSchema,
  eobi: eobiSchema,
  pessi: pessiSchema,
  providentFund: providentFundSchema,
  geoFences: geoFencesSchema,
  templates: templatesSchema,
  notifications: notificationsSettingSchema
};

/**
 * Universal setting update request schema
 */
export const updateSettingParamSchema = z.object({
  params: z.object({
    key: z.string().min(1, 'Setting key is required')
  }),
  body: z.object({
    value: z.unknown(),
    description: z.string().optional()
  })
});

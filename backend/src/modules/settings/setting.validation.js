/**
 * @file setting.validation.js
 * @description Zod Validation Schemas for Module M2 Company Settings.
 *
 * SPECIFICATION & SECURITY:
 * - Module: M2 Company Settings (BUILD-GUIDE Section 6 · Rows 2.1 to 2.11)
 * - Layer: Validation (Runtime Type Safety & Contract Enforcement)
 */

import { z } from "zod";

// Time string regex (HH:mm)
const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

// 2.2: ID Card Configuration Schema (Phase 36)
export const idCardConfigSchema = z.object({
  layout: z.enum(["vertical", "horizontal"]).default("vertical"),
  primaryColor: z.string().default("#00C471"),
  theme: z.enum(["forest", "emerald", "light", "dark"]).default("forest"),
  showBloodGroup: z.boolean().default(true),
  showEmergencyContact: z.boolean().default(true),
  showDepartment: z.boolean().default(true),
  showDesignation: z.boolean().default(true),
  showJoiningDate: z.boolean().default(true),
  showBarcode: z.boolean().default(true),
  qrCodeType: z
    .enum(["verification", "contact", "profile"])
    .default("verification"),
  cardValidityYears: z.number().int().min(1).max(10).default(2),
  backDisclaimer: z
    .string()
    .max(300)
    .default(
      "This credential card remains the property of the organization. If found, please return to Human Resources.",
    ),
});

// 2.2: Company Profile Schema
export const companyProfileSchema = z.object({
  name: z
    .string()
    .min(2, "Company name must be at least 2 characters")
    .max(100),
  legalName: z.string().max(120).optional().or(z.literal("")),
  registrationNumber: z.string().max(50).optional().or(z.literal("")),
  industry: z.string().max(80).optional().or(z.literal("")),
  businessType: z.string().max(60).optional().or(z.literal("")),
  description: z.string().max(500).optional().or(z.literal("")),
  address: z.string().min(5, "Address must be at least 5 characters").max(300),
  city: z.string().max(60).optional().or(z.literal("")),
  state: z.string().max(60).optional().or(z.literal("")),
  postalCode: z.string().max(20).optional().or(z.literal("")),
  country: z.string().max(60).default("Pakistan"),
  phone: z.string().min(8, "Valid phone number is required").max(25),
  alternatePhone: z.string().max(25).optional().or(z.literal("")),
  email: z.string().email("Valid company email is required"),
  website: z
    .string()
    .url("Valid website URL is required")
    .optional()
    .or(z.literal("")),
  ntn: z.string().min(5, "National Tax Number (NTN) is required").max(30),
  strn: z.string().max(30).optional().or(z.literal("")),
  timezone: z.string().default("Asia/Karachi"),
  currency: z.string().default("PKR"),
  logoUrl: z.string().optional().or(z.literal("")),
  idCardConfig: idCardConfigSchema.optional(),
});

// 2.3: Working Days & Office Hours Schema
export const workingDaysSchema = z
  .array(
    z.enum([
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ]),
  )
  .min(1, "At least one working day must be active");

export const officeHoursSchema = z.object({
  startTime: z
    .string()
    .regex(timeRegex, "Start time must be in HH:mm format (e.g. 09:00)"),
  endTime: z
    .string()
    .regex(timeRegex, "End time must be in HH:mm format (e.g. 18:00)"),
  breakMinutes: z.number().int().min(0).max(240).default(60),
  halfDayMinutes: z.number().int().min(60).max(480).default(240),
  fullDayMinutes: z.number().int().min(180).max(720).default(480),
  flexibleShiftAllowed: z.boolean().default(false),
  timeZone: z.string().default("Asia/Karachi"),
});

// 2.4: Late Arrival Rules Schema
export const lateRulesSchema = z.object({
  graceMinutes: z
    .number()
    .int()
    .min(0, "Grace minutes cannot be negative")
    .max(60, "Grace minutes cannot exceed 60"),
  lateThresholdMinutes: z
    .number()
    .int()
    .min(1, "Late threshold must be at least 1 minute")
    .max(180),
  halfDayThresholdLateCount: z
    .number()
    .int()
    .min(1, "Late threshold count must be at least 1")
    .max(10),
  penaltyPerLatePaisa: z
    .number()
    .int()
    .min(0, "Penalty must be non-negative integer in paisa")
    .default(0),
});

// Dynamic QR Code Attendance Kiosk Configuration Schema
export const qrAttendanceSchema = z.object({
  isEnabled: z.boolean().default(true),
  rotationSeconds: z
    .number()
    .int()
    .min(10, "Rotation seconds must be at least 10")
    .max(120, "Rotation seconds cannot exceed 120")
    .default(30),
});

// Facial Recognition Biometric Attendance Schema
export const faceAttendanceSchema = z.object({
  isEnabled: z.boolean().default(true),
  matchThreshold: z
    .number()
    .min(0.2, "Threshold must be >= 0.2")
    .max(0.8, "Threshold must be <= 0.8")
    .default(0.5),
  requireLiveness: z.boolean().default(true),
});

// 2.5: Leave Policy & Approval Chains Schemas
export const approvalChainTierSchema = z.object({
  tier: z.number().int().min(1),
  role: z.string().min(1, "Approver role is required"),
  minDaysThreshold: z.number().int().min(0).default(0),
  description: z.string().optional(),
});

export const leavePolicySchema = z.object({
  fiscalYearStart: z.enum(["January", "July"], {
    required_error: "Fiscal year start must be January or July",
  }),
  approvalChainLevels: z.number().int().min(1).max(3).default(2),
  approvalChains: z.array(approvalChainTierSchema).optional(),
  carryForwardLimit: z.number().int().min(0).max(365).default(5),
  encashmentAllowed: z.boolean().default(true),
  sandwichRule: z.boolean().default(true),
  probationLeaveAllowed: z.boolean().default(false),
});

// 2.6: Payroll Cycle Schema
export const payrollCycleSchema = z.object({
  cycleType: z
    .enum(["calendar_month", "custom_range"])
    .default("calendar_month"),
  startDay: z.number().int().min(1).max(31).default(1),
  endDay: z.number().int().min(1).max(31).default(30),
  disbursementDay: z.number().int().min(1).max(31).default(5),
});

// 2.7: Pakistan Statutory Compliance Schemas
export const taxSlabItemSchema = z.object({
  minPaisa: z.number().int().min(0, "Min salary must be non-negative paisa"),
  maxPaisa: z.number().int().min(0).nullable().optional(),
  fixedTaxPaisa: z.number().int().min(0).default(0),
  ratePercent: z.number().min(0).max(100, "Rate cannot exceed 100%"),
});

export const taxSlabsSchema = z.object({
  taxYear: z.string().default("2024-2025"),
  slabs: z
    .array(taxSlabItemSchema)
    .min(1, "At least one tax slab must be defined"),
});

export const eobiSchema = z.object({
  enabled: z.boolean().default(true),
  employerRatePercent: z.number().min(0).max(100).default(5),
  employeeRatePercent: z.number().min(0).max(100).default(1),
  minWagePaisa: z.number().int().min(0).default(3700000), // 37,000 PKR
});

export const pessiSchema = z.object({
  enabled: z.boolean().default(false),
  employerRatePercent: z.number().min(0).max(100).default(6),
  wageCeilingPaisa: z.number().int().min(0).default(0),
});

export const providentFundSchema = z.object({
  enabled: z.boolean().default(false),
  employerPercent: z.number().min(0).max(100).default(8.33),
  employeePercent: z.number().min(0).max(100).default(8.33),
});

// 2.8: Geo-Fence Location Schema
export const geoFenceItemSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Geo-fence name is required"),
  branchCode: z.string().optional(),
  address: z.string().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radiusMeters: z
    .number()
    .int()
    .min(10, "Radius must be at least 10 meters")
    .max(5000),
  isActive: z.boolean().default(true),
  isHeadquarters: z.boolean().default(false),
});

export const geoFencesSchema = z
  .array(geoFenceItemSchema)
  .min(1, "At least one office geo-fence location is required");

// 2.9: Templates Schema
export const templateItemSchema = z.object({
  subject: z.string().optional(),
  body: z.string().min(1, "Template body is required"),
});

export const templatesSchema = z.record(templateItemSchema);

// Admin System Notifications & Channel Configuration Schema
export const notificationsSettingSchema = z.object({
  channels: z
    .object({
      inApp: z.boolean().default(true),
      email: z.boolean().default(true),
      whatsapp: z.boolean().default(false),
    })
    .default({ inApp: true, email: true, whatsapp: false }),
  announcements: z
    .object({
      inApp: z.boolean().default(true),
      email: z.boolean().default(true),
      whatsapp: z.boolean().default(false),
    })
    .default({ inApp: true, email: true, whatsapp: false }),
  categories: z
    .object({
      attendance: z
        .object({
          inApp: z.boolean(),
          email: z.boolean(),
          whatsapp: z.boolean(),
        })
        .optional(),
      leave: z
        .object({
          inApp: z.boolean(),
          email: z.boolean(),
          whatsapp: z.boolean(),
        })
        .optional(),
      payroll: z
        .object({
          inApp: z.boolean(),
          email: z.boolean(),
          whatsapp: z.boolean(),
        })
        .optional(),
      announcement: z
        .object({
          inApp: z.boolean(),
          email: z.boolean(),
          whatsapp: z.boolean(),
        })
        .optional(),
    })
    .optional(),
});

// Map of key to Zod validator schema
export const SETTING_SCHEMAS = {
  company: companyProfileSchema,
  workingDays: workingDaysSchema,
  officeHours: officeHoursSchema,
  lateRules: lateRulesSchema,
  qrAttendance: qrAttendanceSchema,
  faceAttendance: faceAttendanceSchema,
  leavePolicy: leavePolicySchema,
  payrollCycle: payrollCycleSchema,
  taxSlabs: taxSlabsSchema,
  eobi: eobiSchema,
  pessi: pessiSchema,
  providentFund: providentFundSchema,
  geoFences: geoFencesSchema,
  templates: templatesSchema,
  notifications: notificationsSettingSchema,
};

/**
 * Universal setting update request schema
 */
export const updateSettingParamSchema = z.object({
  params: z.object({
    key: z.string().min(1, "Setting key is required"),
  }),
  body: z.object({
    value: z.unknown(),
    description: z.string().optional(),
  }),
});

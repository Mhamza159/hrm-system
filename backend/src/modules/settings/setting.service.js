/**
 * @file setting.service.js
 * @description Core Business Logic, Caching Engine & Audit Integration for M2 Company Settings.
 *
 * SPECIFICATION & SECURITY:
 * - Module: M2 Company Settings (BUILD-GUIDE Section 6 · Rows 2.1 to 2.11)
 * - Layer: Service (Domain Business Logic)
 * - Performance: High-throughput in-memory caching for attendance and payroll read paths.
 */

import mongoose from "mongoose";
import { Setting } from "../../models/setting.model.js";
import { SETTING_SCHEMAS } from "./setting.validation.js";
import { recordAuditLog } from "../../services/audit.service.js";
import { ApiError } from "../../utils/ApiError.js";

// Canonical default configuration blueprints
export const DEFAULT_SETTINGS = {
  company: {
    name: "Starlight Software Ltd",
    legalName: "Starlight Software (Private) Limited",
    registrationNumber: "SECP-0098412",
    industry: "Software & Information Technology",
    businessType: "Private Limited Company",
    description: "Enterprise HRM & Cloud Software Solutions.",
    address: "Plot 14, Sector I-9, Islamabad, Pakistan",
    city: "Islamabad",
    state: "Federal Capital",
    postalCode: "44000",
    country: "Pakistan",
    phone: "+92 51 1234567",
    alternatePhone: "+92 51 7654321",
    email: "hr@starlight.pk",
    website: "https://starlight.pk",
    ntn: "7284910-3",
    strn: "1234567890123",
    timezone: "Asia/Karachi",
    currency: "PKR",
    logoUrl: "",
    idCardConfig: {
      layout: "vertical",
      primaryColor: "#00C471",
      theme: "forest",
      showBloodGroup: true,
      showEmergencyContact: true,
      showDepartment: true,
      showDesignation: true,
      showJoiningDate: true,
      showBarcode: true,
      qrCodeType: "verification",
      cardValidityYears: 2,
      backDisclaimer:
        "This credential card remains the property of the organization. If found, please return to Human Resources.",
    },
  },
  workingDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
  officeHours: {
    startTime: "09:00",
    endTime: "18:00",
    breakMinutes: 60,
    halfDayMinutes: 240,
    fullDayMinutes: 480,
    flexibleShiftAllowed: false,
    timeZone: "Asia/Karachi",
  },
  lateRules: {
    graceMinutes: 15,
    lateThresholdMinutes: 30,
    halfDayThresholdLateCount: 3,
    penaltyPerLatePaisa: 0,
  },
  qrAttendance: {
    isEnabled: true,
    rotationSeconds: 30,
  },
  faceAttendance: {
    isEnabled: true,
    matchThreshold: 0.5,
    requireLiveness: true,
  },
  leavePolicy: {
    fiscalYearStart: "July",
    approvalChainLevels: 2,
    approvalChains: [
      {
        tier: 1,
        role: "Department Manager",
        minDaysThreshold: 0,
        description: "Direct Line Manager / Department Head Approval",
      },
      {
        tier: 2,
        role: "HR Manager",
        minDaysThreshold: 0,
        description: "Human Resource Operational Sanction",
      },
      {
        tier: 3,
        role: "Super Admin",
        minDaysThreshold: 5,
        description: "Executive Escalation for extended leaves (> 5 days)",
      },
    ],
    carryForwardLimit: 5,
    encashmentAllowed: true,
    sandwichRule: true,
    probationLeaveAllowed: false,
  },
  payrollCycle: {
    cycleType: "calendar_month",
    startDay: 1,
    endDay: 30,
    disbursementDay: 5,
  },
  taxSlabs: {
    taxYear: "2024-2025",
    slabs: [
      { minPaisa: 0, maxPaisa: 60000000, fixedTaxPaisa: 0, ratePercent: 0 },
      {
        minPaisa: 60000001,
        maxPaisa: 120000000,
        fixedTaxPaisa: 0,
        ratePercent: 5,
      },
      {
        minPaisa: 120000001,
        maxPaisa: 220000000,
        fixedTaxPaisa: 3000000,
        ratePercent: 15,
      },
      {
        minPaisa: 220000001,
        maxPaisa: 320000000,
        fixedTaxPaisa: 18000000,
        ratePercent: 25,
      },
      {
        minPaisa: 320000001,
        maxPaisa: 410000000,
        fixedTaxPaisa: 43000000,
        ratePercent: 30,
      },
      {
        minPaisa: 410000001,
        maxPaisa: null,
        fixedTaxPaisa: 70000000,
        ratePercent: 35,
      },
    ],
  },
  eobi: {
    enabled: true,
    employerRatePercent: 5,
    employeeRatePercent: 1,
    minWagePaisa: 3700000, // 37,000 PKR
  },
  pessi: {
    enabled: false,
    employerRatePercent: 6,
    wageCeilingPaisa: 0,
  },
  providentFund: {
    enabled: false,
    employerPercent: 8.33,
    employeePercent: 8.33,
  },
  geoFences: [
    {
      id: "branch-hq-isb",
      name: "Headquarters (Islamabad)",
      branchCode: "ISB-HQ",
      address: "Plot 14, Sector I-9, Islamabad, Pakistan",
      latitude: 33.6844,
      longitude: 73.0479,
      radiusMeters: 150,
      isActive: true,
      isHeadquarters: true,
    },
  ],
  templates: {
    welcomeEmail: {
      subject: "Welcome to {{company}}!",
      body: "Dear {{name}},\n\nWelcome to {{company}}! Your employee portal login has been activated.",
    },
    leaveApproval: {
      subject: "Leave Request Update",
      body: "Dear {{name}},\n\nYour leave application for {{date}} has been reviewed.",
    },
    payslipDispatch: {
      subject: "Monthly Payslip Released",
      body: "Dear {{name}},\n\nYour payslip for {{date}} is now ready to download.",
    },
    passwordReset: {
      subject: "Security Verification OTP",
      body: "Dear {{name}},\n\nYour security OTP is {{otp}}. This code expires in 10 minutes.",
    },
    whatsappAlert: {
      body: "HRM Alert: Dear {{name}}, your request has been updated.",
    },
  },
  notifications: {
    channels: {
      inApp: true,
      email: true,
      whatsapp: true,
    },
    announcements: {
      inApp: true,
      email: true,
      whatsapp: true,
    },
    categories: {
      attendance: { inApp: true, email: true, whatsapp: true },
      leave: { inApp: true, email: true, whatsapp: true },
      payroll: { inApp: true, email: true, whatsapp: true },
      announcement: { inApp: true, email: true, whatsapp: true },
    },
  },
};

// In-Memory Fast Cache Bus (Map of key => { value, timestamp })
const settingsCache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export class SettingService {
  /**
   * Clear in-memory cache completely (useful for test isolation)
   */
  static clearCache() {
    settingsCache.clear();
  }

  /**
   * Retrieve single configuration key with cache-first resolution
   * @param {string} key
   * @returns {Promise<any>}
   */
  static async getSetting(key) {
    const cached = settingsCache.get(key);
    const now = Date.now();

    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
      return cached.value;
    }

    // Fast-path default resolution if MongoDB connection is not open (e.g. unit tests or disconnected fallback)
    if (mongoose.connection?.readyState !== 1) {
      return DEFAULT_SETTINGS[key] || null;
    }

    let doc = await Setting.findOne({ key });

    // Bootstrap default if not yet created in MongoDB
    if (!doc) {
      const fallbackValue = DEFAULT_SETTINGS[key];
      if (fallbackValue !== undefined) {
        doc = await Setting.create({
          key,
          value: fallbackValue,
          description: `System bootstrap default for ${key}`,
        });
      } else {
        return null;
      }
    }

    settingsCache.set(key, { value: doc.value, timestamp: now });
    return doc.value;
  }

  /**
   * Retrieve all settings as a consolidated dictionary
   * @returns {Promise<Record<string, any>>}
   */
  static async getAllSettings() {
    const allDocs = await Setting.find({});
    const result = { ...DEFAULT_SETTINGS };

    for (const doc of allDocs) {
      result[doc.key] = doc.value;
      settingsCache.set(doc.key, { value: doc.value, timestamp: Date.now() });
    }

    return result;
  }

  /**
   * Update configuration setting with Zod validation, cache invalidation & audit log
   * @param {string} key
   * @param {any} rawValue
   * @param {Object} actorUser
   * @param {string} [ip]
   * @param {string} [description]
   * @returns {Promise<any>}
   */
  static async updateSetting(
    key,
    rawValue,
    actorUser,
    ip = null,
    description = "",
  ) {
    // 1. Validate payload against key schema if mapped
    const validator = SETTING_SCHEMAS[key];
    let validatedValue = rawValue;

    if (validator) {
      const parseResult = validator.safeParse(rawValue);
      if (!parseResult.success) {
        const errorMessages = parseResult.error.errors
          .map((e) => `${e.path.join(".")}: ${e.message}`)
          .join(", ");
        throw new ApiError(
          400,
          `Validation failed for setting '${key}': ${errorMessages}`,
        );
      }
      validatedValue = parseResult.data;
    }

    // 2. Capture snapshot before update
    const existingDoc = await Setting.findOne({ key });
    const beforeSnapshot = existingDoc
      ? existingDoc.value
      : DEFAULT_SETTINGS[key] || null;

    // 3. Persist update atomically
    const updatedDoc = await Setting.findOneAndUpdate(
      { key },
      {
        $set: {
          value: validatedValue,
          description:
            description ||
            existingDoc?.description ||
            `Configuration for ${key}`,
          updatedBy: actorUser?._id || null,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    // 4. Invalidate & refresh cache entry
    settingsCache.set(key, { value: updatedDoc.value, timestamp: Date.now() });

    // 5. Record immutable audit log
    await recordAuditLog({
      userId: actorUser?._id,
      actor: actorUser,
      action: "setting.update",
      entity: "Setting",
      entityId: updatedDoc._id,
      before: beforeSnapshot,
      after: validatedValue,
      ip,
      details: { key },
    });

    return updatedDoc.value;
  }

  /**
   * Retrieve sanitized public company policies for all employees (Slice 2.11)
   * @returns {Promise<Object>}
   */
  static async getPublicPolicies() {
    const all = await this.getAllSettings();

    return {
      company: {
        name: all.company?.name || "Company",
        legalName: all.company?.legalName || "",
        address: all.company?.address || "",
        city: all.company?.city || "",
        country: all.company?.country || "Pakistan",
        phone: all.company?.phone || "",
        email: all.company?.email || "",
        website: all.company?.website || "",
        timezone: all.company?.timezone || "Asia/Karachi",
        currency: all.company?.currency || "PKR",
        logoUrl: all.company?.logoUrl || "",
        idCardConfig:
          all.company?.idCardConfig || DEFAULT_SETTINGS.company.idCardConfig,
      },
      workingDays: all.workingDays || [],
      officeHours: all.officeHours || {},
      lateRules: {
        graceMinutes: all.lateRules?.graceMinutes ?? 15,
        lateThresholdMinutes: all.lateRules?.lateThresholdMinutes ?? 30,
        halfDayThresholdLateCount:
          all.lateRules?.halfDayThresholdLateCount ?? 3,
      },
      leavePolicy: {
        fiscalYearStart: all.leavePolicy?.fiscalYearStart || "July",
        carryForwardLimit: all.leavePolicy?.carryForwardLimit ?? 5,
        encashmentAllowed: all.leavePolicy?.encashmentAllowed ?? true,
        sandwichRule: all.leavePolicy?.sandwichRule ?? true,
      },
      geoFences: (all.geoFences || []).filter((gf) => gf.isActive),
    };
  }
}

export default SettingService;

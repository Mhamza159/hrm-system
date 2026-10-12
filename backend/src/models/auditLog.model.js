/**
 * @file auditLog.model.js
 * @description Mongoose Schema for immutable system audit logging.
 * 
 * COMPLIANCE & ARCHITECTURAL MANDATE:
 * - Module: M0 Foundation (BUILD-GUIDE Section 3 · Row 0.8) / X1 Security (BUILD-GUIDE Section 14)
 * - Strict Invariant: Every create, update, delete, authentication, or sensitive data access
 *   MUST produce an immutable audit log record.
 * - Sensitive Fields: Never store plain CNIC, bank credentials, or raw passwords in details.
 * - Retention: Retained permanently for Pakistan labor audit and corporate compliance.
 */

import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    // The user who triggered the action (null if automated system task/cron)
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },

    // Email snapshot of the actor at the time of the event
    actorEmail: {
      type: String,
      default: 'system'
    },

    // Role snapshot of the actor (Super Admin, HR Manager, etc.)
    actorRole: {
      type: String,
      default: 'SYSTEM'
    },

    // Standardized action key (e.g. 'USER_LOGIN', 'SALARY_UPDATED', 'ATTENDANCE_OVERRIDE')
    action: {
      type: String,
      required: true,
      index: true
    },

    // Functional module identifier ('auth', 'employee', 'payroll', 'attendance', etc.)
    module: {
      type: String,
      required: true,
      index: true
    },

    // ID of the target document being modified
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },

    // Model name of the target document ('User', 'Employee', 'SalaryStructure', etc.)
    targetModel: {
      type: String,
      default: null
    },

    // Client IP address where the request originated
    ipAddress: {
      type: String,
      default: null
    },

    // Client device user agent string
    userAgent: {
      type: String,
      default: null
    },

    // Structured metadata capturing before/after state diffs (excluding sensitive secrets)
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false } // Immutable: updates not permitted
  }
);

// High-speed compound indexes for administrative investigation screens
auditLogSchema.index({ module: 1, createdAt: -1 });
auditLogSchema.index({ actorId: 1, createdAt: -1 });
auditLogSchema.index({ targetId: 1 });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);

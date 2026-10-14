/**
 * @file setting.model.js
 * @description Mongoose Setting Schema for dynamic system configuration & company policies.
 * 
 * SPECIFICATION & SECURITY:
 * - Module: M2 Company Settings (BUILD-GUIDE Section 6 · Row 2.1)
 * - Layer: Model (Database persistence layer)
 * - Keys: company, workingDays, officeHours, lateRules, leavePolicy, payrollCycle, taxSlabs, eobi, pessi, providentFund, geoFences, templates
 */

import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema(
  {
    // Unique identifier key for the setting domain (e.g. 'company', 'lateRules')
    key: {
      type: String,
      required: [true, 'Setting key is required'],
      unique: true,
      trim: true,
      index: true
    },

    // Dynamic configuration payload stored as schema-validated JSON
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'Setting value payload is required']
    },

    // Human-readable operational description
    description: {
      type: String,
      default: ''
    },

    // Reference to User who last authored or modified this setting
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  {
    timestamps: true
  }
);

settingSchema.index({ key: 1, updatedAt: -1 });

export const Setting = mongoose.models.Setting || mongoose.model('Setting', settingSchema);

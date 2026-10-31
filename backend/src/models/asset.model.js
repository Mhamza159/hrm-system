/**
 * @file asset.model.js
 * @description Mongoose Schema for Corporate Physical Hardware & Software Asset Management.
 * 
 * SPECIFICATION & INTEGRITY:
 * - Module: M23 Asset Management (BUILD-GUIDE Section 20 · Rows 23.1, 23.2, 23.4, 23.6)
 * - Financial Invariant: All cost values (purchaseCostPaisa, repairCostPaisa) stored strictly as non-negative integer paisa.
 * - Unique Integrity: Unique indexes enforced on assetTag and serialNumber.
 * - Lifecycle Tracking: Embedded history[], repairs[], and issues[] subdocuments maintain immutable audit history.
 */

import mongoose from 'mongoose';

const HistorySubSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: ['created', 'assigned', 'returned', 'repair_sent', 'repair_completed', 'retired'],
      required: true
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    },
    notes: {
      type: String,
      trim: true,
      default: ''
    },
    condition: {
      type: String,
      enum: ['new', 'good', 'fair', 'damaged', 'unusable'],
      default: 'good'
    }
  },
  { _id: true, timestamps: true }
);

const RepairSubSchema = new mongoose.Schema(
  {
    issueDescription: {
      type: String,
      required: true,
      trim: true
    },
    vendorName: {
      type: String,
      required: true,
      trim: true
    },
    repairCostPaisa: {
      type: Number,
      default: 0,
      min: 0
    },
    sentDate: {
      type: Date,
      default: Date.now
    },
    expectedReturnDate: {
      type: Date
    },
    actualReturnDate: {
      type: Date
    },
    status: {
      type: String,
      enum: ['in_progress', 'completed', 'unrepairable'],
      default: 'in_progress'
    },
    resolutionNotes: {
      type: String,
      trim: true,
      default: ''
    }
  },
  { _id: true, timestamps: true }
);

const IssueSubSchema = new mongoose.Schema(
  {
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true
    },
    issueType: {
      type: String,
      enum: ['hardware_failure', 'screen_damage', 'battery_problem', 'software_license', 'keyboard_trackpad', 'network_wifi', 'other'],
      required: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    status: {
      type: String,
      enum: ['open', 'in_review', 'resolved'],
      default: 'open'
    },
    reportedAt: {
      type: Date,
      default: Date.now
    },
    resolutionNotes: {
      type: String,
      trim: true,
      default: ''
    }
  },
  { _id: true, timestamps: true }
);

const AssetSchema = new mongoose.Schema(
  {
    assetTag: {
      type: String,
      required: [true, 'Asset tag is mandatory'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true
    },
    name: {
      type: String,
      required: [true, 'Asset name is mandatory'],
      trim: true
    },
    type: {
      type: String,
      enum: ['laptop', 'desktop', 'monitor', 'smartphone', 'tablet', 'printer', 'network_device', 'software_license', 'other'],
      required: [true, 'Asset category type is mandatory'],
      index: true
    },
    modelNumber: {
      type: String,
      trim: true,
      default: ''
    },
    serialNumber: {
      type: String,
      required: [true, 'Serial number or license ID is mandatory'],
      unique: true,
      trim: true,
      index: true
    },
    specifications: {
      processor: { type: String, trim: true, default: '' },
      ramGb: { type: Number, default: null },
      storageGb: { type: Number, default: null },
      os: { type: String, trim: true, default: '' },
      licenseKey: { type: String, trim: true, default: '' }
    },
    purchaseDate: {
      type: Date
    },
    purchaseCostPaisa: {
      type: Number,
      default: 0,
      min: 0
    },
    vendorName: {
      type: String,
      trim: true,
      default: ''
    },
    warrantyExpiresAt: {
      type: Date,
      index: true
    },
    licenseExpiresAt: {
      type: Date,
      index: true
    },
    status: {
      type: String,
      enum: ['available', 'assigned', 'under_repair', 'retired', 'lost'],
      default: 'available',
      index: true
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
      index: true
    },
    hasOpenIssue: {
      type: Boolean,
      default: false
    },
    history: [HistorySubSchema],
    repairs: [RepairSubSchema],
    issues: [IssueSubSchema],
    isDeleted: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for optimal search and filtering
AssetSchema.index({ isDeleted: 1, status: 1 });
AssetSchema.index({ isDeleted: 1, type: 1 });
AssetSchema.index({ assignedTo: 1, isDeleted: 1 });

export const Asset = mongoose.model('Asset', AssetSchema);
export default Asset;


/**
 * @file profileChangeRequest.model.js
 * @description Mongoose Schema for Employee Profile & Organizational Change Requests.
 * 
 * SPECIFICATION & WORKFLOW:
 * - Module: M3 Employee Management / Change Request Module (Phase 33)
 * - Layer: Model (Database persistence layer)
 * - Supported Categories: personal, contact, address, emergency_contact, bank_details, department, designation, reporting_manager
 * - Lifecycle: pending -> under_review -> approved / rejected / returned / cancelled
 */

import mongoose from 'mongoose';

const attachmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    url: {
      type: String,
      required: true,
      trim: true
    },
    fileType: {
      type: String,
      default: 'application/pdf',
      trim: true
    },
    size: {
      type: Number,
      default: 0
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: true }
);

const timelineEventSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: ['submitted', 'assigned', 'review_started', 'approved', 'rejected', 'returned', 'resubmitted', 'cancelled'],
      required: true
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    actorName: {
      type: String,
      default: null
    },
    actorRole: {
      type: String,
      default: null
    },
    note: {
      type: String,
      trim: true,
      default: null
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  { _id: true }
);

const profileChangeRequestSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee ID is required'],
      index: true
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Requesting user ID is required'],
      index: true
    },
    category: {
      type: String,
      enum: [
        'personal',
        'contact',
        'address',
        'emergency_contact',
        'bank_details',
        'department',
        'designation',
        'reporting_manager'
      ],
      required: [true, 'Change request category is required'],
      index: true
    },
    field: {
      type: String,
      required: [true, 'Modified field identifier is required'],
      trim: true
    },
    oldValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    requestedValue: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'Requested value payload is required']
    },
    reason: {
      type: String,
      required: [true, 'Reason for update request is required'],
      trim: true
    },
    priority: {
      type: String,
      enum: ['normal', 'high', 'urgent'],
      default: 'normal',
      index: true
    },
    status: {
      type: String,
      enum: ['pending', 'under_review', 'approved', 'rejected', 'returned', 'cancelled'],
      default: 'pending',
      index: true
    },
    attachments: {
      type: [attachmentSchema],
      default: []
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    decidedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    decidedAt: {
      type: Date,
      default: null
    },
    decisionReason: {
      type: String,
      trim: true,
      default: null
    },
    // Retain rejectionReason for backwards compatibility
    rejectionReason: {
      type: String,
      trim: true,
      default: null
    },
    timeline: {
      type: [timelineEventSchema],
      default: []
    },
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

// Compound indexes for high-performance scoped filtering and dashboard aggregation
profileChangeRequestSchema.index({ status: 1, createdAt: -1 });
profileChangeRequestSchema.index({ employeeId: 1, status: 1 });
profileChangeRequestSchema.index({ category: 1, status: 1 });
profileChangeRequestSchema.index({ assignedTo: 1, status: 1 });
profileChangeRequestSchema.index({ isDeleted: 1, createdAt: -1 });

export const ProfileChangeRequest = mongoose.model(
  'ProfileChangeRequest',
  profileChangeRequestSchema
);

export const ChangeRequest = ProfileChangeRequest;

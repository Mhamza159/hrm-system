/**
 * @file profileChangeRequest.model.js
 * @description Mongoose Schema for Employee Sensitive Field Profile Change Requests.
 * 
 * SPECIFICATION & WORKFLOW:
 * - Module: M3 Employee Management (BUILD-GUIDE Section 8 · Row 3.16)
 * - Layer: Model (Database persistence layer)
 * - Lifecycle: pending -> approved / rejected
 */

import mongoose from 'mongoose';

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
    field: {
      type: String,
      required: [true, 'Modified field identifier is required'],
      trim: true
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
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
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
    rejectionReason: {
      type: String,
      trim: true,
      default: null
    }
  },
  {
    timestamps: true
  }
);

profileChangeRequestSchema.index({ status: 1, createdAt: -1 });

export const ProfileChangeRequest = mongoose.model(
  'ProfileChangeRequest',
  profileChangeRequestSchema
);

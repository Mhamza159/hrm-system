/**
 * @file leave.model.js
 * @description Mongoose Schema for Leave Requests & Multi-Tier Approvals (Module M6 Row 6.3).
 * 
 * SPECIFICATION:
 * - Module: M6 Leave & Holidays
 * - Layer: Model
 * - Compound Indexes: employeeId + status, dates range, and overlapping conflict lookups
 */

import mongoose from 'mongoose';

const approvalStepSchema = new mongoose.Schema(
  {
    step: {
      type: Number,
      required: true
    },
    approverRole: {
      type: String,
      required: true,
      trim: true
    },
    approverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'delegated', 'skipped'],
      default: 'pending'
    },
    decisionAt: {
      type: Date,
      default: null
    },
    decisionReason: {
      type: String,
      trim: true,
      default: ''
    },
    delegatedFrom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  { _id: true }
);

const leaveSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee reference is required'],
      index: true
    },
    leaveTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LeaveType',
      required: [true, 'Leave type reference is required'],
      index: true
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required']
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required']
    },
    days: {
      type: Number,
      required: [true, 'Deductible working days count is required'],
      min: [0.5, 'Minimum leave duration is 0.5 days']
    },
    halfDay: {
      type: String,
      enum: ['none', 'first_half', 'second_half'],
      default: 'none'
    },
    reason: {
      type: String,
      required: [true, 'Reason for leave is required'],
      trim: true,
      minlength: [5, 'Reason must be at least 5 characters long']
    },
    attachmentUrl: {
      type: String,
      default: null
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled'],
      default: 'pending',
      index: true
    },
    approvalChain: {
      type: [approvalStepSchema],
      default: []
    },
    decisionBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    decisionAt: {
      type: Date,
      default: null
    },
    decisionReason: {
      type: String,
      trim: true,
      default: ''
    },
    cancellationReason: {
      type: String,
      trim: true,
      default: ''
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true
    },
    deletedAt: {
      type: Date,
      default: null
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Compound indexes for rapid conflict checks & manager dashboard filters
leaveSchema.index({ employeeId: 1, status: 1 });
leaveSchema.index({ employeeId: 1, startDate: 1, endDate: 1 });
leaveSchema.index({ startDate: 1, endDate: 1, status: 1 });
leaveSchema.index({ 'approvalChain.approverId': 1, status: 1 });

export const Leave = mongoose.model('Leave', leaveSchema);
export default Leave;

/**
 * @file leaveType.model.js
 * @description Mongoose Schema for Company Leave Categories, Statutory Quotas & Attachment Rules.
 * 
 * SPECIFICATION & INTEGRITY:
 * - Module: M6 Leave & Holidays (BUILD-GUIDE Section 11 · Row 6.1)
 * - Layer: Model (Database persistence layer)
 * - Role Access: Super Admin / HR Manager have full management; Managers and Employees view.
 * - Standard Categories: ANNUAL, CASUAL, SICK, MATERNITY, PATERNITY, UNPAID, COMP_OFF.
 */

import mongoose from 'mongoose';

const leaveTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Leave type name is required'],
      trim: true,
      maxlength: [100, 'Leave type name cannot exceed 100 characters']
    },
    code: {
      type: String,
      required: [true, 'Leave type code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: [20, 'Leave type code cannot exceed 20 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: ''
    },
    daysPerYear: {
      type: Number,
      required: [true, 'Allocated days per year is required'],
      min: [0, 'Days per year cannot be negative'],
      default: 14
    },
    isPaid: {
      type: Boolean,
      default: true
    },
    carryForwardMax: {
      type: Number,
      min: [0, 'Carry forward limit cannot be negative'],
      default: 0
    },
    requiresAttachment: {
      type: Boolean,
      default: false
    },
    minDaysForAttachment: {
      type: Number,
      min: [1, 'Minimum days for attachment must be at least 1'],
      default: 3
    },
    genderConstraint: {
      type: String,
      enum: {
        values: ['any', 'male', 'female'],
        message: 'Gender constraint must be any, male, or female'
      },
      default: 'any'
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Indexes for fast lookup
leaveTypeSchema.index({ isActive: 1 });

export const LeaveType = mongoose.model('LeaveType', leaveTypeSchema);

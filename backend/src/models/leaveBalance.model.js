/**
 * @file leaveBalance.model.js
 * @description Mongoose Schema for Employee Yearly Leave Quota Balances & Carry-Over.
 * 
 * SPECIFICATION & INTEGRITY:
 * - Module: M6 Leave & Holidays (BUILD-GUIDE Section 11 · Row 6.2)
 * - Layer: Model (Database persistence layer)
 * - Compound Unique Index: `{ employeeId: 1, year: 1 }`
 */

import mongoose from 'mongoose';

const singleCategoryBalanceSchema = new mongoose.Schema(
  {
    leaveTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LeaveType',
      required: true
    },
    allocatedDays: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    carriedForwardDays: {
      type: Number,
      min: 0,
      default: 0
    },
    usedDays: {
      type: Number,
      min: 0,
      default: 0
    },
    pendingDays: {
      type: Number,
      min: 0,
      default: 0
    },
    encashedDays: {
      type: Number,
      min: 0,
      default: 0
    }
  },
  { _id: false }
);

const leaveBalanceSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee ID is required'],
      index: true
    },
    year: {
      type: Number,
      required: [true, 'Year is required']
    },
    balances: [singleCategoryBalanceSchema],
    lastAdjustedAt: {
      type: Date
    },
    lastAdjustedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    adjustmentReason: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

// Compound Unique Index: One document per employee per year
leaveBalanceSchema.index({ employeeId: 1, year: 1 }, { unique: true });

export const LeaveBalance = mongoose.model('LeaveBalance', leaveBalanceSchema);

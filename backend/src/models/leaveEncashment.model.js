/**
 * @file leaveEncashment.model.js
 * @description Mongoose Schema for Year-End Leave Encashment & M9 Payroll Integration.
 * 
 * SPECIFICATION:
 * - Module: M6 Leave & Holidays (BUILD-GUIDE Row 6.13)
 * - Layer: Model (Database persistence)
 * - Payout: Computed in integer paisa (PKR = paisa / 100) to eliminate IEEE 754 float drift.
 */

import mongoose from 'mongoose';

const leaveEncashmentSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee ID is required'],
      index: true
    },
    year: {
      type: Number,
      required: [true, 'Encashment year is required'],
      index: true
    },
    leaveTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LeaveType',
      required: [true, 'Leave Type ID is required']
    },
    days: {
      type: Number,
      required: [true, 'Encashable days count is required'],
      min: [0.5, 'Minimum encashment is 0.5 days']
    },
    dailyRatePaisa: {
      type: Number,
      required: [true, 'Daily salary rate in paisa is required'],
      min: [0, 'Daily rate cannot be negative']
    },
    totalAmountPaisa: {
      type: Number,
      required: [true, 'Total payout amount in paisa is required'],
      min: [0, 'Total amount cannot be negative']
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'approved', 'processed', 'rejected'],
        message: 'Invalid encashment status'
      },
      default: 'pending',
      index: true
    },
    payrollRunId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    approvedAt: {
      type: Date,
      default: null
    },
    rejectionReason: {
      type: String,
      default: null,
      trim: true
    },
    remarks: {
      type: String,
      default: '',
      trim: true
    }
  },
  {
    timestamps: true
  }
);

leaveEncashmentSchema.index({ employeeId: 1, year: 1, leaveTypeId: 1 });

export const LeaveEncashment = mongoose.model('LeaveEncashment', leaveEncashmentSchema);

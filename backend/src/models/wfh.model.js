/**
 * @file wfh.model.js
 * @description Mongoose Work From Home (WFH) Request Schema.
 * 
 * SPECIFICATION & INTEGRITY:
 * - Module: M5 Attendance & Shifts (BUILD-GUIDE Section 10 · Row 5.8)
 * - Layer: Model (Database persistence layer)
 * - Invariant: Unique compound index on { employeeId: 1, date: 1 }.
 */

import mongoose from 'mongoose';

const wfhRequestSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee ID is required'],
      index: true
    },
    date: {
      type: Date,
      required: [true, 'WFH requested date is required']
    },
    reason: {
      type: String,
      required: [true, 'Reason for WFH request is required'],
      trim: true,
      minlength: [5, 'Reason must be at least 5 characters']
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'approved', 'rejected'],
        message: 'Status must be pending, approved, or rejected'
      },
      default: 'pending',
      index: true
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
      default: null,
      trim: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

wfhRequestSchema.index({ employeeId: 1, date: 1 }, { unique: true });
wfhRequestSchema.index({ status: 1, date: 1 });

export const WFHRequest = mongoose.model('WFHRequest', wfhRequestSchema);

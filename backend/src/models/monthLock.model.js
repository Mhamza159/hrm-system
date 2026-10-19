/**
 * @file monthLock.model.js
 * @description Mongoose MonthLock Schema for Monthly Attendance Freezing Pre-Payroll.
 * 
 * SPECIFICATION & INTEGRITY:
 * - Module: M5 Attendance & Shifts (BUILD-GUIDE Section 10 · Row 5.14)
 * - Layer: Model (Database persistence layer)
 * - Invariant: Unique index on yearMonth ('YYYY-MM').
 */

import mongoose from 'mongoose';

const monthLockSchema = new mongoose.Schema(
  {
    yearMonth: {
      type: String,
      required: [true, 'Year and month string (YYYY-MM) is required'],
      unique: true,
      trim: true,
      match: [/^\d{4}-(0[1-9]|1[0-2])$/, 'yearMonth must match format YYYY-MM']
    },
    isLocked: {
      type: Boolean,
      default: true
    },
    lockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    lockedAt: {
      type: Date,
      default: Date.now
    },
    unlockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    unlockedAt: {
      type: Date,
      default: null
    },
    notes: {
      type: String,
      default: '',
      trim: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

export const MonthLock = mongoose.model('MonthLock', monthLockSchema);

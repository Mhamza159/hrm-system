/**
 * @file shift.model.js
 * @description Mongoose Shift Schema for Work Rosters & Cross-Midnight Attendance Windows.
 * 
 * SPECIFICATION & INTEGRITY:
 * - Module: M4 Departments, Designations, Shifts & Org Chart (BUILD-GUIDE Section 7 · Row 4.4)
 * - Layer: Model (Database persistence layer)
 * - Cross-Midnight: Detects overnight shifts (endTime < startTime) and flags isCrossMidnight: true
 * - Invariant: Active employee deletion guard enforced at service layer
 */

import mongoose from 'mongoose';

const shiftSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Shift name is required'],
      trim: true,
      maxlength: [100, 'Shift name cannot exceed 100 characters']
    },
    code: {
      type: String,
      required: [true, 'Shift code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: [20, 'Shift code cannot exceed 20 characters']
    },
    type: {
      type: String,
      enum: {
        values: ['fixed', 'flexible', 'night'],
        message: 'Shift type must be fixed, flexible, or night'
      },
      default: 'fixed'
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required (HH:mm 24h format)'],
      trim: true
    },
    endTime: {
      type: String,
      required: [true, 'End time is required (HH:mm 24h format)'],
      trim: true
    },
    graceMinutes: {
      type: Number,
      default: 15,
      min: 0,
      max: 120
    },
    breakMinutes: {
      type: Number,
      default: 60,
      min: 0,
      max: 240
    },
    halfDayMinutes: {
      type: Number,
      default: 240,
      min: 0,
      max: 480
    },
    workDays: {
      type: [String],
      default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    },
    isCrossMidnight: {
      type: Boolean,
      default: false
    },
    durationMinutes: {
      type: Number,
      default: 540
    },
    isActive: {
      type: Boolean,
      default: true
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    createdBy: {
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

// Indexes
shiftSchema.index({ type: 1, isDeleted: 1 });
shiftSchema.index({ isActive: 1, isDeleted: 1 });
shiftSchema.index({ isCrossMidnight: 1, isDeleted: 1 });

export const Shift = mongoose.model('Shift', shiftSchema);

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
    isArchived: {
      type: Boolean,
      default: false,
      index: true
    },
    archivedAt: {
      type: Date,
      default: null
    },
    archivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null
    },
    capacity: {
      type: Number,
      default: 0, // 0 = unlimited capacity
      min: 0
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: ''
    },
    color: {
      type: String,
      trim: true,
      default: '#00C471'
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

// Pre-save normalization hook for workDays and cross-midnight computation
shiftSchema.pre('save', function (next) {
  if (Array.isArray(this.workDays) && this.workDays.length > 0) {
    this.workDays = Array.from(new Set(this.workDays.map((d) => String(d).trim().toLowerCase())));
  }

  // Cross-midnight detection
  if (this.startTime && this.endTime) {
    const [startH, startM] = this.startTime.split(':').map(Number);
    const [endH, endM] = this.endTime.split(':').map(Number);
    let diff = (endH * 60 + endM) - (startH * 60 + startM);
    if (diff < 0) {
      diff += 24 * 60;
      this.isCrossMidnight = true;
    } else {
      this.isCrossMidnight = false;
    }
    this.durationMinutes = diff;
  }

  next();
});

// Indexes
shiftSchema.index({ type: 1, isDeleted: 1 });
shiftSchema.index({ isActive: 1, isDeleted: 1 });
shiftSchema.index({ isCrossMidnight: 1, isDeleted: 1 });
shiftSchema.index({ isArchived: 1, isDeleted: 1 });
shiftSchema.index({ type: 1, isArchived: 1 });
shiftSchema.index({ departmentId: 1, isArchived: 1 });
shiftSchema.index({ code: 1, isArchived: 1, isDeleted: 1 });

export const Shift = mongoose.model('Shift', shiftSchema);

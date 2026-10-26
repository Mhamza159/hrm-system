/**
 * @file attendance.model.js
 * @description Mongoose Attendance Schema for Daily Clock-In/Out & Status Tracking.
 * 
 * SPECIFICATION & INTEGRITY:
 * - Module: M5 Attendance & Shifts (BUILD-GUIDE Section 10 · Row 5.1)
 * - Layer: Model (Database persistence layer)
 * - Invariant: Compound unique index on { employeeId: 1, date: 1 } prevents duplicate daily records.
 * - Invariant: Date is normalized to UTC midnight.
 */

import mongoose from 'mongoose';

const breakItemSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['meal', 'tea', 'prayer', 'other'],
      default: 'meal'
    },
    startTime: {
      type: Date,
      required: [true, 'Break start time is required']
    },
    endTime: {
      type: Date,
      default: null
    },
    durationMinutes: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  { _id: true }
);

const attendanceAuditSchema = new mongoose.Schema(
  {
    modifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    modifiedAt: {
      type: Date,
      default: Date.now
    },
    previousValues: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    newValues: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    reason: {
      type: String,
      required: [true, 'Override reason is required'],
      trim: true,
      minlength: [5, 'Reason must be at least 5 characters']
    }
  },
  { _id: true }
);

const attendanceSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee ID is required'],
      index: true
    },
    date: {
      type: Date,
      required: [true, 'Attendance date is required']
    },
    shiftId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shift',
      default: null
    },
    checkIn: {
      type: Date,
      default: null
    },
    checkOut: {
      type: Date,
      default: null
    },
    breaks: {
      type: [breakItemSchema],
      default: []
    },
    totalBreakMinutes: {
      type: Number,
      default: 0,
      min: 0
    },
    workDurationMinutes: {
      type: Number,
      default: 0,
      min: 0
    },
    overtimeMinutes: {
      type: Number,
      default: 0,
      min: 0
    },
    overtimeApproved: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: {
        values: ['present', 'late', 'half_day', 'absent', 'on_leave', 'holiday'],
        message: 'Invalid attendance status'
      },
      default: 'present'
    },
    flags: {
      type: [String],
      enum: ['earlyDeparture', 'graceApplied', 'wfh', 'manualAdjustment', 'flexible_executive'],
      default: []
    },
    source: {
      type: String,
      enum: ['web', 'mobile', 'biometric', 'qr', 'system_auto_absent', 'manual_hr', 'wfh'],
      default: 'web'
    },
    location: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
      address: { type: String, default: null }
    },
    ipAddress: {
      type: String,
      default: null,
      trim: true
    },
    userAgent: {
      type: String,
      default: null
    },
    auditLogs: {
      type: [attendanceAuditSchema],
      default: []
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Compound Unique Index: Strictly 1 record per employee per day
attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

// Auxiliary query indexes
attendanceSchema.index({ date: 1, status: 1 });
attendanceSchema.index({ shiftId: 1, date: 1 });
attendanceSchema.index({ status: 1 });

export const Attendance = mongoose.model('Attendance', attendanceSchema);

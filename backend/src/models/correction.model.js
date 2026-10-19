/**
 * @file correction.model.js
 * @description Mongoose Missed-Punch Attendance Correction Request Schema.
 * 
 * SPECIFICATION & INTEGRITY:
 * - Module: M5 Attendance & Shifts (BUILD-GUIDE Section 10 · Row 5.12)
 * - Layer: Model (Database persistence layer)
 */

import mongoose from 'mongoose';

const attendanceCorrectionSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee ID is required'],
      index: true
    },
    attendanceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Attendance',
      default: null
    },
    date: {
      type: Date,
      required: [true, 'Date of missed punch is required']
    },
    requestedCheckIn: {
      type: Date,
      default: null
    },
    requestedCheckOut: {
      type: Date,
      default: null
    },
    reason: {
      type: String,
      required: [true, 'Reason for correction request is required'],
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
    decisionNotes: {
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

attendanceCorrectionSchema.index({ employeeId: 1, date: 1 });
attendanceCorrectionSchema.index({ status: 1, date: 1 });

export const AttendanceCorrection = mongoose.model('AttendanceCorrection', attendanceCorrectionSchema);

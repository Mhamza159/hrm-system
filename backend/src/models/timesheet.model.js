/**
 * @file timesheet.model.js
 * @description Mongoose model for daily timesheet logs, approval workflows, and immutability invariants.
 * 
 * SPECIFICATION:
 * - Module: M22 Projects & Timesheets (BUILD-GUIDE Section 23 · Rows 22.3, 22.4)
 * - Layer: Data Access Layer (Mongoose Model)
 * - Business Invariants: Max 24.0 hours per calendar day across projects. Approved logs locked permanently.
 */

import mongoose from 'mongoose';

const timesheetSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee reference is required for timesheet log']
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project reference is required for timesheet log']
    },
    date: {
      type: Date,
      required: [true, 'Work date is required']
    },
    weekNumber: {
      type: String,
      required: [true, 'ISO week identifier (e.g. 2026-W45) is required'],
      trim: true,
      index: true
    },
    weekStartDate: {
      type: Date,
      required: [true, 'Week start date is required'],
      index: true
    },
    hours: {
      type: Number,
      required: [true, 'Logged hours value is required'],
      min: [0.25, 'Minimum loggable duration is 0.25 hours (15 mins)'],
      max: [24.0, 'Daily hours cannot exceed 24.0 hours']
    },
    taskDescription: {
      type: String,
      required: [true, 'Task description is required'],
      trim: true,
      minlength: [3, 'Task description must be at least 3 characters'],
      maxlength: [1000, 'Task description cannot exceed 1000 characters']
    },
    isBillable: {
      type: Boolean,
      default: true
    },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'approved', 'rejected'],
      default: 'draft',
      index: true
    },
    submittedAt: {
      type: Date,
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
      trim: true,
      default: ''
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Compound unique index per employee + project + calendar day
timesheetSchema.index(
  { employeeId: 1, projectId: 1, date: 1, isDeleted: 1 },
  { unique: true }
);

timesheetSchema.index({ employeeId: 1, date: 1, isDeleted: 1 });
timesheetSchema.index({ projectId: 1, date: 1, isDeleted: 1 });
timesheetSchema.index({ weekStartDate: 1, status: 1, isDeleted: 1 });

export const Timesheet = mongoose.model('Timesheet', timesheetSchema);


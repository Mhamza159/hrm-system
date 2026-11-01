/**
 * @file resignation.model.js
 * @description Mongoose Schema for Employee Resignation Submission and Notice Tracking.
 * 
 * SPECIFICATION:
 * - Module: M18 Onboarding & Offboarding (BUILD-GUIDE Section 21 · Rows 18.5, 18.6)
 * - Tracks employee-initiated departures, proposed vs official last working day, and manager decisions.
 */

import mongoose from 'mongoose';

const ResignationSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Target employee reference is required']
    },
    submissionDate: {
      type: Date,
      default: Date.now
    },
    intendedLastWorkingDay: {
      type: Date,
      required: [true, 'Intended last working day is required']
    },
    officialLastWorkingDay: {
      type: Date,
      default: null
    },
    reason: {
      type: String,
      enum: [
        'better_opportunity',
        'career_change',
        'higher_education',
        'personal_reasons',
        'relocation',
        'health_reasons',
        'other'
      ],
      required: [true, 'Resignation reason is required'],
      default: 'better_opportunity'
    },
    comments: {
      type: String,
      trim: true,
      default: '',
      maxlength: 1000
    },
    status: {
      type: String,
      enum: ['submitted', 'accepted', 'rejected', 'withdrawn'],
      required: true,
      default: 'submitted'
    },
    decidedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    decidedAt: {
      type: Date,
      default: null
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: '',
      maxlength: 500
    },
    noticePeriodDays: {
      type: Number,
      default: 30
    },
    handoverEmployeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null
    },
    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// Indexes
ResignationSchema.index({ employeeId: 1, status: 1, isDeleted: 1 });
ResignationSchema.index({ employeeId: 1 }, { unique: true, partialFilterExpression: { status: { $in: ['submitted', 'accepted'] }, isDeleted: false } });
ResignationSchema.index({ submissionDate: -1 });
ResignationSchema.index({ officialLastWorkingDay: 1 });

const Resignation = mongoose.model('Resignation', ResignationSchema);

export default Resignation;


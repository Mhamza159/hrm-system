/**
 * @file requisition.model.js
 * @description Mongoose Schema for Headcount Job Requisitions (Module M15 / Rows 15.1, 15.2).
 * 
 * SPECIFICATION:
 * - Module: M15 Recruitment & AI Screening (BUILD-GUIDE Section 24 · Rows 15.1, 15.2)
 * - Financial Invariant: All monetary figures stored strictly as integers in minor units (paisa: 1 PKR = 100 paisa).
 * - Compound Indexes: { status: 1, departmentId: 1 }, { requestedBy: 1, isDeleted: 1 }
 */

import mongoose from 'mongoose';

const requisitionSchema = new mongoose.Schema(
  {
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
      index: true
    },
    designationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Designation',
      required: true,
      index: true
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true
    },
    openingsCount: {
      type: Number,
      required: true,
      min: 1,
      default: 1
    },
    employmentType: {
      type: String,
      enum: ['Full-time', 'Part-time', 'Contract', 'Remote', 'Internship'],
      default: 'Full-time'
    },
    minExperienceYears: {
      type: Number,
      min: 0,
      default: 0
    },
    minSalaryPaisa: {
      type: Number,
      required: true,
      min: 0
    },
    maxSalaryPaisa: {
      type: Number,
      required: true,
      min: 0
    },
    justification: {
      type: String,
      required: true,
      trim: true
    },
    requiredSkills: {
      type: [String],
      default: []
    },
    status: {
      type: String,
      enum: ['Draft', 'Pending_Approval', 'Approved', 'Rejected'],
      default: 'Pending_Approval',
      index: true
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
    decisionRemarks: {
      type: String,
      trim: true,
      default: ''
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      default: null
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

requisitionSchema.index({ status: 1, departmentId: 1 });
requisitionSchema.index({ requestedBy: 1, isDeleted: 1 });

export const Requisition = mongoose.model('Requisition', requisitionSchema);
export default Requisition;


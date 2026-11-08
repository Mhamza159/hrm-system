/**
 * @file job.model.js
 * @description Mongoose Schema for Job Openings (Module M15 / Rows 15.2, 15.3).
 * 
 * SPECIFICATION:
 * - Module: M15 Recruitment & AI Screening (BUILD-GUIDE Section 24 · Rows 15.2, 15.3)
 * - Compound Indexes: { status: 1, departmentId: 1 }, { slug: 1 } (unique)
 */

import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema(
  {
    requisitionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Requisition',
      default: null,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
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
    employmentType: {
      type: String,
      enum: ['Full-time', 'Part-time', 'Contract', 'Remote', 'Internship'],
      default: 'Full-time'
    },
    location: {
      type: String,
      default: 'Headquarters (Islamabad, PK)',
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    requirements: {
      type: [String],
      default: []
    },
    responsibilities: {
      type: [String],
      default: []
    },
    minExperienceYears: {
      type: Number,
      min: 0,
      default: 0
    },
    minSalaryPaisa: {
      type: Number,
      default: 0
    },
    maxSalaryPaisa: {
      type: Number,
      default: 0
    },
    isSalaryDisclosed: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ['Draft', 'Published', 'Closed'],
      default: 'Draft',
      index: true
    },
    closingDate: {
      type: Date,
      default: null
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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

jobSchema.index({ status: 1, departmentId: 1 });
jobSchema.index({ status: 1, closingDate: 1 });

export const Job = mongoose.model('Job', jobSchema);
export default Job;


/**
 * @file candidate.model.js
 * @description Mongoose Schema for Job Candidates & AI Resume Data (Module M15 / Rows 15.4 to 15.13).
 * 
 * SPECIFICATION:
 * - Module: M15 Recruitment & AI Screening (BUILD-GUIDE Section 24 · Rows 15.4 to 15.13)
 * - Financial Invariant: Offer salaries stored strictly as integer paisa (1 PKR = 100 paisa).
 * - Compound Indexes: { jobId: 1, stage: 1 }, { email: 1, jobId: 1 }, { aiScore: -1 }
 */

import mongoose from 'mongoose';

const stageHistorySchema = new mongoose.Schema(
  {
    stage: {
      type: String,
      required: true
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    notes: {
      type: String,
      trim: true,
      default: ''
    }
  },
  { _id: true }
);

const candidateSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    cvUrl: {
      type: String,
      required: true,
      trim: true
    },
    cvText: {
      type: String,
      default: ''
    },
    linkedinUrl: {
      type: String,
      trim: true,
      default: ''
    },
    portfolioUrl: {
      type: String,
      trim: true,
      default: ''
    },
    stage: {
      type: String,
      enum: ['Applied', 'Shortlisted', 'Interview', 'Technical_Test', 'Offer', 'Hired', 'Rejected'],
      default: 'Applied',
      index: true
    },
    stageHistory: {
      type: [stageHistorySchema],
      default: []
    },
    aiScore: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
      index: true
    },
    aiScreeningReason: {
      type: String,
      trim: true,
      default: ''
    },
    parsedProfile: {
      candidateName: { type: String, default: '' },
      parsedSkills: { type: [String], default: [] },
      totalExperienceYears: { type: Number, default: 0 },
      highestEducation: { type: String, default: '' },
      executiveSummary: { type: String, default: '' },
      matchingStrengths: { type: [String], default: [] },
      missingSkills: { type: [String], default: [] }
    },
    parsingStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending'
    },
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
      index: true
    },
    referralNotes: {
      type: String,
      trim: true,
      default: ''
    },
    technicalTest: {
      testUrl: { type: String, trim: true, default: '' },
      assignedDate: { type: Date, default: null },
      status: {
        type: String,
        enum: ['Not_Sent', 'Pending_Submission', 'Completed', 'Waived'],
        default: 'Not_Sent'
      },
      score: { type: Number, default: null },
      notes: { type: String, trim: true, default: '' }
    },
    offerDetails: {
      baseSalaryPaisa: { type: Number, default: 0 },
      joiningDate: { type: Date, default: null },
      allowances: [
        {
          name: { type: String, trim: true },
          amountPaisa: { type: Number, default: 0 }
        }
      ],
      letterUrl: { type: String, default: '' },
      issuedAt: { type: Date, default: null },
      status: {
        type: String,
        enum: ['Draft', 'Issued', 'Accepted', 'Declined'],
        default: 'Draft'
      }
    },
    hiredEmployeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
      index: true
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

candidateSchema.index({ jobId: 1, stage: 1 });
candidateSchema.index({ email: 1, jobId: 1 });
candidateSchema.index({ aiScore: -1 });

export const Candidate = mongoose.model('Candidate', candidateSchema);
export default Candidate;

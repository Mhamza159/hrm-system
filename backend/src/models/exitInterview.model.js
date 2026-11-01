/**
 * @file exitInterview.model.js
 * @description Mongoose Schema for Confidential Employee Exit Surveys.
 * 
 * SPECIFICATION:
 * - Module: M18 Onboarding & Offboarding (BUILD-GUIDE Section 21 · Row 18.8)
 * - Security & Privacy: Strictly restricted to HR Management and Super Admin.
 */

import mongoose from 'mongoose';

const ExitInterviewSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee reference is required']
    },
    resignationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resignation',
      required: [true, 'Resignation reference is required'],
      unique: true
    },
    submittedAt: {
      type: Date,
      default: Date.now
    },
    ratings: {
      cultureRating: { type: Number, min: 1, max: 5, required: true },
      managementRating: { type: Number, min: 1, max: 5, required: true },
      compensationRating: { type: Number, min: 1, max: 5, required: true },
      workLifeBalanceRating: { type: Number, min: 1, max: 5, required: true },
      careerGrowthRating: { type: Number, min: 1, max: 5, required: true }
    },
    primaryReason: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    feedbackManagement: {
      type: String,
      trim: true,
      default: '',
      maxlength: 2000
    },
    feedbackCompany: {
      type: String,
      trim: true,
      default: '',
      maxlength: 2000
    },
    wouldRecommend: {
      type: Boolean,
      default: true
    },
    isConfidential: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// Indexes
ExitInterviewSchema.index({ employeeId: 1 });

const ExitInterview = mongoose.model('ExitInterview', ExitInterviewSchema);

export default ExitInterview;

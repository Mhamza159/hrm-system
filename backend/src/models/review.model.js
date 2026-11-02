/**
 * @file review.model.js
 * @description Mongoose Schema for Individual Employee Performance Reviews.
 * 
 * SPECIFICATION:
 * - Module: M19 Performance & Appraisal (BUILD-GUIDE Section 22 · Rows 19.2 to 19.7)
 * - Scope: Individual employee appraisal instances, KPI & Goal scoring, 360 peer feedback, and final sign-off.
 */

import mongoose from 'mongoose';

const ReviewKpiItemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    weightage: { type: Number, required: true, min: 1, max: 100 },
    targetCriteria: { type: String, required: true },
    selfRating: { type: Number, min: 1, max: 5 },
    selfComments: { type: String, maxlength: 1000, default: '' },
    managerRating: { type: Number, min: 1, max: 5 },
    managerComments: { type: String, maxlength: 1000, default: '' }
  },
  { _id: true, timestamps: true }
);

const ReviewGoalItemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    targetValue: { type: String, default: '' },
    metricUnit: { type: String, default: '' },
    weightage: { type: Number, default: 0, min: 0, max: 100 },
    selfRating: { type: Number, min: 1, max: 5 },
    selfComments: { type: String, maxlength: 1000, default: '' },
    managerRating: { type: Number, min: 1, max: 5 },
    managerComments: { type: String, maxlength: 1000, default: '' }
  },
  { _id: true, timestamps: true }
);

const PeerFeedbackItemSchema = new mongoose.Schema(
  {
    peerEmployeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    requestedAt: {
      type: Date,
      default: Date.now
    },
    submitted: {
      type: Boolean,
      default: false
    },
    submittedAt: {
      type: Date
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comments: {
      type: String,
      maxlength: 1000,
      default: ''
    },
    isAnonymous: {
      type: Boolean,
      default: true
    }
  },
  { _id: true, timestamps: true }
);

const ReviewSchema = new mongoose.Schema(
  {
    cycleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ReviewCycle',
      required: true
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department'
    },
    designationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Designation'
    },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee'
    },
    status: {
      type: String,
      enum: [
        'Active',
        'Self_Review',
        'Manager_Review',
        'Ready_For_Finalization',
        'Finalized',
        'Cancelled'
      ],
      default: 'Active'
    },
    kpis: [ReviewKpiItemSchema],
    goals: [ReviewGoalItemSchema],
    selfReview: {
      submitted: { type: Boolean, default: false },
      submittedAt: { type: Date },
      overallSummary: { type: String, maxlength: 2000, default: '' },
      calculatedScore: { type: Number, default: 0 }
    },
    managerReview: {
      submitted: { type: Boolean, default: false },
      submittedAt: { type: Date },
      strengths: { type: String, maxlength: 2000, default: '' },
      improvements: { type: String, maxlength: 2000, default: '' },
      recommendedIncrementPercent: { type: Number, min: 0, max: 100, default: 0 },
      recommendationNotes: { type: String, maxlength: 1000, default: '' },
      calculatedScore: { type: Number, default: 0 }
    },
    peerFeedbacks: [PeerFeedbackItemSchema],
    finalAppraisal: {
      finalRating: { type: Number, min: 1, max: 5 },
      finalScore: { type: Number },
      finalComments: { type: String, maxlength: 2000, default: '' },
      approvedIncrementPercent: { type: Number, min: 0, max: 100, default: 0 },
      finalizedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      finalizedAt: { type: Date },
      salaryRevisionId: { type: mongoose.Schema.Types.ObjectId, ref: 'SalaryStructure' }
    },
    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes
ReviewSchema.index({ cycleId: 1, employeeId: 1, isDeleted: 1 }, { unique: true });
ReviewSchema.index({ employeeId: 1, status: 1 });
ReviewSchema.index({ departmentId: 1, status: 1 });
ReviewSchema.index({ managerId: 1, status: 1 });
ReviewSchema.index({ cycleId: 1, status: 1 });

const Review = mongoose.models.Review || mongoose.model('Review', ReviewSchema);
export default Review;


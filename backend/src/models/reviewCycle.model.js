/**
 * @file reviewCycle.model.js
 * @description Mongoose Schema for Performance Review Cycles.
 * 
 * SPECIFICATION:
 * - Module: M19 Performance & Appraisal (BUILD-GUIDE Section 22 · Row 19.2)
 * - Scope: Quarterly / Annual evaluation cycle orchestration and deadline tracking.
 */

import mongoose from 'mongoose';

const ReviewCycleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Cycle title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [150, 'Title cannot exceed 150 characters']
    },
    periodType: {
      type: String,
      enum: ['quarterly', 'annual'],
      required: [true, 'Period type is required'],
      default: 'quarterly'
    },
    periodQuarter: {
      type: String,
      enum: ['Q1', 'Q2', 'Q3', 'Q4', 'None'],
      default: 'None'
    },
    periodYear: {
      type: Number,
      required: [true, 'Period year is required'],
      min: [2000, 'Year must be valid'],
      max: [2100, 'Year must be valid']
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required']
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required']
    },
    selfReviewDeadline: {
      type: Date,
      required: [true, 'Self review deadline is required']
    },
    managerReviewDeadline: {
      type: Date,
      required: [true, 'Manager review deadline is required']
    },
    status: {
      type: String,
      enum: ['Draft', 'Active', 'Closed'],
      default: 'Active'
    },
    totalReviewsCount: {
      type: Number,
      default: 0
    },
    completedReviewsCount: {
      type: Number,
      default: 0
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
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
ReviewCycleSchema.index({ title: 1, periodYear: 1, isDeleted: 1 });
ReviewCycleSchema.index({ status: 1 });
ReviewCycleSchema.index({ periodYear: 1, periodQuarter: 1 });

const ReviewCycle = mongoose.models.ReviewCycle || mongoose.model('ReviewCycle', ReviewCycleSchema);
export default ReviewCycle;


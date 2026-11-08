/**
 * @file interview.model.js
 * @description Mongoose Schema for Candidate Interviews & Scorecards (Module M15 / Row 15.8).
 * 
 * SPECIFICATION:
 * - Module: M15 Recruitment & AI Screening (BUILD-GUIDE Section 24 · Row 15.8)
 * - Compound Indexes: { candidateId: 1, scheduledDate: 1 }, { status: 1, scheduledDate: 1 }
 */

import mongoose from 'mongoose';

const scorecardSchema = new mongoose.Schema(
  {
    interviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true
    },
    technicalRating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    communicationRating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    culturalRating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    recommendation: {
      type: String,
      enum: ['Strong_Hire', 'Hire', 'Hold', 'No_Hire'],
      required: true
    },
    notes: {
      type: String,
      trim: true,
      default: ''
    },
    submittedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: true }
);

const interviewSchema = new mongoose.Schema(
  {
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Candidate',
      required: true,
      index: true
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
      index: true
    },
    roundNumber: {
      type: Number,
      required: true,
      default: 1
    },
    roundType: {
      type: String,
      enum: ['Screening', 'Technical', 'Cultural', 'Executive', 'HR'],
      default: 'Technical'
    },
    interviewers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
      }
    ],
    scheduledDate: {
      type: Date,
      required: true
    },
    durationMinutes: {
      type: Number,
      default: 45,
      min: 15
    },
    meetingLink: {
      type: String,
      trim: true,
      default: ''
    },
    status: {
      type: String,
      enum: ['Scheduled', 'Completed', 'Cancelled', 'Rescheduled'],
      default: 'Scheduled',
      index: true
    },
    scorecards: {
      type: [scorecardSchema],
      default: []
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

interviewSchema.index({ candidateId: 1, scheduledDate: 1 });
interviewSchema.index({ status: 1, scheduledDate: 1 });

export const Interview = mongoose.model('Interview', interviewSchema);
export default Interview;


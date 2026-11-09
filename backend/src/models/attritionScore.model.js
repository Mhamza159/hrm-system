/**
 * @file attritionScore.model.js
 * @description Mongoose Schema for Employee Attrition Risk Evaluation & Action Notes.
 * 
 * SPECIFICATION:
 * - Module: M17 Attrition Prediction (BUILD-GUIDE Section 26 · Rows 17.1, 17.2, 17.4)
 * - Layer: Persistence (MongoDB Collection: `attritionscores`)
 * - Identity Isolation: Unique constraint on `employeeId` guarantees one evaluated risk profile per employee.
 */

import mongoose from 'mongoose';

const retentionNoteSchema = new mongoose.Schema(
  {
    note: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    },
    actionTaken: {
      type: String,
      required: true,
      enum: [
        'Compensation Review',
        'One-on-One Wellness Check',
        'Career Pathing / Promotion',
        'Workload Rebalancing',
        'Performance Counseling',
        'Other'
      ],
      default: 'One-on-One Wellness Check'
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    authorName: {
      type: String,
      required: true,
      trim: true
    },
    followUpDate: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

const attritionScoreSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      unique: true,
      index: true
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
      index: true
    },
    riskScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      index: true
    },
    riskLevel: {
      type: String,
      required: true,
      enum: ['Low', 'Medium', 'High'],
      index: true
    },
    breakdown: {
      attendance: { type: Number, default: 0 },
      salaryStagnation: { type: Number, default: 0 },
      appraisal: { type: Number, default: 0 },
      tenure: { type: Number, default: 0 },
      engagement: { type: Number, default: 0 }
    },
    topFactors: [
      {
        type: String,
        trim: true
      }
    ],
    calculatedAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    notes: [retentionNoteSchema]
  },
  {
    timestamps: true
  }
);

// Compound and query optimization indexes
attritionScoreSchema.index({ departmentId: 1, riskLevel: 1 });
attritionScoreSchema.index({ riskScore: -1 });
attritionScoreSchema.index({ calculatedAt: -1 });

export const AttritionScore = mongoose.model('AttritionScore', attritionScoreSchema);


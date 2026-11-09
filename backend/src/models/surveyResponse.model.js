/**
 * @file surveyResponse.model.js
 * @description Mongoose Schema for Pulse Survey Responses with cryptographic anonymity (BUILD-GUIDE Rows 20.4 & 20.5).
 */

import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema(
  {
    questionId: {
      type: String,
      required: true
    },
    answerValue: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    }
  },
  { _id: false }
);

const surveyResponseSchema = new mongoose.Schema(
  {
    surveyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Survey',
      required: [true, 'Survey reference is required'],
      index: true
    },
    // For anonymous surveys, userHash = sha256(userId + surveyId + salt)
    // Ensures exactly 1 response per user without revealing voter identity
    userHash: {
      type: String,
      required: [true, 'User hash is required']
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null // Preserved only if survey.isAnonymous is false
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null // Preserved for aggregate departmental breakdown
    },
    answers: [answerSchema]
  },
  {
    timestamps: true
  }
);

// Compound unique index guarantees single response per employee per survey
surveyResponseSchema.index({ surveyId: 1, userHash: 1 }, { unique: true });
surveyResponseSchema.index({ surveyId: 1, departmentId: 1 });

const SurveyResponse = mongoose.model('SurveyResponse', surveyResponseSchema);

export default SurveyResponse;


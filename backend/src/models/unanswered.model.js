/**
 * @file unanswered.model.js
 * @description Mongoose schema for escalated unanswered employee queries in M16 HR Chatbot.
 * 
 * SPECIFICATION:
 * - Module: M16 HR Chatbot (BUILD-GUIDE Section 25 · Row 16.6)
 */

import mongoose from 'mongoose';

const unansweredQuestionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      index: true
    },
    question: {
      type: String,
      required: true,
      trim: true,
      maxlength: [1000, 'Question cannot exceed 1000 characters']
    },
    userLanguage: {
      type: String,
      enum: ['en', 'ur-roman'],
      default: 'en'
    },
    status: {
      type: String,
      enum: ['Pending', 'Answered', 'Dismissed'],
      default: 'Pending',
      index: true
    },
    answeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    answer: {
      type: String,
      trim: true,
      default: ''
    },
    answeredAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

unansweredQuestionSchema.index({ status: 1, createdAt: -1 });

export const UnansweredQuestion = mongoose.models.UnansweredQuestion || mongoose.model('UnansweredQuestion', unansweredQuestionSchema);


/**
 * @file survey.model.js
 * @description Mongoose Schema for Company Pulse Surveys and Polls (BUILD-GUIDE Row 20.4).
 */

import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true
    },
    questionText: {
      type: String,
      required: [true, 'Question text is required'],
      trim: true,
      minlength: [3, 'Question text must be at least 3 characters'],
      maxlength: [300, 'Question text cannot exceed 300 characters']
    },
    questionType: {
      type: String,
      enum: {
        values: ['rating_5', 'text', 'multiple_choice'],
        message: '{VALUE} is not a valid question type'
      },
      default: 'rating_5'
    },
    options: [
      {
        type: String,
        trim: true
      }
    ],
    required: {
      type: Boolean,
      default: true
    }
  },
  { _id: false }
);

const surveySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Survey title is required'],
      trim: true,
      minlength: [3, 'Survey title must be at least 3 characters'],
      maxlength: [150, 'Survey title cannot exceed 150 characters']
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    type: {
      type: String,
      enum: {
        values: ['pulse', 'poll', 'quarterly', 'culture'],
        message: '{VALUE} is not a valid survey type'
      },
      default: 'pulse'
    },
    isAnonymous: {
      type: Boolean,
      default: true
    },
    questions: {
      type: [questionSchema],
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length >= 1;
        },
        message: 'A survey must have at least one question'
      }
    },
    targetAudience: {
      type: String,
      enum: {
        values: ['company', 'department'],
        message: '{VALUE} is not a valid target audience'
      },
      default: 'company'
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null
    },
    status: {
      type: String,
      enum: {
        values: ['draft', 'active', 'closed'],
        message: '{VALUE} is not a valid survey status'
      },
      default: 'active'
    },
    expiresAt: {
      type: Date,
      required: [true, 'Survey expiration date is required']
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
    timestamps: true
  }
);

surveySchema.index({ status: 1, expiresAt: 1, isDeleted: 1 });
surveySchema.index({ targetAudience: 1, departmentId: 1, isDeleted: 1 });

const Survey = mongoose.model('Survey', surveySchema);

export default Survey;


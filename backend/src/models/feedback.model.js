/**
 * @file feedback.model.js
 * @description Mongoose Schema for Anonymous Feedback & Grievance cases (BUILD-GUIDE Section 28, Rows 21.1 to 21.6).
 */

import mongoose from 'mongoose';

const caseNoteSchema = new mongoose.Schema(
  {
    note: {
      type: String,
      required: [true, 'Note text is required'],
      trim: true,
      maxlength: [2000, 'Note cannot exceed 2000 characters']
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author ID is required']
    },
    authorRole: {
      type: String,
      trim: true
    },
    isPublicToComplainant: {
      type: Boolean,
      default: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: true }
);

const feedbackSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [150, 'Title cannot exceed 150 characters']
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [3000, 'Description cannot exceed 3000 characters']
    },
    category: {
      type: String,
      enum: ['Suggestion', 'Grievance', 'Workplace Issue', 'Harassment', 'Safety', 'Other'],
      default: 'Suggestion',
      required: true
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium'
    },
    status: {
      type: String,
      enum: ['Submitted', 'Under Review', 'In Investigation', 'Resolved', 'Dismissed', 'Escalated'],
      default: 'Submitted'
    },
    isAnonymous: {
      type: Boolean,
      default: false
    },
    trackingCode: {
      type: String,
      required: [true, 'Tracking code is required'],
      unique: true,
      uppercase: true,
      trim: true
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null
    },
    attachments: {
      type: [String],
      default: []
    },
    caseNotes: {
      type: [caseNoteSchema],
      default: []
    },
    resolutionNote: {
      type: String,
      trim: true,
      maxlength: [2000, 'Resolution note cannot exceed 2000 characters'],
      default: ''
    },
    resolvedAt: {
      type: Date,
      default: null
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    isEscalated: {
      type: Boolean,
      default: false
    },
    escalationDetails: {
      escalatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
      },
      escalatedAt: {
        type: Date,
        default: null
      },
      reason: {
        type: String,
        trim: true,
        maxlength: [1000, 'Escalation reason cannot exceed 1000 characters'],
        default: ''
      }
    }
  },
  {
    timestamps: true
  }
);

// Indexes for performance and lookup
feedbackSchema.index({ category: 1, status: 1 });
feedbackSchema.index({ submittedBy: 1 });
feedbackSchema.index({ createdAt: -1 });

// Ensure submittedBy is strictly null if isAnonymous is true
feedbackSchema.pre('save', function (next) {
  if (this.isAnonymous) {
    this.submittedBy = null;
  }
  next();
});

export const Feedback = mongoose.models.Feedback || mongoose.model('Feedback', feedbackSchema);
export default Feedback;


/**
 * @file policy.model.js
 * @description Mongoose Schema for Company Policies & Corporate Standard Operating Procedures.
 * 
 * SPECIFICATION:
 * - Module: Company Policies (Phase 21)
 * - Full lifecycle: Draft -> Pending Approval -> Approved -> Published -> Archived
 * - Scoping: Department-specific, role-specific, or enterprise-wide
 * - Acknowledgement: Mandatory employee compliance tracking
 */

import mongoose from 'mongoose';

const policySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Policy title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
      index: true
    },
    policyCode: {
      type: String,
      required: [true, 'Policy code is required'],
      trim: true,
      uppercase: true,
      maxlength: [50, 'Policy code cannot exceed 50 characters']
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PolicyCategory',
      required: [true, 'Policy category is required'],
      index: true
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    content: {
      type: String,
      required: [true, 'Policy content/clauses are required']
    },
    fileUrl: {
      type: String,
      default: null
    },
    fileType: {
      type: String,
      enum: ['pdf', 'docx', 'doc', 'txt', null],
      default: null
    },
    fileSize: {
      type: Number,
      default: 0
    },
    version: {
      type: String,
      default: '1.0',
      trim: true
    },
    status: {
      type: String,
      enum: ['Draft', 'Pending Approval', 'Approved', 'Published', 'Rejected', 'Archived', 'Expired'],
      default: 'Draft',
      index: true
    },
    effectiveDate: {
      type: Date,
      default: null
    },
    reviewDate: {
      type: Date,
      default: null
    },
    expiryDate: {
      type: Date,
      default: null
    },
    ownerDepartmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    scope: {
      type: String,
      enum: ['All Employees', 'Department Specific', 'Role Specific', 'Management Only'],
      default: 'All Employees',
      index: true
    },
    applicableDepartmentIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department'
      }
    ],
    applicableRoleNames: [
      {
        type: String,
        trim: true
      }
    ],
    requiresAcknowledgement: {
      type: Boolean,
      default: false,
      index: true
    },
    acknowledgementGracePeriodDays: {
      type: Number,
      default: 7,
      min: [1, 'Grace period must be at least 1 day']
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    approvedAt: {
      type: Date,
      default: null
    },
    publishedAt: {
      type: Date,
      default: null
    },
    rejectionReason: {
      type: String,
      default: null,
      trim: true
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

// Unique code index scoped to non-deleted policies (permits reuse of archived codes)
policySchema.index(
  { policyCode: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false }, name: 'PolicyCodeUniqueActive' }
);

// Compound text index for search queries
policySchema.index(
  { title: 'text', description: 'text', content: 'text', policyCode: 'text' },
  { weights: { policyCode: 10, title: 5, description: 2, content: 1 }, name: 'PolicyTextIndex' }
);

export const Policy = mongoose.models.Policy || mongoose.model('Policy', policySchema);

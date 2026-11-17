/**
 * @file policyVersion.model.js
 * @description Mongoose Schema for Immutable Company Policy Version History.
 * 
 * SPECIFICATION:
 * - Module: Company Policies (Phase 21)
 * - Historical Snapshot preservation ensuring past versions are never silently overwritten.
 */

import mongoose from 'mongoose';

const policyVersionSchema = new mongoose.Schema(
  {
    policyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Policy',
      required: [true, 'Policy ID reference is required'],
      index: true
    },
    version: {
      type: String,
      required: [true, 'Version string is required'],
      trim: true
    },
    title: {
      type: String,
      required: [true, 'Policy title snapshot is required'],
      trim: true
    },
    content: {
      type: String,
      required: [true, 'Policy content snapshot is required']
    },
    fileUrl: {
      type: String,
      default: null
    },
    fileType: {
      type: String,
      default: null
    },
    fileSize: {
      type: Number,
      default: 0
    },
    changeSummary: {
      type: String,
      required: [true, 'Change summary describing amendments is required'],
      trim: true
    },
    effectiveDate: {
      type: Date,
      default: null
    },
    publishedAt: {
      type: Date,
      default: Date.now
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  {
    timestamps: true
  }
);

policyVersionSchema.index({ policyId: 1, version: 1 }, { unique: true });

export const PolicyVersion =
  mongoose.models.PolicyVersion || mongoose.model('PolicyVersion', policyVersionSchema);

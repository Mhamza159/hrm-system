/**
 * @file policyAcknowledgement.model.js
 * @description Mongoose Schema for Employee Policy Acknowledgement & Legal Compliance Receipts.
 * 
 * SPECIFICATION:
 * - Module: Company Policies (Phase 21)
 * - Records digital signature, client timestamp, IP address, user-agent, and version binding.
 */

import mongoose from 'mongoose';

const policyAcknowledgementSchema = new mongoose.Schema(
  {
    policyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Policy',
      required: [true, 'Policy reference is required'],
      index: true
    },
    policyVersion: {
      type: String,
      required: [true, 'Policy version reference is required'],
      trim: true,
      index: true
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee reference is required'],
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User account reference is required'],
      index: true
    },
    signatureText: {
      type: String,
      required: [true, 'Digital signature confirmation is required'],
      trim: true
    },
    acknowledgedAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    ipAddress: {
      type: String,
      default: null
    },
    userAgent: {
      type: String,
      default: null
    },
    isLatestVersion: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Prevent duplicate acknowledgements by the same employee for the exact same policy version
policyAcknowledgementSchema.index(
  { policyId: 1, policyVersion: 1, employeeId: 1 },
  { unique: true }
);

export const PolicyAcknowledgement =
  mongoose.models.PolicyAcknowledgement ||
  mongoose.model('PolicyAcknowledgement', policyAcknowledgementSchema);

/**
 * @file delegation.model.js
 * @description Mongoose Schema for Approvals Delegation System.
 * 
 * SPECIFICATION:
 * - Module: M26 Roles & Permissions (BUILD-GUIDE Section 5 · Row 26.14)
 * - Layer: Model (Database persistence)
 */

import mongoose from 'mongoose';

const delegationSchema = new mongoose.Schema(
  {
    // Originating manager delegating approval authority
    fromUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },

    // Peer delegate receiving temporary approval authority
    toUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },

    // List of permissions delegated (e.g. ['leave.approve', 'expense.approve'])
    permissions: [
      {
        action: { type: String, required: true },
        subject: { type: String, default: 'all' },
        scope: { type: String, enum: ['own', 'team', 'department', 'all'], default: 'department' },
        limit: { type: Number }
      }
    ],

    // Delegation time window
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },

    // Status: active, cancelled, expired
    status: {
      type: String,
      enum: ['active', 'cancelled', 'expired'],
      default: 'active'
    },

    // Business reason (e.g. "Annual leave delegation for Q3")
    reason: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

delegationSchema.index({ toUserId: 1, status: 1, startDate: 1, endDate: 1 });
delegationSchema.index({ fromUserId: 1, status: 1 });

export const Delegation =
  mongoose.models.Delegation || mongoose.model('Delegation', delegationSchema);

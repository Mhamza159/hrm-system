/**
 * @file loginHistory.model.js
 * @description Mongoose Schema for Login History and Authentication Audit Trail.
 * 
 * SPECIFICATION (BUILD-GUIDE Section 4 · Slice 1.12):
 * - Fields: userId, email, ipAddress, userAgent, deviceType, status, failureReason.
 * - Allowed Statuses: SUCCESS, FAILED, LOCKED, 2FA_PENDING.
 * - TTL Index: 90-day automatic expiration (expireAfterSeconds: 7,776,000).
 */

import mongoose from 'mongoose';

const loginHistorySchema = new mongoose.Schema(
  {
    // Associated User record (nullable if attempt was made with an unregistered email)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },

    // Email address used in authentication attempt
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true
    },

    // Client IP address
    ipAddress: {
      type: String,
      default: '127.0.0.1'
    },

    // User Agent string
    userAgent: {
      type: String,
      default: 'unknown'
    },

    // Inferred device category (DESKTOP, MOBILE, TABLET, UNKNOWN)
    deviceType: {
      type: String,
      enum: ['DESKTOP', 'MOBILE', 'TABLET', 'UNKNOWN'],
      default: 'DESKTOP'
    },

    // Authentication outcome status
    status: {
      type: String,
      enum: ['SUCCESS', 'FAILED', 'LOCKED', '2FA_PENDING'],
      required: true,
      index: true
    },

    // Descriptive reason if attempt did not succeed
    failureReason: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// 90-day automatic TTL eviction index
loginHistorySchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 90 * 24 * 60 * 60 }
);

export const LoginHistory = mongoose.model('LoginHistory', loginHistorySchema);

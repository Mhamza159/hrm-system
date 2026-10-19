/**
 * @file user.model.js
 * @description Mongoose User Schema for HRM System.
 * 
 * ARCHITECTURE & SECURITY SPECIFICATION:
 * - Module: M1 Authentication & Access Control (BUILD-GUIDE Section 4 / Slice 1.1)
 * - Layer: Model (Database persistence layer)
 * - Security Rules:
 *   1. Email is strictly unique, lowercase, and trimmed.
 *   2. Passwords are never stored in plaintext; hashed via bcrypt with 12 salt rounds.
 *   3. Refresh tokens are hashed with bcrypt before storing in `refreshTokenHash` to prevent token replay/theft attacks.
 *   4. Account lockout triggers when `failedAttempts >= 5`, locking the account for 15 minutes (`lockUntil`).
 *   5. First login requires password change if `mustChangePassword === true`.
 *   6. Soft deletion supported via `isDeleted`.
 */

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema(
  {
    // Unique user email for authentication and official notifications
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },

    // Bcrypt salted hash (12 rounds) of user password
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required']
    },

    // Assigned roles referencing Role collection (M26: Super Admin, HR Manager, Dept Manager, Employee)
    roles: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Role'
      }
    ],

    // Link to Employee master record (null for standalone administrative accounts)
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null
    },

    // Profile photo / avatar CDN URL
    avatar: {
      type: String,
      default: ''
    },

    // Account status: if false, user is blocked from logging in or refreshing tokens
    isActive: {
      type: Boolean,
      default: true
    },

    // Count of consecutive failed login attempts (resets to 0 on success)
    failedAttempts: {
      type: Number,
      default: 0
    },

    // Lockout timestamp: login blocked if current time is earlier than lockUntil
    lockUntil: {
      type: Date,
      default: null
    },

    // Flag indicating whether 2FA verification is mandatory for this account
    twoFactorEnabled: {
      type: Boolean,
      default: false
    },

    // Encrypted secret key or temp token for Two-Factor Authentication
    twoFactorSecret: {
      type: String,
      default: null
    },

    // Salted bcrypt hash of 6-digit OTP for 2FA login/enrollment verification (Slice 1.10)
    twoFactorOtpHash: {
      type: String,
      default: null
    },

    // Expiry timestamp for 2FA OTP (10 minutes lifetime)
    twoFactorOtpExpires: {
      type: Date,
      default: null
    },

    // Bcrypt hash of the currently active rotating refresh token
    refreshTokenHash: {
      type: String,
      default: null
    },

    // Mandate forcing newly onboarded users or HR-reset users to change password on first login
    mustChangePassword: {
      type: Boolean,
      default: false
    },

    // Hashed 6-digit OTP for password recovery
    resetOtpHash: {
      type: String,
      default: null
    },

    // Expiry timestamp for password recovery OTP (10 minutes lifetime)
    resetOtpExpires: {
      type: Date,
      default: null
    },

    // Audit timestamp of the most recent successful authentication
    lastLoginAt: {
      type: Date,
      default: null
    },

    // Soft delete indicator
    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// ==========================================
// Performance & Security Indexes
// ==========================================

// Enforce email uniqueness at database level
userSchema.index({ email: 1 }, { unique: true });

// Optimize active employee queries
userSchema.index({ isActive: 1, isDeleted: 1 });

// Optimize lockout checks
userSchema.index({ lockUntil: 1 });

// Optimize lookups by employee record
userSchema.index({ employeeId: 1 });

// ==========================================
// Instance & Static Helper Methods
// ==========================================

/**
 * Compare candidate plain password with stored bcrypt hash
 * @param {string} candidatePassword - Plaintext password entered by user
 * @returns {Promise<boolean>} True if password matches, false otherwise
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

/**
 * Hash a plain password using bcrypt with standard 12 salt rounds
 * @param {string} plainPassword - Plaintext password to hash
 * @returns {Promise<string>} Salted bcrypt hash
 */
userSchema.statics.hashPassword = async function (plainPassword) {
  return bcrypt.hash(plainPassword, 12);
};

export const User = mongoose.model('User', userSchema);

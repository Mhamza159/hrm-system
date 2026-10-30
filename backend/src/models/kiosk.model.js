/**
 * @file kiosk.model.js
 * @description Mongoose schema for office attendance kiosk hardware devices.
 *
 * SPECIFICATION:
 * - Module: M13 QR Code Attendance (BUILD-GUIDE Section 18 · Row 13.1)
 * - Anti-tamper: secretKey is generated cryptographically (32 chars) and unselected by default.
 */

import mongoose from 'mongoose';

const kioskSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Kiosk name is required'],
      trim: true,
      maxlength: [100, 'Kiosk name cannot exceed 100 characters']
    },
    code: {
      type: String,
      required: [true, 'Kiosk code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: [50, 'Kiosk code cannot exceed 50 characters']
    },
    type: {
      type: String,
      enum: {
        values: ['entry', 'exit', 'both'],
        message: 'Kiosk type must be entry, exit, or both'
      },
      default: 'both'
    },
    locationDescription: {
      type: String,
      trim: true,
      maxlength: [200, 'Location description cannot exceed 200 characters'],
      default: ''
    },
    secretKey: {
      type: String,
      required: [true, 'Kiosk secret key is required'],
      select: false // Never returned in public/default queries
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true
    },
    lastHeartbeatAt: {
      type: Date,
      default: null
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  {
    timestamps: true
  }
);

kioskSchema.index({ code: 1, isDeleted: 1 });
kioskSchema.index({ isActive: 1, isDeleted: 1 });

export const Kiosk = mongoose.models.Kiosk || mongoose.model('Kiosk', kioskSchema);


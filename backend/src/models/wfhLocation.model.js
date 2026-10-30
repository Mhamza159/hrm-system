/**
 * @file wfhLocation.model.js
 * @description Mongoose Schema for Approved Remote / Work From Home (WFH) Geographical Locations (Slice 14.4).
 * 
 * SPECIFICATION & INTEGRITY:
 * - Module: M14 GPS / Geo-fencing (BUILD-GUIDE Section 17 · Row 14.4)
 * - Layer: Model (Database persistence layer)
 * - Compound Indexes: { employeeId: 1, status: 1 }, { isActive: 1 }
 * - Radius Limit: Max 150 meters for residential/co-working boundaries.
 */

import mongoose from 'mongoose';

const wfhLocationSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee reference is required'],
      index: true
    },
    name: {
      type: String,
      required: [true, 'Location name is required (e.g. Primary Residence, Co-working space)'],
      trim: true,
      maxlength: [100, 'Location name cannot exceed 100 characters']
    },
    address: {
      type: String,
      required: [true, 'Physical street address is required'],
      trim: true,
      maxlength: [250, 'Address cannot exceed 250 characters']
    },
    latitude: {
      type: Number,
      required: [true, 'Latitude is required'],
      min: [-90, 'Latitude must be between -90 and 90'],
      max: [90, 'Latitude must be between -90 and 90']
    },
    longitude: {
      type: Number,
      required: [true, 'Longitude is required'],
      min: [-180, 'Longitude must be between -180 and 180'],
      max: [180, 'Longitude must be between -180 and 180']
    },
    radiusMeters: {
      type: Number,
      default: 100,
      min: [10, 'Radius must be at least 10 meters'],
      max: [150, 'WFH radius cannot exceed 150 meters for security compliance']
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true
    },
    decisionBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    decisionAt: {
      type: Date,
      default: null
    },
    decisionRemarks: {
      type: String,
      default: '',
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true
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

wfhLocationSchema.index({ employeeId: 1, status: 1 });
wfhLocationSchema.index({ employeeId: 1, isDeleted: 1 });

export const WfhLocation = mongoose.model('WfhLocation', wfhLocationSchema);

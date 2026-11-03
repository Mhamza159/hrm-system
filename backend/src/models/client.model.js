/**
 * @file client.model.js
 * @description Mongoose model for corporate clients sponsoring software and business projects.
 * 
 * SPECIFICATION:
 * - Module: M22 Projects & Timesheets (BUILD-GUIDE Section 23 · Row 22.1)
 * - Layer: Data Access Layer (Mongoose Model)
 */

import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Client primary contact name is required'],
      trim: true,
      maxlength: [100, 'Client contact name cannot exceed 100 characters']
    },
    companyName: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      maxlength: [150, 'Company name cannot exceed 150 characters']
    },
    email: {
      type: String,
      required: [true, 'Client email is required'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid client email address']
    },
    phone: {
      type: String,
      trim: true,
      default: ''
    },
    address: {
      type: String,
      trim: true,
      default: ''
    },
    currency: {
      type: String,
      enum: ['PKR', 'USD', 'EUR', 'GBP', 'AED'],
      default: 'PKR'
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

clientSchema.index({ companyName: 1, isDeleted: 1 });

export const Client = mongoose.model('Client', clientSchema);


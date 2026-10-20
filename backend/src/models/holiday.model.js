/**
 * @file holiday.model.js
 * @description Mongoose Schema for Company Public & Pakistan Gazetted Holidays.
 * 
 * SPECIFICATION & INTEGRITY:
 * - Module: M6 Leave & Holidays (BUILD-GUIDE Section 11 · Row 6.11)
 * - Layer: Model (Database persistence layer)
 * - Dates: Normalized to UTC start-of-day (00:00:00.000Z)
 * - Uniqueness: Compound unique index on `{ date: 1, name: 1 }`
 */

import mongoose from 'mongoose';

const holidaySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Holiday name is required'],
      trim: true,
      maxlength: [120, 'Holiday name cannot exceed 120 characters']
    },
    date: {
      type: Date,
      required: [true, 'Holiday date is required']
    },
    year: {
      type: Number,
      required: [true, 'Year is required']
    },
    type: {
      type: String,
      enum: {
        values: ['gazetted', 'optional', 'restricted'],
        message: 'Holiday type must be gazetted, optional, or restricted'
      },
      default: 'gazetted'
    },
    isLunar: {
      type: Boolean,
      default: false
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: ''
    },
    isActive: {
      type: Boolean,
      default: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

// Indexes
holidaySchema.index({ date: 1, name: 1 }, { unique: true });
holidaySchema.index({ year: 1, isActive: 1 });

export const Holiday = mongoose.model('Holiday', holidaySchema);

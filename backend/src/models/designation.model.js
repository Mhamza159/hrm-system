/**
 * @file designation.model.js
 * @description Mongoose Designation Schema for Corporate Job Titles & Grade Tiers.
 * 
 * SPECIFICATION & INTEGRITY:
 * - Module: M4 Departments, Designations, Shifts & Org Chart (BUILD-GUIDE Section 7 · Row 4.3)
 * - Layer: Model (Database persistence layer)
 * - Grade Tiers: 'Junior', 'Mid', 'Senior', 'Lead', 'Executive'
 * - Invariant: Active employee deletion guard enforced at service layer
 */

import mongoose from 'mongoose';

const designationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Designation title is required'],
      trim: true,
      maxlength: [100, 'Designation title cannot exceed 100 characters']
    },
    code: {
      type: String,
      required: [true, 'Designation code is required'],
      uppercase: true,
      trim: true,
      maxlength: [20, 'Designation code cannot exceed 20 characters']
    },
    grade: {
      type: String,
      required: [true, 'Grade tier is required'],
      enum: {
        values: ['Junior', 'Mid', 'Senior', 'Lead', 'Executive'],
        message: 'Grade must be Junior, Mid, Senior, Lead, or Executive'
      }
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department is required']
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    isActive: {
      type: Boolean,
      default: true
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes
designationSchema.index({ code: 1, departmentId: 1, isDeleted: 1 });
designationSchema.index({ departmentId: 1, isDeleted: 1 });
designationSchema.index({ grade: 1, isDeleted: 1 });
designationSchema.index({ isActive: 1, isDeleted: 1 });

export const Designation = mongoose.model('Designation', designationSchema);

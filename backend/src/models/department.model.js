/**
 * @file department.model.js
 * @description Mongoose Department Schema for Organizational Hierarchy & Org Chart.
 * 
 * SPECIFICATION & INTEGRITY:
 * - Module: M4 Departments, Designations, Shifts & Org Chart (BUILD-GUIDE Section 7 · Row 4.1)
 * - Layer: Model (Database persistence layer)
 * - Hierarchy: Tree structure via parentId (Self-referencing DAG)
 * - Invariant: Active employee deletion guard enforced at service layer
 */

import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Department name is required'],
      trim: true,
      maxlength: [100, 'Department name cannot exceed 100 characters']
    },
    code: {
      type: String,
      required: [true, 'Department code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: [20, 'Department code cannot exceed 20 characters']
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null
    },
    headId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
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
departmentSchema.index({ parentId: 1, isDeleted: 1 });
departmentSchema.index({ headId: 1 });
departmentSchema.index({ isActive: 1, isDeleted: 1 });

export const Department = mongoose.model('Department', departmentSchema);

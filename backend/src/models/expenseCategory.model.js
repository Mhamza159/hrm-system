/**
 * @file expenseCategory.model.js
 * @description Mongoose Schema for Expense Categories, Policy Limits & Receipt Mandates.
 * 
 * SPECIFICATION:
 * - Module: M11 Expense Claims (BUILD-GUIDE Section 16 · Row 11.1)
 * - Financial Invariant: All limits stored in integer paisa (1 PKR = 100 paisa).
 */

import mongoose from 'mongoose';

const expenseCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      maxlength: [100, 'Category name cannot exceed 100 characters']
    },
    code: {
      type: String,
      required: [true, 'Category code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: [30, 'Category code cannot exceed 30 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: ''
    },
    maxLimitPaisa: {
      type: Number,
      required: [true, 'Maximum limit is required'],
      min: [0, 'Maximum limit cannot be negative'],
      validate: {
        validator: Number.isInteger,
        message: 'Maximum limit must be an integer paisa amount'
      },
      default: 0 // 0 indicates uncapped
    },
    requiresReceipt: {
      type: Boolean,
      default: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    // Archive flag: a "deleted" category is archived (hidden from claim forms, disabled) and can be
    // restored or permanently deleted from the Archive tab. Kept as isDeleted so earlier deletions
    // surface in the archive without a migration.
    isDeleted: {
      type: Boolean,
      default: false
    },
    archivedAt: {
      type: Date,
      default: null
    },
    archivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  {
    timestamps: true
  }
);

expenseCategorySchema.index({ isActive: 1, isDeleted: 1 });

export const ExpenseCategory = mongoose.model('ExpenseCategory', expenseCategorySchema);

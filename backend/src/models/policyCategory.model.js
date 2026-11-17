/**
 * @file policyCategory.model.js
 * @description Mongoose Schema for Company Policy Categories & Classifications.
 * 
 * SPECIFICATION:
 * - Module: Company Policies (Phase 21)
 * - Design: Dynamic categorization with icons and display orders.
 */

import mongoose from 'mongoose';

const policyCategorySchema = new mongoose.Schema(
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
      trim: true,
      uppercase: true,
      maxlength: [50, 'Category code cannot exceed 50 characters']
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    icon: {
      type: String,
      default: 'FileText',
      trim: true
    },
    color: {
      type: String,
      default: '#00C471',
      trim: true
    },
    displayOrder: {
      type: Number,
      default: 0
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
    }
  },
  {
    timestamps: true
  }
);

policyCategorySchema.index({ name: 1, isDeleted: 1 });

export const PolicyCategory =
  mongoose.models.PolicyCategory || mongoose.model('PolicyCategory', policyCategorySchema);

/**
 * @file kpiTemplate.model.js
 * @description Mongoose Schema for Designation-Wise KPI Master Templates.
 * 
 * SPECIFICATION:
 * - Module: M19 Performance & Appraisal (BUILD-GUIDE Section 22 · Row 19.1)
 * - Scope: Reusable designation-specific key performance indicator templates.
 */

import mongoose from 'mongoose';

const KpiItemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'KPI title is required'],
      trim: true,
      minlength: [3, 'KPI title must be at least 3 characters'],
      maxlength: [150, 'KPI title cannot exceed 150 characters']
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    weightage: {
      type: Number,
      required: [true, 'Weightage is required'],
      min: [1, 'Weightage must be at least 1%'],
      max: [100, 'Weightage cannot exceed 100%']
    },
    targetCriteria: {
      type: String,
      required: [true, 'Target criteria is required'],
      trim: true,
      maxlength: [500, 'Target criteria cannot exceed 500 characters']
    }
  },
  { _id: true, timestamps: true }
);

const KpiTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Template name is required'],
      trim: true,
      minlength: [3, 'Name must be at least 3 characters'],
      maxlength: [120, 'Name cannot exceed 120 characters']
    },
    designationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Designation',
      required: [true, 'Designation is required']
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    kpis: {
      type: [KpiItemSchema],
      validate: {
        validator: function (v) {
          if (!v || v.length === 0) return false;
          const sum = v.reduce((acc, curr) => acc + (curr.weightage || 0), 0);
          return sum === 100;
        },
        message: 'Total KPI weightage must sum up to exactly 100%'
      }
    },
    isActive: {
      type: Boolean,
      default: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes
KpiTemplateSchema.index({ name: 1, designationId: 1, isDeleted: 1 });
KpiTemplateSchema.index({ designationId: 1, isDeleted: 1 });

const KpiTemplate = mongoose.models.KpiTemplate || mongoose.model('KpiTemplate', KpiTemplateSchema);
export default KpiTemplate;


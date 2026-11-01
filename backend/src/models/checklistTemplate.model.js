/**
 * @file checklistTemplate.model.js
 * @description Mongoose Schema for Onboarding and Offboarding Checklist Templates.
 * 
 * SPECIFICATION:
 * - Module: M18 Onboarding & Offboarding (BUILD-GUIDE Section 21 · Row 18.1)
 * - Scope: Reusable department-specific or company-wide lifecycle workflow blueprints.
 */

import mongoose from 'mongoose';

const ChecklistTemplateTaskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      minlength: [2, 'Title must be at least 2 characters'],
      maxlength: [150, 'Title cannot exceed 150 characters']
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    category: {
      type: String,
      enum: ['it', 'hr', 'department', 'finance', 'admin'],
      required: true,
      default: 'hr'
    },
    roleAssignee: {
      type: String,
      enum: ['employee', 'manager', 'hr', 'it_admin'],
      required: true,
      default: 'employee'
    },
    dueDaysOffset: {
      type: Number,
      default: 0,
      min: [-30, 'Offset cannot be less than -30 days'],
      max: [180, 'Offset cannot exceed 180 days']
    },
    isMandatory: {
      type: Boolean,
      default: true
    }
  },
  { _id: true, timestamps: true }
);

const ChecklistTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Template name is required'],
      trim: true,
      minlength: [3, 'Template name must be at least 3 characters'],
      maxlength: [100, 'Template name cannot exceed 100 characters']
    },
    type: {
      type: String,
      enum: ['onboarding', 'offboarding'],
      required: true,
      default: 'onboarding'
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null
    },
    tasks: {
      type: [ChecklistTemplateTaskSchema],
      default: [],
      validate: {
        validator: function (tasks) {
          return Array.isArray(tasks) && tasks.length <= 100;
        },
        message: 'A template cannot have more than 100 tasks'
      }
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
      required: [true, 'Creator user reference is required']
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// Indexes
ChecklistTemplateSchema.index(
  { name: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);
ChecklistTemplateSchema.index({ type: 1, departmentId: 1, isDeleted: 1 });

const ChecklistTemplate = mongoose.model('ChecklistTemplate', ChecklistTemplateSchema);

export default ChecklistTemplate;


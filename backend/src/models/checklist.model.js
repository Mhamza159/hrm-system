/**
 * @file checklist.model.js
 * @description Mongoose Schema for Employee Onboarding and Offboarding Checklist Workflows.
 * 
 * SPECIFICATION:
 * - Module: M18 Onboarding & Offboarding (BUILD-GUIDE Section 21 · Rows 18.2, 18.3, 18.7)
 * - Invariant: Tracks lifecycle execution, task assignments, role owners, and completion percentage.
 */

import mongoose from 'mongoose';

const ChecklistTaskItemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: 1000
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
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    dueDate: {
      type: Date,
      default: null
    },
    completed: {
      type: Boolean,
      default: false
    },
    completedAt: {
      type: Date,
      default: null
    },
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    notes: {
      type: String,
      trim: true,
      default: '',
      maxlength: 500
    }
  },
  { _id: true, timestamps: true }
);

const ChecklistSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Target employee reference is required']
    },
    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChecklistTemplate',
      default: null
    },
    type: {
      type: String,
      enum: ['onboarding', 'offboarding'],
      required: true,
      default: 'onboarding'
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'cancelled'],
      required: true,
      default: 'pending'
    },
    progressPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    completedDate: {
      type: Date,
      default: null
    },
    tasks: {
      type: [ChecklistTaskItemSchema],
      default: []
    },
    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// Indexes
ChecklistSchema.index({ employeeId: 1, type: 1, isDeleted: 1 });
ChecklistSchema.index({ status: 1 });
ChecklistSchema.index({ 'tasks.ownerId': 1, 'tasks.completed': 1 });
ChecklistSchema.index({ 'tasks.dueDate': 1 });

const Checklist = mongoose.model('Checklist', ChecklistSchema);

export default Checklist;


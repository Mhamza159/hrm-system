/**
 * @file project.model.js
 * @description Mongoose model for project charters, billing configuration, and member rosters.
 * 
 * SPECIFICATION:
 * - Module: M22 Projects & Timesheets (BUILD-GUIDE Section 23 · Rows 22.1, 22.2)
 * - Layer: Data Access Layer (Mongoose Model)
 * - Financial Invariants: Billing rates and budgets stored in integer minor units (paisa).
 */

import mongoose from 'mongoose';

const projectMemberSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee reference is required for project member']
    },
    projectRole: {
      type: String,
      enum: ['Developer', 'Lead', 'QA', 'Designer', 'DevOps', 'Consultant'],
      default: 'Developer'
    },
    customHourlyRatePaisa: {
      type: Number,
      min: [0, 'Custom hourly rate cannot be negative'],
      default: 0
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      maxlength: [150, 'Project name cannot exceed 150 characters']
    },
    code: {
      type: String,
      required: [true, 'Project code is required'],
      trim: true,
      uppercase: true,
      maxlength: [30, 'Project code cannot exceed 30 characters']
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: [true, 'Client reference is required']
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department reference is required']
    },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Project manager is required']
    },
    billingType: {
      type: String,
      enum: ['hourly', 'fixed', 'non_billable'],
      default: 'hourly'
    },
    hourlyBillingRatePaisa: {
      type: Number,
      min: [0, 'Hourly billing rate cannot be negative'],
      default: 0
    },
    budgetPaisa: {
      type: Number,
      min: [0, 'Budget cannot be negative'],
      default: 0
    },
    status: {
      type: String,
      enum: ['active', 'on_hold', 'completed', 'archived'],
      default: 'active',
      index: true
    },
    startDate: {
      type: Date,
      default: null
    },
    endDate: {
      type: Date,
      default: null
    },
    members: {
      type: [projectMemberSchema],
      default: []
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

// Compound unique index: code must be unique among active projects
projectSchema.index({ code: 1, isDeleted: 1 }, { unique: true });
projectSchema.index({ departmentId: 1, isDeleted: 1 });
projectSchema.index({ clientId: 1, isDeleted: 1 });
projectSchema.index({ managerId: 1, isDeleted: 1 });
projectSchema.index({ 'members.employeeId': 1 });

export const Project = mongoose.model('Project', projectSchema);


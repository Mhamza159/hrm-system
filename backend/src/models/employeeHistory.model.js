/**
 * @file employeeHistory.model.js
 * @description Mongoose Schema for Career Promotions, Transfers & Job History Timeline.
 * 
 * SPECIFICATION & AUDITING:
 * - Module: M3 Employee Management (BUILD-GUIDE Section 8 · Row 3.10)
 * - Layer: Model (Database persistence layer)
 */

import mongoose from 'mongoose';

const employeeHistorySchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee ID is required'],
      index: true
    },
    eventType: {
      type: String,
      required: [true, 'Event type is required'],
      trim: true
    },
    previousDepartmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null
    },
    newDepartmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null
    },
    previousDesignationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Designation',
      default: null
    },
    newDesignationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Designation',
      default: null
    },
    effectiveDate: {
      type: Date,
      default: Date.now
    },
    remarks: {
      type: String,
      trim: true
    },
    previousSalary: {
      type: Number,
      default: null
    },
    newSalary: {
      type: Number,
      default: null
    },
    incrementAmount: {
      type: Number,
      default: null
    },
    incrementPercentage: {
      type: Number,
      default: null
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  {
    timestamps: true
  }
);

employeeHistorySchema.index({ employeeId: 1, effectiveDate: -1 });

export const EmployeeHistory = mongoose.model('EmployeeHistory', employeeHistorySchema);

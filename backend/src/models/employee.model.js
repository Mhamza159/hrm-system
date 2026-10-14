/**
 * @file employee.model.js
 * @description Mongoose Employee Schema for Staff & Organizational Assignments.
 * 
 * SPECIFICATION & INTEGRITY:
 * - Module: M5 Employee Master & M4 Organization Integrations
 * - Layer: Model (Database persistence layer)
 */

import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema(
  {
    employeeCode: {
      type: String,
      required: [true, 'Employee code is required'],
      unique: true,
      trim: true,
      uppercase: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    name: {
      type: String,
      required: [true, 'Employee name is required'],
      trim: true
    },
    email: {
      type: String,
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null
    },
    designationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Designation',
      default: null
    },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null
    },
    shiftId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shift',
      default: null
    },
    employmentType: {
      type: String,
      enum: ['Permanent', 'Contract', 'Intern', 'Probation'],
      default: 'Permanent'
    },
    status: {
      type: String,
      enum: ['Active', 'Probation', 'Notice', 'Terminated', 'Suspended'],
      default: 'Active'
    },
    joiningDate: {
      type: Date,
      default: Date.now
    },
    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

employeeSchema.index({ departmentId: 1, isDeleted: 1 });
employeeSchema.index({ designationId: 1, isDeleted: 1 });
employeeSchema.index({ managerId: 1, isDeleted: 1 });
employeeSchema.index({ shiftId: 1, isDeleted: 1 });
employeeSchema.index({ status: 1, isDeleted: 1 });

export const Employee = mongoose.model('Employee', employeeSchema);

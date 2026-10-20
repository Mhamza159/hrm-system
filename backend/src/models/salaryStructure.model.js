/**
 * @file salaryStructure.model.js
 * @description Mongoose Schema for Employee Salary Structures & Component Breakdown.
 * 
 * SPECIFICATION & INTEGRITY:
 * - Module: M9 Payroll & Pakistan Statutory Compliance (BUILD-GUIDE Section 12 · Row 9.1)
 * - Layer: Model (Database persistence layer)
 * - Financial Invariant: All currency amounts stored as non-negative integers in minor units (paisa: PKR × 100).
 * - Compound Indexes: { employeeId: 1, effectiveFrom: -1 } for timeline and { employeeId: 1, status: 1 } for active lookup.
 */

import mongoose from 'mongoose';

const salaryStructureSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee reference is required'],
      index: true
    },
    effectiveFrom: {
      type: Date,
      required: [true, 'Effective date is required']
    },
    currency: {
      type: String,
      default: 'PKR',
      trim: true,
      uppercase: true
    },
    // Amounts in integer paisa (PKR × 100)
    basicSalary: {
      type: Number,
      required: [true, 'Basic salary is required'],
      min: [0, 'Basic salary cannot be negative']
    },
    houseRentAllowance: {
      type: Number,
      default: 0,
      min: [0, 'House rent allowance cannot be negative']
    },
    medicalAllowance: {
      type: Number,
      default: 0,
      min: [0, 'Medical allowance cannot be negative']
    },
    conveyanceAllowance: {
      type: Number,
      default: 0,
      min: [0, 'Conveyance allowance cannot be negative']
    },
    otherAllowances: {
      type: Number,
      default: 0,
      min: [0, 'Other allowances cannot be negative']
    },
    grossSalary: {
      type: Number,
      required: [true, 'Gross salary is required'],
      min: [0, 'Gross salary cannot be negative']
    },
    // Pakistan Statutory flags
    eobiEnabled: {
      type: Boolean,
      default: true
    },
    pessiEnabled: {
      type: Boolean,
      default: false
    },
    providentFundEnabled: {
      type: Boolean,
      default: false
    },
    providentFundRate: {
      type: Number,
      default: 0,
      min: [0, 'Provident fund rate cannot be negative'],
      max: [100, 'Provident fund rate cannot exceed 100%']
    },
    status: {
      type: String,
      enum: ['active', 'historical', 'superseded'],
      default: 'active',
      index: true
    },
    revisionReason: {
      type: String,
      trim: true,
      default: ''
    },
    revisedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
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

// Compound Indexes
salaryStructureSchema.index({ employeeId: 1, effectiveFrom: -1 });
salaryStructureSchema.index({ employeeId: 1, status: 1 });

// Ensure grossSalary matches the sum of components before validation
salaryStructureSchema.pre('validate', function (next) {
  this.grossSalary =
    Math.round(this.basicSalary || 0) +
    Math.round(this.houseRentAllowance || 0) +
    Math.round(this.medicalAllowance || 0) +
    Math.round(this.conveyanceAllowance || 0) +
    Math.round(this.otherAllowances || 0);
  next();
});

export const SalaryStructure =
  mongoose.models.SalaryStructure || mongoose.model('SalaryStructure', salaryStructureSchema);

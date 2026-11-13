/**
 * @file payrollRun.model.js
 * @description Mongoose schema for Monthly Payroll Runs with 4-Stage Release Lifecycle.
 * 
 * SPECIFICATION:
 * - Module: M9 Payroll (BUILD-GUIDE Section 12 · Rows 9.7 & 9.8)
 * - Layer: Data Model
 * - Lifecycle Stages: draft -> review -> approved -> paid
 */

import mongoose from 'mongoose';

const payrollRunSchema = new mongoose.Schema(
  {
    month: {
      type: Number,
      required: [true, 'Payroll month is required'],
      min: [1, 'Month must be between 1 and 12'],
      max: [12, 'Month must be between 1 and 12']
    },
    year: {
      type: Number,
      required: [true, 'Payroll year is required'],
      min: [2000, 'Year must be valid']
    },
    cycleStartDate: {
      type: Date,
      required: [true, 'Cycle start date is required']
    },
    cycleEndDate: {
      type: Date,
      required: [true, 'Cycle end date is required']
    },
    payDate: {
      type: Date,
      required: [true, 'Pay date is required']
    },
    status: {
      type: String,
      enum: ['draft', 'review', 'approved', 'paid'],
      default: 'draft'
    },
    isLocked: {
      type: Boolean,
      default: false
    },
    totalEmployees: {
      type: Number,
      default: 0
    },
    totalGrossPay: {
      type: Number,
      default: 0
    },
    totalDeductions: {
      type: Number,
      default: 0
    },
    totalNetPay: {
      type: Number,
      default: 0
    },
    totalTaxWithheld: {
      type: Number,
      default: 0
    },
    totalEobiEmployer: {
      type: Number,
      default: 0
    },
    totalEobiEmployee: {
      type: Number,
      default: 0
    },
    totalOvertimePay: {
      type: Number,
      default: 0
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: {
      type: Date
    },
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    paidAt: {
      type: Date
    },
    disbursementReference: {
      type: String,
      trim: true
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'bank_transfer', 'cheque'],
      default: 'cash'
    },
    bankSummary: [
      {
        bankName: String,
        employeeCount: Number,
        totalAmount: Number
      }
    ],
    notes: {
      type: String,
      trim: true
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    deletedAt: {
      type: Date,
      default: null
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Compound Unique Index: Exactly one active payroll run per month/year
payrollRunSchema.index(
  { month: 1, year: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);
payrollRunSchema.index({ isDeleted: 1, year: 1, month: 1 });

export const PayrollRun =
  mongoose.models.PayrollRun || mongoose.model('PayrollRun', payrollRunSchema);

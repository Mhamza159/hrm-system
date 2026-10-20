/**
 * @file payrollRun.model.js
 * @description Mongoose Schema for Monthly Payroll Batch Runs & 4-Stage Lifecycle Management.
 * 
 * SPECIFICATION & GOVERNANCE:
 * - Module: M9 Payroll (BUILD-GUIDE Section 12 · Rows 9.7 & 9.8)
 * - Layer: Model (Database persistence layer)
 * - 4-Stage Lifecycle: draft -> review -> approved -> paid (or cancelled)
 * - Financial Invariant: All financial aggregates strictly stored in integer paisa (PKR × 100).
 * - Compound Unique Index: { month: 1, year: 1 } prevents duplicate monthly runs.
 */

import mongoose from 'mongoose';

const payrollRunSchema = new mongoose.Schema(
  {
    month: {
      type: Number,
      required: [true, 'Payroll month is required (1-12)'],
      min: 1,
      max: 12
    },
    year: {
      type: Number,
      required: [true, 'Payroll year is required'],
      min: 2020,
      max: 2100
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
      required: [true, 'Disbursement target pay date is required']
    },
    status: {
      type: String,
      enum: ['draft', 'review', 'approved', 'paid', 'cancelled'],
      default: 'draft',
      index: true
    },
    totalEmployees: {
      type: Number,
      default: 0
    },
    // Financial aggregates stored in integer paisa (PKR × 100)
    totalGrossPay: {
      type: Number,
      default: 0,
      min: 0
    },
    totalDeductions: {
      type: Number,
      default: 0,
      min: 0
    },
    totalNetPay: {
      type: Number,
      default: 0,
      min: 0
    },
    totalTaxWithheld: {
      type: Number,
      default: 0,
      min: 0
    },
    totalEobiEmployer: {
      type: Number,
      default: 0,
      min: 0
    },
    totalEobiEmployee: {
      type: Number,
      default: 0,
      min: 0
    },
    totalOvertimePay: {
      type: Number,
      default: 0,
      min: 0
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    approvedAt: {
      type: Date,
      default: null
    },
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    paidAt: {
      type: Date,
      default: null
    },
    paymentMethod: {
      type: String,
      enum: ['bank_transfer', 'cash', 'cheque'],
      default: 'bank_transfer'
    },
    bankSummary: [
      {
        bankName: { type: String, default: 'Standard' },
        count: { type: Number, default: 0 },
        totalAmount: { type: Number, default: 0 }
      }
    ],
    isLocked: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Compound Unique Index: Exactly one payroll run per month/year
payrollRunSchema.index({ month: 1, year: 1 }, { unique: true });

export const PayrollRun =
  mongoose.models.PayrollRun || mongoose.model('PayrollRun', payrollRunSchema);

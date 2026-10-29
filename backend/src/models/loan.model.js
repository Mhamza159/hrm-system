/**
 * @file loan.model.js
 * @description Mongoose Schema for Employee Loans & Salary Advances (Module M10 / Slices 10.1–10.6).
 * 
 * SPECIFICATION:
 * - Module: M10 Loans & Advances (BUILD-GUIDE Section 15 · Rows 10.1 to 10.6)
 * - Financial Invariant: All monetary figures stored strictly as 64-bit safe integers in minor units (paisa: 1 PKR = 100 paisa).
 * - Compound Indexes: { employeeId: 1, status: 1 }, { 'schedule.dueMonth': 1, 'schedule.status': 1 }
 */

import mongoose from 'mongoose';

const installmentScheduleSchema = new mongoose.Schema(
  {
    installmentNumber: {
      type: Number,
      required: true
    },
    dueMonth: {
      type: String,
      required: true,
      trim: true // Format: 'YYYY-MM'
    },
    amount: {
      type: Number,
      required: true,
      min: 1 // Integer paisa
    },
    status: {
      type: String,
      enum: ['pending', 'deducted', 'prepaid', 'waived'],
      default: 'pending'
    },
    payslipId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payslip',
      default: null
    },
    paidAt: {
      type: Date,
      default: null
    },
    notes: {
      type: String,
      trim: true,
      default: ''
    }
  },
  { _id: true }
);

const repaymentRecordSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
      min: 1 // Integer paisa
    },
    paymentMethod: {
      type: String,
      enum: ['payroll', 'bank_transfer', 'cash'],
      required: true
    },
    reference: {
      type: String,
      trim: true,
      default: ''
    },
    paidAt: {
      type: Date,
      default: Date.now
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  { _id: true }
);

const loanSchema = new mongoose.Schema(
  {
    loanId: {
      type: String,
      unique: true,
      required: true,
      trim: true,
      index: true
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ['loan', 'advance'],
      required: true,
      default: 'loan'
    },
    amount: {
      type: Number,
      required: true,
      min: 100 // Integer paisa (minimum 1 PKR)
    },
    repaymentTenureMonths: {
      type: Number,
      required: true,
      min: 1,
      max: 24,
      default: 1
    },
    monthlyInstallment: {
      type: Number,
      required: true,
      min: 1 // Integer paisa
    },
    remainingBalance: {
      type: Number,
      required: true,
      min: 0 // Integer paisa
    },
    totalRepaid: {
      type: Number,
      default: 0,
      min: 0 // Integer paisa
    },
    reason: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500
    },
    status: {
      type: String,
      enum: [
        'pending_recommendation',
        'pending_hr',
        'pending_admin',
        'approved',
        'active',
        'rejected',
        'closed'
      ],
      default: 'pending_recommendation',
      index: true
    },
    effectiveStartMonth: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}$/ // 'YYYY-MM'
    },
    // Multi-tier Hierarchical Approval Audit Trail
    recommendation: {
      recommendedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      recommendedAt: { type: Date, default: null },
      decision: { type: String, enum: ['recommended', 'declined', null], default: null },
      comments: { type: String, trim: true, default: '' }
    },
    hrReview: {
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      reviewedAt: { type: Date, default: null },
      decision: { type: String, enum: ['forwarded', 'rejected', null], default: null },
      comments: { type: String, trim: true, default: '' }
    },
    adminApproval: {
      approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      approvedAt: { type: Date, default: null },
      decision: { type: String, enum: ['approved', 'rejected', null], default: null },
      disbursementMethod: {
        type: String,
        enum: ['bank_transfer', 'cash', 'payroll_addition'],
        default: 'bank_transfer'
      },
      comments: { type: String, trim: true, default: '' }
    },
    schedule: [installmentScheduleSchema],
    repayments: [repaymentRecordSchema]
  },
  { timestamps: true }
);

// Compound indexes for high-frequency queries
loanSchema.index({ employeeId: 1, status: 1 });
loanSchema.index({ 'schedule.dueMonth': 1, 'schedule.status': 1 });

// Atomic concurrency defense: prevent multiple simultaneous pending/active loans of the same type for an employee
loanSchema.index(
  { employeeId: 1, type: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ['pending_recommendation', 'pending_hr', 'pending_admin', 'active'] }
    }
  }
);

export const Loan = mongoose.models.Loan || mongoose.model('Loan', loanSchema);
export default Loan;

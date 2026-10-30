/**
 * @file expense.model.js
 * @description Mongoose Schema for Corporate Expense Claims, Receipts & Approval Lifecycles.
 * 
 * SPECIFICATION:
 * - Module: M11 Expense Claims (BUILD-GUIDE Section 16 · Row 11.2)
 * - Financial Invariant: All monetary fields stored strictly as positive integer paisa (1 PKR = 100 paisa).
 * - Receipt Invariant: receiptUrl is mandatory.
 */

import mongoose from 'mongoose';

const approvalHistorySchema = new mongoose.Schema(
  {
    stage: {
      type: String,
      required: true
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    decision: {
      type: String,
      required: true
    },
    comments: {
      type: String,
      default: ''
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const reimbursementSchema = new mongoose.Schema(
  {
    method: {
      type: String,
      enum: ['payroll', 'direct'],
      required: true
    },
    paymentReference: {
      type: String,
      default: ''
    },
    disbursedAt: {
      type: Date,
      default: Date.now
    },
    disbursedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    remarks: {
      type: String,
      default: ''
    }
  },
  { _id: false }
);

const expenseSchema = new mongoose.Schema(
  {
    claimNumber: {
      type: String,
      required: [true, 'Claim number is required'],
      unique: true,
      uppercase: true,
      trim: true
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee reference is required'],
      index: true
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ExpenseCategory',
      required: [true, 'Expense category is required'],
      index: true
    },
    amount: {
      type: Number,
      required: [true, 'Claim amount is required'],
      min: [1, 'Amount must be at least 1 paisa'],
      validate: {
        validator: Number.isInteger,
        message: 'Amount must be an integer in paisa'
      }
    },
    approvedAmount: {
      type: Number,
      validate: {
        validator: (v) => v === undefined || Number.isInteger(v),
        message: 'Approved amount must be an integer in paisa'
      }
    },
    expenseDate: {
      type: Date,
      required: [true, 'Expense incurred date is required']
    },
    description: {
      type: String,
      required: [true, 'Expense description is required'],
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    receiptUrl: {
      type: String,
      required: [true, 'Receipt proof URL is required']
    },
    receiptPublicId: {
      type: String,
      default: ''
    },
    receiptMimeType: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['pending_manager', 'pending_admin', 'approved', 'rejected', 'reimbursed'],
      default: 'pending_manager',
      index: true
    },
    approvalHistory: [approvalHistorySchema],
    reimbursement: reimbursementSchema
  },
  {
    timestamps: true
  }
);

expenseSchema.index({ employeeId: 1, status: 1 });
expenseSchema.index({ categoryId: 1, status: 1 });
expenseSchema.index({ expenseDate: 1, status: 1 });

export const Expense = mongoose.model('Expense', expenseSchema);

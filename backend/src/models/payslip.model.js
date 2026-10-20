/**
 * @file payslip.model.js
 * @description Mongoose Schema for Individual Monthly Employee Payslips & Itemized Sub-Ledgers.
 * 
 * SPECIFICATION:
 * - Module: M9 Payroll (BUILD-GUIDE Section 12 · Rows 9.3, 9.4, 9.9, 9.10)
 * - Layer: Model (Database persistence layer)
 * - Financial Invariant: All values computed and stored strictly in integer paisa (PKR × 100).
 * - Compound Unique Index: { payrollRunId: 1, employeeId: 1 } ensures 1 slip per employee per run.
 */

import mongoose from 'mongoose';

const earningItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      enum: [
        'basic',
        'house_rent',
        'medical',
        'conveyance',
        'allowance',
        'overtime',
        'bonus',
        'arrears',
        'encashment'
      ],
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    description: {
      type: String,
      trim: true,
      default: ''
    }
  },
  { _id: true }
);

const deductionItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      enum: [
        'tax',
        'eobi',
        'pessi',
        'provident_fund',
        'unpaid_leave',
        'late_penalty',
        'loan_installment',
        'advance',
        'manual'
      ],
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    description: {
      type: String,
      trim: true,
      default: ''
    }
  },
  { _id: true }
);

const payslipSchema = new mongoose.Schema(
  {
    payrollRunId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PayrollRun',
      required: true,
      index: true
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12
    },
    year: {
      type: Number,
      required: true
    },
    earnings: [earningItemSchema],
    deductions: [deductionItemSchema],
    grossPay: {
      type: Number,
      required: true,
      min: 0
    },
    totalDeductions: {
      type: Number,
      required: true,
      min: 0
    },
    netPay: {
      type: Number,
      required: true,
      min: 0
    },
    taxWithheld: {
      type: Number,
      default: 0
    },
    eobiEmployee: {
      type: Number,
      default: 0
    },
    eobiEmployer: {
      type: Number,
      default: 0
    },
    pessiAmount: {
      type: Number,
      default: 0
    },
    providentFundEmployee: {
      type: Number,
      default: 0
    },
    providentFundEmployer: {
      type: Number,
      default: 0
    },
    overtimeHours: {
      type: Number,
      default: 0
    },
    overtimePay: {
      type: Number,
      default: 0
    },
    lateDeductionDays: {
      type: Number,
      default: 0
    },
    unpaidLeaveDays: {
      type: Number,
      default: 0
    },
    bankName: {
      type: String,
      trim: true,
      default: ''
    },
    accountTitle: {
      type: String,
      trim: true,
      default: ''
    },
    accountNumber: {
      type: String,
      trim: true,
      default: ''
    },
    iban: {
      type: String,
      trim: true,
      default: ''
    },
    status: {
      type: String,
      enum: ['draft', 'approved', 'paid'],
      default: 'draft',
      index: true
    },
    pdfUrl: {
      type: String,
      trim: true,
      default: ''
    },
    generatedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Compound Unique Index: One payslip per employee per payroll run
payslipSchema.index({ payrollRunId: 1, employeeId: 1 }, { unique: true });
payslipSchema.index({ employeeId: 1, year: 1, month: 1 });

export const Payslip =
  mongoose.models.Payslip || mongoose.model('Payslip', payslipSchema);

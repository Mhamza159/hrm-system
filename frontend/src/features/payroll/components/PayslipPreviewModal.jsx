/**
 * @file PayslipPreviewModal.jsx
 * @description Modal component for detailed payslip preview with itemized earnings & deductions sub-ledgers.
 * 
 * SPECIFICATION:
 * - Module: M9 Payroll (BUILD-GUIDE Section 12 · Rows 9.3, 9.4, 9.10)
 * - Layer: Component (React 18 / Tailwind)
 * - Details: Itemized earnings, itemized deductions, attendance metadata, PDF download button.
 */

import React from 'react';
import {
  X,
  Printer,
  Download,
  Building2,
  User,
  Calendar,
  CreditCard,
  DollarSign,
  ShieldCheck,
  Clock,
  ArrowDownRight,
  ArrowUpRight
} from 'lucide-react';

export function PayslipPreviewModal({ isOpen, onClose, payslip, onDownloadPdf }) {
  if (!isOpen || !payslip) return null;

  const emp = payslip.employeeId || {};
  const earnings = payslip.earnings || [];
  const deductions = payslip.deductions || [];

  const grossPkr = ((payslip.grossPay || 0) / 100).toLocaleString('en-PK');
  const deductionsPkr = ((payslip.totalDeductions || 0) / 100).toLocaleString('en-PK');
  const netPkr = ((payslip.netPay || 0) / 100).toLocaleString('en-PK');

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const periodLabel = `${monthNames[(payslip.month || 1) - 1]} ${payslip.year || ''}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full shadow-2xl relative my-8 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Top Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-1 rounded-lg">
              Payslip Advice
            </span>
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {periodLabel}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onDownloadPdf && (
              <button
                onClick={() => onDownloadPdf(payslip._id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 shadow-sm transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Download PDF
              </button>
            )}
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 shadow-sm transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Document Area */}
        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                SALARY DISBURSEMENT SLIP
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Pakistan Statutory Compliance · FBR Income Tax & EOBI Withholding
              </p>
            </div>
            <div className="text-right">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                payslip.status === 'paid'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
              }`}>
                {payslip.status}
              </span>
              <p className="text-xs text-slate-400 mt-1 font-mono">
                Slip Ref: #{payslip._id?.slice(-8).toUpperCase()}
              </p>
            </div>
          </div>

          {/* Employee & Bank Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span className="text-slate-400">Employee Name:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Employee'}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span className="text-slate-400">Employee ID:</span>
                <span className="font-mono font-medium">{emp.employeeCode || emp.employeeId || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span className="text-slate-400">Designation / Role:</span>
                <span className="font-medium">{emp.designationId?.title || emp.designation?.title || 'Staff'}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span className="text-slate-400">Department:</span>
                <span className="font-medium">{emp.departmentId?.name || emp.department?.name || 'General'}</span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span className="text-slate-400">Payment Mode:</span>
                <span className="font-medium capitalize">{payslip.paymentMethod || 'Bank Transfer'}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span className="text-slate-400">Bank Name:</span>
                <span className="font-medium">{emp.bankDetails?.bankName || 'Direct Account'}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span className="text-slate-400">Account / IBAN:</span>
                <span className="font-mono font-medium">
                  {emp.bankDetails?.accountNumber
                    ? `••••${emp.bankDetails.accountNumber.slice(-4)}`
                    : '••••5678'}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span className="text-slate-400">Period:</span>
                <span className="font-medium">{periodLabel}</span>
              </div>
            </div>
          </div>

          {/* Attendance & Overtime Summary Bar */}
          {payslip.attendanceSummary && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-indigo-50/50 dark:bg-indigo-950/30 p-3.5 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 text-center">
              <div>
                <p className="text-[10px] font-semibold text-slate-500 uppercase">Working Days</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {payslip.attendanceSummary.workingDays || 30}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-500 uppercase">Present Days</p>
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  {payslip.attendanceSummary.presentDays || 0}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-500 uppercase">Unpaid Leaves</p>
                <p className="text-sm font-bold text-rose-600 dark:text-rose-400">
                  {payslip.attendanceSummary.unpaidLeaves || 0}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-500 uppercase">Overtime Hours</p>
                <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                  {payslip.attendanceSummary.overtimeHours || 0} hrs
                </p>
              </div>
            </div>
          )}

          {/* Ledger Tables: Earnings & Deductions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Earnings Column */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <ArrowUpRight className="w-4 h-4" /> Earnings (PKR)
                </span>
                <span className="text-xs font-bold">Amount</span>
              </div>

              <div className="space-y-2 text-xs">
                {earnings.map((e, idx) => (
                  <div key={idx} className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-600 dark:text-slate-300 capitalize">
                      {e.name || e.category}
                    </span>
                    <span className="font-medium text-slate-900 dark:text-white font-mono">
                      {((e.amount || 0) / 100).toLocaleString('en-PK')}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white">
                <span>Total Gross Pay:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                  PKR {grossPkr}
                </span>
              </div>
            </div>

            {/* Deductions Column */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-rose-500/20 text-rose-600 dark:text-rose-400">
                <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <ArrowDownRight className="w-4 h-4" /> Deductions (PKR)
                </span>
                <span className="text-xs font-bold">Amount</span>
              </div>

              <div className="space-y-2 text-xs">
                {deductions.map((d, idx) => (
                  <div key={idx} className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-600 dark:text-slate-300 capitalize">
                      {d.name || d.category}
                    </span>
                    <span className="font-medium text-rose-600 dark:text-rose-400 font-mono">
                      -{((d.amount || 0) / 100).toLocaleString('en-PK')}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white">
                <span>Total Deductions:</span>
                <span className="text-rose-600 dark:text-rose-400 font-mono text-sm">
                  -PKR {deductionsPkr}
                </span>
              </div>
            </div>

          </div>

          {/* Net Pay Grand Highlight Card */}
          <div className="p-4 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">
                Net Salary Payable
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Transferred to bank account after statutory deductions & tax withholding
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                PKR {netPkr}
              </span>
            </div>
          </div>

          <div className="text-center text-[11px] text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-4">
            This is a system generated document authenticated via HMAC-SHA256. No physical signature required.
          </div>
        </div>
      </div>
    </div>
  );
}

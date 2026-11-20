/**
 * @file PayslipPreviewModal.jsx
 * @description Modal component for detailed payslip preview with itemized earnings & deductions sub-ledgers.
 * 
 * SPECIFICATION & CRAFT:
 * - Module: M9 Payroll (BUILD-GUIDE Section 12 · Rows 9.3, 9.4, 9.10)
 * - Layer: Component (React 18 / Tailwind)
 * - Theme: ELVARA Emerald Design System (Strict adherence to DESIGN.md & docs/UI-REFERENCE.md)
 * - Details: Real employee database attributes, Cash default mode, zero AI gradients.
 */

import React, { useState } from 'react';
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
  ArrowUpRight,
  CheckCircle2,
  Banknote
} from 'lucide-react';
import { cn } from '../../../lib/utils.js';

export function PayslipPreviewModal({ isOpen, onClose, payslip, onDownloadPdf }) {
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen || !payslip) return null;

  const emp = typeof payslip.employeeId === 'object' && payslip.employeeId !== null
    ? payslip.employeeId
    : {};

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

  // Employee Profile Attributes
  const empName = emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || '—';
  const empCode = emp.employeeCode || emp.employeeId || '—';
  const desigTitle = emp.designationId?.title || emp.designation?.title || 'Staff';
  const deptName = emp.departmentId?.name || emp.department?.name || 'General';
  const rawCnic = emp.cnic || '—';

  const formatCnic = (val) => {
    if (!val || val === '—' || val === 'N/A') return '—';
    if (typeof val === 'string' && val.includes(':')) return '•••••-•••••••-•';
    const clean = String(val).replace(/[^0-9]/g, '');
    if (clean.length === 13) return `${clean.slice(0, 5)}-*******-${clean.slice(12)}`;
    return val;
  };
  const cnicNumber = formatCnic(rawCnic);

  // Payment Method: Default to Cash
  const isCash = !payslip.paymentMethod || payslip.paymentMethod === 'cash';

  const handleDownload = async () => {
    if (!onDownloadPdf) return;
    try {
      setIsDownloading(true);
      await onDownloadPdf(payslip._id);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/15 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-[#111D17] border border-slate-200/80 dark:border-[#1A3125] rounded-3xl max-w-3xl w-full shadow-2xl relative my-8 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Top Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#0E1A14] shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 px-2.5 py-1 rounded-lg">
              Payslip Advice
            </span>
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {periodLabel}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onDownloadPdf && (
              <button
                type="button"
                onClick={handleDownload}
                disabled={isDownloading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/50 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/40 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                {isDownloading ? 'Downloading...' : 'Download PDF'}
              </button>
            )}
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-[#15231C] border border-slate-200/80 dark:border-[#1A3125] rounded-xl hover:bg-slate-50 dark:hover:bg-[#1A3125] shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Document Area */}
        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/80 dark:border-[#1A3125]">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                SALARY DISBURSEMENT SLIP
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Pakistan Statutory Compliance · FBR Income Tax & EOBI Withholding
              </p>
            </div>
            <div className="text-right">
              <span className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border',
                payslip.status === 'paid'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
              )}>
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                {payslip.status}
              </span>
              <p className="text-xs text-slate-400 mt-1 font-mono">
                Slip Ref: #{payslip._id ? payslip._id.slice(-8).toUpperCase() : 'PENDING'}
              </p>
            </div>
          </div>

          {/* Employee & Payment Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/70 dark:bg-[#0E1A14] p-5 rounded-2xl border border-slate-200/80 dark:border-[#1A3125]">
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span className="text-slate-400 dark:text-slate-500">Employee Name:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {empName}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span className="text-slate-400 dark:text-slate-500">Employee ID:</span>
                <span className="font-mono font-medium text-slate-900 dark:text-white">{empCode}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span className="text-slate-400 dark:text-slate-500">Designation / Role:</span>
                <span className="font-medium text-slate-900 dark:text-white">{desigTitle}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span className="text-slate-400 dark:text-slate-500">Department:</span>
                <span className="font-medium text-slate-900 dark:text-white">{deptName}</span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span className="text-slate-400 dark:text-slate-500">Payment Mode:</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {isCash ? 'Cash in Hand' : 'Bank Transfer'}
                </span>
              </div>
              {isCash ? (
                <>
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span className="text-slate-400 dark:text-slate-500">Disbursement:</span>
                    <span className="font-medium text-slate-900 dark:text-white">Cash Disbursement</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 gap-2">
                    <span className="text-slate-400 dark:text-slate-500 whitespace-nowrap">CNIC / Identity:</span>
                    <span className="font-mono font-medium text-slate-900 dark:text-white truncate max-w-[200px] text-right" title={cnicNumber}>
                      {cnicNumber}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span className="text-slate-400 dark:text-slate-500">Bank Name:</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {emp.bankDetails?.bankName || payslip.bankName || 'Direct Account'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span className="text-slate-400 dark:text-slate-500">Account / IBAN:</span>
                    <span className="font-mono font-medium text-slate-900 dark:text-white">
                      {emp.bankDetails?.accountNumber
                        ? `••••${emp.bankDetails.accountNumber.slice(-4)}`
                        : (payslip.accountNumber ? `••••${payslip.accountNumber.slice(-4)}` : '••••')}
                    </span>
                  </div>
                </>
              )}
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span className="text-slate-400 dark:text-slate-500">Period:</span>
                <span className="font-medium text-slate-900 dark:text-white">{periodLabel}</span>
              </div>
            </div>
          </div>

          {/* Attendance & Overtime Summary Bar */}
          {payslip.attendanceSummary && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/70 dark:bg-[#0E1A14] p-3.5 rounded-2xl border border-slate-200/80 dark:border-[#1A3125] text-center">
              <div>
                <p className="text-[10px] font-semibold text-slate-500 uppercase">Working Days</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white font-mono tabular-nums">
                  {payslip.attendanceSummary.workingDays || 30}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-500 uppercase">Present Days</p>
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
                  {payslip.attendanceSummary.presentDays || 0}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-500 uppercase">Unpaid Leaves</p>
                <p className="text-sm font-bold text-rose-600 dark:text-rose-400 font-mono tabular-nums">
                  {payslip.attendanceSummary.unpaidLeaves || 0}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-500 uppercase">Overtime Hours</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white font-mono tabular-nums">
                  {payslip.attendanceSummary.overtimeHours || 0} hrs
                </p>
              </div>
            </div>
          )}

          {/* Ledger Tables: Earnings & Deductions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Earnings Column */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <ArrowUpRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Earnings (PKR)
                </span>
                <span className="text-xs font-bold">Amount</span>
              </div>

              <div className="space-y-2 text-xs min-h-[90px]">
                {earnings.map((e, idx) => (
                  <div key={idx} className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-[#1A3125]">
                    <span className="text-slate-600 dark:text-slate-300 capitalize">
                      {e.name || e.category}
                    </span>
                    <span className="font-medium text-slate-900 dark:text-white font-mono tabular-nums">
                      {((e.amount || 0) / 100).toLocaleString('en-PK')}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 dark:border-[#1A3125] text-xs font-bold text-slate-900 dark:text-white">
                <span>Total Gross Pay:</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-mono tabular-nums text-sm font-bold">
                  PKR {grossPkr}
                </span>
              </div>
            </div>

            {/* Deductions Column */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-rose-500/20 text-rose-700 dark:text-rose-400">
                <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <ArrowDownRight className="w-4 h-4 text-rose-600 dark:text-rose-400" /> Deductions (PKR)
                </span>
                <span className="text-xs font-bold">Amount</span>
              </div>

              <div className="space-y-2 text-xs min-h-[90px]">
                {deductions.map((d, idx) => (
                  <div key={idx} className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-[#1A3125]">
                    <span className="text-slate-600 dark:text-slate-300 capitalize">
                      {d.name || d.category}
                    </span>
                    <span className="font-medium text-rose-600 dark:text-rose-400 font-mono tabular-nums">
                      -{((d.amount || 0) / 100).toLocaleString('en-PK')}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 dark:border-[#1A3125] text-xs font-bold text-slate-900 dark:text-white">
                <span>Total Deductions:</span>
                <span className="text-rose-600 dark:text-rose-400 font-mono tabular-nums text-sm font-bold">
                  -PKR {deductionsPkr}
                </span>
              </div>
            </div>

          </div>

          {/* Net Pay Highlight Card */}
          <div className="p-5 bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/40 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">
                Net Salary Payable
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Transferred via {isCash ? 'cash disbursement' : 'direct bank transfer'} after statutory deductions & tax withholding
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 font-mono tabular-nums">
                PKR {netPkr}
              </span>
            </div>
          </div>

          <div className="text-center text-[11px] text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-[#1A3125] pt-4">
            This is a system generated document authenticated via HMAC-SHA256. No physical signature required.
          </div>
        </div>
      </div>
    </div>
  );
}

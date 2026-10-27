/**
 * @file PrePayrollAuditModal.jsx
 * @description 2-Step Pre-Payroll Attendance & Leave Audit Console.
 * 
 * SPECIFICATION:
 * - Module: M9 Payroll (SPEC-pre-payroll-audit-console.md)
 * - Step 1: Pre-Payroll Live Audit Grid with Expandable Daily Punch Evidence
 * - Step 2: Formal Dispatch Confirmation & Payroll Run Creation
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Lock,
  ChevronDown,
  ChevronUp,
  Search,
  Clock,
  Briefcase,
  Building2,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  ShieldAlert,
  Sparkles,
  FileText
} from 'lucide-react';
import { useGetPrePayrollAuditQuery, useGeneratePayrollRunMutation } from '../payrollApi.js';
import { toast } from 'sonner';

export function PrePayrollAuditModal({ isOpen, onClose, onSuccess }) {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(7); // Default to July 2026 for review
  const [selectedYear, setSelectedYear] = useState(2026);
  const [step, setStep] = useState(1); // 1 = Audit Table, 2 = Confirmation
  const [expandedRow, setExpandedRow] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Reset modal state on opening
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setExpandedRow(null);
      setSearchQuery('');
    }
  }, [isOpen]);

  const { data: auditData, isLoading, isFetching } = useGetPrePayrollAuditQuery(
    { month: selectedMonth, year: selectedYear },
    { skip: !isOpen }
  );

  const [generatePayrollRun, { isLoading: isGenerating }] = useGeneratePayrollRunMutation();

  if (!isOpen) return null;

  const audit = auditData?.data || {};
  const isMonthLocked = audit.isMonthLocked ?? false;
  const employees = audit.employees || [];
  const projectedTotals = audit.projectedTotals || {};

  const filteredEmployees = employees.filter((emp) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      emp.name?.toLowerCase().includes(query) ||
      emp.employeeCode?.toLowerCase().includes(query) ||
      emp.department?.toLowerCase().includes(query)
    );
  });

  const toggleRow = (empId) => {
    setExpandedRow(expandedRow === empId ? null : empId);
  };

  const handleGenerate = async () => {
    try {
      const res = await generatePayrollRun({
        month: selectedMonth,
        year: selectedYear
      }).unwrap();

      toast.success(`Payroll Run for ${audit.yearMonth} created successfully!`);
      if (onSuccess) onSuccess(res.data?._id || res.data);
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || err?.message || 'Failed to generate payroll run');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-6xl bg-white dark:bg-[#111D17] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#1A3125] overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-[#1A3125] bg-slate-50/80 dark:bg-[#15241C]/60 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Pre-Payroll Attendance & Leave Audit Console
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  Step {step} of 2: {step === 1 ? 'Readiness & Attendance Audit' : 'Confirm & Generate'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Verify monthly lates, unpaid leaves, and approved overtime evidence before calculating financial liabilities.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1A3125] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        {step === 1 ? (
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
            {/* Cycle Selector & MonthLock Status Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-[#162820]/40 border border-slate-200 dark:border-[#1A3125]">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Target Cycle:</span>
                </div>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-[#111D17] border border-slate-300 dark:border-[#1A3125] text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                >
                  {[
                    { m: 1, name: 'January' },
                    { m: 2, name: 'February' },
                    { m: 3, name: 'March' },
                    { m: 4, name: 'April' },
                    { m: 5, name: 'May' },
                    { m: 6, name: 'June' },
                    { m: 7, name: 'July' },
                    { m: 8, name: 'August' },
                    { m: 9, name: 'September' },
                    { m: 10, name: 'October' },
                    { m: 11, name: 'November' },
                    { m: 12, name: 'December' }
                  ].map((mo) => (
                    <option key={mo.m} value={mo.m}>
                      {mo.name}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-[#111D17] border border-slate-300 dark:border-[#1A3125] text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                >
                  {[2024, 2025, 2026, 2027].map((yr) => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
                </select>
              </div>

              {/* Month Lock Guard Pill */}
              <div className="flex items-center gap-2">
                {isMonthLocked ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    Month Attendance Frozen (Locked)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-semibold">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    Attendance Unlocked (Lock required before payout)
                  </span>
                )}
              </div>
            </div>

            {/* Projected Financial Outflow Strip */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="p-3.5 rounded-xl bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125]">
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Eligible Staff
                </p>
                <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                  {audit.totalEligibleEmployees || 0} Employees
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125]">
                <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  Projected Gross
                </p>
                <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                  PKR {((projectedTotals.totalGrossPaisa || 0) / 100).toLocaleString('en-PK')}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125]">
                <p className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  Approved Overtime Pay
                </p>
                <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                  +PKR {((projectedTotals.totalOvertimePaisa || 0) / 100).toLocaleString('en-PK')}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125]">
                <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                  Total Penalties & Taxes
                </p>
                <p className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1">
                  -PKR {((projectedTotals.totalDeductionsPaisa || 0) / 100).toLocaleString('en-PK')}
                </p>
              </div>
            </div>

            {/* Search & Counter Bar */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter by name, code, department..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-[#111D17] border border-slate-300 dark:border-[#1A3125] rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <span>Showing {filteredEmployees.length} of {employees.length} employees</span>
                <span className="text-slate-300 dark:text-slate-600">•</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">Click any row to expand evidence</span>
              </div>
            </div>

            {/* Audit Table */}
            {isLoading || isFetching ? (
              <div className="py-20 text-center space-y-3">
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto" />
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Loading and calculating attendance audit records for {audit.yearMonth}...
                </p>
              </div>
            ) : filteredEmployees.length === 0 ? (
              <div className="py-16 text-center rounded-xl border border-dashed border-slate-200 dark:border-[#1A3125] p-6">
                <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No active employees found</p>
                <p className="text-xs text-slate-500 mt-1">Please ensure employees have active salary structures assigned.</p>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 dark:border-[#1A3125] overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-[#1A3125] bg-slate-100/70 dark:bg-[#162820]/70 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4">Employee</th>
                      <th className="py-3 px-3">Base Gross</th>
                      <th className="py-3 px-3 text-center">Present / Absent</th>
                      <th className="py-3 px-3 text-center">Late Arrivals</th>
                      <th className="py-3 px-3 text-center">Unpaid Leaves</th>
                      <th className="py-3 px-3 text-center">Approved OT</th>
                      <th className="py-3 px-4 text-right">Projected Net</th>
                      <th className="py-3 px-2 text-center w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#1A3125]">
                    {filteredEmployees.map((emp) => {
                      const isExpanded = expandedRow === emp.employeeId;
                      return (
                        <React.Fragment key={emp.employeeId}>
                          <tr
                            onClick={() => toggleRow(emp.employeeId)}
                            className={`cursor-pointer transition-colors ${
                              isExpanded
                                ? 'bg-emerald-50/40 dark:bg-[#162820]/60'
                                : 'hover:bg-slate-50 dark:hover:bg-[#14231B]'
                            }`}
                          >
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center justify-center flex-shrink-0">
                                  {emp.name?.slice(0, 2).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-slate-900 dark:text-white truncate">
                                      {emp.name}
                                    </span>
                                    <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded">
                                      {emp.employeeCode}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                                    {emp.designation} • {emp.department}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="py-3 px-3 font-semibold text-slate-700 dark:text-slate-200">
                              PKR {(emp.baseGrossPaisa / 100).toLocaleString('en-PK')}
                            </td>

                            <td className="py-3 px-3 text-center">
                              <span className="inline-flex items-center gap-1 font-medium">
                                <span className="text-emerald-600 dark:text-emerald-400 font-bold">{emp.presentDays}d</span>
                                <span className="text-slate-300">/</span>
                                <span className={emp.absentDays > 0 ? 'text-rose-600 font-bold' : 'text-slate-400'}>
                                  {emp.absentDays}d
                                </span>
                              </span>
                            </td>

                            {/* Late arrivals badge */}
                            <td className="py-3 px-3 text-center">
                              {emp.lateCount > 0 ? (
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                    emp.latePenaltyDays > 0
                                      ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                                      : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                                  }`}
                                  title={emp.latePenaltyDays > 0 ? `${emp.latePenaltyDays} day gross cut applied` : 'Within grace period'}
                                >
                                  {emp.lateCount} lates
                                  {emp.latePenaltyDays > 0 && ` (-${emp.latePenaltyDays}d)`}
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[11px]">0 (Punctual)</span>
                              )}
                            </td>

                            {/* Unpaid leaves badge */}
                            <td className="py-3 px-3 text-center">
                              {emp.unpaidLeaveDays > 0 ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                                  {emp.unpaidLeaveDays} days LWP
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[11px]">0</span>
                              )}
                            </td>

                            {/* Approved Overtime badge */}
                            <td className="py-3 px-3 text-center">
                              {emp.overtimeHours > 0 ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800">
                                  +{emp.overtimeHours} hrs
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[11px]">0</span>
                              )}
                            </td>

                            <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white">
                              PKR {(emp.projectedNetPaisa / 100).toLocaleString('en-PK')}
                            </td>

                            <td className="py-3 px-2 text-center text-slate-400">
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </td>
                          </tr>

                          {/* Expandable Evidence Detail Card */}
                          {isExpanded && (
                            <tr className="bg-slate-50/80 dark:bg-[#14231B] border-b border-slate-200 dark:border-[#1A3125]">
                              <td colSpan={8} className="p-4 sm:p-5">
                                <div className="space-y-4">
                                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1A3125] pb-2">
                                    <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                      <FileText className="w-4 h-4 text-emerald-500" />
                                      Detailed Attendance Evidence & Calculation Factors: {emp.name}
                                    </h4>
                                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                      Base Gross: PKR {(emp.baseGrossPaisa / 100).toLocaleString()} • EOBI: -PKR {(emp.eobiPaisa / 100).toLocaleString()} • Tax: -PKR {(emp.taxWithheldPaisa / 100).toLocaleString()}
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    {/* 1. Late Arrivals List */}
                                    <div className="p-3 rounded-xl bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] space-y-2">
                                      <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                                        <span className="flex items-center gap-1.5">
                                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                                          Late Punches ({emp.lateCount})
                                        </span>
                                        {emp.latePenaltyDays > 0 ? (
                                          <span className="text-[10px] text-rose-600 font-bold">
                                            -PKR {(emp.latePenaltyPaisa / 100).toLocaleString()}
                                          </span>
                                        ) : (
                                          <span className="text-[10px] text-slate-400 font-normal">Grace: 0 Cut</span>
                                        )}
                                      </div>
                                      {emp.auditBreakdown?.lates?.length > 0 ? (
                                        <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                                          {emp.auditBreakdown.lates.map((lt, idx) => (
                                            <div key={idx} className="flex items-center justify-between text-[11px] p-1.5 rounded bg-slate-50 dark:bg-[#162820]">
                                              <span className="font-semibold text-slate-700 dark:text-slate-300">{lt.date}</span>
                                              <span className="text-slate-500">Punch: {lt.checkIn} ({lt.minutesLate}m late)</span>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <p className="text-[11px] text-slate-400 italic">No late punches recorded this month.</p>
                                      )}
                                    </div>

                                    {/* 2. Unpaid Leaves (LWP) List */}
                                    <div className="p-3 rounded-xl bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] space-y-2">
                                      <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                                        <span className="flex items-center gap-1.5">
                                          <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                                          Unpaid Leaves ({emp.unpaidLeaveDays}d)
                                        </span>
                                        {emp.unpaidLeaveDays > 0 && (
                                          <span className="text-[10px] text-rose-600 font-bold">
                                            -PKR {(emp.unpaidLeavePaisa / 100).toLocaleString()}
                                          </span>
                                        )}
                                      </div>
                                      {emp.auditBreakdown?.unpaidLeaves?.length > 0 ? (
                                        <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                                          {emp.auditBreakdown.unpaidLeaves.map((ul, idx) => (
                                            <div key={idx} className="p-1.5 rounded bg-slate-50 dark:bg-[#162820] text-[11px] space-y-0.5">
                                              <div className="flex items-center justify-between font-semibold text-slate-700 dark:text-slate-300">
                                                <span>{ul.startDate} to {ul.endDate}</span>
                                                <span className="text-rose-600">{ul.days} days</span>
                                              </div>
                                              <p className="text-[10px] text-slate-400 italic truncate">{ul.reason}</p>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <p className="text-[11px] text-slate-400 italic">Zero unpaid leave days in this cycle.</p>
                                      )}
                                    </div>

                                    {/* 3. Approved Overtime List */}
                                    <div className="p-3 rounded-xl bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] space-y-2">
                                      <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                                        <span className="flex items-center gap-1.5">
                                          <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
                                          Approved Overtime ({emp.overtimeHours}h)
                                        </span>
                                        {emp.overtimeHours > 0 && (
                                          <span className="text-[10px] text-indigo-600 font-bold">
                                            +PKR {(emp.overtimePayPaisa / 100).toLocaleString()}
                                          </span>
                                        )}
                                      </div>
                                      {emp.auditBreakdown?.approvedOvertime?.length > 0 ? (
                                        <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                                          {emp.auditBreakdown.approvedOvertime.map((ot, idx) => (
                                            <div key={idx} className="flex items-center justify-between text-[11px] p-1.5 rounded bg-slate-50 dark:bg-[#162820]">
                                              <span className="font-semibold text-slate-700 dark:text-slate-300">{ot.date}</span>
                                              <span className="text-indigo-600 font-medium">+{ot.hours}h (+PKR {(ot.payPaisa / 100).toLocaleString()})</span>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <p className="text-[11px] text-slate-400 italic">No approved overtime this month.</p>
                                      )}
                                    </div>

                                    {/* 4. Leave Encashment (If Any) */}
                                    {emp.encashmentPayPaisa > 0 && (
                                      <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-[#162820] border border-emerald-200 dark:border-emerald-800 space-y-2 md:col-span-3">
                                        <div className="flex items-center justify-between text-xs font-bold text-emerald-800 dark:text-emerald-300">
                                          <span className="flex items-center gap-1.5">
                                            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                                            Approved Leave Encashments (+PKR {(emp.encashmentPayPaisa / 100).toLocaleString()})
                                          </span>
                                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Included in Gross</span>
                                        </div>
                                        <div className="space-y-1">
                                          {(emp.auditBreakdown?.encashments || []).map((enc, idx) => (
                                            <div key={idx} className="flex items-center justify-between text-[11px] p-1.5 rounded bg-white dark:bg-[#111D17]">
                                              <span className="text-slate-700 dark:text-slate-300">Encashment of {enc.days} annual leave days</span>
                                              <span className="text-emerald-600 font-bold">+PKR {(enc.amountPaisa / 100).toLocaleString()}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          /* Step 2: Final Confirmation */
          <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-xl mx-auto my-auto text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Confirm & Generate Payroll Run for {audit.yearMonth}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                You have audited the attendance records and penalties for {employees.length} employees.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#162820] border border-slate-200 dark:border-[#1A3125] text-left space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span>Total Employees Audited:</span>
                <span className="font-bold text-slate-900 dark:text-white">{employees.length} Staff</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span>Total Projected Gross:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  PKR {((projectedTotals.totalGrossPaisa || 0) / 100).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span>Total Approved Overtime Additions:</span>
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                  +PKR {((projectedTotals.totalOvertimePaisa || 0) / 100).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span>Total Deductions (Lates, Unpaid, Tax, EOBI):</span>
                <span className="font-semibold text-rose-600 dark:text-rose-400">
                  -PKR {((projectedTotals.totalDeductionsPaisa || 0) / 100).toLocaleString()}
                </span>
              </div>
              <div className="border-t border-slate-200 dark:border-slate-700 pt-2 flex items-center justify-between text-sm font-bold text-emerald-600 dark:text-emerald-400">
                <span>Total Net Disbursable Outflow:</span>
                <span>PKR {((projectedTotals.totalNetPaisa || 0) / 100).toLocaleString()}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Generating will create draft payslips in review status. You can still adjust individual line items before Super Admin final approval.
            </p>
          </div>
        )}

        {/* Modal Footer Controls */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-[#1A3125] bg-slate-50/80 dark:bg-[#15241C]/60 flex-shrink-0">
          {step === 1 ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1A3125] transition-colors"
              >
                Close
              </button>

              <button
                type="button"
                disabled={!isMonthLocked || employees.length === 0 || isLoading || isFetching}
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                title={!isMonthLocked ? 'Please lock attendance for this month first' : 'Proceed to confirmation'}
              >
                <span>Proceed to Run Confirmation</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                disabled={isGenerating}
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1A3125] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Audit</span>
              </button>

              <button
                type="button"
                disabled={isGenerating}
                onClick={handleGenerate}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg transition-all cursor-pointer disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Calculating Official Payroll...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Confirm & Generate Official Payroll</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

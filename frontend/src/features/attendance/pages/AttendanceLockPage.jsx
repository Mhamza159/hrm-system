/**
 * @file AttendanceLockPage.jsx
 * @description Monthly Attendance Freezing & Payroll Lock Control Panel.
 * 
 * SPECIFICATION & FEATURES:
 * - Module: M5 Attendance & Shifts (BUILD-GUIDE Section 10 · Row 5.14)
 * - Brand Theme: ELVARA Emerald & Enterprise Slate Design System
 * - Capabilities: Month Switcher, Pre-Lock Audit Metrics, Integrity Safeguards,
 *   Lock/Unlock Confirmation Modal, Preset Audit Tags, and Audit Trail History.
 */

import React, { useState } from 'react';
import {
  Lock,
  Unlock,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  Users,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  History,
  FileText,
  Info,
  HelpCircle,
  Sparkles,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import {
  useGetLockStatusQuery,
  useLockMonthMutation,
  useUnlockMonthMutation
} from '../attendanceApi.js';
import { usePermission } from '../../../hooks/usePermission.js';

export const AttendanceLockPage = () => {
  const { can } = usePermission();
  const currentDate = new Date();
  const defaultMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
  const [notes, setNotes] = useState('');
  const [actionError, setActionError] = useState('');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const { data, isLoading, isFetching, refetch } = useGetLockStatusQuery(selectedMonth);
  const [lockMonth, { isLoading: isLocking }] = useLockMonthMutation();
  const [unlockMonth, { isLoading: isUnlocking }] = useUnlockMonthMutation();

  const lockInfo = data?.data;
  const isLocked = Boolean(lockInfo?.isLocked);
  const metrics = lockInfo?.metrics || { totalRecords: 0, pendingCorrections: 0, pendingWFH: 0 };
  const recentHistory = lockInfo?.recentHistory || [];

  const formatYearMonth = (ym) => {
    if (!ym) return '';
    const [y, m] = ym.split('-');
    const date = new Date(Number(y), Number(m) - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const handlePrevMonth = () => {
    const [y, m] = selectedMonth.split('-');
    const prevDate = new Date(Number(y), Number(m) - 2, 1);
    setSelectedMonth(`${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    const [y, m] = selectedMonth.split('-');
    const nextDate = new Date(Number(y), Number(m), 1);
    setSelectedMonth(`${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`);
  };

  const handleCurrentMonth = () => {
    setSelectedMonth(defaultMonth);
  };

  const handleLastMonth = () => {
    const lastDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    setSelectedMonth(`${lastDate.getFullYear()}-${String(lastDate.getMonth() + 1).padStart(2, '0')}`);
  };

  const handleExecuteToggle = async () => {
    setActionError('');
    try {
      if (isLocked) {
        await unlockMonth({ yearMonth: selectedMonth, notes }).unwrap();
      } else {
        await lockMonth({ yearMonth: selectedMonth, notes }).unwrap();
      }
      setIsConfirmModalOpen(false);
      setNotes('');
      refetch();
    } catch (err) {
      setActionError(err.data?.message || err.message || 'Operation failed');
    }
  };

  const PRESET_LOCK_NOTES = [
    'Finance monthly payroll cutoff initiated',
    'Pre-payroll reconciliation audit completed',
    'All timesheets and WFH requests verified',
    'End-of-month attendance freeze'
  ];

  const PRESET_UNLOCK_NOTES = [
    'Adjustment required for missed punch correction',
    'Finance team requested retroactive review',
    'Manager approved special leave adjustment'
  ];

  const totalPending = metrics.pendingCorrections + metrics.pendingWFH;

  if (!can('attendance.lock')) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-3xl text-center space-y-4 shadow-sm">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Access Restricted</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
          You do not have permission to freeze or unlock attendance months. This operation is strictly reserved for HR Managers and Super Admins to protect payroll integrity.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/70 dark:border-slate-800">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40 rounded-2xl shadow-xs">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Pre-Payroll Attendance Lock
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/50">
                Payroll Security Gate
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Freeze monthly attendance records to protect payroll integrity and prevent unauthorized modifications.
            </p>
          </div>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isLoading || isFetching}
          className="self-start md:self-auto px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center gap-2 transition-colors shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-emerald-600' : ''}`} />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {actionError && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl text-rose-700 dark:text-rose-300 text-sm flex items-center gap-3 shadow-xs">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span className="font-medium">{actionError}</span>
        </div>
      )}

      {/* Month Navigation & Selector Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            title="Previous Month"
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="relative">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-slate-900 dark:text-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            />
          </div>

          <button
            onClick={handleNextMonth}
            title="Next Month"
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="hidden md:flex items-center gap-1.5 ml-2">
            <button
              onClick={handleCurrentMonth}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                selectedMonth === defaultMonth
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Current Month
            </button>
            <button
              onClick={handleLastMonth}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Last Month
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right">
            <span className="text-xs text-slate-400 block font-medium">Selected Audit Period</span>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {formatYearMonth(selectedMonth)}
            </span>
          </div>
          <div className={`p-2 rounded-xl ${isLocked ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'}`}>
            {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
          </div>
        </div>
      </div>

      {/* Pre-Lock Audit Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Attendance Records */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Attendance Logs</span>
            <div className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {isLoading ? '...' : metrics.totalRecords.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400 font-medium">punches</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Logged across all shifts</p>
        </div>

        {/* Metric 2: Pending Missed Punch Corrections */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Corrections</span>
            <div className={`p-2 rounded-xl ${metrics.pendingCorrections > 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'}`}>
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl font-bold ${metrics.pendingCorrections > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
              {isLoading ? '...' : metrics.pendingCorrections}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${metrics.pendingCorrections > 0 ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'}`}>
              {metrics.pendingCorrections > 0 ? 'Action Needed' : 'All Clear'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Unapproved punch corrections</p>
        </div>

        {/* Metric 3: Pending WFH Requests */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending WFH</span>
            <div className={`p-2 rounded-xl ${metrics.pendingWFH > 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'}`}>
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl font-bold ${metrics.pendingWFH > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
              {isLoading ? '...' : metrics.pendingWFH}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${metrics.pendingWFH > 0 ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'}`}>
              {metrics.pendingWFH > 0 ? 'Action Needed' : 'All Clear'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Unreviewed work-from-home requests</p>
        </div>

        {/* Metric 4: Payroll Freeze Readiness */}
        <div className={`rounded-2xl p-4 shadow-xs border ${isLocked ? 'bg-amber-500/10 border-amber-300 dark:border-amber-800' : totalPending === 0 ? 'bg-emerald-500/10 border-emerald-300 dark:border-emerald-800' : 'bg-sky-500/10 border-sky-300 dark:border-sky-800'}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">Ledger State</span>
            <div className={`p-2 rounded-xl ${isLocked ? 'bg-amber-500 text-white' : 'bg-emerald-600 text-white'}`}>
              {isLocked ? <Lock className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
            </div>
          </div>
          <div className="mt-2">
            <span className={`text-base font-bold ${isLocked ? 'text-amber-700 dark:text-amber-300' : 'text-emerald-700 dark:text-emerald-300'}`}>
              {isLocked ? 'Frozen for Payroll' : totalPending === 0 ? 'Ready to Freeze' : 'Pending Items'}
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            {isLocked ? 'Modifications disabled' : totalPending === 0 ? 'Safe to lock for payroll' : `${totalPending} items require HR review`}
          </p>
        </div>
      </div>

      {/* 2-Column Responsive Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Lock Control & Policy Safeguards (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Status & Action Hero Card */}
          <div className={`bg-white dark:bg-slate-900 border rounded-2xl p-6 shadow-sm space-y-6 transition-all ${
            isLocked
              ? 'border-amber-300/80 dark:border-amber-700/60 ring-1 ring-amber-500/20'
              : 'border-emerald-200/80 dark:border-emerald-800/80'
          }`}>
            {/* Status Header Banner */}
            <div className={`p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              isLocked
                ? 'bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50'
                : 'bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/50'
            }`}>
              <div className="flex items-start gap-3.5">
                <div className={`p-2.5 rounded-xl mt-0.5 ${
                  isLocked
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-emerald-600 text-white shadow-xs'
                }`}>
                  {isLocked ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    {isLocked ? 'Status: Frozen / Locked for Payroll' : 'Status: Open / Unlocked for Mutations'}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    {isLocked
                      ? 'Attendance mutations are strictly prohibited. Timesheets are locked for salary and deduction calculation.'
                      : 'Employees & Managers can still clock in, edit times, and submit correction requests for this month.'}
                  </p>
                </div>
              </div>

              <span className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 self-start sm:self-auto ${
                isLocked
                  ? 'bg-amber-200 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200 border border-amber-300 dark:border-amber-700'
                  : 'bg-emerald-200 text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700'
              }`}>
                {isLocked ? 'FROZEN' : 'ACTIVE'}
              </span>
            </div>

            {/* If Locked: Audit Details */}
            {isLocked && lockInfo && (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/70 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Locked By Administrator:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {lockInfo.lockedBy?.name || 'Authorized Admin'} ({lockInfo.lockedBy?.email || 'N/A'})
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Lock Timestamp:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {lockInfo.lockedAt ? new Date(lockInfo.lockedAt).toLocaleString() : 'N/A'}
                  </span>
                </div>
                {lockInfo.notes && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                    <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Attached Audit Reason:</span>
                    <p className="text-xs italic text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                      "{lockInfo.notes}"
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Audit Reason & Preset Tags */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  {isLocked ? 'Unlock Reason / Justification' : 'Audit Reason / Notes'}
                </label>
                <span className="text-[11px] text-slate-400">Mandatory for audit trail</span>
              </div>

              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={
                  isLocked
                    ? 'Explain why this payroll month is being unlocked (e.g. Approved adjustment for employee missed punch)...'
                    : 'e.g. October 2026 payroll cycle initiated by Finance team...'
                }
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none transition-all"
              />

              {/* Preset Quick Tags */}
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Quick Reason Presets:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(isLocked ? PRESET_UNLOCK_NOTES : PRESET_LOCK_NOTES).map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setNotes(preset)}
                      className="px-2.5 py-1 rounded-lg text-xs bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 dark:bg-slate-800 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 transition-colors"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Warning if locking with pending requests */}
            {!isLocked && totalPending > 0 && (
              <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <span className="font-bold">Attention Required:</span> There are currently{' '}
                  <span className="font-semibold">{metrics.pendingCorrections} pending punch corrections</span> and{' '}
                  <span className="font-semibold">{metrics.pendingWFH} pending WFH requests</span> for {formatYearMonth(selectedMonth)}. Freezing now will block resolution of these requests.
                </div>
              </div>
            )}

            {/* Action CTA Button */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Action requires confirmation dialog
              </span>

              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(true)}
                disabled={isLocking || isUnlocking || isLoading}
                className={`px-6 py-2.5 text-sm font-semibold rounded-xl text-white shadow-sm flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer ${
                  isLocked
                    ? 'bg-slate-800 hover:bg-slate-900 border border-slate-700'
                    : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20 shadow-md'
                }`}
              >
                {isLocked ? (
                  <>
                    <Unlock className="w-4 h-4" />
                    <span>Unlock Month (Permit Edits)</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Lock Month (Freeze Data)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* System Integrity Safeguards Panel */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Automated Safeguards Enforced When Frozen
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block">Check-In / Out Blocked</span>
                  <span className="text-slate-500 dark:text-slate-400">Web, biometric, and mobile punches rejected.</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block">Corrections Prohibited</span>
                  <span className="text-slate-500 dark:text-slate-400">Missed punch modification requests disabled.</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block">WFH Requests Locked</span>
                  <span className="text-slate-500 dark:text-slate-400">No retroactive work-from-home applications.</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block">Payroll Snapshot Frozen</span>
                  <span className="text-slate-500 dark:text-slate-400">Salary engine calculations locked against drift.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Audit History & Operator Guidelines (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Recent Month Lock Audit Trail */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Audit History
                </h3>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">Recent 10 Months</span>
            </div>

            {recentHistory.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <ShieldCheck className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  No month lock audit records logged yet.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentHistory.map((item) => (
                  <div
                    key={item._id || item.yearMonth}
                    className={`p-3 rounded-xl border text-xs transition-all ${
                      item.yearMonth === selectedMonth
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-700/60'
                        : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {formatYearMonth(item.yearMonth)}
                        </span>
                        {item.yearMonth === selectedMonth && (
                          <span className="px-1.5 py-0.2 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-[10px] rounded font-semibold">
                            Viewing
                          </span>
                        )}
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          item.isLocked
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                        }`}
                      >
                        {item.isLocked ? 'LOCKED' : 'UNLOCKED'}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                      <span>By: {item.lockedBy?.name || item.unlockedBy?.name || 'Administrator'}</span>
                      <span>
                        {item.lockedAt ? new Date(item.lockedAt).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>

                    {item.notes && (
                      <p className="mt-1.5 text-[11px] text-slate-600 dark:text-slate-400 line-clamp-1 italic">
                        "{item.notes}"
                      </p>
                    )}

                    {item.yearMonth !== selectedMonth && (
                      <button
                        onClick={() => setSelectedMonth(item.yearMonth)}
                        className="mt-2 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                      >
                        <span>Inspect this month</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Guidelines & FAQ Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                HR Operator Protocol
              </h4>
            </div>

            <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-2 leading-relaxed">
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-500 font-bold">•</span>
                <span>Freeze should occur on or before the monthly salary cutoff date (e.g. 25th of the month).</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-500 font-bold">•</span>
                <span>Ensure all pending punch corrections and WFH requests are approved or rejected before freezing.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-500 font-bold">•</span>
                <span>Unlocking creates a security audit event visible to Super Admins and the audit log.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3.5">
              <div className={`p-3 rounded-2xl ${
                isLocked
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                  : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
              }`}>
                {isLocked ? <Unlock className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {isLocked ? 'Unlock Attendance Month?' : 'Freeze Attendance Month?'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Target Period: <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatYearMonth(selectedMonth)}</span>
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs space-y-2 text-slate-600 dark:text-slate-300">
              {isLocked ? (
                <p>
                  Unlocking will allow employees and supervisors to resume clock-ins, overrides, and correction submissions for{' '}
                  <span className="font-bold">{formatYearMonth(selectedMonth)}</span>. This may alter payroll figures if salary generation has already started.
                </p>
              ) : (
                <>
                  <p>
                    Freezing will immediately lock all <span className="font-bold">{metrics.totalRecords} attendance records</span> for{' '}
                    <span className="font-bold">{formatYearMonth(selectedMonth)}</span>.
                  </p>
                  {totalPending > 0 && (
                    <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-800 dark:text-amber-300 text-xs">
                      ⚠️ Warning: There are {totalPending} unreviewed requests remaining in this month.
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Confirm Audit Reason / Justification
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Required notes for audit record..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                disabled={isLocking || isUnlocking}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteToggle}
                disabled={isLocking || isUnlocking}
                className={`px-5 py-2 text-xs font-semibold rounded-xl text-white shadow-xs transition-colors ${
                  isLocked
                    ? 'bg-slate-800 hover:bg-slate-900'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {isLocking ? 'Freezing...' : isUnlocking ? 'Unlocking...' : isLocked ? 'Confirm Unlock' : 'Confirm Freeze'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

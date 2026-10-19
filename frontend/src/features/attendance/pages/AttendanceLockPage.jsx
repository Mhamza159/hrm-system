/**
 * @file AttendanceLockPage.jsx
 * @description Monthly Attendance Freezing & Payroll Lock Control Panel.
 * 
 * SPECIFICATION:
 * - Module: M5 Attendance & Shifts (BUILD-GUIDE Section 10 · Row 5.14)
 */

import React, { useState } from 'react';
import { Lock, Unlock, AlertTriangle, ShieldCheck, Calendar } from 'lucide-react';
import {
  useGetLockStatusQuery,
  useLockMonthMutation,
  useUnlockMonthMutation
} from '../attendanceApi.js';

export const AttendanceLockPage = () => {
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [notes, setNotes] = useState('');
  const [actionError, setActionError] = useState('');

  const { data, isLoading, refetch } = useGetLockStatusQuery(selectedMonth);
  const [lockMonth, { isLoading: isLocking }] = useLockMonthMutation();
  const [unlockMonth, { isLoading: isUnlocking }] = useUnlockMonthMutation();

  const lockInfo = data?.data;
  const isLocked = Boolean(lockInfo?.isLocked);

  const handleToggleLock = async () => {
    setActionError('');
    try {
      if (isLocked) {
        await unlockMonth({ yearMonth: selectedMonth, notes }).unwrap();
      } else {
        await lockMonth({ yearMonth: selectedMonth, notes }).unwrap();
      }
      refetch();
    } catch (err) {
      setActionError(err.data?.message || err.message || 'Operation failed');
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl">
          <Lock className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Pre-Payroll Attendance Lock
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Freeze monthly attendance records to protect payroll integrity and prevent unauthorized modifications.
          </p>
        </div>
      </div>

      {actionError && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl text-rose-700 dark:text-rose-300 text-sm flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Control Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Target Month to Inspect or Freeze
          </label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full sm:w-64 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {/* Lock Status Display */}
        <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl ${
                isLocked
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300'
                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300'
              }`}
            >
              {isLocked ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Status: {isLocked ? 'Frozen / Locked for Payroll' : 'Open / Unlocked for Mutations'}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isLocked
                  ? `Locked on ${new Date(lockInfo.lockedAt).toLocaleDateString()} by ${lockInfo.lockedBy?.name || 'Admin'}`
                  : 'Employees & Managers can still clock in, edit times, and submit corrections.'}
              </div>
            </div>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              isLocked
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
            }`}
          >
            {isLocked ? 'LOCKED' : 'ACTIVE'}
          </span>
        </div>

        {/* Optional Audit Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Audit Reason / Notes (Optional)
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. October 2026 payroll cycle initiated by Finance team..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {/* Action Button */}
        <div className="pt-2 flex items-center justify-end">
          <button
            onClick={handleToggleLock}
            disabled={isLocking || isUnlocking || isLoading}
            className={`px-6 py-2.5 text-sm font-semibold rounded-xl text-white shadow-sm flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 ${
              isLocked
                ? 'bg-slate-700 hover:bg-slate-800'
                : 'bg-amber-600 hover:bg-amber-700'
            }`}
          >
            {isLocked ? (
              <>
                <Unlock className="w-4 h-4" />
                <span>{isUnlocking ? 'Unlocking...' : 'Unlock Month (Permit Edits)'}</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>{isLocking ? 'Locking...' : 'Lock Month (Freeze Data)'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

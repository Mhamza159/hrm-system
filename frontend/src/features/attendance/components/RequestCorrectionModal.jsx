/**
 * @file RequestCorrectionModal.jsx
 * @description Modal for requesting missed-punch attendance rectification with strict temporal and shift constraints.
 * 
 * BUSINESS RULES:
 * 1. Only past dates within the current active month are eligible (min: 1st of current month, max: today).
 * 2. Coming / future dates are strictly blocked.
 * 3. Today cannot be requested if user is currently clocked in without having clocked out.
 */

import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, AlertCircle, AlertTriangle } from 'lucide-react';
import { useApplyCorrectionMutation } from '../attendanceApi.js';

export const RequestCorrectionModal = ({
  isOpen,
  onClose,
  defaultDate,
  isClockedInToday = false,
  isClockedOutToday = false,
  onSuccess
}) => {
  const now = new Date();
  const todayStr = now.toLocaleDateString('en-CA');
  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const firstDayOfMonth = `${currentYearMonth}-01`;

  // Default to provided defaultDate or todayStr (if eligible), else yesterday
  const [date, setDate] = useState(defaultDate || todayStr);
  const [checkInTime, setCheckInTime] = useState('09:00');
  const [checkOutTime, setCheckOutTime] = useState('18:00');
  const [reason, setReason] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Update date whenever modal opens or defaultDate changes
  useEffect(() => {
    if (defaultDate) {
      setDate(defaultDate);
    } else {
      setDate(todayStr);
    }
    setErrorMessage('');
  }, [defaultDate, isOpen, todayStr]);

  const [applyCorrection, { isLoading }] = useApplyCorrectionMutation();

  if (!isOpen) return null;

  // Active duty session constraint: cannot request today if clocked in and not clocked out
  const isTodayActiveSession = date === todayStr && isClockedInToday && !isClockedOutToday;
  const isFutureDate = date > todayStr;
  const isDifferentMonth = !date.startsWith(currentYearMonth);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (isFutureDate) {
      setErrorMessage('You cannot request punch corrections for future dates.');
      return;
    }

    if (isDifferentMonth) {
      setErrorMessage('Punch corrections are only permitted for the current active month.');
      return;
    }

    if (isTodayActiveSession) {
      setErrorMessage('Cannot request a missed punch for today while duty session is active. Please clock out first.');
      return;
    }

    if (!reason || reason.trim().length < 5) {
      setErrorMessage('Please provide a descriptive reason (at least 5 characters).');
      return;
    }

    try {
      const checkInIso = checkInTime ? new Date(`${date}T${checkInTime}:00`).toISOString() : null;
      const checkOutIso = checkOutTime ? new Date(`${date}T${checkOutTime}:00`).toISOString() : null;

      await applyCorrection({
        date,
        requestedCheckIn: checkInIso,
        requestedCheckOut: checkOutIso,
        reason: reason.trim()
      }).unwrap();

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setErrorMessage(err.data?.message || err.message || 'Failed to submit correction request');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            Request Missed Punch
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning if user selects today while session is active */}
        {isTodayActiveSession && (
          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-800 dark:text-amber-200 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold">Active Session in Progress:</strong> You have already clocked in today. You cannot request a missed punch for today until you clock out.
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="mt-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Date of Missed Punch
              </label>
              <span className="text-[11px] text-slate-400 font-mono">
                Current month only (up to today)
              </span>
            </div>
            <input
              type="date"
              value={date}
              min={firstDayOfMonth}
              max={todayStr}
              onChange={(e) => {
                setDate(e.target.value);
                setErrorMessage('');
              }}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Requested Check-In
              </label>
              <input
                type="time"
                value={checkInTime}
                onChange={(e) => setCheckInTime(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Requested Check-Out
              </label>
              <input
                type="time"
                value={checkOutTime}
                onChange={(e) => setCheckOutTime(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Reason / Explanation
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Biometric device was offline upon entry..."
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || isTodayActiveSession || isFutureDate || isDifferentMonth}
              className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-xs transition-colors"
            >
              {isLoading ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

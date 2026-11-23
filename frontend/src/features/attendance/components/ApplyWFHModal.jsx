/**
 * @file ApplyWFHModal.jsx
 * @description Modal dialog for applying for Work From Home (WFH).
 * 
 * SPECIFICATION (Phase 40):
 * - Module: M5 Attendance & Shifts (BUILD-GUIDE Section 10 · Row 5.8)
 * - Strict 1-Day-Before advance notice requirement: Same-day & past applications blocked.
 * - Standardized Elvara Forest theme tokens & centered modal styling.
 */

import React, { useState } from 'react';
import { X, Laptop, AlertCircle, Info } from 'lucide-react';
import { useApplyWFHMutation } from '../attendanceApi.js';

export const ApplyWFHModal = ({ isOpen, onClose, onSuccess }) => {
  const getTomorrowDateString = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toLocaleDateString('en-CA'); // 'YYYY-MM-DD'
  };

  const minDateStr = getTomorrowDateString();
  const [date, setDate] = useState(minDateStr);
  const [reason, setReason] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [applyWFH, { isLoading }] = useApplyWFHMutation();

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const minAllowed = getTomorrowDateString();
    if (!date || date < minAllowed) {
      setErrorMessage('WFH applications must be submitted at least one day before the requested date. Same-day applications are not allowed.');
      return;
    }

    if (!reason || reason.trim().length < 5) {
      setErrorMessage('Please provide a descriptive reason (at least 5 characters).');
      return;
    }

    try {
      await applyWFH({
        date,
        reason: reason.trim()
      }).unwrap();

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setErrorMessage(err.data?.message || err.message || 'Failed to submit WFH request');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/15 backdrop-blur-xs p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#111D17] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-[#1A3125] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-[#00C471] flex items-center justify-center">
              <Laptop className="w-4 h-4" />
            </div>
            Apply for Work From Home (WFH)
          </h3>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMessage && (
          <div className="mt-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Date for Remote Work
            </label>
            <input
              type="date"
              value={date}
              min={minDateStr}
              onChange={(e) => {
                setDate(e.target.value);
                setErrorMessage('');
              }}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50 dark:bg-[#0A110D] text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471] transition-all"
            />
            <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-amber-600 dark:text-amber-400">
              <Info className="w-3.5 h-3.5 shrink-0" />
              <span>Must apply at least 1 day in advance. Same-day requests are not allowed.</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Reason / Deliverables
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setErrorMessage('');
              }}
              placeholder="e.g. Focus on sprint deliverables / home internet setup / quiet environment..."
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50 dark:bg-[#0A110D] text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471] transition-all"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer border border-slate-200 dark:border-[#1A3125]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 text-xs font-bold text-white bg-[#00C471] hover:bg-[#00B065] disabled:opacity-50 rounded-xl shadow-sm transition-all cursor-pointer"
            >
              {isLoading ? 'Submitting...' : 'Submit WFH Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplyWFHModal;

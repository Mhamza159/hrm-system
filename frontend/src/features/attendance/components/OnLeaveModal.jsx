/**
 * @file OnLeaveModal.jsx
 * @description Modal displayed when an employee attempts to punch attendance while on approved leave.
 * Allows instant self-service cancellation to unlock attendance punch per company policy.
 * 
 * SPECIFICATION & THEME:
 * - Module: M5 Attendance & M6 Leaves
 * - Theme: ELVARA Forest & Emerald Design System (100% Light & Dark Mode Compatible)
 * - Reference: DESIGN.md & docs/UI-REFERENCE.md
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarClock,
  Calendar,
  FileText,
  X,
  ArrowRight,
  RefreshCw,
  ShieldAlert,
  CheckCircle2,
  Info,
  Tag
} from 'lucide-react';
import { useCancelLeaveMutation } from '../../leaves/leavesApi.js';
import { toast } from 'sonner';

export const OnLeaveModal = ({
  isOpen,
  onClose,
  leave,
  onLeaveCancelled
}) => {
  const navigate = useNavigate();
  const [cancelLeave, { isLoading: isCancelling }] = useCancelLeaveMutation();
  const [cancellationReason] = useState('Cancelled by employee to mark attendance');

  if (!isOpen || !leave) return null;

  const formatDate = (dateInput) => {
    if (!dateInput) return '';
    const d = new Date(dateInput);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleCancelLeave = async () => {
    try {
      await cancelLeave({
        id: leave._id,
        cancellationReason: cancellationReason.trim() || 'Cancelled by employee to mark attendance'
      }).unwrap();

      toast.success('Leave cancelled successfully! Attendance punch is now unlocked.');
      if (onLeaveCancelled) {
        onLeaveCancelled();
      }
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || err?.message || 'Failed to cancel leave. Please contact HR.');
    }
  };

  const isSameDay =
    leave.startDate &&
    leave.endDate &&
    new Date(leave.startDate).toDateString() === new Date(leave.endDate).toDateString();

  const leaveName = leave.leaveType?.name || leave.leaveType || 'Approved Leave';
  const leaveCode = leave.leaveTypeCode || leave.leaveTypeId?.code || null;
  const dateRangeDisplay = isSameDay
    ? formatDate(leave.startDate)
    : `${formatDate(leave.startDate)} – ${formatDate(leave.endDate)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 sm:p-7 space-y-5 animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Close"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Visual Badge Icon & Header */}
        <div className="text-center space-y-2.5 pt-1">
          <div className="w-13 h-13 mx-auto rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-2xs">
            <CalendarClock className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200/90 dark:border-amber-800/70 tracking-wider uppercase">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Approved Leave in Effect</span>
            </div>
            <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              You Are on Leave Today
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
              Attendance clock-in is locked to preserve your approved leave record and payroll balances.
            </p>
          </div>
        </div>

        {/* Leave Summary Details Card */}
        <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-3 text-xs">
          {/* Category */}
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/70 dark:border-slate-800/80">
            <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              <span>Leave Category</span>
            </span>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-800/60 px-2.5 py-0.5 rounded-md text-xs">
                {leaveName}
              </span>
              {leaveCode && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300 uppercase">
                  {leaveCode}
                </span>
              )}
            </div>
          </div>

          {/* Date Duration */}
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Date Duration</span>
            </span>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono tabular-nums">
                {dateRangeDisplay}
              </span>
              {Boolean(leave.days) && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  {leave.days}d
                </span>
              )}
            </div>
          </div>

          {/* Submitted Reason */}
          {leave.reason && (
            <div className="pt-2.5 border-t border-slate-200/70 dark:border-slate-800/80 space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3 h-3 text-slate-400" />
                <span>Submitted Reason</span>
              </span>
              <p className="text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900/90 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800 leading-relaxed italic">
                "{leave.reason}"
              </p>
            </div>
          )}
        </div>

        {/* Informative Guidance Callout */}
        <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-800/40 text-xs text-slate-600 dark:text-slate-300 leading-relaxed flex items-start gap-2.5">
          <Info className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5 text-xs">
            <p className="font-semibold text-emerald-900 dark:text-emerald-300">
              Reporting to work today?
            </p>
            <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
              If your plans changed and you reported to duty, you can cancel this leave now. Unused leave days will be immediately credited back to your balance, and attendance punch will unlock.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-1">
          <button
            type="button"
            onClick={handleCancelLeave}
            disabled={isCancelling}
            className="w-full py-2.5 px-4 rounded-xl font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 transition shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.99]"
          >
            {isCancelling ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Cancelling Leave & Restoring Quota...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Cancel Leave & Unlock Attendance Punch</span>
              </>
            )}
          </button>

          <div className="grid grid-cols-2 gap-2 pt-0.5">
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate('/leaves/my');
              }}
              className="py-2 px-3 rounded-xl font-semibold text-xs text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700/80 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>View My Leaves</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="py-2 px-3 rounded-xl font-semibold text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors flex items-center justify-center cursor-pointer"
            >
              Keep Leave (Close)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnLeaveModal;

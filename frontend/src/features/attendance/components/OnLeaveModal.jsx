/**
 * @file OnLeaveModal.jsx
 * @description Modal displayed when an employee attempts to punch attendance while on approved leave.
 * Allows instant self-service cancellation to unlock attendance punch per company policy.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarX2,
  Calendar,
  FileText,
  X,
  ArrowRight,
  RefreshCw,
  Palmtree,
  ShieldAlert,
  CheckCircle2
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
  const [cancellationReason, setCancellationReason] = useState('Cancelled by employee to mark attendance');

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-card text-card-foreground border border-border/80 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-7 space-y-5 animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60 transition cursor-pointer"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Visual Badge Icon */}
        <div className="text-center space-y-2 pt-1">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-500 shadow-inner">
            <Palmtree className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>APPROVED LEAVE IN EFFECT</span>
            </div>
            <h3 className="text-lg font-bold text-foreground">
              You Are on Leave Today
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
              Attendance clock-in is locked to preserve your approved leave record and payroll balances.
            </p>
          </div>
        </div>

        {/* Leave Summary Details Card */}
        <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-3 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-border/40">
            <span className="text-muted-foreground font-medium">Leave Category</span>
            <span className="font-semibold text-foreground bg-primary/10 text-primary px-2 py-0.5 rounded-md">
              {leave.leaveType || 'Approved Leave'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground font-medium flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground/80" />
              Date Duration
            </span>
            <span className="font-medium text-foreground">
              {isSameDay
                ? formatDate(leave.startDate)
                : `${formatDate(leave.startDate)} – ${formatDate(leave.endDate)}`}
              {leave.days ? ` (${leave.days}d)` : ''}
            </span>
          </div>

          {leave.reason && (
            <div className="pt-2 border-t border-border/40 space-y-1">
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <FileText className="w-3 h-3" />
                Submitted Reason:
              </span>
              <p className="text-xs text-foreground/90 italic bg-background/50 p-2 rounded-lg border border-border/30">
                "{leave.reason}"
              </p>
            </div>
          )}
        </div>

        {/* Policy Explanation Note */}
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300/90 leading-relaxed">
          <p>
            <strong>Did your plans change?</strong> If you came to work today, you can cancel this approved leave. Your leave days will be restored to your balance, and attendance punch will unlock immediately.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={handleCancelLeave}
            disabled={isCancelling}
            className="w-full py-3 px-4 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 transition shadow-md shadow-amber-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.98]"
          >
            {isCancelling ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Cancelling Leave & Restoring Quota...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Cancel Leave & Enable Attendance Punch</span>
              </>
            )}
          </button>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate('/leaves/my');
              }}
              className="py-2.5 px-3 rounded-xl font-semibold text-xs text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted border border-border/60 transition flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>View My Leaves</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-3 rounded-xl font-semibold text-xs text-muted-foreground hover:text-foreground bg-transparent hover:bg-muted/40 transition cursor-pointer"
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

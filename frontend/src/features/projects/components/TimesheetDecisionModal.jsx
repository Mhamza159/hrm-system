/**
 * @file TimesheetDecisionModal.jsx
 * @description Modal for managers to review, approve, or reject subordinate timesheet submissions with mandatory reason.
 * 
 * SPECIFICATION:
 * - Module: M22 Projects & Timesheets (BUILD-GUIDE Section 23 · Row 22.4)
 */

import React, { useState } from 'react';
import { X, CheckCircle2, XCircle, AlertTriangle, Clock, Briefcase, User, Loader2 } from 'lucide-react';
import { useDecideTimesheetMutation } from '../projectsApi.js';
import { toast } from 'sonner';

export const TimesheetDecisionModal = ({ isOpen, onClose, timesheet = null }) => {
  const [decideTimesheet, { isLoading }] = useDecideTimesheetMutation();
  const [decision, setDecision] = useState('approved');
  const [rejectionReason, setRejectionReason] = useState('');

  if (!isOpen || !timesheet) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (decision === 'rejected' && (!rejectionReason.trim() || rejectionReason.trim().length < 3)) {
      toast.error('Please enter a rejection reason (minimum 3 characters)');
      return;
    }

    try {
      await decideTimesheet({
        id: timesheet._id,
        decision,
        rejectionReason: decision === 'rejected' ? rejectionReason.trim() : undefined
      }).unwrap();

      toast.success(`Timesheet entry successfully ${decision}`);
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || `Failed to ${decision} timesheet`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-xl bg-card border border-border shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Review Timesheet Entry</h2>
              <p className="text-xs text-muted-foreground font-mono">
                Log Date: {new Date(timesheet.date).toLocaleDateString()}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Details */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-4 rounded-lg border border-border bg-muted/30 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1">
                <User className="h-3.5 w-3.5" /> Employee:
              </span>
              <span className="font-semibold text-foreground">
                {timesheet.employeeId?.name || 'Staff Member'} ({timesheet.employeeId?.employeeId || '-'})
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1">
                <Briefcase className="h-3.5 w-3.5" /> Project:
              </span>
              <span className="font-semibold text-primary font-mono">
                {timesheet.projectId?.code} - {timesheet.projectId?.name}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> Duration:
              </span>
              <span className="font-mono font-bold text-foreground">{timesheet.hours} Hours</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Classification:</span>
              <span className={timesheet.isBillable ? 'text-emerald-600 font-medium' : 'text-muted-foreground'}>
                {timesheet.isBillable ? 'Billable Client Time' : 'Non-Billable Internal'}
              </span>
            </div>

            <div className="pt-2 border-t border-border">
              <span className="text-muted-foreground block mb-1">Task Description:</span>
              <p className="text-foreground bg-background p-2.5 rounded border border-border/60 text-xs">
                {timesheet.taskDescription}
              </p>
            </div>
          </div>

          {/* Decision Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-foreground">Manager Action</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDecision('approved')}
                className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-sm font-medium transition ${
                  decision === 'approved'
                    ? 'border-emerald-600 bg-emerald-500/10 text-emerald-600 font-semibold'
                    : 'border-input bg-background text-muted-foreground hover:bg-muted'
                }`}
              >
                <CheckCircle2 className="h-4 w-4" />
                Approve & Lock
              </button>

              <button
                type="button"
                onClick={() => setDecision('rejected')}
                className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-sm font-medium transition ${
                  decision === 'rejected'
                    ? 'border-destructive bg-destructive/10 text-destructive font-semibold'
                    : 'border-input bg-background text-muted-foreground hover:bg-muted'
                }`}
              >
                <XCircle className="h-4 w-4" />
                Reject & Re-edit
              </button>
            </div>
          </div>

          {/* Mandatory Rejection Reason */}
          {decision === 'rejected' && (
            <div className="space-y-1.5 animate-in fade-in duration-150">
              <label className="block text-xs font-medium text-destructive flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" />
                Mandatory Rejection Comment *
              </label>
              <textarea
                required
                rows={3}
                placeholder="Explain what needs revision or why hours were declined..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full p-2.5 text-xs rounded-lg border border-destructive bg-background focus:outline-none focus:ring-2 focus:ring-destructive/20 focus:border-destructive transition"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-input bg-background text-foreground hover:bg-muted transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white transition disabled:opacity-50 ${
                decision === 'approved' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-destructive hover:bg-destructive/90'
              }`}
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirm {decision === 'approved' ? 'Approval' : 'Rejection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


/**
 * @file ChangeRequestDecisionModal.jsx
 * @description Guarded decision modal for Approve, Reject, and Return for Correction actions
 * with mandatory rationale capture and confirmation gates.
 * Strictly adheres to docs/UI-REFERENCE.md (Elvara Forest & Emerald Enterprise Craft).
 */

import React, { useState } from 'react';
import { toast } from 'sonner';
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  AlertTriangle,
  X,
  Loader2
} from 'lucide-react';

export function ChangeRequestDecisionModal({
  isOpen,
  onClose,
  request,
  actionType, // 'approve' | 'reject' | 'return'
  onConfirm,
  isLoading
}) {
  const [rationale, setRationale] = useState('');

  if (!isOpen || !request) return null;

  const isApprove = actionType === 'approve';
  const isReject = actionType === 'reject';
  const isReturn = actionType === 'return';

  const employee = request.employeeId || {};
  const empName = employee.name || 'Employee';

  const handleSubmit = (e) => {
    e.preventDefault();
    if ((isReject || isReturn) && (!rationale.trim() || rationale.trim().length < 3)) {
      toast.error(`Please provide a reason (minimum 3 characters) for ${isReject ? 'rejection' : 'returning the request'}`);
      return;
    }

    onConfirm({
      id: request._id,
      action: isApprove ? 'approved' : isReject ? 'rejected' : 'returned',
      rejectionReason: rationale.trim(),
      decisionReason: rationale.trim(),
      notes: rationale.trim()
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#111D17] rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-[#1A3125] p-6 space-y-4 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1A3125] pb-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl ${
                isApprove
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-[#00C471]'
                  : isReject
                  ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600'
                  : 'bg-purple-50 dark:bg-purple-950/60 text-purple-600'
              }`}
            >
              {isApprove && <CheckCircle2 className="w-5 h-5" />}
              {isReject && <XCircle className="w-5 h-5" />}
              {isReturn && <RotateCcw className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {isApprove && 'Approve Change Request'}
                {isReject && 'Reject Change Request'}
                {isReturn && 'Return Request for Revision'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Target: {empName} ({request.category})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Informational Banner */}
        {isApprove && (
          <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-xs text-emerald-800 dark:text-emerald-300 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#00C471]" /> Permanent Master Record Mutation
            </div>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
              Approving will immediately synchronize proposed changes into the official Employee database record and log an audit trail.
            </p>
          </div>
        )}

        {isReject && (
          <div className="p-3.5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 text-xs text-rose-800 dark:text-rose-300 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600" /> Request Rejection Notice
            </div>
            <p className="text-[11px] text-rose-700 dark:text-rose-400">
              The employee will be notified with your rejection explanation. The existing employee record will remain unaltered.
            </p>
          </div>
        )}

        {isReturn && (
          <div className="p-3.5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/40 text-xs text-purple-800 dark:text-purple-300 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <RotateCcw className="w-4 h-4 text-purple-600" /> Return for Employee Correction
            </div>
            <p className="text-[11px] text-purple-700 dark:text-purple-400">
              The request will be unlocked for the employee to edit, upload missing proof, and resubmit.
            </p>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {isApprove ? 'Reviewer Remarks (Optional)' : 'Reviewer Explanation & Rationale'}
              {!isApprove && <span className="text-rose-500"> *</span>}
            </label>
            <textarea
              rows={3}
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              placeholder={
                isApprove
                  ? 'Add any administrative remarks or verification notes...'
                  : isReject
                  ? 'Specify why this request was declined (e.g. invalid document)...'
                  : 'Instruct employee what needs to be revised before approval...'
              }
              className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50 dark:bg-[#0A110D] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-[#1A3125]">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || ((isReject || isReturn) && !rationale.trim())}
              className={`px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                isApprove
                  ? 'bg-[#00C471] hover:bg-[#00ad64]'
                  : isReject
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-purple-600 hover:bg-purple-700'
              }`}
            >
              {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {isApprove && 'Confirm & Apply Changes'}
              {isReject && 'Confirm Rejection'}
              {isReturn && 'Return to Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

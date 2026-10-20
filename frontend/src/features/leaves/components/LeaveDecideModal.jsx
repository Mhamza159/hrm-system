/**
 * @file LeaveDecideModal.jsx
 * @description Leave Approval/Rejection Decision Dialog (BUILD-GUIDE Row 6.7).
 * 
 * SPECIFICATION:
 * - Module: M6 Leave & Holidays
 * - Component: LeaveDecideModal
 * - Theme: Linear Dark Craft (#090A0F, #0F111A, #1E2235, #5E6AD2)
 */

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { X, CheckCircle2, XCircle, AlertCircle, FileText, User, Calendar } from 'lucide-react';
import { useDecideLeaveMutation } from '../leavesApi.js';
import { cn } from '../../../lib/utils.js';

export function LeaveDecideModal({ isOpen, onClose, leave, initialAction = 'approve' }) {
  const [action, setAction] = useState(initialAction);
  const [reason, setReason] = useState('');

  const [decideLeave, { isLoading }] = useDecideLeaveMutation();

  useEffect(() => {
    setAction(initialAction);
    setReason('');
  }, [initialAction, leave]);

  if (!isOpen || !leave) return null;

  const applicant = leave.employeeId || {};
  const leaveType = leave.leaveTypeId || {};
  const startStr = leave.startDate ? leave.startDate.split('T')[0] : '';
  const endStr = leave.endDate ? leave.endDate.split('T')[0] : '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (action === 'reject' && (!reason || reason.trim().length < 3)) {
      toast.error('Rejection reason is required (at least 3 characters).');
      return;
    }

    try {
      await decideLeave({
        id: leave._id,
        action,
        reason: reason.trim()
      }).unwrap();

      toast.success(
        action === 'approve'
          ? 'Leave request approved successfully.'
          : 'Leave request rejected.'
      );
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || err?.message || 'Failed to submit decision.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-2xl border border-[#1E2235] bg-[#0F111A] p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#1E2235]">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'w-9 h-9 rounded-xl border flex items-center justify-center',
                action === 'approve'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
              )}
            >
              {action === 'approve' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                {action === 'approve' ? 'Approve Leave Request' : 'Reject Leave Request'}
              </h2>
              <p className="text-xs text-slate-400">Step in approval workflow</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1E2235] transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Application Summary Card */}
        <div className="mt-4 rounded-xl border border-[#1E2235] bg-[#161926]/50 p-4 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Applicant:</span>
            <span className="font-semibold text-white">{applicant.name || 'Employee'} ({applicant.employeeCode || '—'})</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Leave Category:</span>
            <span className="font-semibold text-slate-200">{leaveType.name || 'Leave'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Window & Duration:</span>
            <span className="font-semibold text-[#5E6AD2]">
              {startStr === endStr ? startStr : `${startStr} → ${endStr}`} ({leave.days} day{leave.days > 1 ? 's' : ''})
            </span>
          </div>
          <div className="pt-2 border-t border-[#1E2235]/60">
            <span className="block text-[11px] text-slate-400 mb-1">Reason stated:</span>
            <p className="text-slate-300 italic bg-[#0F111A] p-2 rounded-lg border border-[#1E2235]/40">{leave.reason}</p>
          </div>
        </div>

        {/* Action Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Action Tabs */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setAction('approve')}
              className={cn(
                'py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center justify-center gap-1.5',
                action === 'approve'
                  ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400'
                  : 'bg-[#161926] border-[#1E2235] text-slate-400 hover:text-slate-200'
              )}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Approve</span>
            </button>
            <button
              type="button"
              onClick={() => setAction('reject')}
              className={cn(
                'py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center justify-center gap-1.5',
                action === 'reject'
                  ? 'bg-rose-500/15 border-rose-500 text-rose-400'
                  : 'bg-[#161926] border-[#1E2235] text-slate-400 hover:text-slate-200'
              )}
            >
              <XCircle className="w-4 h-4" />
              <span>Reject</span>
            </button>
          </div>

          {/* Comment / Reason Textarea */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {action === 'reject' ? 'Rejection Reason (Required)' : 'Supervisor Remarks (Optional)'}
              {action === 'reject' && <span className="text-rose-400"> *</span>}
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                action === 'reject'
                  ? 'Provide rationale for rejecting this leave request...'
                  : 'Add optional approval comments or work coverage notes...'
              }
              className="w-full bg-[#161926] border border-[#1E2235] text-white text-xs rounded-xl p-3 focus:outline-hidden focus:ring-2 focus:ring-[#5E6AD2]/30 resize-none"
              required={action === 'reject'}
            />
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1E2235]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#1E2235] text-slate-300 hover:bg-[#1E2235] text-xs font-semibold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                'px-5 py-2 rounded-xl text-white text-xs font-semibold shadow-lg transition-all cursor-pointer disabled:opacity-50',
                action === 'approve'
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
                  : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'
              )}
            >
              {isLoading ? 'Processing...' : action === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LeaveDecideModal;

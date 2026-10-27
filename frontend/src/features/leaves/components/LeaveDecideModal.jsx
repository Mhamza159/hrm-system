/**
 * @file LeaveDecideModal.jsx
 * @description Leave Approval/Rejection Decision Dialog with Applicant Audit Dossier (BUILD-GUIDE Row 6.7).
 * 
 * SPECIFICATION & FEATURES:
 * - Module: M6 Leave & Holidays
 * - Two-Stage Workflow: Mandatory Applicant History Audit (Leaves Balance + 30-Day Attendance Matrix) before Approval.
 * - Multi-Tier Transition: Disables buttons when Step 1 is finalized and transfers to Phase 2 (HR).
 * - Theme: ELVARA Emerald & Enterprise Slate Tokens (100% Light & Dark Mode Compatible).
 */

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  X,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  User,
  Calendar,
  Clock,
  Check,
  ShieldCheck,
  BarChart3,
  History,
  TrendingUp,
  Award
} from 'lucide-react';
import { useDecideLeaveMutation, useGetLeaveApplicantAuditQuery } from '../leavesApi.js';
import { cn } from '../../../lib/utils.js';

export function LeaveDecideModal({ isOpen, onClose, leave, initialAction = 'approve', onSuccess }) {
  const [activeTab, setActiveTab] = useState('audit'); // 'audit' | 'decision'
  const [action, setAction] = useState(initialAction);
  const [reason, setReason] = useState('');

  const [decideLeave, { isLoading }] = useDecideLeaveMutation();

  const { data: auditResponse, isLoading: isLoadingAudit } = useGetLeaveApplicantAuditQuery(leave?._id, {
    skip: !isOpen || !leave?._id
  });
  const audit = auditResponse?.data;

  useEffect(() => {
    setAction(initialAction);
    setReason('');
    setActiveTab('audit'); // Always start by showing the audit tab first
  }, [initialAction, leave, isOpen]);

  if (!isOpen || !leave) return null;

  const applicant = leave.employeeId || {};
  const leaveType = leave.leaveTypeId || {};
  const startStr = leave.startDate ? leave.startDate.split('T')[0] : '';
  const endStr = leave.endDate ? leave.endDate.split('T')[0] : '';

  const currentStep = (leave.approvalChain || []).find((s) => s.status === 'pending');
  const step1 = (leave.approvalChain || []).find((s) => s.step === 1);
  const isStep1Approved = step1?.status === 'approved';
  const isFinalStep = currentStep?.step === leave.approvalChain?.length;

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
          ? isFinalStep
            ? 'Leave request fully approved and attendance synced.'
            : 'Step 1 approved! Forwarded to HR Manager for Phase 2 review.'
          : 'Leave request rejected.'
      );
      if (typeof onSuccess === 'function') {
        onSuccess();
      }
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || err?.message || 'Failed to submit decision.');
    }
  };

  const attendanceStats = audit?.attendanceStats || {
    present: 0,
    late: 0,
    halfDay: 0,
    absent: 0,
    onLeave: 0,
    attendanceRate: 100
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'w-10 h-10 rounded-2xl border flex items-center justify-center',
                action === 'approve'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800'
              )}
            >
              {action === 'approve' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>{action === 'approve' ? 'Review & Approve Leave' : 'Review & Reject Leave'}</span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  Step {currentStep?.step || 1}: {currentStep?.approverRole || 'Approver'}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Audit applicant leaves & attendance history before submitting decision
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-4 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={cn(
              'flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5',
              activeTab === 'audit'
                ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            )}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>1. Applicant Audit (Leaves & Attendance)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('decision')}
            className={cn(
              'flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5',
              activeTab === 'decision'
                ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            )}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>2. Decision & Action</span>
          </button>
        </div>

        {/* Tab Content Container */}
        <div className="mt-4 flex-1 overflow-y-auto pr-1 space-y-4">
          {/* TAB 1: AUDIT DOSSIER */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              {/* Applicant Snapshot */}
              <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 p-4 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-sm">
                      {(applicant.name || 'EM').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">{applicant.name || 'Employee'}</h4>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                        Code: {applicant.employeeCode || '—'} · Dept: {audit?.employee?.department || 'General'} · Role: {audit?.employee?.designation || 'Staff'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Application Target:</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {leaveType.name || 'Leave'} ({leave.days} day{leave.days > 1 ? 's' : ''})
                    </span>
                  </div>
                </div>
              </div>

              {/* Attendance Matrix (Last 30 Days) */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <span>Attendance Record (Last 30 Days)</span>
                  </h4>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    {attendanceStats.attendanceRate}% Attendance Rate
                  </span>
                </div>

                {isLoadingAudit ? (
                  <div className="py-6 text-center text-xs text-slate-400 animate-pulse">Loading attendance audit...</div>
                ) : (
                  <>
                    <div className="grid grid-cols-5 gap-2 text-center text-xs">
                      <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40">
                        <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Present</span>
                        <span className="font-bold text-emerald-800 dark:text-emerald-200 text-sm">{attendanceStats.present}</span>
                      </div>
                      <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/40">
                        <span className="block text-[10px] text-amber-600 dark:text-amber-400 font-semibold">Late</span>
                        <span className="font-bold text-amber-800 dark:text-amber-200 text-sm">{attendanceStats.late}</span>
                      </div>
                      <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40">
                        <span className="block text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">Half Day</span>
                        <span className="font-bold text-indigo-800 dark:text-indigo-200 text-sm">{attendanceStats.halfDay}</span>
                      </div>
                      <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/40">
                        <span className="block text-[10px] text-rose-600 dark:text-rose-400 font-semibold">Absent</span>
                        <span className="font-bold text-rose-800 dark:text-rose-200 text-sm">{attendanceStats.absent}</span>
                      </div>
                      <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/40">
                        <span className="block text-[10px] text-purple-600 dark:text-purple-400 font-semibold">On Leave</span>
                        <span className="font-bold text-purple-800 dark:text-purple-200 text-sm">{attendanceStats.onLeave}</span>
                      </div>
                    </div>

                    {/* Recent Attendance Entries */}
                    {audit?.recentAttendance && audit.recentAttendance.length > 0 && (
                      <div className="mt-2 text-xs">
                        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                          Recent Log Entries:
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-24 overflow-y-auto">
                          {audit.recentAttendance.slice(0, 6).map((rec, i) => (
                            <div key={i} className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-[11px] flex items-center justify-between">
                              <span className="text-slate-600 dark:text-slate-300 font-mono">
                                {rec.date ? rec.date.split('T')[0] : '—'}
                              </span>
                              <span className={cn(
                                'text-[10px] font-bold px-1.5 py-0.2 rounded',
                                rec.status === 'present' && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
                                rec.status === 'late' && 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
                                rec.status === 'absent' && 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
                                rec.status === 'half_day' && 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
                                rec.status === 'on_leave' && 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                              )}>
                                {rec.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Leave Quota Matrix & Past Leaves */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span>Annual Quotas & Leave Balance</span>
                </h4>

                {isLoadingAudit ? (
                  <div className="py-4 text-center text-xs text-slate-400 animate-pulse">Loading quota audit...</div>
                ) : audit?.balances && audit.balances.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {audit.balances.map((b, idx) => {
                      const typeObj = b.leaveTypeId || {};
                      const isCurrentCategory = typeObj._id === leaveType._id;
                      const computedAvailable = b.availableDays ?? Math.max(
                        0,
                        (b.allocatedDays || 0) + (b.carriedForwardDays || 0) - (b.usedDays || 0) - (b.pendingDays || 0) - (b.encashedDays || 0)
                      );
                      return (
                        <div
                          key={idx}
                          className={cn(
                            'p-2.5 rounded-xl border transition-colors',
                            isCurrentCategory
                              ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
                              : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                          )}
                        >
                          <div className="flex items-center justify-between font-semibold">
                            <span className="text-slate-900 dark:text-white">
                              {typeObj.name || 'Leave'} {isCurrentCategory && '★'}
                            </span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                              {computedAvailable} available
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex justify-between">
                            <span>Allocated: {b.allocatedDays || 0}d</span>
                            <span>Used: {b.usedDays || 0}d</span>
                            <span>Pending: {b.pendingDays || 0}d</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">No explicit quota breakdown configured.</p>
                )}

                {/* Recent Leaves History */}
                {audit?.recentLeaves && audit.recentLeaves.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">
                      Recent Past Leave Applications:
                    </span>
                    <div className="space-y-1.5">
                      {audit.recentLeaves.map((rl) => (
                        <div key={rl._id} className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between text-[11px]">
                          <div>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{rl.leaveTypeId?.name || 'Leave'}</span>
                            <span className="text-slate-400 ml-2">
                              {rl.startDate ? rl.startDate.split('T')[0] : '—'} ({rl.days}d)
                            </span>
                          </div>
                          <span className={cn(
                            'text-[10px] font-bold px-2 py-0.5 rounded-full capitalize',
                            rl.status === 'approved' && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
                            rl.status === 'rejected' && 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
                            rl.status === 'pending' && 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                          )}>
                            {rl.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Proceed CTA */}
              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors cursor-pointer"
                >
                  Close Dossier
                </button>
                {leave.status === 'pending' ? (
                  <button
                    type="button"
                    onClick={() => setActiveTab('decision')}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>Audit Complete — Proceed to Decision</span>
                    <Check className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setActiveTab('decision')}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>View Decision Record</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: DECISION FORM / FINAL RECORD */}
          {activeTab === 'decision' && (
            <div className="space-y-4">
              {/* Application Summary Card */}
              <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 p-4 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Applicant:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {applicant.name || 'Employee'} ({applicant.employeeCode || '—'})
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Leave Category:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{leaveType.name || 'Leave'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Window & Duration:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {startStr === endStr ? startStr : `${startStr} → ${endStr}`} ({leave.days} day{leave.days > 1 ? 's' : ''})
                  </span>
                </div>
                {leave.reason && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60">
                    <span className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">Reason stated:</span>
                    <p className="text-slate-700 dark:text-slate-300 italic bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                      "{leave.reason}"
                    </p>
                  </div>
                )}
              </div>

              {/* If leave is already decided (approved/rejected/cancelled), show historical record banner */}
              {leave.status !== 'pending' ? (
                <div className="space-y-4">
                  <div
                    className={cn(
                      'p-4 rounded-2xl border flex items-start gap-3',
                      leave.status === 'approved' &&
                        'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300',
                      leave.status === 'rejected' &&
                        'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-300',
                      leave.status === 'cancelled' &&
                        'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-300'
                    )}
                  >
                    {leave.status === 'approved' ? (
                      <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <XCircle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400" />
                    )}
                    <div className="space-y-1 text-xs">
                      <div className="font-bold uppercase tracking-wider">Leave Record: {leave.status}</div>
                      {leave.decisionBy?.name && (
                        <div>
                          <span className="font-semibold">Decided by:</span> {leave.decisionBy.name}{' '}
                          {leave.decisionBy.email && `(${leave.decisionBy.email})`}
                        </div>
                      )}
                      {leave.decisionAt && (
                        <div>
                          <span className="font-semibold">Decision Date:</span>{' '}
                          {new Date(leave.decisionAt).toLocaleString()}
                        </div>
                      )}
                      {leave.decisionReason && (
                        <div>
                          <span className="font-semibold">Authorizer Note:</span> &ldquo;{leave.decisionReason}&rdquo;
                        </div>
                      )}
                      {leave.cancellationReason && (
                        <div>
                          <span className="font-semibold">Cancellation Reason:</span> &ldquo;{leave.cancellationReason}&rdquo;
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setActiveTab('audit')}
                      className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                    >
                      ← Back to Audit
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-5 py-2 text-xs font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 shadow-xs cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Status Alert if Step 1 is already approved */}
                  {isStep1Approved && currentStep?.step > 1 && (
                    <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2.5">
                      <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
                      <div>
                        <span className="font-bold block">Step 1 (Department Manager) Approved</span>
                        <span className="text-[11px] text-emerald-700/80 dark:text-emerald-400">
                          This leave application has successfully passed manager audit and is currently in Step 2 awaiting HR review.
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Decision Form */}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Action Switcher */}
                    <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl">
                      <button
                        type="button"
                        onClick={() => setAction('approve')}
                        className={cn(
                          'py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5',
                          action === 'approve'
                            ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        )}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Approve</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setAction('reject')}
                        className={cn(
                          'py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5',
                          action === 'reject'
                            ? 'bg-white dark:bg-slate-700 text-rose-700 dark:text-rose-300 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        )}
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                    </div>

                    {/* Decision Reason / Review Notes */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        {action === 'approve' ? 'Approval Notes (Optional)' : 'Rejection Reason (Mandatory)'}
                      </label>
                      <textarea
                        rows={3}
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder={
                          action === 'approve'
                            ? 'e.g. Audit verified. Attendance history and quota balance confirmed.'
                            : 'e.g. Critical project sprint in progress. Reschedule required.'
                        }
                        className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                        required={action === 'reject'}
                      />
                    </div>

                    {/* Action CTAs */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setActiveTab('audit')}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                  >
                    ← Back to Audit
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={isLoading}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className={cn(
                        'px-5 py-2 text-xs font-semibold rounded-xl text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50',
                        action === 'approve'
                          ? 'bg-emerald-600 hover:bg-emerald-700'
                          : 'bg-rose-600 hover:bg-rose-700'
                      )}
                    >
                      {isLoading
                        ? 'Submitting...'
                        : action === 'approve'
                        ? isFinalStep
                          ? 'Confirm Final Approval'
                          : 'Approve & Advance to HR'
                        : 'Confirm Rejection'}
                    </button>
                  </div>
                </div>
              </form>
            </>
          )}
        </div>
      )}
        </div>
      </div>
    </div>
  );
}

export default LeaveDecideModal;

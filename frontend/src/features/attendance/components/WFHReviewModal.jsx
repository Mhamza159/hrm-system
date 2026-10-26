/**
 * @file WFHReviewModal.jsx
 * @description Comprehensive Audit & Decision Modal for Reviewing Work-From-Home (WFH) Requests.
 * 
 * FEATURES:
 * 1. Applicant Profile (Avatar, Name, Department, Designation, Role).
 * 2. WFH Request Schedule & Advance Notice Days.
 * 3. Monthly WFH Usage & Quota Metrics (Approved WFH this month, pending requests).
 * 4. Assigned Shift & Work Schedule details.
 * 5. Applicant Reason & Justification callout.
 * 6. Monthly Attendance Track Record (Present, Late, Absent, Half Day, Leave counts & 7-day trend).
 * 7. Decision Controls: Reject (mandatory reason) & Approve (optional notes), or Audit log if already decided.
 */

import React, { useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  Home,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MessageSquare,
  ShieldCheck,
  UserCheck,
  CalendarDays,
  Building2,
  Briefcase,
  Check
} from 'lucide-react';
import {
  useGetWFHAuditContextQuery,
  useDecideWFHMutation
} from '../attendanceApi.js';

export const WFHReviewModal = ({
  isOpen,
  onClose,
  requestId,
  fallbackData = null,
  onSuccess
}) => {
  const [decisionReason, setDecisionReason] = useState('');
  const [actionError, setActionError] = useState('');
  const [confirmingReject, setConfirmingReject] = useState(false);

  // Fetch full audit context from backend
  const {
    data: contextResponse,
    isLoading: isContextLoading
  } = useGetWFHAuditContextQuery(requestId, {
    skip: !isOpen || !requestId
  });

  const [decideWFH, { isLoading: isDeciding }] = useDecideWFHMutation();

  if (!isOpen) return null;

  const auditData = contextResponse?.data || {};
  const wfh = auditData.wfh || fallbackData || {};
  const emp = auditData.employee || wfh.employeeId || {};
  const empName = emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || fallbackData?.employeeName || 'Employee';
  const isSuperAdmin = emp.employeeCode === 'EMP-000' || emp.role === 'Super Admin';
  const initials = empName
    .split(/\s+/)
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'EM';

  const shift = auditData.shift || null;
  const summary = auditData.monthSummary || { presentCount: 0, lateCount: 0, absentCount: 0, halfDayCount: 0, leaveCount: 0, wfhCount: 0 };
  const wfhStats = auditData.wfhStats || { approvedThisMonth: 0, pendingThisMonth: 0, totalThisMonth: 0 };
  const recentRecords = auditData.recentRecords || [];
  const existingAttendance = auditData.existingAttendance || null;

  const isAlreadyDecided = wfh.status === 'approved' || wfh.status === 'rejected';

  // Format date helper
  const formatDate = (isoString) => {
    if (!isoString) return '—';
    try {
      return new Date(isoString).toLocaleDateString('en-GB', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return '—';
    }
  };

  // Days in advance calculation
  let noticeDays = null;
  if (wfh.date && wfh.createdAt) {
    const target = new Date(wfh.date).setHours(0, 0, 0, 0);
    const applied = new Date(wfh.createdAt).setHours(0, 0, 0, 0);
    const diff = Math.round((target - applied) / (1000 * 60 * 60 * 24));
    noticeDays = diff;
  }

  // Handle Approve or Reject
  const handleDecision = async (decision) => {
    setActionError('');
    if (decision === 'rejected' && (!decisionReason || decisionReason.trim().length < 3)) {
      setActionError('Please provide a rejection reason (minimum 3 characters).');
      setConfirmingReject(true);
      return;
    }

    try {
      await decideWFH({
        id: requestId || wfh._id,
        decision,
        decisionReason: decisionReason.trim()
      }).unwrap();

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setActionError(err.data?.message || err.message || 'Action failed. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3 min-w-0">
            {emp.avatar || fallbackData?.avatar ? (
              <img
                src={emp.avatar || fallbackData?.avatar}
                alt={empName}
                className="w-12 h-12 rounded-2xl object-cover ring-2 ring-indigo-500/20 shadow-xs shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                {initials}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                  {empName}
                </h3>
                {isSuperAdmin && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-purple-600" />
                    Admin
                  </span>
                )}
                {wfh.status === 'approved' ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    Approved
                  </span>
                ) : wfh.status === 'rejected' ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 flex items-center gap-1">
                    <XCircle className="w-3 h-3 text-rose-500" />
                    Rejected
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                    Pending Verification
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                {emp.employeeCode ? `${emp.employeeCode} · ` : ''}
                {emp.designationId?.title || fallbackData?.designation || 'Team Member'} · {emp.departmentId?.name || fallbackData?.department || 'General'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto scrollbar-thin">
          
          {actionError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          {/* Target WFH Date Banner */}
          <div className="p-4 bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0">
                <Home className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700/80 dark:text-indigo-400 block">
                  Requested Work-From-Home Day
                </span>
                <span className="font-extrabold text-slate-900 dark:text-white text-base">
                  {formatDate(wfh.date)}
                </span>
              </div>
            </div>

            <div className="text-right text-xs">
              <span className="text-slate-500 dark:text-slate-400 block">
                Applied on {formatDate(wfh.createdAt)}
              </span>
              {noticeDays !== null && (
                <span className="font-bold text-indigo-700 dark:text-indigo-300 text-[11px]">
                  {noticeDays > 0 ? `${noticeDays} day(s) advance notice` : noticeDays === 0 ? 'Same day application' : 'Past date'}
                </span>
              )}
            </div>
          </div>

          {/* Dual Info Cards: Shift Details & Monthly WFH Frequency */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Shift & Work Schedule */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-2">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                <span>Assigned Shift & Hours</span>
              </span>
              <div className="font-bold text-slate-900 dark:text-white text-xs truncate">
                {shift?.name || 'Standard Office Shift'}
              </div>
              <div className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-300">
                {shift?.startTime && shift?.endTime ? `${shift.startTime} - ${shift.endTime}` : '09:00 - 18:00'}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Work Days: {Array.isArray(shift?.workDays) ? shift.workDays.join(', ') : 'Mon - Fri'}
              </div>
            </div>

            {/* WFH Monthly Usage Tracker */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-2">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                <Home className="w-3.5 h-3.5 text-indigo-600" />
                <span>WFH Frequency This Month</span>
              </span>
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-500">Approved WFH Days:</span>
                <span className="font-bold font-mono text-indigo-700 dark:text-indigo-300 text-sm">
                  {wfhStats.approvedThisMonth} day(s)
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Pending WFH Requests:</span>
                <span className="font-semibold font-mono text-amber-600 dark:text-amber-400">
                  {wfhStats.pendingThisMonth}
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                {wfhStats.approvedThisMonth > 4 ? '⚠️ High WFH frequency this month' : '✓ Normal remote work cadence'}
              </div>
            </div>
          </div>

          {/* Applicant Reason Callout */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
              <span>Applicant Justification / Reason</span>
            </div>
            <p className="text-xs text-slate-800 dark:text-slate-200 italic leading-relaxed">
              "{wfh.reason || 'No specific remarks provided by applicant.'}"
            </p>
          </div>

          {/* Monthly Attendance Track Record Context */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span>Monthly Attendance Track Record</span>
              </span>
              <span className="text-[11px] text-slate-400">
                {isContextLoading ? 'Loading metrics...' : `${summary.totalRecords || 0} active records this month`}
              </span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60">
                <div className="text-base font-bold text-emerald-700 dark:text-emerald-300">
                  {summary.presentCount}
                </div>
                <div className="text-[10px] font-semibold text-emerald-600/90 dark:text-emerald-400 uppercase">
                  Present
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/60">
                <div className="text-base font-bold text-indigo-700 dark:text-indigo-300">
                  {summary.wfhCount || 0}
                </div>
                <div className="text-[10px] font-semibold text-indigo-600/90 dark:text-indigo-400 uppercase">
                  WFH
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/60">
                <div className="text-base font-bold text-amber-700 dark:text-amber-300">
                  {summary.lateCount}
                </div>
                <div className="text-[10px] font-semibold text-amber-600/90 dark:text-amber-400 uppercase">
                  Late
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-800/60">
                <div className="text-base font-bold text-rose-700 dark:text-rose-300">
                  {summary.absentCount}
                </div>
                <div className="text-[10px] font-semibold text-rose-600/90 dark:text-rose-400 uppercase">
                  Absent
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-sky-50/70 dark:bg-sky-950/40 border border-sky-200/60 dark:border-sky-800/60 col-span-2 sm:col-span-1">
                <div className="text-base font-bold text-sky-700 dark:text-sky-300">
                  {summary.leaveCount || 0}
                </div>
                <div className="text-[10px] font-semibold text-sky-600/90 dark:text-sky-400 uppercase">
                  Leaves
                </div>
              </div>
            </div>

            {/* Recent 7 Days Trend */}
            {recentRecords.length > 0 && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-500 font-medium">Recent 7 Days:</span>
                <div className="flex items-center gap-1.5">
                  {recentRecords.map((r, i) => (
                    <div
                      key={i}
                      title={`${new Date(r.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}: ${r.isWFH ? 'WFH' : r.status}`}
                      className={`w-6 h-6 rounded-md text-[9px] font-bold flex items-center justify-center cursor-help ${
                        r.isWFH
                          ? 'bg-indigo-600 text-white'
                          : r.status === 'present'
                          ? 'bg-emerald-500 text-white'
                          : r.status === 'late' || r.isLate
                          ? 'bg-amber-400 text-slate-900'
                          : r.status === 'absent'
                          ? 'bg-rose-500 text-white'
                          : 'bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {r.isWFH ? 'W' : r.status === 'present' ? 'P' : r.status === 'late' || r.isLate ? 'L' : r.status === 'absent' ? 'A' : '—'}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Decision Audit Trail or Input */}
          {isAlreadyDecided ? (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span>Decision Audit Record</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300">
                <span className="font-semibold">
                  Decided By: {wfh.decisionBy?.name || 'Manager / HR'}
                </span>
                <span className="text-slate-400">
                  {formatDate(wfh.decisionAt || wfh.updatedAt)}
                </span>
              </div>
              {wfh.decisionReason && (
                <p className="text-xs text-slate-600 dark:text-slate-400 italic pt-1">
                  Remarks: "{wfh.decisionReason}"
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-1.5 pt-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                {confirmingReject ? 'Rejection Reason (Required)' : 'Review Remarks / Audit Notes (Optional)'}
              </label>
              <textarea
                rows={2}
                value={decisionReason}
                onChange={(e) => setDecisionReason(e.target.value)}
                placeholder={confirmingReject ? 'State reason for rejecting this WFH request...' : 'Add any notes for the employee record...'}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          )}
        </div>

        {/* Modal Footer / Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/30">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeciding}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            {isAlreadyDecided ? 'Close' : 'Cancel'}
          </button>

          {!isAlreadyDecided && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleDecision('rejected')}
                disabled={isDeciding}
                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Reject Request</span>
              </button>

              <button
                type="button"
                onClick={() => handleDecision('approved')}
                disabled={isDeciding}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {isDeciding ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve WFH</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

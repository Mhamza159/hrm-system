/**
 * @file PunchCorrectionReviewModal.jsx
 * @description Comprehensive Audit & Decision Modal for Reviewing Missed-Punch Correction Requests.
 * 
 * FEATURES:
 * 1. Applicant Profile (Avatar, Name, Department, Designation, Role).
 * 2. Visual Comparison: Assigned Shift vs Original Punch vs Requested Punch.
 * 3. Applicant Reason callout.
 * 4. Monthly Attendance Track Record (Present, Late, Absent counts & recent day indicators).
 * 5. Direct Action controls: Reject (mandatory reason) & Approve (optional notes).
 */

import React, { useState } from 'react';
import {
  X,
  Clock,
  LogIn,
  LogOut,
  Calendar,
  AlertCircle,
  CheckCircle2,
  XCircle,
  MessageSquare,
  ShieldCheck,
  Check,
  ArrowRight,
  UserCheck,
  CalendarDays
} from 'lucide-react';
import {
  useGetCorrectionAuditContextQuery,
  useDecideCorrectionMutation
} from '../attendanceApi.js';

export const PunchCorrectionReviewModal = ({
  isOpen,
  onClose,
  correctionId,
  fallbackData = null,
  onSuccess
}) => {
  const [decisionNotes, setDecisionNotes] = useState('');
  const [actionError, setActionError] = useState('');
  const [confirmingReject, setConfirmingReject] = useState(false);

  // Fetch complete audit context from backend
  const {
    data: contextResponse,
    isLoading: isContextLoading,
    refetch
  } = useGetCorrectionAuditContextQuery(correctionId, {
    skip: !isOpen || !correctionId
  });

  const [decideCorrection, { isLoading: isDeciding }] = useDecideCorrectionMutation();

  if (!isOpen) return null;

  const auditData = contextResponse?.data || {};
  const correction = auditData.correction || fallbackData || {};
  const emp = auditData.employee || correction.employeeId || {};
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
  const original = auditData.originalAttendance || null;
  const summary = auditData.monthSummary || { presentCount: 0, lateCount: 0, absentCount: 0, halfDayCount: 0 };
  const recentRecords = auditData.recentRecords || [];

  // Format timings helper
  const formatTime = (isoString) => {
    if (!isoString) return '—';
    try {
      return new Date(isoString).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '—';
    }
  };

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

  // Calculate requested duration
  let requestedDurationHrs = null;
  if (correction.requestedCheckIn && correction.requestedCheckOut) {
    const diffMs = new Date(correction.requestedCheckOut) - new Date(correction.requestedCheckIn);
    if (diffMs > 0) {
      requestedDurationHrs = (diffMs / (1000 * 60 * 60)).toFixed(1);
    }
  }

  // Handle Approve or Reject
  const handleDecision = async (decision) => {
    setActionError('');
    if (decision === 'rejected' && (!decisionNotes || decisionNotes.trim().length < 3)) {
      setActionError('Please provide a rejection reason (minimum 3 characters).');
      setConfirmingReject(true);
      return;
    }

    try {
      await decideCorrection({
        id: correctionId || correction._id,
        decision,
        decisionNotes: decisionNotes.trim()
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
                className="w-12 h-12 rounded-2xl object-cover ring-2 ring-emerald-500/20 shadow-xs shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
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
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                  Pending Verification
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
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

          {/* Missed Punch Target Date Banner */}
          <div className="p-3.5 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 rounded-2xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-semibold">
              <CalendarDays className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Target Missed Punch Date:</span>
            </div>
            <span className="font-bold text-slate-900 dark:text-white text-sm font-sans">
              {formatDate(correction.date)}
            </span>
          </div>

          {/* 1. Comparison Tri-Grid: Shift vs Original vs Requested */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              <span>Schedule & Punch Verification Comparison</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Assigned Shift */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-2">
                <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block">
                  1. Assigned Shift
                </span>
                <div className="font-bold text-slate-900 dark:text-white text-xs truncate">
                  {shift?.name || 'Standard Shift'}
                </div>
                <div className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-300">
                  {shift ? `${shift.startTime || '09:00'} - ${shift.endTime || '18:00'}` : '09:00 - 18:00'}
                </div>
                <div className="text-[10px] text-slate-400">
                  Grace: +{shift?.gracePeriodMinutes ?? 15} mins
                </div>
              </div>

              {/* Original Punch Record */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-2">
                <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block">
                  2. Original Record
                </span>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 text-[11px]">Check-In:</span>
                  <span className={`font-mono font-semibold ${original?.checkIn ? 'text-slate-800 dark:text-slate-200' : 'text-rose-500 italic text-[11px]'}`}>
                    {original?.checkIn ? formatTime(original.checkIn) : 'Missed'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 text-[11px]">Check-Out:</span>
                  <span className={`font-mono font-semibold ${original?.checkOut ? 'text-slate-800 dark:text-slate-200' : 'text-rose-500 italic text-[11px]'}`}>
                    {original?.checkOut ? formatTime(original.checkOut) : 'Missed'}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400">
                  Status: {original?.status ? original.status.toUpperCase() : 'NO PUNCH'}
                </div>
              </div>

              {/* Requested Rectification */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/60 space-y-2">
                <span className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400 tracking-wider block">
                  3. Requested Times
                </span>
                <div className="flex items-center justify-between text-xs font-mono font-bold">
                  <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                    <LogIn className="w-3 h-3" />
                    {formatTime(correction.requestedCheckIn || fallbackData?.requestedIn)}
                  </span>
                  <ArrowRight className="w-3 h-3 text-slate-400" />
                  <span className="inline-flex items-center gap-1 text-rose-700 dark:text-rose-400">
                    <LogOut className="w-3 h-3" />
                    {formatTime(correction.requestedCheckOut || fallbackData?.requestedOut)}
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-300 font-semibold">
                  {requestedDurationHrs ? `Duty: ~${requestedDurationHrs} Hours` : 'Single Punch Adjustment'}
                </div>
              </div>
            </div>
          </div>

          {/* 2. Applicant Reason Callout */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span>Applicant Justification / Reason</span>
            </div>
            <p className="text-xs text-slate-800 dark:text-slate-200 italic leading-relaxed">
              "{correction.reason || 'No specific remarks provided by applicant.'}"
            </p>
          </div>

          {/* 3. Monthly Attendance Track Record Context */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Monthly Track Record for Context</span>
              </span>
              <span className="text-[11px] text-slate-400">
                {isContextLoading ? 'Loading metrics...' : `${summary.totalRecords || 0} active records this month`}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2.5 text-center">
              <div className="p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60">
                <div className="text-base font-bold text-emerald-700 dark:text-emerald-300">
                  {summary.presentCount}
                </div>
                <div className="text-[10px] font-semibold text-emerald-600/90 dark:text-emerald-400 uppercase">
                  Present
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

              <div className="p-2.5 rounded-xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200/60 dark:border-purple-800/60">
                <div className="text-base font-bold text-purple-700 dark:text-purple-300">
                  {summary.halfDayCount || 0}
                </div>
                <div className="text-[10px] font-semibold text-purple-600/90 dark:text-purple-400 uppercase">
                  Half Day
                </div>
              </div>
            </div>

            {/* Recent Attendance Indicator Trend */}
            {recentRecords.length > 0 && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-500 font-medium">Recent 7 Days Trend:</span>
                <div className="flex items-center gap-1.5">
                  {recentRecords.map((r, i) => (
                    <div
                      key={i}
                      title={`${new Date(r.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}: ${r.status}`}
                      className={`w-5 h-5 rounded-md text-[9px] font-bold flex items-center justify-center cursor-help ${
                        r.status === 'present'
                          ? 'bg-emerald-500 text-white'
                          : r.status === 'late' || r.isLate
                          ? 'bg-amber-400 text-slate-900'
                          : r.status === 'absent'
                          ? 'bg-rose-500 text-white'
                          : 'bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {r.status === 'present' ? 'P' : r.status === 'late' || r.isLate ? 'L' : r.status === 'absent' ? 'A' : '—'}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 4. Decision Remarks / Notes Input */}
          <div className="space-y-1.5 pt-1">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              {confirmingReject ? 'Rejection Reason (Required)' : 'Review Remarks / Audit Notes (Optional)'}
            </label>
            <textarea
              rows={2}
              value={decisionNotes}
              onChange={(e) => setDecisionNotes(e.target.value)}
              placeholder={confirmingReject ? 'State reason for rejecting this punch correction...' : 'Add any notes for the employee record...'}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Modal Footer / Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/30">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeciding}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Cancel
          </button>

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
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Approve & Correct Punch</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

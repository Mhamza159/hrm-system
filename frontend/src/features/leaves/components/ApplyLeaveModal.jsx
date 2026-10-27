/**
 * @file ApplyLeaveModal.jsx
 * @description Leave Application Dialog with working days calculation & medical proof support (Rows 6.3, 6.4, 6.5).
 * 
 * SPECIFICATION & THEME:
 * - Module: M6 Leave & Holidays
 * - Component: ApplyLeaveModal
 * - Theme: ELVARA Emerald Design System (100% Light & Dark Mode Compatible)
 */

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { X, Calendar, Clock, AlertCircle, FileText, CheckCircle2, UploadCloud, ShieldCheck } from 'lucide-react';
import { useApplyLeaveMutation, useGetLeaveTypesQuery, useGetLeaveBalanceQuery } from '../leavesApi.js';
import { usePermission } from '../../../hooks/usePermission.js';
import { FileUpload } from '../../../components/common/FileUpload.jsx';
import { useGetMyAttendanceQuery } from '../../attendance/attendanceApi.js';
import { cn } from '../../../lib/utils.js';

export function ApplyLeaveModal({ isOpen, onClose }) {
  const { isSuperAdmin } = usePermission();
  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const todayStr = getTodayStr();

  const [leaveTypeId, setLeaveTypeId] = useState('');
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [halfDay, setHalfDay] = useState('none');
  const [reason, setReason] = useState('');
  const [attachmentFile, setAttachmentFile] = useState(null);

  const { data: typesResponse } = useGetLeaveTypesQuery({ activeOnly: 'true' });
  const leaveTypes = typesResponse?.data || [];

  const { data: balanceResponse } = useGetLeaveBalanceQuery({}, { skip: isSuperAdmin });
  const balances = balanceResponse?.data?.balances || [];

  const { data: attendanceData } = useGetMyAttendanceQuery({ date: todayStr });
  const todayRecord = attendanceData?.data?.records?.find(
    (r) => new Date(r.date).toISOString().split('T')[0] === todayStr
  );
  const hasPunchedToday = Boolean(todayRecord?.checkIn);

  const [applyLeave, { isLoading: isSubmitting }] = useApplyLeaveMutation();

  // Auto-suggest appropriate duration type if applying for today
  useEffect(() => {
    if (startDate === todayStr) {
      if (hasPunchedToday) {
        // Punched in today: only 2nd half is permitted
        if (halfDay !== 'second_half') {
          setHalfDay('second_half');
          setEndDate(todayStr);
        }
      } else {
        // Not punched in today: 1st half or full day permitted, not 2nd half
        if (halfDay === 'second_half') {
          setHalfDay('first_half');
          setEndDate(todayStr);
        }
      }
    }
  }, [startDate, todayStr, hasPunchedToday]);

  // Default to first active leave type if none selected
  useEffect(() => {
    if (leaveTypes.length > 0 && !leaveTypeId) {
      setLeaveTypeId(leaveTypes[0]._id);
    }
  }, [leaveTypes, leaveTypeId]);

  // If half-day is enabled, auto-sync endDate with startDate
  const handleStartDateChange = (val) => {
    setStartDate(val);
    if (halfDay !== 'none' || new Date(val) > new Date(endDate)) {
      setEndDate(val);
    }
  };

  const handleHalfDayChange = (val) => {
    setHalfDay(val);
    if (val !== 'none') {
      setEndDate(startDate);
    }
  };

  if (!isOpen) return null;

  const selectedType = leaveTypes.find((t) => t._id === leaveTypeId);
  const activeBalance = balances.find(
    (b) => b.leaveType?._id === leaveTypeId || b.leaveType === leaveTypeId
  );

  const availableDays = activeBalance?.availableDays ?? (selectedType?.daysPerYear || 0);

  // Client-side estimate of working days (Mon-Fri)
  const calculateEstimatedDays = () => {
    if (halfDay !== 'none') return 0.5;
    const s = new Date(startDate);
    const e = new Date(endDate);
    if (e < s) return 0;
    let count = 0;
    const cur = new Date(s);
    while (cur <= e) {
      const day = cur.getDay();
      if (day !== 0 && day !== 6) count++;
      cur.setDate(cur.getDate() + 1);
    }
    return count;
  };

  const estimatedDays = calculateEstimatedDays();
  const isOverQuota = selectedType?.isPaid && estimatedDays > availableDays;
  const requiresProof =
    selectedType?.requiresAttachment &&
    estimatedDays >= (selectedType?.minDaysForAttachment || 3);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (startDate < todayStr) {
      toast.error('Leave cannot be applied for past dates.');
      return;
    }

    if (startDate === todayStr) {
      if (halfDay === 'first_half' && hasPunchedToday) {
        toast.error('1st Half leave for today cannot be applied because you have already punched attendance.');
        return;
      }
      if (halfDay === 'second_half' && !hasPunchedToday) {
        toast.error('Cannot apply for 2nd Half leave today without punching attendance first. Please select 1st Half.');
        return;
      }
      if (halfDay === 'none' && hasPunchedToday) {
        toast.error('Full-day leave cannot be applied today because you have already punched attendance.');
        return;
      }
    }

    if (!reason.trim()) {
      toast.error('Reason for absence is required.');
      return;
    }

    if (isOverQuota) {
      toast.error(`Requested ${estimatedDays} days exceeds available quota (${availableDays} days).`);
      return;
    }

    if (requiresProof && !attachmentFile) {
      toast.error(`Medical certificate is mandatory for leaves of ${selectedType?.minDaysForAttachment || 3} days or more.`);
      return;
    }

    try {
      let body;
      if (attachmentFile) {
        body = new FormData();
        body.append('leaveTypeId', leaveTypeId);
        body.append('startDate', startDate);
        body.append('endDate', halfDay !== 'none' ? startDate : endDate);
        body.append('halfDay', halfDay);
        body.append('reason', reason.trim());
        body.append('attachment', attachmentFile);
      } else {
        body = {
          leaveTypeId,
          startDate,
          endDate: halfDay !== 'none' ? startDate : endDate,
          halfDay,
          reason: reason.trim()
        };
      }

      await applyLeave(body).unwrap();
      toast.success('Leave application submitted successfully for supervisor approval.');
      onClose();
      // Reset form
      setReason('');
      setAttachmentFile(null);
      setHalfDay('none');
    } catch (err) {
      toast.error(err?.data?.message || err?.message || 'Failed to submit leave application.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Apply for Time Off</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isSuperAdmin
                  ? 'Executive management privilege status'
                  : 'Submit a formal leave request against your active annual quota'}
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

        {/* Super Admin Exemption State */}
        {isSuperAdmin ? (
          <div className="mt-5 space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs text-slate-700 dark:text-slate-300 space-y-2">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-sm">
                <ShieldCheck className="w-4 h-4" />
                <span>Super Admin Exemption Active</span>
              </div>
              <p className="leading-relaxed">
                As the Super Admin / Business Owner, your profile is exempt from submitting employee leave applications and undergoing supervisor approval chains. Your schedule and availability are self-governed.
              </p>
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          /* Form Body */
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {/* Leave Type Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Leave Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={leaveTypeId}
                onChange={(e) => setLeaveTypeId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                required
              >
                {leaveTypes.map((type) => {
                  const bal = balances.find(
                    (b) => b.leaveType?._id === type._id || b.leaveType === type._id
                  );
                  const rem = bal ? bal.availableDays : type.daysPerYear;
                  return (
                    <option key={type._id} value={type._id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                      {type.name} ({type.code}) — {rem} days available
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Half-Day Radio Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Duration Type</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'none', label: 'Full Day', disabled: startDate === todayStr && hasPunchedToday },
                  { id: 'first_half', label: '1st Half', disabled: startDate === todayStr && hasPunchedToday },
                  { id: 'second_half', label: '2nd Half', disabled: startDate === todayStr && !hasPunchedToday }
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={opt.disabled}
                    onClick={() => !opt.disabled && handleHalfDayChange(opt.id)}
                    className={cn(
                      'py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer text-center',
                      halfDay === opt.id
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold'
                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white',
                      opt.disabled && 'opacity-40 cursor-not-allowed hover:text-slate-600 dark:hover:text-slate-400'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Range Inputs */}
            <div className="space-y-1.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    {halfDay === 'none' ? 'Start Date' : 'Leave Date'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    min={todayStr}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                {halfDay === 'none' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      End Date <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      min={startDate && startDate > todayStr ? startDate : todayStr}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>
                )}
              </div>
              {startDate === todayStr ? (
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {hasPunchedToday
                      ? 'Attendance punched today: You can apply for 2nd Half leave (subject to shift midday cutoff).'
                      : 'Not punched in today: You can apply for 1st Half leave (or full day). 2nd Half is not available.'}
                  </span>
                </p>
              ) : (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Leaves can be applied for current day (with attendance checks) and future dates. Past dates are blocked.</span>
                </p>
              )}
            </div>

            {/* Working Days & Balance Estimation Callout */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-3.5 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-500 dark:text-slate-400">Deductible Working Days:</span>
                <span className="font-bold text-slate-900 dark:text-white ml-2">{estimatedDays} day(s)</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Remaining Balance:</span>
                <span
                  className={cn(
                    'font-bold ml-2',
                    isOverQuota ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                  )}
                >
                  {availableDays} day(s)
                </span>
              </div>
            </div>

            {isOverQuota && (
              <div className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/20 p-3 flex items-center gap-2 text-rose-700 dark:text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>Requested days ({estimatedDays}) exceed your remaining available balance ({availableDays}).</span>
              </div>
            )}

            {/* Reason Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Reason for Absence <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Attending urgent family matter / recovering from medical illness..."
                className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                required
              />
            </div>

            {/* Conditional Medical Certificate Upload (Row 6.5) */}
            {requiresProof && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Medical Proof / Certificate</span>
                  <span className="text-amber-600 dark:text-amber-400 text-[11px] font-semibold">
                    Mandatory for &ge; 3 days
                  </span>
                </label>
                <FileUpload
                  label="Attach Doctor's Prescription or Medical Note (PDF/JPG)"
                  accept=".pdf,.png,.jpg,.jpeg"
                  maxSizeMb={5}
                  onFileSelect={(file) => setAttachmentFile(file)}
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isOverQuota}
                className="px-5 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white shadow-xs transition-colors cursor-pointer"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Leave Application'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default ApplyLeaveModal;

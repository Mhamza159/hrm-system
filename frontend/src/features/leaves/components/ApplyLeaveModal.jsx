/**
 * @file ApplyLeaveModal.jsx
 * @description Leave Application Dialog with working days calculation & medical proof support (Rows 6.3, 6.4, 6.5).
 * 
 * SPECIFICATION:
 * - Module: M6 Leave & Holidays
 * - Component: ApplyLeaveModal
 * - Theme: Linear Dark Craft (#090A0F, #0F111A, #1E2235, #5E6AD2)
 */

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { X, Calendar, Clock, AlertCircle, FileText, CheckCircle2, UploadCloud } from 'lucide-react';
import { useApplyLeaveMutation, useGetLeaveTypesQuery, useGetLeaveBalanceQuery } from '../leavesApi.js';
import { FileUpload } from '../../../components/common/FileUpload.jsx';
import { cn } from '../../../lib/utils.js';

export function ApplyLeaveModal({ isOpen, onClose }) {
  const todayStr = new Date().toISOString().split('T')[0];

  const [leaveTypeId, setLeaveTypeId] = useState('');
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [halfDay, setHalfDay] = useState('none');
  const [reason, setReason] = useState('');
  const [attachmentFile, setAttachmentFile] = useState(null);

  const { data: typesResponse } = useGetLeaveTypesQuery({ activeOnly: 'true' });
  const leaveTypes = typesResponse?.data || [];

  const { data: balanceResponse } = useGetLeaveBalanceQuery({});
  const balances = balanceResponse?.data?.balances || [];

  const [applyLeave, { isLoading: isSubmitting }] = useApplyLeaveMutation();

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
  const isOverQuota = estimatedDays > availableDays;
  const requiresProof = selectedType?.requiresAttachment && estimatedDays >= (selectedType?.minDaysForAttachment || 3);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason || reason.trim().length < 5) {
      toast.error('Please provide a detailed reason (at least 5 characters).');
      return;
    }

    if (requiresProof && !attachmentFile) {
      toast.error(`Medical certificate is required for ${selectedType?.name} of ${estimatedDays} days.`);
      return;
    }

    try {
      let body;
      if (attachmentFile) {
        const formData = new FormData();
        formData.append('leaveTypeId', leaveTypeId);
        formData.append('startDate', startDate);
        formData.append('endDate', halfDay !== 'none' ? startDate : endDate);
        formData.append('halfDay', halfDay);
        formData.append('reason', reason.trim());
        formData.append('attachment', attachmentFile);
        body = formData;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-2xl border border-[#1E2235] bg-[#0F111A] p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#1E2235]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#5E6AD2]/10 border border-[#5E6AD2]/20 flex items-center justify-center text-[#5E6AD2]">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Apply for Leave</h2>
              <p className="text-xs text-slate-400">Submit a time-off application against your active annual quota</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1E2235] transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Leave Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Leave Category <span className="text-rose-400">*</span>
            </label>
            <select
              value={leaveTypeId}
              onChange={(e) => setLeaveTypeId(e.target.value)}
              className="w-full bg-[#161926] border border-[#1E2235] text-white text-xs font-medium rounded-xl px-3 py-2.5 hover:border-[#5E6AD2] focus:outline-hidden focus:ring-2 focus:ring-[#5E6AD2]/30 transition-all cursor-pointer"
              required
            >
              {leaveTypes.map((type) => {
                const bal = balances.find(
                  (b) => b.leaveType?._id === type._id || b.leaveType === type._id
                );
                const rem = bal ? bal.availableDays : type.daysPerYear;
                return (
                  <option key={type._id} value={type._id} className="bg-[#0F111A] text-white">
                    {type.name} ({type.code}) — {rem} days available
                  </option>
                );
              })}
            </select>
          </div>

          {/* Half-Day Radio Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Duration Type</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'none', label: 'Full Day' },
                { id: 'first_half', label: '1st Half (Morning)' },
                { id: 'second_half', label: '2nd Half (Afternoon)' }
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleHalfDayChange(opt.id)}
                  className={cn(
                    'py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer text-center',
                    halfDay === opt.id
                      ? 'bg-[#5E6AD2]/15 border-[#5E6AD2] text-white'
                      : 'bg-[#161926] border-[#1E2235] text-slate-400 hover:text-slate-200'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range Inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {halfDay === 'none' ? 'Start Date' : 'Leave Date'} <span className="text-rose-400">*</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className="w-full bg-[#161926] border border-[#1E2235] text-white text-xs rounded-xl px-3 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-[#5E6AD2]/30"
                required
              />
            </div>

            {halfDay === 'none' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  End Date <span className="text-rose-400">*</span>
                </label>
                <input
                  type="date"
                  value={endDate}
                  min={startDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-[#161926] border border-[#1E2235] text-white text-xs rounded-xl px-3 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-[#5E6AD2]/30"
                  required
                />
              </div>
            )}
          </div>

          {/* Working Days & Balance Estimation Callout */}
          <div className="rounded-xl border border-[#1E2235] bg-[#161926]/50 p-3.5 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-400">Deductible Working Days:</span>
              <span className="font-bold text-white ml-2">{estimatedDays} day(s)</span>
            </div>
            <div>
              <span className="text-slate-400">Remaining Balance:</span>
              <span
                className={cn(
                  'font-bold ml-2',
                  isOverQuota ? 'text-rose-400' : 'text-emerald-400'
                )}
              >
                {availableDays} day(s)
              </span>
            </div>
          </div>

          {isOverQuota && (
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 flex items-center gap-2 text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Requested days ({estimatedDays}) exceed your remaining available balance ({availableDays}).</span>
            </div>
          )}

          {/* Reason Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Reason for Absence <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Attending urgent family matter / recovering from flu..."
              className="w-full bg-[#161926] border border-[#1E2235] text-white text-xs rounded-xl p-3 focus:outline-hidden focus:ring-2 focus:ring-[#5E6AD2]/30 resize-none"
              required
            />
          </div>

          {/* Conditional Medical Certificate Upload (Row 6.5) */}
          {requiresProof && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Medical Proof / Certificate</span>
                <span className="text-amber-400 text-[11px]">Mandatory for &gt;= 3 days</span>
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
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1E2235]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[#1E2235] text-slate-300 hover:bg-[#1E2235] text-xs font-semibold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isOverQuota}
              className="px-5 py-2.5 rounded-xl bg-[#5E6AD2] hover:bg-[#4E5AC0] disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-[#5E6AD2]/20 hover:shadow-[#5E6AD2]/40 transition-all cursor-pointer"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ApplyLeaveModal;

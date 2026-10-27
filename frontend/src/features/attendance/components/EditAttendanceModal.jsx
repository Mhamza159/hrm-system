/**
 * @file EditAttendanceModal.jsx
 * @description HR Admin Attendance Manual Override Modal with Mandatory Audit Reason & History.
 * 
 * SPECIFICATION:
 * - Module: M5 Attendance & Shifts (BUILD-GUIDE Section 10 · Row 5.11)
 */

import React, { useState } from 'react';
import { X, Edit3, History, AlertCircle, TrendingUp } from 'lucide-react';
import { useUpdateAttendanceMutation } from '../attendanceApi.js';

export const EditAttendanceModal = ({ isOpen, onClose, attendance, onSuccess }) => {
  if (!isOpen || !attendance) return null;

  const initialDateStr = attendance.date ? new Date(attendance.date).toISOString().split('T')[0] : '';
  const initialCheckIn = attendance.checkIn
    ? new Date(attendance.checkIn).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    : '';
  const initialCheckOut = attendance.checkOut
    ? new Date(attendance.checkOut).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    : '';

  const [checkInTime, setCheckInTime] = useState(initialCheckIn);
  const [checkOutTime, setCheckOutTime] = useState(initialCheckOut);
  const [status, setStatus] = useState(attendance.status || 'present');
  const [overtimeApproved, setOvertimeApproved] = useState(!!attendance.overtimeApproved);
  const [overrideReason, setOverrideReason] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Sync state if a different attendance item is selected
  React.useEffect(() => {
    if (attendance) {
      setCheckInTime(
        attendance.checkIn
          ? new Date(attendance.checkIn).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
          : ''
      );
      setCheckOutTime(
        attendance.checkOut
          ? new Date(attendance.checkOut).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
          : ''
      );
      setStatus(attendance.status || 'present');
      setOvertimeApproved(!!attendance.overtimeApproved);
      setOverrideReason('');
      setErrorMessage('');
    }
  }, [attendance]);

  const [updateAttendance, { isLoading }] = useUpdateAttendanceMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!overrideReason || overrideReason.trim().length < 5) {
      setErrorMessage('A detailed override reason of at least 5 characters is mandatory for auditing.');
      return;
    }

    try {
      const checkInIso = checkInTime ? new Date(`${initialDateStr}T${checkInTime}:00`).toISOString() : null;
      const checkOutIso = checkOutTime ? new Date(`${initialDateStr}T${checkOutTime}:00`).toISOString() : null;

      await updateAttendance({
        id: attendance._id,
        checkIn: checkInIso,
        checkOut: checkOutIso,
        status,
        overtimeApproved,
        overrideReason: overrideReason.trim()
      }).unwrap();

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setErrorMessage(err.data?.message || err.message || 'Failed to update attendance record');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-amber-600" />
            Manual Attendance Override
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="mt-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
          <div>
            <span className="font-semibold">Record Date:</span> {initialDateStr}
          </div>
          <div>
            <span className="font-semibold">Source:</span> {attendance.source}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Check-In Time
              </label>
              <input
                type="time"
                value={checkInTime}
                onChange={(e) => setCheckInTime(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Check-Out Time
              </label>
              <input
                type="time"
                value={checkOutTime}
                onChange={(e) => setCheckOutTime(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Attendance Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="present">Present</option>
              <option value="late">Late</option>
              <option value="half_day">Half Day</option>
              <option value="absent">Absent</option>
              <option value="on_leave">On Leave</option>
              <option value="holiday">Holiday</option>
            </select>
          </div>

          {/* Overtime Approval Toggle */}
          {attendance.overtimeMinutes > 0 && (
            <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  Overtime ({(attendance.overtimeMinutes / 60).toFixed(1)} hrs)
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Include overtime in payroll 1.5x formula calculation
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={overtimeApproved}
                  onChange={(e) => setOvertimeApproved(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-600"></div>
              </label>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Mandatory Override Reason *
            </label>
            <textarea
              rows={3}
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              placeholder="e.g. Employee card reader malfunction verified via building CCTV log..."
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Audit Trail Drawer Toggle */}
          {attendance.auditLogs?.length > 0 && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowHistory(!showHistory)}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1.5 hover:underline"
              >
                <History className="w-3.5 h-3.5" />
                <span>{showHistory ? 'Hide Audit Log History' : `View Prior Modifications (${attendance.auditLogs.length})`}</span>
              </button>

              {showHistory && (
                <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-2 border border-slate-200 dark:border-slate-800 text-xs">
                  {attendance.auditLogs.map((log, idx) => (
                    <div key={idx} className="pb-2 border-b border-slate-200 dark:border-slate-700 last:border-0 last:pb-0">
                      <div className="flex justify-between text-slate-400 font-mono text-[10px]">
                        <span>{new Date(log.modifiedAt).toLocaleString()}</span>
                        <span>Reason: {log.reason}</span>
                      </div>
                      <div className="text-slate-600 dark:text-slate-300 mt-0.5">
                        Status: <span className="font-semibold">{log.previousValues?.status}</span> → <span className="font-semibold text-amber-600">{log.newValues?.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 rounded-xl shadow-sm"
            >
              {isLoading ? 'Saving Override...' : 'Commit Override'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

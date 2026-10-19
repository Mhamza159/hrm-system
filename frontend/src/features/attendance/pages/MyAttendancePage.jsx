/**
 * @file MyAttendancePage.jsx
 * @description Monthly Color-Coded Attendance Calendar & Self-Service Portal.
 * 
 * SPECIFICATION:
 * - Module: M5 Attendance & Shifts (BUILD-GUIDE Section 10 · Row 5.9)
 */

import React, { useState } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Laptop,
  Lock,
  FileEdit,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { useGetMyAttendanceQuery } from '../attendanceApi.js';
import { PunchCardWidget } from '../components/PunchCardWidget.jsx';
import { AttendanceStatusBadge } from '../components/AttendanceStatusBadge.jsx';
import { RequestCorrectionModal } from '../components/RequestCorrectionModal.jsx';
import { ApplyWFHModal } from '../components/ApplyWFHModal.jsx';

export const MyAttendancePage = () => {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(
    `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
  );

  const [correctionModalOpen, setCorrectionModalOpen] = useState(false);
  const [selectedDateForCorrection, setSelectedDateForCorrection] = useState('');
  const [wfhModalOpen, setWfhModalOpen] = useState(false);

  const { data, isLoading, refetch } = useGetMyAttendanceQuery({ month: selectedMonth });

  const summary = data?.data?.summary || {
    totalDays: 0,
    presentCount: 0,
    lateCount: 0,
    halfDayCount: 0,
    absentCount: 0,
    leaveCount: 0,
    totalWorkHours: 0,
    totalOvertimeHours: 0
  };

  const isMonthLocked = data?.data?.isMonthLocked || false;
  const records = data?.data?.records || [];

  // Map records by YYYY-MM-DD
  const recordMap = new Map();
  records.forEach((r) => {
    const dStr = new Date(r.date).toISOString().split('T')[0];
    recordMap.set(dStr, r);
  });

  // Generate calendar days for selected month
  const [yearStr, monthStr] = selectedMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const daysInMonth = new Date(year, month, 0).getDate();

  const handlePrevMonth = () => {
    const d = new Date(year, month - 2, 1);
    setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    const d = new Date(year, month, 1);
    setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const daysList = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayObj = new Date(year, month - 1, day);
    daysList.push({
      dateStr,
      dayNum: day,
      dayName: dayObj.toLocaleDateString('en-US', { weekday: 'short' }),
      record: recordMap.get(dateStr)
    });
  }

  return (
    <div className="space-y-6">
      {/* Top Banner: Digital Punch Card Widget */}
      <PunchCardWidget onActionSuccess={refetch} />

      {/* Month Lock Banner */}
      {isMonthLocked && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3 text-amber-800 dark:text-amber-200 text-sm font-medium">
            <Lock className="w-5 h-5 text-amber-600 shrink-0" />
            <span>
              Attendance for <strong className="font-bold">{selectedMonth}</strong> has been locked for payroll calculation. New clock-ins, corrections, or edits are frozen.
            </span>
          </div>
        </div>
      )}

      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              My Attendance Calendar
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Inspect monthly hours, clock-in times, tardiness records, and punch corrections.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setWfhModalOpen(true)}
            disabled={isMonthLocked}
            className="px-4 py-2 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <Laptop className="w-4 h-4" />
            <span>Apply WFH</span>
          </button>
          <button
            onClick={() => {
              setSelectedDateForCorrection(new Date().toISOString().split('T')[0]);
              setCorrectionModalOpen(true);
            }}
            disabled={isMonthLocked}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
          >
            <FileEdit className="w-4 h-4" />
            <span>Request Missed Punch</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Present</div>
          <div className="text-2xl font-extrabold text-emerald-600">{summary.presentCount}</div>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Late</div>
          <div className="text-2xl font-extrabold text-amber-600">{summary.lateCount}</div>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Half Day</div>
          <div className="text-2xl font-extrabold text-purple-600">{summary.halfDayCount}</div>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Absent</div>
          <div className="text-2xl font-extrabold text-rose-600">{summary.absentCount}</div>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Leaves/Off</div>
          <div className="text-2xl font-extrabold text-sky-600">{summary.leaveCount}</div>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Work Hours</div>
          <div className="text-2xl font-extrabold text-blue-600">{summary.totalWorkHours}h</div>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Overtime</div>
          <div className="text-2xl font-extrabold text-indigo-600">{summary.totalOvertimeHours}h</div>
        </div>
      </div>

      {/* Month Navigator Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between">
        <button
          onClick={handlePrevMonth}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="text-base font-bold text-slate-800 dark:text-slate-200 font-mono">
          {new Date(`${selectedMonth}-01`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </div>

        <button
          onClick={handleNextMonth}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
        {daysList.map((item) => {
          const rec = item.record;
          const isWeekend = item.dayName === 'Sat' || item.dayName === 'Sun';

          return (
            <div
              key={item.dateStr}
              onClick={() => {
                if (!isMonthLocked) {
                  setSelectedDateForCorrection(item.dateStr);
                  setCorrectionModalOpen(true);
                }
              }}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer hover:shadow-md ${
                rec?.status === 'present'
                  ? 'border-emerald-200 bg-emerald-50/30 dark:border-emerald-900/40 dark:bg-emerald-950/20'
                  : rec?.status === 'late'
                  ? 'border-amber-200 bg-amber-50/30 dark:border-amber-900/40 dark:bg-amber-950/20'
                  : rec?.status === 'half_day'
                  ? 'border-purple-200 bg-purple-50/30 dark:border-purple-900/40 dark:bg-purple-950/20'
                  : rec?.status === 'absent'
                  ? 'border-rose-200 bg-rose-50/30 dark:border-rose-900/40 dark:bg-rose-950/20'
                  : isWeekend
                  ? 'border-slate-200/60 bg-slate-50/40 dark:border-slate-800/40 dark:bg-slate-900/30 opacity-70'
                  : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-800 dark:text-slate-100 text-base">
                  {item.dayNum}
                </span>
                <span className="text-xs font-semibold text-slate-400 uppercase">
                  {item.dayName}
                </span>
              </div>

              {rec ? (
                <div className="space-y-1.5">
                  <div>
                    <AttendanceStatusBadge status={rec.status} />
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between font-mono pt-1">
                    <span>In: {rec.checkIn ? new Date(rec.checkIn).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '-'}</span>
                    <span>Out: {rec.checkOut ? new Date(rec.checkOut).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '-'}</span>
                  </div>
                  {rec.workDurationMinutes > 0 && (
                    <div className="text-[11px] text-slate-400 font-medium">
                      {(rec.workDurationMinutes / 60).toFixed(1)} hrs worked
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-14 flex items-center justify-center text-xs text-slate-400 italic">
                  {isWeekend ? 'Weekend Off' : 'No Punch'}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modals */}
      <RequestCorrectionModal
        isOpen={correctionModalOpen}
        onClose={() => setCorrectionModalOpen(false)}
        defaultDate={selectedDateForCorrection}
        onSuccess={refetch}
      />

      <ApplyWFHModal
        isOpen={wfhModalOpen}
        onClose={() => setWfhModalOpen(false)}
        onSuccess={refetch}
      />
    </div>
  );
};

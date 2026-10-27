/**
 * @file TeamLeaveCalendarPage.jsx
 * @description Interactive Team Leave & Conflict Heatmap Calendar (BUILD-GUIDE Row 6.10).
 * 
 * SPECIFICATION:
 * - Module: M6 Leave & Holidays
 * - Features:
 *   1. Monthly calendar grid with employee leave blocks & holiday tags.
 *   2. Department-scoped data isolation (Managers see their team, HR/Admins can filter by department).
 *   3. Real-time conflict engine detecting $\ge 2$ department peers off on identical dates.
 *   4. Conflict warning banners with expandable peer list.
 * - Aesthetics: Linear Dark Craft (#090A0F, #0F111A, #1E2235, #5E6AD2).
 */

import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Users,
  Sparkles,
  Filter,
  Info,
  Download
} from 'lucide-react';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { useGetLeaveCalendarQuery } from '../leavesApi.js';
import { useGetDepartmentsQuery } from '../../departments/departmentsApi.js';
import { ExportLeaveModal } from '../components/ExportLeaveModal.jsx';
import { usePermission } from '../../../hooks/usePermission.js';
import { cn } from '../../../lib/utils.js';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function TeamLeaveCalendarPage() {
  const { can } = usePermission();
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const canFilterAllDepartments = can('leave.view', 'all') || can('manage', 'all');

  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1); // 1-12
  const [selectedDeptId, setSelectedDeptId] = useState('');

  const monthParam = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

  const { data: deptData } = useGetDepartmentsQuery({ limit: 100 }, { skip: !canFilterAllDepartments });
  const departments = deptData?.data || [];

  const { data: calendarData, isLoading } = useGetLeaveCalendarQuery({
    month: monthParam,
    departmentId: selectedDeptId || undefined
  });

  const calendarPayload = calendarData?.data || {
    leaves: [],
    holidays: [],
    conflicts: [],
    totalLeaves: 0
  };

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentYear(currentYear - 1);
      setCurrentMonth(12);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentYear(currentYear + 1);
      setCurrentMonth(1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const monthName = new Date(currentYear, currentMonth - 1).toLocaleString('default', {
    month: 'long',
    year: 'numeric'
  });

  // Build grid days
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth - 1, 1).getDay();
    const totalDays = new Date(currentYear, currentMonth, 0).getDate();
    const prevMonthDays = new Date(currentYear, currentMonth - 1, 0).getDate();

    const days = [];

    // Prev month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        dayNumber: prevMonthDays - i,
        dateStr: null,
        isCurrentMonth: false
      });
    }

    // Current month days
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: true
      });
    }

    // Next month padding to fill complete weeks
    const remaining = (7 - (days.length % 7)) % 7;
    for (let j = 1; j <= remaining; j++) {
      days.push({
        dayNumber: j,
        dateStr: null,
        isCurrentMonth: false
      });
    }

    return days;
  }, [currentYear, currentMonth]);

  // Index leaves & holidays by YYYY-MM-DD
  const dateEventMap = useMemo(() => {
    const map = {};

    // Map holidays
    for (const h of calendarPayload.holidays || []) {
      const dStr = h.date?.split('T')[0];
      if (dStr) {
        if (!map[dStr]) map[dStr] = { holidays: [], leaves: [], conflict: null };
        map[dStr].holidays.push(h);
      }
    }

    // Map leaves
    for (const l of calendarPayload.leaves || []) {
      const startStr = l.startDate?.split('T')[0];
      const endStr = l.endDate?.split('T')[0];
      if (!startStr || !endStr) continue;

      const startDate = new Date(startStr);
      const endDate = new Date(endStr);

      for (let cur = new Date(startDate); cur <= endDate; cur.setDate(cur.getDate() + 1)) {
        const dStr = cur.toISOString().split('T')[0];
        if (!map[dStr]) map[dStr] = { holidays: [], leaves: [], conflict: null };
        map[dStr].leaves.push(l);
      }
    }

    // Map conflicts
    for (const c of calendarPayload.conflicts || []) {
      if (map[c.date]) {
        map[c.date].conflict = c;
      } else {
        map[c.date] = { holidays: [], leaves: [], conflict: c };
      }
    }

    return map;
  }, [calendarPayload]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Team Leave Calendar"
        subtitle="Visual month schedule, gazetted holidays, and real-time team coverage conflict heatmap."
        badge="Coverage Intelligence"
        actions={
          <div className="flex items-center gap-3">
            {/* Department Filter (HR/Admin) */}
            {canFilterAllDepartments && (
              <div className="relative">
                <select
                  value={selectedDeptId}
                  onChange={(e) => setSelectedDeptId(e.target.value)}
                  className="appearance-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl pl-3 pr-8 py-2.5 hover:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 shadow-xs transition-all cursor-pointer"
                >
                  <option value="">All Departments</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">
                      {d.name}
                    </option>
                  ))}
                </select>
                <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            )}

            {/* Month Navigator */}
            <div className="inline-flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-xl shadow-xs">
              <button
                type="button"
                onClick={handlePrevMonth}
                aria-label="Previous Month"
                className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 text-xs font-semibold text-slate-800 dark:text-slate-200 min-w-32 text-center">
                {monthName}
              </span>
              <button
                type="button"
                onClick={handleNextMonth}
                aria-label="Next Month"
                className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Export Leave Report Button */}
            {(can('report.export', 'team') || can('report.export', 'all') || can('leave.view', 'all') || can('leave.view', 'team')) && (
              <button
                type="button"
                onClick={() => setIsExportModalOpen(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Export Report</span>
              </button>
            )}
          </div>
        }
      />

      {/* Summary KPI Badges */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex items-center gap-3 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900 dark:text-white">{calendarPayload.totalLeaves}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Approved Team Absences</div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex items-center gap-3 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900 dark:text-white">{calendarPayload.holidays?.length || 0}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Gazetted / Public Holidays</div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex items-center gap-3 shadow-xs">
          <div className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center border',
            calendarPayload.conflicts?.length > 0
              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/50 text-rose-600 dark:text-rose-400'
              : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/40 text-slate-400'
          )}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900 dark:text-white">{calendarPayload.conflicts?.length || 0}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Capacity Conflict Days</div>
          </div>
        </div>
      </section>

      {/* Conflict Warning Banner if conflicts exist */}
      {calendarPayload.conflicts?.length > 0 && (
        <div className="rounded-xl border border-rose-200 dark:border-rose-800/50 bg-rose-50/80 dark:bg-rose-950/20 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <h4 className="font-semibold text-rose-800 dark:text-rose-300">Staffing Capacity Alert</h4>
            <p className="text-rose-700 dark:text-slate-400 mt-0.5">
              Multiple members from the same department are on leave on identical dates:{' '}
              {calendarPayload.conflicts.map((c) => c.date).join(', ')}. Review project coverage and shift cover requirements.
            </p>
          </div>
        </div>
      )}

      {/* Calendar Grid */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-center text-xs font-bold text-slate-500 dark:text-slate-400 py-3 uppercase tracking-wider">
          {WEEKDAYS.map((w, idx) => (
            <div key={w} className={cn(idx === 0 || idx === 6 ? 'text-slate-400 dark:text-slate-500' : '')}>
              {w}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 divide-x divide-y divide-slate-200 dark:divide-slate-800">
          {calendarDays.map((cell, idx) => {
            const events = cell.dateStr ? dateEventMap[cell.dateStr] : null;
            const holidays = events?.holidays || [];
            const leaves = events?.leaves || [];
            const conflict = events?.conflict || null;

            const isToday =
              cell.dateStr ===
              `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

            return (
              <div
                key={idx}
                className={cn(
                  'min-h-28 p-2 flex flex-col justify-between transition-colors',
                  cell.isCurrentMonth
                    ? 'bg-white dark:bg-slate-900 hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                    : 'bg-slate-50/50 dark:bg-slate-950/60 text-slate-400 dark:text-slate-600',
                  conflict ? 'bg-rose-50/30 dark:bg-rose-950/15' : ''
                )}
              >
                {/* Header: Date Number + Indicators */}
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      'text-xs font-semibold rounded-full w-6 h-6 flex items-center justify-center',
                      isToday
                        ? 'bg-emerald-600 text-white font-bold shadow-xs'
                        : cell.isCurrentMonth
                        ? 'text-slate-800 dark:text-slate-200'
                        : 'text-slate-400 dark:text-slate-600'
                    )}
                  >
                    {cell.dayNumber}
                  </span>

                  {conflict && (
                    <span
                      title={`${conflict.count} team members away simultaneously!`}
                      className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30"
                    >
                      <AlertTriangle className="w-2.5 h-2.5" />
                      <span>{conflict.count} off</span>
                    </span>
                  )}
                </div>

                {/* Events list */}
                <div className="space-y-1 mt-1.5 flex-1">
                  {/* Holidays */}
                  {holidays.map((h) => (
                    <div
                      key={h._id}
                      className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300 truncate"
                      title={h.name}
                    >
                      🎉 {h.name}
                    </div>
                  ))}

                  {/* Leaves */}
                  {leaves.slice(0, 3).map((l, lIdx) => (
                    <div
                      key={l._id || lIdx}
                      className={cn(
                        'text-[10px] px-1.5 py-0.5 rounded border truncate flex items-center justify-between',
                        l.status === 'approved'
                          ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800/50 text-sky-700 dark:text-sky-300'
                          : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-300'
                      )}
                      title={`${l.employeeId?.name || 'Staff'} (${l.leaveTypeId?.name || 'Leave'}) - ${l.reason}`}
                    >
                      <span className="truncate font-semibold">{l.employeeId?.name?.split(' ')[0] || 'Staff'}</span>
                      <span className="text-[9px] opacity-75">{l.leaveTypeId?.code || 'LV'}</span>
                    </div>
                  ))}

                  {leaves.length > 3 && (
                    <div className="text-[9px] text-slate-500 text-center font-medium">
                      +{leaves.length - 3} more on leave
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Export Leave Analytics Modal */}
      <ExportLeaveModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
    </div>
  );
}

export default TeamLeaveCalendarPage;

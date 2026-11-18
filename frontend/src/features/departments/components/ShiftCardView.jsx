/**
 * @file ShiftCardView.jsx
 * @description Responsive card grid view for corporate work shifts and roster schedules.
 * Supports quick inspections, timing visualizer, overnight indicators, headcount pills,
 * capacity progress, and direct management actions (Inspect, Assign Staff, Edit, Archive).
 * Styled in the Forest & Emerald Enterprise theme (#061A14, #111D17, #1A3125, #00C471).
 */

import React from 'react';
import {
  Clock,
  Building2,
  Users,
  Eye,
  Edit2,
  Archive,
  UserPlus,
  Moon,
  Sun,
  Inbox
} from 'lucide-react';
import { StatusBadge } from '../../../components/common/StatusBadge.jsx';
import { Can } from '../../../components/common/Can.jsx';

const TYPE_BADGES = {
  fixed: {
    label: 'Fixed Schedule',
    className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/60'
  },
  flexible: {
    label: 'Flexible Hours',
    className: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200/60 dark:border-amber-800/60'
  },
  night: {
    label: 'Night Shift',
    className: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 border-indigo-200/60 dark:border-indigo-800/60'
  }
};

export function ShiftCardView({
  shifts = [],
  onInspect = () => {},
  onEdit = () => {},
  onAssign = () => {},
  onArchive = () => {}
}) {
  if (shifts.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] p-12 text-center">
        <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-[#15241C] text-slate-400 flex items-center justify-center mx-auto mb-3">
          <Inbox className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
          No work shifts found
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
          No shifts matched your current search or filter criteria. Try adjusting your filters or create a new shift.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {shifts.map((shift) => {
        const typeStyle = TYPE_BADGES[shift.type] || TYPE_BADGES.fixed;
        const deptName = shift.departmentId?.name || 'All Departments';
        const staffCount = shift.headcount || 0;
        const capacity = shift.capacity || 0;
        const isOvernight = shift.isCrossMidnight || shift.type === 'night';
        const netHours = Math.floor(shift.durationMinutes / 60);
        const netMins = shift.durationMinutes % 60;
        const capacityPct = capacity > 0 ? Math.min(100, Math.round((staffCount / capacity) * 100)) : null;

        return (
          <div
            key={shift._id}
            className="group relative rounded-2xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] p-5 shadow-xs transition-all duration-200 hover:shadow-md hover:border-emerald-500/40 dark:hover:border-emerald-500/30 flex flex-col justify-between"
          >
            <div>
              {/* Card Header: Title, Code & Status */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-start gap-2.5 min-w-0">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border"
                    style={{
                      backgroundColor: `${shift.color || '#00C471'}15`,
                      borderColor: `${shift.color || '#00C471'}30`,
                      color: shift.color || '#00C471'
                    }}
                  >
                    {isOvernight ? <Moon className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-[#00C471] transition-colors">
                      {shift.name}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#1A3125] text-slate-600 dark:text-slate-400 font-semibold uppercase">
                        {shift.code}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${typeStyle.className}`}>
                        {typeStyle.label}
                      </span>
                    </div>
                  </div>
                </div>

                <StatusBadge status={shift.isActive ? 'Active' : 'Inactive'} size="sm" />
              </div>

              {/* Timing Display Box */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0E1712] border border-slate-100 dark:border-[#1A3125]/80 my-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-100">
                    {isOvernight ? <Moon className="w-3.5 h-3.5 text-indigo-400" /> : <Sun className="w-3.5 h-3.5 text-amber-500" />}
                    <span>{shift.startTime} → {shift.endTime}</span>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-[#00C471]">
                    {netHours}h {netMins > 0 ? `${netMins}m` : ''} net
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                  <span>Break: {shift.breakMinutes}m • Grace: {shift.graceMinutes}m</span>
                  {isOvernight && (
                    <span className="text-indigo-400 font-medium text-[10px]">Overnight Shift</span>
                  )}
                </div>
              </div>

              {/* Work Days Badges */}
              <div className="flex items-center gap-1 mb-3">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
                  const fullDay = day === 'Mon' ? 'Monday' : day === 'Tue' ? 'Tuesday' : day === 'Wed' ? 'Wednesday' : day === 'Thu' ? 'Thursday' : day === 'Fri' ? 'Friday' : day === 'Sat' ? 'Saturday' : 'Sunday';
                  const isWorkDay = (shift.workDays || []).includes(fullDay);

                  return (
                    <span
                      key={day}
                      className={`text-[10px] font-semibold w-6 h-6 rounded-md flex items-center justify-center transition-colors ${
                        isWorkDay
                          ? 'bg-emerald-50 text-[#00C471] dark:bg-emerald-950/40 dark:text-[#00C471] border border-emerald-200/50 dark:border-emerald-800/40'
                          : 'bg-slate-100 dark:bg-slate-800/40 text-slate-400 dark:text-slate-600'
                      }`}
                      title={fullDay}
                    >
                      {day.charAt(0)}
                    </span>
                  );
                })}
              </div>

              {/* Department Association */}
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-3 truncate">
                <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{deptName}</span>
              </div>

              {/* Capacity Progress Bar (if capacity > 0) */}
              {capacity > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                    <span>Capacity: {staffCount} / {capacity}</span>
                    <span className="font-mono">{capacityPct}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        capacityPct >= 90 ? 'bg-rose-500' : capacityPct >= 75 ? 'bg-amber-500' : 'bg-[#00C471]'
                      }`}
                      style={{ width: `${capacityPct}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Card Footer: Staff Pill & Action Buttons */}
            <div className="pt-3 border-t border-slate-100 dark:border-[#1A3125] flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-bold text-slate-900 dark:text-white font-mono">
                  {staffCount}
                </span>
                <span className="text-[11px] text-slate-400">staff</span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onInspect(shift)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="View Shift Details"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>

                <Can I="org.manage" a="Organization">
                  <button
                    type="button"
                    onClick={() => onAssign(shift)}
                    className="p-1.5 rounded-lg text-[#00C471] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                    title="Assign Employees"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onEdit(shift)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-[#00C471] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Edit Shift"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onArchive(shift)}
                    className="p-1.5 rounded-lg text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
                    title="Archive Shift"
                  >
                    <Archive className="w-3.5 h-3.5" />
                  </button>
                </Can>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default ShiftCardView;

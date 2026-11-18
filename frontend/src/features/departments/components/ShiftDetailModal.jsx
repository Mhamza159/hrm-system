/**
 * @file ShiftDetailModal.jsx
 * @description Deep inspection modal displaying shift schedule profile, timing architecture breakdown,
 * grace period window, break rules, work days, department context, archival notice,
 * and live searchable assigned staff roster.
 * Styled in the Forest & Emerald Enterprise theme (#061A14, #111D17, #1A3125, #00C471).
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Clock,
  Moon,
  Sun,
  Users,
  Search,
  Archive,
  Edit2,
  UserPlus,
  CheckCircle2
} from 'lucide-react';
import { Can } from '../../../components/common/Can.jsx';
import { useGetShiftByIdQuery, useGetShiftEmployeesQuery } from '../departmentsApi.js';

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

export function ShiftDetailModal({
  isOpen = false,
  onClose = () => {},
  shiftId = null,
  initialData = null,
  onEdit = null,
  onAssign = null
}) {
  const [employeeSearch, setEmployeeSearch] = useState('');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const { data: response } = useGetShiftByIdQuery(shiftId, {
    skip: !isOpen || !shiftId
  });

  const { data: staffResponse, isLoading: isStaffLoading } = useGetShiftEmployeesQuery(
    shiftId ? { id: shiftId, params: { limit: 100, search: employeeSearch } } : null,
    { skip: !isOpen || !shiftId }
  );

  if (!isOpen) return null;

  const shift = response?.data || initialData;
  const employees = staffResponse?.data || [];
  const typeStyle = TYPE_BADGES[shift?.type] || TYPE_BADGES.fixed;
  const isOvernight = shift?.isCrossMidnight || shift?.type === 'night';
  const netHours = Math.floor((shift?.durationMinutes || 0) / 60);
  const netMins = (shift?.durationMinutes || 0) % 60;
  const capacity = shift?.capacity || 0;
  const headcount = shift?.headcount || employees.length || 0;

  const formatTime = (ts) => {
    if (!ts) return '—';
    try {
      const d = new Date(ts);
      if (isNaN(d.getTime())) return '—';
      return d.toLocaleString('en-GB', {
        timeZone: 'Asia/Karachi',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return String(ts);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-[#1A3125]">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center border"
              style={{
                backgroundColor: `${shift?.color || '#00C471'}15`,
                borderColor: `${shift?.color || '#00C471'}30`,
                color: shift?.color || '#00C471'
              }}
            >
              {isOvernight ? <Moon className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {shift?.name || 'Shift Details'}
                </h2>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-[#1A3125] text-slate-700 dark:text-slate-300 font-semibold uppercase">
                  {shift?.code || '—'}
                </span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${typeStyle.className}`}>
                  {typeStyle.label}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {shift?.departmentId?.name || 'Global Schedule (All Departments)'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Archival Banner */}
          {shift?.isArchived && (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-start gap-3">
              <Archive className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800 dark:text-amber-300">
                <p className="font-bold">Archived Work Shift</p>
                <p className="mt-0.5">
                  This shift was archived on <strong>{formatTime(shift.archivedAt)}</strong>
                  {shift.archivedBy?.name ? ` by ${shift.archivedBy.name}` : ''}. It is no longer assigned to new hires.
                </p>
              </div>
            </div>
          )}

          {/* Timing Architecture Card */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#0E1712] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isOvernight ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
                <span className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                  {shift?.startTime} → {shift?.endTime}
                </span>
                {isOvernight && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200/40">
                    Crosses Midnight
                  </span>
                )}
              </div>

              <div className="text-xs font-semibold text-[#00C471] font-mono">
                Net Work: {netHours}h {netMins > 0 ? `${netMins}m` : ''}
              </div>
            </div>

            {/* Timing Parameters Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200/60 dark:border-[#1A3125]/80 text-xs">
              <div>
                <span className="text-[11px] text-slate-400 block">Grace Window:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200 font-mono">
                  {shift?.graceMinutes || 0} mins
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Lunch / Break:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200 font-mono">
                  {shift?.breakMinutes || 0} mins
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Half-Day Mark:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200 font-mono">
                  {shift?.halfDayMinutes || 0} mins
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Capacity:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200 font-mono">
                  {capacity > 0 ? `${headcount} / ${capacity}` : 'Unlimited'}
                </span>
              </div>
            </div>
          </div>

          {/* Work Days Strip */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Weekly Operational Days
            </h4>
            <div className="flex flex-wrap items-center gap-1.5">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                const isWorkDay = (shift?.workDays || []).includes(day);
                return (
                  <span
                    key={day}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg font-medium border ${
                      isWorkDay
                        ? 'bg-emerald-50 text-[#00C471] dark:bg-emerald-950/40 dark:text-[#00C471] border-emerald-200/60 dark:border-emerald-800/60'
                        : 'bg-slate-100 dark:bg-slate-800/40 text-slate-400 dark:text-slate-600 border-slate-200/50 dark:border-slate-800'
                    }`}
                  >
                    {isWorkDay && <CheckCircle2 className="w-3 h-3" />}
                    <span>{day}</span>
                  </span>
                );
              })}
            </div>
          </div>

          {/* Description (if present) */}
          {shift?.description && (
            <div className="p-3 rounded-xl bg-slate-50/50 dark:bg-[#0E1712] border border-slate-200/60 dark:border-[#1A3125] text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Description:</span>
              <p className="text-slate-500 dark:text-slate-400">{shift.description}</p>
            </div>
          )}

          {/* Assigned Staff Roster Sub-table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#00C471]" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Assigned Personnel ({headcount})
                </h4>
              </div>
              {onAssign && (
                <Can I="org.manage" a="Organization">
                  <button
                    type="button"
                    onClick={() => onAssign(shift)}
                    className="inline-flex items-center gap-1 text-xs text-[#00C471] hover:underline font-semibold"
                  >
                    <UserPlus className="w-3 h-3" />
                    <span>Manage Staff</span>
                  </button>
                </Can>
              )}
            </div>

            <div className="relative mb-2">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={employeeSearch}
                onChange={(e) => setEmployeeSearch(e.target.value)}
                placeholder="Search rostered staff by name, code, or email..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#0E1712] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#00C471]"
              />
            </div>

            {isStaffLoading ? (
              <div className="py-6 text-center text-xs text-slate-400">Loading rostered staff...</div>
            ) : employees.length === 0 ? (
              <div className="py-8 text-center border border-dashed border-slate-200 dark:border-[#1A3125] rounded-xl p-4">
                <Users className="w-6 h-6 text-slate-300 dark:text-slate-600 mx-auto mb-1" />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  No employees currently assigned to this shift.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-[#1A3125] border border-slate-200/80 dark:border-[#1A3125] rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                {employees.map((emp) => (
                  <div
                    key={emp._id}
                    className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-[#162720]/40 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {emp.avatar ? (
                        <img src={emp.avatar} alt={emp.name} className="w-7 h-7 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-emerald-500/10 text-[#00C471] flex items-center justify-center font-bold text-xs shrink-0">
                          {emp.name?.charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">{emp.name}</p>
                        <p className="text-[11px] text-slate-400 truncate">
                          <span className="font-mono text-slate-500">{emp.employeeCode}</span> • {emp.designationId?.title || 'Staff'}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-emerald-50 dark:bg-emerald-950/40 text-[#00C471]">
                      {emp.status || 'Active'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-[#1A3125] bg-slate-50/40 dark:bg-[#0E1712]/30">
          <div className="text-[11px] text-slate-400">
            Created: {formatTime(shift?.createdAt)}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1A3125] rounded-xl transition-colors cursor-pointer"
            >
              Close
            </button>
            {onEdit && !shift?.isArchived && (
              <Can I="org.manage" a="Organization">
                <button
                  type="button"
                  onClick={() => { onClose(); onEdit(shift); }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#00C471] hover:bg-[#00B065] rounded-xl transition-colors shadow-sm cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Shift</span>
                </button>
              </Can>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ShiftDetailModal;

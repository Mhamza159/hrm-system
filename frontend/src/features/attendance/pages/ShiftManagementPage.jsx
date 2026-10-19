/**
 * @file ShiftManagementPage.jsx
 * @description Work Shifts Management, Timings, Grace Rules, and Shift Assignment.
 * 
 * SPECIFICATION:
 * - Module: M5 Attendance & Shifts (BUILD-GUIDE Section 10 · Row 5.2)
 */

import React, { useState } from 'react';
import { Clock, Plus, Trash2, Moon, Sun, CheckCircle2, AlertCircle, X } from 'lucide-react';
import {
  useGetShiftsQuery,
  useCreateShiftMutation,
  useDeleteShiftMutation
} from '../attendanceApi.js';
import { usePermission } from '../../../hooks/usePermission.js';

export const ShiftManagementPage = () => {
  const { can } = usePermission();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [type, setType] = useState('fixed');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');
  const [graceMinutes, setGraceMinutes] = useState(15);
  const [breakMinutes, setBreakMinutes] = useState(60);
  const [halfDayMinutes, setHalfDayMinutes] = useState(240);
  const [workDays, setWorkDays] = useState(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
  const [errorMessage, setErrorMessage] = useState('');

  const { data, isLoading, refetch } = useGetShiftsQuery();
  const [createShift, { isLoading: isCreating }] = useCreateShiftMutation();
  const [deleteShift, { isLoading: isDeleting }] = useDeleteShiftMutation();

  const shifts = data?.data || [];

  const handleCreateShift = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    try {
      await createShift({
        name,
        code: code.toUpperCase().trim(),
        type,
        startTime,
        endTime,
        graceMinutes: Number(graceMinutes),
        breakMinutes: Number(breakMinutes),
        halfDayMinutes: Number(halfDayMinutes),
        workDays
      }).unwrap();

      setCreateModalOpen(false);
      setName('');
      setCode('');
      refetch();
    } catch (err) {
      setErrorMessage(err.data?.message || err.message || 'Failed to create shift');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this shift?')) return;
    try {
      await deleteShift(id).unwrap();
      refetch();
    } catch (err) {
      alert(err.data?.message || err.message || 'Failed to delete shift');
    }
  };

  const toggleDay = (day) => {
    if (workDays.includes(day)) {
      setWorkDays(workDays.filter((d) => d !== day));
    } else {
      setWorkDays([...workDays, day]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Shift Roster & Schedules
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Manage work shifts, grace times, half-day thresholds, and overnight work rosters.
            </p>
          </div>
        </div>

        {can('org.manage') && (
          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Shift</span>
          </button>
        )}
      </div>

      {/* Shifts Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-sm text-slate-400">Loading shift rosters...</div>
      ) : shifts.length === 0 ? (
        <div className="p-12 text-center text-sm text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          No custom shifts found. The company fallback office hours (09:00 - 18:00) will be used by default.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {shifts.map((shift) => (
            <div
              key={shift._id}
              className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      {shift.isCrossMidnight ? (
                        <Moon className="w-4 h-4 text-indigo-500" />
                      ) : (
                        <Sun className="w-4 h-4 text-amber-500" />
                      )}
                      <span>{shift.name}</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                      {shift.code} • {shift.type}
                    </span>
                  </div>

                  {can('org.manage') && (
                    <button
                      onClick={() => handleDelete(shift._id)}
                      disabled={isDeleting}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Delete shift"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Working Hours:</span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {shift.startTime} - {shift.endTime}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Grace Allowed:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {shift.graceMinutes} mins
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Half-Day Threshold:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {shift.halfDayMinutes} mins
                    </span>
                  </div>
                  <div className="pt-2">
                    <span className="text-slate-400 block mb-1">Working Days:</span>
                    <div className="flex flex-wrap gap-1">
                      {(shift.workDays || []).map((d) => (
                        <span
                          key={d}
                          className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded text-[11px] font-medium"
                        >
                          {d.slice(0, 3)}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Shift Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-600" />
                Create New Work Shift
              </h3>
              <button
                onClick={() => setCreateModalOpen(false)}
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

            <form onSubmit={handleCreateShift} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Shift Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Morning Shift"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Shift Code *
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="MORN-A"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    End Time *
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Grace (Mins)
                  </label>
                  <input
                    type="number"
                    value={graceMinutes}
                    onChange={(e) => setGraceMinutes(e.target.value)}
                    min={0}
                    max={120}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Break (Mins)
                  </label>
                  <input
                    type="number"
                    value={breakMinutes}
                    onChange={(e) => setBreakMinutes(e.target.value)}
                    min={0}
                    max={180}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Half-Day (Mins)
                  </label>
                  <input
                    type="number"
                    value={halfDayMinutes}
                    onChange={(e) => setHalfDayMinutes(e.target.value)}
                    min={60}
                    max={480}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Scheduled Work Days
                </label>
                <div className="flex flex-wrap gap-2">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                    <button
                      type="button"
                      key={day}
                      onClick={() => toggleDay(day)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                        workDays.includes(day)
                          ? 'border-purple-600 bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-5 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-xl shadow-sm"
                >
                  {isCreating ? 'Creating...' : 'Create Shift'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

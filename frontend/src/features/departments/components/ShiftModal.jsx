/**
 * @file ShiftModal.jsx
 * @description Modal dialog for creating and modifying work shifts with real-time cross-midnight calculation,
 * timing duration breakdown, break deduction, department associations, capacity bounds, and color accents.
 * 
 * SPECIFICATION & FEATURES:
 * - BUILD-GUIDE ID 4.4: Shifts Master & Cross-Midnight Support
 * - 24-hour time pickers (startTime, endTime) with standard presets
 * - Real-time cross-midnight night shift calculation indicator
 * - Department association dropdown
 * - Roster capacity limits and color tags
 * - Work days selection pills (Mon–Sun) with quick presets
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Clock,
  Moon,
  Sun,
  AlertCircle,
  Loader2,
  Check
} from 'lucide-react';
import {
  useCreateShiftMutation,
  useUpdateShiftMutation,
  useGetDepartmentsQuery
} from '../departmentsApi.js';

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];

const PRESET_COLORS = [
  '#00C471', // Emerald
  '#3B82F6', // Blue
  '#F59E0B', // Amber
  '#818CF8', // Indigo
  '#EC4899', // Pink
  '#10B981', // Mint
  '#64748B'  // Slate
];

const TIME_PRESETS = [
  { label: '09:00 – 18:00 (Standard 9h)', start: '09:00', end: '18:00', type: 'fixed' },
  { label: '14:00 – 23:00 (Evening 9h)', start: '14:00', end: '23:00', type: 'flexible' },
  { label: '22:00 – 06:00 (Overnight 8h)', start: '22:00', end: '06:00', type: 'night' }
];

export function ShiftModal({
  isOpen,
  onClose,
  shift = null
}) {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'fixed',
    startTime: '09:00',
    endTime: '18:00',
    graceMinutes: 15,
    breakMinutes: 60,
    halfDayMinutes: 240,
    departmentId: '',
    capacity: 0,
    description: '',
    color: '#00C471',
    workDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    isActive: true
  });
  const [errorMessage, setErrorMessage] = useState('');

  const { data: deptResponse } = useGetDepartmentsQuery({ limit: 100 });
  const departments = deptResponse?.data || [];

  const [createShift, { isLoading: isCreating }] = useCreateShiftMutation();
  const [updateShift, { isLoading: isUpdating }] = useUpdateShiftMutation();
  const isSubmitting = isCreating || isUpdating;

  useEffect(() => {
    if (shift) {
      setFormData({
        name: shift.name || '',
        code: shift.code || '',
        type: shift.type || 'fixed',
        startTime: shift.startTime || '09:00',
        endTime: shift.endTime || '18:00',
        graceMinutes: shift.graceMinutes !== undefined ? shift.graceMinutes : 15,
        breakMinutes: shift.breakMinutes !== undefined ? shift.breakMinutes : 60,
        halfDayMinutes: shift.halfDayMinutes !== undefined ? shift.halfDayMinutes : 240,
        departmentId: shift.departmentId?._id || shift.departmentId || '',
        capacity: shift.capacity || 0,
        description: shift.description || '',
        color: shift.color || '#00C471',
        workDays: shift.workDays?.length ? shift.workDays : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        isActive: shift.isActive !== undefined ? shift.isActive : true
      });
    } else {
      setFormData({
        name: '',
        code: '',
        type: 'fixed',
        startTime: '09:00',
        endTime: '18:00',
        graceMinutes: 15,
        breakMinutes: 60,
        halfDayMinutes: 240,
        departmentId: '',
        capacity: 0,
        description: '',
        color: '#00C471',
        workDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        isActive: true
      });
    }
    setErrorMessage('');
  }, [shift, isOpen]);

  // Real-time calculation of cross-midnight status and duration
  const timingAnalysis = useMemo(() => {
    try {
      const [startH, startM] = (formData.startTime || '09:00').split(':').map(Number);
      const [endH, endM] = (formData.endTime || '18:00').split(':').map(Number);

      let totalMinutes = (endH * 60 + endM) - (startH * 60 + startM);
      let isCross = false;

      if (totalMinutes <= 0 || formData.type === 'night') {
        totalMinutes += 24 * 60;
        isCross = true;
      }

      const breakM = Number(formData.breakMinutes || 0);
      const isBreakInvalid = breakM >= totalMinutes;
      const netMinutes = Math.max(0, totalMinutes - breakM);
      const grossHours = Math.floor(totalMinutes / 60);
      const grossMins = totalMinutes % 60;
      const netHours = Math.floor(netMinutes / 60);
      const netMins = netMinutes % 60;

      return {
        isCross,
        totalMinutes,
        grossHoursDisplay: `${grossHours}h ${grossMins > 0 ? `${grossMins}m` : ''}`,
        netHoursDisplay: `${netHours}h ${netMins > 0 ? `${netMins}m` : ''}`,
        netMinutes,
        isBreakInvalid
      };
    } catch {
      return { isCross: false, totalMinutes: 0, grossHoursDisplay: '0h', netHoursDisplay: '0h', netMinutes: 0, isBreakInvalid: false };
    }
  }, [formData.startTime, formData.endTime, formData.breakMinutes, formData.type]);

  if (!isOpen) return null;

  const toggleDay = (day) => {
    const exists = formData.workDays.includes(day);
    if (exists && formData.workDays.length === 1) {
      setErrorMessage('At least one work day must remain selected.');
      return;
    }
    setErrorMessage('');
    const newDays = exists
      ? formData.workDays.filter((d) => d !== day)
      : [...formData.workDays, day];
    setFormData({ ...formData, workDays: newDays });
  };

  const applyPreset = (preset) => {
    setFormData({
      ...formData,
      startTime: preset.start,
      endTime: preset.end,
      type: preset.type
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.name.trim() || !formData.code.trim()) {
      setErrorMessage('Shift Name and Code are required.');
      return;
    }

    if (timingAnalysis.isBreakInvalid) {
      setErrorMessage('Break minutes cannot exceed or equal total shift duration.');
      return;
    }

    if (!formData.workDays.length) {
      setErrorMessage('Please select at least one weekly work day.');
      return;
    }

    try {
      const payload = {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        type: formData.type,
        startTime: formData.startTime,
        endTime: formData.endTime,
        graceMinutes: Number(formData.graceMinutes),
        breakMinutes: Number(formData.breakMinutes),
        halfDayMinutes: Number(formData.halfDayMinutes),
        departmentId: formData.departmentId || null,
        capacity: Number(formData.capacity) || 0,
        description: formData.description.trim(),
        color: formData.color,
        workDays: formData.workDays,
        isActive: formData.isActive
      };

      if (shift) {
        await updateShift({
          id: shift._id || shift.id,
          ...payload
        }).unwrap();
      } else {
        await createShift(payload).unwrap();
      }

      onClose();
    } catch (err) {
      setErrorMessage(
        err?.data?.message || err?.message || 'Failed to save shift.'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-[#1A3125]">
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-xl border"
              style={{
                backgroundColor: `${formData.color}15`,
                borderColor: `${formData.color}30`,
                color: formData.color
              }}
            >
              {timingAnalysis.isCross ? <Moon className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {shift ? 'Edit Shift Schedule' : 'Create Work Shift'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {shift
                  ? 'Update shift operational hours, grace windows, and roster days'
                  : 'Establish a new attendance schedule for employee assignments'}
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {errorMessage && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/60 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section 1: Basic Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Shift Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Regular Day Shift"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#0E1712] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#00C471] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Shift Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="e.g. DAY-01"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#0E1712] text-slate-900 dark:text-white uppercase font-mono placeholder-slate-400 focus:outline-none focus:border-[#00C471] transition-colors"
              />
            </div>
          </div>

          {/* Type & Department */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Shift Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#0E1712] text-slate-700 dark:text-slate-300 focus:outline-none focus:border-[#00C471] transition-colors cursor-pointer"
              >
                <option value="fixed">Fixed Schedule (Standard)</option>
                <option value="flexible">Flexible Hours</option>
                <option value="night">Night / Rotational Shift</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Department Restriction
              </label>
              <select
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#0E1712] text-slate-700 dark:text-slate-300 focus:outline-none focus:border-[#00C471] transition-colors cursor-pointer"
              >
                <option value="">All Departments (Global Shift)</option>
                {departments.map((dept) => (
                  <option key={dept._id} value={dept._id}>
                    {dept.name} ({dept.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Timing Quick Presets */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Quick Schedule Presets:
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {TIME_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#1A3125] bg-slate-50 dark:bg-[#0E1712] text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:border-[#00C471] hover:text-[#00C471] transition-colors text-left"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Section 2: Timing Pickers */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#0E1712]/60 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Start Time (24h) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="time"
                  required
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-900 dark:text-white font-mono focus:outline-none focus:border-[#00C471] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  End Time (24h) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="time"
                  required
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-900 dark:text-white font-mono focus:outline-none focus:border-[#00C471] transition-colors"
                />
              </div>
            </div>

            {/* Live Timing Analysis Card */}
            <div className="p-3 rounded-lg bg-white dark:bg-[#111D17] border border-slate-200/80 dark:border-[#1A3125] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                {timingAnalysis.isCross ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-medium bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200/40 text-[11px]">
                    <Moon className="w-3 h-3" /> Crosses Midnight
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-medium bg-emerald-50 dark:bg-emerald-950/40 text-[#00C471] border border-emerald-200/40 text-[11px]">
                    <Sun className="w-3 h-3" /> Same Day Shift
                  </span>
                )}
                <span className="text-slate-500 dark:text-slate-400">
                  Gross: <strong>{timingAnalysis.grossHoursDisplay}</strong>
                </span>
              </div>

              <div className="flex items-center gap-1 text-slate-700 dark:text-slate-200">
                <span>Net Work:</span>
                <span className="font-bold text-[#00C471] font-mono">
                  {timingAnalysis.netHoursDisplay}
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Grace, Break & Half-Day */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Grace Period (Mins)
              </label>
              <input
                type="number"
                min="0"
                max="120"
                value={formData.graceMinutes}
                onChange={(e) => setFormData({ ...formData, graceMinutes: e.target.value })}
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#0E1712] text-slate-900 dark:text-white font-mono focus:outline-none focus:border-[#00C471]"
              />
              <span className="text-[10px] text-slate-400">Late punch tolerance</span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Break Duration (Mins)
              </label>
              <input
                type="number"
                min="0"
                max="240"
                value={formData.breakMinutes}
                onChange={(e) => setFormData({ ...formData, breakMinutes: e.target.value })}
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#0E1712] text-slate-900 dark:text-white font-mono focus:outline-none focus:border-[#00C471]"
              />
              <span className="text-[10px] text-slate-400">Deducted from gross</span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Half-Day Mark (Mins)
              </label>
              <input
                type="number"
                min="0"
                max="480"
                value={formData.halfDayMinutes}
                onChange={(e) => setFormData({ ...formData, halfDayMinutes: e.target.value })}
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#0E1712] text-slate-900 dark:text-white font-mono focus:outline-none focus:border-[#00C471]"
              />
              <span className="text-[10px] text-slate-400">Min. half-day hours</span>
            </div>
          </div>

          {/* Section 4: Working Days Pills */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Weekly Work Days <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, workDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] })}
                  className="text-[10px] text-[#00C471] hover:underline"
                >
                  Mon–Fri
                </button>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, workDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] })}
                  className="text-[10px] text-[#00C471] hover:underline"
                >
                  Mon–Sat
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {DAYS_OF_WEEK.map((day) => {
                const isSelected = formData.workDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`py-2 px-1 text-center rounded-xl text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-emerald-50 text-[#00C471] dark:bg-emerald-950/40 dark:text-[#00C471] border border-emerald-300 dark:border-emerald-700/60 font-semibold'
                        : 'bg-slate-50 dark:bg-[#0E1712] text-slate-400 dark:text-slate-500 border border-slate-200/60 dark:border-[#1A3125] hover:border-slate-300'
                    }`}
                  >
                    {day.slice(0, 3)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 5: Capacity, Color & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Max Staff Capacity
              </label>
              <input
                type="number"
                min="0"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                placeholder="0 = Unlimited"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#0E1712] text-slate-900 dark:text-white font-mono focus:outline-none focus:border-[#00C471]"
              />
              <span className="text-[10px] text-slate-400">Set 0 for unlimited employees</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Schedule Tag Color
              </label>
              <div className="flex items-center gap-1.5 pt-1">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: c })}
                    className="w-6 h-6 rounded-full flex items-center justify-center transition-transform hover:scale-110 border border-black/10"
                    style={{ backgroundColor: c }}
                  >
                    {formData.color === c && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Active Status Checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="shiftIsActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 rounded text-[#00C471] focus:ring-[#00C471] dark:bg-[#0E1712] border-slate-300 dark:border-[#1A3125]"
            />
            <label htmlFor="shiftIsActive" className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
              Shift is currently active and eligible for employee scheduling
            </label>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-slate-100 dark:border-[#1A3125] bg-slate-50/40 dark:bg-[#0E1712]/30">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1A3125] rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || timingAnalysis.isBreakInvalid}
            onClick={handleSubmit}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-[#00C471] hover:bg-[#00B065] disabled:opacity-50 rounded-xl transition-colors shadow-sm cursor-pointer"
          >
            {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{shift ? 'Update Shift' : 'Create Shift'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default ShiftModal;

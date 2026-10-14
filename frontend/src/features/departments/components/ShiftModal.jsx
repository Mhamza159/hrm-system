/**
 * @file ShiftModal.jsx
 * @description Modal dialog for creating and modifying work shifts with cross-midnight support.
 * 
 * SPECIFICATION & FEATURES:
 * - BUILD-GUIDE ID 4.4: Shifts Master & Cross-Midnight Support
 * - 24-hour time pickers (startTime, endTime)
 * - Real-time cross-midnight night shift calculation indicator
 * - Work days selection pills (Mon–Sun)
 */

import React, { useState, useEffect, useMemo } from 'react';
import { X, Clock, Moon, AlertCircle, Loader2, Calendar } from 'lucide-react';
import {
  useCreateShiftMutation,
  useUpdateShiftMutation
} from '../departmentsApi.js';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

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
    workDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    isActive: true
  });
  const [errorMessage, setErrorMessage] = useState('');

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

      const netMinutes = Math.max(0, totalMinutes - Number(formData.breakMinutes || 0));
      const hours = Math.floor(netMinutes / 60);
      const mins = netMinutes % 60;

      return {
        isCross,
        totalHours: `${hours}h ${mins > 0 ? `${mins}m` : ''}`,
        netMinutes
      };
    } catch {
      return { isCross: false, totalHours: '0h', netMinutes: 0 };
    }
  }, [formData.startTime, formData.endTime, formData.breakMinutes, formData.type]);

  if (!isOpen) return null;

  const toggleDay = (day) => {
    const exists = formData.workDays.includes(day);
    if (exists && formData.workDays.length === 1) {
      setErrorMessage('At least one work day must be active.');
      return;
    }
    setErrorMessage('');
    const newDays = exists
      ? formData.workDays.filter((d) => d !== day)
      : [...formData.workDays, day];
    setFormData({ ...formData, workDays: newDays });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.name.trim() || !formData.code.trim()) {
      setErrorMessage('Shift Name and Code are required.');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-[#1A3125]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-[#00C471] dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60">
              <Clock className="w-5 h-5" />
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {errorMessage && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/60 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Shift Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Morning Regular"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-[#0A120E] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Shift Code *
              </label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="e.g. MORN-REG"
                className="w-full px-3.5 py-2.5 text-xs uppercase rounded-xl bg-slate-50 dark:bg-[#0A120E] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Shift Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'fixed', label: 'Fixed Hours' },
                { value: 'flexible', label: 'Flexible Window' },
                { value: 'night', label: 'Night Shift' }
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, type: opt.value })}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                    formData.type === opt.value
                      ? 'bg-[#00C471]/10 text-[#00C471] border-[#00C471]'
                      : 'bg-slate-50 dark:bg-[#0A120E] border-slate-200 dark:border-[#1A3125] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Timings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Start Time (24h) *
              </label>
              <input
                type="time"
                required
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-[#0A120E] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                End Time (24h) *
              </label>
              <input
                type="time"
                required
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-[#0A120E] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471]"
              />
            </div>
          </div>

          {/* Dynamic Cross-Midnight Badge */}
          <div
            className={`p-3 rounded-xl border flex items-center justify-between text-xs font-medium ${
              timingAnalysis.isCross
                ? 'bg-purple-50 text-purple-700 border-purple-200/80 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900/60'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60'
            }`}
          >
            <div className="flex items-center gap-2">
              {timingAnalysis.isCross ? (
                <Moon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              ) : (
                <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              )}
              <span>
                {timingAnalysis.isCross
                  ? 'Cross-Midnight Schedule (Ends next day)'
                  : 'Standard Same-Day Schedule'}
              </span>
            </div>
            <span className="font-bold">Net Work: {timingAnalysis.totalHours}</span>
          </div>

          {/* Windows: Grace, Break, Half Day */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Grace Period (mins)
              </label>
              <input
                type="number"
                min="0"
                max="120"
                value={formData.graceMinutes}
                onChange={(e) => setFormData({ ...formData, graceMinutes: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#0A120E] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#00C471]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Break Window (mins)
              </label>
              <input
                type="number"
                min="0"
                max="240"
                value={formData.breakMinutes}
                onChange={(e) => setFormData({ ...formData, breakMinutes: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#0A120E] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#00C471]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Half-Day (mins)
              </label>
              <input
                type="number"
                min="0"
                max="480"
                value={formData.halfDayMinutes}
                onChange={(e) => setFormData({ ...formData, halfDayMinutes: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#0A120E] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#00C471]"
              />
            </div>
          </div>

          {/* Work Days Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-500" />
              <span>Weekly Work Days *</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {DAYS_OF_WEEK.map((day) => {
                const isSelected = formData.workDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#00C471] text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-[#1A3125] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {day.slice(0, 3)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="shiftActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 rounded text-[#00C471] focus:ring-[#00C471] border-slate-300 dark:border-[#1A3125]"
            />
            <label htmlFor="shiftActive" className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Active shift (available for roster scheduling)
            </label>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-[#1A3125]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1A3125] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-xl text-white bg-[#00C471] hover:bg-[#00B064] shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{shift ? 'Update Shift' : 'Create Shift'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

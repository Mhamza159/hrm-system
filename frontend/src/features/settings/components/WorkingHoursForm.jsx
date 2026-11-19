/**
 * @file WorkingHoursForm.jsx
 * @description Working Days, Standard Shift Hours & Timezone Schedule Form.
 * Strictly conforms to docs/UI-reference.md (Elvara Forest #061A14 & Emerald #00C471).
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  Calendar,
  CheckCircle2,
  Globe2,
  Coffee,
  RotateCcw,
  Sparkles,
  Timer,
  Moon,
  Sun
} from 'lucide-react';
import { toast } from 'sonner';
import { useUpdateSettingMutation } from '../settingsApi.js';

const DAYS_OF_WEEK = [
  { id: 'monday', label: 'Mon', full: 'Monday', isDefaultWeekend: false },
  { id: 'tuesday', label: 'Tue', full: 'Tuesday', isDefaultWeekend: false },
  { id: 'wednesday', label: 'Wed', full: 'Wednesday', isDefaultWeekend: false },
  { id: 'thursday', label: 'Thu', full: 'Thursday', isDefaultWeekend: false },
  { id: 'friday', label: 'Fri', full: 'Friday', isDefaultWeekend: false },
  { id: 'saturday', label: 'Sat', full: 'Saturday', isDefaultWeekend: true },
  { id: 'sunday', label: 'Sun', full: 'Sunday', isDefaultWeekend: true }
];

const BREAK_PRESETS = [30, 45, 60, 90];

export function WorkingHoursForm({ workingDaysData = [], officeHoursData = {}, onSaved }) {
  const initialDays = useMemo(() => {
    return Array.isArray(workingDaysData) && workingDaysData.length > 0
      ? workingDaysData.map((d) => String(d).toLowerCase())
      : ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
  }, [workingDaysData]);

  const initialHours = useMemo(() => ({
    startTime: officeHoursData?.startTime || '09:00',
    endTime: officeHoursData?.endTime || '18:00',
    breakMinutes: officeHoursData?.breakMinutes ?? 60,
    halfDayMinutes: officeHoursData?.halfDayMinutes ?? 240,
    fullDayMinutes: officeHoursData?.fullDayMinutes ?? 480,
    flexibleShiftAllowed: officeHoursData?.flexibleShiftAllowed || false,
    timeZone: officeHoursData?.timeZone || 'Asia/Karachi'
  }), [officeHoursData]);

  const [workingDays, setWorkingDays] = useState(initialDays);
  const [officeHours, setOfficeHours] = useState(initialHours);

  const [updateSetting, { isLoading }] = useUpdateSettingMutation();

  useEffect(() => {
    setWorkingDays(initialDays);
    setOfficeHours(initialHours);
  }, [initialDays, initialHours]);

  // Check if form has unsaved modifications
  const isDirty = useMemo(() => {
    const daysChanged =
      workingDays.length !== initialDays.length ||
      workingDays.some((d) => !initialDays.includes(d));
    const hoursChanged =
      officeHours.startTime !== initialHours.startTime ||
      officeHours.endTime !== initialHours.endTime ||
      officeHours.breakMinutes !== initialHours.breakMinutes ||
      officeHours.halfDayMinutes !== initialHours.halfDayMinutes ||
      officeHours.fullDayMinutes !== initialHours.fullDayMinutes ||
      officeHours.flexibleShiftAllowed !== initialHours.flexibleShiftAllowed;
    return daysChanged || hoursChanged;
  }, [workingDays, officeHours, initialDays, initialHours]);

  // Real-Time Net Work Hours Compute Engine
  const durationMetrics = useMemo(() => {
    try {
      const [startH, startM] = (officeHours.startTime || '09:00').split(':').map(Number);
      const [endH, endM] = (officeHours.endTime || '18:00').split(':').map(Number);
      let grossMinutes = (endH * 60 + endM) - (startH * 60 + startM);
      let isCrossMidnight = false;
      if (grossMinutes < 0) {
        grossMinutes += 24 * 60;
        isCrossMidnight = true;
      }
      const breakMins = Number(officeHours.breakMinutes) || 0;
      const netMinutes = Math.max(0, grossMinutes - breakMins);

      const grossHours = Math.floor(grossMinutes / 60);
      const grossRemainMins = grossMinutes % 60;

      const netHours = Math.floor(netMinutes / 60);
      const netRemainMins = netMinutes % 60;

      return {
        grossMinutes,
        grossFormatted: `${grossHours}h ${grossRemainMins > 0 ? `${grossRemainMins}m` : '00m'}`,
        breakMinutes: breakMins,
        breakFormatted: `${Math.floor(breakMins / 60)}h ${breakMins % 60 > 0 ? `${breakMins % 60}m` : '00m'}`,
        netMinutes,
        netFormatted: `${netHours}h ${netRemainMins > 0 ? `${netRemainMins}m` : '00m'}`,
        netHoursFloat: (netMinutes / 60).toFixed(1),
        isCrossMidnight
      };
    } catch {
      return {
        grossMinutes: 540,
        grossFormatted: '9h 00m',
        breakMinutes: 60,
        breakFormatted: '1h 00m',
        netMinutes: 480,
        netFormatted: '8h 00m',
        netHoursFloat: '8.0',
        isCrossMidnight: false
      };
    }
  }, [officeHours.startTime, officeHours.endTime, officeHours.breakMinutes]);

  const toggleDay = (dayId) => {
    const cleanId = String(dayId).toLowerCase();
    setWorkingDays((prev) => {
      if (prev.includes(cleanId)) {
        if (prev.length === 1) {
          toast.error('Business Guard: At least one operating working day must remain enabled.');
          return prev;
        }
        return prev.filter((d) => d !== cleanId);
      }
      return [...prev, cleanId];
    });
  };

  const handleHoursChange = (e) => {
    const { name, value, type, checked } = e.target;
    setOfficeHours((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value
    }));
  };

  const handleReset = () => {
    setWorkingDays(initialDays);
    setOfficeHours(initialHours);
    toast.info('Form reverted to latest saved configuration.');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (workingDays.length === 0) {
      toast.error('Schedule must contain at least 1 working day.');
      return;
    }

    try {
      // 1. Commit normalized workingDays
      await updateSetting({
        key: 'workingDays',
        value: workingDays,
        description: 'System-wide operating working days schedule'
      }).unwrap();

      // 2. Commit officeHours with all coordinates
      await updateSetting({
        key: 'officeHours',
        value: officeHours,
        description: 'Standard office hours, break durations and half-day thresholds'
      }).unwrap();

      toast.success('Working schedule & office hours updated successfully across the enterprise.');
      if (onSaved) onSaved();
    } catch (err) {
      toast.error(err.data?.message || 'Failed to update schedule.');
    }
  };

  const workingDaysCount = workingDays.length;
  const weeklyOffsCount = 7 - workingDaysCount;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Timezone & Enterprise Governance Banner */}
      <div className="bg-gradient-to-r from-emerald-950/20 via-[#061A14]/40 to-emerald-950/20 border border-emerald-500/20 rounded-2xl p-4.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[#00C471] flex items-center justify-center shrink-0">
            <Globe2 className="w-5 h-5 stroke-[1.8]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Canonical Enterprise Timezone
              </h4>
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-[#00C471]/15 text-[#00C471] border border-[#00C471]/30">
                LOCKED TO PKT UTC+5
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              All employee punch logs, biometrics, auto-absent crons, leave deduction boundaries, and cutoff hours strictly evaluate against <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">Asia/Karachi</span>.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isDirty && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 animate-pulse">
              <Sparkles className="w-3 h-3" /> Unsaved Changes
            </span>
          )}
        </div>
      </div>

      {/* 7-Day Interactive Weekly Schedule Studio */}
      <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-[#1A3125] pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-wider">
              <Calendar className="w-4 h-4 text-[#00C471]" />
              Weekly Operating Schedule Studio
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Configure company-wide standard working days. Saturday and Sunday are configured as weekly off days by default.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-mono font-bold bg-emerald-50 dark:bg-emerald-950/40 text-[#00C471] border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {workingDaysCount} Working Day{workingDaysCount === 1 ? '' : 's'}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-mono font-bold bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10">
              <Coffee className="w-3.5 h-3.5" />
              {weeklyOffsCount} Weekly Off{weeklyOffsCount === 1 ? '' : 's'}
            </span>
          </div>
        </div>

        {/* 7-Day Visual Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 pt-1">
          {DAYS_OF_WEEK.map((day) => {
            const isActive = workingDays.includes(day.id);
            return (
              <button
                type="button"
                key={day.id}
                onClick={() => toggleDay(day.id)}
                className={`relative flex flex-col items-center justify-between p-3.5 rounded-2xl border text-center transition-all cursor-pointer group select-none min-h-[110px] ${
                  isActive
                    ? 'bg-emerald-500/10 dark:bg-emerald-950/30 border-[#00C471] text-slate-900 dark:text-white ring-1 ring-[#00C471]/30 shadow-xs'
                    : 'bg-slate-50 dark:bg-[#0A110D] border-slate-200 dark:border-[#1A3125] text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Default Weekend Tag */}
                {day.isDefaultWeekend && (
                  <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-md border mb-1.5 ${
                    isActive
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                      : 'bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-white/5'
                  }`}>
                    {isActive ? 'Weekend On' : 'Default Off'}
                  </span>
                )}

                <div className="text-base font-extrabold tracking-tight">
                  {day.label}
                </div>
                <div className="text-[11px] font-medium opacity-70">
                  {day.full}
                </div>

                {/* Status Pill */}
                <div className="mt-2 w-full">
                  {isActive ? (
                    <span className="inline-flex items-center justify-center gap-1 w-full py-1 rounded-lg text-[10px] font-bold bg-[#00C471] text-white shadow-xs">
                      <Sun className="w-3 h-3" /> WORKING
                    </span>
                  ) : (
                    <span className="inline-flex items-center justify-center gap-1 w-full py-1 rounded-lg text-[10px] font-bold bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-400">
                      <Moon className="w-3 h-3" /> OFF DAY
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0A110D] border border-slate-200 dark:border-[#1A3125] flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
          <span className="flex items-center gap-1.5 font-medium">
            <Coffee className="w-3.5 h-3.5 text-[#00C471]" />
            Configured weekly off days are never marked as absent and are excluded from unexcused leave deductions.
          </span>
          <span className="text-[11px] font-mono font-bold text-slate-400">
            Min requirement: 1 operating day
          </span>
        </div>
      </div>

      {/* Standard Shift Coordinates & Live Net Hours Compute Deck */}
      <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1A3125] pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-wider">
              <Clock className="w-4 h-4 text-[#00C471]" />
              Standard Shift Coordinates & Break Rules
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Default baseline for employees without a dedicated roster shift assignment in Module M4.
            </p>
          </div>
          {durationMetrics.isCrossMidnight && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-purple-500/10 border border-purple-500/30 text-purple-600 dark:text-purple-300">
              <Moon className="w-3.5 h-3.5" /> Overnight Shift (Cross-Midnight)
            </span>
          )}
        </div>

        {/* Inputs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Start Time */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Check-In Time (Start) *
            </label>
            <div className="relative">
              <input
                type="time"
                name="startTime"
                required
                value={officeHours.startTime}
                onChange={handleHoursChange}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#0A110D] border border-slate-200 dark:border-[#1A3125] rounded-xl text-sm font-mono font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471] transition-all cursor-pointer"
              />
            </div>
            <span className="text-[11px] text-slate-400 block font-mono">
              Standard: 09:00 PKT
            </span>
          </div>

          {/* End Time */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Check-Out Time (End) *
            </label>
            <div className="relative">
              <input
                type="time"
                name="endTime"
                required
                value={officeHours.endTime}
                onChange={handleHoursChange}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#0A110D] border border-slate-200 dark:border-[#1A3125] rounded-xl text-sm font-mono font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471] transition-all cursor-pointer"
              />
            </div>
            <span className="text-[11px] text-slate-400 block font-mono">
              Standard: 18:00 PKT
            </span>
          </div>

          {/* Break Duration */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Unpaid Break (Minutes) *
              </label>
              <span className="text-[10px] font-mono font-bold text-[#00C471]">
                {durationMetrics.breakFormatted}
              </span>
            </div>
            <div className="space-y-2">
              <input
                type="number"
                name="breakMinutes"
                min="0"
                max="240"
                required
                value={officeHours.breakMinutes}
                onChange={handleHoursChange}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#0A110D] border border-slate-200 dark:border-[#1A3125] rounded-xl text-sm font-mono font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471] transition-all"
                placeholder="60"
              />
              {/* Preset Quick Pills */}
              <div className="flex items-center gap-1.5">
                {BREAK_PRESETS.map((p) => (
                  <button
                    type="button"
                    key={p}
                    onClick={() => setOfficeHours((prev) => ({ ...prev, breakMinutes: p }))}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold border transition-colors cursor-pointer ${
                      officeHours.breakMinutes === p
                        ? 'bg-[#00C471] text-white border-[#00C471]'
                        : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-[#1A3125] text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    {p}m
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Live Shift Computation Deck */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-[#0A110D] border border-slate-200 dark:border-[#1A3125]">
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Timer className="w-3 h-3" /> Gross Shift Span
            </div>
            <div className="text-base font-extrabold font-mono text-slate-900 dark:text-white">
              {durationMetrics.grossFormatted}
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              {durationMetrics.grossMinutes} total minutes
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Coffee className="w-3 h-3" /> Break Deducted
            </div>
            <div className="text-base font-extrabold font-mono text-amber-600 dark:text-amber-400">
              -{durationMetrics.breakFormatted}
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              Unpaid meal / rest window
            </div>
          </div>

          <div className="space-y-1 sm:border-l sm:border-slate-200 sm:dark:border-[#1A3125] sm:pl-4">
            <div className="text-[10px] font-bold text-[#00C471] uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Net Productive Work Hours
            </div>
            <div className="text-xl font-extrabold font-mono text-[#00C471]">
              {durationMetrics.netFormatted}
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              {durationMetrics.netHoursFloat} regular billable hours / day
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Evaluation Thresholds Card */}
      <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-6 shadow-xs space-y-4">
        <div className="border-b border-slate-100 dark:border-[#1A3125] pb-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-wider">
            <Timer className="w-4 h-4 text-[#00C471]" />
            Attendance Status Engine Thresholds
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Defines the exact criteria for Half Day, Full Day, and automated absence evaluations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Half-Day Threshold */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Half-Day Minimum Present (Minutes) *
              </label>
              <span className="text-[10px] font-mono font-bold text-slate-400">
                {(officeHours.halfDayMinutes / 60).toFixed(1)} hours
              </span>
            </div>
            <input
              type="number"
              name="halfDayMinutes"
              min="60"
              max="480"
              required
              value={officeHours.halfDayMinutes}
              onChange={handleHoursChange}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#0A110D] border border-slate-200 dark:border-[#1A3125] rounded-xl text-sm font-mono font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471]"
            />
            <span className="text-[11px] text-slate-400 block">
              Default: 240 mins (4h). Accumulated presence below this threshold is automatically classified as <span className="text-rose-500 font-bold">Absent</span>.
            </span>
          </div>

          {/* Full-Day Threshold */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Full-Day Minimum Present (Minutes) *
              </label>
              <span className="text-[10px] font-mono font-bold text-slate-400">
                {(officeHours.fullDayMinutes / 60).toFixed(1)} hours
              </span>
            </div>
            <input
              type="number"
              name="fullDayMinutes"
              min="180"
              max="720"
              required
              value={officeHours.fullDayMinutes}
              onChange={handleHoursChange}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#0A110D] border border-slate-200 dark:border-[#1A3125] rounded-xl text-sm font-mono font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471]"
            />
            <span className="text-[11px] text-slate-400 block">
              Default: 480 mins (8h). Accumulated presence between half-day and full-day counts as <span className="text-amber-500 font-bold">Half Day</span>.
            </span>
          </div>
        </div>

        {/* Flexible Timing Toggle */}
        <div className="pt-3 border-t border-slate-100 dark:border-[#1A3125]">
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              name="flexibleShiftAllowed"
              checked={officeHours.flexibleShiftAllowed}
              onChange={handleHoursChange}
              className="mt-0.5 w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-[#00C471] focus:ring-[#00C471]/30 accent-[#00C471] cursor-pointer"
            />
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-[#00C471] transition-colors block">
                Allow Flexible Arrival & Departure Grace Window
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-relaxed">
                When enabled, employees who arrive within 30 minutes of standard check-in are excused from tardiness deductions provided their total productive net daily duration meets the full-day threshold.
              </span>
            </div>
          </label>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={handleReset}
          disabled={!isDirty || isLoading}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#1A3125] text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors disabled:opacity-40 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Revert Changes
        </button>

        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#00C471] hover:bg-emerald-600 active:scale-98 text-white rounded-xl text-xs font-bold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
        >
          <CheckCircle2 className="w-4 h-4 stroke-[2]" />
          {isLoading ? 'Saving Changes...' : 'Save Operating Schedule'}
        </button>
      </div>
    </form>
  );
}

export default WorkingHoursForm;

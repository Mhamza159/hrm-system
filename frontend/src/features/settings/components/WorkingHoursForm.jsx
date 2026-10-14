/**
 * @file WorkingHoursForm.jsx
 * @description Working Days & Standard Shift Hours Form (Slice 2.3).
 */

import React, { useState, useEffect } from 'react';
import { Clock, Calendar, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useUpdateSettingMutation } from '../settingsApi.js';

const DAYS_OF_WEEK = [
  { id: 'monday', label: 'Mon', full: 'Monday' },
  { id: 'tuesday', label: 'Tue', full: 'Tuesday' },
  { id: 'wednesday', label: 'Wed', full: 'Wednesday' },
  { id: 'thursday', label: 'Thu', full: 'Thursday' },
  { id: 'friday', label: 'Fri', full: 'Friday' },
  { id: 'saturday', label: 'Sat', full: 'Saturday' },
  { id: 'sunday', label: 'Sun', full: 'Sunday' }
];

export function WorkingHoursForm({ workingDaysData = [], officeHoursData = {}, onSaved }) {
  const [workingDays, setWorkingDays] = useState(
    workingDaysData.length > 0 ? workingDaysData : ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
  );

  const [officeHours, setOfficeHours] = useState({
    startTime: officeHoursData.startTime || '09:00',
    endTime: officeHoursData.endTime || '18:00',
    halfDayMinutes: officeHoursData.halfDayMinutes || 240,
    flexibleShiftAllowed: officeHoursData.flexibleShiftAllowed || false
  });

  const [updateSetting, { isLoading }] = useUpdateSettingMutation();

  useEffect(() => {
    if (workingDaysData && workingDaysData.length > 0) {
      setWorkingDays(workingDaysData);
    }
    if (officeHoursData) {
      setOfficeHours({
        startTime: officeHoursData.startTime || '09:00',
        endTime: officeHoursData.endTime || '18:00',
        halfDayMinutes: officeHoursData.halfDayMinutes || 240,
        flexibleShiftAllowed: officeHoursData.flexibleShiftAllowed || false
      });
    }
  }, [workingDaysData, officeHoursData]);

  const toggleDay = (dayId) => {
    setWorkingDays((prev) => {
      if (prev.includes(dayId)) {
        if (prev.length === 1) {
          toast.error('At least one working day must remain active');
          return prev;
        }
        return prev.filter((d) => d !== dayId);
      }
      return [...prev, dayId];
    });
  };

  const handleHoursChange = (e) => {
    const { name, value, type, checked } = e.target;
    setOfficeHours((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Save working days
      await updateSetting({
        key: 'workingDays',
        value: workingDays,
        description: 'Updated operating working days'
      }).unwrap();

      // Save office hours
      await updateSetting({
        key: 'officeHours',
        value: officeHours,
        description: 'Updated standard office hours'
      }).unwrap();

      toast.success('Working schedule updated successfully');
      if (onSaved) onSaved();
    } catch (err) {
      toast.error(err.data?.message || 'Failed to update schedule');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Active Working Days Card */}
      <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-6 shadow-2xs space-y-4">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-500" />
          Operating Working Days
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Select all standard company working days. Attendance marking and scheduled shift hours apply to selected days.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 pt-2">
          {DAYS_OF_WEEK.map((day) => {
            const isActive = workingDays.includes(day.id);
            return (
              <button
                type="button"
                key={day.id}
                onClick={() => toggleDay(day.id)}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                  isActive
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-semibold shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-300'
                }`}
              >
                <span className="text-sm font-bold">{day.label}</span>
                <span className="text-[10px] mt-0.5 opacity-80">{isActive ? 'Working' : 'Weekend'}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Office Timings Card */}
      <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-6 shadow-2xs space-y-4">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-emerald-500" />
          Shift Timings & Half-Day Rules
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Standard Check-In Time (Start) *
            </label>
            <input
              type="time"
              name="startTime"
              required
              value={officeHours.startTime}
              onChange={handleHoursChange}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-mono text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Standard Check-Out Time (End) *
            </label>
            <input
              type="time"
              name="endTime"
              required
              value={officeHours.endTime}
              onChange={handleHoursChange}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-mono text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Half-Day Minimum Duration (Minutes) *
            </label>
            <input
              type="number"
              name="halfDayMinutes"
              min="60"
              max="480"
              required
              value={officeHours.halfDayMinutes}
              onChange={handleHoursChange}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-mono text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Default: 240 mins (4 hours). Working less counts as absent.
            </span>
          </div>
        </div>

        <div className="pt-2">
          <label className="inline-flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="flexibleShiftAllowed"
              checked={officeHours.flexibleShiftAllowed}
              onChange={handleHoursChange}
              className="w-4 h-4 rounded-md text-emerald-500 focus:ring-emerald-400 border-slate-300 dark:border-slate-700"
            />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Allow Flexible Timing Band (Staff can arrive $\pm 30$ mins if daily total hours are met)
            </span>
          </label>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#00C471] hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold shadow-sm transition-all disabled:opacity-50"
        >
          {isLoading ? 'Saving Schedule...' : 'Save Working Hours'}
        </button>
      </div>
    </form>
  );
}

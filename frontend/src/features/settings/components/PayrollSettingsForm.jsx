/**
 * @file PayrollSettingsForm.jsx
 * @description Monthly Payroll Cycle, Attendance Lock Windows & Pay Disbursement Scheduling (Slice 2.6).
 */

import React, { useState, useEffect } from 'react';
import { BadgeDollarSign, CalendarDays, CheckCircle2, Lock, ArrowRight, Banknote } from 'lucide-react';
import { toast } from 'sonner';
import { useUpdateSettingMutation } from '../settingsApi.js';

export function PayrollSettingsForm({ initialData = {}, onSaved }) {
  const [cycle, setCycle] = useState({
    cycleType: initialData.cycleType || 'calendar_month',
    startDay: initialData.startDay ?? 1,
    endDay: initialData.endDay ?? 30,
    disbursementDay: initialData.disbursementDay ?? 5
  });

  const [updateSetting, { isLoading }] = useUpdateSettingMutation();

  useEffect(() => {
    if (initialData) {
      setCycle({
        cycleType: initialData.cycleType || 'calendar_month',
        startDay: initialData.startDay ?? 1,
        endDay: initialData.endDay ?? 30,
        disbursementDay: initialData.disbursementDay ?? 5
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCycle((prev) => ({
      ...prev,
      [name]: name === 'cycleType' ? value : Number(value)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateSetting({
        key: 'payrollCycle',
        value: cycle,
        description: 'Updated monthly payroll cycle boundaries and pay disbursement date'
      }).unwrap();

      toast.success('Payroll cycle parameters updated successfully');
      if (onSaved) onSaved();
    } catch (err) {
      toast.error(err.data?.message || 'Failed to update payroll cycle');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <BadgeDollarSign className="w-4 h-4 text-emerald-500" />
            Salary Processing Cycle & Pay Date
          </h3>
          <span className="text-xs font-mono font-medium text-slate-500">
            Module M9 Engine
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Dictates the exact attendance lock window, prorated salary calendar span, and scheduled disbursement notification dates.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Cycle Calculation Methodology *
            </label>
            <select
              name="cycleType"
              value={cycle.cycleType}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
            >
              <option value="calendar_month">Calendar Month (1st to Last Day of Month)</option>
              <option value="custom_range">Custom Day Range (e.g. 26th to 25th)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Monthly Salary Disbursement Day *
            </label>
            <input
              type="number"
              name="disbursementDay"
              min="1"
              max="31"
              required
              value={cycle.disbursementDay}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-mono text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              The day of the following month when payslips are released and bank transfer sheets generated (e.g. 5th of each month).
            </span>
          </div>
        </div>

        {cycle.cycleType === 'custom_range' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Custom Cycle Start Day (Current Month)
              </label>
              <input
                type="number"
                name="startDay"
                min="1"
                max="31"
                required
                value={cycle.startDay}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-mono text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Custom Cycle Cutoff Day (Next Month)
              </label>
              <input
                type="number"
                name="endDay"
                min="1"
                max="31"
                required
                value={cycle.endDay}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-mono text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              />
            </div>
          </div>
        )}

        {/* Visual Payroll Calendar Timeline */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
            Operational Lifecycle Sequence:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Phase 1 · Start</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white block">Day {cycle.startDay}</span>
              <p className="text-[10px] text-slate-500">Attendance calculation begins</p>
            </div>
            <div className="p-3 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20 space-y-1">
              <span className="text-[10px] uppercase font-bold text-amber-600 block flex items-center gap-1">
                <Lock className="w-3 h-3" /> Lock Window
              </span>
              <span className="font-mono font-bold text-amber-700 dark:text-amber-300 block">Day {Math.max(1, cycle.endDay - 2)}</span>
              <p className="text-[10px] text-amber-600/80">Attendance freeze for HR review</p>
            </div>
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Phase 3 · Cut-Off</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white block">Day {cycle.endDay}</span>
              <p className="text-[10px] text-slate-500">Payroll draft generated via BullMQ</p>
            </div>
            <div className="p-3 rounded-xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-1">
              <span className="text-[10px] uppercase font-bold text-emerald-600 block flex items-center gap-1">
                <Banknote className="w-3 h-3" /> Pay Day
              </span>
              <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300 block">Day {cycle.disbursementDay} (M+1)</span>
              <p className="text-[10px] text-emerald-600/80">Salary advice & bank dispatch</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#00C471] hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold shadow-xs transition-all disabled:opacity-50 cursor-pointer active:scale-98"
        >
          <CheckCircle2 className="w-4 h-4" />
          {isLoading ? 'Saving Payroll Settings...' : 'Save Payroll Cycle'}
        </button>
      </div>
    </form>
  );
}

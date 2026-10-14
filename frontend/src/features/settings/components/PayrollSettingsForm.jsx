/**
 * @file PayrollSettingsForm.jsx
 * @description Monthly Payroll Cycle & Pay Date Scheduling Form (Slice 2.6).
 */

import React, { useState, useEffect } from 'react';
import { BadgeDollarSign, CalendarDays, HelpCircle } from 'lucide-react';
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
        <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <BadgeDollarSign className="w-4 h-4 text-emerald-500" />
          Salary Processing Cycle & Pay Date
        </h3>
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
                Custom Cycle Start Day
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
                Custom Cycle Cutoff Day
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
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#00C471] hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold shadow-sm transition-all disabled:opacity-50"
        >
          {isLoading ? 'Saving Payroll Settings...' : 'Save Payroll Cycle'}
        </button>
      </div>
    </form>
  );
}

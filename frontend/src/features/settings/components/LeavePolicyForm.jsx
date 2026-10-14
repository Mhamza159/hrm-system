/**
 * @file LeavePolicyForm.jsx
 * @description Global Leave Management & Quota Rules Form (Slice 2.5).
 */

import React, { useState, useEffect } from 'react';
import { CalendarRange, ShieldAlert, Award, Layers } from 'lucide-react';
import { toast } from 'sonner';
import { useUpdateSettingMutation } from '../settingsApi.js';

export function LeavePolicyForm({ initialData = {}, onSaved }) {
  const [policy, setPolicy] = useState({
    fiscalYearStart: initialData.fiscalYearStart || 'July',
    approvalChainLevels: initialData.approvalChainLevels || 2,
    carryForwardLimit: initialData.carryForwardLimit ?? 5,
    encashmentAllowed: initialData.encashmentAllowed ?? true,
    sandwichRule: initialData.sandwichRule ?? true,
    probationLeaveAllowed: initialData.probationLeaveAllowed ?? false
  });

  const [updateSetting, { isLoading }] = useUpdateSettingMutation();

  useEffect(() => {
    if (initialData) {
      setPolicy({
        fiscalYearStart: initialData.fiscalYearStart || 'July',
        approvalChainLevels: initialData.approvalChainLevels || 2,
        carryForwardLimit: initialData.carryForwardLimit ?? 5,
        encashmentAllowed: initialData.encashmentAllowed ?? true,
        sandwichRule: initialData.sandwichRule ?? true,
        probationLeaveAllowed: initialData.probationLeaveAllowed ?? false
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPolicy((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateSetting({
        key: 'leavePolicy',
        value: policy,
        description: 'Updated leave policies and approval workflow parameters'
      }).unwrap();

      toast.success('Leave policy updated successfully');
      if (onSaved) onSaved();
    } catch (err) {
      toast.error(err.data?.message || 'Failed to update leave policy');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-6 shadow-2xs space-y-4">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <CalendarRange className="w-4 h-4 text-emerald-500" />
          Leave Accrual & Governance Rules
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Annual Quota Fiscal Cycle *
            </label>
            <select
              name="fiscalYearStart"
              value={policy.fiscalYearStart}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
            >
              <option value="July">July – June (Standard Pakistan Corporate/Tax Year)</option>
              <option value="January">January – December (Calendar Year)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Carry-Forward Maximum Limit (Days) *
            </label>
            <input
              type="number"
              name="carryForwardLimit"
              min="0"
              max="60"
              required
              value={policy.carryForwardLimit}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-mono text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Unused leaves above this count expire at year-end unless encashed.
            </span>
          </div>
        </div>

        <div className="pt-2">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Approval Chain Hierarchy Depth *
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { level: 1, label: 'Single Level', desc: 'Department Manager only' },
              { level: 2, label: 'Dual Tier (Recommended)', desc: 'Manager → HR Manager' },
              { level: 3, label: 'Three Tier', desc: 'Manager → HR → Super Admin' }
            ].map((chain) => (
              <label
                key={chain.level}
                className={`flex flex-col p-3.5 rounded-xl border cursor-pointer transition-all ${
                  policy.approvalChainLevels === chain.level
                    ? 'bg-emerald-500/10 border-emerald-500 text-slate-900 dark:text-white font-semibold'
                    : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-500'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="approvalChainLevels"
                    value={chain.level}
                    checked={policy.approvalChainLevels === chain.level}
                    onChange={() => setPolicy((prev) => ({ ...prev, approvalChainLevels: chain.level }))}
                    className="text-emerald-500 focus:ring-emerald-400"
                  />
                  <span className="text-sm font-bold">{chain.label}</span>
                </div>
                <span className="text-[11px] text-slate-400 mt-1 pl-5">{chain.desc}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="sandwichRule"
              checked={policy.sandwichRule}
              onChange={handleChange}
              className="w-4 h-4 rounded-md text-emerald-500 focus:ring-emerald-400 border-slate-300 dark:border-slate-700"
            />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Enforce Sandwich Rule (Intervening weekends between applied leaves count towards quota)
            </span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="encashmentAllowed"
              checked={policy.encashmentAllowed}
              onChange={handleChange}
              className="w-4 h-4 rounded-md text-emerald-500 focus:ring-emerald-400 border-slate-300 dark:border-slate-700"
            />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Allow Annual Leave Encashment (Unused annual leaves paid out in final yearly payroll run)
            </span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="probationLeaveAllowed"
              checked={policy.probationLeaveAllowed}
              onChange={handleChange}
              className="w-4 h-4 rounded-md text-emerald-500 focus:ring-emerald-400 border-slate-300 dark:border-slate-700"
            />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Allow Paid Leaves During Probationary Period (First 90 days of employment)
            </span>
          </label>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#00C471] hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold shadow-sm transition-all disabled:opacity-50"
        >
          {isLoading ? 'Saving Policy...' : 'Save Leave Policy'}
        </button>
      </div>
    </form>
  );
}

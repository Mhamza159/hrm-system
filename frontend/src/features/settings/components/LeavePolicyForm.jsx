/**
 * @file LeavePolicyForm.jsx
 * @description Leave Management, Accrual Rules & Interactive Approval Chains Builder (Slice 2.5).
 */

import React, { useState, useEffect } from 'react';
import {
  CalendarRange,
  Layers,
  ShieldCheck,
  CheckCircle2,
  Plus,
  Trash2,
  GitBranch,
  ArrowDown,
  Info,
  Calendar,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { useUpdateSettingMutation } from '../settingsApi.js';

const AVAILABLE_ROLES = [
  'Department Manager',
  'HR Manager',
  'Super Admin'
];

export function LeavePolicyForm({ initialData = {}, onSaved }) {
  const [policy, setPolicy] = useState({
    fiscalYearStart: initialData.fiscalYearStart || 'July',
    approvalChainLevels: initialData.approvalChainLevels || 2,
    carryForwardLimit: initialData.carryForwardLimit ?? 5,
    encashmentAllowed: initialData.encashmentAllowed ?? true,
    sandwichRule: initialData.sandwichRule ?? true,
    probationLeaveAllowed: initialData.probationLeaveAllowed ?? false,
    approvalChains: initialData.approvalChains || [
      { tier: 1, role: 'Department Manager', minDaysThreshold: 0, description: 'Direct Line Manager / Department Head Approval' },
      { tier: 2, role: 'HR Manager', minDaysThreshold: 0, description: 'HR Operational Compliance Sanction' },
      { tier: 3, role: 'Super Admin', minDaysThreshold: 5, description: 'Executive Escalation for extended leaves (> 5 days)' }
    ]
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
        probationLeaveAllowed: initialData.probationLeaveAllowed ?? false,
        approvalChains: initialData.approvalChains && initialData.approvalChains.length > 0 ? initialData.approvalChains : [
          { tier: 1, role: 'Department Manager', minDaysThreshold: 0, description: 'Direct Line Manager / Department Head Approval' },
          { tier: 2, role: 'HR Manager', minDaysThreshold: 0, description: 'HR Operational Compliance Sanction' },
          { tier: 3, role: 'Super Admin', minDaysThreshold: 5, description: 'Executive Escalation for extended leaves (> 5 days)' }
        ]
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

  const handleAddTier = () => {
    if (policy.approvalChains.length >= 4) {
      toast.error('Maximum 4 approval tiers supported');
      return;
    }
    const nextTierNum = policy.approvalChains.length + 1;
    const newTier = {
      tier: nextTierNum,
      role: 'HR Manager',
      minDaysThreshold: 0,
      description: `Tier ${nextTierNum} Administrative Verification`
    };
    setPolicy((prev) => ({
      ...prev,
      approvalChains: [...prev.approvalChains, newTier],
      approvalChainLevels: Math.min(3, nextTierNum)
    }));
  };

  const handleRemoveTier = (index) => {
    if (policy.approvalChains.length <= 1) {
      toast.error('At least one approval tier is required');
      return;
    }
    const updated = policy.approvalChains.filter((_, i) => i !== index).map((tier, idx) => ({
      ...tier,
      tier: idx + 1
    }));
    setPolicy((prev) => ({
      ...prev,
      approvalChains: updated,
      approvalChainLevels: Math.min(3, updated.length)
    }));
  };

  const handleTierChange = (index, field, value) => {
    setPolicy((prev) => {
      const updated = [...prev.approvalChains];
      updated[index] = {
        ...updated[index],
        [field]: field === 'minDaysThreshold' ? parseInt(value, 10) || 0 : value
      };
      return { ...prev, approvalChains: updated };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateSetting({
        key: 'leavePolicy',
        value: policy,
        description: 'Updated leave policies, sandwich rules and visual approval chains'
      }).unwrap();

      toast.success('Leave policy and approval workflows updated successfully');
      if (onSaved) onSaved();
    } catch (err) {
      toast.error(err.data?.message || 'Failed to update leave policy');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Leave Accrual & Governance Rules Card */}
      <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarRange className="w-4 h-4 text-emerald-500" />
            Leave Accrual & Fiscal Cycle Governance
          </h3>
          <span className="text-xs font-mono font-medium text-slate-500">
            Module M6 Policy
          </span>
        </div>

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
            <span className="text-[11px] text-slate-400 mt-1 block">
              Annual leave quota resets and carry-forward allocations are triggered at the start of this fiscal month.
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Carry-Forward Maximum Quota (Days) *
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
              Unused leaves above this count expire at year-end unless encashed under the monetization policy.
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
          <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
            <input
              type="checkbox"
              name="encashmentAllowed"
              checked={policy.encashmentAllowed}
              onChange={handleChange}
              className="w-4 h-4 mt-0.5 rounded-md text-emerald-500 focus:ring-emerald-400 border-slate-300 dark:border-slate-700"
            />
            <div>
              <span className="text-xs font-semibold text-slate-900 dark:text-white block">
                Allow Leave Encashment
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                Staff can liquidate unutilized paid leave balance into payroll cash advice at fiscal year-end.
              </span>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
            <input
              type="checkbox"
              name="probationLeaveAllowed"
              checked={policy.probationLeaveAllowed}
              onChange={handleChange}
              className="w-4 h-4 mt-0.5 rounded-md text-emerald-500 focus:ring-emerald-400 border-slate-300 dark:border-slate-700"
            />
            <div>
              <span className="text-xs font-semibold text-slate-900 dark:text-white block">
                Permit Leaves During Probation
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                When disabled, employees under probation status cannot apply for paid casual/annual leaves.
              </span>
            </div>
          </label>
        </div>
      </div>

      {/* Card 2: Sandwich Rule & Weekend Concurrency */}
      <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Sandwich Rule & Weekend Continuity
          </h3>
          <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md ${
            policy.sandwichRule ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400' : 'bg-slate-100 text-slate-500'
          }`}>
            {policy.sandwichRule ? 'Enforced' : 'Relaxed'}
          </span>
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="sandwichRule"
            checked={policy.sandwichRule}
            onChange={handleChange}
            className="w-4 h-4 rounded-md text-emerald-500 focus:ring-emerald-400 border-slate-300 dark:border-slate-700"
          />
          <span className="text-xs font-semibold text-slate-900 dark:text-white">
            Enforce Sandwich Rule on Intervening Weekends and Gazetted Holidays
          </span>
        </label>

        {/* Visual Sandwich Diagram */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30 space-y-2">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
            How Deductions Are Evaluated:
          </span>
          <div className="grid grid-cols-5 gap-2 text-center text-xs">
            <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400">
              <span className="block font-bold">Friday</span>
              <span className="text-[10px]">Leave Day</span>
            </div>
            <div className={`p-2 rounded-lg border transition-all ${
              policy.sandwichRule
                ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900/30 text-rose-600'
                : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300'
            }`}>
              <span className="block font-bold">Saturday</span>
              <span className="text-[10px]">{policy.sandwichRule ? 'Deducted (Sandwich)' : 'Weekend (Free)'}</span>
            </div>
            <div className={`p-2 rounded-lg border transition-all ${
              policy.sandwichRule
                ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900/30 text-rose-600'
                : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300'
            }`}>
              <span className="block font-bold">Sunday</span>
              <span className="text-[10px]">{policy.sandwichRule ? 'Deducted (Sandwich)' : 'Weekend (Free)'}</span>
            </div>
            <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400">
              <span className="block font-bold">Monday</span>
              <span className="text-[10px]">Leave Day</span>
            </div>
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 flex flex-col justify-center">
              <span className="block font-bold">{policy.sandwichRule ? '4 Total Days' : '2 Total Days'}</span>
              <span className="text-[10px]">Deducted from Quota</span>
            </div>
          </div>
        </div>
      </div>

      {/* Card 3: Interactive Approval Chains Builder */}
      <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-emerald-500" />
              Interactive Multi-Tier Approval Chains Builder
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Configure hierarchical leave approval routing steps, conditional thresholds, and escalation authorities.
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddTier}
            disabled={policy.approvalChains.length >= 4}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/60 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Escalation Tier
          </button>
        </div>

        <div className="space-y-3 pt-2">
          {policy.approvalChains.map((tier, index) => (
            <React.Fragment key={tier.tier || index}>
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    T{tier.tier}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        Tier {tier.tier} Approver:
                      </span>
                      <select
                        value={tier.role}
                        onChange={(e) => handleTierChange(index, 'role', e.target.value)}
                        className="px-2.5 py-1 bg-white dark:bg-[#111D17] border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-emerald-600 dark:text-emerald-400 focus:outline-hidden"
                      >
                        {AVAILABLE_ROLES.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>
                    <input
                      type="text"
                      value={tier.description || ''}
                      onChange={(e) => handleTierChange(index, 'description', e.target.value)}
                      placeholder="Operational role description..."
                      className="text-[11px] text-slate-500 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-emerald-500 focus:outline-hidden w-64"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end md:self-center">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span>Threshold:</span>
                    <select
                      value={tier.minDaysThreshold > 0 ? tier.minDaysThreshold : 0}
                      onChange={(e) => handleTierChange(index, 'minDaysThreshold', e.target.value)}
                      className="px-2.5 py-1 bg-white dark:bg-[#111D17] border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-medium text-slate-700 dark:text-slate-300 focus:outline-hidden"
                    >
                      <option value={0}>All leave applications</option>
                      <option value={2}>Only for leaves &gt; 2 days</option>
                      <option value={5}>Only for leaves &gt; 5 days</option>
                      <option value={10}>Only for extended &gt; 10 days</option>
                    </select>
                  </div>

                  {policy.approvalChains.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTier(index)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
                      title="Remove Tier"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {index < policy.approvalChains.length - 1 && (
                <div className="flex justify-center -my-1">
                  <ArrowDown className="w-4 h-4 text-slate-400" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#00C471] hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold shadow-xs transition-all disabled:opacity-50 cursor-pointer active:scale-98"
        >
          <CheckCircle2 className="w-4 h-4" />
          {isLoading ? 'Saving Policy...' : 'Save Leave Policy'}
        </button>
      </div>
    </form>
  );
}

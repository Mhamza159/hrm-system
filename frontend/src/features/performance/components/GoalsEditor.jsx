/**
 * @file GoalsEditor.jsx
 * @description Component for defining, tracking, and editing OKRs & goals during performance appraisal periods.
 * Adheres strictly to Forest & Emerald design system (DESIGN.md & UI-REFERENCE.md).
 * 
 * SPECIFICATION:
 * - Module: M19 Performance & Appraisal (BUILD-GUIDE Section 22 · Row 19.3)
 */

import React, { useState, useEffect } from 'react';
import { Target, Plus, Trash2, Lock, Save, Loader2 } from 'lucide-react';
import { useUpdateGoalsMutation } from '../performanceApi.js';
import { toast } from 'sonner';

export const GoalsEditor = ({ reviewId, initialGoals = [], isLocked = false }) => {
  const [goals, setGoals] = useState([]);
  const [updateGoals, { isLoading }] = useUpdateGoalsMutation();

  useEffect(() => {
    setGoals(initialGoals || []);
  }, [initialGoals]);

  const handleAddGoal = () => {
    if (isLocked) return;
    setGoals([
      ...goals,
      {
        title: '',
        description: '',
        targetValue: '100%',
        metricUnit: 'Percentage',
        weightage: 20
      }
    ]);
  };

  const handleRemoveGoal = (idx) => {
    if (isLocked) return;
    setGoals(goals.filter((_, i) => i !== idx));
  };

  const handleChange = (idx, field, value) => {
    if (isLocked) return;
    const updated = [...goals];
    updated[idx][field] = field === 'weightage' ? (parseInt(value, 10) || 0) : value;
    setGoals(updated);
  };

  const handleSave = async () => {
    if (isLocked) return;
    for (let i = 0; i < goals.length; i++) {
      const g = goals[i];
      if (!g.title.trim()) {
        toast.error(`Goal #${i + 1} requires a title`);
        return;
      }
    }

    try {
      await updateGoals({ id: reviewId, goals }).unwrap();
      toast.success('Quarterly goals & OKRs saved successfully');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to update goals');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400">
            <Target className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Quarterly Objectives & Key Results (OKRs)
              <span className="text-[11px] font-mono px-2 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                {goals.length}
              </span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Personal milestone targets assessed alongside standardized designation KPIs.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isLocked ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
              <Lock className="h-3 w-3" /> Locked post-submission
            </span>
          ) : (
            <>
              <button
                type="button"
                onClick={handleAddGoal}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> Add Goal
              </button>

              {goals.length > 0 && (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isLoading}
                  className="inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-xs disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  Save Goals
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Goal Items List */}
      {goals.length === 0 ? (
        <div className="text-center py-8 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-4">
          <p className="text-xs text-slate-500">
            No custom OKRs defined for this period. Click "+ Add Goal" to set milestone objectives.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {goals.map((goal, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/30 space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-1">
                  <span className="h-5 w-5 rounded-md bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center text-xs font-mono font-bold border border-slate-200 dark:border-slate-700 shrink-0">
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    disabled={isLocked}
                    placeholder="Goal Objective (e.g. Implement Zero-Downtime Data Migration)"
                    value={goal.title}
                    onChange={(e) => handleChange(idx, 'title', e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:opacity-70"
                  />
                </div>

                {!isLocked && (
                  <button
                    type="button"
                    onClick={() => handleRemoveGoal(idx)}
                    className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded-md transition-colors"
                    title="Remove Goal"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pl-7">
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    disabled={isLocked}
                    placeholder="Target Value / Deliverable (e.g. 100% test coverage; <180ms latency)"
                    value={goal.targetValue}
                    onChange={(e) => handleChange(idx, 'targetValue', e.target.value)}
                    className="w-full px-3 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:opacity-70"
                  />
                </div>

                <div className="sm:col-span-1">
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      disabled={isLocked}
                      placeholder="Weight %"
                      value={goal.weightage}
                      onChange={(e) => handleChange(idx, 'weightage', e.target.value)}
                      className="w-full px-3 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:opacity-70"
                    />
                    <span className="absolute right-2 top-1 text-xs text-slate-400 pointer-events-none">%</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

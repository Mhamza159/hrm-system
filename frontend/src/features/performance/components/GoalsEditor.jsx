/**
 * @file GoalsEditor.jsx
 * @description Component for defining, tracking, and editing OKRs & goals during performance appraisal periods.
 * 
 * SPECIFICATION:
 * - Module: M19 Performance & Appraisal (BUILD-GUIDE Section 22 · Row 19.3)
 */

import React, { useState, useEffect } from 'react';
import { Target, Plus, Trash2, CheckCircle2, Lock } from 'lucide-react';
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
        weightage: 10
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
    for (const g of goals) {
      if (!g.title.trim()) {
        toast.error('All goals must have a title');
        return;
      }
    }

    try {
      await updateGoals({ id: reviewId, goals }).unwrap();
      toast.success('Goals updated successfully');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to update goals');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Quarterly Goals & OKRs ({goals.length})
          </h3>
          {isLocked && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
              <Lock className="h-3 w-3" /> Locked
            </span>
          )}
        </div>

        {!isLocked && (
          <button
            type="button"
            onClick={handleAddGoal}
            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
          >
            <Plus className="h-3.5 w-3.5" /> Add Goal / OKR
          </button>
        )}
      </div>

      {goals.length === 0 ? (
        <p className="text-xs text-slate-500 italic py-2">
          No custom goals added yet. Add period-specific initiatives and OKRs.
        </p>
      ) : (
        <div className="space-y-3">
          {goals.map((goal, idx) => (
            <div
              key={idx}
              className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-3.5 space-y-2.5"
            >
              <div className="flex items-start justify-between gap-3">
                <input
                  type="text"
                  disabled={isLocked}
                  placeholder="Goal Title (e.g. Implement OAuth 2.0 & MFA) *"
                  value={goal.title}
                  onChange={(e) => handleChange(idx, 'title', e.target.value)}
                  className="flex-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-60"
                />
                {!isLocked && (
                  <button
                    type="button"
                    onClick={() => handleRemoveGoal(idx)}
                    className="text-slate-400 hover:text-rose-500 p-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <input
                  type="text"
                  disabled={isLocked}
                  placeholder="Target Value (e.g. 99.9% Uptime)"
                  value={goal.targetValue}
                  onChange={(e) => handleChange(idx, 'targetValue', e.target.value)}
                  className="rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-60"
                />
                <input
                  type="text"
                  disabled={isLocked}
                  placeholder="Metric Unit (e.g. Ratio, Count)"
                  value={goal.metricUnit}
                  onChange={(e) => handleChange(idx, 'metricUnit', e.target.value)}
                  className="rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-60"
                />
                <input
                  type="text"
                  disabled={isLocked}
                  placeholder="Description / Context"
                  value={goal.description}
                  onChange={(e) => handleChange(idx, 'description', e.target.value)}
                  className="rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-60"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLocked && goals.length > 0 && (
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={isLoading}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : 'Save Goals'}
          </button>
        </div>
      )}
    </div>
  );
};


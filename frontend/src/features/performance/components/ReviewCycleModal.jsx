/**
 * @file ReviewCycleModal.jsx
 * @description Modal for launching quarterly/annual appraisal review cycles and auto-instantiating staff reviews.
 * Adheres strictly to Forest & Emerald design system (DESIGN.md).
 * 
 * SPECIFICATION:
 * - Module: M19 Performance & Appraisal (BUILD-GUIDE Section 22 · Row 19.2)
 */

import React, { useState } from 'react';
import { X, Calendar, PlayCircle, Info, Loader2, Clock } from 'lucide-react';
import { useCreateReviewCycleMutation } from '../performanceApi.js';
import { toast } from 'sonner';

export const ReviewCycleModal = ({ isOpen, onClose }) => {
  const [createCycle, { isLoading }] = useCreateReviewCycleMutation();

  const currentYear = new Date().getFullYear();
  const [formData, setFormData] = useState({
    title: `${currentYear} Q4 Performance Appraisal Cycle`,
    periodType: 'quarterly',
    periodQuarter: 'Q4',
    periodYear: currentYear,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    selfReviewDeadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    managerReviewDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Please enter an appraisal cycle title');
      return;
    }

    const start = new Date(formData.startDate).getTime();
    const end = new Date(formData.endDate).getTime();
    const selfDeadline = new Date(formData.selfReviewDeadline).getTime();
    const mgrDeadline = new Date(formData.managerReviewDeadline).getTime();

    if (end <= start) {
      toast.error('Cycle end date must be strictly after the start date');
      return;
    }

    if (selfDeadline >= mgrDeadline) {
      toast.error('Self-review deadline must be strictly before manager review deadline');
      return;
    }

    if (mgrDeadline > end) {
      toast.error('Manager review deadline cannot exceed the cycle end date');
      return;
    }

    try {
      const res = await createCycle(formData).unwrap();
      toast.success(
        `Appraisal cycle launched successfully! ${res.data?.totalReviewsCount || 0} reviews instantiated.`
      );
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to launch review cycle');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8 animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Launch Appraisal Review Cycle
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Orchestrate evaluation timelines and auto-instantiate reviews across active personnel.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="p-6 space-y-5 max-h-[calc(85vh-160px)] overflow-y-auto">
            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Cycle Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 2026 Q4 Enterprise Performance Appraisal"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
              />
            </div>

            {/* Period Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Period Type <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.periodType}
                  onChange={(e) => setFormData({ ...formData, periodType: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  <option value="quarterly">Quarterly</option>
                  <option value="annual">Annual</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Quarter
                </label>
                <select
                  disabled={formData.periodType === 'annual'}
                  value={formData.periodQuarter}
                  onChange={(e) => setFormData({ ...formData, periodQuarter: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:opacity-50"
                >
                  <option value="Q1">Q1 (Jan - Mar)</option>
                  <option value="Q2">Q2 (Apr - Jun)</option>
                  <option value="Q3">Q3 (Jul - Sep)</option>
                  <option value="Q4">Q4 (Oct - Dec)</option>
                  <option value="None">None</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Period Year <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="2020"
                  max="2100"
                  required
                  value={formData.periodYear}
                  onChange={(e) => setFormData({ ...formData, periodYear: parseInt(e.target.value, 10) || currentYear })}
                  className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>

            {/* General Evaluation Window */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Start Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  End Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Critical Milestones: Dual Deadlines */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-3.5 rounded-xl border border-emerald-200/80 dark:border-emerald-800/60 bg-emerald-50/40 dark:bg-emerald-950/20">
              <div>
                <label className="block text-[11px] font-semibold text-emerald-900 dark:text-emerald-300 mb-1 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-emerald-600" />
                  Self-Review Deadline <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.selfReviewDeadline}
                  onChange={(e) => setFormData({ ...formData, selfReviewDeadline: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Staff self-ratings lock after this date</span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-emerald-900 dark:text-emerald-300 mb-1 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-emerald-600" />
                  Manager Review Deadline <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.managerReviewDeadline}
                  onChange={(e) => setFormData({ ...formData, managerReviewDeadline: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Manager scoring & increment proposals cutoff</span>
              </div>
            </div>

            {/* Informational Callout */}
            <div className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
              <Info className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  Automated Review Instantiation:
                </p>
                <p>
                  Upon launching this cycle, the system will instantly scan all active company employees, identify their designation's active KPI template, snapshot criteria into an individual review record, and assign their reporting line manager.
                </p>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800 px-6 py-4 bg-slate-50/60 dark:bg-slate-800/40">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all shadow-sm shadow-emerald-600/20 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Instantiating Reviews...
                </>
              ) : (
                <>
                  <PlayCircle className="h-3.5 w-3.5" />
                  Launch Appraisal Cycle
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/**
 * @file ReviewCycleModal.jsx
 * @description Modal for launching quarterly/annual appraisal review cycles and batch-instantiating employee reviews.
 * 
 * SPECIFICATION:
 * - Module: M19 Performance & Appraisal (BUILD-GUIDE Section 22 · Row 19.2)
 */

import React, { useState } from 'react';
import { X, Calendar, PlayCircle, AlertCircle } from 'lucide-react';
import { useCreateReviewCycleMutation } from '../performanceApi.js';
import { toast } from 'sonner';

export const ReviewCycleModal = ({ isOpen, onClose }) => {
  const [createCycle, { isLoading }] = useCreateReviewCycleMutation();

  const currentYear = new Date().getFullYear();
  const [formData, setFormData] = useState({
    title: `${currentYear} Q3 Performance Appraisal`,
    periodType: 'quarterly',
    periodQuarter: 'Q3',
    periodYear: currentYear,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    selfReviewDeadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    managerReviewDeadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Please enter a cycle title');
      return;
    }

    const start = new Date(formData.startDate).getTime();
    const end = new Date(formData.endDate).getTime();
    const selfDeadline = new Date(formData.selfReviewDeadline).getTime();
    const mgrDeadline = new Date(formData.managerReviewDeadline).getTime();

    if (end <= start) {
      toast.error('Cycle end date must be strictly after start date');
      return;
    }

    if (selfDeadline >= mgrDeadline) {
      toast.error('Self-review deadline must be strictly before manager review deadline');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Launch Appraisal Review Cycle
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
              Cycle Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. 2026 Q3 Performance Appraisal"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                Period Type
              </label>
              <select
                value={formData.periodType}
                onChange={(e) => setFormData({ ...formData, periodType: e.target.value })}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="quarterly">Quarterly</option>
                <option value="annual">Annual</option>
              </select>
            </div>

            {formData.periodType === 'quarterly' && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Quarter
                </label>
                <select
                  value={formData.periodQuarter}
                  onChange={(e) => setFormData({ ...formData, periodQuarter: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Q1">Q1</option>
                  <option value="Q2">Q2</option>
                  <option value="Q3">Q3</option>
                  <option value="Q4">Q4</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                Year *
              </label>
              <input
                type="number"
                required
                min="2000"
                max="2100"
                value={formData.periodYear}
                onChange={(e) => setFormData({ ...formData, periodYear: parseInt(e.target.value, 10) || currentYear })}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                Cycle Start Date *
              </label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                Cycle End Date *
              </label>
              <input
                type="date"
                required
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-300">
              <AlertCircle className="h-4 w-4 text-amber-600" /> Stage Deadlines (Enforced Hard Lock)
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-amber-800 dark:text-amber-300 mb-1">
                  1. Self-Review Deadline *
                </label>
                <input
                  type="date"
                  required
                  value={formData.selfReviewDeadline}
                  onChange={(e) => setFormData({ ...formData, selfReviewDeadline: e.target.value })}
                  className="w-full rounded border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-amber-800 dark:text-amber-300 mb-1">
                  2. Manager Review Deadline *
                </label>
                <input
                  type="date"
                  required
                  value={formData.managerReviewDeadline}
                  onChange={(e) => setFormData({ ...formData, managerReviewDeadline: e.target.value })}
                  className="w-full rounded border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow disabled:opacity-50"
            >
              <PlayCircle className="h-4 w-4" />
              {isLoading ? 'Launching & Cloning...' : 'Launch Cycle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


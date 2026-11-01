/**
 * @file FinalizeReviewModal.jsx
 * @description Modal for Super Admin & HR to finalize appraisals, approve ratings, and dispatch M9 Payroll salary increments.
 * 
 * SPECIFICATION:
 * - Module: M19 Performance & Appraisal (BUILD-GUIDE Section 22 · Row 19.7)
 */

import React, { useState } from 'react';
import { X, Award, CheckCircle2, TrendingUp, AlertCircle, FileCheck } from 'lucide-react';
import { useFinalizeReviewMutation } from '../performanceApi.js';
import { toast } from 'sonner';

export const FinalizeReviewModal = ({ isOpen, onClose, review }) => {
  const [finalizeReview, { isLoading }] = useFinalizeReviewMutation();

  const [finalRating, setFinalRating] = useState(
    review?.managerReview?.calculatedScore ? Math.round(review.managerReview.calculatedScore) : 4
  );
  const [approvedIncrementPercent, setApprovedIncrementPercent] = useState(
    review?.managerReview?.recommendedIncrementPercent || 5
  );
  const [finalComments, setFinalComments] = useState('');

  if (!isOpen || !review) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await finalizeReview({
        id: review._id,
        finalRating: Number(finalRating),
        finalScore: review.managerReview?.calculatedScore || Number(finalRating),
        approvedIncrementPercent: Number(approvedIncrementPercent) || 0,
        finalComments
      }).unwrap();

      toast.success(
        `Appraisal finalized! Approved ${approvedIncrementPercent}% increment linked to M9 Payroll.`
      );
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to finalize appraisal');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Final Appraisal Sign-off
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Evaluation Summary Overview */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 text-xs space-y-1.5">
          <div className="flex justify-between">
            <span className="text-slate-500">Employee:</span>
            <span className="font-bold text-slate-900 dark:text-white">
              {review.employeeId?.firstName} {review.employeeId?.lastName}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Self-Evaluation Score:</span>
            <span className="font-mono font-bold text-indigo-600">
              {review.selfReview?.calculatedScore || 'N/A'} / 5
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Manager Evaluation Score:</span>
            <span className="font-mono font-bold text-emerald-600">
              {review.managerReview?.calculatedScore || 'N/A'} / 5
            </span>
          </div>
          {review.managerReview?.recommendedIncrementPercent !== undefined && (
            <div className="flex justify-between">
              <span className="text-slate-500">Manager Proposed Increment:</span>
              <span className="font-bold text-amber-600">
                +{review.managerReview.recommendedIncrementPercent}%
              </span>
            </div>
          )}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
              Official Approved Rating (1–5 Scale) *
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((score) => (
                <button
                  key={score}
                  type="button"
                  onClick={() => setFinalRating(score)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                    finalRating === score
                      ? 'bg-indigo-600 text-white shadow-md scale-105'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {score}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-3.5 space-y-2">
            <label className="block text-xs font-bold text-emerald-900 dark:text-emerald-300">
              Approved Salary Increment % (Dispatched to M9 Payroll)
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="100"
                value={approvedIncrementPercent}
                onChange={(e) => setApprovedIncrementPercent(e.target.value)}
                className="w-full rounded border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-800 pl-3 pr-7 py-2 text-sm font-bold text-emerald-700 dark:text-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="absolute right-3 top-2 text-sm font-bold text-emerald-500">%</span>
            </div>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
              Entering an increment &gt; 0 automatically drafts a revised SalaryStructure in Module M9.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
              Final Appraisal Executive Comments
            </label>
            <textarea
              rows={3}
              value={finalComments}
              onChange={(e) => setFinalComments(e.target.value)}
              placeholder="Official comments shared with employee on performance closure..."
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
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
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow disabled:opacity-50"
            >
              <FileCheck className="h-4 w-4" />
              {isLoading ? 'Finalizing...' : 'Approve & Finalize'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


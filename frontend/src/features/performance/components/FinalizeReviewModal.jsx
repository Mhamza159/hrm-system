/**
 * @file FinalizeReviewModal.jsx
 * @description Modal for Super Admin & HR to finalize appraisals, approve ratings, and dispatch M9 Payroll salary increments.
 * Adheres strictly to Forest & Emerald design system (DESIGN.md & UI-REFERENCE.md).
 * 
 * SPECIFICATION:
 * - Module: M19 Performance & Appraisal (BUILD-GUIDE Section 22 · Row 19.7)
 */

import React, { useState, useEffect } from 'react';
import { X, Award, TrendingUp, FileCheck, Star, Loader2, ShieldCheck } from 'lucide-react';
import { useFinalizeReviewMutation } from '../performanceApi.js';
import { toast } from 'sonner';

export const FinalizeReviewModal = ({ isOpen, onClose, review }) => {
  const [finalizeReview, { isLoading }] = useFinalizeReviewMutation();

  const [finalRating, setFinalRating] = useState(4);
  const [approvedIncrementPercent, setApprovedIncrementPercent] = useState(5);
  const [finalComments, setFinalComments] = useState('');

  useEffect(() => {
    if (review && isOpen) {
      setFinalRating(
        review.finalAppraisal?.finalRating ||
          (review.managerReview?.calculatedScore
            ? Math.round(review.managerReview.calculatedScore)
            : 4)
      );
      setApprovedIncrementPercent(
        review.finalAppraisal?.approvedIncrementPercent ??
          (review.managerReview?.recommendedIncrementPercent ?? 5)
      );
      setFinalComments(review.finalAppraisal?.finalComments || '');
    }
  }, [review, isOpen]);

  if (!isOpen || !review) return null;

  const emp = review.employeeId;
  const selfScore = review.selfReview?.calculatedScore;
  const mgrScore = review.managerReview?.calculatedScore;

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
        `Appraisal finalized! Approved ${approvedIncrementPercent}% salary increment linked to Module M9 (Payroll).`
      );
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to finalize appraisal');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8 animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 p-6 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 shrink-0">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                Executive Appraisal Finalization
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Final executive sign-off for <strong className="text-slate-800 dark:text-slate-200">{emp?.firstName} {emp?.lastName}</strong> ({emp?.employeeCode})
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

        {/* Evaluation Summary Overview */}
        <div className="p-5 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 text-xs space-y-2.5">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <span className="text-slate-500">Staff Self-Score:</span>
              <span className="font-mono font-bold text-sky-600">
                {selfScore !== undefined ? `${selfScore} / 5` : 'Pending'}
              </span>
            </div>

            <div className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <span className="text-slate-500">Manager Evaluation:</span>
              <span className="font-mono font-bold text-amber-600">
                {mgrScore !== undefined ? `${mgrScore} / 5` : 'Pending'}
              </span>
            </div>
          </div>

          {review.managerReview?.recommendedIncrementPercent !== undefined && (
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
              <span className="text-emerald-800 dark:text-emerald-300 font-medium">
                Manager Recommendation:
              </span>
              <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">
                +{review.managerReview.recommendedIncrementPercent}% Salary Increment
              </span>
            </div>
          )}

          {review.managerReview?.recommendationNotes && (
            <p className="text-[11px] text-slate-500 italic px-1">
              Note: "{review.managerReview.recommendationNotes}"
            </p>
          )}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Official Final Rating */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Approved Official Performance Rating (1 to 5 Stars) <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setFinalRating(val)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold font-mono transition-all flex items-center justify-center gap-1 border ${
                    finalRating === val
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-600/20'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <Star className={`h-3.5 w-3.5 ${finalRating === val ? 'fill-white' : 'text-slate-400'}`} />
                  {val}
                </button>
              ))}
            </div>
          </div>

          {/* Approved Increment & Module M9 Linkage */}
          <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                Approved Salary Increment Percentage (%)
              </label>
              <div className="relative w-28">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  required
                  value={approvedIncrementPercent}
                  onChange={(e) => setApprovedIncrementPercent(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-mono font-bold rounded-lg border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-right pr-7"
                />
                <span className="absolute right-2.5 top-1.5 text-xs text-slate-400 font-bold pointer-events-none">
                  %
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2 text-[11px] text-emerald-800 dark:text-emerald-300 bg-white dark:bg-slate-900/60 p-2.5 rounded-lg border border-emerald-100 dark:border-emerald-800/80">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Automated Payroll Link (Module M9):</strong> If approved increment &gt; 0%, the domain service will automatically supersede the employee's current salary structure and instantiate an updated active structure with scaled basic & allowances.
              </span>
            </div>
          </div>

          {/* Executive Remarks */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Executive Review Comments & Feedback
            </label>
            <textarea
              rows={3}
              placeholder="Official comments accompanying this final appraisal determination..."
              value={finalComments}
              onChange={(e) => setFinalComments(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
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
                  Finalizing Appraisal...
                </>
              ) : (
                <>
                  <FileCheck className="h-3.5 w-3.5" />
                  Approve & Finalize Review
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

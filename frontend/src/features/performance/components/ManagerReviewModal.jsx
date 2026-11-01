/**
 * @file ManagerReviewModal.jsx
 * @description Modal for Department Managers to evaluate subordinates, input ratings, and recommend increments.
 * 
 * SPECIFICATION:
 * - Module: M19 Performance & Appraisal (BUILD-GUIDE Section 22 · Row 19.5)
 */

import React, { useState, useEffect } from 'react';
import { X, Award, CheckCircle2, TrendingUp, AlertCircle, Save } from 'lucide-react';
import { useSubmitManagerReviewMutation } from '../performanceApi.js';
import { toast } from 'sonner';

export const ManagerReviewModal = ({ isOpen, onClose, review }) => {
  const [submitManagerReview, { isLoading }] = useSubmitManagerReviewMutation();

  const [managerKpis, setManagerKpis] = useState({});
  const [managerGoals, setManagerGoals] = useState({});
  const [strengths, setStrengths] = useState('');
  const [improvements, setImprovements] = useState('');
  const [recommendedIncrementPercent, setRecommendedIncrementPercent] = useState(5);
  const [recommendationNotes, setRecommendationNotes] = useState('');

  useEffect(() => {
    if (review) {
      const initialKpi = {};
      review.kpis?.forEach((k) => {
        initialKpi[k._id] = {
          rating: k.managerRating || k.selfRating || 4,
          comments: k.managerComments || ''
        };
      });
      setManagerKpis(initialKpi);

      const initialGoal = {};
      review.goals?.forEach((g) => {
        initialGoal[g._id] = {
          rating: g.managerRating || g.selfRating || 4,
          comments: g.managerComments || ''
        };
      });
      setManagerGoals(initialGoal);

      setStrengths(review.managerReview?.strengths || '');
      setImprovements(review.managerReview?.improvements || '');
      setRecommendedIncrementPercent(review.managerReview?.recommendedIncrementPercent ?? 5);
      setRecommendationNotes(review.managerReview?.recommendationNotes || '');
    }
  }, [review, isOpen]);

  if (!isOpen || !review) return null;

  const handleKpiScore = (kpiId, rating) => {
    setManagerKpis({
      ...managerKpis,
      [kpiId]: { ...managerKpis[kpiId], rating }
    });
  };

  const handleKpiComment = (kpiId, comments) => {
    setManagerKpis({
      ...managerKpis,
      [kpiId]: { ...managerKpis[kpiId], comments }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payloadKpiRatings = review.kpis.map((k) => ({
      kpiId: k._id,
      rating: managerKpis[k._id]?.rating || 4,
      comments: managerKpis[k._id]?.comments || ''
    }));

    const payloadGoalRatings = (review.goals || []).map((g) => ({
      goalId: g._id,
      rating: managerGoals[g._id]?.rating || 4,
      comments: managerGoals[g._id]?.comments || ''
    }));

    try {
      await submitManagerReview({
        id: review._id,
        kpiRatings: payloadKpiRatings,
        goalRatings: payloadGoalRatings,
        strengths,
        improvements,
        recommendedIncrementPercent: Number(recommendedIncrementPercent) || 0,
        recommendationNotes
      }).unwrap();
      toast.success('Manager evaluation recorded successfully');
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to submit manager evaluation');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Manager Performance Evaluation
            </h2>
            <p className="text-xs text-slate-500">
              Evaluating {review.employeeId?.firstName} {review.employeeId?.lastName} · {review.designationId?.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Self-Score Preview */}
        <div className="px-6 py-3 bg-indigo-50/60 dark:bg-indigo-950/30 border-b border-indigo-100 dark:border-indigo-900 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-indigo-600" />
            <span className="font-semibold text-indigo-900 dark:text-indigo-300">
              Employee Self-Score: {review.selfReview?.calculatedScore || 'N/A'} / 5
            </span>
          </div>
          {review.selfReview?.overallSummary && (
            <span className="text-indigo-700 dark:text-indigo-400 italic truncate max-w-sm">
              "{review.selfReview.overallSummary}"
            </span>
          )}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* KPI Evaluations */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              KPI Metrics Scoring (1–5 Scale)
            </h3>

            {review.kpis?.map((kpi) => {
              const currentRating = managerKpis[kpi._id]?.rating || 4;
              const currentComments = managerKpis[kpi._id]?.comments || '';

              return (
                <div
                  key={kpi._id}
                  className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-4 space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">
                          {kpi.title}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          (Weight: {kpi.weightage}%)
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Target: {kpi.targetCriteria}
                      </p>
                      {kpi.selfRating && (
                        <p className="text-[11px] text-indigo-600 dark:text-indigo-400 mt-1">
                          Employee self-rating: {kpi.selfRating}/5 · Note: "{kpi.selfComments || 'None'}"
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {[1, 2, 3, 4, 5].map((score) => (
                        <button
                          key={score}
                          type="button"
                          onClick={() => handleKpiScore(kpi._id, score)}
                          className={`w-7 h-7 rounded text-xs font-bold transition-all ${
                            currentRating === score
                              ? 'bg-indigo-600 text-white shadow'
                              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-400'
                          }`}
                        >
                          {score}
                        </button>
                      ))}
                    </div>
                  </div>

                  <input
                    type="text"
                    placeholder="Manager justification / performance feedback..."
                    value={currentComments}
                    onChange={(e) => handleKpiComment(kpi._id, e.target.value)}
                    className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              );
            })}
          </div>

          {/* Qualitative Feedback */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                Demonstrated Strengths
              </label>
              <textarea
                rows={2}
                value={strengths}
                onChange={(e) => setStrengths(e.target.value)}
                placeholder="Key accomplishments and positive contributions..."
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                Areas for Improvement & Development
              </label>
              <textarea
                rows={2}
                value={improvements}
                onChange={(e) => setImprovements(e.target.value)}
                placeholder="Skills to develop or performance gaps..."
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Recommendation & Increment Suggestion */}
          <div className="rounded-lg bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 dark:text-emerald-300">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              Compensation & Promotion Recommendation (Linked to M9 Payroll)
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-emerald-800 dark:text-emerald-300 mb-1">
                  Recommended Increment %
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={recommendedIncrementPercent}
                    onChange={(e) => setRecommendedIncrementPercent(e.target.value)}
                    className="w-full rounded border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-800 pl-2.5 pr-6 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <span className="absolute right-2 top-1.5 text-xs text-slate-400">%</span>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-medium text-emerald-800 dark:text-emerald-300 mb-1">
                  Justification Notes for Super Admin
                </label>
                <input
                  type="text"
                  placeholder="e.g. Exceptional ownership of core backend services"
                  value={recommendationNotes}
                  onChange={(e) => setRecommendationNotes(e.target.value)}
                  className="w-full rounded border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {isLoading ? 'Saving Evaluation...' : 'Submit Manager Appraisal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


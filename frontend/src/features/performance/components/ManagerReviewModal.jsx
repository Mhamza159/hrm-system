/**
 * @file ManagerReviewModal.jsx
 * @description Modal for Department Managers to evaluate subordinates, input ratings, and recommend increments.
 * Adheres strictly to Forest & Emerald design system (DESIGN.md & UI-REFERENCE.md).
 * 
 * SPECIFICATION:
 * - Module: M19 Performance & Appraisal (BUILD-GUIDE Section 22 · Row 19.5)
 */

import React, { useState, useEffect, useMemo } from 'react';
import { X, TrendingUp, Save, Star, Loader2, User } from 'lucide-react';
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
    if (review && isOpen) {
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

  // Live dynamic weighted manager score calculation
  const calculatedManagerScore = useMemo(() => {
    if (!review?.kpis?.length) return 0;
    let totalScore = 0;
    let totalWeight = 0;

    review.kpis.forEach((k) => {
      const rating = managerKpis[k._id]?.rating || 4;
      totalScore += rating * k.weightage;
      totalWeight += k.weightage;
    });

    return totalWeight > 0 ? Number((totalScore / totalWeight).toFixed(2)) : 0;
  }, [review, managerKpis]);

  if (!isOpen || !review) return null;

  const emp = review.employeeId;

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
        managerKpiRatings: payloadKpiRatings,
        managerGoalRatings: payloadGoalRatings,
        strengths,
        improvements,
        recommendedIncrementPercent: Number(recommendedIncrementPercent) || 0,
        recommendationNotes
      }).unwrap();

      toast.success(
        `Manager review submitted for ${emp?.firstName} ${emp?.lastName} (Score: ${calculatedManagerScore}/5)`
      );
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to submit manager review');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-3xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8 animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 p-6 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Star className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                  Manager Appraisal & Scoring
                </h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300">
                  Calculated Score: {calculatedManagerScore} / 5
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Evaluating <span className="font-semibold text-slate-800 dark:text-slate-200">{emp?.firstName} {emp?.lastName}</span> ({emp?.employeeCode}) · {review.designationId?.title}
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
          <div className="p-6 space-y-6 max-h-[calc(85vh-160px)] overflow-y-auto">
            {/* Staff Self-Review Context Card */}
            {review.selfReview?.submitted ? (
              <div className="bg-sky-50/60 dark:bg-sky-950/30 rounded-xl p-4 border border-sky-200 dark:border-sky-800 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sky-900 dark:text-sky-300 flex items-center gap-1.5">
                    <User className="h-4 w-4 text-sky-600" />
                    Employee Self-Evaluation Summary
                  </span>
                  <span className="font-mono font-bold text-sky-800 dark:text-sky-300 bg-sky-100 dark:bg-sky-900/60 px-2.5 py-0.5 rounded-full">
                    Self Score: {review.selfReview.calculatedScore} / 5
                  </span>
                </div>
                {review.selfReview.overallSummary ? (
                  <p className="text-slate-600 dark:text-slate-300 italic pt-1 leading-relaxed">
                    "{review.selfReview.overallSummary}"
                  </p>
                ) : (
                  <p className="text-slate-400 italic">No overall remarks provided.</p>
                )}
              </div>
            ) : (
              <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                Notice: Employee has not submitted self-review yet. You are evaluating prior to self-submission cutoff.
              </div>
            )}

            {/* KPI Performance Metrics Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs uppercase tracking-wider font-bold text-slate-700 dark:text-slate-300">
                  Performance Rubric Evaluation ({review.kpis?.length || 0})
                </h3>
                <span className="text-xs text-slate-400">Score each metric 1 to 5</span>
              </div>

              <div className="space-y-4">
                {(review.kpis || []).map((kpi, idx) => {
                  const currentRating = managerKpis[kpi._id]?.rating || 4;
                  const currentComments = managerKpis[kpi._id]?.comments || '';

                  return (
                    <div
                      key={kpi._id}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="h-5 w-5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center text-xs font-mono font-bold">
                              {idx + 1}
                            </span>
                            <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                              {kpi.title}
                            </h4>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 pl-7 font-mono">
                            Target: {kpi.targetCriteria}
                          </div>
                        </div>

                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-mono font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shrink-0">
                          {kpi.weightage}% Weight
                        </span>
                      </div>

                      {/* Staff Self-Rating Callout */}
                      {kpi.selfRating && (
                        <div className="ml-7 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 text-[11px] flex items-center justify-between text-slate-600 dark:text-slate-300">
                          <span>Staff Self-Rating: <strong className="font-mono text-sky-600">{kpi.selfRating}/5</strong></span>
                          {kpi.selfComments && <span className="italic text-slate-400 truncate max-w-xs">"{kpi.selfComments}"</span>}
                        </div>
                      )}

                      {/* Manager Rating Stepper / Stars */}
                      <div className="ml-7 space-y-2">
                        <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                          Manager Score (1 - 5):
                        </label>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {[1, 2, 3, 4, 5].map((val) => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => handleKpiScore(kpi._id, val)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all flex items-center gap-1 border ${
                                currentRating === val
                                  ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                              }`}
                            >
                              <Star className={`h-3 w-3 ${currentRating === val ? 'fill-white' : 'text-slate-400'}`} />
                              {val}
                            </button>
                          ))}
                        </div>

                        <input
                          type="text"
                          placeholder="Manager remarks & observations for this metric..."
                          value={currentComments}
                          onChange={(e) => handleKpiComment(kpi._id, e.target.value)}
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 mt-2"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Qualitative Feedback */}
            <div className="space-y-4 pt-2">
              <h3 className="text-xs uppercase tracking-wider font-bold text-slate-700 dark:text-slate-300">
                Qualitative Assessment
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-emerald-800 dark:text-emerald-400 mb-1.5">
                    Key Strengths & Contributions
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Highlight core competencies, exemplary contributions, leadership moments..."
                    value={strengths}
                    onChange={(e) => setStrengths(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-amber-800 dark:text-amber-400 mb-1.5">
                    Areas for Growth & Improvement
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Constructive feedback, technical gaps to close, recommended training..."
                    value={improvements}
                    onChange={(e) => setImprovements(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Compensation Recommendation Section */}
            <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                  Recommended Performance Salary Increment (%)
                </span>
                <span className="font-mono font-bold text-sm text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-900 px-3 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  +{recommendedIncrementPercent}%
                </span>
              </div>

              <div className="space-y-2">
                <input
                  type="range"
                  min="0"
                  max="30"
                  step="1"
                  value={recommendedIncrementPercent}
                  onChange={(e) => setRecommendedIncrementPercent(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>0% (No change)</span>
                  <span>10%</span>
                  <span>20%</span>
                  <span>30% (High Performer)</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Recommendation Justification (For HR & Executive Approval)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Exceptional backend delivery; spearheaded high-throughput caching migration."
                  value={recommendationNotes}
                  onChange={(e) => setRecommendationNotes(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-emerald-200 dark:border-emerald-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 px-6 py-4 bg-slate-50/60 dark:bg-slate-800/40">
            <div className="text-xs">
              <span className="text-slate-500">Manager Final Score: </span>
              <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                {calculatedManagerScore} / 5 ⭐
              </span>
            </div>

            <div className="flex items-center gap-3">
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
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition-all shadow-sm shadow-amber-600/20 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Submitting Evaluation...
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5" />
                    Submit Manager Evaluation
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

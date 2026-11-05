/**
 * @file MyReviewPage.jsx
 * @description Employee self-appraisal view, KPI self-scoring, and goals editor.
 * 
 * SPECIFICATION:
 * - Module: M19 Performance & Appraisal (BUILD-GUIDE Section 22 · Row 19.4)
 */

import React, { useState } from 'react';
import { Target, CheckCircle2, Clock, AlertCircle, Send, Star, ShieldCheck } from 'lucide-react';
import { useGetReviewsQuery, useSubmitSelfReviewMutation } from '../performanceApi.js';
import { ScreenSkeleton } from '../../../components/common/ScreenSkeleton.jsx';
import { RefreshButton } from '../../../components/common/RefreshButton.jsx';
import { GoalsEditor } from '../components/GoalsEditor.jsx';
import { toast } from 'sonner';

export const MyReviewPage = () => {
  const { data: reviewsData, isLoading, isFetching, refetch } = useGetReviewsQuery();
  const reviews = reviewsData?.data || [];
  const activeReview = reviews[0]; // Primary active appraisal

  const [submitSelfReview, { isLoading: isSubmitting }] = useSubmitSelfReviewMutation();

  const [kpiRatings, setKpiRatings] = useState({});
  const [goalRatings, setGoalRatings] = useState({});
  const [overallSummary, setOverallSummary] = useState('');

  // Prepopulate ratings if review is already fetched
  React.useEffect(() => {
    if (activeReview) {
      const initialKpi = {};
      activeReview.kpis?.forEach((k) => {
        initialKpi[k._id] = { rating: k.selfRating || 4, comments: k.selfComments || '' };
      });
      setKpiRatings(initialKpi);

      const initialGoal = {};
      activeReview.goals?.forEach((g) => {
        initialGoal[g._id] = { rating: g.selfRating || 4, comments: g.selfComments || '' };
      });
      setGoalRatings(initialGoal);

      setOverallSummary(activeReview.selfReview?.overallSummary || '');
    }
  }, [activeReview]);

  if (isLoading && !reviewsData) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <ScreenSkeleton variant="cards" />
      </div>
    );
  }

  if (!activeReview) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 my-8">
        <Target className="mx-auto h-12 w-12 text-slate-400 mb-3" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">No Active Appraisal Review</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
          When an HR review cycle is launched, your personalized appraisal document will automatically appear here.
        </p>
      </div>
    );
  }

  const cycle = activeReview.cycleId;
  const isSubmitted = activeReview.selfReview?.submitted;
  const deadlinePassed = cycle?.selfReviewDeadline && new Date() > new Date(cycle.selfReviewDeadline);
  const isLocked = isSubmitted || deadlinePassed;

  const handleKpiScoreChange = (kpiId, rating) => {
    if (isLocked) return;
    setKpiRatings({
      ...kpiRatings,
      [kpiId]: { ...kpiRatings[kpiId], rating }
    });
  };

  const handleKpiCommentChange = (kpiId, comments) => {
    if (isLocked) return;
    setKpiRatings({
      ...kpiRatings,
      [kpiId]: { ...kpiRatings[kpiId], comments }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLocked) return;

    const payloadKpiRatings = activeReview.kpis.map((k) => ({
      kpiId: k._id,
      rating: kpiRatings[k._id]?.rating || 4,
      comments: kpiRatings[k._id]?.comments || ''
    }));

    const payloadGoalRatings = (activeReview.goals || []).map((g) => ({
      goalId: g._id,
      rating: goalRatings[g._id]?.rating || 4,
      comments: goalRatings[g._id]?.comments || ''
    }));

    try {
      await submitSelfReview({
        id: activeReview._id,
        kpiRatings: payloadKpiRatings,
        goalRatings: payloadGoalRatings,
        overallSummary
      }).unwrap();
      toast.success('Self-appraisal submitted successfully!');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to submit self-appraisal');
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Target className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              My Performance Appraisal
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {cycle?.title || 'Current Review Cycle'} · {activeReview.designationId?.title || 'Staff'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <RefreshButton onRefresh={refetch} isFetching={isFetching} />
          <span
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
              isSubmitted
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400'
                : deadlinePassed
                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-400'
                : 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400'
            }`}
          >
            {isSubmitted ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" /> Self-Review Submitted ({activeReview.selfReview?.calculatedScore}/5)
              </>
            ) : deadlinePassed ? (
              <>
                <AlertCircle className="h-3.5 w-3.5" /> Deadline Passed
              </>
            ) : (
              <>
                <Clock className="h-3.5 w-3.5" /> Self-Review Due:{' '}
                {new Date(cycle?.selfReviewDeadline).toLocaleDateString()}
              </>
            )}
          </span>
        </div>
      </div>

      {/* Final Score Banner if Completed */}
      {activeReview.status === 'Finalized' && activeReview.finalAppraisal && (
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-100 block">
              Official Approved Rating
            </span>
            <div className="text-3xl font-black mt-0.5 flex items-center gap-2">
              {activeReview.finalAppraisal.finalRating} / 5
              <span className="text-sm font-semibold opacity-90">
                (Score: {activeReview.finalAppraisal.finalScore})
              </span>
            </div>
            {activeReview.finalAppraisal.finalComments && (
              <p className="text-xs text-emerald-50 mt-1 max-w-xl">
                "{activeReview.finalAppraisal.finalComments}"
              </p>
            )}
          </div>
          {activeReview.finalAppraisal.approvedIncrementPercent > 0 && (
            <div className="text-right bg-white/20 px-4 py-2 rounded-lg backdrop-blur-sm">
              <span className="text-xs font-semibold block text-emerald-100">Approved Increment</span>
              <span className="text-2xl font-black">
                +{activeReview.finalAppraisal.approvedIncrementPercent}%
              </span>
            </div>
          )}
        </div>
      )}

      {/* Goals / OKRs Editor Component */}
      <GoalsEditor
        reviewId={activeReview._id}
        initialGoals={activeReview.goals}
        isLocked={isLocked}
      />

      {/* KPI Evaluation Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Designation KPIs Self-Evaluation
              </h2>
              <p className="text-xs text-slate-500">
                Rate your achievements on a 1–5 scale with supporting reflection notes.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {activeReview.kpis?.map((kpi) => {
              const currentRating = kpiRatings[kpi._id]?.rating || 4;
              const currentComments = kpiRatings[kpi._id]?.comments || '';

              return (
                <div
                  key={kpi._id}
                  className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-4 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {kpi.title}
                        </h4>
                        <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded">
                          Weight: {kpi.weightage}%
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        <span className="font-medium text-slate-600 dark:text-slate-400">Target:</span>{' '}
                        {kpi.targetCriteria}
                      </p>
                    </div>

                    {/* Star / Number Rating 1-5 */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {[1, 2, 3, 4, 5].map((score) => (
                        <button
                          key={score}
                          type="button"
                          disabled={isLocked}
                          onClick={() => handleKpiScoreChange(kpi._id, score)}
                          className={`w-8 h-8 rounded-lg font-bold text-xs flex items-center justify-center transition-all ${
                            currentRating === score
                              ? 'bg-indigo-600 text-white shadow-md scale-105'
                              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-400'
                          } disabled:opacity-60`}
                        >
                          {score}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Reflection Notes */}
                  <textarea
                    rows={2}
                    disabled={isLocked}
                    placeholder="Provide evidence, project accomplishments, or metrics achieved..."
                    value={currentComments}
                    onChange={(e) => handleKpiCommentChange(kpi._id, e.target.value)}
                    className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-60"
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Overall Summary Reflection */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Overall Performance Reflection & Highlights
          </label>
          <textarea
            rows={3}
            disabled={isLocked}
            placeholder="Summarize your key successes, areas where you contributed beyond standard expectations, and professional growth..."
            value={overallSummary}
            onChange={(e) => setOverallSummary(e.target.value)}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
          />
        </div>

        {/* Submit Actions */}
        {!isLocked && (
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-md disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {isSubmitting ? 'Submitting Evaluation...' : 'Submit Self-Appraisal'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};


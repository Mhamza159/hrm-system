/**
 * @file MyReviewPage.jsx
 * @description Employee self-appraisal view, KPI self-scoring, goals editor, and finalized scorecard portal.
 * Strictly adheres to Forest & Emerald design system (DESIGN.md & UI-REFERENCE.md).
 * 
 * SPECIFICATION:
 * - Module: M19 Performance & Appraisal (BUILD-GUIDE Section 22 · Row 19.4)
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Target, CheckCircle2, Clock, AlertCircle, Send, Star, ShieldCheck, Award, TrendingUp, Layers } from 'lucide-react';
import { useGetReviewsQuery, useSubmitSelfReviewMutation } from '../performanceApi.js';
import { ScreenSkeleton } from '../../../components/common/ScreenSkeleton.jsx';
import { RefreshButton } from '../../../components/common/RefreshButton.jsx';
import { GoalsEditor } from '../components/GoalsEditor.jsx';
import { ConfirmModal } from '../components/ConfirmModal.jsx';
import { toast } from 'sonner';

export const MyReviewPage = () => {
  const { data: reviewsData, isLoading, isFetching, refetch } = useGetReviewsQuery();
  const reviews = reviewsData?.data || [];
  const activeReview = reviews[0]; // Primary active/latest appraisal

  const [submitSelfReview, { isLoading: isSubmitting }] = useSubmitSelfReviewMutation();

  const [kpiRatings, setKpiRatings] = useState({});
  const [goalRatings, setGoalRatings] = useState({});
  const [overallSummary, setOverallSummary] = useState('');
  const [confirmSubmit, setConfirmSubmit] = useState(false);

  // Prepopulate ratings if review is already fetched
  useEffect(() => {
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

  // Live dynamic self-score calculation
  const calculatedSelfScore = useMemo(() => {
    if (!activeReview?.kpis?.length) return 0;
    let totalScore = 0;
    let totalWeight = 0;

    activeReview.kpis.forEach((k) => {
      const rating = kpiRatings[k._id]?.rating || 4;
      totalScore += rating * k.weightage;
      totalWeight += k.weightage;
    });

    return totalWeight > 0 ? Number((totalScore / totalWeight).toFixed(2)) : 0;
  }, [activeReview, kpiRatings]);

  if (isLoading && !reviewsData) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <ScreenSkeleton variant="cards" />
      </div>
    );
  }

  if (!activeReview) {
    return (
      <div className="p-8 max-w-3xl mx-auto text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 my-12 animate-in fade-in duration-150">
        <div className="h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 mx-auto flex items-center justify-center mb-3">
          <Target className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">No Active Appraisal Review</h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
          There are currently no active appraisal review cycles assigned to your profile. When HR launches a cycle for your department, your scorecard will appear here.
        </p>
      </div>
    );
  }

  const isSubmitted = Boolean(activeReview.selfReview?.submitted);
  const isFinalized = activeReview.status === 'Finalized';
  const cycle = activeReview.cycleId;

  const now = new Date();
  const deadline = cycle?.selfReviewDeadline ? new Date(cycle.selfReviewDeadline) : null;
  const isPastDeadline = deadline && now > deadline;
  const daysLeft = deadline ? Math.max(0, Math.ceil((deadline - now) / (1000 * 60 * 60 * 24))) : 0;

  const handleKpiScore = (kpiId, rating) => {
    if (isSubmitted || isFinalized) return;
    setKpiRatings({
      ...kpiRatings,
      [kpiId]: { ...kpiRatings[kpiId], rating }
    });
  };

  const handleKpiComment = (kpiId, comments) => {
    if (isSubmitted || isFinalized) return;
    setKpiRatings({
      ...kpiRatings,
      [kpiId]: { ...kpiRatings[kpiId], comments }
    });
  };

  const handleSubmitSelfReview = async () => {
    if (isPastDeadline) {
      toast.error('The self-review deadline for this cycle has passed');
      return;
    }

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

      toast.success(
        `Self-appraisal submitted successfully! (Calculated Score: ${calculatedSelfScore} / 5)`
      );
      setConfirmSubmit(false);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to submit self-review');
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                My Performance Appraisal
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Evaluate personal performance rubrics, track quarterly OKRs, and review manager feedback.
              </p>
            </div>
          </div>
        </div>

        <RefreshButton onRefresh={refetch} isFetching={isFetching} />
      </div>

      {/* Cycle Window & Deadline Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {cycle?.title || 'Performance Appraisal Cycle'}
            </h2>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300">
              Year {cycle?.periodYear}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
              <Layers className="h-3.5 w-3.5 text-emerald-600" />
              {activeReview.designationId?.title || 'Job Designation'}
            </span>
            <span>•</span>
            <span>Department: {activeReview.departmentId?.name || 'General'}</span>
          </div>
        </div>

        {/* Deadline Status Pill */}
        <div className="flex items-center gap-2">
          {isFinalized ? (
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4" /> Appraisal Finalized
            </span>
          ) : isSubmitted ? (
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300">
              <Clock className="h-4 w-4" /> Awaiting Manager Scoring
            </span>
          ) : isPastDeadline ? (
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300">
              <AlertCircle className="h-4 w-4" /> Deadline Passed ({deadline?.toLocaleDateString()})
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950/40 dark:text-sky-300">
              <Clock className="h-4 w-4" /> {daysLeft} Day{daysLeft !== 1 ? 's' : ''} Left to Submit Self-Appraisal
            </span>
          )}
        </div>
      </div>

      {/* STATE C: Finalized Scorecard Hero */}
      {isFinalized && (
        <div className="bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent rounded-2xl border border-emerald-200 dark:border-emerald-800/80 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs uppercase font-bold text-emerald-800 dark:text-emerald-300 tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Final Appraisal Determination
              </span>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                Evaluation Completed & Signed Off
              </h3>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-white dark:bg-slate-900 px-4 py-2 rounded-xl border border-emerald-200 dark:border-emerald-800 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Official Rating</span>
                <span className="text-lg font-bold font-mono text-emerald-700 dark:text-emerald-400">
                  {activeReview.finalAppraisal?.finalRating} / 5 ⭐
                </span>
              </div>

              {activeReview.finalAppraisal?.approvedIncrementPercent > 0 && (
                <div className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-center shadow-sm">
                  <span className="text-[10px] uppercase font-semibold opacity-80 block">Salary Increment</span>
                  <span className="text-lg font-bold font-mono flex items-center gap-0.5 justify-center">
                    <TrendingUp className="h-4 w-4" /> +{activeReview.finalAppraisal?.approvedIncrementPercent}%
                  </span>
                </div>
              )}
            </div>
          </div>

          {activeReview.finalAppraisal?.finalComments && (
            <div className="bg-white/80 dark:bg-slate-900/80 rounded-xl p-3.5 border border-emerald-100 dark:border-emerald-800/60 text-xs text-slate-700 dark:text-slate-300">
              <span className="font-semibold text-emerald-900 dark:text-emerald-300 block mb-1">
                Executive Comments:
              </span>
              "{activeReview.finalAppraisal.finalComments}"
            </div>
          )}
        </div>
      )}

      {/* STATE B: Awaiting Manager Review Callout */}
      {isSubmitted && !isFinalized && (
        <div className="bg-amber-50/70 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-800 p-5 flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 shrink-0">
            <Clock className="h-5 w-5" />
          </div>
          <div className="text-xs space-y-1">
            <h4 className="font-bold text-amber-900 dark:text-amber-200 text-sm">
              Self-Appraisal Submitted Successfully
            </h4>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Your self-evaluation (Calculated Self-Score: <strong className="font-mono text-emerald-700">{activeReview.selfReview?.calculatedScore} / 5</strong>) has been submitted to your reporting manager. Your manager will review these ratings and conduct an evaluation before executive sign-off.
            </p>
          </div>
        </div>
      )}

      {/* OKRs & Goals Management */}
      <GoalsEditor
        reviewId={activeReview._id}
        initialGoals={activeReview.goals}
        isLocked={isSubmitted || isFinalized || isPastDeadline}
      />

      {/* KPI Self-Evaluation Rubrics */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs uppercase tracking-wider font-bold text-slate-700 dark:text-slate-300">
              Designation Performance Rubric ({activeReview.kpis?.length || 0})
            </h3>
            <span className="text-[11px] text-slate-500">
              {isSubmitted || isFinalized
                ? 'Your submitted self-evaluations and manager ratings.'
                : 'Rate your performance on each metric from 1 to 5 stars.'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Calculated Self Score:</span>
            <span className="font-mono font-bold text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              {calculatedSelfScore} / 5 ⭐
            </span>
          </div>
        </div>

        <div className="space-y-4">
          {(activeReview.kpis || []).map((kpi, idx) => {
            const currentRating = kpiRatings[kpi._id]?.rating || 4;
            const currentComments = kpiRatings[kpi._id]?.comments || '';

            return (
              <div
                key={kpi._id}
                className="p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs space-y-3.5"
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
                    {kpi.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 pl-7">
                        {kpi.description}
                      </p>
                    )}
                  </div>

                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shrink-0">
                    {kpi.weightage}% Weight
                  </span>
                </div>

                <div className="ml-7 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs">
                  <span className="font-semibold text-slate-600 dark:text-slate-300 block mb-0.5">
                    Target Criteria:
                  </span>
                  <span className="text-slate-500 font-mono text-[11px]">{kpi.targetCriteria}</span>
                </div>

                {/* Rating Stepper / Controls */}
                <div className="ml-7 space-y-2 pt-1">
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    Your Self-Rating (1 to 5):
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[1, 2, 3, 4, 5].map((val) => (
                      <button
                        key={val}
                        type="button"
                        disabled={isSubmitted || isFinalized || isPastDeadline}
                        onClick={() => handleKpiScore(kpi._id, val)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all flex items-center gap-1 border ${
                          currentRating === val
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-60'
                        }`}
                      >
                        <Star className={`h-3 w-3 ${currentRating === val ? 'fill-white' : 'text-slate-400'}`} />
                        {val}
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    disabled={isSubmitted || isFinalized || isPastDeadline}
                    placeholder="Self-reflection remarks or evidence supporting this score..."
                    value={currentComments}
                    onChange={(e) => handleKpiComment(kpi._id, e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 mt-2 disabled:opacity-70"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Overall Summary Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs p-5 space-y-3">
        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
          Overall Self-Evaluation Summary & Major Accomplishments
        </label>
        <textarea
          rows={3}
          disabled={isSubmitted || isFinalized || isPastDeadline}
          placeholder="Summarize your key highlights, sprint contributions, and personal milestones over this appraisal cycle..."
          value={overallSummary}
          onChange={(e) => setOverallSummary(e.target.value)}
          className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:opacity-70"
        />
      </div>

      {/* Submit Action Bar */}
      {!isSubmitted && !isFinalized && !isPastDeadline && (
        <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs text-slate-500">
            Calculated Self Score: <strong className="font-mono text-emerald-700 dark:text-emerald-400">{calculatedSelfScore} / 5 ⭐</strong>
          </div>

          <button
            type="button"
            onClick={() => setConfirmSubmit(true)}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all shadow-sm shadow-emerald-600/20"
          >
            <Send className="h-4 w-4" /> Submit Self-Appraisal
          </button>
        </div>
      )}

      {/* Submission Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmSubmit}
        onClose={() => setConfirmSubmit(false)}
        onConfirm={handleSubmitSelfReview}
        title="Submit Self-Appraisal"
        description="Are you sure you want to submit your self-evaluation? Once submitted, your scores and goals will lock and advance to your reporting manager for evaluation."
        confirmText="Confirm & Submit"
        variant="emerald"
        isLoading={isSubmitting}
      />
    </div>
  );
};

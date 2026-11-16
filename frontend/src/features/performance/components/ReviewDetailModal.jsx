/**
 * @file ReviewDetailModal.jsx
 * @description Comprehensive read-only scorecard modal for employee performance appraisals.
 * Displays KPI scorecards, OKRs, 360 peer feedback, and final executive sign-off with M9 Payroll linkage.
 * Adheres strictly to Forest & Emerald design system (DESIGN.md & UI-REFERENCE.md).
 */

import React, { useState } from 'react';
import { Award, X, Target, CheckCircle2, Clock, TrendingUp, MessageSquare, ShieldCheck, Star } from 'lucide-react';
import { Can } from '../../../components/common/Can.jsx';

export const ReviewDetailModal = ({
  isOpen,
  onClose,
  review,
  onOpenManagerReview,
  onOpenFinalize,
  onOpenPeerFeedback
}) => {
  const [activeTab, setActiveTab] = useState('scorecard'); // 'scorecard' | 'goals' | 'peer' | 'summary'

  if (!isOpen || !review) return null;

  const emp = review.employeeId;
  const selfScore = review.selfReview?.calculatedScore;
  const mgrScore = review.managerReview?.calculatedScore;
  const finalRating = review.finalAppraisal?.finalRating;
  const approvedIncrement = review.finalAppraisal?.approvedIncrementPercent;
  const recommendedIncrement = review.managerReview?.recommendedIncrementPercent;

  const getStatusBadge = () => {
    switch (review.status) {
      case 'Finalized':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
            <CheckCircle2 className="h-3 w-3" /> Finalized & Signed Off
          </span>
        );
      case 'Ready_For_Finalization':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800">
            <Award className="h-3 w-3" /> Ready for Executive Sign-off
          </span>
        );
      case 'Manager_Review':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
            <Clock className="h-3 w-3" /> Manager Review Pending
          </span>
        );
      case 'Active':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800">
            <Clock className="h-3 w-3" /> Self-Review Pending
          </span>
        );
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
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold text-lg border border-emerald-200/80 dark:border-emerald-800 shrink-0 uppercase">
              {emp?.firstName?.[0] || 'E'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                  {emp?.firstName} {emp?.lastName}
                </h2>
                {getStatusBadge()}
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                <span className="font-mono text-slate-600 dark:text-slate-300">{emp?.employeeCode}</span>
                <span>•</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {review.designationId?.title || 'Designation'}
                </span>
                <span>•</span>
                <span className="text-slate-500">
                  {review.departmentId?.name || 'Department'}
                </span>
                <span>•</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                  {review.cycleId?.title}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <button
            onClick={() => setActiveTab('scorecard')}
            className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'scorecard'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            KPI Scorecard ({review.kpis?.length || 0})
          </button>

          <button
            onClick={() => setActiveTab('goals')}
            className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'goals'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Goals & OKRs ({review.goals?.length || 0})
          </button>

          <button
            onClick={() => setActiveTab('peer')}
            className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'peer'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            360° Peer Feedback ({review.peerFeedbacks?.length || 0})
          </button>

          <button
            onClick={() => setActiveTab('summary')}
            className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'summary'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Evaluation Summary
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-6 max-h-[calc(85vh-200px)] overflow-y-auto">
          {/* TAB 1: KPI Scorecard */}
          {activeTab === 'scorecard' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-500 uppercase tracking-wider">
                  Assigned Performance Criteria & Ratings
                </span>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sky-600 dark:text-sky-400">
                    Self Score: {selfScore !== undefined ? `${selfScore}/5` : 'Pending'}
                  </span>
                  <span className="font-mono text-amber-600 dark:text-amber-400">
                    Manager Score: {mgrScore !== undefined ? `${mgrScore}/5` : 'Pending'}
                  </span>
                </div>
              </div>

              <div className="space-y-3.5">
                {(review.kpis || []).map((kpi, idx) => (
                  <div
                    key={idx}
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
                        {kpi.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 pl-7">
                            {kpi.description}
                          </p>
                        )}
                      </div>

                      <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-mono font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shrink-0">
                        {kpi.weightage}% Weight
                      </span>
                    </div>

                    <div className="ml-7 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs">
                      <span className="font-semibold text-slate-600 dark:text-slate-300 block mb-0.5">
                        Target Criteria:
                      </span>
                      <span className="text-slate-500 font-mono text-[11px]">{kpi.targetCriteria}</span>
                    </div>

                    {/* Score comparison grid */}
                    <div className="ml-7 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {/* Self Rating */}
                      <div className="p-2.5 rounded-lg border border-sky-100 dark:border-sky-950/60 bg-sky-50/40 dark:bg-sky-950/20 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sky-900 dark:text-sky-300">Staff Self-Rating:</span>
                          <span className="font-mono font-bold text-sky-700 dark:text-sky-400">
                            {kpi.selfRating ? `${kpi.selfRating} / 5 ⭐` : 'Not submitted'}
                          </span>
                        </div>
                        {kpi.selfComments && (
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 italic">
                            "{kpi.selfComments}"
                          </p>
                        )}
                      </div>

                      {/* Manager Rating */}
                      <div className="p-2.5 rounded-lg border border-amber-100 dark:border-amber-950/60 bg-amber-50/40 dark:bg-amber-950/20 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-amber-900 dark:text-amber-300">Manager Rating:</span>
                          <span className="font-mono font-bold text-amber-700 dark:text-amber-400">
                            {kpi.managerRating ? `${kpi.managerRating} / 5 ⭐` : 'Pending'}
                          </span>
                        </div>
                        {kpi.managerComments && (
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 italic">
                            "{kpi.managerComments}"
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: Goals & OKRs */}
          {activeTab === 'goals' && (
            <div className="space-y-4">
              {review.goals?.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-6">
                  <Target className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">No quarterly goals were defined for this appraisal period.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {review.goals.map((goal, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                          {goal.title}
                        </h4>
                        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          Target: {goal.targetValue}
                        </span>
                      </div>
                      {goal.description && (
                        <p className="text-xs text-slate-500">{goal.description}</p>
                      )}
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-sky-600">
                          Self: {goal.selfRating ? `${goal.selfRating}/5` : '—'}
                        </span>
                        <span className="text-amber-600">
                          Manager: {goal.managerRating ? `${goal.managerRating}/5` : '—'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: 360 Peer Feedback */}
          {activeTab === 'peer' && (
            <div className="space-y-4">
              {review.peerFeedbacks?.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-6">
                  <MessageSquare className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">No 360° peer feedback has been requested yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {review.peerFeedbacks.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <ShieldCheck className="h-4 w-4 text-emerald-600" />
                          Confidential Peer Review #{idx + 1}
                        </span>
                        <span className="font-mono font-bold text-xs text-emerald-700">
                          {item.submitted ? `${item.rating} / 5 ⭐` : 'Pending Response'}
                        </span>
                      </div>
                      {item.comments ? (
                        <p className="text-xs text-slate-600 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                          "{item.comments}"
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Evaluation Summary */}
          {activeTab === 'summary' && (
            <div className="space-y-4">
              {/* Scorecard Hero */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900 rounded-xl p-3">
                  <span className="text-[10px] text-sky-700 dark:text-sky-300 uppercase font-semibold block">Self Score</span>
                  <span className="text-xl font-bold font-mono text-sky-900 dark:text-white mt-1 block">
                    {selfScore !== undefined ? `${selfScore}` : '—'}
                  </span>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900 rounded-xl p-3">
                  <span className="text-[10px] text-amber-700 dark:text-amber-300 uppercase font-semibold block">Manager Score</span>
                  <span className="text-xl font-bold font-mono text-amber-900 dark:text-white mt-1 block">
                    {mgrScore !== undefined ? `${mgrScore}` : '—'}
                  </span>
                </div>

                <div className="bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900 rounded-xl p-3">
                  <span className="text-[10px] text-purple-700 dark:text-purple-300 uppercase font-semibold block">Rec. Increment</span>
                  <span className="text-xl font-bold font-mono text-purple-900 dark:text-white mt-1 block">
                    {recommendedIncrement !== undefined ? `+${recommendedIncrement}%` : '—'}
                  </span>
                </div>

                <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900 rounded-xl p-3">
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-300 uppercase font-semibold block">Final Rating</span>
                  <span className="text-xl font-bold font-mono text-emerald-900 dark:text-white mt-1 block">
                    {finalRating ? `${finalRating} / 5` : 'Pending'}
                  </span>
                </div>
              </div>

              {/* Manager Feedback */}
              {review.managerReview?.submitted && (
                <div className="space-y-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    Manager Qualitative Feedback
                  </h4>

                  {review.managerReview.strengths && (
                    <div className="text-xs">
                      <span className="font-semibold text-emerald-700 block mb-0.5">Key Strengths:</span>
                      <p className="text-slate-600 dark:text-slate-400 pl-2 border-l-2 border-emerald-500">
                        {review.managerReview.strengths}
                      </p>
                    </div>
                  )}

                  {review.managerReview.improvements && (
                    <div className="text-xs">
                      <span className="font-semibold text-amber-700 block mb-0.5">Areas for Development:</span>
                      <p className="text-slate-600 dark:text-slate-400 pl-2 border-l-2 border-amber-500">
                        {review.managerReview.improvements}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Final Appraisal & M9 Payroll Linkage */}
              {review.status === 'Finalized' && (
                <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-emerald-600" />
                      Executive Appraisal Decision
                    </span>
                    {approvedIncrement > 0 && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                        <TrendingUp className="h-3.5 w-3.5" /> +{approvedIncrement}% Approved Salary Increment
                      </span>
                    )}
                  </div>

                  {review.finalAppraisal?.finalComments && (
                    <p className="text-xs text-slate-700 dark:text-slate-300">
                      "{review.finalAppraisal.finalComments}"
                    </p>
                  )}

                  {review.finalAppraisal?.salaryRevisionId && (
                    <p className="text-[11px] text-emerald-800 dark:text-emerald-400 font-mono mt-1">
                      ✓ Module M9 Payroll Salary Structure updated (Revision ID: {review.finalAppraisal.salaryRevisionId})
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 px-6 py-4 bg-slate-50/60 dark:bg-slate-800/40">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            <Can perform="performance.peer.manage">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPeerFeedback?.(review);
                }}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Request Peer
              </button>
            </Can>

            {review.status !== 'Finalized' && (
              <Can perform="performance.review.submit">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenManagerReview?.(review);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition-colors shadow-sm"
                >
                  <Star className="h-3.5 w-3.5" />
                  Evaluate Subordinate
                </button>
              </Can>
            )}

            {review.status !== 'Finalized' && (
              <Can perform="performance.review.finalize">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenFinalize?.(review);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors shadow-sm"
                >
                  <Award className="h-3.5 w-3.5" />
                  Finalize Review
                </button>
              </Can>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

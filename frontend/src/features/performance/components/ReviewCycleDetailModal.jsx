/**
 * @file ReviewCycleDetailModal.jsx
 * @description Inspection modal for Review Cycles displaying period, dual deadlines, and status telemetry.
 * Adheres strictly to Forest & Emerald design system (DESIGN.md).
 */

import React from 'react';
import { Calendar, X, Users, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Can } from '../../../components/common/Can.jsx';

export const ReviewCycleDetailModal = ({ isOpen, onClose, cycle, onStatusToggle }) => {
  const navigate = useNavigate();
  if (!isOpen || !cycle) return null;

  const isClosed = cycle.status === 'Closed';
  const totalReviews = cycle.totalReviewsCount || 0;
  const completedReviews = cycle.completedReviewsCount || 0;
  const pendingReviews = Math.max(0, totalReviews - completedReviews);
  const completionPercent = totalReviews > 0 ? Math.round((completedReviews / totalReviews) * 100) : 0;

  const now = new Date();
  const selfDeadline = new Date(cycle.selfReviewDeadline);
  const mgrDeadline = new Date(cycle.managerReviewDeadline);
  const isPastSelf = now > selfDeadline;
  const isPastMgr = now > mgrDeadline;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8 animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 p-6 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 shrink-0">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                  {cycle.title}
                </h2>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                    cycle.status === 'Active'
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${cycle.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                  {cycle.status} Cycle
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 capitalize">
                Period: {cycle.periodType} {cycle.periodQuarter !== 'None' ? `· ${cycle.periodQuarter}` : ''} {cycle.periodYear}
              </p>
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

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[calc(85vh-160px)] overflow-y-auto">
          {/* Progress Overview Banner */}
          <div className="bg-slate-50/70 dark:bg-slate-800/40 rounded-xl p-4 border border-slate-200 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Users className="h-4 w-4 text-emerald-600" />
                Organizational Review Completion
              </span>
              <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 text-sm">
                {completionPercent}%
              </span>
            </div>

            <div className="h-2.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                style={{ width: `${completionPercent}%` }}
              />
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 text-center text-xs">
              <div className="bg-white dark:bg-slate-800/80 rounded-lg p-2 border border-slate-100 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Reviews</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">{totalReviews}</span>
              </div>
              <div className="bg-white dark:bg-slate-800/80 rounded-lg p-2 border border-slate-100 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Completed</span>
                <span className="font-mono font-bold text-emerald-600 text-sm">{completedReviews}</span>
              </div>
              <div className="bg-white dark:bg-slate-800/80 rounded-lg p-2 border border-slate-100 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">In Progress</span>
                <span className="font-mono font-bold text-amber-600 text-sm">{pendingReviews}</span>
              </div>
            </div>
          </div>

          {/* Timeline & Deadlines */}
          <div className="space-y-3">
            <h3 className="text-xs uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">
              Appraisal Cycle Milestones & Deadlines
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Duration Box */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 block">Cycle Operational Window</span>
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {new Date(cycle.startDate).toLocaleDateString()} — {new Date(cycle.endDate).toLocaleDateString()}
                </div>
                <span className="text-[10px] text-slate-400 block">General evaluation active dates</span>
              </div>

              {/* Self-Review Deadline */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-400">Employee Self-Review Deadline</span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      isPastSelf
                        ? 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400'
                        : 'bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950/40 dark:text-sky-400'
                    }`}
                  >
                    {isPastSelf ? 'Deadline Passed' : 'Active'}
                  </span>
                </div>
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {selfDeadline.toLocaleDateString()}
                </div>
                <span className="text-[10px] text-slate-400 block">Self-evaluations lock after this date</span>
              </div>

              {/* Manager Review Deadline */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-1 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-400">Manager Evaluation Deadline</span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      isPastMgr
                        ? 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400'
                    }`}
                  >
                    {isPastMgr ? 'Deadline Passed' : 'Active'}
                  </span>
                </div>
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {mgrDeadline.toLocaleDateString()}
                </div>
                <span className="text-[10px] text-slate-400 block">
                  Reporting managers must finalize ratings and recommendations by this cutoff
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 px-6 py-4 bg-slate-50/60 dark:bg-slate-800/40">
          <Can perform="performance.cycle.manage">
            <button
              type="button"
              onClick={() => {
                onClose();
                onStatusToggle?.(cycle);
              }}
              className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors border ${
                isClosed
                  ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                  : 'text-rose-700 bg-rose-50 hover:bg-rose-100 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
              }`}
            >
              {isClosed ? 'Reopen Cycle' : 'Close Cycle'}
            </button>
          </Can>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Close
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                navigate(`/performance/cycles/${cycle._id}/progress`);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors shadow-sm"
            >
              <BarChart3 className="h-3.5 w-3.5" />
              View Telemetry Progress
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

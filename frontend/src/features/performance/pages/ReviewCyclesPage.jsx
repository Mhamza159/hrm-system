/**
 * @file ReviewCyclesPage.jsx
 * @description Review Cycles management & launch orchestrator page for HR and Super Admin.
 * 
 * SPECIFICATION:
 * - Module: M19 Performance & Appraisal (BUILD-GUIDE Section 22 · Rows 19.2 & 19.9)
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, PlayCircle, BarChart3, CheckCircle2, Clock, AlertTriangle, Users, ChevronRight } from 'lucide-react';
import { useGetReviewCyclesQuery, useUpdateCycleStatusMutation } from '../performanceApi.js';
import { ReviewCycleModal } from '../components/ReviewCycleModal.jsx';
import { Can } from '../../../components/common/Can.jsx';
import { ScreenSkeleton } from '../../../components/common/ScreenSkeleton.jsx';
import { RefreshButton } from '../../../components/common/RefreshButton.jsx';
import { toast } from 'sonner';

export const ReviewCyclesPage = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: cyclesData, isLoading, isFetching, refetch } = useGetReviewCyclesQuery();
  const cycles = cyclesData?.data || [];

  const [updateCycleStatus] = useUpdateCycleStatusMutation();

  if (isLoading && !cyclesData) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <ScreenSkeleton variant="cards" />
      </div>
    );
  }

  const handleStatusToggle = async (cycle) => {
    const nextStatus = cycle.status === 'Active' ? 'Closed' : 'Active';
    if (window.confirm(`Are you sure you want to change cycle "${cycle.title}" to ${nextStatus}?`)) {
      try {
        await updateCycleStatus({ id: cycle._id, status: nextStatus }).unwrap();
        toast.success(`Cycle marked as ${nextStatus}`);
      } catch (err) {
        toast.error(err?.data?.message || 'Failed to update cycle status');
      }
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Appraisal Review Cycles</h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Orchestrate enterprise appraisal timelines, monitor self & manager evaluation deadlines, and track completion.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <RefreshButton onRefresh={refetch} isFetching={isFetching} />
          <Can perform="performance.cycle.manage">
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
            >
              <PlayCircle className="h-4 w-4" /> Launch New Cycle
            </button>
          </Can>
        </div>
      </div>

      {/* Cycles List */}
      {isLoading ? (
        <div className="text-center py-12 text-slate-500">Loading Review Cycles...</div>
      ) : cycles.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 p-8">
          <Calendar className="mx-auto h-12 w-12 text-slate-400 mb-3" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">No Appraisal Cycles Active</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Launch your company's quarterly or annual performance review cycle to automatically instantiate staff reviews.
          </p>
          <Can perform="performance.cycle.manage">
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold"
            >
              <PlayCircle className="h-4 w-4" /> Launch First Cycle
            </button>
          </Can>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {cycles.map((cycle) => {
            const isClosed = cycle.status === 'Closed';
            const completionPercent = cycle.totalReviewsCount > 0
              ? Math.round((cycle.completedReviewsCount / cycle.totalReviewsCount) * 100)
              : 0;

            return (
              <div
                key={cycle._id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 flex flex-col justify-between hover:border-indigo-300 dark:hover:border-indigo-700 transition-all space-y-5"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        {cycle.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                        {cycle.periodType} {cycle.periodQuarter !== 'None' ? `· ${cycle.periodQuarter}` : ''} {cycle.periodYear}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        cycle.status === 'Active'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400'
                          : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {cycle.status === 'Active' ? <Clock className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                      {cycle.status}
                    </span>
                  </div>

                  {/* Deadlines Box */}
                  <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 my-4 text-xs">
                    <div>
                      <span className="block text-slate-400 font-medium">Self-Review Deadline:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {new Date(cycle.selfReviewDeadline).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="block text-slate-400 font-medium">Manager Deadline:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {new Date(cycle.managerReviewDeadline).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Progress Stats */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-indigo-500" />
                        Completion: {cycle.completedReviewsCount || 0} of {cycle.totalReviewsCount || 0} reviews
                      </span>
                      <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {completionPercent}%
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                        style={{ width: `${completionPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                  <Can perform="performance.cycle.manage">
                    <button
                      onClick={() => handleStatusToggle(cycle)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                        isClosed
                          ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400'
                          : 'text-rose-700 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400'
                      }`}
                    >
                      {isClosed ? 'Reopen Cycle' : 'Close Cycle'}
                    </button>
                  </Can>

                  <button
                    onClick={() => navigate(`/performance/cycles/${cycle._id}/progress`)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 ml-auto"
                  >
                    <BarChart3 className="h-3.5 w-3.5" /> View Metrics & Progress <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cycle Modal */}
      <ReviewCycleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};


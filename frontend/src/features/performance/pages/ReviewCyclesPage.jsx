/**
 * @file ReviewCyclesPage.jsx
 * @description Review Cycles management & launch orchestrator page for HR and Super Admin.
 * Strictly adheres to Forest & Emerald design system (DESIGN.md & UI-REFERENCE.md).
 * 
 * SPECIFICATION:
 * - Module: M19 Performance & Appraisal (BUILD-GUIDE Section 22 · Rows 19.2 & 19.9)
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, PlayCircle, BarChart3, CheckCircle2, Clock, Users, Search, Filter } from 'lucide-react';
import { useGetReviewCyclesQuery, useUpdateCycleStatusMutation } from '../performanceApi.js';
import { ReviewCycleModal } from '../components/ReviewCycleModal.jsx';
import { ReviewCycleDetailModal } from '../components/ReviewCycleDetailModal.jsx';
import { ConfirmModal } from '../components/ConfirmModal.jsx';
import { Can } from '../../../components/common/Can.jsx';
import { ScreenSkeleton } from '../../../components/common/ScreenSkeleton.jsx';
import { RefreshButton } from '../../../components/common/RefreshButton.jsx';
import { toast } from 'sonner';

export const ReviewCyclesPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'Active' | 'Closed'
  const [yearFilter, setYearFilter] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCycleForDetail, setSelectedCycleForDetail] = useState(null);
  const [statusConfirm, setStatusConfirm] = useState({ isOpen: false, cycle: null, nextStatus: '' });

  const { data: cyclesData, isLoading, isFetching, refetch } = useGetReviewCyclesQuery({
    status: statusFilter === 'all' ? undefined : statusFilter,
    periodYear: yearFilter ? parseInt(yearFilter, 10) : undefined
  });
  const cycles = cyclesData?.data || [];

  const [updateCycleStatus, { isLoading: isUpdatingStatus }] = useUpdateCycleStatusMutation();

  // Aggregate stats
  const stats = useMemo(() => {
    const total = cycles.length;
    const active = cycles.filter((c) => c.status === 'Active').length;
    const closed = cycles.filter((c) => c.status === 'Closed').length;
    const totalReviews = cycles.reduce((acc, c) => acc + (c.totalReviewsCount || 0), 0);
    const completedReviews = cycles.reduce((acc, c) => acc + (c.completedReviewsCount || 0), 0);
    const avgCompletion = totalReviews > 0 ? Math.round((completedReviews / totalReviews) * 100) : 0;

    return { total, active, closed, totalReviews, completedReviews, avgCompletion };
  }, [cycles]);

  if (isLoading && !cyclesData) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <ScreenSkeleton variant="cards" />
      </div>
    );
  }

  const filteredCycles = cycles.filter((c) => {
    if (!search.trim()) return true;
    return c.title.toLowerCase().includes(search.toLowerCase());
  });

  const handleStatusTogglePrompt = (cycle) => {
    const nextStatus = cycle.status === 'Active' ? 'Closed' : 'Active';
    setStatusConfirm({
      isOpen: true,
      cycle,
      nextStatus
    });
  };

  const handleConfirmStatusChange = async () => {
    if (!statusConfirm.cycle) return;
    try {
      await updateCycleStatus({ id: statusConfirm.cycle._id, status: statusConfirm.nextStatus }).unwrap();
      toast.success(`Appraisal cycle marked as ${statusConfirm.nextStatus}`);
      setStatusConfirm({ isOpen: false, cycle: null, nextStatus: '' });
      setSelectedCycleForDetail(null);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to update cycle status');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Appraisal Review Cycles
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Orchestrate organization-wide evaluation timelines, monitor self & manager deadlines, and track completion telemetry.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <RefreshButton onRefresh={refetch} isFetching={isFetching} />

          <Can perform="performance.cycle.manage">
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-all shadow-sm shadow-emerald-600/20 active:scale-95"
            >
              <PlayCircle className="h-4 w-4" /> Launch New Cycle
            </button>
          </Can>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Total Cycles
            </span>
            <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400">
              <Calendar className="h-4 w-4" />
            </span>
          </div>
          <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1.5 block">
            {stats.total}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">{stats.closed} cycles archived</span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Active Cycles
            </span>
            <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400">
              <Clock className="h-4 w-4" />
            </span>
          </div>
          <span className="text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-1.5 block">
            {stats.active}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Ongoing evaluations</span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Total Reviews
            </span>
            <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400">
              <Users className="h-4 w-4" />
            </span>
          </div>
          <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1.5 block">
            {stats.totalReviews}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">{stats.completedReviews} completed</span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Avg Completion
            </span>
            <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
            </span>
          </div>
          <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1.5 block">
            {stats.avgCompletion}%
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Across all active cycles</span>
        </div>
      </div>

      {/* Filter & Control Bar */}
      <div className="flex flex-col md:flex-row items-center gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search review cycles by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50/70 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <Filter className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-40 py-2 px-3 text-xs bg-slate-50/70 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="all">All Status</option>
              <option value="Active">Active Cycles</option>
              <option value="Closed">Closed Cycles</option>
            </select>
          </div>

          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="w-full sm:w-36 py-2 px-3 text-xs bg-slate-50/70 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          >
            <option value="">All Years</option>
            <option value="2027">2027</option>
            <option value="2026">2026</option>
            <option value="2025">2025</option>
          </select>

          {(search || statusFilter !== 'all' || yearFilter) && (
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('all');
                setYearFilter('');
              }}
              className="px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors shrink-0"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Cycles Grid */}
      {filteredCycles.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-8">
          <div className="h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 mx-auto flex items-center justify-center mb-3">
            <Calendar className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            No Appraisal Cycles Found
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
            Launch your company's quarterly or annual performance review cycle to automatically instantiate staff review instances.
          </p>
          <Can perform="performance.cycle.manage">
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors"
            >
              <PlayCircle className="h-4 w-4" /> Launch First Cycle
            </button>
          </Can>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredCycles.map((cycle) => {
            const isClosed = cycle.status === 'Closed';
            const total = cycle.totalReviewsCount || 0;
            const completed = cycle.completedReviewsCount || 0;
            const completionPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

            const now = new Date();
            const selfDeadline = new Date(cycle.selfReviewDeadline);
            const isPastSelf = now > selfDeadline;

            return (
              <div
                key={cycle._id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-800/80 transition-all p-5 flex flex-col justify-between space-y-4 group"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h3
                        onClick={() => setSelectedCycleForDetail(cycle)}
                        className="text-base font-bold text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                      >
                        {cycle.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 capitalize mt-0.5">
                        {cycle.periodType} {cycle.periodQuarter !== 'None' ? `· ${cycle.periodQuarter}` : ''} {cycle.periodYear}
                      </p>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border shrink-0 ${
                        cycle.status === 'Active'
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${cycle.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      {cycle.status}
                    </span>
                  </div>

                  {/* Deadlines Box */}
                  <div className="grid grid-cols-2 gap-3 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl p-3 text-xs border border-slate-100 dark:border-slate-800/60 my-3">
                    <div>
                      <span className="block text-[11px] text-slate-400 font-medium">Self-Review Cutoff:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 flex items-center gap-1">
                        <Clock className={`h-3 w-3 ${isPastSelf ? 'text-rose-500' : 'text-emerald-600'}`} />
                        {selfDeadline.toLocaleDateString()}
                      </span>
                    </div>

                    <div>
                      <span className="block text-[11px] text-slate-400 font-medium">Manager Cutoff:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-slate-400" />
                        {new Date(cycle.managerReviewDeadline).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Progress Meter */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                        <Users className="h-3.5 w-3.5 text-emerald-600" />
                        Completion: {completed} of {total} reviews
                      </span>
                      <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        {completionPercent}%
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                        style={{ width: `${completionPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/80">
                  <Can perform="performance.cycle.manage">
                    <button
                      onClick={() => handleStatusTogglePrompt(cycle)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors border ${
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
                      onClick={() => setSelectedCycleForDetail(cycle)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      View Details
                    </button>

                    <button
                      onClick={() => navigate(`/performance/cycles/${cycle._id}/progress`)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-semibold transition-colors"
                    >
                      <BarChart3 className="h-3.5 w-3.5" /> Telemetry
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cycle Detail Modal */}
      <ReviewCycleDetailModal
        isOpen={Boolean(selectedCycleForDetail)}
        onClose={() => setSelectedCycleForDetail(null)}
        cycle={selectedCycleForDetail}
        onStatusToggle={handleStatusTogglePrompt}
      />

      {/* Create Cycle Modal */}
      <ReviewCycleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {/* Status Change Confirm Modal */}
      <ConfirmModal
        isOpen={statusConfirm.isOpen}
        onClose={() => setStatusConfirm({ isOpen: false, cycle: null, nextStatus: '' })}
        onConfirm={handleConfirmStatusChange}
        title={`${statusConfirm.nextStatus === 'Closed' ? 'Close' : 'Reopen'} Appraisal Review Cycle`}
        description={
          statusConfirm.nextStatus === 'Closed'
            ? `Are you sure you want to close "${statusConfirm.cycle?.title}"? Closed cycles prevent further review submissions.`
            : `Are you sure you want to reopen "${statusConfirm.cycle?.title}"? Reviews in this cycle will be reactivated.`
        }
        confirmText={statusConfirm.nextStatus === 'Closed' ? 'Close Cycle' : 'Reopen Cycle'}
        variant={statusConfirm.nextStatus === 'Closed' ? 'warning' : 'emerald'}
        isLoading={isUpdatingStatus}
      />
    </div>
  );
};

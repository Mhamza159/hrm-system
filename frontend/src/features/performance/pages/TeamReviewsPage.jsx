/**
 * @file TeamReviewsPage.jsx
 * @description Subordinates performance review queue for Department Managers, HR, and Super Admin.
 * Strictly adheres to Forest & Emerald design system (DESIGN.md & UI-REFERENCE.md).
 * 
 * SPECIFICATION:
 * - Module: M19 Performance & Appraisal (BUILD-GUIDE Section 22 · Row 19.5)
 */

import React, { useState, useMemo } from 'react';
import { Users, Award, Star, Search, Filter, CheckCircle2, Clock, MessageSquare, Eye } from 'lucide-react';
import { useGetReviewsQuery, useGetReviewCyclesQuery } from '../performanceApi.js';
import { ManagerReviewModal } from '../components/ManagerReviewModal.jsx';
import { FinalizeReviewModal } from '../components/FinalizeReviewModal.jsx';
import { PeerFeedbackModal } from '../components/PeerFeedbackModal.jsx';
import { ReviewDetailModal } from '../components/ReviewDetailModal.jsx';
import { Can } from '../../../components/common/Can.jsx';
import { ScreenSkeleton } from '../../../components/common/ScreenSkeleton.jsx';
import { RefreshButton } from '../../../components/common/RefreshButton.jsx';

export const TeamReviewsPage = () => {
  const [selectedCycle, setSelectedCycle] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [search, setSearch] = useState('');

  const { data: cyclesData, isFetching: isFetchingCycles, refetch: refetchCycles } = useGetReviewCyclesQuery();
  const cycles = cyclesData?.data || [];

  const { data: reviewsData, isLoading, isFetching: isFetchingReviews, refetch: refetchReviews } = useGetReviewsQuery({
    cycleId: selectedCycle ? selectedCycle : undefined,
    status: selectedStatus ? selectedStatus : undefined
  });
  const reviews = reviewsData?.data || [];

  const [activeModal, setActiveModal] = useState(null); // 'manager' | 'finalize' | 'peer' | 'detail'
  const [targetReview, setTargetReview] = useState(null);

  // Aggregate telemetry
  const stats = useMemo(() => {
    const total = reviews.length;
    const pendingSelf = reviews.filter((r) => r.status === 'Active').length;
    const pendingMgr = reviews.filter((r) => r.status === 'Manager_Review').length;
    const readyFinal = reviews.filter((r) => r.status === 'Ready_For_Finalization').length;
    const finalized = reviews.filter((r) => r.status === 'Finalized').length;

    return { total, pendingSelf, pendingMgr, readyFinal, finalized };
  }, [reviews]);

  if (isLoading && !reviewsData) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <ScreenSkeleton variant="table" />
      </div>
    );
  }

  const filteredReviews = reviews.filter((r) => {
    if (!search.trim()) return true;
    const name = `${r.employeeId?.firstName} ${r.employeeId?.lastName}`.toLowerCase();
    const code = (r.employeeId?.employeeCode || '').toLowerCase();
    const designation = (r.designationId?.title || '').toLowerCase();
    const q = search.toLowerCase();
    return name.includes(q) || code.includes(q) || designation.includes(q);
  });

  const handleOpenDetail = (review) => {
    setTargetReview(review);
    setActiveModal('detail');
  };

  const handleOpenManagerReview = (review) => {
    setTargetReview(review);
    setActiveModal('manager');
  };

  const handleOpenFinalize = (review) => {
    setTargetReview(review);
    setActiveModal('finalize');
  };

  const handleOpenPeer = (review) => {
    setTargetReview(review);
    setActiveModal('peer');
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'Finalized':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
            <CheckCircle2 className="h-3 w-3" /> Finalized
          </span>
        );
      case 'Ready_For_Finalization':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800">
            <Award className="h-3 w-3" /> Ready for HR
          </span>
        );
      case 'Manager_Review':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
            <Clock className="h-3 w-3" /> Awaiting Manager
          </span>
        );
      case 'Active':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800">
            <Clock className="h-3 w-3" /> Pending Self
          </span>
        );
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Team Appraisal Reviews
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Review subordinates' self-evaluations, submit manager scores, request 360 peer feedback, and finalize ratings.
              </p>
            </div>
          </div>
        </div>

        <RefreshButton
          onRefresh={() => {
            refetchCycles?.();
            refetchReviews?.();
          }}
          isFetching={isFetchingCycles || isFetchingReviews}
        />
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Total In Queue
          </span>
          <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1.5 block">
            {stats.total}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Department staff</span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Pending Self
          </span>
          <span className="text-2xl font-bold font-mono tabular-nums text-sky-600 dark:text-sky-400 mt-1.5 block">
            {stats.pendingSelf}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Awaiting employee submission</span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Awaiting Manager
          </span>
          <span className="text-2xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400 mt-1.5 block">
            {stats.pendingMgr}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Ready for your scoring</span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Ready for Sign-off
          </span>
          <span className="text-2xl font-bold font-mono tabular-nums text-purple-600 dark:text-purple-400 mt-1.5 block">
            {stats.readyFinal}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Awaiting HR / Admin</span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs col-span-2 lg:col-span-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Finalized
          </span>
          <span className="text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-1.5 block">
            {stats.finalized}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Signed off & archived</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row items-center gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by staff name, employee code, or designation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50/70 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <Filter className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <select
              value={selectedCycle}
              onChange={(e) => setSelectedCycle(e.target.value)}
              className="w-full sm:w-56 py-2 px-3 text-xs bg-slate-50/70 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="">All Review Cycles</option>
              {cycles.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.title} ({c.status})
                </option>
              ))}
            </select>
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full sm:w-44 py-2 px-3 text-xs bg-slate-50/70 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          >
            <option value="">All Review Statuses</option>
            <option value="Active">Pending Self</option>
            <option value="Manager_Review">Awaiting Manager</option>
            <option value="Ready_For_Finalization">Ready for Sign-off</option>
            <option value="Finalized">Finalized</option>
          </select>

          {(search || selectedCycle || selectedStatus) && (
            <button
              onClick={() => {
                setSearch('');
                setSelectedCycle('');
                setSelectedStatus('');
              }}
              className="px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors shrink-0"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Reviews Table */}
      {filteredReviews.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-8">
          <div className="h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 mx-auto flex items-center justify-center mb-3">
            <Users className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No Reviews in Queue</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            When appraisal cycles are active, eligible subordinates reviews will appear in this review queue.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Employee</th>
                  <th className="px-6 py-3.5">Designation & Department</th>
                  <th className="px-6 py-3.5">Cycle Window</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-center">Scores (Self / Mgr)</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredReviews.map((rev) => {
                  const selfScore = rev.selfReview?.calculatedScore;
                  const mgrScore = rev.managerReview?.calculatedScore;

                  return (
                    <tr
                      key={rev._id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Employee Info */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold text-xs uppercase border border-emerald-200/80 dark:border-emerald-800 shrink-0">
                            {rev.employeeId?.firstName?.[0] || 'E'}
                          </div>
                          <div>
                            <div
                              onClick={() => handleOpenDetail(rev)}
                              className="font-bold text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                            >
                              {rev.employeeId?.firstName} {rev.employeeId?.lastName}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {rev.employeeId?.employeeCode}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Designation & Dept */}
                      <td className="px-6 py-4">
                        <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {rev.designationId?.title || 'Designation'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {rev.departmentId?.name || 'Department'}
                        </div>
                      </td>

                      {/* Cycle Title */}
                      <td className="px-6 py-4">
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300 block">
                          {rev.cycleId?.title}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Year {rev.cycleId?.periodYear}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        {renderStatusBadge(rev.status)}
                      </td>

                      {/* Scores */}
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                              selfScore !== undefined
                                ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
                                : 'text-slate-400'
                            }`}
                            title="Employee Self-Rating Score"
                          >
                            Self: {selfScore !== undefined ? selfScore : '—'}
                          </span>

                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                              mgrScore !== undefined
                                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                : 'text-slate-400'
                            }`}
                            title="Manager Evaluation Score"
                          >
                            Mgr: {mgrScore !== undefined ? mgrScore : '—'}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenDetail(rev)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="View Scorecard Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          <Can perform="performance.peer.manage">
                            <button
                              onClick={() => handleOpenPeer(rev)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 transition-colors"
                              title="Request 360° Peer Review"
                            >
                              <MessageSquare className="h-4 w-4" />
                            </button>
                          </Can>

                          {rev.status !== 'Finalized' && (
                            <Can perform="performance.review.submit">
                              <button
                                onClick={() => handleOpenManagerReview(rev)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-semibold transition-colors"
                                title="Evaluate Subordinate"
                              >
                                <Star className="h-3 w-3" /> Evaluate
                              </button>
                            </Can>
                          )}

                          {rev.status !== 'Finalized' && (
                            <Can perform="performance.review.finalize">
                              <button
                                onClick={() => handleOpenFinalize(rev)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors shadow-xs"
                                title="Executive Finalize Appraisal"
                              >
                                <Award className="h-3 w-3" /> Finalize
                              </button>
                            </Can>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <ReviewDetailModal
        isOpen={activeModal === 'detail'}
        onClose={() => setActiveModal(null)}
        review={targetReview}
        onOpenManagerReview={handleOpenManagerReview}
        onOpenFinalize={handleOpenFinalize}
        onOpenPeerFeedback={handleOpenPeer}
      />

      <ManagerReviewModal
        isOpen={activeModal === 'manager'}
        onClose={() => setActiveModal(null)}
        review={targetReview}
      />

      <FinalizeReviewModal
        isOpen={activeModal === 'finalize'}
        onClose={() => setActiveModal(null)}
        review={targetReview}
      />

      <PeerFeedbackModal
        isOpen={activeModal === 'peer'}
        onClose={() => setActiveModal(null)}
        reviewId={targetReview?._id}
      />
    </div>
  );
};

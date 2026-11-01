/**
 * @file TeamReviewsPage.jsx
 * @description Subordinates performance review queue for Department Managers, HR, and Super Admin.
 * 
 * SPECIFICATION:
 * - Module: M19 Performance & Appraisal (BUILD-GUIDE Section 22 · Row 19.5)
 */

import React, { useState } from 'react';
import { Users, Award, Star, Search, Filter, CheckCircle2, Clock, MessageSquare, ShieldCheck, ChevronRight } from 'lucide-react';
import { useGetReviewsQuery, useGetReviewCyclesQuery } from '../performanceApi.js';
import { ManagerReviewModal } from '../components/ManagerReviewModal.jsx';
import { FinalizeReviewModal } from '../components/FinalizeReviewModal.jsx';
import { PeerFeedbackModal } from '../components/PeerFeedbackModal.jsx';
import { Can } from '../../../components/common/Can.jsx';

export const TeamReviewsPage = () => {
  const [selectedCycle, setSelectedCycle] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [search, setSearch] = useState('');

  const { data: cyclesData } = useGetReviewCyclesQuery();
  const cycles = cyclesData?.data || [];

  const { data: reviewsData, isLoading } = useGetReviewsQuery({
    cycleId: selectedCycle ? selectedCycle : undefined,
    status: selectedStatus ? selectedStatus : undefined
  });
  const reviews = reviewsData?.data || [];

  const [activeModal, setActiveModal] = useState(null); // 'manager' | 'finalize' | 'peer'
  const [targetReview, setTargetReview] = useState(null);

  const filteredReviews = reviews.filter((r) => {
    if (!search.trim()) return true;
    const name = `${r.employeeId?.firstName} ${r.employeeId?.lastName}`.toLowerCase();
    const code = (r.employeeId?.employeeCode || '').toLowerCase();
    return name.includes(search.toLowerCase()) || code.includes(search.toLowerCase());
  });

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

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Team Appraisal Reviews
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review subordinates self-evaluations, submit manager scores, request 360 peer feedback, and finalize ratings.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by staff name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={selectedCycle}
            onChange={(e) => setSelectedCycle(e.target.value)}
            className="w-full sm:w-56 py-2 px-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Review Cycles</option>
            {cycles.map((c) => (
              <option key={c._id} value={c._id}>
                {c.title} ({c.status})
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full sm:w-44 py-2 px-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="Active">Active / Pending Self</option>
            <option value="Manager_Review">Manager Review</option>
            <option value="Ready_For_Finalization">Ready for Finalize</option>
            <option value="Finalized">Finalized</option>
          </select>
        </div>
      </div>

      {/* Reviews Table */}
      {isLoading ? (
        <div className="text-center py-12 text-slate-500">Loading Team Reviews...</div>
      ) : filteredReviews.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 p-8">
          <Users className="mx-auto h-12 w-12 text-slate-400 mb-3" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">No Reviews in Queue</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
            When appraisal cycles are launched, active subordinates reviews will appear in this review queue.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Employee</th>
                  <th className="px-6 py-3.5">Designation & Dept</th>
                  <th className="px-6 py-3.5">Cycle</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Scores (Self / Mgr)</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredReviews.map((rev) => {
                  const selfScore = rev.selfReview?.calculatedScore || '—';
                  const mgrScore = rev.managerReview?.calculatedScore || '—';

                  return (
                    <tr
                      key={rev._id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 flex items-center justify-center font-bold text-xs uppercase">
                            {rev.employeeId?.firstName?.[0] || 'E'}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">
                              {rev.employeeId?.firstName} {rev.employeeId?.lastName}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {rev.employeeId?.employeeCode}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-xs font-medium text-slate-800 dark:text-slate-200">
                          {rev.designationId?.title || 'Designation'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {rev.departmentId?.name || 'Department'}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-300">
                        {rev.cycleId?.title}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            rev.status === 'Finalized'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400'
                              : rev.status === 'Ready_For_Finalization'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-400'
                              : rev.status === 'Manager_Review'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {rev.status.replace(/_/g, ' ')}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="font-mono text-xs">
                          <span className="text-indigo-600 font-semibold">{selfScore}</span>
                          <span className="text-slate-400 mx-1">/</span>
                          <span className="text-emerald-600 font-semibold">{mgrScore}</span>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenPeer(rev)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Request 360 Peer Review"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => handleOpenManagerReview(rev)}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 rounded-lg text-xs font-semibold transition-colors"
                          >
                            <Award className="h-3.5 w-3.5" /> Rate Staff
                          </button>

                          <Can perform="performance.review.finalize">
                            <button
                              onClick={() => handleOpenFinalize(rev)}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
                            >
                              Finalize
                            </button>
                          </Can>
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


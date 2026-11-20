/**
 * @file ResignationPage.jsx
 * @description Formal Resignation Submission (Employee Self-Service) & Management Review Queue.
 * 
 * SPECIFICATION:
 * - Module: M18 Onboarding & Offboarding (BUILD-GUIDE Section 21 · Rows 18.5, 18.6, 18.8)
 * - Permissions: Guarded by 'resignation.submit' (employee) and 'offboard.manage' (management queue)
 * - Design System: Forest & Emerald (#111D17 dark surface, #1A3125 dark border, #00C471 emerald accent).
 */

import React, { useState } from 'react';
import {
  FileText,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Building2,
  Layers,
  Eye,
  Lock,
  Star,
  Search,
  X
} from 'lucide-react';
import {
  useGetMyResignationQuery,
  useGetResignationsQuery,
  useSubmitResignationMutation,
  useSubmitExitInterviewMutation
} from '../onboardingApi.js';
import { ResignationDetailModal } from '../components/ResignationDetailModal.jsx';
import { usePermission } from '../../../hooks/usePermission.js';
import { ScreenSkeleton } from '../../../components/common/ScreenSkeleton.jsx';
import { RefreshButton } from '../../../components/common/RefreshButton.jsx';
import { toast } from 'sonner';

export const ResignationPage = () => {
  const { can } = usePermission();
  const canManageOffboarding = can('offboard.manage');

  const [activeTab, setActiveTab] = useState(canManageOffboarding ? 'queue' : 'my');
  const [intendedDate, setIntendedDate] = useState('');
  const [reason, setReason] = useState('better_opportunity');
  const [comments, setComments] = useState('');
  const [showReapplyForm, setShowReapplyForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Selected resignation for detail inspection & decision
  const [selectedResignation, setSelectedResignation] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Exit interview submission state (employee self-service)
  const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false);
  const [interviewRatings, setInterviewRatings] = useState({
    cultureRating: 4,
    managementRating: 4,
    compensationRating: 3,
    workLifeBalanceRating: 4,
    careerGrowthRating: 3
  });
  const [interviewFeedback, setInterviewFeedback] = useState({
    feedbackManagement: '',
    feedbackCompany: '',
    wouldRecommend: true
  });

  const {
    data: myResRes,
    isLoading: myLoading,
    isFetching: myFetching,
    refetch: refetchMy
  } = useGetMyResignationQuery();
  const myResignation = myResRes?.data;

  const {
    data: allResRes,
    isLoading: allLoading,
    isFetching: allFetching,
    refetch: refetchAll
  } = useGetResignationsQuery({}, { skip: !canManageOffboarding });
  const reviewQueue = allResRes?.data || [];

  const [submitResignation, { isLoading: isSubmitting }] = useSubmitResignationMutation();
  const [submitInterview, { isLoading: isSubmittingInterview }] = useSubmitExitInterviewMutation();

  if (myLoading && !myResRes) {
    return (
      <div className="max-w-6xl mx-auto space-y-8 p-6">
        <ScreenSkeleton variant="cards" />
      </div>
    );
  }

  const handleSubmitResignation = async (e) => {
    e.preventDefault();
    if (!intendedDate) {
      toast.error('Please select an intended last working day');
      return;
    }

    try {
      await submitResignation({
        intendedLastWorkingDay: intendedDate,
        reason,
        comments
      }).unwrap();
      toast.success('Resignation submitted successfully to management');
      setIntendedDate('');
      setComments('');
      setShowReapplyForm(false);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to submit resignation');
    }
  };

  const handleSubmitExitInterview = async (e) => {
    e.preventDefault();
    if (!myResignation?._id) return;

    try {
      await submitInterview({
        resignationId: myResignation._id,
        ratings: interviewRatings,
        primaryReason: myResignation.reason || 'Career Transition',
        feedbackManagement: interviewFeedback.feedbackManagement,
        feedbackCompany: interviewFeedback.feedbackCompany,
        wouldRecommend: interviewFeedback.wouldRecommend
      }).unwrap();

      toast.success('Confidential exit interview submitted. Thank you for your feedback.');
      setIsInterviewModalOpen(false);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to submit exit interview');
    }
  };

  const handleOpenDetail = (resignation) => {
    setSelectedResignation(resignation);
    setIsDetailOpen(true);
  };

  // Queue metrics
  const totalQueue = reviewQueue.length;
  const pendingCount = reviewQueue.filter((r) => r.status === 'submitted').length;
  const acceptedCount = reviewQueue.filter((r) => r.status === 'accepted').length;
  const rejectedCount = reviewQueue.filter((r) => r.status === 'rejected').length;

  const filteredQueue = reviewQueue.filter((item) => {
    if (statusFilter && item.status !== statusFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const name = item.employeeId?.name || '';
    const code = item.employeeId?.employeeCode || '';
    const dept = item.employeeId?.department?.name || '';
    return name.toLowerCase().includes(q) || code.toLowerCase().includes(q) || dept.toLowerCase().includes(q);
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-[#162820] text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-900/60 shadow-xs">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Resignation Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Employee departure notices, official last working day determination, and exit reviews.
            </p>
          </div>
        </div>

        <RefreshButton
          onRefresh={() => {
            refetchMy();
            if (canManageOffboarding) refetchAll();
          }}
          isFetching={myFetching || allFetching}
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-[#162820]/60 border border-slate-200 dark:border-[#1A3125] w-fit">
        {canManageOffboarding && (
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'queue'
                ? 'bg-white dark:bg-[#111D17] text-emerald-700 dark:text-[#00C471] shadow-xs border border-slate-200/60 dark:border-[#1A3125]'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            Management Approvals Queue ({pendingCount})
          </button>
        )}
        <button
          onClick={() => setActiveTab('my')}
          className={`px-4 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'my'
              ? 'bg-white dark:bg-[#111D17] text-emerald-700 dark:text-[#00C471] shadow-xs border border-slate-200/60 dark:border-[#1A3125]'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          My Resignation
        </button>
      </div>

      {/* TAB 1: MANAGEMENT APPROVALS QUEUE */}
      {activeTab === 'queue' && canManageOffboarding && (
        <div className="space-y-6">
          {/* Telemetry Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Total In Scope
                </span>
                <Layers className="w-4 h-4 text-emerald-600 dark:text-[#00C471]" />
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1.5 font-mono">
                {totalQueue}
              </p>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Awaiting Decision
                </span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1.5 font-mono">
                {pendingCount}
              </p>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Under Notice Period
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-[#00C471]" />
              </div>
              <p className="text-2xl font-bold text-emerald-600 dark:text-[#00C471] mt-1.5 font-mono">
                {acceptedCount}
              </p>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Rejected Notices
                </span>
                <XCircle className="w-4 h-4 text-rose-500" />
              </div>
              <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1.5 font-mono">
                {rejectedCount}
              </p>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-[#1A3125] pb-4">
            <div className="relative flex-1 sm:w-72">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search employee, designation, code..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">All Review Statuses</option>
              <option value="submitted">Pending Decision</option>
              <option value="accepted">Accepted (Notice)</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Queue List */}
          {allLoading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading resignations...</div>
          ) : filteredQueue.length === 0 ? (
            <div className="py-16 text-center rounded-2xl border border-dashed border-slate-200 dark:border-[#1A3125] bg-white/50 dark:bg-[#111D17]/50">
              <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-600 dark:text-[#00C471] mb-3" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Approvals queue clear
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                No resignation submissions requiring your management review or sign-off.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] overflow-hidden shadow-xs divide-y divide-slate-100 dark:divide-[#1A3125]">
              {filteredQueue.map((item) => {
                const employee = item.employeeId || {};
                const isPending = item.status === 'submitted';

                return (
                  <div
                    key={item._id}
                    className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-[#162820]/30 transition"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white text-sm">
                          {employee.name || 'Employee'}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                            item.status === 'accepted'
                              ? 'bg-emerald-50 dark:bg-[#162820] text-emerald-700 dark:text-[#00C471] border-emerald-200 dark:border-emerald-900/60'
                              : item.status === 'rejected'
                              ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/40'
                              : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/40'
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {employee.designation?.title || 'Designation'} • {employee.department?.name || 'Department'}
                        {employee.employeeCode && (
                          <span className="font-mono text-slate-400 ml-1">({employee.employeeCode})</span>
                        )}
                      </p>

                      <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-4 flex-wrap pt-1">
                        <span>Reason: <strong className="capitalize">{item.reason?.replace('_', ' ')}</strong></span>
                        <span className="font-mono">
                          Intended LWD: {item.intendedLastWorkingDay ? new Date(item.intendedLastWorkingDay).toLocaleDateString() : 'N/A'}
                        </span>
                        {item.officialLastWorkingDay && (
                          <span className="font-mono text-emerald-600 dark:text-[#00C471] font-semibold">
                            Official LWD: {new Date(item.officialLastWorkingDay).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenDetail(item)}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl transition cursor-pointer shrink-0 ${
                        isPending
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
                          : 'border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#162820]'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      {isPending ? 'Review & Decide' : 'Inspect Record'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MY RESIGNATION (SELF-SERVICE) */}
      {activeTab === 'my' && (
        <div className="space-y-6">
          {myResignation && !showReapplyForm ? (
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-[#1A3125] pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      Your Formal Resignation Notice
                    </h3>
                    <span
                      className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                        myResignation.status === 'accepted'
                          ? 'bg-emerald-50 dark:bg-[#162820] text-emerald-700 dark:text-[#00C471] border-emerald-200 dark:border-emerald-900/60'
                          : myResignation.status === 'rejected'
                          ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/40'
                          : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/40'
                      }`}
                    >
                      {myResignation.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Submitted on {new Date(myResignation.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {myResignation.status === 'accepted' && (
                  <button
                    type="button"
                    onClick={() => setIsInterviewModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-xs transition cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    Complete Exit Interview
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#162820]/30">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Primary Reason</span>
                  <p className="font-bold text-slate-800 dark:text-slate-100 text-xs mt-0.5 capitalize">
                    {myResignation.reason?.replace('_', ' ')}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#162820]/30">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Intended LWD</span>
                  <p className="font-bold text-amber-600 dark:text-amber-400 text-xs mt-0.5 font-mono">
                    {new Date(myResignation.intendedLastWorkingDay).toLocaleDateString()}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#162820]/30">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Official Last Day</span>
                  <p className="font-bold text-emerald-600 dark:text-[#00C471] text-xs mt-0.5 font-mono">
                    {myResignation.officialLastWorkingDay
                      ? new Date(myResignation.officialLastWorkingDay).toLocaleDateString()
                      : 'Pending Review'}
                  </p>
                </div>
              </div>

              {myResignation.comments && (
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#162820]/30 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    Your Transition Summary
                  </span>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {myResignation.comments}
                  </p>
                </div>
              )}

              {myResignation.status === 'rejected' && (
                <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/40 dark:bg-rose-950/20 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700 dark:text-rose-300">
                    <XCircle className="w-4 h-4" />
                    <span>Resignation Not Accepted by Management</span>
                  </div>
                  {myResignation.rejectionReason && (
                    <p className="text-xs text-rose-600 dark:text-rose-400">
                      <strong>Reason:</strong> {myResignation.rejectionReason}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowReapplyForm(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-xs transition cursor-pointer mt-2"
                  >
                    Submit Revised Resignation
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Resignation Submission Form */
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] shadow-xs space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Submit Formal Resignation
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Initiate formal separation notice for management and HR review.
                </p>
              </div>

              <form onSubmit={handleSubmitResignation} className="space-y-4 max-w-2xl text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Intended Last Working Day *
                    </label>
                    <input
                      type="date"
                      required
                      value={intendedDate}
                      onChange={(e) => setIntendedDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Primary Reason *
                    </label>
                    <select
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="better_opportunity">Better Opportunity</option>
                      <option value="career_change">Career Change</option>
                      <option value="higher_education">Higher Education</option>
                      <option value="personal_reasons">Personal Reasons</option>
                      <option value="relocation">Relocation</option>
                      <option value="health_reasons">Health Reasons</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Transition Notes / Handoff Summary
                  </label>
                  <textarea
                    rows={3}
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="Briefly describe active deliverables, ongoing responsibilities, and team handover notes..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-xs transition disabled:opacity-50 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {isSubmitting ? 'Submitting Notice...' : 'Submit Formal Resignation'}
                  </button>
                  {showReapplyForm && (
                    <button
                      type="button"
                      onClick={() => setShowReapplyForm(false)}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#1A3125] text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-[#162820] transition cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Detail Inspection & Decision Modal */}
      {isDetailOpen && selectedResignation && (
        <ResignationDetailModal
          isOpen={isDetailOpen}
          onClose={() => {
            setIsDetailOpen(false);
            setSelectedResignation(null);
          }}
          resignation={selectedResignation}
          onDecided={() => {
            refetchAll();
            refetchMy();
          }}
        />
      )}

      {/* Confidential Exit Interview Submission Modal for Employee */}
      {isInterviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] w-full max-w-xl rounded-2xl shadow-2xl p-6 space-y-5 overflow-hidden max-h-[90vh] flex flex-col text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1A3125] pb-3">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-600 dark:text-[#00C471]" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Confidential Exit Survey
                </h3>
              </div>
              <button
                onClick={() => setIsInterviewModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitExitInterview} className="space-y-4 flex-1 overflow-y-auto pr-1">
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-[11px]">
                Your honest feedback helps us improve leadership, culture, and team satisfaction. Responses are strictly confidential to HR leadership.
              </p>

              {/* 5-Star Ratings */}
              <div className="space-y-3 p-3.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#162820]/30">
                {[
                  { key: 'cultureRating', label: 'Company Culture & Values' },
                  { key: 'managementRating', label: 'Management & Direct Leadership' },
                  { key: 'compensationRating', label: 'Compensation & Benefits' },
                  { key: 'workLifeBalanceRating', label: 'Work-Life Balance' },
                  { key: 'careerGrowthRating', label: 'Career Growth & Learning Opportunities' }
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {item.label}
                    </span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() =>
                            setInterviewRatings((prev) => ({ ...prev, [item.key]: star }))
                          }
                          className="p-0.5 cursor-pointer"
                        >
                          <Star
                            className={`w-4 h-4 ${
                              star <= interviewRatings[item.key]
                                ? 'text-amber-500 fill-amber-500'
                                : 'text-slate-300 dark:text-slate-600'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Feedback on Management & Leadership
                </label>
                <textarea
                  rows={2}
                  value={interviewFeedback.feedbackManagement}
                  onChange={(e) =>
                    setInterviewFeedback({ ...interviewFeedback, feedbackManagement: e.target.value })
                  }
                  placeholder="What could management have done differently?"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Recommendations for Organization
                </label>
                <textarea
                  rows={2}
                  value={interviewFeedback.feedbackCompany}
                  onChange={(e) =>
                    setInterviewFeedback({ ...interviewFeedback, feedbackCompany: e.target.value })
                  }
                  placeholder="Suggestions to make our workplace better..."
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-[#1A3125]">
                <button
                  type="button"
                  onClick={() => setIsInterviewModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#1A3125] text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingInterview}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingInterview ? 'Submitting...' : 'Submit Exit Survey'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

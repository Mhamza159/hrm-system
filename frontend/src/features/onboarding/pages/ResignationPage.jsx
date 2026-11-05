/**
 * @file ResignationPage.jsx
 * @description Formal Resignation Submission (Employee Self-Service) & Management Review Queue.
 * 
 * SPECIFICATION:
 * - Module: M18 Onboarding & Offboarding (BUILD-GUIDE Section 21 · Rows 18.5, 18.6)
 */

import React, { useState } from 'react';
import {
  FileText,
  Send,
  Calendar,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Building2,
  HelpCircle
} from 'lucide-react';
import {
  useGetMyResignationQuery,
  useGetResignationsQuery,
  useSubmitResignationMutation,
  useDecideResignationMutation
} from '../onboardingApi.js';
import { useAuth } from '../../../hooks/useAuth.js';
import { usePermission } from '../../../hooks/usePermission.js';
import { Can } from '../../../components/common/Can.jsx';
import { ScreenSkeleton } from '../../../components/common/ScreenSkeleton.jsx';
import { RefreshButton } from '../../../components/common/RefreshButton.jsx';
import { toast } from 'sonner';

export const ResignationPage = () => {
  const { user, isSuperAdmin, isHR } = useAuth();
  const { can } = usePermission();

  const [intendedDate, setIntendedDate] = useState('');
  const [reason, setReason] = useState('better_opportunity');
  const [comments, setComments] = useState('');
  const [showReapplyForm, setShowReapplyForm] = useState(false);

  const [decisionModal, setDecisionModal] = useState({
    isOpen: false,
    resignation: null,
    status: 'accepted',
    officialLastWorkingDay: '',
    rejectionReason: '',
    comments: ''
  });

  const { data: myResRes, isLoading: myLoading, isFetching: myFetching, refetch: refetchMy } = useGetMyResignationQuery();
  const myResignation = myResRes?.data;

  const canManageOffboarding = can('offboard.manage');
  const { data: allResRes, isLoading: allLoading, isFetching: allFetching, refetch: refetchAll } = useGetResignationsQuery(
    {},
    { skip: !canManageOffboarding }
  );
  const reviewQueue = allResRes?.data || [];

  const [submitResignation, { isLoading: isSubmitting }] = useSubmitResignationMutation();

  if (myLoading && !myResRes) {
    return (
      <div className="max-w-6xl mx-auto space-y-8">
        <ScreenSkeleton variant="cards" />
      </div>
    );
  }
  const [decideResignation, { isLoading: isDeciding }] = useDecideResignationMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!intendedDate) {
      toast.error('Please pick an intended last working day');
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
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to submit resignation');
    }
  };

  const handleDecisionSubmit = async (e) => {
    e.preventDefault();
    const { resignation, status, officialLastWorkingDay, rejectionReason, comments } = decisionModal;
    if (status === 'accepted' && !officialLastWorkingDay) {
      toast.error('Please specify the official last working day');
      return;
    }
    if (status === 'rejected' && !rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    try {
      await decideResignation({
        id: resignation._id,
        status,
        officialLastWorkingDay: status === 'accepted' ? officialLastWorkingDay : undefined,
        rejectionReason: status === 'rejected' ? rejectionReason : undefined,
        comments
      }).unwrap();
      toast.success(`Resignation marked as ${status}`);
      setDecisionModal({ isOpen: false, resignation: null, status: 'accepted', officialLastWorkingDay: '', rejectionReason: '', comments: '' });
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to record decision');
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-lg">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Employee Resignation Portal
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Submit formal resignation, track notice period timelines, and coordinate team handovers.
            </p>
          </div>
        </div>
        <RefreshButton onRefresh={() => { refetchMy?.(); if (canManageOffboarding) refetchAll?.(); }} isFetching={myFetching || (canManageOffboarding && allFetching)} />
      </div>

      {/* Employee Submission / Status Panel */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
        <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <User className="w-4 h-4 text-indigo-500" />
          My Resignation Status
        </h2>

        {myResignation && !showReapplyForm ? (
          <div className="p-5 rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-bold uppercase px-2.5 py-1 rounded-full ${
                    myResignation.status === 'accepted'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : myResignation.status === 'rejected'
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  }`}
                >
                  Status: {myResignation.status}
                </span>
                <span className="text-xs text-gray-500">
                  Submitted on {new Date(myResignation.submissionDate).toLocaleDateString()}
                </span>
              </div>

              {myResignation.officialLastWorkingDay && (
                <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  Official Last Working Day: {new Date(myResignation.officialLastWorkingDay).toLocaleDateString()}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-700 dark:text-gray-300 pt-2 border-t border-amber-200/60 dark:border-amber-900/40">
              <div>
                <span className="font-semibold block text-gray-500 mb-0.5">Primary Reason:</span>
                <span className="capitalize">{myResignation.reason?.replace('_', ' ')}</span>
              </div>
              <div>
                <span className="font-semibold block text-gray-500 mb-0.5">Proposed Last Working Day:</span>
                <span>{new Date(myResignation.intendedLastWorkingDay).toLocaleDateString()}</span>
              </div>
            </div>

            {myResignation.comments && (
              <div className="text-xs text-gray-600 dark:text-gray-400 pt-1">
                <span className="font-semibold text-gray-500">Notes / Comments:</span>
                <p className="mt-0.5 italic">"{myResignation.comments}"</p>
              </div>
            )}

            {myResignation.rejectionReason && (
              <div className="text-xs text-rose-700 dark:text-rose-400 pt-2 border-t border-rose-200/50">
                <span className="font-semibold block mb-0.5">Rejection Explanation:</span>
                <p className="italic">"{myResignation.rejectionReason}"</p>
              </div>
            )}

            {myResignation.status === 'rejected' && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowReapplyForm(true)}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs shadow-sm transition"
                >
                  Submit Revised Resignation
                </button>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                  Intended Last Working Day *
                </label>
                <input
                  type="date"
                  required
                  value={intendedDate}
                  onChange={(e) => setIntendedDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                  Primary Reason *
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
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
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                Transition Notes / Handoff Summary
              </label>
              <textarea
                rows={3}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Briefly state ongoing responsibilities, pending deliverables, or transition details..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm shadow-sm disabled:opacity-50 transition"
              >
                <Send className="w-4 h-4" />
                {isSubmitting ? 'Submitting...' : 'Submit Formal Resignation'}
              </button>
              {showReapplyForm && (
                <button
                  type="button"
                  onClick={() => setShowReapplyForm(false)}
                  className="px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        )}
      </div>

      {/* Manager / HR Review Queue */}
      <Can perform="offboard.manage">
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-500" />
            Manager & HR Resignation Approvals Queue
          </h2>

          {allLoading ? (
            <div className="py-8 text-center text-sm text-gray-500">Loading resignations...</div>
          ) : reviewQueue.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-400">
              No pending resignations in your review scope.
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {reviewQueue.map((item) => (
                <div key={item._id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {item.employeeId?.name || 'Employee'}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          item.status === 'accepted'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : item.status === 'rejected'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <div className="text-xs text-gray-500 mt-1 flex items-center gap-3 flex-wrap">
                      <span>Reason: {item.reason?.replace('_', ' ')}</span>
                      <span>Intended LWD: {new Date(item.intendedLastWorkingDay).toLocaleDateString()}</span>
                      {item.officialLastWorkingDay && (
                        <span className="text-emerald-600 font-semibold">
                          Official LWD: {new Date(item.officialLastWorkingDay).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {item.status === 'submitted' && (
                    <button
                      onClick={() =>
                        setDecisionModal({
                          isOpen: true,
                          resignation: item,
                          status: 'accepted',
                          officialLastWorkingDay: item.intendedLastWorkingDay ? item.intendedLastWorkingDay.split('T')[0] : '',
                          rejectionReason: '',
                          comments: ''
                        })
                      }
                      className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition shrink-0"
                    >
                      Review & Decide
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Can>

      {/* Decision Modal */}
      {decisionModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 w-full max-w-lg p-6 space-y-5">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Resignation Decision: {decisionModal.resignation?.employeeId?.name}
            </h3>

            <form onSubmit={handleDecisionSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                  Decision *
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm text-gray-800 dark:text-gray-200 cursor-pointer">
                    <input
                      type="radio"
                      name="decision"
                      value="accepted"
                      checked={decisionModal.status === 'accepted'}
                      onChange={() => setDecisionModal({ ...decisionModal, status: 'accepted' })}
                      className="text-emerald-600"
                    />
                    Accept Resignation
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-800 dark:text-gray-200 cursor-pointer">
                    <input
                      type="radio"
                      name="decision"
                      value="rejected"
                      checked={decisionModal.status === 'rejected'}
                      onChange={() => setDecisionModal({ ...decisionModal, status: 'rejected' })}
                      className="text-rose-600"
                    />
                    Reject Resignation
                  </label>
                </div>
              </div>

              {decisionModal.status === 'accepted' ? (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                    Official Last Working Day *
                  </label>
                  <input
                    type="date"
                    required
                    value={decisionModal.officialLastWorkingDay}
                    onChange={(e) =>
                      setDecisionModal({ ...decisionModal, officialLastWorkingDay: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Triggers employee notice transition and automatically instantiates exit clearance checklist.
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                    Rejection Reason *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={decisionModal.rejectionReason}
                    onChange={(e) =>
                      setDecisionModal({ ...decisionModal, rejectionReason: e.target.value })
                    }
                    placeholder="Provide justification for rejecting resignation..."
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
              )}

              <div className="pt-3 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDecisionModal({ ...decisionModal, isOpen: false })}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDeciding}
                  className="px-5 py-2 text-sm font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm disabled:opacity-50 transition"
                >
                  {isDeciding ? 'Saving...' : 'Confirm Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};


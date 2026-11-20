/**
 * @file ResignationDetailModal.jsx
 * @description Comprehensive Resignation Inspection & Management Decision Review Modal.
 * 
 * SPECIFICATION:
 * - Module: M18 Onboarding & Offboarding Lifecycle (BUILD-GUIDE Section 21 · Rows 18.5, 18.6, 18.8)
 * - Design System: Forest & Emerald (#111D17 dark surface, #1A3125 dark border, #00C471 emerald accent).
 */

import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  XCircle,
  Clock,
  Star,
  Send,
  Lock
} from 'lucide-react';
import {
  useDecideResignationMutation,
  useGetExitInterviewByResignationQuery
} from '../onboardingApi.js';
import { Can } from '../../../components/common/Can.jsx';
import { toast } from 'sonner';

export const ResignationDetailModal = ({ isOpen, onClose, resignation, onDecided }) => {
  const [activeTab, setActiveTab] = useState('decision');
  const [status, setStatus] = useState('accepted');
  const [officialLwd, setOfficialLwd] = useState(
    resignation?.intendedLastWorkingDay ? resignation.intendedLastWorkingDay.split('T')[0] : ''
  );
  const [rejectionReason, setRejectionReason] = useState('');
  const [comments, setComments] = useState('');

  const [decideResignation, { isLoading: isDeciding }] = useDecideResignationMutation();

  const { data: exitInterviewRes, isLoading: isInterviewLoading } = useGetExitInterviewByResignationQuery(
    resignation?._id,
    { skip: !isOpen || !resignation?._id }
  );
  const exitInterview = exitInterviewRes?.data;

  if (!isOpen || !resignation) return null;

  const employee = resignation.employeeId || {};
  const isSubmitted = resignation.status === 'submitted';

  const handleDecisionSubmit = async (e) => {
    e.preventDefault();
    if (status === 'accepted' && !officialLwd) {
      toast.error('Please specify the official last working day');
      return;
    }
    if (status === 'rejected' && !rejectionReason.trim()) {
      toast.error('Please specify a rejection justification');
      return;
    }

    try {
      await decideResignation({
        id: resignation._id,
        status,
        officialLastWorkingDay: status === 'accepted' ? officialLwd : undefined,
        rejectionReason: status === 'rejected' ? rejectionReason : undefined,
        comments
      }).unwrap();

      toast.success(
        status === 'accepted'
          ? `Resignation accepted. Offboarding checklist initialized for ${employee.name || 'employee'}.`
          : 'Resignation rejected.'
      );
      if (onDecided) onDecided();
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to record resignation decision');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-[#1A3125] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-[#162820] text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-base border border-amber-200 dark:border-amber-900/60 shadow-xs">
              {employee.name?.[0] || 'R'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  {employee.name || 'Employee Resignation'}
                </h3>
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                    resignation.status === 'accepted'
                      ? 'bg-emerald-50 dark:bg-[#162820] text-emerald-700 dark:text-[#00C471] border-emerald-200 dark:border-emerald-900/60'
                      : resignation.status === 'rejected'
                      ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/40'
                      : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/40'
                  }`}
                >
                  {resignation.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                <span className="text-slate-700 dark:text-slate-200 font-semibold">
                  {employee.designation?.title || 'Designation'}
                </span>{' '}
                • {employee.department?.name || 'Department'}{' '}
                {employee.employeeCode && (
                  <span className="font-mono text-slate-400">({employee.employeeCode})</span>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#162820] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-3 border-b border-slate-200 dark:border-[#1A3125] flex items-center gap-2">
          <button
            onClick={() => setActiveTab('decision')}
            className={`pb-2.5 text-xs font-bold transition border-b-2 cursor-pointer ${
              activeTab === 'decision'
                ? 'border-emerald-500 text-emerald-700 dark:text-[#00C471]'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Resignation & Review
          </button>
          <button
            onClick={() => setActiveTab('interview')}
            className={`pb-2.5 text-xs font-bold transition border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'interview'
                ? 'border-emerald-500 text-emerald-700 dark:text-[#00C471]'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Lock className="w-3 h-3 text-amber-500" />
            Exit Interview (Confidential)
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {activeTab === 'decision' ? (
            <div className="space-y-5">
              {/* Resignation Overview Card */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50 dark:bg-[#162820]/40">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">
                    Submitted Date
                  </span>
                  <p className="font-bold text-slate-800 dark:text-slate-100 text-xs mt-0.5 font-mono">
                    {resignation.createdAt ? new Date(resignation.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">
                    Primary Reason
                  </span>
                  <p className="font-bold text-slate-800 dark:text-slate-100 text-xs mt-0.5 capitalize">
                    {resignation.reason?.replace('_', ' ') || 'General'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">
                    Intended LWD
                  </span>
                  <p className="font-bold text-amber-600 dark:text-amber-400 text-xs mt-0.5 font-mono">
                    {resignation.intendedLastWorkingDay
                      ? new Date(resignation.intendedLastWorkingDay).toLocaleDateString()
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">
                    Official LWD
                  </span>
                  <p className="font-bold text-emerald-600 dark:text-[#00C471] text-xs mt-0.5 font-mono">
                    {resignation.officialLastWorkingDay
                      ? new Date(resignation.officialLastWorkingDay).toLocaleDateString()
                      : 'Pending Decision'}
                  </p>
                </div>
              </div>

              {/* Transition Notes */}
              {resignation.comments && (
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] space-y-1">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                    Employee Transition Notes / Handoff Summary
                  </span>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {resignation.comments}
                  </p>
                </div>
              )}

              {/* Already Decided Details */}
              {!isSubmitted && (
                <div className="p-4 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50 dark:bg-[#162820]/30 space-y-2">
                  <div className="flex items-center gap-2">
                    {resignation.status === 'accepted' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-[#00C471]" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-500" />
                    )}
                    <span className="font-bold text-slate-900 dark:text-white capitalize">
                      Resignation {resignation.status}
                    </span>
                  </div>
                  {resignation.rejectionReason && (
                    <p className="text-xs text-rose-600 dark:text-rose-400">
                      <strong>Rejection Justification:</strong> {resignation.rejectionReason}
                    </p>
                  )}
                  {resignation.decisionComments && (
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      <strong>Management Remarks:</strong> {resignation.decisionComments}
                    </p>
                  )}
                </div>
              )}

              {/* Review & Decision Form (If Pending and User Can Manage) */}
              {isSubmitted && (
                <Can perform="offboard.manage">
                  <form onSubmit={handleDecisionSubmit} className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-[#162820]/20 space-y-4">
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-[#00C471]" />
                      Management Review & Decision
                    </h4>

                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="decisionStatus"
                          value="accepted"
                          checked={status === 'accepted'}
                          onChange={() => setStatus('accepted')}
                          className="text-emerald-600 accent-emerald-600 w-4 h-4"
                        />
                        <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                          Accept Resignation
                        </span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="decisionStatus"
                          value="rejected"
                          checked={status === 'rejected'}
                          onChange={() => setStatus('rejected')}
                          className="text-rose-600 accent-rose-600 w-4 h-4"
                        />
                        <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                          Reject Resignation
                        </span>
                      </label>
                    </div>

                    {status === 'accepted' ? (
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                          Official Last Working Day *
                        </label>
                        <input
                          type="date"
                          required
                          value={officialLwd}
                          onChange={(e) => setOfficialLwd(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                        />
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                          Acceptance will transition employee to Notice status and initiate Exit Clearance.
                        </p>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-[11px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider mb-1">
                          Rejection Justification *
                        </label>
                        <input
                          type="text"
                          required
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="e.g. Critical project delivery underway; agreed to 60-day retention"
                          className="w-full px-3 py-2 text-xs rounded-lg border border-rose-300 dark:border-rose-900 bg-white dark:bg-[#111D17] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                        Management Remarks / Transition Guidelines
                      </label>
                      <textarea
                        rows={2}
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                        placeholder="Additional remarks for employee or HR records..."
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="submit"
                        disabled={isDeciding}
                        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-white font-bold text-xs shadow-xs transition disabled:opacity-50 cursor-pointer ${
                          status === 'accepted'
                            ? 'bg-emerald-600 hover:bg-emerald-500'
                            : 'bg-rose-600 hover:bg-rose-500'
                        }`}
                      >
                        <Send className="w-3.5 h-3.5" />
                        {isDeciding ? 'Recording Decision...' : `Confirm ${status === 'accepted' ? 'Acceptance' : 'Rejection'}`}
                      </button>
                    </div>
                  </form>
                </Can>
              )}
            </div>
          ) : (
            /* Confidential Exit Interview Tab */
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/20 flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                  <strong>Strictly Confidential:</strong> Exit interview responses are accessible only to authorized HR Managers and Super Admins. Feedback is protected from direct line managers to ensure honest workplace sentiment.
                </div>
              </div>

              {isInterviewLoading ? (
                <div className="py-8 text-center text-xs text-slate-400">Loading exit interview questionnaire...</div>
              ) : !exitInterview ? (
                <div className="p-8 text-center rounded-xl border border-dashed border-slate-200 dark:border-[#1A3125] text-slate-400">
                  The employee has not completed the exit interview survey yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Rating Scores Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17]">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium uppercase">Culture</span>
                      <p className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-0.5 font-mono flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        {exitInterview.ratings?.cultureRating || 'N/A'}/5
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium uppercase">Management</span>
                      <p className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-0.5 font-mono flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        {exitInterview.ratings?.managementRating || 'N/A'}/5
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium uppercase">Compensation</span>
                      <p className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-0.5 font-mono flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        {exitInterview.ratings?.compensationRating || 'N/A'}/5
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium uppercase">Work-Life</span>
                      <p className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-0.5 font-mono flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        {exitInterview.ratings?.workLifeBalanceRating || 'N/A'}/5
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium uppercase">Growth</span>
                      <p className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-0.5 font-mono flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        {exitInterview.ratings?.careerGrowthRating || 'N/A'}/5
                      </p>
                    </div>
                  </div>

                  {exitInterview.feedbackManagement && (
                    <div className="p-3.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] space-y-1">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                        Feedback on Management
                      </span>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        {exitInterview.feedbackManagement}
                      </p>
                    </div>
                  )}

                  {exitInterview.feedbackCompany && (
                    <div className="p-3.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] space-y-1">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                        Company & Workplace Improvement Feedback
                      </span>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        {exitInterview.feedbackCompany}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-[#1A3125] bg-slate-50 dark:bg-[#162820]/40 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Lifecycle Module M18 • Rows 18.5, 18.6
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#162820] transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

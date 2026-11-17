/**
 * @file TrackFeedbackPage.jsx
 * @description Dual-mode tracking page for anonymous code lookup and authenticated my submissions (BUILD-GUIDE Row 21.4).
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Search,
  Shield,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  MessageSquare,
  Paperclip,
  FolderOpen,
  ChevronRight,
  ExternalLink,
  Layers,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { useLazyGetTrackedFeedbackQuery, useGetMyFeedbackSubmissionsQuery } from '../feedbackApi.js';
import { useAuth } from '../../../hooks/useAuth.js';

export function TrackFeedbackPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('lookup'); // 'lookup' | 'my-cases'
  const [inputCode, setInputCode] = useState(searchParams.get('code') || '');

  // Confidential code tracking
  const [triggerTrack, { data: resData, isLoading, isError, error }] = useLazyGetTrackedFeedbackQuery();
  const trackedCase = resData?.data;

  // Authenticated user's submissions
  const { data: myCasesData, isLoading: isLoadingMyCases } = useGetMyFeedbackSubmissionsQuery(undefined, {
    skip: !user
  });
  const myCases = myCasesData?.data || [];

  useEffect(() => {
    const codeParam = searchParams.get('code');
    if (codeParam && codeParam.trim()) {
      const cleanCode = codeParam.trim().toUpperCase();
      setInputCode(cleanCode);
      setActiveTab('lookup');
      triggerTrack(cleanCode);
    }
  }, [searchParams, triggerTrack]);

  const handleSearch = (e) => {
    e?.preventDefault();
    if (!inputCode.trim()) {
      return toast.error('Please enter a valid tracking code.');
    }
    const cleanCode = inputCode.trim().toUpperCase();
    setSearchParams({ code: cleanCode });
    triggerTrack(cleanCode);
  };

  const handleSelectCase = (code) => {
    setInputCode(code);
    setActiveTab('lookup');
    setSearchParams({ code });
    triggerTrack(code);
  };

  const steps = [
    { key: 'Submitted', label: 'Registered' },
    { key: 'Under Review', label: 'Under Review' },
    { key: 'In Investigation', label: 'Investigation' },
    { key: 'Resolved', label: 'Resolution' }
  ];

  const getStepIndex = (status) => {
    if (status === 'Submitted') return 0;
    if (status === 'Under Review') return 1;
    if (status === 'In Investigation') return 2;
    if (status === 'Resolved' || status === 'Dismissed' || status === 'Escalated') return 3;
    return 0;
  };

  const currentStep = getStepIndex(trackedCase?.status);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-xl bg-[#00C471]/15 text-[#00C471] border border-[#00C471]/30">
              <Search className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-[#F8FAFC]">
                  Grievance & Feedback Tracker
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold bg-[#00C471]/15 text-[#00C471] border border-[#00C471]/30">
                  Live Audit
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-[#7E9E8F] mt-1 max-w-xl">
                Track investigation progression, review official findings, and view investigator notes via confidential code or your employee account.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/feedback/submit')}
            className="self-start sm:self-auto px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-[#CBD5E1] bg-slate-100 dark:bg-[#0A110D] hover:bg-slate-200 dark:hover:bg-[#1A3125] border border-slate-200 dark:border-[#1A3125] transition-all flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Submit New Case</span>
          </button>
        </div>

        {/* Segmented Navigation Tabs */}
        {user && (
          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-[#1A3125] flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('lookup')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'lookup'
                  ? 'bg-[#00C471] text-white shadow-sm'
                  : 'text-slate-600 dark:text-[#7E9E8F] hover:text-slate-900 dark:hover:text-[#F8FAFC]'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Confidential Code Lookup</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('my-cases')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'my-cases'
                  ? 'bg-[#00C471] text-white shadow-sm'
                  : 'text-slate-600 dark:text-[#7E9E8F] hover:text-slate-900 dark:hover:text-[#F8FAFC]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>My Submitted Cases ({myCases.length})</span>
            </button>
          </div>
        )}
      </div>

      {/* Tab 1: Confidential Code Lookup */}
      {activeTab === 'lookup' && (
        <div className="space-y-6">
          {/* Search Card */}
          <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-6 shadow-sm">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Shield className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400 dark:text-[#7E9E8F]" />
                <input
                  type="text"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                  placeholder="Enter Tracking Code (e.g. TRK-ABC123)"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#0A110D] font-mono font-bold tracking-wider text-slate-900 dark:text-[#F8FAFC] text-xs sm:text-sm focus:outline-none focus:border-[#00C471] focus:ring-1 focus:ring-[#00C471] transition-all placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-400 dark:placeholder:text-[#4E6E5D]"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2.5 rounded-xl bg-[#00C471] hover:bg-[#00B064] text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Searching...</span>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Track Progress</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Error Banner */}
          {isError && (
            <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/40 text-center">
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-500 mx-auto flex items-center justify-center mb-3">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-rose-900 dark:text-rose-200 text-sm">Case Docket Not Found</h3>
              <p className="text-xs text-rose-700 dark:text-rose-400 mt-1 max-w-md mx-auto leading-relaxed">
                {error?.data?.message || 'No record matches this tracking code. Please verify the code or check your submission confirmation.'}
              </p>
            </div>
          )}

          {/* Active Case Details */}
          {trackedCase && (
            <div className="space-y-6">
              {/* Primary Case Summary Card */}
              <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-6 sm:p-8 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-[#1A3125]">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold tracking-widest text-[#00C471] uppercase">
                        Docket #{trackedCase.trackingCode}
                      </span>
                      {trackedCase.isAnonymous && (
                        <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-[#00C471]/15 text-[#00C471] border border-[#00C471]/30">
                          🛡️ Anonymous
                        </span>
                      )}
                      {trackedCase.isEscalated && (
                        <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                          Escalated to Leadership
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-[#F8FAFC] mt-1.5">
                      {trackedCase.title}
                    </h2>
                    <div className="flex flex-wrap items-center gap-2 mt-2.5">
                      <span className="px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-[#0A110D] border border-slate-200 dark:border-[#1A3125] text-slate-700 dark:text-[#CBD5E1]">
                        Category: {trackedCase.category}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-[#0A110D] border border-slate-200 dark:border-[#1A3125] text-slate-700 dark:text-[#CBD5E1]">
                        Priority: {trackedCase.priority}
                      </span>
                      {trackedCase.departmentId && (
                        <span className="px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-[#0A110D] border border-slate-200 dark:border-[#1A3125] text-slate-700 dark:text-[#CBD5E1]">
                          Dept: {trackedCase.departmentId.name || 'Assigned'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="sm:text-right">
                    <span className={`inline-block px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider ${
                      trackedCase.status === 'Resolved'
                        ? 'bg-[#00C471]/15 text-[#00C471] border border-[#00C471]/30'
                        : trackedCase.status === 'Dismissed'
                        ? 'bg-slate-500/15 text-slate-400 border border-slate-500/30'
                        : trackedCase.status === 'Escalated'
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                    }`}>
                      {trackedCase.status}
                    </span>
                    <p className="text-[11px] font-mono text-slate-400 dark:text-[#7E9E8F] mt-1.5">
                      Registered on {new Date(trackedCase.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* 4-Stage Visual Timeline */}
                <div className="py-6 border-b border-slate-200 dark:border-[#1A3125]">
                  <div className="grid grid-cols-4 gap-2 text-center">
                    {steps.map((step, idx) => {
                      const isPassed = idx <= currentStep;
                      const isCurrent = idx === currentStep;
                      return (
                        <div key={step.key} className="flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                            isCurrent
                              ? 'bg-[#00C471] text-white ring-4 ring-[#00C471]/20'
                              : isPassed
                              ? 'bg-[#00C471]/20 text-[#00C471] border border-[#00C471]/40'
                              : 'bg-slate-100 dark:bg-[#0A110D] border border-slate-200 dark:border-[#1A3125] text-slate-400 dark:text-[#4E6E5D]'
                          }`}>
                            {isPassed ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                          </div>
                          <span className={`text-[11px] sm:text-xs mt-2 font-medium ${
                            isCurrent
                              ? 'text-[#00C471] font-bold'
                              : isPassed
                              ? 'text-slate-900 dark:text-[#F8FAFC]'
                              : 'text-slate-400 dark:text-[#4E6E5D]'
                          }`}>
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Description */}
                <div className="pt-6">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-[#7E9E8F] mb-2">
                    Case Narrative & Evidence Details
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-[#CBD5E1] whitespace-pre-wrap leading-relaxed">
                    {trackedCase.description}
                  </p>
                </div>

                {/* Attachments if any */}
                {trackedCase.attachments && trackedCase.attachments.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-slate-200 dark:border-[#1A3125]">
                    <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-[#7E9E8F] mb-2 flex items-center gap-1.5">
                      <Paperclip className="w-3.5 h-3.5 text-[#00C471]" />
                      <span>Vaulted Evidence Attachments ({trackedCase.attachments.length})</span>
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {trackedCase.attachments.map((url, idx) => (
                        <a
                          key={idx}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#0A110D] border border-slate-200 dark:border-[#1A3125] text-xs font-mono text-[#00C471] hover:border-[#00C471]/50 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span className="truncate max-w-[220px]">Attachment #{idx + 1}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Resolution Findings */}
              {trackedCase.resolutionNote && (
                <div className="bg-[#00C471]/10 border border-[#00C471]/30 rounded-2xl p-6">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#00C471] mt-0.5 shrink-0" />
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-[#F8FAFC] text-sm sm:text-base">
                        Official Resolution & Closing Findings
                      </h4>
                      <p className="mt-1 text-xs sm:text-sm text-slate-700 dark:text-[#CBD5E1] leading-relaxed whitespace-pre-wrap">
                        {trackedCase.resolutionNote}
                      </p>
                      {trackedCase.resolvedAt && (
                        <p className="mt-2 text-[11px] font-mono text-[#00C471]">
                          Formal conclusion logged on {new Date(trackedCase.resolvedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Public Case Notes & Updates */}
              <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC] flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-[#00C471]" />
                    <span>Investigation Updates ({trackedCase.caseNotes?.length || 0})</span>
                  </h3>
                  <span className="text-[10px] text-slate-400 dark:text-[#7E9E8F] flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#00C471]" />
                    Sanitized public entries
                  </span>
                </div>

                {(!trackedCase.caseNotes || trackedCase.caseNotes.length === 0) ? (
                  <div className="py-6 text-center text-xs text-slate-500 dark:text-[#7E9E8F]">
                    No public updates or investigator notes have been dispatched for this case yet.
                  </div>
                ) : (
                  <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-[#1A3125]">
                    {trackedCase.caseNotes.map((note) => (
                      <div key={note._id} className="relative">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#00C471] absolute -left-[1.55rem] top-1.5 ring-4 ring-white dark:ring-[#111D17]" />
                        <div className="bg-slate-50 dark:bg-[#0A110D] rounded-xl p-3.5 border border-slate-200 dark:border-[#1A3125]">
                          <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-[#7E9E8F] mb-1">
                            <span className="font-semibold text-slate-900 dark:text-[#F8FAFC]">
                              {note.authorRole || 'Investigating Officer'}
                            </span>
                            <span className="font-mono">{new Date(note.createdAt).toLocaleString()}</span>
                          </div>
                          <p className="text-xs text-slate-700 dark:text-[#CBD5E1] leading-relaxed">
                            {note.note}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: My Submitted Cases */}
      {activeTab === 'my-cases' && user && (
        <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-[#F8FAFC]">
                My Submitted Cases
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#7E9E8F] mt-0.5">
                Cases submitted under your employee profile. Click any case to load its full tracking docket.
              </p>
            </div>
          </div>

          {isLoadingMyCases ? (
            <div className="py-8 text-center text-xs text-slate-500 dark:text-[#7E9E8F]">
              Loading your submitted cases...
            </div>
          ) : myCases.length === 0 ? (
            <div className="py-12 text-center">
              <FolderOpen className="w-10 h-10 text-slate-400 dark:text-[#4E6E5D] mx-auto mb-2" />
              <p className="text-xs text-slate-500 dark:text-[#7E9E8F]">
                You have not submitted any named grievances or feedback cases yet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-[#1A3125] text-[10px] uppercase font-bold text-slate-400 dark:text-[#7E9E8F]">
                    <th className="py-2.5 px-3">Docket Code</th>
                    <th className="py-2.5 px-3">Subject</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Priority</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Filed Date</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#1A3125]">
                  {myCases.map((c) => (
                    <tr
                      key={c._id}
                      className="hover:bg-slate-50 dark:hover:bg-[#0A110D] transition-colors"
                    >
                      <td className="py-3 px-3 font-mono font-bold text-[#00C471]">
                        {c.trackingCode}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-900 dark:text-[#F8FAFC] max-w-[200px] truncate">
                        {c.title}
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-[#CBD5E1]">
                        {c.category}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          c.priority === 'Urgent'
                            ? 'bg-rose-500/15 text-rose-400'
                            : c.priority === 'High'
                            ? 'bg-amber-500/15 text-amber-400'
                            : 'bg-slate-100 dark:bg-[#1A3125] text-slate-600 dark:text-[#CBD5E1]'
                        }`}>
                          {c.priority}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          c.status === 'Resolved'
                            ? 'bg-[#00C471]/15 text-[#00C471]'
                            : c.status === 'Dismissed'
                            ? 'bg-slate-500/15 text-slate-400'
                            : c.status === 'Escalated'
                            ? 'bg-amber-500/15 text-amber-400'
                            : 'bg-blue-500/15 text-blue-400'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-400 dark:text-[#7E9E8F]">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleSelectCase(c.trackingCode)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold text-[#00C471] bg-[#00C471]/10 hover:bg-[#00C471]/20 border border-[#00C471]/30 transition-all inline-flex items-center gap-1"
                        >
                          <span>Inspect</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default TrackFeedbackPage;

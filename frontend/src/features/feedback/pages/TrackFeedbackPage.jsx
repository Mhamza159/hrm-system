/**
 * @file TrackFeedbackPage.jsx
 * @description Public / confidential status tracking page for anonymous grievances (BUILD-GUIDE Row 21.4).
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Search,
  Shield,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  UserCheck,
  ArrowLeft,
  ChevronRight,
  MessageSquare
} from 'lucide-react';
import { toast } from 'sonner';
import { useLazyGetTrackedFeedbackQuery } from '../feedbackApi.js';

export function TrackFeedbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [triggerTrack, { data: resData, isLoading, isError, error }] = useLazyGetTrackedFeedbackQuery();

  const [inputCode, setInputCode] = useState(searchParams.get('code') || '');

  const trackedCase = resData?.data;

  useEffect(() => {
    const codeParam = searchParams.get('code');
    if (codeParam && codeParam.trim()) {
      const cleanCode = codeParam.trim().toUpperCase();
      setInputCode(cleanCode);
      triggerTrack(cleanCode);
    }
  }, [searchParams, triggerTrack]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!inputCode.trim()) {
      return toast.error('Please enter a tracking code');
    }
    triggerTrack(inputCode.trim().toUpperCase());
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
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          type="button"
          onClick={() => navigate('/feedback/submit')}
          className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 flex items-center gap-1 mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Submit Feedback
        </button>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-3">
          <Search className="w-8 h-8 text-primary" />
          Track Feedback or Grievance
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Enter your confidential tracking code to review investigator findings, status changes, and resolution notes.
        </p>
      </div>

      {/* Code Search Input Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm mb-8">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Shield className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              placeholder="e.g. TRK-A8F2C1"
              className="w-full pl-11 pr-4 py-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-semibold tracking-wider text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-3 rounded-lg bg-primary hover:bg-primary/90 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
          >
            {isLoading ? 'Searching...' : 'Track Case'}
          </button>
        </form>
      </div>

      {/* Case Not Found Error */}
      {isError && (
        <div className="p-6 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 text-center">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
          <h3 className="font-bold text-rose-900 dark:text-rose-200">Case Not Found</h3>
          <p className="text-sm text-rose-700 dark:text-rose-400 mt-1">
            {error?.data?.message || 'No grievance was found matching this tracking code. Please verify the code and try again.'}
          </p>
        </div>
      )}

      {/* Case Details Display */}
      {trackedCase && (
        <div className="space-y-6">
          {/* Main Status Header Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-xs font-mono font-bold tracking-widest text-primary uppercase">
                  Case {trackedCase.trackingCode}
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {trackedCase.title}
                </h2>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    Category: {trackedCase.category}
                  </span>
                  <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    Priority: {trackedCase.priority}
                  </span>
                  {trackedCase.isAnonymous && (
                    <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
                      Anonymous
                    </span>
                  )}
                  {trackedCase.isEscalated && (
                    <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300">
                      Escalated to Executive
                    </span>
                  )}
                </div>
              </div>

              <div className="sm:text-right">
                <span className={`inline-block px-3 py-1.5 rounded-lg text-sm font-bold uppercase tracking-wider ${
                  trackedCase.status === 'Resolved'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                    : trackedCase.status === 'Dismissed'
                    ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    : trackedCase.status === 'Escalated'
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
                    : 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
                }`}>
                  {trackedCase.status}
                </span>
                <p className="text-xs text-slate-400 mt-1.5">
                  Logged on {new Date(trackedCase.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Stepper */}
            <div className="py-6 border-b border-slate-200 dark:border-slate-800">
              <div className="grid grid-cols-4 gap-2 text-center">
                {steps.map((step, idx) => {
                  const isPassed = idx <= currentStep;
                  const isCurrent = idx === currentStep;
                  return (
                    <div key={step.key} className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isCurrent
                          ? 'bg-primary text-white ring-4 ring-primary/20'
                          : isPassed
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                      }`}>
                        {isPassed ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                      </div>
                      <span className={`text-xs mt-2 font-medium ${isCurrent ? 'text-primary font-bold' : isPassed ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400'}`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Description */}
            <div className="pt-6">
              <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-2">
                Original Submission
              </h4>
              <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                {trackedCase.description}
              </p>
            </div>
          </div>

          {/* Resolution Card if finalized */}
          {trackedCase.resolutionNote && (
            <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-emerald-900 dark:text-emerald-100 text-base">
                    Resolution Findings
                  </h4>
                  <p className="mt-1 text-sm text-emerald-800 dark:text-emerald-300 leading-relaxed whitespace-pre-wrap">
                    {trackedCase.resolutionNote}
                  </p>
                  {trackedCase.resolvedAt && (
                    <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">
                      Closed on {new Date(trackedCase.resolvedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Public Timeline & Notes */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-4">
              <MessageSquare className="w-5 h-5 text-primary" />
              Investigation Progress & Updates ({trackedCase.caseNotes?.length || 0})
            </h3>

            {(!trackedCase.caseNotes || trackedCase.caseNotes.length === 0) ? (
              <p className="text-sm text-slate-500 py-4 text-center">
                No public notes have been posted to this case yet.
              </p>
            ) : (
              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                {trackedCase.caseNotes.map((note) => (
                  <div key={note._id} className="relative">
                    <span className="w-3 h-3 rounded-full bg-primary absolute -left-[1.65rem] top-1.5 ring-4 ring-white dark:ring-slate-900" />
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3.5 border border-slate-200 dark:border-slate-800">
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {note.authorRole || 'Investigator'}
                        </span>
                        <span>{new Date(note.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
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
  );
}

export default TrackFeedbackPage;

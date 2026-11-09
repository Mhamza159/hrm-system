/**
 * @file SurveysPage.jsx
 * @description Company Pulse Surveys & Polls Management with Analytics (BUILD-GUIDE Rows 20.4 & 20.5).
 */

import React, { useState } from 'react';
import {
  BarChart2,
  Plus,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ChevronRight,
  TrendingUp,
  X,
  Users
} from 'lucide-react';
import {
  useGetSurveysQuery,
  useGetSurveyAnalyticsQuery
} from '../rewardsApi.js';
import { useAuth } from '../../../hooks/useAuth.js';
import { SurveyBuilderModal } from '../components/SurveyBuilderModal.jsx';
import { SurveyFillModal } from '../components/SurveyFillModal.jsx';
import { RatingBreakdownChart } from '../components/RatingBreakdownChart.jsx';

export const SurveysPage = () => {
  const { user, isHR, isSuperAdmin } = useAuth();
  const canManage = isSuperAdmin || isHR;

  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [activeSurveyForFill, setActiveSurveyForFill] = useState(null);
  const [activeSurveyForAnalytics, setActiveSurveyForAnalytics] = useState(null);

  const { data: surveysRes, isLoading, refetch } = useGetSurveysQuery();
  const surveys = surveysRes?.data || [];

  const { data: analyticsRes, isLoading: isLoadingAnalytics } = useGetSurveyAnalyticsQuery(
    activeSurveyForAnalytics?._id,
    { skip: !activeSurveyForAnalytics }
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <BarChart2 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Company Pulse Surveys & Polls
              </h1>
              <p className="text-xs text-slate-500">
                Gather honest anonymous feedback, measure workplace sentiment, and analyze trends
              </p>
            </div>
          </div>
        </div>

        {canManage && (
          <button
            onClick={() => setIsBuilderOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary/90 text-white text-xs font-semibold rounded-xl shadow-sm transition-all self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Create Survey</span>
          </button>
        )}
      </div>

      {/* Surveys List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center text-xs text-slate-400 gap-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            <span>Loading active surveys...</span>
          </div>
        ) : surveys.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-8">
            <BarChart2 className="h-10 w-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No pulse surveys active right now
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Check back later or launch a new survey to check team sentiment.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {surveys.map((survey) => {
              const isExpired = new Date() > new Date(survey.expiresAt);
              const isActive = survey.status === 'active' && !isExpired;

              return (
                <div
                  key={survey._id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full ${
                            isActive
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                          }`}
                        >
                          {isActive ? 'Active' : 'Closed'}
                        </span>
                        <span className="text-[11px] text-slate-400 capitalize">
                          {survey.type}
                        </span>
                      </div>

                      {survey.isAnonymous && (
                        <div className="flex items-center gap-1 text-[11px] text-slate-500">
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                          <span>Anonymous</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {survey.title}
                      </h3>
                      {survey.description && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                          {survey.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        Expires {new Date(survey.expiresAt).toLocaleDateString()}
                      </span>
                      <span>{(survey.questions || []).length} questions</span>
                      <span>{survey.responseCount || 0} responses</span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                    {survey.hasResponded ? (
                      <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Feedback Submitted</span>
                      </div>
                    ) : isActive ? (
                      <button
                        onClick={() => setActiveSurveyForFill(survey)}
                        className="px-4 py-2 bg-primary hover:bg-primary/90 text-white text-xs font-semibold rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                      >
                        <span>Take Survey</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Submission window closed</span>
                    )}

                    {canManage && (
                      <button
                        onClick={() => setActiveSurveyForAnalytics(survey)}
                        className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 rounded-xl transition-colors flex items-center gap-1.5"
                      >
                        <TrendingUp className="h-3.5 w-3.5 text-primary" />
                        <span>Analytics</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Analytics Modal Drawer */}
      {activeSurveyForAnalytics && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 text-primary rounded-xl">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-base">
                    Survey Analytics & Sentiment
                  </h3>
                  <p className="text-xs text-slate-500">{activeSurveyForAnalytics.title}</p>
                </div>
              </div>
              <button
                onClick={() => setActiveSurveyForAnalytics(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {isLoadingAnalytics ? (
                <div className="py-12 flex flex-col items-center justify-center text-xs text-slate-400 gap-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  <span>Aggregating survey responses...</span>
                </div>
              ) : (
                <RatingBreakdownChart analytics={analyticsRes?.data} />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <SurveyBuilderModal
        isOpen={isBuilderOpen}
        onClose={() => setIsBuilderOpen(false)}
      />

      <SurveyFillModal
        isOpen={Boolean(activeSurveyForFill)}
        onClose={() => setActiveSurveyForFill(null)}
        survey={activeSurveyForFill}
      />
    </div>
  );
};


/**
 * @file SurveysPage.jsx
 * @description Company Pulse Surveys & Polls Management with Analytics (BUILD-GUIDE Rows 20.4 & 20.5).
 */

import React, { useState, useMemo } from 'react';
import {
  BarChart2,
  Plus,
  ShieldCheck,
  Clock,
  ChevronRight,
  TrendingUp,
  X,
  Users,
  Search,
  Check,
  FileText
} from 'lucide-react';
import {
  useGetSurveysQuery,
  useGetSurveyAnalyticsQuery
} from '../rewardsApi.js';
import { usePermission } from '../../../hooks/usePermission.js';
import { SurveyBuilderModal } from '../components/SurveyBuilderModal.jsx';
import { SurveyFillModal } from '../components/SurveyFillModal.jsx';
import { RatingBreakdownChart } from '../components/RatingBreakdownChart.jsx';

export const SurveysPage = () => {
  const { can, isSuperAdmin } = usePermission();
  const canManage = isSuperAdmin || can('rewards.manage', 'Rewards');
  const canRespond = isSuperAdmin || can('rewards.respond', 'Rewards');

  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'active' | 'closed' | 'pending'
  const [searchQuery, setSearchQuery] = useState('');
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [activeSurveyForFill, setActiveSurveyForFill] = useState(null);
  const [activeSurveyForAnalytics, setActiveSurveyForAnalytics] = useState(null);

  const { data: surveysRes, isLoading } = useGetSurveysQuery();
  const rawSurveys = surveysRes?.data || [];
  const surveysList = Array.isArray(rawSurveys) ? rawSurveys : [];

  const { data: analyticsRes, isLoading: isLoadingAnalytics } = useGetSurveyAnalyticsQuery(
    activeSurveyForAnalytics?._id,
    { skip: !activeSurveyForAnalytics }
  );

  // Filtered surveys
  const filteredSurveys = useMemo(() => {
    let result = surveysList;

    // Filter by tab
    if (activeTab === 'active') {
      result = result.filter((s) => s.status === 'active' && new Date() <= new Date(s.expiresAt));
    } else if (activeTab === 'closed') {
      result = result.filter((s) => s.status !== 'active' || new Date() > new Date(s.expiresAt));
    } else if (activeTab === 'pending') {
      result = result.filter(
        (s) => s.status === 'active' && new Date() <= new Date(s.expiresAt) && !s.hasResponded
      );
    }

    // Filter by search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((s) => {
        const title = (s.title || '').toLowerCase();
        const desc = (s.description || '').toLowerCase();
        const dept = (s.departmentId?.name || '').toLowerCase();
        return title.includes(q) || desc.includes(q) || dept.includes(q);
      });
    }

    return result;
  }, [surveysList, activeTab, searchQuery]);

  // Aggregate KPI metrics
  const totalSurveys = surveysList.length;
  const activeCount = surveysList.filter(
    (s) => s.status === 'active' && new Date() <= new Date(s.expiresAt)
  ).length;
  const totalResponses = useMemo(() => {
    return surveysList.reduce((acc, s) => acc + (s.responseCount || 0), 0);
  }, [surveysList]);
  const pendingCount = surveysList.filter(
    (s) => s.status === 'active' && new Date() <= new Date(s.expiresAt) && !s.hasResponded
  ).length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#00C471]/10 text-[#00C471] rounded-2xl border border-[#00C471]/20">
            <BarChart2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-[#F8FAFC] tracking-tight">
              Company Pulse Surveys & Polls
            </h1>
            <p className="text-xs text-slate-500 dark:text-[#7E9E8F]">
              Gather honest anonymous feedback, measure workplace sentiment, and analyze operational trends
            </p>
          </div>
        </div>

        {canManage && (
          <button
            onClick={() => setIsBuilderOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-[#00C471] hover:bg-[#00E584] text-white text-xs font-semibold rounded-xl shadow-sm transition-all self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Create Survey</span>
          </button>
        )}
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-[#7E9E8F]">Total Surveys</span>
            <FileText className="h-4 w-4 text-[#00C471]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-[#F8FAFC]">
              {totalSurveys}
            </span>
            <span className="text-[11px] text-slate-400">All-time</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-[#7E9E8F]">Active Polls</span>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-[#F8FAFC]">
              {activeCount}
            </span>
            <span className="text-[11px] text-[#00C471] font-medium">Open now</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-[#7E9E8F]">Total Responses</span>
            <Users className="h-4 w-4 text-violet-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-[#F8FAFC]">
              {totalResponses}
            </span>
            <span className="text-[11px] text-violet-500 font-medium">Collected</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-[#7E9E8F]">My Pending</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-[#F8FAFC]">
              {pendingCount}
            </span>
            <span className="text-[11px] text-amber-500 font-medium">To complete</span>
          </div>
        </div>
      </div>

      {/* Segmented Status Tabs & Search Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Segmented Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all', label: 'All Surveys' },
            { id: 'active', label: 'Active Polls' },
            { id: 'pending', label: 'My Pending' },
            { id: 'closed', label: 'Closed / Historical' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-[#00C471] text-white shadow-sm'
                  : 'bg-white dark:bg-[#111D17] text-slate-600 dark:text-[#7E9E8F] border border-slate-200 dark:border-[#1A3125] hover:border-slate-300 dark:hover:border-[#2D4A3A]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative max-w-xs w-full">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#7E9E8F]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search surveys or topics..."
            className="w-full text-xs pl-9 pr-8 py-2 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-[#00C471] focus:border-[#00C471] transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Surveys Grid */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-xs text-slate-400 dark:text-[#7E9E8F] gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#00C471] border-t-transparent" />
          <span>Loading pulse surveys...</span>
        </div>
      ) : filteredSurveys.length === 0 ? (
        <div className="py-16 text-center text-xs text-slate-400 dark:text-[#7E9E8F] bg-white dark:bg-[#111D17] border border-dashed border-slate-200 dark:border-[#1A3125] rounded-3xl p-8">
          <BarChart2 className="h-10 w-10 text-slate-300 dark:text-[#1A3125] mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-[#CBD5E1]">
            No surveys match this section
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {searchQuery ? 'Try a different search query or clear filters.' : 'Check back later or launch a new survey to check team sentiment.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSurveys.map((survey) => {
            const isExpired = new Date() > new Date(survey.expiresAt);
            const isActive = survey.status === 'active' && !isExpired;
            const qCount = (survey.questions || []).length;

            return (
              <div
                key={survey._id}
                className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all hover:border-slate-300 dark:hover:border-[#2D4A3A]"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full ${
                          isActive
                            ? 'bg-[#00C471]/10 text-[#00C471] border border-[#00C471]/20'
                            : 'bg-slate-100 dark:bg-[#1A3125] text-slate-500'
                        }`}
                      >
                        {isActive ? 'Active' : 'Closed'}
                      </span>
                      <span className="text-[11px] text-slate-400 capitalize">
                        {survey.type || 'Pulse'}
                      </span>
                    </div>

                    {survey.isAnonymous && (
                      <div className="flex items-center gap-1 text-[11px] text-[#00C471] font-semibold">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        <span>Anonymous</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC]">
                      {survey.title}
                    </h3>
                    {survey.description && (
                      <p className="text-xs text-slate-500 dark:text-[#7E9E8F] mt-1 line-clamp-2 leading-relaxed">
                        {survey.description}
                      </p>
                    )}
                  </div>

                  {/* Survey Meta badges */}
                  <div className="pt-2 flex items-center gap-3 text-xs text-slate-400 dark:text-[#7E9E8F] font-mono flex-wrap">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-amber-500" />
                      Deadline: {new Date(survey.expiresAt).toLocaleDateString()}
                    </span>
                    <span>•</span>
                    <span>{qCount} Questions</span>
                    <span>•</span>
                    <span className="text-[#00C471] font-bold">
                      {survey.responseCount || 0} Responses
                    </span>
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-[#1A3125] flex items-center justify-between gap-3">
                  {canManage && (
                    <button
                      onClick={() => setActiveSurveyForAnalytics(survey)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-[#CBD5E1] hover:text-[#00C471] border border-slate-200 dark:border-[#1A3125] rounded-xl hover:bg-slate-50 dark:hover:bg-[#1A3125] transition-colors"
                    >
                      <BarChart2 className="h-3.5 w-3.5 text-[#00C471]" />
                      <span>View Analytics</span>
                    </button>
                  )}

                  <div className="ml-auto">
                    {survey.hasResponded ? (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00C471]/10 text-[#00C471] border border-[#00C471]/20 rounded-xl text-xs font-semibold">
                        <Check className="h-4 w-4" />
                        <span>Response Recorded</span>
                      </div>
                    ) : isActive && canRespond ? (
                      <button
                        onClick={() => setActiveSurveyForFill(survey)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-[#00C471] hover:bg-[#00E584] text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
                      >
                        <span>Take Survey</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    ) : !isActive ? (
                      <span className="text-xs text-slate-400 italic">Poll Closed</span>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Survey Fill Modal */}
      <SurveyFillModal
        isOpen={Boolean(activeSurveyForFill)}
        onClose={() => setActiveSurveyForFill(null)}
        survey={activeSurveyForFill}
      />

      {/* Survey Builder Modal */}
      <SurveyBuilderModal
        isOpen={isBuilderOpen}
        onClose={() => setIsBuilderOpen(false)}
      />

      {/* Survey Analytics Modal */}
      {activeSurveyForAnalytics && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/15 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-3xl w-full max-w-3xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#0C1712] shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#00C471]/10 text-[#00C471] rounded-xl border border-[#00C471]/20">
                  <BarChart2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-[#F8FAFC] text-base">
                    Survey Analytics & Sentiment
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-[#7E9E8F]">
                    {activeSurveyForAnalytics.title}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveSurveyForAnalytics(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-[#F8FAFC] rounded-lg hover:bg-slate-100 dark:hover:bg-[#1A3125] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {isLoadingAnalytics ? (
                <div className="py-20 flex flex-col items-center justify-center text-xs text-slate-400 gap-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#00C471] border-t-transparent" />
                  <span>Computing analytics and distributions...</span>
                </div>
              ) : (
                <RatingBreakdownChart analytics={analyticsRes?.data} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

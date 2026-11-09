/**
 * @file GrievanceAdminPage.jsx
 * @description Administrative grievance management dashboard for HR and Super Admin (BUILD-GUIDE Row 21.2 & 21.5).
 */

import React, { useState } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  User,
  EyeOff,
  ChevronRight,
  Eye,
  RefreshCw
} from 'lucide-react';
import {
  useGetFeedbackListQuery,
  useGetGrievanceStatsQuery
} from '../feedbackApi.js';
import CaseDetailsDrawer from '../components/CaseDetailsDrawer.jsx';

export function GrievanceAdminPage() {
  const [selectedTab, setSelectedTab] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [search, setSearch] = useState('');
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Build query filters
  const queryParams = {
    search: search.trim() || undefined,
    category: selectedCategory || undefined
  };

  if (selectedTab === 'Active') {
    queryParams.status = 'In Investigation';
  } else if (selectedTab === 'Escalated') {
    queryParams.isEscalated = true;
  } else if (selectedTab === 'Resolved') {
    queryParams.status = 'Resolved';
  } else if (selectedTab === 'Suggestions') {
    queryParams.category = 'Suggestion';
  }

  const { data: listData, isLoading, refetch, isFetching } = useGetFeedbackListQuery(queryParams);
  const { data: statsData } = useGetGrievanceStatsQuery();

  const cases = listData?.data || [];
  const stats = statsData?.data || { total: 0, inInvestigation: 0, escalated: 0, resolved: 0 };

  const handleOpenCase = (id) => {
    setSelectedCaseId(id);
    setIsDrawerOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-primary" />
            Grievance & Feedback Management
          </h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">
            Triaging, investigation, and lifecycle tracking for employee suggestions and formal grievances.
          </p>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-2 hover:bg-slate-50 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs uppercase font-bold text-slate-400">Total Cases</span>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{stats.total || 0}</p>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs uppercase font-bold text-blue-500">In Investigation</span>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{stats.inInvestigation || 0}</p>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs uppercase font-bold text-amber-500">Escalated</span>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{stats.escalated || 0}</p>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs uppercase font-bold text-emerald-500">Resolved</span>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{stats.resolved || 0}</p>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm mb-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {['All', 'Active', 'Escalated', 'Resolved', 'Suggestions'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setSelectedTab(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  selectedTab === tab
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">All Categories</option>
              <option value="Suggestion">Suggestions</option>
              <option value="Grievance">Grievances</option>
              <option value="Workplace Issue">Workplace Issues</option>
              <option value="Safety">Safety</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by case code or subject..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
      </div>

      {/* Cases Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="py-20 text-center text-slate-400">Loading grievances...</div>
        ) : cases.length === 0 ? (
          <div className="py-20 text-center text-slate-500">
            <p className="font-semibold">No cases match your filters.</p>
            <p className="text-xs text-slate-400 mt-1">Try resetting the search terms or tab filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Tracking Code</th>
                  <th className="py-3.5 px-4">Subject</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Complainant</th>
                  <th className="py-3.5 px-4">Logged At</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {cases.map((c) => (
                  <tr
                    key={c._id}
                    onClick={() => handleOpenCase(c._id)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-primary">
                      {c.trackingCode}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-slate-100 max-w-xs truncate">
                      {c.title}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                      {c.category}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        c.priority === 'Urgent'
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                          : c.priority === 'High'
                          ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}>
                        {c.priority}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        c.status === 'Resolved'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : c.status === 'Escalated'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                      {c.isAnonymous ? (
                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                          <EyeOff className="w-3.5 h-3.5" /> Anonymous
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-blue-500" />
                          {c.submittedBy?.name || 'Named Employee'}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenCase(c._id);
                        }}
                        className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-primary hover:text-white transition-all text-xs font-medium"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Case Details Drawer */}
      <CaseDetailsDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          refetch();
        }}
        caseId={selectedCaseId}
      />
    </div>
  );
}

export default GrievanceAdminPage;

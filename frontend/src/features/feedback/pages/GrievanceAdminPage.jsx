/**
 * @file GrievanceAdminPage.jsx
 * @description Administrative grievance management dashboard for HR and Super Admin (BUILD-GUIDE Row 21.2 & 21.5).
 */

import React, { useState } from 'react';
import {
  ShieldAlert,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  User,
  EyeOff,
  RefreshCw,
  Lock,
  Layers,
  Inbox,
  Clock
} from 'lucide-react';
import {
  useGetFeedbackListQuery,
  useGetGrievanceStatsQuery
} from '../feedbackApi.js';
import CaseDetailsDrawer from '../components/CaseDetailsDrawer.jsx';
import { usePermission } from '../../../hooks/usePermission.js';

export function GrievanceAdminPage() {
  const { can, isSuperAdmin } = usePermission();
  const canManage = isSuperAdmin || can('feedback.manage', 'Feedback');

  const [selectedTab, setSelectedTab] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [search, setSearch] = useState('');
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Build query filters
  const queryParams = {
    search: search.trim() || undefined,
    category: selectedCategory || undefined,
    priority: selectedPriority || undefined
  };

  if (selectedTab === 'Active') {
    queryParams.status = 'In Investigation';
  } else if (selectedTab === 'Under Review') {
    queryParams.status = 'Under Review';
  } else if (selectedTab === 'Escalated') {
    queryParams.isEscalated = true;
  } else if (selectedTab === 'Resolved') {
    queryParams.status = 'Resolved';
  } else if (selectedTab === 'Suggestions') {
    queryParams.category = 'Suggestion';
  }

  const { data: listData, isLoading, refetch, isFetching } = useGetFeedbackListQuery(queryParams, {
    skip: !canManage
  });
  const { data: statsData } = useGetGrievanceStatsQuery(undefined, {
    skip: !canManage
  });

  const cases = listData?.data || [];
  const stats = statsData?.data || { total: 0, inInvestigation: 0, escalated: 0, resolved: 0 };

  const handleOpenCase = (id) => {
    setSelectedCaseId(id);
    setIsDrawerOpen(true);
  };

  // PBAC Restricted Screen if not authorized
  if (!canManage) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/30 mx-auto flex items-center justify-center mb-4">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-[#F8FAFC]">
          Access Restricted — Grievance Administration
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-[#7E9E8F] mt-2 max-w-md mx-auto leading-relaxed">
          Grievance administration is strictly restricted to HR Managers and Super Administrators. Department supervisors cannot access confidential employee grievance dockets.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] shadow-sm">
        <div className="flex items-start gap-3.5">
          <div className="p-3 rounded-xl bg-[#00C471]/15 text-[#00C471] border border-[#00C471]/30">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-[#F8FAFC]">
                Grievance & Case Administration
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold bg-[#00C471]/15 text-[#00C471] border border-[#00C471]/30">
                PBAC Protected
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-[#7E9E8F] mt-1 max-w-2xl leading-relaxed">
              Confidential triage, active investigation tracking, and formal dispute resolution for employee suggestions and formal grievances.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="self-start sm:self-auto px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-100 dark:bg-[#0A110D] hover:bg-slate-200 dark:hover:bg-[#1A3125] text-slate-700 dark:text-[#CBD5E1] text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#00C471] ${isFetching ? 'animate-spin' : ''}`} />
          <span>Refresh Docket</span>
        </button>
      </div>

      {/* Real-time KPI Metric Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] shadow-sm">
          <div className="flex items-center justify-between text-slate-400 dark:text-[#7E9E8F] mb-2">
            <span className="text-[11px] uppercase font-bold tracking-wider">Total Grievances</span>
            <Layers className="w-4 h-4 text-[#00C471]" />
          </div>
          <p className="text-2xl font-bold font-mono text-slate-900 dark:text-[#F8FAFC]">
            {stats.total || 0}
          </p>
          <span className="text-[10px] text-slate-400 dark:text-[#7E9E8F] mt-1 block">
            Across all categories
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] shadow-sm">
          <div className="flex items-center justify-between text-slate-400 dark:text-[#7E9E8F] mb-2">
            <span className="text-[11px] uppercase font-bold tracking-wider text-blue-400">In Investigation</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-blue-500 dark:text-blue-400">
            {stats.inInvestigation || 0}
          </p>
          <span className="text-[10px] text-slate-400 dark:text-[#7E9E8F] mt-1 block">
            Active evidence phase
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] shadow-sm">
          <div className="flex items-center justify-between text-slate-400 dark:text-[#7E9E8F] mb-2">
            <span className="text-[11px] uppercase font-bold tracking-wider text-amber-400">Escalated</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-amber-500 dark:text-amber-400">
            {stats.escalated || 0}
          </p>
          <span className="text-[10px] text-slate-400 dark:text-[#7E9E8F] mt-1 block">
            Executive oversight
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] shadow-sm">
          <div className="flex items-center justify-between text-slate-400 dark:text-[#7E9E8F] mb-2">
            <span className="text-[11px] uppercase font-bold tracking-wider text-[#00C471]">Resolved / Closed</span>
            <CheckCircle2 className="w-4 h-4 text-[#00C471]" />
          </div>
          <p className="text-2xl font-bold font-mono text-[#00C471]">
            {stats.resolved || 0}
          </p>
          <span className="text-[10px] text-slate-400 dark:text-[#7E9E8F] mt-1 block">
            Formal closure recorded
          </span>
        </div>
      </div>

      {/* Filter Tabs, Search & Dropdowns */}
      <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-4 shadow-sm space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-[#1A3125] pb-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {['All', 'Active', 'Under Review', 'Escalated', 'Resolved', 'Suggestions'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setSelectedTab(tab)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                  selectedTab === tab
                    ? 'bg-[#00C471] text-white shadow-sm'
                    : 'text-slate-600 dark:text-[#7E9E8F] hover:bg-slate-100 dark:hover:bg-[#0A110D]'
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
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#0A110D] text-slate-700 dark:text-[#CBD5E1] text-xs focus:outline-none focus:border-[#00C471]"
            >
              <option value="">All Categories</option>
              <option value="Suggestion">Open Suggestions</option>
              <option value="Grievance">Formal Grievances</option>
              <option value="Workplace Issue">Workplace Issues</option>
              <option value="Safety">Health & Safety</option>
              <option value="Other">Other Matters</option>
            </select>

            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#0A110D] text-slate-700 dark:text-[#CBD5E1] text-xs focus:outline-none focus:border-[#00C471]"
            >
              <option value="">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400 dark:text-[#7E9E8F]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search docket by tracking code, employee name, or subject keywords..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#0A110D] text-slate-900 dark:text-[#F8FAFC] text-xs focus:outline-none focus:border-[#00C471] focus:ring-1 focus:ring-[#00C471] placeholder:text-slate-400 dark:placeholder:text-[#4E6E5D]"
          />
        </div>
      </div>

      {/* Case Management Docket Table */}
      <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="py-20 text-center text-xs text-slate-400 dark:text-[#7E9E8F]">
            Loading grievance docket records...
          </div>
        ) : cases.length === 0 ? (
          <div className="py-20 text-center">
            <Inbox className="w-10 h-10 text-slate-400 dark:text-[#4E6E5D] mx-auto mb-2" />
            <p className="font-semibold text-xs text-slate-700 dark:text-[#CBD5E1]">
              No grievance cases match the selected filters.
            </p>
            <p className="text-[11px] text-slate-400 dark:text-[#7E9E8F] mt-1">
              Try adjusting category or search parameters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#0A110D] text-[10px] uppercase font-bold text-slate-400 dark:text-[#7E9E8F] border-b border-slate-200 dark:border-[#1A3125]">
                <tr>
                  <th className="py-3 px-4">Docket Code</th>
                  <th className="py-3 px-4">Subject & Narrative</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Complainant</th>
                  <th className="py-3 px-4">Filing Date</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#1A3125]">
                {cases.map((c) => (
                  <tr
                    key={c._id}
                    onClick={() => handleOpenCase(c._id)}
                    className="hover:bg-slate-50 dark:hover:bg-[#0A110D] cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-[#00C471]">
                      {c.trackingCode}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="font-semibold text-slate-900 dark:text-[#F8FAFC] truncate">
                        {c.title}
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-[#7E9E8F] truncate mt-0.5">
                        {c.description}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-[#CBD5E1]">
                      {c.category}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        c.priority === 'Urgent'
                          ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          : c.priority === 'High'
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          : 'bg-slate-100 dark:bg-[#1A3125] text-slate-600 dark:text-[#CBD5E1]'
                      }`}>
                        {c.priority}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        c.status === 'Resolved'
                          ? 'bg-[#00C471]/15 text-[#00C471] border border-[#00C471]/30'
                          : c.status === 'Dismissed'
                          ? 'bg-slate-500/15 text-slate-400 border border-slate-500/30'
                          : c.status === 'Escalated'
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-[#CBD5E1]">
                      {c.isAnonymous ? (
                        <span className="inline-flex items-center gap-1 text-[#00C471] font-medium">
                          <EyeOff className="w-3.5 h-3.5" /> Anonymous
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-blue-400" />
                          {c.submittedBy?.name || 'Named Employee'}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400 dark:text-[#7E9E8F]">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenCase(c._id);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#0A110D] hover:bg-[#00C471]/20 hover:text-[#00C471] text-slate-700 dark:text-[#CBD5E1] border border-slate-200 dark:border-[#1A3125] transition-all text-xs font-semibold inline-flex items-center gap-1"
                      >
                        <span>Inspect</span>
                        <ArrowUpRight className="w-3 h-3 text-[#00C471]" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Case Details Slide-Over Drawer */}
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

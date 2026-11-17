/**
 * @file CommitteeDashboardPage.jsx
 * @description Quarantined Inquiry Committee portal for Workplace Harassment investigations (BUILD-GUIDE Row 21.3).
 */

import React, { useState, useMemo } from 'react';
import {
  Shield,
  Lock,
  Search,
  EyeOff,
  User,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { useGetFeedbackListQuery } from '../feedbackApi.js';
import CaseDetailsDrawer from '../components/CaseDetailsDrawer.jsx';
import { usePermission } from '../../../hooks/usePermission.js';

export function CommitteeDashboardPage() {
  const { can, isSuperAdmin } = usePermission();
  const canAccessCommittee = isSuperAdmin || can('grievance.committee', 'Feedback');

  const [search, setSearch] = useState('');
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');

  // Exclusively queries category: Harassment
  const { data: listData, isLoading, refetch, isFetching } = useGetFeedbackListQuery(
    {
      category: 'Harassment',
      search: search.trim() || undefined
    },
    { skip: !canAccessCommittee }
  );

  const rawCases = useMemo(() => listData?.data || [], [listData?.data]);

  // Filter cases by status
  const cases = useMemo(() => {
    if (statusFilter === 'All') return rawCases;
    if (statusFilter === 'Active') return rawCases.filter((c) => c.status === 'In Investigation' || c.status === 'Under Review');
    if (statusFilter === 'Escalated') return rawCases.filter((c) => c.isEscalated);
    if (statusFilter === 'Resolved') return rawCases.filter((c) => c.status === 'Resolved' || c.status === 'Dismissed');
    return rawCases;
  }, [rawCases, statusFilter]);

  // Derived statistics for Inquiry Committee
  const stats = useMemo(() => {
    const total = rawCases.length;
    const active = rawCases.filter((c) => c.status === 'In Investigation' || c.status === 'Under Review').length;
    const escalated = rawCases.filter((c) => c.isEscalated).length;
    const resolved = rawCases.filter((c) => c.status === 'Resolved' || c.status === 'Dismissed').length;
    return { total, active, escalated, resolved };
  }, [rawCases]);

  const handleOpenCase = (id) => {
    setSelectedCaseId(id);
    setIsDrawerOpen(true);
  };

  // PBAC Clearance Gate
  if (!canAccessCommittee) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/30 mx-auto flex items-center justify-center mb-4">
          <Lock className="w-8 h-8" />
        </div>
        <div className="inline-block px-3 py-1 rounded-full text-[10px] font-mono uppercase font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 mb-2">
          Statutory Clearance Required
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-[#F8FAFC]">
          Inquiry Committee Clearance Denied
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-[#7E9E8F] mt-2 max-w-md mx-auto leading-relaxed">
          This channel is strictly quarantined under the Pakistan Protection Against Harassment at the Workplace Act. Only certified committee inquiry officers and executive administrators have clearance to view this docket.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Quarantined Statutory Header Banner */}
      <div className="p-6 rounded-2xl bg-[#1A0B10] border border-rose-500/30 text-rose-100 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-rose-600 text-white shadow-md border border-rose-500/40">
              <Lock className="w-7 h-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-rose-600 text-white">
                  Restricted Clearance
                </span>
                <span className="text-[11px] text-rose-400 font-semibold">
                  Pakistan Protection Against Harassment at the Workplace Act
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 text-white">
                Inquiry Committee Investigation Channel
              </h1>
              <p className="text-xs sm:text-sm text-rose-200/80 mt-1 max-w-2xl leading-relaxed">
                This environment is strictly isolated. All cases appearing here are confidential harassment complaints quarantined from standard HR managers and departmental supervisors.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-2 shadow-sm self-start sm:self-auto transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            <span>Sync Docket</span>
          </button>
        </div>
      </div>

      {/* Inquiry Committee KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] shadow-sm">
          <div className="flex items-center justify-between text-slate-400 dark:text-[#7E9E8F] mb-2">
            <span className="text-[11px] uppercase font-bold tracking-wider text-rose-400">Quarantined Dockets</span>
            <Layers className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-slate-900 dark:text-[#F8FAFC]">
            {stats.total}
          </p>
          <span className="text-[10px] text-slate-400 dark:text-[#7E9E8F] mt-1 block">
            Harassment category cases
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] shadow-sm">
          <div className="flex items-center justify-between text-slate-400 dark:text-[#7E9E8F] mb-2">
            <span className="text-[11px] uppercase font-bold tracking-wider text-blue-400">Active Inquiries</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-blue-500 dark:text-blue-400">
            {stats.active}
          </p>
          <span className="text-[10px] text-slate-400 dark:text-[#7E9E8F] mt-1 block">
            Hearings & evidence gathering
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] shadow-sm">
          <div className="flex items-center justify-between text-slate-400 dark:text-[#7E9E8F] mb-2">
            <span className="text-[11px] uppercase font-bold tracking-wider text-amber-400">Executive Flagged</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-amber-500 dark:text-amber-400">
            {stats.escalated}
          </p>
          <span className="text-[10px] text-slate-400 dark:text-[#7E9E8F] mt-1 block">
            Super Admin escalated
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] shadow-sm">
          <div className="flex items-center justify-between text-slate-400 dark:text-[#7E9E8F] mb-2">
            <span className="text-[11px] uppercase font-bold tracking-wider text-[#00C471]">Concluded Cases</span>
            <CheckCircle2 className="w-4 h-4 text-[#00C471]" />
          </div>
          <p className="text-2xl font-bold font-mono text-[#00C471]">
            {stats.resolved}
          </p>
          <span className="text-[10px] text-slate-400 dark:text-[#7E9E8F] mt-1 block">
            Findings & closure recorded
          </span>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400 dark:text-[#7E9E8F]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search confidential docket by case code or subject..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#0A110D] text-slate-900 dark:text-[#F8FAFC] text-xs focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 placeholder:text-slate-400 dark:placeholder:text-[#4E6E5D]"
          />
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto overflow-x-auto">
          {['All', 'Active', 'Escalated', 'Resolved'].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                statusFilter === tab
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-[#7E9E8F] hover:bg-slate-100 dark:hover:bg-[#0A110D]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Harassment Cases Docket Table */}
      <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="py-20 text-center text-xs text-slate-400 dark:text-[#7E9E8F]">
            Accessing secure committee docket...
          </div>
        ) : cases.length === 0 ? (
          <div className="py-20 text-center">
            <Shield className="w-10 h-10 text-slate-400 dark:text-[#4E6E5D] mx-auto mb-2" />
            <p className="font-semibold text-xs text-slate-700 dark:text-[#CBD5E1]">
              No active harassment complaints in this filter view.
            </p>
            <p className="text-[11px] text-slate-400 dark:text-[#7E9E8F] mt-1">
              The confidential inquiry committee docket is clear.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#1A0B10]/40 text-rose-300 text-[10px] uppercase font-bold border-b border-rose-900/30">
                <tr>
                  <th className="py-3 px-4">Docket Code</th>
                  <th className="py-3 px-4">Subject & Narrative</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Investigation Stage</th>
                  <th className="py-3 px-4">Complainant Protection</th>
                  <th className="py-3 px-4">Filing Date</th>
                  <th className="py-3 px-4 text-right">Committee Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#1A3125]">
                {cases.map((c) => (
                  <tr
                    key={c._id}
                    onClick={() => handleOpenCase(c._id)}
                    className="hover:bg-rose-950/10 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-rose-400">
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
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        c.priority === 'Urgent'
                          ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      }`}>
                        {c.priority}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        c.status === 'Resolved'
                          ? 'bg-[#00C471]/15 text-[#00C471] border border-[#00C471]/30'
                          : c.status === 'Escalated'
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-[#CBD5E1]">
                      {c.isAnonymous ? (
                        <span className="inline-flex items-center gap-1 text-[#00C471] font-medium">
                          <EyeOff className="w-3.5 h-3.5" /> Anonymous Complainant
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
                        className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-600 hover:text-white transition-all text-xs font-semibold text-rose-400 border border-rose-500/30 inline-flex items-center gap-1"
                      >
                        <span>Examine Dossier</span>
                        <ArrowUpRight className="w-3 h-3" />
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

export default CommitteeDashboardPage;

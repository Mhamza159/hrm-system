import React, { useState, useMemo } from 'react';
import {
  Laptop,
  FileEdit,
  Clock,
  Calendar as CalendarIcon,
  CheckCircle2,
  AlertCircle,
  Clock3,
  Search,
  Filter,
  List,
  LayoutGrid,
  Plus,
  UserCheck,
  MessageSquare,
  ArrowRight,
  RefreshCw,
  X
} from 'lucide-react';
import {
  useGetMyWFHRequestsQuery,
  useGetMyCorrectionsQuery
} from '../attendanceApi.js';

export const MyRequestsView = ({ onApplyWFH, onRequestCorrection }) => {
  // Sub-tabs: 'wfh' | 'corrections'
  const [activeSubTab, setActiveSubTab] = useState('wfh');

  // View mode: 'table' | 'card'
  const [viewMode, setViewMode] = useState('table');

  // Status Filter: 'all' | 'pending' | 'approved' | 'rejected'
  const [statusFilter, setStatusFilter] = useState('all');

  // Search input
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch personal requests
  const {
    data: wfhData,
    isLoading: isWFHLoading,
    isFetching: isWFHFetching,
    refetch: refetchWFH
  } = useGetMyWFHRequestsQuery({ status: 'all' });

  const {
    data: correctionsData,
    isLoading: isCorrectionsLoading,
    isFetching: isCorrectionsFetching,
    refetch: refetchCorrections
  } = useGetMyCorrectionsQuery({ status: 'all' });

  const wfhList = wfhData?.data || [];
  const correctionsList = correctionsData?.data || [];

  // Counts calculation
  const wfhCounts = useMemo(() => ({
    all: wfhList.length,
    pending: wfhList.filter((r) => r.status === 'pending').length,
    approved: wfhList.filter((r) => r.status === 'approved').length,
    rejected: wfhList.filter((r) => r.status === 'rejected').length
  }), [wfhList]);

  const correctionsCounts = useMemo(() => ({
    all: correctionsList.length,
    pending: correctionsList.filter((r) => r.status === 'pending').length,
    approved: correctionsList.filter((r) => r.status === 'approved').length,
    rejected: correctionsList.filter((r) => r.status === 'rejected').length
  }), [correctionsList]);

  const activeCounts = activeSubTab === 'wfh' ? wfhCounts : correctionsCounts;

  // Filtered lists
  const filteredWFH = useMemo(() => {
    return wfhList.filter((item) => {
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      const q = searchQuery.trim().toLowerCase();
      if (!q) return matchesStatus;

      const dateStr = item.date ? new Date(item.date).toLocaleDateString() : '';
      const reasonStr = (item.reason || '').toLowerCase();
      const approverStr = (item.decisionBy?.name || '').toLowerCase();
      const remarksStr = (item.decisionReason || '').toLowerCase();

      return (
        matchesStatus &&
        (dateStr.includes(q) ||
          reasonStr.includes(q) ||
          approverStr.includes(q) ||
          remarksStr.includes(q))
      );
    });
  }, [wfhList, statusFilter, searchQuery]);

  const filteredCorrections = useMemo(() => {
    return correctionsList.filter((item) => {
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      const q = searchQuery.trim().toLowerCase();
      if (!q) return matchesStatus;

      const dateStr = item.date ? new Date(item.date).toLocaleDateString() : '';
      const reasonStr = (item.reason || '').toLowerCase();
      const approverStr = (item.decisionBy?.name || '').toLowerCase();
      const remarksStr = (item.decisionNotes || item.decisionReason || '').toLowerCase();

      return (
        matchesStatus &&
        (dateStr.includes(q) ||
          reasonStr.includes(q) ||
          approverStr.includes(q) ||
          remarksStr.includes(q))
      );
    });
  }, [correctionsList, statusFilter, searchQuery]);

  // Helpers
  const formatDate = (dateVal) => {
    if (!dateVal) return '-';
    try {
      const d = new Date(dateVal);
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return String(dateVal);
    }
  };

  const formatDateTime = (dateVal) => {
    if (!dateVal) return '-';
    try {
      const d = new Date(dateVal);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return String(dateVal);
    }
  };

  const formatTime = (isoVal) => {
    if (!isoVal) return '-';
    try {
      const d = new Date(isoVal);
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return String(isoVal);
    }
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Approved</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/60 shadow-2xs">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Rejected</span>
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span>Pending Review</span>
          </span>
        );
    }
  };

  const renderApproverAudit = (item) => {
    if (item.status === 'pending') {
      return (
        <div className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-300 bg-amber-50/60 dark:bg-amber-950/30 px-2.5 py-1.5 rounded-lg border border-amber-200/50 dark:border-amber-800/40">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span>Awaiting Manager / HR review</span>
        </div>
      );
    }

    const approverName = item.decisionBy?.name || 'Authorized Manager';
    const approverRole = (item.decisionBy?.role || item.decisionBy?.roles?.[0] || 'Approver').toUpperCase();
    const remarks = item.decisionNotes || item.decisionReason;

    return (
      <div className="space-y-1 text-xs">
        <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-medium">
          <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{approverName}</span>
          <span className="px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded text-[10px] font-semibold">
            {approverRole}
          </span>
        </div>
        <div className="text-[11px] text-slate-400 font-mono pl-5">
          {formatDateTime(item.decisionAt || item.updatedAt)}
        </div>
        {remarks && (
          <div className="pl-5 pt-0.5">
            <div className="flex items-start gap-1 text-[11px] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-1.5 rounded-md border border-slate-200/60 dark:border-slate-700/50">
              <MessageSquare className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
              <span className="italic">"{remarks}"</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  const isLoading = activeSubTab === 'wfh' ? isWFHLoading : isCorrectionsLoading;
  const isFetching = activeSubTab === 'wfh' ? isWFHFetching : isCorrectionsFetching;
  const currentList = activeSubTab === 'wfh' ? filteredWFH : filteredCorrections;

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* 1. TOP HEADER & SUB-TAB SWITCHER */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Tab Switcher (WFH vs Punch Corrections) */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
          <button
            onClick={() => {
              setActiveSubTab('wfh');
              setStatusFilter('all');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'wfh'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Laptop className="w-4 h-4" />
            <span>Work From Home</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                activeSubTab === 'wfh'
                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {wfhCounts.all}
            </span>
            {wfhCounts.pending > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" title={`${wfhCounts.pending} Pending Review`} />
            )}
          </button>

          <button
            onClick={() => {
              setActiveSubTab('corrections');
              setStatusFilter('all');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'corrections'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileEdit className="w-4 h-4" />
            <span>Punch Corrections</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                activeSubTab === 'corrections'
                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {correctionsCounts.all}
            </span>
            {correctionsCounts.pending > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" title={`${correctionsCounts.pending} Pending Review`} />
            )}
          </button>
        </div>

        {/* Right: Quick Action Buttons & Refresh */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              if (activeSubTab === 'wfh') refetchWFH();
              else refetchCorrections();
            }}
            className="p-2 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs"
            title="Refresh requests"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-emerald-600' : ''}`} />
          </button>

          {activeSubTab === 'wfh' ? (
            <button
              onClick={onApplyWFH}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Apply WFH</span>
            </button>
          ) : (
            <button
              onClick={onRequestCorrection}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Request Missed Punch</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. FILTER & VIEW CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Status Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All', count: activeCounts.all },
            { id: 'pending', label: 'Pending', count: activeCounts.pending, color: 'amber' },
            { id: 'approved', label: 'Approved', count: activeCounts.approved, color: 'emerald' },
            { id: 'rejected', label: 'Rejected', count: activeCounts.rejected, color: 'rose' }
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border whitespace-nowrap shadow-2xs ${
                statusFilter === st.id
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <span>{st.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  statusFilter === st.id
                    ? 'bg-white/20 dark:bg-slate-900/20 text-white dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}
              >
                {st.count}
              </span>
            </button>
          ))}
        </div>

        {/* Right: Search Input & View Switcher */}
        <div className="flex items-center gap-2">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search date, reason, approver..."
              className="w-full pl-9 pr-7 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* View Toggle (Table / Card) */}
          <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 p-0.5 shadow-2xs shrink-0">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'table'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('card')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'card'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
              title="Card View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. LIST CONTENT */}
      {isLoading ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center shadow-xs">
          <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Loading your {activeSubTab === 'wfh' ? 'Work-From-Home' : 'Punch Correction'} requests...
          </p>
        </div>
      ) : currentList.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            {activeSubTab === 'wfh' ? <Laptop className="w-6 h-6" /> : <FileEdit className="w-6 h-6" />}
          </div>
          <div className="max-w-xs mx-auto space-y-1">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              No {activeSubTab === 'wfh' ? 'WFH' : 'Punch Correction'} requests found
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {statusFilter !== 'all' || searchQuery
                ? 'Try adjusting your filters or search keywords.'
                : activeSubTab === 'wfh'
                ? "You haven't submitted any Work From Home requests yet."
                : "You haven't submitted any Missed-Punch correction requests yet."}
            </p>
          </div>
          {statusFilter === 'all' && !searchQuery && (
            <button
              onClick={activeSubTab === 'wfh' ? onApplyWFH : onRequestCorrection}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>{activeSubTab === 'wfh' ? 'Apply for WFH' : 'Request Punch Correction'}</span>
            </button>
          )}
        </div>
      ) : activeSubTab === 'wfh' ? (
        /* WFH Requests Display */
        viewMode === 'table' ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/50 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-5">Target WFH Date</th>
                    <th className="py-3 px-5">Applied On</th>
                    <th className="py-3 px-5">Reason / Justification</th>
                    <th className="py-3 px-5">Status</th>
                    <th className="py-3 px-5">Approver & Decision Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {currentList.map((req) => (
                    <tr key={req._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                      {/* Target Date */}
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200/50 dark:border-emerald-800/40">
                            <CalendarIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">
                              {formatDate(req.date)}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {req.date ? new Date(req.date).toISOString().split('T')[0] : ''}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Applied On */}
                      <td className="py-3.5 px-5 whitespace-nowrap text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                        {formatDateTime(req.createdAt)}
                      </td>

                      {/* Reason */}
                      <td className="py-3.5 px-5">
                        <div className="max-w-xs sm:max-w-md text-slate-700 dark:text-slate-300 line-clamp-2" title={req.reason}>
                          {req.reason || 'No description provided'}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        {renderStatusBadge(req.status)}
                      </td>

                      {/* Approver Audit */}
                      <td className="py-3.5 px-5 min-w-[220px]">
                        {renderApproverAudit(req)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Card View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentList.map((req) => (
              <div
                key={req._id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-emerald-300 dark:hover:border-emerald-800 transition-all"
              >
                <div className="space-y-3">
                  {/* Top Bar: Date & Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200/50 dark:border-emerald-800/40">
                        <Laptop className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">
                          {formatDate(req.date)}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Applied: {formatDateTime(req.createdAt)}
                        </div>
                      </div>
                    </div>
                    {renderStatusBadge(req.status)}
                  </div>

                  {/* Reason Box */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/40">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Reason
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-3">
                      {req.reason || 'No description provided'}
                    </p>
                  </div>
                </div>

                {/* Footer: Approver Audit */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  {renderApproverAudit(req)}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Missed Punch Correction Requests Display */
        viewMode === 'table' ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/50 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-5">Attendance Date</th>
                    <th className="py-3 px-5">Requested Timings</th>
                    <th className="py-3 px-5">Original Record</th>
                    <th className="py-3 px-5">Reason</th>
                    <th className="py-3 px-5">Status</th>
                    <th className="py-3 px-5">Approver & Decision Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {currentList.map((req) => (
                    <tr key={req._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                      {/* Attendance Date */}
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-200/50 dark:border-blue-800/40">
                            <Clock3 className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">
                              {formatDate(req.date)}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              Applied: {formatDateTime(req.createdAt)}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Requested Timings */}
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-mono text-xs">
                          <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 font-semibold">
                            {formatTime(req.requestedCheckIn)}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 font-semibold">
                            {formatTime(req.requestedCheckOut)}
                          </span>
                        </div>
                      </td>

                      {/* Original Record */}
                      <td className="py-3.5 px-5 whitespace-nowrap text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                        {req.attendanceId ? (
                          <span>
                            {req.attendanceId.checkIn ? formatTime(req.attendanceId.checkIn) : 'No In'} -{' '}
                            {req.attendanceId.checkOut ? formatTime(req.attendanceId.checkOut) : 'No Out'}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">No punch recorded</span>
                        )}
                      </td>

                      {/* Reason */}
                      <td className="py-3.5 px-5">
                        <div className="max-w-xs sm:max-w-md text-slate-700 dark:text-slate-300 line-clamp-2" title={req.reason}>
                          {req.reason || 'No description provided'}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        {renderStatusBadge(req.status)}
                      </td>

                      {/* Approver Audit */}
                      <td className="py-3.5 px-5 min-w-[220px]">
                        {renderApproverAudit(req)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Card View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentList.map((req) => (
              <div
                key={req._id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-blue-300 dark:hover:border-blue-800 transition-all"
              >
                <div className="space-y-3">
                  {/* Top Bar: Date & Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-200/50 dark:border-blue-800/40">
                        <Clock3 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">
                          {formatDate(req.date)}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Applied: {formatDateTime(req.createdAt)}
                        </div>
                      </div>
                    </div>
                    {renderStatusBadge(req.status)}
                  </div>

                  {/* Requested Timings */}
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/40 flex items-center justify-between text-xs font-mono">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-sans font-semibold">Check-In</div>
                      <div className="font-bold text-emerald-600 dark:text-emerald-400">
                        {formatTime(req.requestedCheckIn)}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-sans font-semibold">Check-Out</div>
                      <div className="font-bold text-blue-600 dark:text-blue-400">
                        {formatTime(req.requestedCheckOut)}
                      </div>
                    </div>
                  </div>

                  {/* Reason Box */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/40">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Reason
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-3">
                      {req.reason || 'No description provided'}
                    </p>
                  </div>
                </div>

                {/* Footer: Approver Audit */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  {renderApproverAudit(req)}
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
};

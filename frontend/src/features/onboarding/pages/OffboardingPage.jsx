/**
 * @file OffboardingPage.jsx
 * @description Cross-Departmental Exit Clearance, Asset Recovery Lock & Official Letters.
 * 
 * SPECIFICATION:
 * - Module: M18 Onboarding & Offboarding (BUILD-GUIDE Section 21 · Rows 18.7, 18.9, 18.10)
 * - Permissions: Guarded by 'offboard.view' (hrOnly in routing) and 'offboard.manage'
 * - Design System: Forest & Emerald (#111D17 dark surface, #1A3125 dark border, #00C471 emerald accent).
 */

import React, { useState } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Laptop,
  Download,
  Lock,
  Search,
  Eye,
  Layers
} from 'lucide-react';
import { useGetOffboardingsQuery } from '../onboardingApi.js';
import { ExitClearanceDetailModal } from '../components/ExitClearanceDetailModal.jsx';
import { ScreenSkeleton } from '../../../components/common/ScreenSkeleton.jsx';
import { RefreshButton } from '../../../components/common/RefreshButton.jsx';

export const OffboardingPage = () => {
  const [selectedOffboarding, setSelectedOffboarding] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: offboardRes, isLoading, isFetching, refetch } = useGetOffboardingsQuery();
  const offboardings = offboardRes?.data || [];

  if (isLoading && !offboardRes) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <ScreenSkeleton variant="table" />
      </div>
    );
  }

  const handleOpenDetail = (item) => {
    setSelectedOffboarding(item);
    setIsDetailOpen(true);
  };

  const handleDownloadLetter = (employeeId, type) => {
    const backendBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
    window.open(`${backendBase}/employees/${employeeId}/letters/${type}`, '_blank');
  };

  const totalOffboardings = offboardings.length;
  const inProgressCount = offboardings.filter((o) => o.status !== 'completed').length;
  const completedCount = offboardings.filter((o) => o.status === 'completed').length;

  const filteredOffboardings = offboardings.filter((item) => {
    if (statusFilter && item.status !== statusFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const name = item.employeeId?.name || '';
    const code = item.employeeId?.employeeCode || '';
    const dept = item.employeeId?.department?.name || '';
    return name.toLowerCase().includes(q) || code.toLowerCase().includes(q) || dept.toLowerCase().includes(q);
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-[#162820] text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-200 dark:border-rose-900/60 shadow-xs">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Exit Clearance & Offboarding
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Departmental sign-offs, hardware custody recovery (M23 lock), and official service letters.
            </p>
          </div>
        </div>

        <RefreshButton onRefresh={refetch} isFetching={isFetching} />
      </div>

      {/* Telemetry Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total In Clearance
            </span>
            <Layers className="w-4 h-4 text-emerald-600 dark:text-[#00C471]" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1.5 font-mono">
            {totalOffboardings}
          </p>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Pending Sign-Offs
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1.5 font-mono">
            {inProgressCount}
          </p>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Fully Cleared
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-[#00C471]" />
          </div>
          <p className="text-2xl font-bold text-emerald-600 dark:text-[#00C471] mt-1.5 font-mono">
            {completedCount}
          </p>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Hardware Custody
            </span>
            <Laptop className="w-4 h-4 text-sky-500" />
          </div>
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-2 flex items-center gap-1">
            <Lock className="w-3.5 h-3.5 text-rose-500" />
            M23 Return Gate Active
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-[#1A3125] pb-4">
        <div className="relative flex-1 sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search departing staff..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          <option value="">All Clearance Statuses</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed (Cleared)</option>
        </select>
      </div>

      {/* Main Clearance List */}
      {isLoading ? (
        <div className="py-12 text-center text-xs text-slate-400">Loading offboarding checklists...</div>
      ) : filteredOffboardings.length === 0 ? (
        <div className="py-16 text-center rounded-2xl border border-dashed border-slate-200 dark:border-[#1A3125] bg-white/50 dark:bg-[#111D17]/50">
          <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-600 dark:text-[#00C471] mb-3" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            No active exit clearances
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
            When employees resign or depart, multi-departmental exit clearance workflows will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOffboardings.map((item) => {
            const isCompleted = item.status === 'completed';
            const employee = item.employeeId || {};
            const employeeId = employee._id;

            return (
              <div
                key={item._id}
                className="rounded-2xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] p-5 shadow-xs hover:border-emerald-300 dark:hover:border-emerald-800/80 transition space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-[#1A3125] pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {employee.name || 'Departing Employee'}
                      </h3>
                      <span
                        className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                          isCompleted
                            ? 'bg-emerald-50 dark:bg-[#162820] text-emerald-700 dark:text-[#00C471] border-emerald-200 dark:border-emerald-900/60'
                            : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/40'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {employee.department?.name || 'Department'} • Progress: {item.progressPercent || 0}%
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleOpenDetail(item)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Inspect Clearance
                    </button>

                    {isCompleted && employeeId && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleDownloadLetter(employeeId, 'experience')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 dark:bg-[#162820] dark:text-[#00C471] hover:bg-emerald-100 dark:hover:bg-[#1A3125] border border-emerald-200 dark:border-emerald-900/60 transition cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Experience Letter
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadLetter(employeeId, 'relieving')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 dark:bg-[#162820] dark:text-[#00C471] hover:bg-emerald-100 dark:hover:bg-[#1A3125] border border-emerald-200 dark:border-emerald-900/60 transition cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Relieving Letter
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Clearance Categories Status Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {['it', 'finance', 'admin', 'hr'].map((cat) => {
                    const catTasks = item.tasks?.filter((t) => t.category === cat) || [];
                    const catDone = catTasks.length > 0 && catTasks.every((t) => t.completed);

                    return (
                      <div
                        key={cat}
                        className={`p-3 rounded-xl border flex items-center justify-between ${
                          catDone
                            ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-[#162820]/40'
                            : 'border-slate-200 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#162820]/20'
                        }`}
                      >
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                            {cat} Clearance
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {catTasks.filter((t) => t.completed).length}/{catTasks.length} Done
                          </span>
                        </div>
                        {catDone ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-[#00C471]" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Inspection Modal */}
      {isDetailOpen && selectedOffboarding && (
        <ExitClearanceDetailModal
          isOpen={isDetailOpen}
          onClose={() => {
            setIsDetailOpen(false);
            setSelectedOffboarding(null);
          }}
          offboarding={selectedOffboarding}
          onSignoffSuccess={() => {
            refetch();
          }}
        />
      )}
    </div>
  );
};

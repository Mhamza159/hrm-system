/**
 * @file CommitteeDashboardPage.jsx
 * @description Quarantined Inquiry Committee portal for Workplace Harassment investigations (BUILD-GUIDE Row 21.3).
 */

import React, { useState } from 'react';
import {
  Shield,
  Lock,
  Search,
  AlertTriangle,
  EyeOff,
  User,
  RefreshCw,
  FileText
} from 'lucide-react';
import { useGetFeedbackListQuery } from '../feedbackApi.js';
import CaseDetailsDrawer from '../components/CaseDetailsDrawer.jsx';

export function CommitteeDashboardPage() {
  const [search, setSearch] = useState('');
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Exclusively queries category: Harassment
  const { data: listData, isLoading, refetch, isFetching } = useGetFeedbackListQuery({
    category: 'Harassment',
    search: search.trim() || undefined
  });

  const cases = listData?.data || [];

  const handleOpenCase = (id) => {
    setSelectedCaseId(id);
    setIsDrawerOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Quarantined Header Banner */}
      <div className="p-6 rounded-2xl bg-rose-950/20 border-2 border-rose-500/30 text-rose-950 dark:text-rose-100 mb-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-rose-600 text-white shadow-md">
              <Lock className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-widest px-2.5 py-0.5 rounded bg-rose-600 text-white">
                  Restricted Clearance
                </span>
                <span className="text-xs text-rose-500 dark:text-rose-300 font-semibold">
                  Pakistan Protection Against Harassment at the Workplace Act
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 text-rose-900 dark:text-rose-50">
                Inquiry Committee Investigation Channel
              </h1>
              <p className="text-xs sm:text-sm text-rose-700 dark:text-rose-300 mt-1 max-w-2xl leading-relaxed">
                This environment is strictly isolated. All cases appearing here are confidential harassment complaints quarantined from standard HR managers and department supervisors.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-2 shadow-sm self-start sm:self-auto transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            Sync Docket
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm mb-6 flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search confidential docket by case code or keyword..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
          />
        </div>

        <div className="text-xs text-slate-400 font-medium">
          Showing <strong>{cases.length}</strong> Quarantined Case(s)
        </div>
      </div>

      {/* Harassment Cases Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="py-20 text-center text-slate-400">Accessing secure committee docket...</div>
        ) : cases.length === 0 ? (
          <div className="py-20 text-center text-slate-500">
            <Shield className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
            <p className="font-semibold text-slate-800 dark:text-slate-200">No active harassment complaints.</p>
            <p className="text-xs text-slate-400 mt-1">The confidential committee docket is clear.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-rose-50/50 dark:bg-rose-950/20 text-rose-900 dark:text-rose-200 uppercase tracking-wider font-semibold border-b border-rose-100 dark:border-rose-900/50">
                <tr>
                  <th className="py-3.5 px-4">Tracking Code</th>
                  <th className="py-3.5 px-4">Subject</th>
                  <th className="py-3.5 px-4">Severity</th>
                  <th className="py-3.5 px-4">Investigation Stage</th>
                  <th className="py-3.5 px-4">Complainant</th>
                  <th className="py-3.5 px-4">Filed On</th>
                  <th className="py-3.5 px-4 text-right">Committee Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {cases.map((c) => (
                  <tr
                    key={c._id}
                    onClick={() => handleOpenCase(c._id)}
                    className="hover:bg-rose-50/30 dark:hover:bg-rose-950/10 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-rose-600 dark:text-rose-400">
                      {c.trackingCode}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-slate-100 max-w-xs truncate">
                      {c.title}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        c.priority === 'Urgent'
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
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
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                      {c.isAnonymous ? (
                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                          <EyeOff className="w-3.5 h-3.5" /> Anonymous Complainant
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
                        className="px-2.5 py-1 rounded bg-rose-100 dark:bg-rose-950/50 hover:bg-rose-600 hover:text-white transition-all text-xs font-semibold text-rose-700 dark:text-rose-300"
                      >
                        Examine Case
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

/**
 * @file OffboardingPage.jsx
 * @description Cross-Departmental Exit Clearance, Asset Recovery Lock & Service Letters.
 * 
 * SPECIFICATION:
 * - Module: M18 Onboarding & Offboarding (BUILD-GUIDE Section 21 · Rows 18.7, 18.9, 18.10)
 */

import React, { useState } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Laptop,
  FileText,
  DollarSign,
  Download,
  Building2,
  Calendar,
  Lock,
  Search,
  ExternalLink
} from 'lucide-react';
import {
  useGetOffboardingsQuery,
  useSignoffExitClearanceMutation,
  useGetSettlementSummaryQuery
} from '../onboardingApi.js';
import { Can } from '../../../components/common/Can.jsx';
import { toast } from 'sonner';

export const OffboardingPage = () => {
  const [selectedId, setSelectedId] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');

  const { data: offboardRes, isLoading } = useGetOffboardingsQuery();
  const offboardings = offboardRes?.data || [];

  const [signoffClearance, { isLoading: isSigning }] = useSignoffExitClearanceMutation();

  const handleSignoff = async (id, departmentCategory) => {
    try {
      await signoffClearance({ id, departmentCategory }).unwrap();
      toast.success(`${departmentCategory.toUpperCase()} clearance signed off successfully`);
    } catch (err) {
      toast.error(err?.data?.message || 'Clearance sign-off failed');
    }
  };

  const handleDownloadLetter = (employeeId, type) => {
    const url = `/api/v1/employees/${employeeId}/letters/${type}`;
    window.open(url, '_blank');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-lg">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Exit Clearance & Offboarding
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Departmental sign-offs, hardware custody recovery (M23 lock), and official service letters.
            </p>
          </div>
        </div>
      </div>

      {/* Main Clearance List */}
      {isLoading ? (
        <div className="py-12 text-center text-sm text-gray-500">Loading offboarding checklists...</div>
      ) : offboardings.length === 0 ? (
        <div className="py-16 text-center rounded-xl border border-dashed border-gray-300 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
          <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500 mb-3" />
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            No active exit clearances
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto mt-1">
            When employees resign or depart, multi-departmental exit clearance workflows will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {offboardings.map((item) => {
            const isCompleted = item.status === 'completed';
            const employeeId = item.employeeId?._id;

            return (
              <div
                key={item._id}
                className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm space-y-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {item.employeeId?.name || 'Departing Employee'}
                      </h3>
                      <span
                        className={`text-xs font-bold uppercase px-2.5 py-0.5 rounded-full ${
                          isCompleted
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {item.employeeId?.department?.name || 'Department'} • Progress: {item.progressPercent || 0}%
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Action buttons for Letters */}
                    {isCompleted && employeeId && (
                      <>
                        <button
                          onClick={() => handleDownloadLetter(employeeId, 'experience')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800 transition"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Experience Letter
                        </button>
                        <button
                          onClick={() => handleDownloadLetter(employeeId, 'relieving')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 transition"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Relieving Letter
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Clearance Categories Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {['it', 'finance', 'admin', 'hr'].map((cat) => {
                    const catTasks = item.tasks?.filter((t) => t.category === cat) || [];
                    const catDone = catTasks.length > 0 && catTasks.every((t) => t.completed);

                    return (
                      <div
                        key={cat}
                        className={`p-4 rounded-lg border ${
                          catDone
                            ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/20'
                            : 'border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30'
                        } flex flex-col justify-between`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                              {cat} Clearance
                            </span>
                            {catDone ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            ) : (
                              <AlertTriangle className="w-4 h-4 text-amber-500" />
                            )}
                          </div>
                          <p className="text-xs text-gray-500">
                            {catTasks.filter((t) => t.completed).length} / {catTasks.length} tasks signed
                          </p>
                        </div>

                        {!catDone && (
                          <Can perform="offboard.manage">
                            <button
                              onClick={() => handleSignoff(item._id, cat)}
                              disabled={isSigning}
                              className="mt-3 w-full py-1.5 text-xs font-semibold rounded bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition disabled:opacity-50"
                            >
                              Sign Off {cat.toUpperCase()}
                            </button>
                          </Can>
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
    </div>
  );
};

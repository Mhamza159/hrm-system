/**
 * @file ExitClearanceDetailModal.jsx
 * @description Comprehensive Exit Clearance Sign-Off, M23 Asset Return Check & Final Settlement Modal.
 * 
 * SPECIFICATION:
 * - Module: M18 Onboarding & Offboarding Lifecycle (BUILD-GUIDE Section 21 · Rows 18.7, 18.9, 18.10)
 * - Integrations: M23 Asset Return Lock, M9 Final Settlement Summary, Letter PDF streaming.
 * - Design System: Forest & Emerald (#111D17 dark surface, #1A3125 dark border, #00C471 emerald accent).
 */

import React, { useState } from 'react';
import {
  X,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Laptop,
  DollarSign,
  Download,
  Lock,
  ShieldCheck
} from 'lucide-react';
import {
  useSignoffExitClearanceMutation,
  useGetSettlementSummaryQuery
} from '../onboardingApi.js';
import { useGetAssetsQuery } from '../../assets/assetApi.js';
import { Can } from '../../../components/common/Can.jsx';
import { toast } from 'sonner';

export const ExitClearanceDetailModal = ({ isOpen, onClose, offboarding, onSignoffSuccess }) => {
  const [activeTab, setActiveTab] = useState('clearances');

  const [signoffClearance, { isLoading: isSigning }] = useSignoffExitClearanceMutation();

  const employee = offboarding?.employeeId || {};
  const employeeId = employee._id;

  // Query M23 Asset custody to check for unreturned hardware
  const { data: assetRes, isLoading: isAssetLoading } = useGetAssetsQuery(
    { assignedTo: employeeId },
    { skip: !isOpen || !employeeId }
  );
  const employeeAssets = assetRes?.data || [];
  const activeUnreturnedAssets = employeeAssets.filter((a) =>
    ['assigned', 'in_use', 'damaged'].includes(a.status)
  );

  // Query M9 Settlement summary
  const { data: settlementRes, isLoading: isSettlementLoading } = useGetSettlementSummaryQuery(
    offboarding?._id,
    { skip: !isOpen || !offboarding?._id }
  );
  const settlement = settlementRes?.data;

  if (!isOpen || !offboarding) return null;

  const isCompleted = offboarding.status === 'completed';
  const progressPercent = offboarding.progressPercent || 0;

  const handleSignoff = async (departmentCategory) => {
    try {
      await signoffClearance({ id: offboarding._id, departmentCategory }).unwrap();
      toast.success(`${departmentCategory.toUpperCase()} clearance successfully signed off.`);
      if (onSignoffSuccess) onSignoffSuccess();
    } catch (err) {
      toast.error(err?.data?.message || 'Clearance sign-off failed');
    }
  };

  const handleDownloadLetter = (type) => {
    if (!isCompleted) {
      toast.error('Service letters are only available after 100% exit clearance completion.');
      return;
    }
    const backendBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
    window.open(`${backendBase}/employees/${employeeId}/letters/${type}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/15 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-[#1A3125] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-rose-50 dark:bg-[#162820] text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold text-base border border-rose-200 dark:border-rose-900/60 shadow-xs">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  {employee.name || 'Departing Employee'}
                </h3>
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                    isCompleted
                      ? 'bg-emerald-50 dark:bg-[#162820] text-emerald-700 dark:text-[#00C471] border-emerald-200 dark:border-emerald-900/60'
                      : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/40'
                  }`}
                >
                  {isCompleted ? 'Fully Cleared' : 'In Clearance'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                <span className="text-slate-700 dark:text-slate-200 font-semibold">
                  {employee.designation?.title || 'Designation'}
                </span>{' '}
                • {employee.department?.name || 'Department'}{' '}
                {employee.employeeCode && (
                  <span className="font-mono text-slate-400">({employee.employeeCode})</span>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#162820] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-3 border-b border-slate-200 dark:border-[#1A3125] flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('clearances')}
            className={`pb-2.5 text-xs font-bold transition border-b-2 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'clearances'
                ? 'border-emerald-500 text-emerald-700 dark:text-[#00C471]'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Department Sign-Offs
          </button>
          <button
            onClick={() => setActiveTab('assets')}
            className={`pb-2.5 text-xs font-bold transition border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'assets'
                ? 'border-emerald-500 text-emerald-700 dark:text-[#00C471]'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            Hardware & Custody (M23)
            {activeUnreturnedAssets.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-rose-500 text-white font-mono">
                {activeUnreturnedAssets.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('settlement')}
            className={`pb-2.5 text-xs font-bold transition border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'settlement'
                ? 'border-emerald-500 text-emerald-700 dark:text-[#00C471]'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            Final Settlement (M9)
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {/* Top Progress Meter */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span>Overall Clearance Progress</span>
              <span className="font-mono text-emerald-600 dark:text-[#00C471]">{progressPercent}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 dark:bg-[#162820] rounded-full overflow-hidden border border-slate-200/60 dark:border-[#1A3125]">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isCompleted ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* TAB 1: DEPARTMENT SIGN-OFFS */}
          {activeTab === 'clearances' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {['it', 'finance', 'admin', 'hr'].map((cat) => {
                  const catTasks = offboarding.tasks?.filter((t) => t.category === cat) || [];
                  const catDone = catTasks.length > 0 && catTasks.every((t) => t.completed);
                  const isBlockedByAssets = (cat === 'it' || cat === 'admin') && activeUnreturnedAssets.length > 0;

                  return (
                    <div
                      key={cat}
                      className={`p-4 rounded-2xl border transition flex flex-col justify-between ${
                        catDone
                          ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-[#162820]/40'
                          : isBlockedByAssets
                          ? 'border-rose-200 dark:border-rose-900/50 bg-rose-50/30 dark:bg-rose-950/20'
                          : 'border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                            {cat} Clearance
                          </span>
                          {catDone ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-[#00C471]" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                          {catTasks.filter((t) => t.completed).length} / {catTasks.length} signed
                        </p>

                        {isBlockedByAssets && !catDone && (
                          <span className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold block mt-1">
                            Locked by unreturned hardware
                          </span>
                        )}
                      </div>

                      {!catDone && (
                        <Can perform="offboard.manage">
                          <button
                            type="button"
                            onClick={() => handleSignoff(cat)}
                            disabled={isSigning}
                            className={`mt-4 w-full py-1.5 text-xs font-bold rounded-xl text-white shadow-xs transition disabled:opacity-50 cursor-pointer ${
                              isBlockedByAssets
                                ? 'bg-amber-600 hover:bg-amber-500'
                                : 'bg-emerald-600 hover:bg-emerald-500'
                            }`}
                          >
                            Sign Off {cat.toUpperCase()}
                          </button>
                        </Can>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Tasks List Table */}
              <div className="rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] overflow-hidden">
                <div className="p-3 bg-slate-50 dark:bg-[#162820]/40 border-b border-slate-200 dark:border-[#1A3125]">
                  <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                    Detailed Departmental Sign-Off Tasks
                  </h4>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-[#1A3125]">
                  {offboarding.tasks?.map((task) => (
                    <div key={task._id} className="p-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle2
                          className={`w-4 h-4 shrink-0 ${
                            task.completed ? 'text-emerald-600 dark:text-[#00C471]' : 'text-slate-300 dark:text-slate-600'
                          }`}
                        />
                        <span className={`text-xs ${task.completed ? 'text-slate-400 line-through' : 'text-slate-800 dark:text-slate-200'}`}>
                          {task.title}
                        </span>
                      </div>
                      <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-[#162820] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#1A3125]">
                        {task.category}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: M23 ASSET CUSTODY & HARDWARE LOCK */}
          {activeTab === 'assets' && (
            <div className="space-y-4">
              {activeUnreturnedAssets.length > 0 ? (
                <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 flex items-start gap-3">
                  <Lock className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="font-bold text-rose-800 dark:text-rose-300 text-xs">
                      Clearance Locked: Active Assets Assigned to Employee
                    </h4>
                    <p className="text-[11px] text-rose-700 dark:text-rose-400 leading-relaxed">
                      Company hardware must be recovered and checked into Module M23 Asset Management before IT and Admin sign-offs can complete.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-[#162820]/40 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-[#00C471] shrink-0" />
                  <div>
                    <h4 className="font-bold text-emerald-800 dark:text-[#00C471] text-xs">
                      No Outstanding Company Assets
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300">
                      All hardware and equipment custody is clear. No hardware return blockers present.
                    </p>
                  </div>
                </div>
              )}

              {/* Assets Inventory Table */}
              <div className="rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] overflow-hidden">
                <div className="p-3 bg-slate-50 dark:bg-[#162820]/40 border-b border-slate-200 dark:border-[#1A3125] flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                    Assigned Assets Custody Ledger ({employeeAssets.length})
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">Module M23 Integration</span>
                </div>

                {isAssetLoading ? (
                  <div className="p-6 text-center text-slate-400">Loading asset ledger...</div>
                ) : employeeAssets.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    No hardware or software assets assigned to this employee.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-[#1A3125]">
                    {employeeAssets.map((asset) => (
                      <div key={asset._id} className="p-3.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <Laptop className="w-4 h-4 text-slate-400 shrink-0" />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 dark:text-white text-xs">
                                {asset.name}
                              </span>
                              <span className="font-mono text-[10px] text-slate-500">
                                {asset.assetTag}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {asset.type} • Serial: {asset.serialNumber || 'N/A'}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                            ['assigned', 'in_use'].includes(asset.status)
                              ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-900/40'
                              : 'bg-emerald-50 text-emerald-700 dark:bg-[#162820] dark:text-[#00C471] border-emerald-200 dark:border-emerald-900/60'
                          }`}
                        >
                          {asset.status?.replace('_', ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: M9 FINAL SETTLEMENT BREAKDOWN */}
          {activeTab === 'settlement' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1A3125] pb-3">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                      M9 Final Settlement Computation
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Prorated separation calculation including leave encashment and loan settlements.
                    </p>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-[#162820] dark:text-[#00C471] border border-emerald-200 dark:border-emerald-900/60">
                    Live Payroll Aggregation
                  </span>
                </div>

                {isSettlementLoading ? (
                  <div className="p-8 text-center text-slate-400">Loading settlement metrics...</div>
                ) : !settlement ? (
                  <div className="p-8 text-center text-slate-400">
                    Unable to compile settlement figures. Ensure salary structure is active.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#162820]/30">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Basic Salary</span>
                      <p className="font-bold text-slate-800 dark:text-slate-100 text-xs mt-0.5 font-mono">
                        PKR {((settlement.basicSalaryPaisa || 0) / 100).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Unpaid Working Days</span>
                      <p className="font-bold text-slate-800 dark:text-slate-100 text-xs mt-0.5 font-mono">
                        {settlement.unpaidDays || 0} Days
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Leave Encashment</span>
                      <p className="font-bold text-emerald-600 dark:text-[#00C471] text-xs mt-0.5 font-mono">
                        {settlement.encashableLeaveDays || 0} Days
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Outstanding Loans</span>
                      <p className="font-bold text-rose-600 dark:text-rose-400 text-xs mt-0.5 font-mono">
                        PKR {((settlement.outstandingLoansPaisa || 0) / 100).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer & Letters Bar */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-[#1A3125] bg-slate-50 dark:bg-[#162820]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleDownloadLetter('experience')}
              disabled={!isCompleted}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 dark:bg-[#162820] dark:text-[#00C471] border border-emerald-200 dark:border-emerald-900/60 hover:bg-emerald-100 dark:hover:bg-[#1A3125] transition disabled:opacity-50 cursor-pointer"
              title={isCompleted ? 'Download Experience Letter' : 'Clearance required first'}
            >
              <Download className="w-3.5 h-3.5" />
              Experience Letter PDF
            </button>
            <button
              type="button"
              onClick={() => handleDownloadLetter('relieving')}
              disabled={!isCompleted}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 dark:bg-[#162820] dark:text-[#00C471] border border-emerald-200 dark:border-emerald-900/60 hover:bg-emerald-100 dark:hover:bg-[#1A3125] transition disabled:opacity-50 cursor-pointer"
              title={isCompleted ? 'Download Relieving Letter' : 'Clearance required first'}
            >
              <Download className="w-3.5 h-3.5" />
              Relieving Letter PDF
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#162820] transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

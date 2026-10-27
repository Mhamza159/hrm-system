/**
 * @file ProfileSalaryTab.jsx
 * @description Dynamic, Permission-Guarded Salary & Compensation Structure Console.
 * 
 * SPECIFICATION & SECURITY:
 * - Module: M3 Employee Management & M9 Payroll (BUILD-GUIDE Section 8 & Section 12)
 * - Layer: Component (React 18 / Tailwind)
 * - Security: Strictly restricted to Super Admin and HR Manager.
 * - Dynamic Data: Queries live active salary structure and revision timeline from MongoDB.
 * - Actions: Initiate initial salary structure assignment or mid-cycle increment revision.
 */

import React, { useState } from 'react';
import {
  BadgeDollarSign,
  TrendingUp,
  ShieldAlert,
  Plus,
  RefreshCw,
  Calendar,
  CheckCircle2,
  Shield,
  Coins,
  DollarSign,
  Percent,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import { toast } from 'sonner';
import { Card } from '../../../components/common/Card.jsx';
import { ScreenSkeleton } from '../../../components/common/ScreenSkeleton.jsx';
import { formatCurrencyPKR, formatDate } from '../../../lib/formatters.js';
import { useGetEmployeeSalaryStructureQuery } from '../../payroll/payrollApi.js';
import { SalaryRevisionModal } from '../../payroll/components/SalaryRevisionModal.jsx';
import { SalaryFormModal } from '../../payroll/components/SalaryFormModal.jsx';

export function ProfileSalaryTab({ employee, canView = false }) {
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const {
    data: response,
    isLoading,
    isFetching,
    refetch
  } = useGetEmployeeSalaryStructureQuery(employee?._id, {
    skip: !canView || !employee?._id
  });

  if (!canView) {
    return (
      <Card className="p-8 text-center bg-white dark:bg-[#111D17] border-slate-200 dark:border-[#1A3125]">
        <ShieldAlert className="w-10 h-10 mx-auto text-amber-500 mb-2" />
        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Access Restricted</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
          Compensation history and salary structures are strictly confidential and restricted to Super Admin and HR management roles.
        </p>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <ScreenSkeleton
        variant="table"
        title="Compensation & Remuneration"
        message="Retrieving live salary structure breakdown and revision history..."
        rows={4}
      />
    );
  }

  const currentStructure = response?.data?.current;
  const salaryHistory = response?.data?.history || [];

  const handleRefresh = async () => {
    try {
      await refetch();
      toast.success('Salary structure refreshed');
    } catch {
      toast.error('Failed to refresh salary structure');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header with Title & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Coins className="w-4 h-4 text-emerald-500" />
            Compensation & Salary Structure
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Active remuneration package, allowances breakdown, and historical revision timeline.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={handleRefresh}
            disabled={isFetching}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#162820] hover:text-emerald-600 dark:hover:text-emerald-400 transition-all shadow-xs cursor-pointer disabled:opacity-50"
            title="Reload from database"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-emerald-500' : 'text-slate-400'}`} />
            <span>Sync</span>
          </button>

          {currentStructure ? (
            <button
              onClick={() => setIsRevisionModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs hover:shadow-md transition-all cursor-pointer"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Revise / Increment</span>
            </button>
          ) : (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs hover:shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Assign Initial Salary</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Active Salary Package Hero Card */}
      {currentStructure ? (
        <div className="rounded-2xl border border-slate-200/80 dark:border-[#1A3125] bg-white dark:bg-[#111D17] shadow-xs overflow-hidden">
          {/* Card Top Strip */}
          <div className="p-6 bg-gradient-to-r from-emerald-50/50 via-teal-50/20 to-transparent dark:from-emerald-950/20 dark:via-[#111D17] dark:to-[#111D17] border-b border-slate-100 dark:border-[#1A3125]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-800/40">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Active Package
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    Effective since {formatDate(currentStructure.effectiveFrom)}
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Gross Monthly Remuneration</p>
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-extrabold font-mono tracking-tight text-slate-900 dark:text-white">
                    {formatCurrencyPKR(currentStructure.grossSalary)}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">
                    ≈ {formatCurrencyPKR(currentStructure.grossSalary * 12)} / year
                  </span>
                </div>
              </div>

              {/* Currency Badge */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-[#14261D] border border-slate-200/80 dark:border-[#1E3A2B] self-start md:self-auto shadow-2xs">
                <BadgeDollarSign className="w-4 h-4 text-emerald-500" />
                <div className="text-left">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Currency</p>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {currentStructure.currency || 'PKR'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Component Breakdown Sub-grid */}
          <div className="p-6 space-y-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Salary Component Distribution
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
              {/* Basic Salary */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#14261D]/60 border border-slate-200/60 dark:border-[#1A3125]">
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Basic Salary</p>
                <p className="text-base font-bold font-mono text-slate-900 dark:text-white mt-1">
                  {formatCurrencyPKR(currentStructure.basicSalary)}
                </p>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                  {currentStructure.grossSalary > 0
                    ? `${Math.round((currentStructure.basicSalary / currentStructure.grossSalary) * 100)}% of gross`
                    : '—'}
                </p>
              </div>

              {/* House Rent Allowance */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#14261D]/60 border border-slate-200/60 dark:border-[#1A3125]">
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">House Rent</p>
                <p className="text-base font-bold font-mono text-slate-900 dark:text-white mt-1">
                  {formatCurrencyPKR(currentStructure.houseRentAllowance)}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">Monthly allowance</p>
              </div>

              {/* Medical Allowance */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#14261D]/60 border border-slate-200/60 dark:border-[#1A3125]">
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Medical</p>
                <p className="text-base font-bold font-mono text-slate-900 dark:text-white mt-1">
                  {formatCurrencyPKR(currentStructure.medicalAllowance)}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">Healthcare support</p>
              </div>

              {/* Conveyance Allowance */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#14261D]/60 border border-slate-200/60 dark:border-[#1A3125]">
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Conveyance</p>
                <p className="text-base font-bold font-mono text-slate-900 dark:text-white mt-1">
                  {formatCurrencyPKR(currentStructure.conveyanceAllowance)}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">Transit & travel</p>
              </div>

              {/* Other Allowances */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#14261D]/60 border border-slate-200/60 dark:border-[#1A3125]">
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Other Allowances</p>
                <p className="text-base font-bold font-mono text-slate-900 dark:text-white mt-1">
                  {formatCurrencyPKR(currentStructure.otherAllowances)}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">Special / discretionary</p>
              </div>
            </div>

            {/* Statutory Compliance Parameters */}
            <div className="pt-4 border-t border-slate-100 dark:border-[#1A3125] flex flex-wrap items-center gap-3">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mr-2">
                <Shield className="w-3.5 h-3.5 text-slate-400" />
                Statutory Parameters:
              </span>

              {/* EOBI */}
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${
                  currentStructure.eobiEnabled
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/40'
                    : 'bg-slate-100 dark:bg-[#162820] text-slate-500 border-slate-200 dark:border-[#1A3125]'
                }`}
              >
                <CheckCircle2 className={`w-3.5 h-3.5 ${currentStructure.eobiEnabled ? 'text-emerald-500' : 'text-slate-400'}`} />
                EOBI Pension {currentStructure.eobiEnabled ? 'Covered' : 'Exempt'}
              </span>

              {/* PESSI */}
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${
                  currentStructure.pessiEnabled
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/40'
                    : 'bg-slate-100 dark:bg-[#162820] text-slate-500 border-slate-200 dark:border-[#1A3125]'
                }`}
              >
                <CheckCircle2 className={`w-3.5 h-3.5 ${currentStructure.pessiEnabled ? 'text-emerald-500' : 'text-slate-400'}`} />
                PESSI Healthcare {currentStructure.pessiEnabled ? 'Active' : 'Exempt'}
              </span>

              {/* Provident Fund */}
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${
                  currentStructure.providentFundEnabled
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/40'
                    : 'bg-slate-100 dark:bg-[#162820] text-slate-500 border-slate-200 dark:border-[#1A3125]'
                }`}
              >
                <Percent className={`w-3.5 h-3.5 ${currentStructure.providentFundEnabled ? 'text-emerald-500' : 'text-slate-400'}`} />
                Provident Fund:{' '}
                {currentStructure.providentFundEnabled
                  ? `${currentStructure.providentFundRate || 0}% Monthly`
                  : 'Disabled'}
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State: No Structure Assigned Yet */
        <div className="p-8 rounded-2xl border border-dashed border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
            <Coins className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
            No Salary Structure Configured
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {employee?.name} does not currently have an active compensation package. Assign an initial salary to enable monthly payroll calculations.
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs hover:shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Configure Initial Salary</span>
          </button>
        </div>
      )}

      {/* 3. Salary Revision History Timeline */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Salary Revision & Increment Timeline
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#162820] text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-[#1A3125]">
                {salaryHistory.length}
              </span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Historical progression of base salary revisions, mid-cycle increments, and justifications.
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 dark:bg-[#0E1A14] border-b border-slate-200 dark:border-[#1A3125] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Effective Date</th>
                <th className="py-3.5 px-4">Base Salary</th>
                <th className="py-3.5 px-4">Gross Salary</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Audit Justification / Remarks</th>
                <th className="py-3.5 px-4">Revised By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#1A3125] text-slate-700 dark:text-slate-200">
              {salaryHistory.length > 0 ? (
                salaryHistory.map((rev) => (
                  <tr key={rev._id} className="hover:bg-slate-50/50 dark:hover:bg-[#14261D]/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-700 dark:text-slate-300">
                      {formatDate(rev.effectiveFrom)}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-300">
                      {formatCurrencyPKR(rev.basicSalary)}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      {formatCurrencyPKR(rev.grossSalary)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="capitalize px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-[#162820] text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-[#1A3125]">
                        {rev.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 italic max-w-xs truncate">
                      {rev.revisionReason || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 text-[11px]">
                      {rev.revisedBy?.name || rev.revisedBy?.email || 'System'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 dark:text-slate-500">
                    <p className="text-xs">
                      {currentStructure
                        ? 'No prior revisions recorded. The current structure represents the initial onboarding package.'
                        : 'No salary revisions recorded yet.'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Modals */}
      {currentStructure && (
        <SalaryRevisionModal
          isOpen={isRevisionModalOpen}
          onClose={() => setIsRevisionModalOpen(false)}
          currentStructure={currentStructure}
          onSuccess={refetch}
        />
      )}

      <SalaryFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        employee={employee}
        initialEmployeeId={employee?._id}
        onSuccess={refetch}
      />
    </div>
  );
}

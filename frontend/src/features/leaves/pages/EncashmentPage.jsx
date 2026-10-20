/**
 * @file EncashmentPage.jsx
 * @description Year-End Leave Encashment Management & Payout Calculator (BUILD-GUIDE Row 6.13).
 * 
 * SPECIFICATION:
 * - Module: M6 Leave & Holidays
 * - Features:
 *   1. Available unutilized quota inspection.
 *   2. Payout simulation in PKR based on integer paisa daily rate.
 *   3. Encashment request workflow with policy validation.
 *   4. HR / Admin approval queue with quota settlement.
 * - Aesthetics: Linear Dark Craft (#090A0F, #0F111A, #1E2235, #5E6AD2).
 */

import React, { useState } from 'react';
import { toast } from 'sonner';
import {
  Coins,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  HelpCircle,
  Check,
  X,
  Calendar,
  Sparkles
} from 'lucide-react';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import {
  useGetLeaveEncashmentsQuery,
  useRequestLeaveEncashmentMutation,
  useDecideLeaveEncashmentMutation,
  useGetLeaveBalanceQuery,
  useGetLeaveTypesQuery
} from '../leavesApi.js';
import { usePermission } from '../../../hooks/usePermission.js';
import { useAuth } from '../../../hooks/useAuth.js';
import { cn } from '../../../lib/utils.js';

const STATUS_CONFIG = {
  pending: {
    bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    icon: Clock,
    label: 'Pending Review'
  },
  approved: {
    bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    icon: CheckCircle2,
    label: 'Approved'
  },
  processed: {
    bg: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    icon: CheckCircle2,
    label: 'Payroll Processed'
  },
  rejected: {
    bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    icon: XCircle,
    label: 'Rejected'
  }
};

export function EncashmentPage() {
  const { user, isHR, isSuperAdmin } = useAuth();
  const { can } = usePermission();
  const canDecide = isHR || isSuperAdmin || can('leave.encash', 'all') || can('leave.settings', 'all');

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [selectedTypeId, setSelectedTypeId] = useState('');
  const [requestedDays, setRequestedDays] = useState(5);
  const [remarks, setRemarks] = useState('');

  // Queries
  const { data: encashmentsData, isLoading: isLoadingEncashments } = useGetLeaveEncashmentsQuery({
    year: selectedYear
  });
  const encashments = encashmentsData?.data || [];

  const { data: balanceData } = useGetLeaveBalanceQuery({ year: selectedYear });
  const balances = balanceData?.data?.balances || [];

  const { data: typesData } = useGetLeaveTypesQuery({ isActive: true });
  const leaveTypes = typesData?.data || [];
  const paidTypes = leaveTypes.filter((t) => t.isPaid);

  // Mutations
  const [requestEncashment, { isLoading: isSubmitting }] = useRequestLeaveEncashmentMutation();
  const [decideEncashment, { isLoading: isDeciding }] = useDecideLeaveEncashmentMutation();

  // Find eligible category balance
  const activeTypeId = selectedTypeId || paidTypes[0]?._id;
  const currentCatBalance = balances.find(
    (b) => (b.leaveTypeId?._id || b.leaveTypeId)?.toString() === activeTypeId?.toString()
  );

  const availableDays = currentCatBalance
    ? Math.max(
        0,
        (currentCatBalance.allocatedDays || 0) +
          (currentCatBalance.carriedForwardDays || 0) -
          (currentCatBalance.usedDays || 0) -
          (currentCatBalance.pendingDays || 0) -
          (currentCatBalance.encashedDays || 0)
      )
    : 0;

  // Rough estimation in PKR (assuming default 60k PKR basic / 30 = 2000 PKR/day)
  const estimatedDailyRatePkr = 2000;
  const estimatedPayoutPkr = Math.round(requestedDays * estimatedDailyRatePkr);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!activeTypeId) {
      toast.error('Please select an eligible paid leave type.');
      return;
    }
    if (requestedDays <= 0) {
      toast.error('Requested days must be greater than zero.');
      return;
    }
    if (requestedDays > availableDays) {
      toast.error(`Cannot encash more than available quota (${availableDays} days).`);
      return;
    }

    try {
      await requestEncashment({
        leaveTypeId: activeTypeId,
        year: selectedYear,
        days: Number(requestedDays),
        remarks: remarks.trim()
      }).unwrap();

      toast.success('Leave encashment request submitted successfully!');
      setIsModalOpen(false);
      setRemarks('');
    } catch (err) {
      toast.error(err?.data?.message || err?.message || 'Failed to submit encashment request.');
    }
  };

  const handleDecide = async (id, action) => {
    let rejectionReason = '';
    if (action === 'reject') {
      const input = window.prompt('Enter reason for rejecting encashment:');
      if (input === null) return;
      if (!input.trim()) {
        toast.error('Rejection reason is required.');
        return;
      }
      rejectionReason = input.trim();
    }

    try {
      await decideEncashment({
        id,
        action,
        rejectionReason: rejectionReason || undefined
      }).unwrap();

      toast.success(`Encashment request ${action}d successfully.`);
    } catch (err) {
      toast.error(err?.data?.message || err?.message || `Failed to ${action} encashment request.`);
    }
  };

  // KPI Calculations
  const totalApprovedPaisa = encashments
    .filter((e) => e.status === 'approved' || e.status === 'processed')
    .reduce((acc, curr) => acc + (curr.totalAmountPaisa || 0), 0);

  const pendingCount = encashments.filter((e) => e.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Leave Encashment"
        subtitle="Monetize unutilized annual leave entitlements with automated payroll integration (PKR)."
        badge="Payroll Linkage"
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#5E6AD2] hover:bg-[#4E5AC0] text-white text-xs font-semibold shadow-lg shadow-[#5E6AD2]/20 hover:shadow-[#5E6AD2]/40 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Request Encashment</span>
            </button>
          </div>
        }
      />

      {/* KPI Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-[#1E2235] bg-[#0F111A] p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#5E6AD2]/10 border border-[#5E6AD2]/20 flex items-center justify-center text-[#5E6AD2]">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-white">
              PKR {(totalApprovedPaisa / 100).toLocaleString()}
            </div>
            <div className="text-xs text-slate-400">Total Approved Payout ({selectedYear})</div>
          </div>
        </div>

        <div className="rounded-xl border border-[#1E2235] bg-[#0F111A] p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-white">{pendingCount}</div>
            <div className="text-xs text-slate-400">Requests Awaiting Review</div>
          </div>
        </div>

        <div className="rounded-xl border border-[#1E2235] bg-[#0F111A] p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-white">{availableDays} Days</div>
            <div className="text-xs text-slate-400">Your Eligible Annual Balance</div>
          </div>
        </div>
      </section>

      {/* Encashment Requests Table */}
      <section className="rounded-2xl border border-[#1E2235] bg-[#0F111A] p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-[#1E2235]">
          <div>
            <h3 className="text-sm font-semibold text-white">Encashment History & Payout Queue</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Approved requests are automatically added to the next M9 Monthly Payroll execution
            </p>
          </div>
        </div>

        {isLoadingEncashments ? (
          <div className="py-12 text-center text-slate-400 animate-pulse">Loading encashment records...</div>
        ) : encashments.length === 0 ? (
          <div className="py-12 text-center">
            <Coins className="w-10 h-10 mx-auto text-slate-600 mb-3" />
            <p className="text-sm font-medium text-slate-300">No encashment records submitted for {selectedYear}.</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Eligible employees with unutilized annual leaves can request financial compensation above.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1E2235] text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-3">Employee</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3 text-center">Encashed Days</th>
                  <th className="py-3 px-3 text-right">Daily Rate</th>
                  <th className="py-3 px-3 text-right">Total Payout</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  {canDecide && <th className="py-3 px-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E2235]/60 text-xs">
                {encashments.map((item) => {
                  const badge = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
                  const Icon = badge.icon;
                  const emp = item.employeeId || {};
                  const type = item.leaveTypeId || {};

                  return (
                    <tr key={item._id} className="hover:bg-[#161926]/40 transition-colors">
                      <td className="py-3.5 px-3">
                        <div className="font-semibold text-white">{emp.name || 'Staff'}</div>
                        <div className="text-[10px] text-slate-400">{emp.employeeCode}</div>
                      </td>
                      <td className="py-3.5 px-3 text-slate-300 font-medium">
                        {type.name || 'Annual Leave'}
                      </td>
                      <td className="py-3.5 px-3 text-center font-bold text-white">
                        {item.days} {item.days === 1 ? 'day' : 'days'}
                      </td>
                      <td className="py-3.5 px-3 text-right text-slate-300">
                        PKR {((item.dailyRatePaisa || 0) / 100).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-3 text-right font-bold text-emerald-400">
                        PKR {((item.totalAmountPaisa || 0) / 100).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border',
                            badge.bg
                          )}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {badge.label}
                        </span>
                      </td>
                      {canDecide && (
                        <td className="py-3.5 px-3 text-right">
                          {item.status === 'pending' ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleDecide(item._id, 'approve')}
                                disabled={isDeciding}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold transition-colors cursor-pointer"
                              >
                                <Check className="w-3 h-3" />
                                <span>Approve</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDecide(item._id, 'reject')}
                                disabled={isDeciding}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-[11px] font-semibold transition-colors cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                                <span>Reject</span>
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-600 text-[11px]">—</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Request Encashment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-[#0F111A] border border-[#1E2235] w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-[#1E2235]">
              <div className="flex items-center gap-2 text-white font-semibold text-sm">
                <Coins className="w-4 h-4 text-[#5E6AD2]" />
                <span>Request Leave Encashment</span>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#1E2235] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              {/* Category */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Eligible Leave Category
                </label>
                <select
                  value={activeTypeId}
                  onChange={(e) => setSelectedTypeId(e.target.value)}
                  className="w-full bg-[#161926] border border-[#1E2235] text-slate-200 text-xs rounded-xl px-3 py-2.5 focus:border-[#5E6AD2] focus:outline-hidden"
                >
                  {paidTypes.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name} ({t.code})
                    </option>
                  ))}
                </select>
                <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Available unutilized:</span>
                  <span className="font-semibold text-white">{availableDays} days</span>
                </div>
              </div>

              {/* Days to Encash */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Days to Encash (Max {Math.min(15, availableDays)})
                </label>
                <input
                  type="number"
                  min="0.5"
                  max={Math.min(15, availableDays)}
                  step="0.5"
                  value={requestedDays}
                  onChange={(e) => setRequestedDays(Number(e.target.value))}
                  required
                  className="w-full bg-[#161926] border border-[#1E2235] text-slate-200 text-xs rounded-xl px-3 py-2.5 focus:border-[#5E6AD2] focus:outline-hidden"
                />
              </div>

              {/* Payout Preview Card */}
              <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-1 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Estimated Daily Compensation:</span>
                  <span className="text-white font-medium">~PKR {estimatedDailyRatePkr.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between font-bold pt-1 border-t border-emerald-500/15">
                  <span className="text-emerald-300">Estimated Total Payout:</span>
                  <span className="text-emerald-400 text-sm">PKR {estimatedPayoutPkr.toLocaleString()}</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  *Exact compensation is computed from verified Basic Salary on the date of approval.
                </p>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Remarks / Justification
                </label>
                <textarea
                  rows="2"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Unutilized annual entitlement encashment for financial year end"
                  className="w-full bg-[#161926] border border-[#1E2235] text-slate-200 text-xs rounded-xl p-3 focus:border-[#5E6AD2] focus:outline-hidden resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1E2235]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-[#1E2235] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || availableDays <= 0}
                  className="px-4 py-2 rounded-xl bg-[#5E6AD2] hover:bg-[#4E5AC0] text-white text-xs font-semibold shadow-md shadow-[#5E6AD2]/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Confirm Encashment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default EncashmentPage;

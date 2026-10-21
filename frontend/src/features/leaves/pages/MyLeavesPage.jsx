/**
 * @file MyLeavesPage.jsx
 * @description Self-Service Leave Portal with Quota Balances & Leave History (BUILD-GUIDE Row 6.9 & 6.3).
 * 
 * SPECIFICATION:
 * - Module: M6 Leave & Holidays
 * - Features: Live Balance Cards, Quota Breakdown, Year Filter, Leave Request Drawer/Modal, Requests History
 * - Theme: Linear Dark Craft (#090A0F, #0F111A, #1E2235, #5E6AD2)
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Calendar, Plus, Filter, Clock, FileText, ChevronDown, CheckCircle2, XCircle, AlertCircle, ExternalLink, Ban, Coins } from 'lucide-react';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { LeaveBalanceCards } from '../components/LeaveBalanceCards.jsx';
import { ApplyLeaveModal } from '../components/ApplyLeaveModal.jsx';
import { useGetMyLeavesQuery, useCancelLeaveMutation } from '../leavesApi.js';
import { cn } from '../../../lib/utils.js';
import { openSecureFile } from '../../../utils/fileHelper.js';

const STATUS_BADGES = {
  approved: {
    bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    icon: CheckCircle2,
    label: 'Approved'
  },
  pending: {
    bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    icon: Clock,
    label: 'In Review'
  },
  rejected: {
    bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    icon: XCircle,
    label: 'Rejected'
  },
  cancelled: {
    bg: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    icon: AlertCircle,
    label: 'Cancelled'
  }
};

export function MyLeavesPage() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

  const availableYears = [currentYear + 1, currentYear, currentYear - 1, currentYear - 2];

  const { data: leavesResponse, isLoading: isLoadingLeaves } = useGetMyLeavesQuery({
    year: selectedYear
  });
  const leavesList = leavesResponse?.data || [];
  const [cancelLeave, { isLoading: isCancelling }] = useCancelLeaveMutation();

  const handleCancelClick = async (leave) => {
    const reason = window.prompt('Please enter a brief cancellation reason:', 'Personal plans changed');
    if (reason === null) return;
    if (!reason.trim()) {
      toast.error('Cancellation reason is required.');
      return;
    }

    try {
      await cancelLeave({
        id: leave._id,
        cancellationReason: reason.trim()
      }).unwrap();
      toast.success('Leave request cancelled and quota balance restored.');
    } catch (err) {
      toast.error(err?.data?.message || err?.message || 'Failed to cancel leave request.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Leaves & Quotas"
        subtitle="Live inspection of your allocated annual leave quotas, utilized days, and remaining balances."
        badge="Self-Service Portal"
        actions={
          <div className="flex items-center gap-3">
            {/* Year Selector */}
            <div className="relative">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                aria-label="Filter by Year"
                className="appearance-none bg-[#0F111A] border border-[#1E2235] text-slate-200 text-xs font-semibold rounded-xl pl-3 pr-8 py-2.5 hover:border-[#5E6AD2] focus:outline-hidden focus:ring-2 focus:ring-[#5E6AD2]/30 transition-all cursor-pointer"
              >
                {availableYears.map((yr) => (
                  <option key={yr} value={yr} className="bg-[#0F111A] text-white">
                    Year {yr}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Request Encashment Action */}
            <Link
              to="/leaves/encashment"
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#0F111A] hover:bg-[#1E2235] border border-[#1E2235] hover:border-amber-500/40 text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer"
              title="Request annual leave encashment and view payout history"
            >
              <Coins className="w-4 h-4 text-amber-400" />
              <span>Leave Encashment</span>
            </Link>

            {/* Apply Leave Action */}
            <button
              onClick={() => setIsApplyModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#5E6AD2] hover:bg-[#4E5AC0] text-white text-xs font-semibold shadow-lg shadow-[#5E6AD2]/20 hover:shadow-[#5E6AD2]/40 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Apply for Leave</span>
            </button>
          </div>
        }
      />

      {/* Live Category-Wise Quota Progress Cards (Slice 6.9) */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-300 tracking-wide flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#5E6AD2]" />
            <span>Leave Quotas & Balances ({selectedYear})</span>
          </h2>
          <span className="text-xs text-slate-500">Auto-calculated against approved & pending leaves</span>
        </div>
        <LeaveBalanceCards year={selectedYear} onApplyClick={() => setIsApplyModalOpen(true)} />
      </section>

      {/* Requests History (Slice 6.3) */}
      <section className="rounded-2xl border border-[#1E2235] bg-[#0F111A] p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-[#1E2235]">
          <div>
            <h3 className="text-sm font-semibold text-white">My Leave Requests</h3>
            <p className="text-xs text-slate-400 mt-0.5">Track status, supervisor approvals, and cancellation options</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span> Active Cycle
          </div>
        </div>

        {isLoadingLeaves ? (
          <div className="py-12 text-center text-slate-400 animate-pulse">Loading leave records...</div>
        ) : leavesList.length === 0 ? (
          <div className="py-12 text-center">
            <Clock className="w-10 h-10 mx-auto text-slate-600 mb-3" />
            <p className="text-sm font-medium text-slate-300">No leave applications submitted for {selectedYear} yet.</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Click &quot;Apply for Leave&quot; above to submit an annual, casual, or medical leave request.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1E2235] text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-3">Leave Type</th>
                  <th className="py-3 px-3">Date Window</th>
                  <th className="py-3 px-3 text-center">Duration</th>
                  <th className="py-3 px-3">Reason</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3">Attachment</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E2235]/60 text-xs">
                {leavesList.map((item) => {
                  const badge = STATUS_BADGES[item.status] || STATUS_BADGES.pending;
                  const Icon = badge.icon;
                  const type = item.leaveTypeId || {};
                  const startStr = item.startDate ? item.startDate.split('T')[0] : '—';
                  const endStr = item.endDate ? item.endDate.split('T')[0] : '—';
                  const canCancel = item.status === 'pending' || (item.status === 'approved' && new Date(item.startDate) >= new Date(new Date().setHours(0,0,0,0)));

                  return (
                    <tr key={item._id} className="hover:bg-[#161926]/40 transition-colors">
                      <td className="py-3.5 px-3">
                        <span className="font-semibold text-white">{type.name || 'Leave'}</span>
                        <span className="block text-[10px] text-slate-400 uppercase tracking-wider">{type.code}</span>
                      </td>
                      <td className="py-3.5 px-3 text-slate-300">
                        {startStr === endStr ? startStr : `${startStr} → ${endStr}`}
                        {item.halfDay !== 'none' && (
                          <span className="ml-1.5 text-[10px] px-1.5 py-0.2 bg-[#5E6AD2]/20 text-[#5E6AD2] rounded">
                            {item.halfDay === 'first_half' ? '1st Half' : '2nd Half'}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-center font-bold text-slate-200">
                        {item.days} {item.days === 1 ? 'day' : 'days'}
                      </td>
                      <td className="py-3.5 px-3 text-slate-400 max-w-xs truncate" title={item.reason}>
                        {item.reason}
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
                      <td className="py-3.5 px-3">
                        {item.attachmentUrl ? (
                          <button
                            type="button"
                            onClick={() => openSecureFile(item.attachmentUrl)}
                            className="inline-flex items-center gap-1 text-[#5E6AD2] hover:underline text-[11px] cursor-pointer bg-transparent border-none p-0"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Proof</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        ) : (
                          <span className="text-slate-600 text-[11px]">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        {canCancel ? (
                          <button
                            type="button"
                            onClick={() => handleCancelClick(item)}
                            disabled={isCancelling}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-[11px] font-medium transition-colors cursor-pointer disabled:opacity-50"
                            title="Cancel Leave Request"
                          >
                            <Ban className="w-3 h-3" />
                            <span>Cancel</span>
                          </button>
                        ) : (
                          <span className="text-slate-600 text-[11px]">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Apply Leave Modal */}
      <ApplyLeaveModal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
      />
    </div>
  );
}

export default MyLeavesPage;

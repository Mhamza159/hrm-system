/**
 * @file MyLeavesPage.jsx
 * @description Enterprise Leaves & Quotas Portal with Adaptive RBAC/PBAC Modes:
 *   - Super Admin: Executive Leave Command Center with live workforce presence,
 *     pending approvals queue, leave categories health, and holiday roadmap.
 *   - Department Manager: Team absence status & pending subordinates approvals
 *     combined with personal annual quota cards and self-service history.
 *   - Regular Employee: Live quota progress bars (Annual, Casual, Sick, etc.),
 *     "Apply for Leave" modal with working days calculation, and requests history.
 * 
 * SPECIFICATION & THEME:
 * - Module: M6 Leave & Holidays (BUILD-GUIDE Row 6.9 & 6.3)
 * - Brand Theme: ELVARA Emerald Design System (Light & Dark Mode compatible)
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Calendar,
  Plus,
  Clock,
  FileText,
  ChevronDown,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Coins,
  ShieldCheck,
  Users,
  ArrowRight,
  RefreshCw,
  Building2,
  Sparkles,
  CalendarCheck2,
  Check,
  X,
  ExternalLink,
  ChevronRight,
  Info,
  Search
} from 'lucide-react';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { LeaveBalanceCards } from '../components/LeaveBalanceCards.jsx';
import { ApplyLeaveModal } from '../components/ApplyLeaveModal.jsx';
import { LeaveDecideModal } from '../components/LeaveDecideModal.jsx';
import {
  useGetMyLeavesQuery,
  useCancelLeaveMutation,
  useGetPendingApprovalsQuery,
  useGetLeaveTypesQuery,
  useGetHolidaysQuery
} from '../leavesApi.js';
import { usePermission } from '../../../hooks/usePermission.js';
import { useAuth } from '../../../hooks/useAuth.js';
import { cn } from '../../../lib/utils.js';
import { openSecureFile } from '../../../utils/fileHelper.js';

const STATUS_BADGES = {
  approved: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60',
    icon: CheckCircle2,
    label: 'Approved'
  },
  pending: {
    bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60',
    icon: Clock,
    label: 'In Review'
  },
  rejected: {
    bg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60',
    icon: XCircle,
    label: 'Rejected'
  },
  cancelled: {
    bg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    icon: AlertCircle,
    label: 'Cancelled'
  }
};

export function MyLeavesPage() {
  const { isSuperAdmin, can } = usePermission();
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

  // Executive Decision Modal State for Super Admin / Managers
  const [selectedLeaveForDecision, setSelectedLeaveForDecision] = useState(null);
  const [decisionAction, setDecisionAction] = useState('approve');
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);

  const availableYears = [currentYear + 1, currentYear, currentYear - 1, currentYear - 2];
  const [historyStatus, setHistoryStatus] = useState('all');
  const [historySearch, setHistorySearch] = useState('');

  // Self leaves
  const {
    data: leavesResponse,
    isLoading: isLoadingLeaves,
    refetch: refetchMyLeaves
  } = useGetMyLeavesQuery(
    {
      year: selectedYear,
      status: historyStatus !== 'all' ? historyStatus : undefined,
      search: historySearch.trim() || undefined
    },
    { skip: isSuperAdmin }
  );
  const leavesList = leavesResponse?.data || [];
  const [cancelLeave, { isLoading: isCancelling }] = useCancelLeaveMutation();

  // Company pending approvals (For Super Admin and Managers)
  const canReviewApprovals = isSuperAdmin || can('leave.approve', 'all') || can('leave.approve', 'department');
  const {
    data: approvalsResponse,
    isLoading: isLoadingApprovals,
    refetch: refetchApprovals
  } = useGetPendingApprovalsQuery({}, { skip: !canReviewApprovals });
  const pendingApprovals = approvalsResponse?.data || [];

  // Active leave types and holidays metadata for executive overview
  const { data: typesResponse } = useGetLeaveTypesQuery({ activeOnly: 'true' }, { skip: !isSuperAdmin });
  const activeLeaveTypes = typesResponse?.data || [];

  const { data: holidaysResponse } = useGetHolidaysQuery({ year: currentYear }, { skip: !isSuperAdmin });
  const companyHolidays = holidaysResponse?.data || [];

  // Find next upcoming holiday
  const upcomingHoliday = React.useMemo(() => {
    if (!companyHolidays || companyHolidays.length === 0) return null;
    const now = new Date();
    return companyHolidays
      .filter((h) => new Date(h.date) >= now && h.isActive)
      .sort((a, b) => new Date(a.date) - new Date(b.date))[0] || null;
  }, [companyHolidays]);

  const handleCancelClick = async (leave) => {
    const reason = window.prompt('Please enter a brief cancellation reason:', 'Personal schedule adjusted');
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
      refetchMyLeaves();
    } catch (err) {
      toast.error(err?.data?.message || err?.message || 'Failed to cancel leave request.');
    }
  };

  const handleOpenDecision = (leave, action) => {
    setSelectedLeaveForDecision(leave);
    setDecisionAction(action);
    setIsDecisionModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* 1. Page Header with Responsive Toolbar */}
      <PageHeader
        title="Leaves & Quotas"
        subtitle={
          isSuperAdmin
            ? 'Executive Workforce Leave Governance, Multi-Tier Approvals, and Holiday Calendar.'
            : 'Live inspection of your allocated annual leave quotas, utilized days, and remaining balances.'
        }
        badge={
          isSuperAdmin
            ? 'Executive Command Center'
            : canReviewApprovals
            ? 'Managerial Portal'
            : 'Self-Service Portal'
        }
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Year Selector */}
            <div className="relative">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                aria-label="Filter by Year"
                className="appearance-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl pl-3.5 pr-8 py-2 hover:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-xs cursor-pointer transition-colors"
              >
                {availableYears.map((yr) => (
                  <option key={yr} value={yr} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                    Year {yr}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Leave Encashment Shortcut */}
            <Link
              to="/leaves/encashment"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-400/60 dark:hover:border-amber-500/40 text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              title="Request annual leave encashment and view payout history"
            >
              <Coins className="w-3.5 h-3.5 text-amber-500" />
              <span>Leave Encashment</span>
            </Link>

            {/* Primary Action Button by Role */}
            {isSuperAdmin ? (
              <div className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold shadow-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Exempt from Quotas</span>
              </div>
            ) : (
              <button
                onClick={() => setIsApplyModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Apply for Leave</span>
              </button>
            )}
          </div>
        }
      />

      {/* 2. SUPER ADMIN EXECUTIVE COMMAND HUB */}
      {isSuperAdmin ? (
        <div className="space-y-6">
          {/* Executive Privilege Status Banner */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/30 dark:border-emerald-500/20 p-6 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20 shrink-0">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                      Super Admin Executive Leave Governance
                    </h2>
                    <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      Owner Privilege Active
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    As the primary enterprise authority, your profile is completely exempt from mandatory annual leave quotas, supervisor approval hierarchies, and automated absenteeism deductions. You maintain sovereign authority to review, approve, and oversee time-off policies company-wide.
                  </p>
                </div>
              </div>

              {/* Quick Navigation Action Hub */}
              <div className="flex flex-wrap md:flex-col gap-2 shrink-0">
                <Link
                  to="/leaves/approvals"
                  className="inline-flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Review Pending Queue</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-white/20 text-white font-bold text-[10px]">
                    {pendingApprovals.length}
                  </span>
                </Link>

                <Link
                  to="/leaves/calendar"
                  className="inline-flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-xs transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    <span>Company Leave Heatmap</span>
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>
              </div>
            </div>
          </div>

          {/* 4 Executive KPI Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Pending Approvals */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Approval Queue</span>
                <div className={`p-2 rounded-xl ${pendingApprovals.length > 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'}`}>
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className={`text-2xl font-bold ${pendingApprovals.length > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
                  {isLoadingApprovals ? '...' : pendingApprovals.length}
                </span>
                <span className="text-xs text-slate-400 font-medium">pending requests</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {pendingApprovals.length > 0 ? 'Multi-tier approvals awaiting review' : 'All leave requests resolved'}
              </p>
            </div>

            {/* Card 2: Configured Leave Types */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Leave Categories</span>
                <div className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl">
                  <FileText className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                  {activeLeaveTypes.length}
                </span>
                <span className="text-xs text-slate-400 font-medium">active types</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Annual, Casual, Sick, Maternity, Hajj
              </p>
            </div>

            {/* Card 3: Next Public Holiday */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Next Public Holiday</span>
                <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
                  <CalendarCheck2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-base font-bold text-slate-900 dark:text-white truncate block">
                  {upcomingHoliday ? upcomingHoliday.name : 'No Upcoming Holiday'}
                </span>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5 block">
                  {upcomingHoliday ? new Date(upcomingHoliday.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'All cleared for this period'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Pakistan Gazetted Calendar</p>
            </div>

            {/* Card 4: Executive Exemption Retained */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Deduction Status</span>
                <div className="p-2 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 rounded-xl">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 block">
                  100% Retained / Exempt
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 block">
                  Salary exempt from leave quotas
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Auto-absent disabled for owner</p>
            </div>
          </div>

          {/* Company-Wide Pending Approvals Stream Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <span>Company Time-Off Requests Awaiting Approval</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Multi-tier approvals requiring manager or executive review before payroll freeze
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => refetchApprovals()}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-emerald-600 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingApprovals ? 'animate-spin text-emerald-600' : ''}`} />
                  <span>Refresh Queue</span>
                </button>
                <Link
                  to="/leaves/approvals"
                  className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                >
                  <span>Open Full Queue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {isLoadingApprovals ? (
              <div className="py-16 text-center text-slate-400 animate-pulse text-xs font-medium">
                Loading live workforce requests...
              </div>
            ) : pendingApprovals.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">All Clear! No Pending Requests</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  Every employee leave application submitted for review has been decided. You can view the scheduled absences on the interactive calendar.
                </p>
                <div className="pt-2">
                  <Link
                    to="/leaves/calendar"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors"
                  >
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    <span>Inspect Organization Leave Calendar</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-3">Applicant</th>
                      <th className="py-3 px-3">Category</th>
                      <th className="py-3 px-3">Date Window</th>
                      <th className="py-3 px-3 text-center">Duration</th>
                      <th className="py-3 px-3">Reason</th>
                      <th className="py-3 px-3 text-center">Step</th>
                      <th className="py-3 px-3 text-right">Decision</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {pendingApprovals.slice(0, 8).map((leave) => {
                      const emp = leave.employeeId || {};
                      const type = leave.leaveTypeId || {};
                      const startStr = leave.startDate ? leave.startDate.split('T')[0] : '—';
                      const endStr = leave.endDate ? leave.endDate.split('T')[0] : '—';

                      return (
                        <tr key={leave._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                                {emp.avatar ? (
                                  <img src={emp.avatar} alt={emp.name} className="w-full h-full object-cover" />
                                ) : (
                                  (emp.name || 'EM').slice(0, 2).toUpperCase()
                                )}
                              </div>
                              <div>
                                <span className="font-semibold text-slate-900 dark:text-white block">{emp.name || 'Employee'}</span>
                                <span className="text-[11px] text-slate-400">{emp.employeeCode || '—'} · {emp.departmentId?.name || 'Department'}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{type.name || 'Leave'}</span>
                            <span className="block text-[10px] text-slate-400 uppercase tracking-wider">{type.code}</span>
                          </td>
                          <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                            {startStr === endStr ? startStr : `${startStr} → ${endStr}`}
                          </td>
                          <td className="py-3 px-3 text-center font-bold text-slate-800 dark:text-slate-200">
                            {leave.days} {leave.days === 1 ? 'day' : 'days'}
                          </td>
                          <td className="py-3 px-3 text-slate-500 max-w-xs truncate" title={leave.reason}>
                            {leave.reason}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                              Tier {leave.currentStep || 1}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenDecision(leave, 'approve')}
                                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Approve</span>
                              </button>
                              <button
                                onClick={() => handleOpenDecision(leave, 'reject')}
                                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800 transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Reject</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* 3. STAFF & MANAGERIAL SELF-SERVICE WORKSPACE */
        <div className="space-y-6">
          {/* Manager Oversight Callout if applicable */}
          {canReviewApprovals && pendingApprovals.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-center justify-between gap-4 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500 text-white shadow-xs">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider">
                    Subordinate Team Approvals Waiting ({pendingApprovals.length})
                  </h4>
                  <p className="text-xs text-amber-800/90 dark:text-amber-300 mt-0.5">
                    Team members in your reporting chain have submitted leave requests requiring your review.
                  </p>
                </div>
              </div>
              <Link
                to="/leaves/approvals"
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shrink-0 shadow-xs transition-colors"
              >
                Review Team Requests
              </Link>
            </div>
          )}

          {/* Live Category-Wise Quota Progress Cards (Slice 6.9) */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-wide uppercase flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span>Annual Leave Quotas & Balances ({selectedYear})</span>
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Calculated against approved & active applications
              </span>
            </div>
            <LeaveBalanceCards year={selectedYear} onApplyClick={() => setIsApplyModalOpen(true)} />
          </section>

          {/* Requests History (Slice 6.3) */}
          <section className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  My Leave Requests History
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Track status, supervisor approval steps, and cancellation options
                </p>
              </div>

              {/* Status & Search Controls */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs">
                  {['all', 'pending', 'approved', 'rejected'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setHistoryStatus(st)}
                      className={cn(
                        'px-2.5 py-1 rounded-lg font-semibold capitalize transition-all cursor-pointer',
                        historyStatus === st
                          ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      )}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    placeholder="Search my leaves..."
                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs rounded-xl pl-8 pr-7 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 w-44"
                  />
                  {historySearch && (
                    <button
                      onClick={() => setHistorySearch('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {isLoadingLeaves ? (
              <div className="py-12 text-center text-slate-400 animate-pulse text-xs">
                Loading your leave history...
              </div>
            ) : leavesList.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <Clock className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  No leave applications submitted for {selectedYear} yet.
                </p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Click &quot;Apply for Leave&quot; above to submit an annual, casual, or medical leave request.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-3">Leave Category</th>
                      <th className="py-3 px-3">Date Window</th>
                      <th className="py-3 px-3 text-center">Duration</th>
                      <th className="py-3 px-3">Reason</th>
                      <th className="py-3 px-3 text-center">Status</th>
                      <th className="py-3 px-3">Attachment</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {leavesList.map((item) => {
                      const badge = STATUS_BADGES[item.status] || STATUS_BADGES.pending;
                      const Icon = badge.icon;
                      const type = item.leaveTypeId || {};
                      const startStr = item.startDate ? item.startDate.split('T')[0] : '—';
                      const endStr = item.endDate ? item.endDate.split('T')[0] : '—';
                      const canCancel =
                        item.status === 'pending' ||
                        (item.status === 'approved' &&
                          new Date(item.startDate) >= new Date(new Date().setHours(0, 0, 0, 0)));

                      return (
                        <tr key={item._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-3.5 px-3">
                            <span className="font-semibold text-slate-900 dark:text-white block">
                              {type.name || 'Leave'}
                            </span>
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider">{type.code}</span>
                          </td>
                          <td className="py-3.5 px-3 text-slate-600 dark:text-slate-300">
                            {startStr === endStr ? startStr : `${startStr} → ${endStr}`}
                            {item.halfDay !== 'none' && (
                              <span className="ml-1.5 text-[10px] px-1.5 py-0.2 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded font-semibold">
                                {item.halfDay === 'first_half' ? '1st Half' : '2nd Half'}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-3 text-center font-bold text-slate-800 dark:text-slate-200">
                            {item.days} {item.days === 1 ? 'day' : 'days'}
                          </td>
                          <td className="py-3.5 px-3 text-slate-500 max-w-xs truncate" title={item.reason}>
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
                                className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline text-[11px] font-medium cursor-pointer bg-transparent border-none p-0"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>View Document</span>
                              </button>
                            ) : (
                              <span className="text-slate-400 text-[11px]">—</span>
                            )}
                          </td>
                          <td className="py-3.5 px-3 text-right">
                            {canCancel ? (
                              <button
                                type="button"
                                onClick={() => handleCancelClick(item)}
                                disabled={isCancelling}
                                className="px-3 py-1 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                              >
                                Cancel Leave
                              </button>
                            ) : (
                              <span className="text-slate-400 text-[11px]">Completed</span>
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
        </div>
      )}

      {/* Apply Leave Modal Component */}
      <ApplyLeaveModal isOpen={isApplyModalOpen} onClose={() => setIsApplyModalOpen(false)} />

      {/* Leave Decision Modal Component (For Executive & Manager Approvals) */}
      <LeaveDecideModal
        isOpen={isDecisionModalOpen}
        onClose={() => {
          setIsDecisionModalOpen(false);
          refetchApprovals();
        }}
        leave={selectedLeaveForDecision}
        initialAction={decisionAction}
      />
    </div>
  );
}

export default MyLeavesPage;

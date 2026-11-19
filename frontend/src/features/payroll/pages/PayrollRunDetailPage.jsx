/**
 * @file PayrollRunDetailPage.jsx
 * @description Detailed inspection view for a single monthly payroll run.
 * 
 * SPECIFICATION & CRAFT:
 * - Module: M9 Payroll (BUILD-GUIDE Section 12 · Rows 9.8 & 9.9)
 * - Layer: Feature Page (React 18 / Tailwind)
 * - Theme: ELVARA Emerald Design System (Strict adherence to DESIGN.md & docs/UI-REFERENCE.md)
 * - Features: 4-stage release stepper, 6 financial metric cards, itemized employee payslip table
 *             with avatar initials, line-item adjustment drawer, pristine preview modal,
 *             and ConfirmDialog modals (zero window.confirm calls).
 */

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Users,
  CheckCircle2,
  Clock,
  ShieldCheck,
  FileCheck2,
  AlertCircle,
  TrendingUp,
  Search,
  Filter,
  SlidersHorizontal,
  Eye,
  Lock,
  Trash2,
  Download,
  CreditCard,
  Banknote
} from 'lucide-react';
import {
  useGetPayrollRunByIdQuery,
  useApprovePayrollRunMutation,
  useMarkPayrollPaidMutation,
  useDeletePayrollRunMutation
} from '../payrollApi.js';
import { PayslipAdjustmentDrawer } from '../components/PayslipAdjustmentDrawer.jsx';
import { PayslipPreviewModal } from '../components/PayslipPreviewModal.jsx';
import { BankAdviceExportModal } from '../components/BankAdviceExportModal.jsx';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog.jsx';
import { Can } from '../../../components/common/Can.jsx';
import { toast } from 'sonner';
import { ScreenSkeleton } from '../../../components/common/ScreenSkeleton.jsx';
import { RefreshButton } from '../../../components/common/RefreshButton.jsx';
import { usePermission } from '../../../hooks/usePermission.js';
import { cn } from '../../../lib/utils.js';

export function PayrollRunDetailPage() {
  const { can, isSuperAdmin } = usePermission();
  const { id } = useParams();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPayslipForAdjustment, setSelectedPayslipForAdjustment] = useState(null);
  const [selectedPayslipForPreview, setSelectedPayslipForPreview] = useState(null);
  const [isBankAdviceModalOpen, setIsBankAdviceModalOpen] = useState(false);

  // Dialog States
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isMarkPaidDialogOpen, setIsMarkPaidDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const accessToken = useSelector((state) => state.auth?.accessToken);

  const { data, isLoading, isFetching, refetch } = useGetPayrollRunByIdQuery({ id });
  const [approvePayrollRun, { isLoading: isApproving }] = useApprovePayrollRunMutation();
  const [markPayrollPaid, { isLoading: isPaying }] = useMarkPayrollPaidMutation();
  const [deletePayrollRun, { isLoading: isDeleting }] = useDeletePayrollRunMutation();

  const run = data?.data?.run || data?.run || data?.data || {};
  const payslips = data?.data?.payslips || data?.payslips || [];

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthName = monthNames[(run.month || 1) - 1];

  // Actions with ConfirmDialog
  const handleApproveConfirm = async () => {
    try {
      await approvePayrollRun(id).unwrap();
      toast.success(`Payroll run for ${monthName} ${run.year} approved and locked.`);
      setIsApproveDialogOpen(false);
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || err?.message || 'Failed to approve payroll run');
    }
  };

  const handleMarkPaidConfirm = async () => {
    try {
      await markPayrollPaid({ runId: id, paymentMethod: 'cash' }).unwrap();
      toast.success(`Payroll run for ${monthName} ${run.year} marked as paid.`);
      setIsMarkPaidDialogOpen(false);
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || err?.message || 'Failed to mark payroll as paid');
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deletePayrollRun(id).unwrap();
      toast.success(`Payroll run for ${monthName} ${run.year} moved to Archive.`);
      setIsDeleteDialogOpen(false);
      navigate('/payroll/runs');
    } catch (err) {
      toast.error(err?.data?.message || err?.message || 'Failed to archive payroll run');
    }
  };

  const handleDownloadPdf = async (slipId) => {
    try {
      const response = await fetch(`/api/v1/payslips/${slipId}/pdf`, {
        method: 'GET',
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to download payslip PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Payslip_${slipId.slice(-6)}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      toast.success('Salary slip downloaded successfully');
    } catch (err) {
      toast.error(err.message || 'Error downloading PDF');
    }
  };

  const filteredPayslips = payslips.filter((slip) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const emp = typeof slip.employeeId === 'object' && slip.employeeId !== null ? slip.employeeId : {};
    const name = (emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Employee').toLowerCase();
    const code = (emp.employeeCode || emp.employeeId || '').toLowerCase();
    const dept = (emp.departmentId?.name || emp.department?.name || '').toLowerCase();
    return name.includes(term) || code.includes(term) || dept.includes(term);
  });

  const stages = [
    { key: 'draft', label: '1. DRAFT', sub: 'Initial Generation' },
    { key: 'review', label: '2. REVIEW', sub: 'Audit & Adjustments' },
    { key: 'approved', label: '3. APPROVED', sub: 'Locked by Super Admin' },
    { key: 'paid', label: '4. DISBURSED (PAID)', sub: 'Direct Disbursement' }
  ];

  const currentStageIndex = stages.findIndex((s) => s.key === run.status);

  if (isLoading) {
    return <ScreenSkeleton variant="table" title="Payroll Run Details" message="Aggregating payslips, statutory deductions & stage state..." rows={6} />;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* 1. Top Navigation & Aligned Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/payroll/runs')}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-[#15231C] border border-transparent hover:border-slate-200/80 dark:hover:border-[#1A3125] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {monthName} {run.year} Payroll
              </h1>
              <span className={cn(
                'inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border',
                run.status === 'paid'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                  : run.status === 'approved'
                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
              )}>
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                {run.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Run ID: <span className="font-mono">{run._id}</span> · Created on {new Date(run.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Right Aligned Controls (All h-9) */}
        <div className="flex items-center gap-2.5">
          <RefreshButton onRefresh={refetch} isFetching={isFetching} />

          {/* Export Bank Advice */}
          {(isSuperAdmin || can('payroll.export')) && (
            <button
              type="button"
              onClick={() => setIsBankAdviceModalOpen(true)}
              className="h-9 px-3.5 inline-flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-[#15231C] border border-slate-200/80 dark:border-[#1A3125] hover:bg-slate-50 dark:hover:bg-[#1A3125] rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Export Bank Advice</span>
            </button>
          )}

          {/* Approve & Freeze Run */}
          {(run.status === 'draft' || run.status === 'review') && (
            <Can I="payroll.approve" a="Payroll">
              <button
                type="button"
                onClick={() => setIsApproveDialogOpen(true)}
                disabled={isApproving}
                className="h-9 px-4 inline-flex items-center gap-2 text-xs font-semibold text-white bg-[#00C471] hover:bg-[#049856] disabled:opacity-50 rounded-xl shadow-xs shadow-emerald-600/20 active:scale-[0.98] transition-all cursor-pointer"
              >
                <FileCheck2 className="w-3.5 h-3.5" />
                <span>{isApproving ? 'Approving...' : 'Approve & Freeze'}</span>
              </button>
            </Can>
          )}

          {/* Mark as Paid */}
          {run.status === 'approved' && (
            <Can I="payroll.approve" a="Payroll">
              <button
                type="button"
                onClick={() => setIsMarkPaidDialogOpen(true)}
                disabled={isPaying}
                className="h-9 px-4 inline-flex items-center gap-2 text-xs font-semibold text-white bg-[#00C471] hover:bg-[#049856] disabled:opacity-50 rounded-xl shadow-xs shadow-emerald-600/20 active:scale-[0.98] transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isPaying ? 'Marking Paid...' : 'Mark Disbursed (Paid)'}</span>
              </button>
            </Can>
          )}

          {/* Delete / Archive Run */}
          {(isSuperAdmin || can('payroll.manage')) && (
            <button
              type="button"
              onClick={() => setIsDeleteDialogOpen(true)}
              disabled={isDeleting}
              className="h-9 px-3.5 inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200/60 dark:border-rose-800/40 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              title="Archive this payroll run"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Run</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. 4-Stage Lifecycle Stepper with Hairline Craft */}
      <div className="bg-white dark:bg-[#111D17] p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-[#1A3125] shadow-xs">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {stages.map((stage, idx) => {
            const isCompleted = idx < currentStageIndex || run.status === 'paid';
            const isCurrent = idx === currentStageIndex && run.status !== 'paid';

            return (
              <React.Fragment key={stage.key}>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div
                    className={cn(
                      'w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs transition-colors shrink-0 font-mono border',
                      isCompleted
                        ? 'bg-[#00C471] text-white border-emerald-600 shadow-xs shadow-emerald-600/20'
                        : isCurrent
                        ? 'bg-[#00C471]/15 text-[#00C471] border-[#00C471]/40 ring-4 ring-[#00C471]/10'
                        : 'bg-slate-100 dark:bg-[#15231C] text-slate-400 border-slate-200/80 dark:border-[#1A3125]'
                    )}
                  >
                    {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                  </div>
                  <div>
                    <p className={cn(
                      'text-xs font-bold uppercase tracking-wider',
                      isCompleted || isCurrent
                        ? 'text-slate-900 dark:text-white'
                        : 'text-slate-400 dark:text-slate-500'
                    )}>
                      {stage.label}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {stage.sub}
                    </p>
                  </div>
                </div>

                {idx < stages.length - 1 && (
                  <div className={cn(
                    'hidden sm:block flex-1 h-[2px] mx-2 rounded-full',
                    idx < currentStageIndex
                      ? 'bg-[#00C471]'
                      : 'bg-slate-200/80 dark:bg-[#1A3125]'
                  )} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* 3. 6 Financial Metric KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white dark:bg-[#111D17] p-4 rounded-2xl border border-slate-200/80 dark:border-[#1A3125] shadow-xs">
          <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Headcount</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-1 font-mono tabular-nums">
            {run.totalEmployees ?? run.employeeCount ?? payslips.length}
          </p>
        </div>

        <div className="bg-white dark:bg-[#111D17] p-4 rounded-2xl border border-slate-200/80 dark:border-[#1A3125] shadow-xs">
          <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Gross Pay</p>
          <p className="text-lg font-bold text-slate-900 dark:text-white mt-1 font-mono tabular-nums">
            PKR {((run.totalGrossPay || 0) / 100).toLocaleString('en-PK')}
          </p>
        </div>

        <div className="bg-white dark:bg-[#111D17] p-4 rounded-2xl border border-slate-200/80 dark:border-[#1A3125] shadow-xs">
          <p className="text-[11px] font-semibold text-rose-500 uppercase tracking-wider">FBR Tax Withheld</p>
          <p className="text-lg font-bold text-rose-600 dark:text-rose-400 mt-1 font-mono tabular-nums">
            PKR {(((run.totalTaxWithheld ?? run.totalIncomeTax) || 0) / 100).toLocaleString('en-PK')}
          </p>
        </div>

        <div className="bg-white dark:bg-[#111D17] p-4 rounded-2xl border border-slate-200/80 dark:border-[#1A3125] shadow-xs">
          <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">EOBI (EE+ER)</p>
          <p className="text-lg font-bold text-slate-900 dark:text-white mt-1 font-mono tabular-nums">
            PKR {((((run.totalEobiEmployer || 0) + (run.totalEobiEmployee || 0)) || run.totalEobi || 0) / 100).toLocaleString('en-PK')}
          </p>
        </div>

        <div className="bg-white dark:bg-[#111D17] p-4 rounded-2xl border border-slate-200/80 dark:border-[#1A3125] shadow-xs">
          <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Overtime Pay</p>
          <p className="text-lg font-bold text-slate-900 dark:text-white mt-1 font-mono tabular-nums">
            PKR {((run.totalOvertimePay || 0) / 100).toLocaleString('en-PK')}
          </p>
        </div>

        <div className="bg-white dark:bg-[#111D17] p-4 rounded-2xl border border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-xs">
          <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Net Payable</p>
          <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400 mt-1 font-mono tabular-nums">
            PKR {((run.totalNetPay || 0) / 100).toLocaleString('en-PK')}
          </p>
        </div>
      </div>

      {/* 4. Filter and Itemized Payslips Table */}
      <div className="bg-white dark:bg-[#111D17] rounded-2xl border border-slate-200/80 dark:border-[#1A3125] overflow-hidden shadow-xs">
        {/* Table Top Toolbar */}
        <div className="p-4 border-b border-slate-200/80 dark:border-[#1A3125] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by employee name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-9 pl-9 pr-3 text-xs bg-slate-50 dark:bg-[#15231C] border border-slate-200/80 dark:border-[#1A3125] rounded-xl text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00C471]/30"
            />
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Showing <strong className="text-slate-900 dark:text-white font-mono">{filteredPayslips.length}</strong> of <span className="font-mono">{payslips.length}</span> employees
          </div>
        </div>

        {/* Payslips Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300 border-collapse">
            <thead className="bg-slate-50/75 dark:bg-[#0E1A14] text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200/80 dark:border-[#1A3125]">
              <tr>
                <th className="py-3.5 px-6">Employee</th>
                <th className="py-3.5 px-6 text-right">Gross Pay</th>
                <th className="py-3.5 px-6 text-right">Overtime</th>
                <th className="py-3.5 px-6 text-right">Deductions</th>
                <th className="py-3.5 px-6 text-right">Tax (FBR)</th>
                <th className="py-3.5 px-6 text-right">Net Salary</th>
                <th className="py-3.5 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#1A3125]">
              {filteredPayslips.map((slip) => {
                const emp = typeof slip.employeeId === 'object' && slip.employeeId !== null ? slip.employeeId : {};
                const isLocked = run.status === 'approved' || run.status === 'paid';
                const empName = emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Employee';
                const empCode = emp.employeeCode || emp.employeeId || 'EMP';
                const deptName = emp.departmentId?.name || emp.department?.name || 'General';
                const initials = empName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'EM';
                const taxWithheld = slip.taxWithheld || slip.incomeTax || 0;

                return (
                  <tr
                    key={slip._id}
                    className="hover:bg-slate-50/60 dark:hover:bg-[#15231C]/50 transition-colors"
                  >
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-[#15231C] border border-slate-200/80 dark:border-[#1A3125] flex items-center justify-center font-bold text-slate-700 dark:text-slate-300 text-xs font-mono">
                          {initials}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {empName}
                          </div>
                          <div className="text-[11px] text-slate-400 dark:text-slate-500">
                            {empCode} · {deptName}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-6 text-right font-medium text-slate-800 dark:text-slate-200 font-mono tabular-nums text-xs">
                      PKR {((slip.grossPay || 0) / 100).toLocaleString('en-PK')}
                    </td>

                    <td className="py-3.5 px-6 text-right font-medium text-slate-700 dark:text-slate-300 font-mono tabular-nums text-xs">
                      PKR {((slip.overtimePay || 0) / 100).toLocaleString('en-PK')}
                    </td>

                    <td className="py-3.5 px-6 text-right font-medium text-rose-600 dark:text-rose-400 font-mono tabular-nums text-xs">
                      -PKR {((slip.totalDeductions || 0) / 100).toLocaleString('en-PK')}
                    </td>

                    <td className="py-3.5 px-6 text-right font-medium text-rose-600 dark:text-rose-400 font-mono tabular-nums text-xs">
                      PKR {((taxWithheld) / 100).toLocaleString('en-PK')}
                    </td>

                    <td className="py-3.5 px-6 text-right font-bold text-emerald-700 dark:text-emerald-400 font-mono tabular-nums text-xs">
                      PKR {((slip.netPay || 0) / 100).toLocaleString('en-PK')}
                    </td>

                    <td className="py-3.5 px-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* Adjust Line-Item Button */}
                        {!isLocked && (isSuperAdmin || can('payroll.manage')) && (
                          <button
                            type="button"
                            onClick={() => setSelectedPayslipForAdjustment(slip)}
                            className="h-8 px-2.5 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-[#15231C] hover:bg-slate-200 dark:hover:bg-[#1A3125] border border-slate-200/60 dark:border-[#1A3125] rounded-lg transition-colors cursor-pointer"
                            title="Adjust earnings or deductions"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                            <span>Adjust</span>
                          </button>
                        )}

                        {/* View Payslip Breakdown */}
                        <button
                          type="button"
                          onClick={() => setSelectedPayslipForPreview(slip)}
                          className="h-8 px-2.5 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-200/60 dark:border-emerald-800/40 rounded-lg transition-colors cursor-pointer"
                          title="View detailed payslip advice"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Slip</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Line Item Adjustment Drawer */}
      <PayslipAdjustmentDrawer
        isOpen={Boolean(selectedPayslipForAdjustment)}
        onClose={() => setSelectedPayslipForAdjustment(null)}
        payslip={selectedPayslipForAdjustment}
        runId={id}
        onSuccess={() => {
          setSelectedPayslipForAdjustment(null);
          refetch();
        }}
      />

      {/* 6. Detailed Payslip Preview Modal */}
      <PayslipPreviewModal
        isOpen={Boolean(selectedPayslipForPreview)}
        onClose={() => setSelectedPayslipForPreview(null)}
        payslip={selectedPayslipForPreview}
        onDownloadPdf={handleDownloadPdf}
      />

      {/* 7. Corporate Bank Advice Export Modal */}
      <BankAdviceExportModal
        isOpen={isBankAdviceModalOpen}
        onClose={() => setIsBankAdviceModalOpen(false)}
        runId={id}
      />

      {/* 8. Confirm Dialog: Approve & Freeze Run */}
      <ConfirmDialog
        isOpen={isApproveDialogOpen}
        onCancel={() => setIsApproveDialogOpen(false)}
        onConfirm={handleApproveConfirm}
        title="Approve & Lock Payroll Run?"
        message={`Are you sure you want to approve the payroll run for ${monthName} ${run.year}? Once approved, payslip figures are frozen from further adjustments.`}
        confirmText={isApproving ? 'Approving...' : 'Approve & Lock'}
        isDestructive={false}
        confirmVariant="default"
        isLoading={isApproving}
      />

      {/* 9. Confirm Dialog: Mark Run as Paid */}
      <ConfirmDialog
        isOpen={isMarkPaidDialogOpen}
        onCancel={() => setIsMarkPaidDialogOpen(false)}
        onConfirm={handleMarkPaidConfirm}
        title="Disburse & Mark Payroll as Paid?"
        message={`Confirm salary disbursement for ${monthName} ${run.year}? This marks all employee payslips as paid and releases them to self-service.`}
        confirmText={isPaying ? 'Disbursing...' : 'Mark Disbursed'}
        isDestructive={false}
        confirmVariant="default"
        isLoading={isPaying}
      />

      {/* 10. Confirm Dialog: Archive Run */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onCancel={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Archive Payroll Run?"
        message={`Are you sure you want to move the payroll run for ${monthName} ${run.year} to the Archive? Its payslips will be hidden from self-service, but records remain preserved.`}
        confirmText={isDeleting ? 'Archiving...' : 'Archive Run'}
        isDestructive={true}
        confirmVariant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}

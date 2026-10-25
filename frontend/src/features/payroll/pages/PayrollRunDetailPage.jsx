/**
 * @file PayrollRunDetailPage.jsx
 * @description Detailed inspection view for a single monthly payroll run.
 * 
 * SPECIFICATION:
 * - Module: M9 Payroll (BUILD-GUIDE Section 12 · Rows 9.8 & 9.9)
 * - Layer: Feature Page (React 18 / Tailwind)
 * - Features: 4-stage release stepper, financial aggregates, payslip line-item adjustment drawer, approve & mark-paid actions.
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
  Download,
  CreditCard
} from 'lucide-react';
import {
  useGetPayrollRunByIdQuery,
  useApprovePayrollRunMutation,
  useMarkPayrollPaidMutation
} from '../payrollApi.js';
import { PayslipAdjustmentDrawer } from '../components/PayslipAdjustmentDrawer.jsx';
import { PayslipPreviewModal } from '../components/PayslipPreviewModal.jsx';
import { BankAdviceExportModal } from '../components/BankAdviceExportModal.jsx';
import { Can } from '../../../components/common/Can.jsx';
import { ScreenSkeleton } from '../../../components/common/ScreenSkeleton.jsx';

export function PayrollRunDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPayslipForAdjustment, setSelectedPayslipForAdjustment] = useState(null);
  const [selectedPayslipForPreview, setSelectedPayslipForPreview] = useState(null);
  const [isBankAdviceModalOpen, setIsBankAdviceModalOpen] = useState(false);
  const [actionError, setActionError] = useState('');
  const accessToken = useSelector((state) => state.auth?.accessToken);

  const { data, isLoading, refetch } = useGetPayrollRunByIdQuery({ id });
  const [approvePayrollRun, { isLoading: isApproving }] = useApprovePayrollRunMutation();
  const [markPayrollPaid, { isLoading: isPaying }] = useMarkPayrollPaidMutation();

  const run = data?.data?.run || data?.run || data?.data || {};
  const payslips = data?.data?.payslips || data?.payslips || [];

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthName = monthNames[(run.month || 1) - 1];

  const handleApprove = async () => {
    setActionError('');
    if (!window.confirm(`Are you sure you want to approve and lock the ${monthName} ${run.year} payroll run? This will freeze all payslips.`)) {
      return;
    }

    try {
      await approvePayrollRun(id).unwrap();
      refetch();
    } catch (err) {
      setActionError(err?.data?.message || err?.message || 'Failed to approve payroll run');
    }
  };

  const handleMarkPaid = async () => {
    setActionError('');
    if (!window.confirm(`Confirm payment disbursement for ${monthName} ${run.year}? This will mark all payslips as paid.`)) {
      return;
    }

    try {
      await markPayrollPaid({ runId: id, paymentMethod: 'bank_transfer' }).unwrap();
      refetch();
    } catch (err) {
      setActionError(err?.data?.message || err?.message || 'Failed to mark payroll as paid');
    }
  };

  const filteredPayslips = payslips.filter((slip) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const emp = slip.employeeId || {};
    const name = (emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Employee').toLowerCase();
    const code = (emp.employeeCode || emp.employeeId || '').toLowerCase();
    const dept = (emp.departmentId?.name || emp.department?.name || '').toLowerCase();
    return name.includes(term) || code.includes(term) || dept.includes(term);
  });

  const stages = [
    { key: 'draft', label: '1. Draft' },
    { key: 'review', label: '2. Review' },
    { key: 'approved', label: '3. Approved' },
    { key: 'paid', label: '4. Disbursed (Paid)' }
  ];

  const currentStageIndex = stages.findIndex((s) => s.key === run.status);

  if (isLoading) {
    return <ScreenSkeleton variant="table" title="Payroll Run Details" message="Aggregating payslips, statutory deductions & stage state..." rows={6} />;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Navigation & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/payroll/runs')}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                {monthName} {run.year} Payroll
              </h1>
              <span className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                run.status === 'paid'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  : run.status === 'approved'
                  ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
              }`}>
                {run.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Run ID: <span className="font-mono">{run._id}</span> · Created on {new Date(run.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Executive Action Buttons */}
        <div className="flex items-center gap-3">
          {actionError && (
            <span className="text-xs text-rose-600 dark:text-rose-400 font-medium mr-2">
              {actionError}
            </span>
          )}

          {/* Export Bank Advice Button */}
          <button
            onClick={() => setIsBankAdviceModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl shadow-xs transition-colors"
          >
            <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Export Bank Advice
          </button>

          {/* Super Admin Approve Button */}
          {(run.status === 'draft' || run.status === 'review') && (
            <Can I="payroll.approve" a="Payroll">
              <button
                onClick={handleApprove}
                disabled={isApproving}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-xl shadow-sm transition-colors"
              >
                <FileCheck2 className="w-4 h-4" />
                {isApproving ? 'Approving...' : 'Approve & Freeze Run'}
              </button>
            </Can>
          )}

          {/* Mark as Paid Button */}
          {run.status === 'approved' && (
            <Can I="payroll.approve" a="Payroll">
              <button
                onClick={handleMarkPaid}
                disabled={isPaying}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-sm transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                {isPaying ? 'Marking Paid...' : 'Mark Disbursed (Paid)'}
              </button>
            </Can>
          )}
        </div>
      </div>

      {/* 4-Stage Lifecycle Stepper */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {stages.map((stage, idx) => {
            const isCompleted = idx < currentStageIndex;
            const isCurrent = idx === currentStageIndex;

            return (
              <React.Fragment key={stage.key}>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs transition-colors shrink-0 ${
                      isCompleted
                        ? 'bg-emerald-500 text-white'
                        : isCurrent
                        ? 'bg-indigo-600 text-white ring-4 ring-indigo-500/20'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                  </div>
                  <div>
                    <p className={`text-xs font-bold uppercase tracking-wider ${
                      isCurrent
                        ? 'text-indigo-600 dark:text-indigo-400'
                        : isCompleted
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-400'
                    }`}>
                      {stage.label}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {stage.key === 'draft' && 'Initial Generation'}
                      {stage.key === 'review' && 'Audit & Adjustments'}
                      {stage.key === 'approved' && 'Locked by Super Admin'}
                      {stage.key === 'paid' && 'Direct Bank Transfer'}
                    </p>
                  </div>
                </div>

                {idx < stages.length - 1 && (
                  <div className="hidden sm:block flex-1 h-0.5 bg-slate-200 dark:bg-slate-800 mx-2" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Aggregate Financial Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Headcount</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            {run.employeeCount || payslips.length}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Gross Pay</p>
          <p className="text-lg font-bold text-slate-900 dark:text-white mt-1 font-mono">
            PKR {((run.totalGrossPay || 0) / 100).toLocaleString('en-PK')}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <p className="text-[11px] font-semibold text-rose-500 uppercase tracking-wider">FBR Tax Withheld</p>
          <p className="text-lg font-bold text-rose-600 dark:text-rose-400 mt-1 font-mono">
            PKR {((run.totalIncomeTax || 0) / 100).toLocaleString('en-PK')}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">EOBI (EE+ER)</p>
          <p className="text-lg font-bold text-slate-900 dark:text-white mt-1 font-mono">
            PKR {((run.totalEobi || 0) / 100).toLocaleString('en-PK')}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <p className="text-[11px] font-semibold text-indigo-500 uppercase tracking-wider">Overtime Pay</p>
          <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mt-1 font-mono">
            PKR {((run.totalOvertimePay || 0) / 100).toLocaleString('en-PK')}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5">
          <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Net Payable</p>
          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
            PKR {((run.totalNetPay || 0) / 100).toLocaleString('en-PK')}
          </p>
        </div>
      </div>

      {/* Filter and Payslips Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm space-y-4">
        {/* Table Top Toolbar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by employee name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="text-xs text-slate-500">
            Showing <strong className="text-slate-900 dark:text-white">{filteredPayslips.length}</strong> of {payslips.length} employees
          </div>
        </div>

        {/* Payslips Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4 text-right">Gross Pay</th>
                <th className="px-6 py-4 text-right">Overtime</th>
                <th className="px-6 py-4 text-right">Deductions</th>
                <th className="px-6 py-4 text-right">Tax (FBR)</th>
                <th className="px-6 py-4 text-right">Net Salary</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredPayslips.map((slip) => {
                const emp = slip.employeeId || {};
                const isLocked = run.status === 'approved' || run.status === 'paid';
                const empName = emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Employee';
                const empCode = emp.employeeCode || emp.employeeId || 'EMP';
                const deptName = emp.departmentId?.name || emp.department?.name || 'General';
                const initials = empName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'EM';
                const taxWithheld = slip.taxWithheld || slip.incomeTax || 0;

                return (
                  <tr
                    key={slip._id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 text-xs">
                          {initials}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {empName}
                          </div>
                          <div className="text-xs text-slate-400">
                            {empCode} · {deptName}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-right font-medium text-slate-900 dark:text-white font-mono">
                      PKR {((slip.grossPay || 0) / 100).toLocaleString('en-PK')}
                    </td>

                    <td className="px-6 py-4 text-right font-medium text-indigo-600 dark:text-indigo-400 font-mono">
                      PKR {((slip.overtimePay || 0) / 100).toLocaleString('en-PK')}
                    </td>

                    <td className="px-6 py-4 text-right font-medium text-rose-600 dark:text-rose-400 font-mono">
                      -PKR {((slip.totalDeductions || 0) / 100).toLocaleString('en-PK')}
                    </td>

                    <td className="px-6 py-4 text-right font-medium text-rose-600 dark:text-rose-400 font-mono">
                      PKR {((taxWithheld) / 100).toLocaleString('en-PK')}
                    </td>

                    <td className="px-6 py-4 text-right font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                      PKR {((slip.netPay || 0) / 100).toLocaleString('en-PK')}
                    </td>

                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* Adjust Line-Item Button */}
                        {!isLocked && (
                          <button
                            onClick={() => setSelectedPayslipForAdjustment(slip)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            title="Adjust earnings or deductions"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                            Adjust
                          </button>
                        )}

                        {/* View Payslip Breakdown */}
                        <button
                          onClick={() => setSelectedPayslipForPreview(slip)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg transition-colors"
                          title="View detailed payslip advice"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View Slip
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

      {/* Line Item Adjustment Drawer */}
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

      {/* Detailed Payslip Preview Modal */}
      <PayslipPreviewModal
        isOpen={Boolean(selectedPayslipForPreview)}
        onClose={() => setSelectedPayslipForPreview(null)}
        payslip={selectedPayslipForPreview}
        onDownloadPdf={async (slipId) => {
          try {
            const res = await fetch(`/api/v1/payslips/${slipId}/pdf`, {
              method: 'GET',
              headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
              credentials: 'include'
            });
            if (!res.ok) throw new Error('Failed to download PDF');
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Payslip_${slipId.slice(-6)}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
          } catch (e) {
            alert(e.message || 'Error downloading PDF');
          }
        }}
      />

      {/* Corporate Bank Advice Sheet Export Modal */}
      <BankAdviceExportModal
        isOpen={isBankAdviceModalOpen}
        onClose={() => setIsBankAdviceModalOpen(false)}
        runId={id}
        periodLabel={`${monthName} ${run.year}`}
      />
    </div>
  );
}

/**
 * @file MyPayslipsPage.jsx
 * @description Self-Service Payslip portal for employees to view and download monthly salary advice.
 * 
 * SPECIFICATION & CRAFT:
 * - Module: M9 Payroll (BUILD-GUIDE Section 12 · Row 9.11)
 * - Layer: Feature Page (React 18 / Tailwind)
 * - Theme: ELVARA Emerald Design System (Strict adherence to DESIGN.md & docs/UI-REFERENCE.md)
 * - Features: Header horizontal alignment, Form IT-3 Certificate PDF download, 3 KPI cards,
 *             1px hairline precision bottom data table, and itemized preview modal.
 */

import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  FileText,
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  Eye,
  ShieldCheck,
  CreditCard,
  Building2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  FileCheck2
} from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth.js';
import { useGetMyPayslipsQuery } from '../payrollApi.js';
import { PayslipPreviewModal } from '../components/PayslipPreviewModal.jsx';
import { ScreenSkeleton } from '../../../components/common/ScreenSkeleton.jsx';
import { RefreshButton } from '../../../components/common/RefreshButton.jsx';
import { toast } from 'sonner';
import { cn } from '../../../lib/utils.js';

export function MyPayslipsPage() {
  const { isSuperAdmin } = useAuth();
  const [page, setPage] = useState(1);
  const currentNow = new Date();
  // Pakistan Fiscal Year: Jul 1 to Jun 30. E.g. Nov 2026 falls into Tax Year 2027
  const defaultTaxYear = currentNow.getMonth() + 1 >= 7 ? currentNow.getFullYear() + 1 : currentNow.getFullYear();
  const [selectedYear, setSelectedYear] = useState(defaultTaxYear.toString());
  const [previewPayslip, setPreviewPayslip] = useState(null);
  const [isDownloadingCertificate, setIsDownloadingCertificate] = useState(false);
  const accessToken = useSelector((state) => state.auth?.accessToken);

  // Hook runs before the redirect below (hooks may not follow an early return); skipped for Super Admin
  const { data, isLoading, isFetching, refetch } = useGetMyPayslipsQuery(
    { page, limit: 12 },
    { skip: isSuperAdmin }
  );

  // Super Admin / Owner does not draw salary payslips; redirect to payroll dashboard
  if (isSuperAdmin) {
    return <Navigate to="/payroll" replace />;
  }

  const payslips = data?.data || [];
  const meta = data?.meta || { totalDocs: 0, totalPages: 1 };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

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

  const handleDownloadTaxCertificate = async (taxYear) => {
    try {
      setIsDownloadingCertificate(true);
      const response = await fetch(`/api/v1/payslips/annual-tax-certificate?taxYear=${taxYear}`, {
        method: 'GET',
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to generate annual tax certificate');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Form_IT3_TaxCertificate_${taxYear}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      toast.success(`Form IT-3 Certificate for Tax Year ${taxYear} downloaded successfully`);
    } catch (err) {
      toast.error(err.message || 'Error downloading tax certificate');
    } finally {
      setIsDownloadingCertificate(false);
    }
  };

  if (isLoading && !data) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <ScreenSkeleton variant="cards" />
      </div>
    );
  }

  const totalNetPaisa = payslips.reduce((sum, s) => sum + (s.netPay || 0), 0);
  const totalTaxPaisa = payslips.reduce((sum, s) => sum + (s.taxWithheld || s.incomeTax || 0), 0);
  const avgNetPaisa = payslips.length > 0 ? totalNetPaisa / payslips.length : 0;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* 1. Top Header with Perfect Axis Alignment */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-[#00C471] rounded-2xl border border-emerald-200/60 dark:border-emerald-800/40 shadow-xs">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              My Salary Slips
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Access your monthly salary disbursement advices and official tax withholding statements
            </p>
          </div>
        </div>

        {/* Right Aligned Controls Bar (All h-9) */}
        <div className="flex items-center gap-2.5">
          <RefreshButton onRefresh={refetch} isFetching={isFetching} />
          
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="h-9 px-3 bg-white dark:bg-[#15231C] border border-slate-200/80 dark:border-[#1A3125] rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 shadow-xs cursor-pointer"
          >
            <option value="2027">Tax Year 2027 (01-Jul-2026 – 30-Jun-2027)</option>
            <option value="2026">Tax Year 2026 (01-Jul-2025 – 30-Jun-2026)</option>
            <option value="2025">Tax Year 2025 (01-Jul-2024 – 30-Jun-2025)</option>
            <option value="2024">Tax Year 2024 (01-Jul-2023 – 30-Jun-2024)</option>
          </select>

          <button
            type="button"
            onClick={() => handleDownloadTaxCertificate(selectedYear)}
            disabled={isDownloadingCertificate}
            className="h-9 px-4 inline-flex items-center gap-2 bg-[#00C471] hover:bg-[#049856] text-white rounded-xl text-xs font-semibold shadow-xs shadow-emerald-600/20 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isDownloadingCertificate ? 'Generating...' : 'Form IT-3 Certificate'}</span>
          </button>
        </div>
      </div>

      {/* 2. Aggregate Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#111D17] p-5 rounded-2xl border border-slate-200/80 dark:border-[#1A3125] shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40 rounded-xl">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Net Take-Home (Recorded)
            </p>
            <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 font-mono tabular-nums mt-0.5">
              PKR {(totalNetPaisa / 100).toLocaleString('en-PK', { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111D17] p-5 rounded-2xl border border-slate-200/80 dark:border-[#1A3125] shadow-xs flex items-center gap-4">
          <div className="p-3 bg-slate-100 dark:bg-[#15231C] text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-[#1A3125] rounded-xl">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Average Monthly Salary
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums mt-0.5">
              PKR {(avgNetPaisa / 100).toLocaleString('en-PK', { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111D17] p-5 rounded-2xl border border-slate-200/80 dark:border-[#1A3125] shadow-xs flex items-center gap-4">
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/40 rounded-xl">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total FBR Tax Contributed
            </p>
            <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 font-mono tabular-nums mt-0.5">
              PKR {(totalTaxPaisa / 100).toLocaleString('en-PK', { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Bottom Data Table with Hairline Craft */}
      <div className="bg-white dark:bg-[#111D17] rounded-2xl border border-slate-200/80 dark:border-[#1A3125] overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-4">
            <ScreenSkeleton variant="table" title="Personal Salary Advice" message="Retrieving your itemized monthly payslips & tax withholding..." rows={4} />
          </div>
        ) : payslips.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-[#15231C] border border-slate-200/80 dark:border-[#1A3125] flex items-center justify-center text-slate-400">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              No Salary Slips Available
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              You do not have any released salary slips yet. Slips appear here once the monthly payroll run is marked as paid by Finance.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300 border-collapse">
              <thead className="bg-slate-50/75 dark:bg-[#0E1A14] text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200/80 dark:border-[#1A3125]">
                <tr>
                  <th className="py-3.5 px-6">Payroll Month</th>
                  <th className="py-3.5 px-6 text-right">Gross Pay</th>
                  <th className="py-3.5 px-6 text-right">Tax Withheld (FBR)</th>
                  <th className="py-3.5 px-6 text-right">Total Deductions</th>
                  <th className="py-3.5 px-6 text-right">Net Take-Home</th>
                  <th className="py-3.5 px-6 text-center">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#1A3125]">
                {payslips.map((slip) => {
                  const mName = monthNames[(slip.month || 1) - 1];
                  const isCash = !slip.paymentMethod || slip.paymentMethod === 'cash';

                  return (
                    <tr
                      key={slip._id}
                      className="hover:bg-slate-50/60 dark:hover:bg-[#15231C]/50 transition-colors"
                    >
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold text-xs font-mono">
                            {slip.month < 10 ? `0${slip.month}` : slip.month}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white">
                              {mName} {slip.year}
                            </div>
                            <div className="text-[11px] text-slate-400 dark:text-slate-500">
                              Method: {isCash ? 'Cash in Hand' : 'Direct Bank'}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-6 text-right font-medium text-slate-800 dark:text-slate-200 font-mono tabular-nums text-xs">
                        PKR {((slip.grossPay || 0) / 100).toLocaleString('en-PK')}
                      </td>

                      <td className="py-3.5 px-6 text-right font-medium text-rose-600 dark:text-rose-400 font-mono tabular-nums text-xs">
                        PKR {(((slip.taxWithheld || slip.incomeTax || 0)) / 100).toLocaleString('en-PK')}
                      </td>

                      <td className="py-3.5 px-6 text-right font-medium text-rose-600 dark:text-rose-400 font-mono tabular-nums text-xs">
                        -PKR {((slip.totalDeductions || 0) / 100).toLocaleString('en-PK')}
                      </td>

                      <td className="py-3.5 px-6 text-right font-bold text-emerald-700 dark:text-emerald-400 font-mono tabular-nums text-xs">
                        PKR {((slip.netPay || 0) / 100).toLocaleString('en-PK')}
                      </td>

                      <td className="py-3.5 px-6 text-center">
                        <span className={cn(
                          'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border',
                          slip.status === 'paid'
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                            : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                        )}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          {slip.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setPreviewPayslip(slip)}
                            className="h-8 px-2.5 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-[#15231C] hover:bg-slate-200 dark:hover:bg-[#1A3125] border border-slate-200/60 dark:border-[#1A3125] rounded-lg transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                            <span>View</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDownloadPdf(slip._id)}
                            className="h-8 px-2.5 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-200/60 dark:border-emerald-800/40 rounded-lg transition-colors cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>PDF</span>
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

      {/* 4. Slip Preview Modal */}
      <PayslipPreviewModal
        isOpen={Boolean(previewPayslip)}
        onClose={() => setPreviewPayslip(null)}
        payslip={previewPayslip}
        onDownloadPdf={handleDownloadPdf}
      />
    </div>
  );
}

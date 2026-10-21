/**
 * @file MyPayslipsPage.jsx
 * @description Self-Service Payslip portal for employees to view and download monthly salary advice.
 * 
 * SPECIFICATION:
 * - Module: M9 Payroll (BUILD-GUIDE Section 12 · Row 9.11)
 * - Layer: Feature Page (React 18 / Tailwind)
 * - Features: Paginated list, financial earnings metrics, PDF download, itemized view modal.
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
  ArrowDownRight
} from 'lucide-react';
import { useGetMyPayslipsQuery } from '../payrollApi.js';
import { PayslipPreviewModal } from '../components/PayslipPreviewModal.jsx';

export function MyPayslipsPage() {
  const [page, setPage] = useState(1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [previewPayslip, setPreviewPayslip] = useState(null);
  const accessToken = useSelector((state) => state.auth?.accessToken);

  const { data, isLoading } = useGetMyPayslipsQuery({
    page,
    limit: 12
  });

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
    } catch (err) {
      alert(err.message || 'Error downloading PDF');
    }
  };

  const handleDownloadTaxCertificate = async (taxYear) => {
    try {
      const response = await fetch(`/api/v1/payslips/annual-tax-certificate?taxYear=${taxYear}`, {
        method: 'GET',
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to generate annual tax certificate');
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
    } catch (err) {
      alert(err.message || 'Error downloading tax certificate');
    }
  };

  // Compute aggregate stats across available payslips
  const totalNetPaisa = payslips.reduce((sum, s) => sum + (s.netPay || 0), 0);
  const totalTaxPaisa = payslips.reduce((sum, s) => sum + (s.taxWithheld || s.incomeTax || 0), 0);
  const avgNetPaisa = payslips.length > 0 ? totalNetPaisa / payslips.length : 0;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                My Salary Slips
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Access your monthly salary disbursement advices and official tax withholding statements
              </p>
            </div>
          </div>
        </div>

        {/* Tax Certificate Form IT-3 Download */}
        <div className="flex items-center gap-3">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="2026">Tax Year 2026</option>
            <option value="2025">Tax Year 2025</option>
            <option value="2024">Tax Year 2024</option>
          </select>

          <button
            onClick={() => handleDownloadTaxCertificate(selectedYear)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Form IT-3 Certificate</span>
          </button>
        </div>
      </div>

      {/* Aggregate Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Net Take-Home (Recorded)
            </p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
              PKR {(totalNetPaisa / 100).toLocaleString('en-PK', { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Average Monthly Salary
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
              PKR {(avgNetPaisa / 100).toLocaleString('en-PK', { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total FBR Income Tax Contributed
            </p>
            <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 font-mono">
              PKR {(totalTaxPaisa / 100).toLocaleString('en-PK', { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>
      </div>

      {/* Payslips List Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-500">Loading your salary slips...</p>
          </div>
        ) : payslips.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              No Salary Slips Available
            </h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              You do not have any released salary slips yet. Slips appear here once the monthly payroll run is marked as paid by Finance.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4">Payroll Month</th>
                  <th className="px-6 py-4 text-right">Gross Pay</th>
                  <th className="px-6 py-4 text-right">Tax Withheld (FBR)</th>
                  <th className="px-6 py-4 text-right">Total Deductions</th>
                  <th className="px-6 py-4 text-right">Net Take-Home</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {payslips.map((slip) => {
                  const mName = monthNames[(slip.month || 1) - 1];

                  return (
                    <tr
                      key={slip._id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                            {slip.month < 10 ? `0${slip.month}` : slip.month}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white">
                              {mName} {slip.year}
                            </div>
                            <div className="text-xs text-slate-400">
                              Method: {slip.paymentMethod || 'Bank Transfer'}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-right font-medium text-slate-800 dark:text-slate-200 font-mono">
                        PKR {((slip.grossPay || 0) / 100).toLocaleString('en-PK')}
                      </td>

                      <td className="px-6 py-4 text-right font-medium text-rose-600 dark:text-rose-400 font-mono">
                        PKR {((slip.incomeTax || 0) / 100).toLocaleString('en-PK')}
                      </td>

                      <td className="px-6 py-4 text-right font-medium text-rose-600 dark:text-rose-400 font-mono">
                        -PKR {((slip.totalDeductions || 0) / 100).toLocaleString('en-PK')}
                      </td>

                      <td className="px-6 py-4 text-right font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                        PKR {((slip.netPay || 0) / 100).toLocaleString('en-PK')}
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                          {slip.status}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setPreviewPayslip(slip)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View
                          </button>

                          <button
                            onClick={() => handleDownloadPdf(slip._id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded-lg transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                            PDF
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

      {/* Slip Preview Modal */}
      <PayslipPreviewModal
        isOpen={Boolean(previewPayslip)}
        onClose={() => setPreviewPayslip(null)}
        payslip={previewPayslip}
        onDownloadPdf={handleDownloadPdf}
      />
    </div>
  );
}

/**
 * @file BankAdviceExportModal.jsx
 * @description Modal for downloading corporate bank salary disbursement sheets (.xlsx).
 * 
 * SPECIFICATION:
 * - Module: M9 Payroll (BUILD-GUIDE Section 12 · Row 9.12)
 * - Layer: Component (React 18 / Tailwind)
 * - Formats: Meezan Bank, HBL Corporate, Standard XLSX.
 */

import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  X,
  FileSpreadsheet,
  Download,
  Building2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  CreditCard
} from 'lucide-react';

export function BankAdviceExportModal({ isOpen, onClose, runId, periodLabel }) {
  const [bankFormat, setBankFormat] = useState('standard');
  const [isExporting, setIsExporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const accessToken = useSelector((state) => state.auth?.accessToken);

  if (!isOpen) return null;

  const banks = [
    {
      id: 'standard',
      name: 'Standard Multi-Bank Audit Sheet',
      desc: 'All banks, CNIC, IBAN, Gross, Tax, Deductions, and Net salary verification summary.',
      badge: 'All Banks'
    },
    {
      id: 'meezan',
      name: 'Meezan Bank Corporate Bulk Salary Format',
      desc: 'IBAN, Beneficiary Title, Net Amount, Reference & Narration matching Meezan Portal.',
      badge: 'Meezan Corporate'
    },
    {
      id: 'hbl',
      name: 'Habib Bank Limited (HBL) Corporate Format',
      desc: 'Transaction Date, Account, Branch Code, Amount, and Purpose of Payment.',
      badge: 'HBL Enterprise'
    }
  ];

  const handleDownload = async () => {
    setIsExporting(true);
    setErrorMsg('');

    try {
      const response = await fetch(`/api/v1/payroll/runs/${runId}/bank-advice?bank=${bankFormat}`, {
        method: 'GET',
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to download bank advice sheet');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `BankAdvice_${bankFormat.toUpperCase()}_${runId.slice(-6)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();

      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Error downloading file');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Export Bank Advice Sheet
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {periodLabel || 'Monthly Payroll Run'} · Direct Banking Integration
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-2.5 text-xs text-rose-600 dark:text-rose-400">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Bank Selection Radio Cards */}
        <div className="space-y-3">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Select Corporate Format:
          </label>

          {banks.map((bank) => (
            <label
              key={bank.id}
              onClick={() => setBankFormat(bank.id)}
              className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                bankFormat === bank.id
                  ? 'border-emerald-500 bg-emerald-500/5 dark:bg-emerald-950/20 ring-2 ring-emerald-500/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
              }`}
            >
              <input
                type="radio"
                name="bankFormat"
                value={bank.id}
                checked={bankFormat === bank.id}
                onChange={() => setBankFormat(bank.id)}
                className="mt-1 text-emerald-600 focus:ring-emerald-500"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {bank.name}
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                    {bank.badge}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {bank.desc}
                </p>
              </div>
            </label>
          ))}
        </div>

        {/* Security Notice */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-2.5 text-[11px] text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Includes total disbursement checksum row to prevent batch payment mismatch.</span>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={isExporting}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            {isExporting ? 'Generating Sheet...' : 'Download .XLSX Advice'}
          </button>
        </div>
      </div>
    </div>
  );
}

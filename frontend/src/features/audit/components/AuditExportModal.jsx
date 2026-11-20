/**
 * @file AuditExportModal.jsx
 * @description Enterprise Modal for Exporting Forensic Audit Logs (CSV / Excel).
 * Uses Redux authentication token, active filter summary, and Elvara theme tokens.
 */

import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { X, Download, FileSpreadsheet, ShieldAlert, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { AUDIT_BUTTON_STYLES } from '../utils/auditTheme.js';

export const AuditExportModal = ({ isOpen, onClose, filters = {} }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [format, setFormat] = useState('csv');
  const token = useSelector((state) => state.auth?.accessToken);

  if (!isOpen) return null;

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const params = new URLSearchParams();
      if (filters.module) params.append('module', filters.module);
      if (filters.action) params.append('action', filters.action);
      if (filters.status) params.append('status', filters.status);
      if (filters.category) params.append('category', filters.category);
      if (filters.severity) params.append('severity', filters.severity);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.search) params.append('search', filters.search);

      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/v1/audit-logs/export?${params.toString()}`, {
        headers,
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Export request failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-export-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Audit log export downloaded successfully');
      onClose();
    } catch (err) {
      toast.error('Failed to export audit logs. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden space-y-0">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border bg-slate-50/50 dark:bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 rounded-2xl border border-emerald-200 dark:border-emerald-500/20">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-foreground tracking-tight">
                Export Audit Records
              </h3>
              <p className="text-xs text-muted-foreground">
                Download compliance-ready forensic audit trail
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4 text-xs">
          <div className="p-3.5 bg-muted/40 border border-border rounded-2xl space-y-1">
            <span className="font-bold text-foreground block">Active Filter Scope:</span>
            <p className="text-muted-foreground leading-relaxed">
              Filtered records (Module: {filters.module || 'All'}, Category: {filters.category || 'All'}, Status: {filters.status || 'All'}, Time Window: {filters.startDate ? `${filters.startDate} to ${filters.endDate || 'now'}` : 'All time'}) will be streamed.
            </p>
          </div>

          <div className="space-y-2">
            <label className="font-semibold text-foreground">Output Format:</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormat('csv')}
                className={`p-3 border rounded-xl flex items-center justify-center gap-2 font-medium transition cursor-pointer ${
                  format === 'csv'
                    ? 'border-[#00C471] bg-emerald-50/50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold'
                    : 'border-border text-muted-foreground hover:bg-muted'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>CSV Stream</span>
              </button>
              <button
                type="button"
                onClick={() => setFormat('excel')}
                className={`p-3 border rounded-xl flex items-center justify-center gap-2 font-medium transition cursor-pointer ${
                  format === 'excel'
                    ? 'border-[#00C471] bg-emerald-50/50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold'
                    : 'border-border text-muted-foreground hover:bg-muted'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Excel Spreadsheet</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-800 dark:text-amber-300 rounded-xl text-[11px]">
            <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>This export action will be permanently recorded in the immutable audit log for compliance.</span>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 sm:p-5 border-t border-border bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-end gap-2.5 text-xs">
          <button
            type="button"
            onClick={onClose}
            className={AUDIT_BUTTON_STYLES.secondary}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isExporting}
            onClick={handleExport}
            className={AUDIT_BUTTON_STYLES.primary}
          >
            {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            <span>{isExporting ? 'Generating Export...' : 'Download Export'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

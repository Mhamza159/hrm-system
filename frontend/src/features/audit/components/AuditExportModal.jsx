/**
 * @file AuditExportModal.jsx
 * @description Enterprise Modal for Exporting Forensic Audit Logs (CSV / Excel).
 */

import React, { useState } from 'react';
import { X, Download, FileSpreadsheet, ShieldAlert, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export const AuditExportModal = ({ isOpen, onClose, filters = {} }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [format, setFormat] = useState('csv');

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

      const token = localStorage.getItem('token');
      const response = await fetch(`/api/v1/audit-logs/export?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border bg-muted/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-primary/10 text-primary rounded-xl border border-primary/20">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-foreground">
                Export Audit Records
              </h3>
              <p className="text-xs text-muted-foreground">
                Download compliance-ready audit trail
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          <div className="p-3 bg-muted/30 border border-border rounded-xl space-y-1">
            <span className="font-bold text-foreground">Export Scope:</span>
            <p className="text-muted-foreground">
              Current active filters (Module: {filters.module || 'All'}, Category: {filters.category || 'All'}, Status: {filters.status || 'All'}) will be applied. Maximum 10,000 records.
            </p>
          </div>

          <div className="space-y-2">
            <label className="font-semibold text-foreground">Output Format:</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormat('csv')}
                className={`p-3 border rounded-xl flex items-center gap-2 font-medium transition ${
                  format === 'csv'
                    ? 'border-primary bg-primary/10 text-primary font-bold'
                    : 'border-border text-muted-foreground hover:bg-muted'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>CSV Spreadsheet</span>
              </button>
              <button
                type="button"
                onClick={() => setFormat('excel')}
                className={`p-3 border rounded-xl flex items-center gap-2 font-medium transition ${
                  format === 'excel'
                    ? 'border-primary bg-primary/10 text-primary font-bold'
                    : 'border-border text-muted-foreground hover:bg-muted'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Excel Compatible</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 rounded-xl text-[11px]">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>This export action will be permanently recorded in the immutable audit log.</span>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-end gap-2 text-xs">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-border text-muted-foreground hover:text-foreground rounded-xl transition"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isExporting}
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition shadow-sm disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>{isExporting ? 'Generating Export...' : 'Download Export'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

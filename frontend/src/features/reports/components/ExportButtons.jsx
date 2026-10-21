/**
 * @file ExportButtons.jsx
 * @description Streaming Excel (.xlsx) and PDF (.pdf) export triggers using in-memory Redux tokens.
 * 
 * SPECIFICATION:
 * - Module: M7 Dashboard & Reports (BUILD-GUIDE Section 13 · Row 7.8)
 * - Layer: Component (React 18 / Tailwind)
 * - Security: Reads token from Redux memory and passes credentials: 'include'
 */

import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { FileSpreadsheet, FileText, Download } from 'lucide-react';
import { toast } from 'sonner';
import { usePermission } from '../../../hooks/usePermission.js';

export function ExportButtons({ type, from, to, departmentId, employeeId, status }) {
  const { can } = usePermission();
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const accessToken = useSelector((state) => state.auth?.accessToken);

  if (!can('report.export')) {
    return null;
  }

  const handleExport = async (format) => {
    const isExcel = format === 'xlsx';
    if (isExcel) setIsExportingExcel(true);
    else setIsExportingPdf(true);

    try {
      const params = new URLSearchParams();
      params.append('format', format);
      if (from) params.append('from', from);
      if (to) params.append('to', to);
      if (departmentId) params.append('departmentId', departmentId);
      if (employeeId) params.append('employeeId', employeeId);
      if (status) params.append('status', status);

      const url = `/api/v1/reports/${type}?${params.toString()}`;

      const headers = {};
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      const res = await fetch(url, {
        method: 'GET',
        headers,
        credentials: 'include',
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        let errorMsg = 'Failed to export report document.';
        try {
          const errData = await res.json();
          errorMsg = errData.message || errorMsg;
        } catch (_) {}
        throw new Error(errorMsg);
      }

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${type}-report_${new Date().toISOString().slice(0, 10)}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);

      toast.success(`${isExcel ? 'Excel (.xlsx)' : 'PDF'} report downloaded successfully!`);
    } catch (err) {
      if (err.name === 'AbortError') {
        toast.error('Report generation timed out. Please try filtering a smaller date range.');
      } else {
        toast.error(err.message || 'Export error occurred.');
      }
    } finally {
      if (isExcel) setIsExportingExcel(false);
      else setIsExportingPdf(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={isExportingExcel || isExportingPdf}
        onClick={() => handleExport('xlsx')}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors disabled:opacity-50"
      >
        {isExportingExcel ? (
          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <FileSpreadsheet className="w-3.5 h-3.5" />
        )}
        <span>Export Excel</span>
      </button>

      <button
        type="button"
        disabled={isExportingExcel || isExportingPdf}
        onClick={() => handleExport('pdf')}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors disabled:opacity-50"
      >
        {isExportingPdf ? (
          <div className="w-3.5 h-3.5 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
        ) : (
          <FileText className="w-3.5 h-3.5 text-rose-500" />
        )}
        <span>Export PDF</span>
      </button>
    </div>
  );
}

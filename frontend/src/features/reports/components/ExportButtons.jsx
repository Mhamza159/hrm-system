/**
 * @file ExportButtons.jsx
 * @description Streaming Excel (.xlsx) and PDF (.pdf) export triggers using in-memory Redux tokens.
 * Styled in Forest & Emerald Enterprise theme with standardized h-9 control heights.
 */

import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { usePermission } from '../../../hooks/usePermission.js';

export function ExportButtons({ type, from, to, departmentId, employeeId, status, view }) {
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
      if (view) params.append('view', view);

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
        } catch {
          // ignore parsing error
        }
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
        className="h-9 px-3 text-xs font-bold rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-[#00C471] hover:bg-[#00C471] hover:text-white transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
      >
        {isExportingExcel ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <FileSpreadsheet className="w-3.5 h-3.5" />
        )}
        <span>Export Excel</span>
      </button>

      <button
        type="button"
        disabled={isExportingExcel || isExportingPdf}
        onClick={() => handleExport('pdf')}
        className="h-9 px-3 text-xs font-bold rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#162820] transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
      >
        {isExportingPdf ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <FileText className="w-3.5 h-3.5 text-rose-500" />
        )}
        <span>Export PDF</span>
      </button>
    </div>
  );
}

export default ExportButtons;

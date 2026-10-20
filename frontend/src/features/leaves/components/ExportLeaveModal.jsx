/**
 * @file ExportLeaveModal.jsx
 * @description Export Leave Analytics & Summaries to Excel (BUILD-GUIDE Row 6.15).
 * 
 * SPECIFICATION:
 * - Module: M6 Leave & Holidays
 * - Features:
 *   1. Year / date range filter options
 *   2. Department selector for HR/Admin users
 *   3. ExcelJS-generated .xlsx streaming download
 *   4. Linear Dark Craft aesthetics (#090A0F, #0F111A, #1E2235, #5E6AD2)
 */

import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { X, FileSpreadsheet, Download, AlertCircle, Loader2 } from 'lucide-react';
import { useGetDepartmentsQuery } from '../../departments/departmentsApi.js';
import { usePermission } from '../../../hooks/usePermission.js';

export function ExportLeaveModal({ isOpen, onClose }) {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(String(currentYear));
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { can } = usePermission();
  const canFilterAllDepartments = can('leave.view', 'all') || can('manage', 'all');

  const { data: deptData } = useGetDepartmentsQuery({ limit: 100 }, { skip: !canFilterAllDepartments });
  const departments = deptData?.data || [];

  const accessToken = useSelector((state) => state.auth?.accessToken);

  if (!isOpen) return null;

  const handleExport = async (e) => {
    e.preventDefault();
    setIsExporting(true);
    setErrorMessage('');

    try {
      const query = new URLSearchParams();
      if (year) query.append('year', year);
      if (selectedDeptId) query.append('departmentId', selectedDeptId);
      if (statusFilter) query.append('status', statusFilter);

      const response = await fetch(`/api/v1/reports/leaves?${query.toString()}`, {
        method: 'GET',
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Export failed with HTTP ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Leave_Report_${year || 'All'}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      onClose();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to download leave report spreadsheet');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#0F111A] border border-[#1E2235] rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#1E2235]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Export Leave Report</h3>
              <p className="text-xs text-slate-400">Excel (.xlsx) spreadsheet download</p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#1E2235] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMessage && (
          <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2 text-xs text-rose-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleExport} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Calendar Year
            </label>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full bg-[#090A0F] border border-[#1E2235] rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-hidden focus:border-[#5E6AD2] transition-colors"
            >
              {[currentYear + 1, currentYear, currentYear - 1, currentYear - 2].map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>

          {canFilterAllDepartments && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Department (Optional)
              </label>
              <select
                value={selectedDeptId}
                onChange={(e) => setSelectedDeptId(e.target.value)}
                className="w-full bg-[#090A0F] border border-[#1E2235] rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-hidden focus:border-[#5E6AD2] transition-colors"
              >
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Status Filter (Optional)
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-[#090A0F] border border-[#1E2235] rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-hidden focus:border-[#5E6AD2] transition-colors"
            >
              <option value="">All Statuses</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#1E2235]">
            <button
              type="button"
              onClick={onClose}
              disabled={isExporting}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isExporting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold text-xs shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Download Excel
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ExportLeaveModal;

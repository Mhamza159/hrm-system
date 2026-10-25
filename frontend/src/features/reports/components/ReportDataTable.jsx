/**
 * @file ReportDataTable.jsx
 * @description Tabular data grid component for Multi-Axis Reports.
 * 
 * SPECIFICATION:
 * - Module: M7 Dashboard & Reports (BUILD-GUIDE Section 13 · Row 7.6)
 * - Layer: Component (React 18 / Tailwind)
 */

import React from 'react';
import { ChevronLeft, ChevronRight, FileSpreadsheet } from 'lucide-react';
import { ScreenSkeleton } from '../../../components/common/ScreenSkeleton.jsx';

export function ReportDataTable({
  columns = [],
  items = [],
  total = 0,
  page = 1,
  limit = 25,
  isLoading = false,
  onPageChange
}) {
  const totalPages = Math.ceil(total / limit) || 1;

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-[#111D17] rounded-2xl border border-slate-200 dark:border-[#1A3125] p-4 shadow-xs">
        <ScreenSkeleton variant="table" title="Generating Analytics Report" message="Aggregating records and compiling analytical statistics from database..." rows={6} />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-2">
        <FileSpreadsheet className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">No records found</h4>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          No records match the selected date range or department criteria. Try widening your filter parameters.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
              {columns.map((col) => (
                <th key={col.key} className="py-3 px-4 whitespace-nowrap">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-700 dark:text-slate-300">
            {items.map((row, idx) => (
              <tr
                key={row._id || idx}
                className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors"
              >
                {columns.map((col) => (
                  <td key={col.key} className="py-3 px-4 whitespace-nowrap">
                    {row[col.key] !== undefined && row[col.key] !== null ? String(row[col.key]) : '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <p>
          Showing <span className="font-semibold text-slate-900 dark:text-white">{(page - 1) * limit + 1}</span> to{' '}
          <span className="font-semibold text-slate-900 dark:text-white">
            {Math.min(page * limit, total)}
          </span>{' '}
          of <span className="font-semibold text-slate-900 dark:text-white">{total}</span> total entries
        </p>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-2 font-medium">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

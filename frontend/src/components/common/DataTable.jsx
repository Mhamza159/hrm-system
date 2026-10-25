/**
 * @file DataTable.jsx
 * @description High-Density Enterprise Data Table Component.
 * 
 * DESIGN SPECIFICATION (Matching docs/ui-reference.png & docs/UI-REFERENCE.md):
 * - Elevated white card container with rounded-2xl and 1px border #EAECF0.
 * - Clean light slate table headers, subtle row dividers, light row hover.
 * - Tabular numbers, clean pagination controls, and emerald loading states.
 */

import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Search,
  Inbox,
  Loader2
} from 'lucide-react';
import { cn } from '../../lib/utils.js';

export function DataTable({
  columns = [],
  data = [],
  isLoading = false,
  showSearch = true,
  searchPlaceholder = 'Search records...',
  searchField = null,
  emptyMessage = 'No records found',
  pagination = null,
  onRowClick = null,
  className = ''
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // 1. Client-side search filtering
  const filteredData = useMemo(() => {
    if (!searchTerm || pagination?.searchControlled) return data;
    const lower = searchTerm.toLowerCase();
    return data.filter((row) => {
      if (searchField) {
        return String(row[searchField] || '').toLowerCase().includes(lower);
      }
      return Object.values(row).some((val) =>
        String(val || '').toLowerCase().includes(lower)
      );
    });
  }, [data, searchTerm, searchField, pagination]);

  // 2. Client-side column sorting
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;
    return [...filteredData].sort((a, b) => {
      const valA = a[sortConfig.key] ?? '';
      const valB = b[sortConfig.key] ?? '';
      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  return (
    <div className={cn('w-full flex flex-col space-y-4', className)}>
      {/* Search Input Bar */}
      {showSearch && (
        <div className="flex items-center justify-between gap-4">
          <div className="relative w-full max-w-sm">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-10 pr-3.5 py-2 bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] focus:border-[#00C471] rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00C471]/20 transition-all shadow-2xs"
            />
          </div>
        </div>
      )}

      {/* Table Container Surface (Matching docs/ui-reference.png Card) */}
      <div className="w-full overflow-hidden rounded-2xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-[#1A3125] bg-slate-50/70 dark:bg-[#0E1A14] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                {columns.map((col, cIdx) => (
                  <th
                    key={col.key || col.accessor ? `${col.key || col.accessor}-${cIdx}` : `${col.label || col.header || 'col'}-${cIdx}`}
                    className={cn(
                      'py-3.5 px-4 select-none',
                      col.sortable && 'cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors',
                      col.className
                    )}
                    onClick={() => col.sortable && handleSort(col.key || col.accessor)}
                  >
                    <div className="inline-flex items-center gap-1.5">
                      <span>{col.label || col.header}</span>
                      {col.sortable && (
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#1A3125] text-slate-700 dark:text-slate-200">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, rIdx) => (
                  <tr key={`table-skeleton-${rIdx}`} className="relative overflow-hidden">
                    {columns.map((col, cIdx) => (
                      <td key={`table-skeleton-cell-${rIdx}-${cIdx}`} className="py-4 px-4">
                        <div className="flex items-center gap-2.5">
                          {cIdx === 0 && (
                            <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-[#1A3125] shrink-0 animate-pulse" />
                          )}
                          <div
                            className="h-3 bg-slate-200 dark:bg-[#1A3125] rounded-md animate-pulse"
                            style={{
                              width: cIdx === 0 ? '60%' : cIdx === columns.length - 1 ? '45%' : `${35 + ((rIdx * 19 + cIdx * 29) % 45)}%`
                            }}
                          />
                        </div>
                      </td>
                    ))}
                  </tr>
                ))
              ) : sortedData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="py-14 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Inbox className="w-8 h-8 opacity-40 text-slate-400" />
                      <p className="text-xs font-medium">{emptyMessage}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedData.map((row, idx) => (
                  <tr
                    key={row._id || row.id || idx}
                    onClick={() => onRowClick && onRowClick(row)}
                    className={cn(
                      'hover:bg-slate-50/80 dark:hover:bg-white/[0.03] transition-colors',
                      onRowClick && 'cursor-pointer'
                    )}
                  >
                    {columns.map((col, cIdx) => {
                      const cellRenderer = col.render || col.cell;
                      const fieldKey = col.key || col.accessor;
                      return (
                        <td
                          key={`${fieldKey || col.label || col.header || 'cell'}-${cIdx}`}
                          className={cn(
                            'py-3 px-4 tabular-nums',
                            col.className
                          )}
                        >
                          {cellRenderer ? cellRenderer(row) : row[fieldKey]}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Footer Controls */}
      {pagination && (
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-2 py-1">
          <div>
            Showing{' '}
            <span className="font-semibold text-slate-900 dark:text-white">
              {Math.min(
                ((pagination.page - 1) * pagination.limit) + 1,
                pagination.totalDocs || 0
              )}
            </span>{' '}
            to{' '}
            <span className="font-semibold text-slate-900 dark:text-white">
              {Math.min(pagination.page * pagination.limit, pagination.totalDocs || 0)}
            </span>{' '}
            of <span className="font-semibold text-slate-900 dark:text-white">{pagination.totalDocs || 0}</span> entries
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#13221B] hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-slate-700 dark:text-slate-200 cursor-pointer shadow-2xs"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-medium text-slate-700 dark:text-slate-200">
              {pagination.page} / {pagination.totalPages || 1}
            </span>
            <button
              disabled={pagination.page >= (pagination.totalPages || 1)}
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#13221B] hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-slate-700 dark:text-slate-200 cursor-pointer shadow-2xs"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * @file LoginHistoryFilterBar.jsx
 * @description Multi-filter control bar for the Login History & Authentication Audit page.
 * Includes debounced search, status pills, device selector, date presets, and CSV export.
 */

import React, { useState } from 'react';
import { Search, Download, RotateCcw, Calendar, Monitor, Filter, Loader2 } from 'lucide-react';
import { useSelector } from 'react-redux';

export function LoginHistoryFilterBar({
  filters,
  onFilterChange,
  onReset,
  totalRecords = 0,
  canExport = true
}) {
  const accessToken = useSelector((state) => state.auth?.accessToken);
  const [isExporting, setIsExporting] = useState(false);

  // Status pills configuration
  const statusOptions = [
    { value: 'ALL', label: 'All Statuses' },
    { value: 'SUCCESS', label: 'Success', color: 'emerald' },
    { value: 'FAILED', label: 'Failed', color: 'rose' },
    { value: 'LOCKED', label: 'Locked', color: 'amber' },
    { value: '2FA_PENDING', label: '2FA Challenged', color: 'blue' }
  ];

  // Device options
  const deviceOptions = [
    { value: 'ALL', label: 'All Devices' },
    { value: 'DESKTOP', label: 'Desktop' },
    { value: 'MOBILE', label: 'Mobile' },
    { value: 'TABLET', label: 'Tablet' }
  ];

  // Quick date presets
  const handleDatePreset = (preset) => {
    const today = new Date();
    const formatDate = (d) => d.toISOString().slice(0, 10);

    if (preset === 'ALL') {
      onFilterChange({ startDate: '', endDate: '', datePreset: 'ALL' });
    } else if (preset === 'TODAY') {
      const todayStr = formatDate(today);
      onFilterChange({ startDate: todayStr, endDate: todayStr, datePreset: 'TODAY' });
    } else if (preset === '7D') {
      const past = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      onFilterChange({ startDate: formatDate(past), endDate: formatDate(today), datePreset: '7D' });
    } else if (preset === '30D') {
      const past = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      onFilterChange({ startDate: formatDate(past), endDate: formatDate(today), datePreset: '30D' });
    } else if (preset === 'CUSTOM') {
      onFilterChange({ datePreset: 'CUSTOM' });
    }
  };

  // CSV Export handler
  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.status && filters.status !== 'ALL') params.append('status', filters.status);
      if (filters.deviceType && filters.deviceType !== 'ALL') params.append('deviceType', filters.deviceType);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const res = await fetch(`/api/v1/auth/login-history/export?${params.toString()}`, {
        credentials: 'include',
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
      });

      if (!res.ok) {
        throw new Error('Export failed');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `login-audit-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export login audit CSV:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const isFiltered = Boolean(
    filters.search ||
    (filters.status && filters.status !== 'ALL') ||
    (filters.deviceType && filters.deviceType !== 'ALL') ||
    filters.startDate ||
    filters.endDate ||
    (filters.datePreset && filters.datePreset !== 'ALL')
  );

  return (
    <div className="space-y-3.5">
      {/* Primary Toolbar Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Search input */}
        <div className="relative min-w-[240px] max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={filters.search || ''}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            placeholder="Search email, name, IP, or failure..."
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471] transition-all"
          />
        </div>

        {/* Right Actions: Device dropdown, Date presets, Export button */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Device Type Select */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-xs">
            <Monitor className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filters.deviceType || 'ALL'}
              onChange={(e) => onFilterChange({ deviceType: e.target.value })}
              className="bg-transparent text-slate-700 dark:text-slate-300 font-medium text-xs focus:outline-none cursor-pointer"
            >
              {deviceOptions.map((opt) => (
                <option key={opt.value} value={opt.value} className="dark:bg-[#111D17]">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date Presets Group */}
          <div className="inline-flex rounded-xl p-0.5 border border-slate-200 dark:border-[#1A3125] bg-slate-50 dark:bg-[#0E1712]">
            {[
              { id: 'ALL', label: 'All Time' },
              { id: 'TODAY', label: 'Today' },
              { id: '7D', label: '7 Days' },
              { id: '30D', label: '30 Days' },
              { id: 'CUSTOM', label: 'Custom' }
            ].map((p) => {
              const active = (filters.datePreset || 'ALL') === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleDatePreset(p.id)}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all ${
                    active
                      ? 'bg-white dark:bg-[#1A3125] text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* Export CSV button */}
          {canExport && (
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={isExporting}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-[#15241C] shadow-xs transition-all disabled:opacity-50 cursor-pointer"
              title="Download CSV audit report"
            >
              {isExporting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#00C471]" />
              ) : (
                <Download className="w-3.5 h-3.5 text-[#00C471]" />
              )}
              <span>Export CSV</span>
            </button>
          )}

          {/* Reset Filters button */}
          {isFiltered && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all cursor-pointer"
              title="Reset all filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Secondary Row: Status Pills & Custom Date Range inputs */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3" /> Status:
          </span>
          {statusOptions.map((opt) => {
            const active = (filters.status || 'ALL') === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onFilterChange({ status: opt.value })}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                  active
                    ? 'border-[#00C471] bg-emerald-50 dark:bg-emerald-950/40 text-[#00C471] shadow-xs'
                    : 'border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-[#244433]'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Custom Date Range Row (Shown when CUSTOM preset is selected) */}
        {filters.datePreset === 'CUSTOM' && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>From:</span>
              <input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => onFilterChange({ startDate: e.target.value })}
                className="px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#00C471]"
              />
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <span>To:</span>
              <input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => onFilterChange({ endDate: e.target.value })}
                className="px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#00C471]"
              />
            </div>
          </div>
        )}

        {/* Record count summary tag */}
        <div className="text-[11px] font-medium text-slate-400 dark:text-slate-500 ml-auto">
          Showing <span className="font-semibold text-slate-700 dark:text-slate-300">{totalRecords}</span> authentication events
        </div>
      </div>
    </div>
  );
}

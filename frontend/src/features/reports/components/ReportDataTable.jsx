/**
 * @file ReportDataTable.jsx
 * @description Enterprise Tabular Data Grid with Accordion Drilldown for Multi-Axis Reports.
 * 
 * SPECIFICATION:
 * - Module: M7 Dashboard & Reports (BUILD-GUIDE Section 13 · Row 7.6)
 * - Design: Forest & Emerald Craft (DESIGN.md), Hairline Precision & Tabular Numbers
 * - Features:
 *   - Clean Avatar + Employee Code Badging
 *   - Codified HRM Status Badges (Linear/Stripe aesthetic)
 *   - 1-Click Accordion Drilldown for Employee-wise Punch & Leave inspection
 *   - Monospace tabular figures for hours, rates, and timestamps
 */

import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  FileSpreadsheet,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  FileText
} from 'lucide-react';
import { ScreenSkeleton } from '../../../components/common/ScreenSkeleton.jsx';

/**
 * Renders codified status badge conforming to DESIGN.md Section 4
 */
function StatusBadge({ status }) {
  const norm = String(status || '').toUpperCase().trim();

  switch (norm) {
    case 'PRESENT':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60 uppercase tracking-wide">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Present
        </span>
      );
    case 'LATE':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/60 uppercase tracking-wide">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Late
        </span>
      );
    case 'HALF_DAY':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-800/60 uppercase tracking-wide">
          Half Day
        </span>
      );
    case 'ABSENT':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/60 uppercase tracking-wide">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          Absent
        </span>
      );
    case 'ON_LEAVE':
    case 'LEAVE':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/60 uppercase tracking-wide">
          Leave
        </span>
      );
    case 'APPROVED':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-950/40 dark:text-teal-400 dark:border-teal-800/60 uppercase tracking-wide">
          <CheckCircle2 className="w-3 h-3 text-teal-600 dark:text-teal-400" />
          Approved
        </span>
      );
    case 'PENDING':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-950/40 dark:text-violet-400 dark:border-violet-800/60 uppercase tracking-wide">
          <AlertCircle className="w-3 h-3 text-violet-600 dark:text-violet-400" />
          Pending
        </span>
      );
    case 'REJECTED':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800/60 uppercase tracking-wide">
          <XCircle className="w-3 h-3 text-red-600 dark:text-red-400" />
          Rejected
        </span>
      );
    case 'PAID':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-400 dark:border-cyan-800/60 uppercase tracking-wide">
          Paid
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
          {norm || '-'}
        </span>
      );
  }
}

/**
 * Get employee initials for avatar circle
 */
function getInitials(name) {
  if (!name) return 'EM';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function ReportDataTable({
  columns = [],
  items = [],
  total = 0,
  page = 1,
  limit = 25,
  isLoading = false,
  onPageChange,
  view = 'daily',
  reportType = 'attendance'
}) {
  const totalPages = Math.ceil(total / limit) || 1;
  const [expandedRows, setExpandedRows] = useState({});

  const toggleRow = (id) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-[#111D17] rounded-2xl border border-slate-200 dark:border-[#1A3125] p-5 shadow-xs">
        <ScreenSkeleton
          variant="table"
          title="Compiling Organizational Intelligence"
          message="Aggregating records and running multi-axis calculation engine..."
          rows={7}
        />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-20 bg-white dark:bg-[#111D17] rounded-2xl border border-slate-200 dark:border-[#1A3125] text-center space-y-3 shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-[#13221B] flex items-center justify-center mx-auto border border-slate-200/80 dark:border-[#1A3125]">
          <FileSpreadsheet className="w-6 h-6 text-slate-400 dark:text-slate-500" />
        </div>
        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          No records found for current criteria
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
          No records match the selected date range or department parameters. Try widening the filter dates or clearing department scope.
        </p>
      </div>
    );
  }

  const isEmployeeView = view === 'employee';

  return (
    <div className="bg-white dark:bg-[#111D17] rounded-2xl border border-slate-200 dark:border-[#1A3125] overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-[#1A3125] bg-slate-50/80 dark:bg-[#13221B] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold text-[11px]">
              {isEmployeeView && <th className="py-3 px-3 w-10 text-center">#</th>}
              {columns.map((col) => (
                <th key={col.key} className="py-3 px-4 whitespace-nowrap">
                  {col.header}
                </th>
              ))}
              {isEmployeeView && (
                <th className="py-3 px-4 text-right whitespace-nowrap">Drilldown</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-[#1A3125]/70 font-medium text-slate-700 dark:text-slate-300">
            {items.map((row, idx) => {
              const rowId = row._id || row.employeeId || idx;
              const isExpanded = !!expandedRows[rowId];
              const hasPunches = Array.isArray(row.punches) && row.punches.length > 0;
              const hasApplications = Array.isArray(row.applications) && row.applications.length > 0;
              const canExpand = isEmployeeView && (hasPunches || hasApplications);

              return (
                <React.Fragment key={rowId}>
                  <tr
                    onClick={canExpand ? () => toggleRow(rowId) : undefined}
                    className={`transition-colors ${
                      canExpand ? 'cursor-pointer hover:bg-slate-50/80 dark:hover:bg-[#13221B]/60' : 'hover:bg-slate-50/50 dark:hover:bg-[#13221B]/40'
                    } ${isExpanded ? 'bg-emerald-50/30 dark:bg-[#13221B]/80' : ''}`}
                  >
                    {isEmployeeView && (
                      <td className="py-3.5 px-3 text-center text-slate-400 font-mono text-[11px]">
                        {(page - 1) * limit + idx + 1}
                      </td>
                    )}

                    {columns.map((col) => {
                      const val = row[col.key];

                      // 1. Employee Name Column
                      if (col.key === 'name') {
                        return (
                          <td key={col.key} className="py-3.5 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300/60 dark:border-emerald-700/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold flex items-center justify-center shrink-0">
                                {getInitials(val)}
                              </div>
                              <div>
                                <span className="font-semibold text-slate-900 dark:text-white block leading-tight">
                                  {val || '-'}
                                </span>
                                {row.employeeCode && (
                                  <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500">
                                    {row.employeeCode}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                        );
                      }

                      // 2. Employee Code Column
                      if (col.key === 'employeeCode') {
                        return (
                          <td key={col.key} className="py-3.5 px-4 whitespace-nowrap">
                            <span className="font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-[#1A3125] px-2 py-0.5 rounded-md border border-slate-200/60 dark:border-[#1A3125]">
                              {val || '-'}
                            </span>
                          </td>
                        );
                      }

                      // 3. Status Column
                      if (col.key === 'status') {
                        return (
                          <td key={col.key} className="py-3.5 px-4 whitespace-nowrap">
                            <StatusBadge status={val} />
                          </td>
                        );
                      }

                      // 4. Rate Column (e.g. 95.5%)
                      if (col.key === 'attendanceRate') {
                        const numVal = parseFloat(val) || 0;
                        const isHigh = numVal >= 90;
                        const isMid = numVal >= 75 && numVal < 90;
                        return (
                          <td key={col.key} className="py-3.5 px-4 whitespace-nowrap">
                            <span
                              className={`font-mono tabular-nums font-bold px-2 py-0.5 rounded-md text-[11px] ${
                                isHigh
                                  ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30'
                                  : isMid
                                  ? 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30'
                                  : 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30'
                              }`}
                            >
                              {val !== undefined ? `${val}%` : '-'}
                            </span>
                          </td>
                        );
                      }

                      // 5. Work Hours, Overtime, Late Mins, Day Counts
                      if (
                        [
                          'workHours',
                          'totalWorkHours',
                          'overtimeHours',
                          'totalOvertimeHours',
                          'lateMinutes',
                          'presentDays',
                          'lateDays',
                          'halfDays',
                          'absentDays',
                          'casualDays',
                          'annualDays',
                          'sickDays',
                          'unpaidDays',
                          'totalApprovedDays',
                          'pendingRequests'
                        ].includes(col.key)
                      ) {
                        return (
                          <td key={col.key} className="py-3.5 px-4 whitespace-nowrap font-mono tabular-nums">
                            {val !== undefined && val !== null ? (
                              <span
                                className={
                                  col.key === 'absentDays' && Number(val) > 0
                                    ? 'text-rose-600 dark:text-rose-400 font-bold'
                                    : col.key === 'lateDays' && Number(val) > 0
                                    ? 'text-amber-600 dark:text-amber-400 font-semibold'
                                    : col.key.includes('Overtime') && Number(val) > 0
                                    ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                                    : 'text-slate-800 dark:text-slate-200'
                                }
                              >
                                {String(val)}
                              </span>
                            ) : (
                              '-'
                            )}
                          </td>
                        );
                      }

                      // Default Cell
                      return (
                        <td key={col.key} className="py-3.5 px-4 whitespace-nowrap">
                          {val !== undefined && val !== null ? String(val) : '-'}
                        </td>
                      );
                    })}

                    {/* Drilldown Expander Cell */}
                    {isEmployeeView && (
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {canExpand ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRow(rowId);
                            }}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border ${
                              isExpanded
                                ? 'bg-emerald-500 text-white border-emerald-600 dark:border-emerald-500 shadow-xs'
                                : 'bg-slate-100 hover:bg-slate-200 dark:bg-[#1A3125] dark:hover:bg-[#223F30] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#1A3125]'
                            }`}
                          >
                            <span>{isExpanded ? 'Hide' : 'Inspect'}</span>
                            <ChevronDown
                              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                isExpanded ? 'rotate-180' : ''
                              }`}
                            />
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 dark:text-slate-600 font-mono">
                            No logs
                          </span>
                        )}
                      </td>
                    )}
                  </tr>

                  {/* Inline Accordion Detail View */}
                  {canExpand && isExpanded && (
                    <tr className="bg-slate-50/70 dark:bg-[#0A110D] border-y border-slate-200 dark:border-[#1A3125]">
                      <td colSpan={columns.length + 2} className="p-4 sm:p-5">
                        <div className="bg-white dark:bg-[#111D17] rounded-xl border border-slate-200 dark:border-[#1A3125] p-4 shadow-xs space-y-3">
                          <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1A3125] pb-2.5">
                            <div className="flex items-center gap-2">
                              {reportType === 'attendance' ? (
                                <Clock className="w-4 h-4 text-[#00C471]" />
                              ) : (
                                <Calendar className="w-4 h-4 text-[#00C471]" />
                              )}
                              <h5 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                                {reportType === 'attendance'
                                  ? `Date-by-Date Attendance Timeline · ${row.name}`
                                  : `Leave Applications History · ${row.name}`}
                              </h5>
                            </div>
                            <span className="text-[11px] font-mono text-slate-400">
                              {hasPunches ? `${row.punches.length} punch records` : ''}
                              {hasApplications ? `${row.applications.length} applications` : ''}
                            </span>
                          </div>

                          {/* Detail Table: Attendance Punches */}
                          {reportType === 'attendance' && hasPunches && (
                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-xs">
                                <thead>
                                  <tr className="border-b border-slate-100 dark:border-[#1A3125] text-slate-400 dark:text-slate-500 text-[10px] uppercase font-semibold">
                                    <th className="py-2 px-3">Date</th>
                                    <th className="py-2 px-3">Status</th>
                                    <th className="py-2 px-3 font-mono">Check In</th>
                                    <th className="py-2 px-3 font-mono">Check Out</th>
                                    <th className="py-2 px-3 font-mono">Work Hours</th>
                                    <th className="py-2 px-3 font-mono">Overtime</th>
                                    <th className="py-2 px-3 font-mono">Late Mins</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100/80 dark:divide-[#1A3125]/50 font-medium">
                                  {row.punches.map((p, pIdx) => (
                                    <tr
                                      key={pIdx}
                                      className="hover:bg-slate-50/50 dark:hover:bg-[#13221B]/40"
                                    >
                                      <td className="py-2.5 px-3 font-mono text-slate-700 dark:text-slate-300">
                                        {p.date}
                                      </td>
                                      <td className="py-2.5 px-3">
                                        <StatusBadge status={p.status} />
                                      </td>
                                      <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400">
                                        {p.checkIn || '-'}
                                      </td>
                                      <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400">
                                        {p.checkOut || '-'}
                                      </td>
                                      <td className="py-2.5 px-3 font-mono tabular-nums text-slate-800 dark:text-slate-200">
                                        {p.workHours !== undefined ? `${p.workHours} hrs` : '-'}
                                      </td>
                                      <td className="py-2.5 px-3 font-mono tabular-nums">
                                        {p.overtimeHours > 0 ? (
                                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                                            +{p.overtimeHours} hrs
                                          </span>
                                        ) : (
                                          <span className="text-slate-400">0.0</span>
                                        )}
                                      </td>
                                      <td className="py-2.5 px-3 font-mono tabular-nums">
                                        {p.lateMinutes > 0 ? (
                                          <span className="text-amber-600 dark:text-amber-400 font-semibold">
                                            {p.lateMinutes} mins
                                          </span>
                                        ) : (
                                          <span className="text-slate-400">0</span>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}

                          {/* Detail Table: Leave Applications */}
                          {reportType === 'leave' && hasApplications && (
                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-xs">
                                <thead>
                                  <tr className="border-b border-slate-100 dark:border-[#1A3125] text-slate-400 dark:text-slate-500 text-[10px] uppercase font-semibold">
                                    <th className="py-2 px-3">Leave Type</th>
                                    <th className="py-2 px-3">Start Date</th>
                                    <th className="py-2 px-3">End Date</th>
                                    <th className="py-2 px-3 font-mono">Days</th>
                                    <th className="py-2 px-3">Reason</th>
                                    <th className="py-2 px-3">Status</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100/80 dark:divide-[#1A3125]/50 font-medium">
                                  {row.applications.map((app, aIdx) => (
                                    <tr
                                      key={aIdx}
                                      className="hover:bg-slate-50/50 dark:hover:bg-[#13221B]/40"
                                    >
                                      <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                                        {app.leaveType}
                                      </td>
                                      <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400">
                                        {app.startDate}
                                      </td>
                                      <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400">
                                        {app.endDate}
                                      </td>
                                      <td className="py-2.5 px-3 font-mono tabular-nums font-bold text-slate-800 dark:text-slate-200">
                                        {app.days} {app.days === 1 ? 'day' : 'days'}
                                      </td>
                                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                                        {app.reason || '-'}
                                      </td>
                                      <td className="py-2.5 px-3">
                                        <StatusBadge status={app.status} />
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-slate-100 dark:border-[#1A3125] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
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
            className="p-1.5 rounded-lg border border-slate-200 dark:border-[#1A3125] hover:bg-slate-100 dark:hover:bg-[#13221B] disabled:opacity-40 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-2 font-mono font-medium">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-[#1A3125] hover:bg-slate-100 dark:hover:bg-[#13221B] disabled:opacity-40 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

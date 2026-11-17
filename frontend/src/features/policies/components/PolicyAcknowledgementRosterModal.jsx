/**
 * @file PolicyAcknowledgementRosterModal.jsx
 * @description Administrative compliance roster and acknowledgement audit sheet with CSV export.
 */

import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Download,
  Search,
  Building2
} from 'lucide-react';
import { useGetPolicyAcknowledgementsQuery } from '../policyApi.js';
import { useGetDepartmentsQuery } from '../../departments/departmentsApi.js';

export const PolicyAcknowledgementRosterModal = ({ isOpen, onClose, policy }) => {
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'SIGNED' | 'PENDING'

  const { data: rosterData, isLoading } = useGetPolicyAcknowledgementsQuery(
    {
      id: policy?._id,
      departmentId: selectedDept || undefined,
      search: search || undefined
    },
    { skip: !policy?._id || !isOpen }
  );

  const { data: departmentsData } = useGetDepartmentsQuery();
  const departments = departmentsData?.data || [];

  if (!isOpen || !policy) return null;

  const activeRosterData = rosterData?.data || rosterData || {};
  const roster = Array.isArray(activeRosterData.roster) ? activeRosterData.roster : [];
  const totalRequired = activeRosterData.totalEligible ?? activeRosterData.totalRequired ?? 0;
  const totalAcknowledged = activeRosterData.signedCount ?? activeRosterData.totalAcknowledged ?? 0;
  const complianceRate =
    activeRosterData.compliancePercentage ??
    (totalRequired > 0 ? Math.round((totalAcknowledged / totalRequired) * 100) : 0);
  const deptBreakdown = Array.isArray(activeRosterData.departmentBreakdown)
    ? activeRosterData.departmentBreakdown
    : [];

  // Filter roster by local status if selected
  const filteredRoster = roster.filter((item) => {
    if (statusFilter === 'SIGNED') return item.isAcknowledged;
    if (statusFilter === 'PENDING') return !item.isAcknowledged;
    return true;
  });

  const handleExportCsv = () => {
    if (filteredRoster.length === 0) return;

    const escapeCsv = (str) => `"${String(str || '').replace(/"/g, '""')}"`;

    const headers = ['Employee Name', 'Employee Code', 'Department', 'Designation', 'Status', 'Signed At', 'Signature Text', 'IP Address'];
    const rows = filteredRoster.map((r) => [
      escapeCsv(r.name || r.employee?.name),
      escapeCsv(r.employeeCode || r.employee?.employeeId),
      escapeCsv(r.department || r.employee?.department?.name),
      escapeCsv(r.designation || r.employee?.designation?.name),
      r.isAcknowledged ? 'Signed' : 'Pending',
      r.acknowledgedAt ? new Date(r.acknowledgedAt).toLocaleString() : '',
      escapeCsv(r.signatureText),
      escapeCsv(r.ipAddress)
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${policy.policyCode || 'Policy'}_Compliance_Roster.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-4xl bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl shadow-2xl overflow-hidden flex flex-col z-10 max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-[#1A3125] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[#00C471]">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white leading-tight">
                Policy Compliance & Sign-off Roster
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#7E9E8F]">
                {policy.title} ({policy.policyCode} · v{policy.version})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Compliance KPI Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-[#0C1712] border border-slate-200 dark:border-[#1A3125]">
            <div className="sm:col-span-2 flex items-center gap-4">
              <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-200 dark:text-[#162820]"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-[#00C471]"
                    strokeDasharray={`${complianceRate}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute font-mono text-xs font-bold text-slate-900 dark:text-white">
                  {complianceRate}%
                </span>
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Workforce Compliance Rate
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-[#7E9E8F] mt-0.5">
                  {totalAcknowledged} of {totalRequired} required personnel signed
                </p>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-white dark:bg-[#111D17] border border-slate-200/80 dark:border-[#1A3125]">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                Signed
              </span>
              <span className="text-base font-bold text-emerald-600 dark:text-[#00C471] font-mono">
                {totalAcknowledged}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-white dark:bg-[#111D17] border border-slate-200/80 dark:border-[#1A3125]">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                Pending Signature
              </span>
              <span className="text-base font-bold text-amber-500 font-mono">
                {Math.max(0, totalRequired - totalAcknowledged)}
              </span>
            </div>
          </div>

          {/* Department Breakdown Snippet */}
          {deptBreakdown.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Department Completion</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {deptBreakdown.map((d) => (
                  <div
                    key={d.departmentName}
                    className="p-2.5 rounded-lg border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {d.departmentName}
                      </span>
                      <span className="font-mono text-[11px] text-slate-500">
                        {d.rate}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-[#162820] rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-[#00C471] h-1.5 rounded-full"
                        style={{ width: `${d.rate}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filter Toolbar */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-1 min-w-[280px]">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter roster by employee name or code..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-9 pl-8 pr-3 rounded-lg bg-white dark:bg-[#0C1712] border border-slate-200 dark:border-[#1A3125] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#00C471]"
                />
              </div>

              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="h-9 px-2.5 rounded-lg bg-white dark:bg-[#0C1712] border border-slate-200 dark:border-[#1A3125] text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#00C471]"
              >
                <option value="">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept._id} value={dept._id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              {/* Status Segment */}
              <div className="inline-flex rounded-lg border border-slate-200 dark:border-[#1A3125] p-0.5 bg-slate-50 dark:bg-[#0C1712] text-xs">
                {['ALL', 'SIGNED', 'PENDING'].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatusFilter(s)}
                    className={`px-2.5 py-1 rounded-md font-semibold transition ${
                      statusFilter === s
                        ? 'bg-white dark:bg-[#162820] text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:text-[#7E9E8F]'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleExportCsv}
                disabled={filteredRoster.length === 0}
                className="h-9 px-3 rounded-lg border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#162820] text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5 text-emerald-500" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Roster Table */}
          <div className="border border-slate-200 dark:border-[#1A3125] rounded-xl overflow-hidden bg-white dark:bg-[#111D17]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-[#1A3125] bg-slate-50/70 dark:bg-[#0C1712]/50 text-slate-500 dark:text-[#7E9E8F] uppercase font-semibold text-[10px] tracking-wider">
                    <th className="py-3 px-3.5">Employee</th>
                    <th className="py-3 px-3">Department</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Signed At</th>
                    <th className="py-3 px-3">Signature Text</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#1A3125]">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-xs text-slate-400">
                        Loading compliance roster...
                      </td>
                    </tr>
                  ) : filteredRoster.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-xs text-slate-400">
                        No employees found matching filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredRoster.map((r, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-slate-50/60 dark:hover:bg-[#162820]/30 transition"
                      >
                        <td className="py-2.5 px-3.5">
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block">
                              {r.employee?.name || 'Unnamed Employee'}
                            </span>
                            <span className="font-mono text-[10px] text-slate-400">
                              {r.employee?.employeeId || 'ID N/A'}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                          {r.employee?.department?.name || 'N/A'}
                        </td>
                        <td className="py-2.5 px-3">
                          {r.isAcknowledged ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-[#00C471] border border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Signed</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/30">
                              <Clock className="w-3 h-3" />
                              <span>Pending</span>
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 dark:text-[#7E9E8F] text-[11px]">
                          {r.acknowledgedAt ? new Date(r.acknowledgedAt).toLocaleString() : '—'}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-700 dark:text-slate-300 text-[11px]">
                          {r.signatureText || '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-[#1A3125] flex justify-end bg-slate-50/50 dark:bg-[#0C1712]/50">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 rounded-lg border border-slate-200 dark:border-[#1A3125] text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#162820] transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PolicyAcknowledgementRosterModal;

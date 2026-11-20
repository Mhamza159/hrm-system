/**
 * @file DepartmentDetailModal.jsx
 * @description Comprehensive unit inspection modal displaying department hierarchy, leadership spotlight, and staff roster.
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Building2,
  Network,
  Users,
  Clock,
  FileText,
  Briefcase,
  Search,
  UserCheck,
  AlertCircle
} from 'lucide-react';
import { StatusBadge } from '../../../components/common/StatusBadge.jsx';
import { useGetDepartmentByIdQuery } from '../departmentsApi.js';

export function DepartmentDetailModal({ isOpen, onClose, departmentId, initialData = null }) {
  const [employeeSearch, setEmployeeSearch] = useState('');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      setEmployeeSearch('');
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const { data: response, isLoading } = useGetDepartmentByIdQuery(departmentId, {
    skip: !isOpen || !departmentId
  });

  if (!isOpen) return null;

  const department = response?.data || initialData;
  const employees = department?.employees || [];

  const filteredEmployees = employees.filter((emp) => {
    if (!employeeSearch.trim()) return true;
    const term = employeeSearch.trim().toLowerCase();
    return (
      emp.name?.toLowerCase().includes(term) ||
      emp.email?.toLowerCase().includes(term) ||
      emp.employeeCode?.toLowerCase().includes(term) ||
      emp.designation?.toLowerCase().includes(term)
    );
  });

  const formatTime = (ts) => {
    if (!ts) return '—';
    try {
      const d = new Date(ts);
      if (isNaN(d.getTime())) return '—';
      return d.toLocaleString('en-GB', {
        timeZone: 'Asia/Karachi',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return String(ts);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/15 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-[#1A3125] flex items-center justify-between bg-slate-50/50 dark:bg-[#0E1712]/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-[#00C471]">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {department?.name || 'Department Details'}
                </h3>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium tracking-wide bg-slate-100 dark:bg-[#1A3125] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#234232]">
                  {department?.code}
                </span>
                <StatusBadge
                  status={department?.isArchived ? 'archived' : department?.isActive ? 'active' : 'inactive'}
                  label={department?.isArchived ? 'Archived' : department?.isActive ? 'Active' : 'Inactive'}
                />
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                Corporate Organizational Unit • {department?.headcount || employees.length} Members
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1A3125] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {isLoading && !department ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-16 rounded-xl bg-slate-100 dark:bg-[#15241C]" />
              <div className="h-24 rounded-xl bg-slate-100 dark:bg-[#15241C]" />
            </div>
          ) : (
            <>
              {/* Section A: Description & Directorate Hierarchy */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#0E1712]/30 space-y-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#1A3125]/80">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                    <FileText className="w-3 h-3" />
                    <span>Operational Scope</span>
                  </span>
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Network className="w-3 h-3 text-[#00C471]" />
                    <span>
                      {department?.parentId?.name
                        ? `${department.parentId.name} (${department.parentId.code})`
                        : 'Top-Level Corporate Division'}
                    </span>
                  </span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  {department?.description || 'No detailed operational description provided for this organizational unit.'}
                </p>
              </div>

              {/* Section B: Leadership Spotlight Card */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#0E1712]/30 space-y-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                  <UserCheck className="w-3 h-3 text-[#00C471]" />
                  <span>Appointed Leadership (Department Head)</span>
                </span>

                {department?.headDetails || department?.headName ? (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125]">
                    <div className="flex items-center gap-3">
                      {department?.headDetails?.avatar ? (
                        <img
                          src={department.headDetails.avatar}
                          alt={department.headName}
                          className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-[#00C471] dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
                          {department?.headName?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 dark:text-white text-xs">
                            {department?.headName}
                          </span>
                          {department?.headDetails?.employeeCode && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-medium tracking-wide bg-slate-100 dark:bg-[#1A3125] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#234232]">
                              {department.headDetails.employeeCode}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Briefcase className="w-2.5 h-2.5" />
                            <span>{department?.headDetails?.designation || 'Director'}</span>
                          </span>
                          {department?.headDetails?.email && (
                            <>
                              <span>•</span>
                              <span>{department.headDetails.email}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-[#00C471] border border-emerald-200/50 dark:border-emerald-800/40">
                      Appointed
                    </span>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl border border-dashed border-slate-200 dark:border-[#1A3125] text-center text-slate-400 flex items-center justify-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    <span>No Department Head currently assigned to this unit.</span>
                  </div>
                )}
              </div>

              {/* Section C: Assigned Staff Roster Sub-Table */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#0E1712]/30 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#1A3125]/80">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                      <Users className="w-3 h-3" />
                      <span>Assigned Staff Roster</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 dark:bg-emerald-950/40 text-[#00C471] border border-emerald-200/50 dark:border-emerald-800/40">
                      {employees.length} Members
                    </span>
                  </div>

                  {employees.length > 3 && (
                    <div className="relative w-44">
                      <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={employeeSearch}
                        onChange={(e) => setEmployeeSearch(e.target.value)}
                        placeholder="Filter roster..."
                        className="w-full pl-7 pr-2.5 py-1 text-[11px] rounded-lg bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#00C471]"
                      />
                    </div>
                  )}
                </div>

                {filteredEmployees.length > 0 ? (
                  <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-100 dark:border-[#1A3125] bg-white dark:bg-[#111D17] divide-y divide-slate-100 dark:divide-[#15241C]">
                    {filteredEmployees.map((emp) => (
                      <div key={emp._id} className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-50/50 dark:hover:bg-[#15241C]/50 transition-colors">
                        <div className="flex items-center gap-2.5">
                          {emp.avatar ? (
                            <img
                              src={emp.avatar}
                              alt={emp.name}
                              className="w-6 h-6 rounded-full object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold text-[10px] shrink-0">
                              {emp.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {emp.name}
                              </span>
                              <span className="px-1 py-0.2 rounded text-[9px] font-mono text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-[#1A3125] border border-slate-200 dark:border-[#234232]">
                                {emp.employeeCode}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 block">
                              {emp.designation} • {emp.email}
                            </span>
                          </div>
                        </div>

                        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-slate-100 dark:bg-[#1A3125] text-slate-600 dark:text-slate-300">
                          {emp.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center text-slate-400 text-xs">
                    {employeeSearch ? 'No staff member matches search filter.' : 'Zero staff members currently assigned to this department.'}
                  </div>
                )}
              </div>

              {/* Section D: Archival Status Details if Archived */}
              {department?.isArchived && (
                <div className="p-3.5 rounded-xl border border-amber-300 dark:border-amber-900/60 bg-amber-500/10 text-amber-800 dark:text-amber-200 flex items-start gap-3">
                  <Clock className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-bold text-xs">Archived Unit Information</p>
                    <p className="mt-0.5 text-[11px] text-amber-700 dark:text-amber-300">
                      Archived on {formatTime(department.archivedAt)} by {department.archivedByName || 'Administrator'}. This department cannot receive new employee assignments while in cold storage.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#0E1712]/50 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Registered: {formatTime(department?.createdAt)}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#15241C] transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

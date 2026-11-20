/**
 * @file DesignationDetailModal.jsx
 * @description Deep inspection modal displaying corporate job title profile, department context,
 * grade tier seniority, archival notice, and assigned staff roster with in-modal search.
 * Styled in the Forest & Emerald Enterprise theme (#061A14, #111D17, #1A3125, #00C471).
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Award,
  Building2,
  Users,
  Search,
  FileText,
  Clock,
  Archive,
  Layers,
  Inbox
} from 'lucide-react';
import { StatusBadge } from '../../../components/common/StatusBadge.jsx';
import { useGetDesignationByIdQuery } from '../departmentsApi.js';

const GRADE_STYLES = {
  Junior: {
    badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    desc: 'Junior / Entry-level specialist'
  },
  Mid: {
    badge: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200/60 dark:border-blue-800/60',
    desc: 'Mid-Level / Independent professional'
  },
  Senior: {
    badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-[#00C471] border-emerald-200/60 dark:border-emerald-800/60',
    desc: 'Senior / Experienced contributor'
  },
  Lead: {
    badge: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 border-purple-200/60 dark:border-purple-800/60',
    desc: 'Lead / Technical & operational leadership'
  },
  Executive: {
    badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200/60 dark:border-amber-800/60',
    desc: 'Executive / Strategic departmental director'
  }
};

export function DesignationDetailModal({
  isOpen = false,
  onClose = () => {},
  designationId = null,
  initialData = null
}) {
  const [employeeSearch, setEmployeeSearch] = useState('');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const { data: response, isLoading } = useGetDesignationByIdQuery(designationId, {
    skip: !isOpen || !designationId
  });

  if (!isOpen) return null;

  const designation = response?.data || initialData;
  const employees = designation?.employees || [];
  const gradeStyle = GRADE_STYLES[designation?.grade] || GRADE_STYLES.Junior;

  const filteredEmployees = employees.filter((emp) => {
    if (!employeeSearch.trim()) return true;
    const term = employeeSearch.trim().toLowerCase();
    return (
      emp.name?.toLowerCase().includes(term) ||
      emp.email?.toLowerCase().includes(term) ||
      emp.employeeCode?.toLowerCase().includes(term)
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-[#1A3125] flex items-center justify-between bg-slate-50/50 dark:bg-[#0E1712]/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-[#00C471]">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {designation?.title || 'Designation Details'}
                </h3>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium tracking-wide bg-slate-100 dark:bg-[#1A3125] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#234232]">
                  {designation?.code}
                </span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${gradeStyle.badge}`}>
                  {designation?.grade}
                </span>
                <StatusBadge
                  status={designation?.isArchived ? 'archived' : designation?.isActive ? 'active' : 'inactive'}
                  label={designation?.isArchived ? 'Archived' : designation?.isActive ? 'Active' : 'Inactive'}
                  size="sm"
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {designation?.departmentId?.name || 'Department'} • {employees.length} Staff Assigned
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1A3125] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Section A: Archival Status Notice */}
          {designation?.isArchived && (
            <div className="rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50/70 dark:bg-amber-950/30 p-3.5 flex items-start gap-3">
              <Archive className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 dark:text-amber-300">
                <div className="font-semibold">Archived Job Designation</div>
                <div className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
                  Archived on {formatTime(designation.archivedAt)} by{' '}
                  <span className="font-medium font-mono">
                    {designation.archivedByName || designation.archivedBy?.name || 'Administrator'}
                  </span>
                  . This role is in cold storage; existing employee historical records are preserved, but no new employees can be assigned.
                </div>
              </div>
            </div>
          )}

          {/* Section B: Operational Profile & Department Context */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-100 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#0E1712] p-3 space-y-1">
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                Associated Department
              </div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                {designation?.departmentId?.name || 'Unassigned'}
              </div>
              <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                Code: {designation?.departmentId?.code || '—'}
              </div>
            </div>

            <div className="rounded-xl border border-slate-100 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#0E1712] p-3 space-y-1">
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                Grade Tier & Seniority
              </div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                {designation?.grade} Tier
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {gradeStyle.desc}
              </div>
            </div>
          </div>

          {/* Job Description Block */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Role Description & Key Responsibilities
            </div>
            <div className="rounded-xl border border-slate-100 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#0E1712] p-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {designation?.description || 'No formal description has been authored for this corporate job designation.'}
            </div>
          </div>

          {/* Section C: Assigned Staff Roster */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#00C471]" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Assigned Staff Members
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/10 text-[#00C471]">
                  {employees.length}
                </span>
              </div>

              {/* In-modal search */}
              {employees.length > 0 && (
                <div className="relative w-full sm:w-56">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={employeeSearch}
                    onChange={(e) => setEmployeeSearch(e.target.value)}
                    placeholder="Search staff members..."
                    className="w-full pl-8 pr-7 py-1 text-xs rounded-lg border border-slate-200 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#0E1712] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#00C471]"
                  />
                  {employeeSearch && (
                    <button
                      type="button"
                      onClick={() => setEmployeeSearch('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Staff list container */}
            <div className="rounded-xl border border-slate-100 dark:border-[#1A3125] bg-slate-50/30 dark:bg-[#0E1712] overflow-hidden max-h-56 overflow-y-auto">
              {isLoading ? (
                <div className="p-8 text-center text-xs text-slate-400">Loading staff roster...</div>
              ) : filteredEmployees.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-[#15241C] text-slate-400 flex items-center justify-center mx-auto mb-2">
                    <Inbox className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {employeeSearch ? 'No staff matching search' : 'No staff currently assigned'}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {employeeSearch
                      ? `No team members matched "${employeeSearch}".`
                      : 'This designation is currently vacant with 0 employees.'}
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-[#1A3125]">
                  {filteredEmployees.map((emp) => (
                    <div
                      key={emp._id}
                      className="p-3 flex items-center justify-between gap-3 hover:bg-slate-100/50 dark:hover:bg-[#15241C] transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Avatar */}
                        {emp.avatar ? (
                          <img
                            src={emp.avatar}
                            alt={emp.name}
                            className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-[#1A3125]"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[#00C471] font-bold text-xs flex items-center justify-center shrink-0 font-mono">
                            {emp.name?.slice(0, 2).toUpperCase() || 'EM'}
                          </div>
                        )}

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {emp.name}
                            </span>
                            <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-[#1A3125] text-slate-600 dark:text-slate-400">
                              {emp.employeeCode}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {emp.email}
                          </div>
                        </div>
                      </div>

                      <StatusBadge status={emp.status || 'Active'} size="sm" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#0E1712]/50 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
          <div className="flex items-center gap-1.5 font-mono">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Registered: {formatTime(designation?.createdAt)}</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-[#1A3125] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1A3125] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * @file DepartmentDetailModal.jsx
 * @description Comprehensive unit inspection modal displaying department hierarchy, leadership, and staff roster.
 */

import React, { useEffect } from 'react';
import {
  X,
  Building2,
  Network,
  Users,
  Clock,
  FileText
} from 'lucide-react';
import { StatusBadge } from '../../../components/common/StatusBadge.jsx';
import { useGetDepartmentByIdQuery } from '../departmentsApi.js';

export function DepartmentDetailModal({ isOpen, onClose, departmentId, initialData = null }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const { data: response, isLoading } = useGetDepartmentByIdQuery(departmentId, {
    skip: !isOpen || !departmentId
  });

  if (!isOpen) return null;

  const department = response?.data || initialData;

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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-xl rounded-2xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-[#1A3125] flex items-center justify-between bg-slate-50/50 dark:bg-[#0E1712]/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-[#00C471]">
              <Building2 className="w-4 h-4" />
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
                Corporate Organizational Unit
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
              {/* Section A: Description & Details */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#0E1712]/30 space-y-2.5">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Scope & Description</span>
                </h4>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  {department?.description || 'No detailed description provided for this organizational unit.'}
                </p>
              </div>

              {/* Section B: Hierarchy & Leadership */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#0E1712]/30 space-y-3">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                  <Network className="w-3.5 h-3.5" />
                  <span>Hierarchy & Leadership</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Parent Directorate</span>
                    <span className="font-semibold text-slate-900 dark:text-white mt-0.5 block">
                      {department?.parentId?.name ? (
                        <span className="inline-flex items-center gap-1">
                          <Network className="w-3 h-3 text-[#00C471]" />
                          <span>{department.parentId.name} ({department.parentId.code})</span>
                        </span>
                      ) : (
                        'Top-Level Independent Directorate'
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Department Head</span>
                    <span className="font-semibold text-slate-900 dark:text-white mt-0.5 block">
                      {department?.headName || 'Not Assigned'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section C: Staff Allocation & Metrics */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#0E1712]/30 space-y-3">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  <span>Staff Allocation & Metadata</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Assigned Personnel</span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-[#00C471] dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 mt-1">
                      <Users className="w-3.5 h-3.5" />
                      <span>{department?.headcount || 0} active members</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Registration Timestamp</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300 mt-1 block">
                      {formatTime(department?.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

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
        <div className="px-6 py-3 border-t border-slate-100 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#0E1712]/50 flex justify-end">
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

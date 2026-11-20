/**
 * @file OrgChartDetailDrawer.jsx
 * @description Slide-Over Enterprise Inspection Drawer for Org Chart.
 * 
 * FEATURES:
 * - High-density 480px slide-over sheet with backdrop blur.
 * - Complete reporting manager card with instant click-to-navigate.
 * - Ancestral reporting chain breadcrumbs.
 * - Direct reports roster with click-to-navigate.
 * - Permission-aware "View Full Profile" link (M3 Employee module bridge).
 * - PBAC contact coordinate masking compliance.
 */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Building,
  Briefcase,
  Mail,
  Phone,
  ExternalLink,
  Users,
  ShieldCheck,
  Crosshair,
  Sparkles,
  ChevronRight,
  UserCheck,
  ShieldAlert,
  ArrowUpRight
} from 'lucide-react';
import { usePermission } from '../../../hooks/usePermission.js';

export const OrgChartDetailDrawer = ({
  employee,
  onClose,
  onSelectEmployee,
  onCenterOnCanvas,
  onSetFocalRoot
}) => {
  const navigate = useNavigate();
  const { can } = usePermission();
  const canViewProfile = can('employee.view');

  // Close on ESC key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose && onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!employee) return null;

  const isMaskedEmail = employee.email && employee.email.includes('***');
  const isMaskedPhone = employee.phone && employee.phone.includes('***');

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 dark:bg-black/75 backdrop-blur-xs animate-in fade-in duration-200 flex justify-end">
      {/* Backdrop Dismiss Area */}
      <div className="flex-1" onClick={onClose} />

      {/* Drawer Container */}
      <div className="relative w-full max-w-md md:max-w-lg h-full bg-white dark:bg-[#111D17] border-l border-slate-200 dark:border-[#1A3125] shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#0E1712]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Staff Hierarchy Coordinates
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Identity Card */}
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-[#061A14] border border-slate-200 dark:border-[#1A3125]">
            <div className="relative shrink-0">
              {employee.avatar ? (
                <img
                  src={employee.avatar}
                  alt={employee.name}
                  className="w-16 h-16 rounded-full object-cover ring-2 ring-[#00C471] shadow-sm"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-[#00C471] text-white font-bold flex items-center justify-center text-xl shadow-sm ring-2 ring-[#00C471]/30">
                  {employee.name
                    ? employee.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .substring(0, 2)
                    : 'EM'}
                </div>
              )}
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-[#111D17] rounded-full" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                  {employee.name}
                </h3>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-200/80 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300">
                  {employee.employeeCode}
                </span>
                {employee.isMe && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-500/25 px-2 py-0.5 rounded-full">
                    You
                  </span>
                )}
              </div>

              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5 mt-1">
                <Briefcase className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{employee.designation}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                  {employee.grade}
                </span>
              </p>

              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-1">
                <Building className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                <span className="truncate">{employee.department}</span>
              </p>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => onCenterOnCanvas && onCenterOnCanvas(employee.id)}
              className="flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50 dark:bg-[#061A14] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#162820] transition-colors cursor-pointer"
            >
              <Crosshair className="w-3.5 h-3.5 text-emerald-500" />
              <span>Center on Canvas</span>
            </button>

            <button
              type="button"
              onClick={() => onSetFocalRoot && onSetFocalRoot(employee.id)}
              className="flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50 dark:bg-[#061A14] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#162820] transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              <span>Focus Hierarchy</span>
            </button>
          </div>

          {/* Reporting Line Section */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5" />
              <span>Direct Reporting Manager</span>
            </h4>

            {employee.managerName ? (
              <div
                onClick={() => employee.managerId && onSelectEmployee && onSelectEmployee({ id: employee.managerId, name: employee.managerName })}
                className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-[#061A14] border border-slate-200 dark:border-[#1A3125] hover:border-emerald-500/60 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center text-xs">
                    {employee.managerName.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-[#00C471] transition-colors">
                      {employee.managerName}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {employee.managerDesignation || 'Reporting Manager'}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 transition-colors" />
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#061A14] border border-dashed border-slate-200 dark:border-[#1A3125] text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-500" />
                <span>Executive Leadership / Top-Level Organization Root</span>
              </div>
            )}
          </div>

          {/* Direct Reports Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                <span>Direct Reports ({employee.children?.length || 0})</span>
              </h4>
              <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                Span: {employee.children?.length || 0}
              </span>
            </div>

            {employee.children && employee.children.length > 0 ? (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {employee.children.map((sub) => (
                  <div
                    key={sub.id}
                    onClick={() => onSelectEmployee && onSelectEmployee(sub)}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-[#061A14] border border-slate-200 dark:border-[#1A3125] hover:border-emerald-500/60 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-[10px] flex items-center justify-center shrink-0">
                        {sub.name ? sub.name.substring(0, 2).toUpperCase() : 'EM'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 dark:text-white truncate group-hover:text-[#00C471] transition-colors">
                          {sub.name}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                          {sub.designation}
                        </p>
                      </div>
                    </div>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-500 shrink-0 ml-2" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 dark:text-slate-500 italic p-3 rounded-xl bg-slate-50/50 dark:bg-[#061A14]/50 border border-slate-200/60 dark:border-[#1A3125]/60">
                No direct reports assigned to this role.
              </p>
            )}
          </div>

          {/* Contact Coordinates & PBAC Security */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Contact Coordinates
              </h4>
              {(isMaskedEmail || isMaskedPhone) && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800/40">
                  <ShieldAlert className="w-3 h-3" /> PBAC Masked
                </span>
              )}
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#061A14] border border-slate-200 dark:border-[#1A3125] space-y-2">
              <div className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="font-mono text-slate-800 dark:text-slate-200">
                  {employee.email || 'No email registered'}
                </span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="font-mono text-slate-800 dark:text-slate-200">
                  {employee.phone || 'No phone registered'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Drawer Footer: Profile Navigation Bridge */}
        {canViewProfile && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#0E1712]">
            <button
              type="button"
              onClick={() => navigate(`/employees?id=${employee.id}`)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-[#00C471] hover:bg-emerald-600 text-white shadow-xs transition-all cursor-pointer"
            >
              <span>Inspect Full Employee Record</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

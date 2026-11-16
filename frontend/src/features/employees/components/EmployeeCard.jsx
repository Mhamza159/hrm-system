/**
 * @file EmployeeCard.jsx
 * @description Modern, interactive employee card for Grid View browsing.
 * 
 * SPECIFICATION & BRAND ARCHETYPE:
 * - Module: M3 Employee Management / Directory Grid
 * - Theme: Forest & Emerald Enterprise Craft (#111D17 surface, #1A3125 border, #00C471 accent)
 * - PBAC: Action buttons guarded by CASL permissions.
 */

import React from 'react';
import PropTypes from 'prop-types';
import {
  Building2,
  Clock,
  UserCheck,
  Mail,
  Phone,
  Eye,
  Edit,
  Trash2,
  RotateCcw,
  KeyRound
} from 'lucide-react';
import { StatusBadge } from '../../../components/common/StatusBadge.jsx';
import { DesignationBadge } from '../../../components/common/DesignationBadge.jsx';
import { RoleBadge } from '../../../components/common/RoleBadge.jsx';
import { Can } from '../../../components/common/Can.jsx';

export function EmployeeCard({
  employee,
  onViewDetails,
  onEdit,
  onArchive,
  onRestore,
  onPermanentDelete,
  onResetPassword,
  isArchived = false,
  isSuperAdmin = false
}) {
  const isRowSuperAdmin =
    employee.employeeCode === 'EMP-000' ||
    employee.email === 'admin@hrm.company.pk' ||
    employee.email === 'mhamzaofficial159@gmail.com';

  const initials = employee.name
    ? employee.name
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'EM';

  const userRole = employee.userId?.roles?.[0];
  const desig = employee.designationId;

  return (
    <div
      onClick={() => onViewDetails(employee)}
      className="group bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] hover:border-[#00C471]/60 dark:hover:border-[#00C471]/60 rounded-2xl p-5 shadow-xs hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between gap-4"
    >
      {/* Top Header: Avatar, Name, Status */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {employee.avatar ? (
            <img
              src={employee.avatar}
              alt={employee.name}
              className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-[#1A3125] shadow-xs"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#047857] to-[#00C471] text-slate-950 font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
              {initials}
            </div>
          )}

          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-[#00C471] transition-colors">
              {employee.name}
            </h3>
            <span className="font-mono text-[11px] font-semibold text-[#00C471] bg-[#00C471]/10 px-2 py-0.5 rounded border border-[#00C471]/20 inline-block mt-0.5">
              {employee.employeeCode}
            </span>
          </div>
        </div>

        <div className="shrink-0">
          <StatusBadge status={employee.status || 'Active'} />
        </div>
      </div>

      {/* Role & Badges */}
      <div className="flex flex-wrap items-center gap-1.5">
        <DesignationBadge designation={desig} />
        {userRole && <RoleBadge role={userRole} size="sm" />}
      </div>

      {/* Organizational Metadata */}
      <div className="space-y-1.5 text-xs border-t border-b border-slate-100 dark:border-[#1A3125]/80 py-2.5">
        <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
          <span className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
            <Building2 className="w-3.5 h-3.5" /> Dept
          </span>
          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[160px]">
            {employee.departmentId?.name || 'Unassigned'}
          </span>
        </div>

        <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
          <span className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
            <Clock className="w-3.5 h-3.5" /> Shift
          </span>
          <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
            {employee.shiftId
              ? `${employee.shiftId.startTime} - ${employee.shiftId.endTime}`
              : 'General Shift'}
          </span>
        </div>

        <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
          <span className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
            <UserCheck className="w-3.5 h-3.5" /> Manager
          </span>
          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[160px]">
            {employee.managerId ? employee.managerId.name : 'Executive Line'}
          </span>
        </div>
      </div>

      {/* Contact Row */}
      <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2 truncate">
          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{employee.email || '—'}</span>
        </div>
        {employee.phone && (
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{employee.phone}</span>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="pt-2 border-t border-slate-100 dark:border-[#1A3125] flex items-center justify-between gap-1"
      >
        <button
          type="button"
          onClick={() => onViewDetails(employee)}
          className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#1A3125] hover:border-[#00C471] hover:bg-emerald-50 dark:hover:bg-[#162820] text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-[#00C471] text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5" /> Details
        </button>

        <div className="flex items-center gap-1">
          {isArchived ? (
            <Can I="employee.delete" a="Employee">
              <button
                type="button"
                onClick={() => onRestore(employee)}
                className="p-1.5 rounded-lg text-emerald-700 dark:text-[#00C471] hover:bg-emerald-50 dark:hover:bg-[#162820] border border-emerald-200 dark:border-emerald-900/60 transition-colors cursor-pointer"
                title="Restore from archive"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onPermanentDelete(employee)}
                className="p-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 transition-colors cursor-pointer"
                title="Permanently Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </Can>
          ) : (
            <>
              <Can I="employee.edit" a="Employee">
                {(!isRowSuperAdmin || isSuperAdmin) && (
                  <button
                    type="button"
                    onClick={() => onEdit(employee)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 dark:text-slate-400 dark:hover:text-[#00C471] hover:bg-emerald-50 dark:hover:bg-[#162820] transition-colors cursor-pointer"
                    title="Edit profile"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                )}
              </Can>

              <Can I="user.manage" a="User">
                {employee.userId && (!isRowSuperAdmin || isSuperAdmin) && (
                  <button
                    type="button"
                    onClick={() => onResetPassword(employee)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors cursor-pointer"
                    title="Reset Password"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                  </button>
                )}
              </Can>

              <Can I="employee.delete" a="Employee">
                {!isRowSuperAdmin && (
                  <button
                    type="button"
                    onClick={() => onArchive(employee._id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                    title="Archive employee"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </Can>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

EmployeeCard.propTypes = {
  employee: PropTypes.object.isRequired,
  onViewDetails: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onArchive: PropTypes.func.isRequired,
  onRestore: PropTypes.func.isRequired,
  onPermanentDelete: PropTypes.func.isRequired,
  onResetPassword: PropTypes.func.isRequired,
  isArchived: PropTypes.bool,
  isSuperAdmin: PropTypes.bool
};

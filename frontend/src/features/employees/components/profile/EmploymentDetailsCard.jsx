/**
 * @file EmploymentDetailsCard.jsx
 * @description Card presenting organizational structure, job metadata, and shift timings.
 * 
 * SPECIFICATION & ROLE CONTEXT:
 * - Module: M3 Employee Management / Organizational Assignment
 * - Super Admin: Displays executive platform governance and enterprise scope.
 * - HR / Manager / Employee: Displays department, designation, manager line, and shift schedules.
 */

import React from 'react';
import {
  Building2,
  Briefcase,
  UserCheck,
  Calendar,
  Clock,
  Layers,
  Crown
} from 'lucide-react';
import { Card } from '../../../../components/common/Card.jsx';
import { formatDate } from '../../../../lib/formatters.js';

export function EmploymentDetailsCard({
  employee,
  isSuperAdminRole,
  isHRRole,
  isDeptManagerRole
}) {
  return (
    <Card className="p-5 border-slate-200 dark:border-[#1A3125] dark:bg-[#111D17] space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1A3125] pb-3">
        <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xs">
          <Building2 className="w-4 h-4 text-[#00C471]" />
          <span>Organizational & Employment Assignment</span>
        </div>
        <span className="text-[10px] font-bold text-emerald-700 dark:text-[#00C471] bg-emerald-50 dark:bg-[#162820] px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-900/60">
          {isSuperAdminRole
            ? 'Root Authority'
            : isHRRole
            ? 'Enterprise HR'
            : isDeptManagerRole
            ? 'Leadership Scope'
            : 'Active Assignment'}
        </span>
      </div>

      {/* Super Admin Executive Scope */}
      {isSuperAdminRole ? (
        <div className="space-y-2.5 text-xs divide-y divide-slate-100 dark:divide-[#1A3125]/60">
          <div className="flex justify-between items-center py-1">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5 text-amber-500" /> Platform Role
            </span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              Chief Executive Officer & Platform Owner
            </span>
          </div>

          <div className="flex justify-between items-center pt-2">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" /> Organization
            </span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              ELVARA HRM Enterprise
            </span>
          </div>

          <div className="flex justify-between items-center pt-2">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-400" /> Governance Level
            </span>
            <span className="font-semibold text-[#00C471] font-mono">
              Global Platform Administrator
            </span>
          </div>

          <div className="flex justify-between items-center pt-2">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-slate-400" /> Supervisory Scope
            </span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              All Departments, Workforce & Configuration
            </span>
          </div>

          <div className="flex justify-between items-center pt-2">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" /> Platform Registration
            </span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {employee?.joiningDate ? formatDate(employee.joiningDate) : 'Foundation'}
            </span>
          </div>
        </div>
      ) : (
        /* Workforce & Departmental Scope */
        <div className="space-y-2.5 text-xs divide-y divide-slate-100 dark:divide-[#1A3125]/60">
          <div className="flex justify-between items-center py-1">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" /> Department
            </span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {employee?.departmentId?.name || 'Unassigned'}
            </span>
          </div>

          <div className="flex justify-between items-center pt-2">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-slate-400" /> Designation
            </span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {employee?.designationId?.title || 'Unassigned'}
            </span>
          </div>

          <div className="flex justify-between items-center pt-2">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-slate-400" /> Reporting Manager
            </span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {employee?.managerId
                ? `${employee.managerId.name} (${employee.managerId.employeeCode})`
                : 'Executive Management'}
            </span>
          </div>

          <div className="flex justify-between items-center pt-2">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-400" /> Employment Type
            </span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {employee?.employmentType || 'Permanent'}
            </span>
          </div>

          <div className="flex justify-between items-center pt-2">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" /> Date of Joining
            </span>
            <span className="font-semibold text-slate-900 dark:text-slate-100 font-mono">
              {employee?.joiningDate ? formatDate(employee.joiningDate) : '—'}
            </span>
          </div>

          {/* Assigned Shift & Work Timings */}
          <div className="flex justify-between items-center pt-2">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" /> Assigned Shift
            </span>
            <div className="text-right">
              <span className="font-semibold text-slate-900 dark:text-slate-100 block">
                {employee?.shiftId?.name || 'General Shift'}
              </span>
              <span className="text-[11px] font-mono text-[#00C471] block">
                {employee?.shiftId?.startTime && employee?.shiftId?.endTime
                  ? `${employee.shiftId.startTime} - ${employee.shiftId.endTime}`
                  : '09:00 - 18:00'}
                {employee?.shiftId?.graceMinutes
                  ? ` (${employee.shiftId.graceMinutes}m grace)`
                  : ''}
              </span>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

/**
 * @file TeamMemberCard.jsx
 * @description Direct Subordinate Member Card for Manager "My Team" View.
 * 
 * SPECIFICATION & CAPABILITIES (BUILD-GUIDE ID 4.6):
 * - Displays team member avatar, name, employeeCode, designation, and grade badge.
 * - Displays active shift capsule with hours and cross-midnight night shift moon indicator.
 * - Provides quick contact links (mail and phone).
 * - Zero TypeScript, plain JSX, dark craft design system.
 */

import React from 'react';
import {
  Mail,
  Phone,
  Clock,
  Moon,
  Sun,
  Building,
  Briefcase,
  Calendar,
  Sparkles
} from 'lucide-react';
import { StatusBadge } from '../../../components/common/StatusBadge.jsx';

export const TeamMemberCard = ({ member }) => {
  if (!member) return null;

  const gradeStyles = {
    Executive: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-300/80 dark:border-amber-500/30',
    Lead: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-300/80 dark:border-purple-500/30',
    Senior: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-300/80 dark:border-blue-500/30',
    Mid: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-300/80 dark:border-emerald-500/30',
    Junior: 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-300/80 dark:border-slate-700'
  };

  const formattedDate = member.joiningDate
    ? new Date(member.joiningDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    : null;

  return (
    <div className="group relative rounded-2xl p-5 bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] hover:border-emerald-500/40 dark:hover:border-emerald-500/40 hover:shadow-md transition-all duration-200 shadow-xs flex flex-col justify-between">
      <div>
        {/* Top Header: Code, Grade Badge, Status */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-xs font-mono font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-[#0A110D] border border-slate-200 dark:border-[#1A3125] px-2 py-0.5 rounded-md">
            {member.employeeCode}
          </span>
          <div className="flex items-center gap-1.5">
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                gradeStyles[member.grade] || gradeStyles.Mid
              }`}
            >
              {member.grade}
            </span>
            <StatusBadge status={member.status || 'Active'} />
          </div>
        </div>

        {/* Member Profile info */}
        <div className="flex items-start gap-3.5 mt-2">
          {member.avatar ? (
            <img
              src={member.avatar}
              alt={member.name}
              className="w-12 h-12 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0 shadow-xs group-hover:border-emerald-500/50 transition-colors"
            />
          ) : (
            <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shrink-0 shadow-xs group-hover:border-emerald-500/40 transition-colors">
              {member.name
                ? member.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase()
                : 'TM'}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-[#00C471] transition-colors">
              {member.name}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 truncate flex items-center gap-1.5 mt-0.5">
              <Briefcase className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
              {member.designation || 'Team Member'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate flex items-center gap-1.5 mt-0.5">
              <Building className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
              {member.department || 'General'}
            </p>
          </div>
        </div>

        {/* Shift Capsule */}
        <div className="mt-4 p-2.5 rounded-xl bg-slate-50 dark:bg-[#0A110D] border border-slate-200/80 dark:border-[#1A3125]">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium">
              <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              Shift:
            </span>
            <div className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200">
              {member.shift ? (
                <>
                  {member.shift.isCrossMidnight ? (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 px-2 py-0.5 rounded-md border border-purple-200 dark:border-purple-800/50">
                      <Moon className="w-3 h-3 text-purple-600 dark:text-purple-400" /> Night
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800/50">
                      <Sun className="w-3 h-3 text-amber-600 dark:text-amber-400" /> Day
                    </span>
                  )}
                  <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {member.shift.startTime} – {member.shift.endTime}
                  </span>
                </>
              ) : (
                <span className="text-slate-400 dark:text-slate-500 italic text-[11px]">Unassigned</span>
              )}
            </div>
          </div>
        </div>

        {/* Joined Date */}
        {formattedDate && (
          <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            <Calendar className="w-3 h-3 text-slate-400 dark:text-slate-500 shrink-0" />
            <span>Joined {formattedDate}</span>
          </div>
        )}
      </div>

      {/* Quick Contact Footer */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#1A3125] flex items-center justify-between gap-2">
        {member.email ? (
          <a
            href={`mailto:${member.email}`}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-[#00C471] dark:hover:text-[#00C471] bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl transition-colors truncate"
            title={member.email}
          >
            <Mail className="w-3.5 h-3.5 shrink-0 text-slate-400 dark:text-slate-400" />
            <span className="truncate">{member.email}</span>
          </a>
        ) : (
          <span className="text-xs text-slate-400 italic">No email</span>
        )}

        {member.phone && (
          <a
            href={`tel:${member.phone}`}
            className="p-2 text-slate-600 dark:text-slate-400 hover:text-[#00C471] dark:hover:text-[#00C471] bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl transition-colors"
            title={member.phone}
          >
            <Phone className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </div>
  );
};

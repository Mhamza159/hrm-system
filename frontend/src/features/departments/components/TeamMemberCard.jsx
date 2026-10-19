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
    Executive: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    Lead: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    Senior: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    Mid: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    Junior: 'bg-slate-500/10 text-slate-400 border-slate-500/20'
  };

  const formattedDate = member.joiningDate
    ? new Date(member.joiningDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    : null;

  return (
    <div className="group relative rounded-xl p-5 bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 hover:bg-slate-900 transition-all duration-200 shadow-md flex flex-col justify-between">
      <div>
        {/* Top Header: Code, Grade Badge, Status */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-xs font-mono font-medium text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
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
              className="w-12 h-12 rounded-full object-cover border border-slate-700 shrink-0 shadow-inner group-hover:border-emerald-500/50 transition-colors"
            />
          ) : (
            <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm bg-gradient-to-br from-slate-700 to-slate-800 text-slate-200 border border-slate-700 shrink-0 shadow-inner group-hover:border-emerald-500/40 transition-colors">
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
            <h4 className="text-sm font-semibold text-slate-100 truncate group-hover:text-emerald-400 transition-colors">
              {member.name}
            </h4>
            <p className="text-xs text-slate-400 truncate flex items-center gap-1.5 mt-0.5">
              <Briefcase className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              {member.designation || 'Team Member'}
            </p>
            <p className="text-xs text-slate-500 truncate flex items-center gap-1.5 mt-0.5">
              <Building className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              {member.department || 'General'}
            </p>
          </div>
        </div>

        {/* Shift Capsule */}
        <div className="mt-4 p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              Shift:
            </span>
            <div className="flex items-center gap-1.5 font-medium text-slate-200">
              {member.shift ? (
                <>
                  {member.shift.isCrossMidnight ? (
                    <span className="flex items-center gap-1 text-[11px] text-purple-400 bg-purple-950/50 px-1.5 py-0.5 rounded border border-purple-800/50">
                      <Moon className="w-3 h-3" /> Night
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] text-amber-400 bg-amber-950/50 px-1.5 py-0.5 rounded border border-amber-800/50">
                      <Sun className="w-3 h-3" /> Day
                    </span>
                  )}
                  <span className="font-mono text-xs text-slate-300">
                    {member.shift.startTime} – {member.shift.endTime}
                  </span>
                </>
              ) : (
                <span className="text-slate-500 italic text-[11px]">Unassigned</span>
              )}
            </div>
          </div>
        </div>

        {/* Joined Date */}
        {formattedDate && (
          <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-slate-500">
            <Calendar className="w-3 h-3 text-slate-600 shrink-0" />
            <span>Joined {formattedDate}</span>
          </div>
        )}
      </div>

      {/* Quick Contact Footer */}
      <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
        {member.email ? (
          <a
            href={`mailto:${member.email}`}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 text-xs font-medium text-slate-300 hover:text-emerald-400 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 rounded-lg transition-colors truncate"
            title={member.email}
          >
            <Mail className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{member.email}</span>
          </a>
        ) : (
          <span className="text-xs text-slate-600">No email</span>
        )}

        {member.phone && (
          <a
            href={`tel:${member.phone}`}
            className="p-1.5 text-slate-400 hover:text-emerald-400 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 rounded-lg transition-colors"
            title={member.phone}
          >
            <Phone className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </div>
  );
};

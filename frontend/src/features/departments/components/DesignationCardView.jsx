/**
 * @file DesignationCardView.jsx
 * @description Responsive card grid view for corporate job designations.
 * Supports quick inspections, inline status badges, department links, headcount pills,
 * and direct management actions (Edit, Archive).
 * Styled in the Forest & Emerald Enterprise theme (#061A14, #111D17, #1A3125, #00C471).
 */

import React from 'react';
import {
  Award,
  Building2,
  Users,
  Eye,
  Edit2,
  Archive,
  Inbox
} from 'lucide-react';
import { StatusBadge } from '../../../components/common/StatusBadge.jsx';
import { Can } from '../../../components/common/Can.jsx';

const GRADE_STYLES = {
  Junior: {
    badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700'
  },
  Mid: {
    badge: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200/60 dark:border-blue-800/60'
  },
  Senior: {
    badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/60'
  },
  Lead: {
    badge: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 border-purple-200/60 dark:border-purple-800/60'
  },
  Executive: {
    badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200/60 dark:border-amber-800/60'
  }
};

export function DesignationCardView({
  designations = [],
  onInspect = () => {},
  onEdit = () => {},
  onArchive = () => {}
}) {
  if (designations.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] p-12 text-center">
        <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-[#15241C] text-slate-400 flex items-center justify-center mx-auto mb-3">
          <Inbox className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
          No designations found
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
          No corporate job titles matched your current search or filter criteria. Try adjusting your filters.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {designations.map((desig) => {
        const gradeStyle = GRADE_STYLES[desig.grade] || GRADE_STYLES.Junior;
        const deptName = desig.departmentId?.name || 'Unassigned Division';
        const deptCode = desig.departmentId?.code || '—';
        const staffCount = desig.headcount || 0;

        return (
          <div
            key={desig._id}
            className="group relative rounded-2xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] p-5 shadow-xs transition-all duration-200 hover:shadow-md hover:border-emerald-500/40 dark:hover:border-emerald-500/30 flex flex-col justify-between"
          >
            <div>
              {/* Card Header: Title & Badges */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[#00C471] flex items-center justify-center shrink-0 mt-0.5">
                    <Award className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-[#00C471] transition-colors">
                      {desig.title}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#1A3125] text-slate-600 dark:text-slate-400 font-semibold uppercase">
                        {desig.code}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${gradeStyle.badge}`}
                      >
                        {desig.grade}
                      </span>
                    </div>
                  </div>
                </div>

                <StatusBadge status={desig.isActive ? 'Active' : 'Inactive'} size="sm" />
              </div>

              {/* Department Association */}
              <div className="rounded-xl border border-slate-100 dark:border-[#15241C] bg-slate-50/50 dark:bg-[#0E1712] p-2.5 mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                    {deptName}
                  </span>
                </div>
                <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-200/60 dark:bg-[#1A3125] text-slate-500 shrink-0">
                  {deptCode}
                </span>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 min-h-[32px] mb-3">
                {desig.description || 'No corporate description or role summary defined for this position.'}
              </p>
            </div>

            {/* Bottom Section: Headcount & Action Buttons */}
            <div className="pt-3 border-t border-slate-100 dark:border-[#1A3125] flex items-center justify-between">
              {/* Headcount pill */}
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-md bg-emerald-500/10 text-[#00C471] flex items-center justify-center">
                  <Users className="w-3 h-3" />
                </div>
                <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                  {staffCount}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {staffCount === 1 ? 'member' : 'staff'}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onInspect(desig)}
                  title="Inspect Details & Staff Roster"
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1A3125] transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>

                <Can I="org.manage" a="Organization">
                  <button
                    type="button"
                    onClick={() => onEdit(desig)}
                    title="Edit Designation"
                    className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-500 dark:text-slate-400 dark:hover:text-[#00C471] hover:bg-slate-100 dark:hover:bg-[#1A3125] transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onArchive(desig)}
                    title="Archive Designation"
                    className="p-1.5 rounded-lg text-slate-500 hover:text-amber-500 dark:text-slate-400 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-[#1A3125] transition-colors"
                  >
                    <Archive className="w-3.5 h-3.5" />
                  </button>
                </Can>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * @file DepartmentCardView.jsx
 * @description Visual card grid view for browsing active company departments and directorates.
 * Styled in the Forest & Emerald Enterprise theme with responsive 1/2/3 column layout.
 */

import React from 'react';
import {
  Building2,
  Network,
  Users,
  Eye,
  Edit2,
  Archive,
  Briefcase
} from 'lucide-react';
import { StatusBadge } from '../../../components/common/StatusBadge.jsx';
import { Can } from '../../../components/common/Can.jsx';

export function DepartmentCardView({
  departments = [],
  onInspect,
  onEdit,
  onArchive
}) {
  if (departments.length === 0) {
    return (
      <div className="py-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-[#1A3125] bg-white/50 dark:bg-[#111D17]/50 text-slate-400 text-xs">
        <Building2 className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
        <p className="font-semibold text-slate-600 dark:text-slate-300">No departments match your filters</p>
        <p className="text-[11px] mt-0.5">Try clearing filters or adjusting your search term.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {departments.map((dept) => {
        const headcount = dept.headcount || 0;

        return (
          <div
            key={dept._id || dept.id}
            className="group rounded-2xl bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] p-5 shadow-xs hover:border-[#00C471]/40 dark:hover:border-[#00C471]/40 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
          >
            {/* Top Bar: Icon, Title & Status */}
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-[#1A3125] border border-slate-200/80 dark:border-[#234232] text-slate-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#00C471] transition-colors truncate max-w-[170px]">
                      {dept.name}
                    </h4>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-medium tracking-wide bg-slate-100 dark:bg-[#1A3125] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#234232]">
                      {dept.code}
                    </span>
                  </div>
                </div>

                <StatusBadge
                  status={dept.isActive ? 'active' : 'inactive'}
                  label={dept.isActive ? 'Active' : 'Inactive'}
                />
              </div>

              {/* Description */}
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-3 leading-relaxed min-h-[2rem]">
                {dept.description || 'Corporate organizational business division.'}
              </p>

              {/* Parent Division */}
              <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                <Network className="w-3.5 h-3.5 text-[#00C471] shrink-0" />
                <span className="truncate text-[11px]">
                  {dept.parentId ? dept.parentId.name : 'Top-Level Corporate Directorate'}
                </span>
              </div>
            </div>

            {/* Middle: Leadership & Headcount */}
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-[#1A3125] space-y-2.5">
              {/* Department Head */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400 font-medium">Head</span>
                {dept.headName ? (
                  <div className="flex items-center gap-1.5 truncate max-w-[160px]">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-[#00C471] dark:text-emerald-400 flex items-center justify-center font-bold text-[9px] shrink-0">
                      {dept.headName.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate text-[11px]">
                      {dept.headName}
                    </span>
                  </div>
                ) : (
                  <span className="text-[11px] text-slate-400 italic">Unassigned</span>
                )}
              </div>

              {/* Headcount */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400 font-medium">Headcount</span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-50 dark:bg-emerald-950/40 text-[#00C471] border border-emerald-200/50 dark:border-emerald-800/40 tabular-nums">
                  <Users className="w-3 h-3" />
                  <span>{headcount} staff</span>
                </span>
              </div>
            </div>

            {/* Bottom Actions Footer */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#1A3125] flex items-center justify-between">
              <button
                type="button"
                onClick={() => onInspect(dept._id || dept.id)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-[#00C471] transition-colors cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Inspect</span>
              </button>

              <div className="flex items-center gap-1">
                <Can I="org.manage" a="Organization">
                  <button
                    type="button"
                    onClick={() => onEdit(dept)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-[#1A3125] transition-colors cursor-pointer"
                    title="Edit Department"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onArchive(dept)}
                    className="p-1.5 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1A3125] transition-colors cursor-pointer"
                    title="Archive Department"
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

/**
 * @file RoleDistributionChart.jsx
 * @description Native zero-dependency Horizontal Bar Chart showing workforce distribution per role.
 * Styled in Elvara Forest & Emerald Enterprise theme (#061A14, #111D17, #1A3125, #00C471).
 */

import React, { useState } from 'react';
import { Crown, Shield, Users } from 'lucide-react';
import { cn } from '../../../lib/utils.js';

export function RoleDistributionChart({ userDistribution = [], totalWorkforce = 0 }) {
  const [hoveredRoleId, setHoveredRoleId] = useState(null);

  const maxCount = Math.max(...userDistribution.map((d) => d.count), 1);
  const totalAssigned = totalWorkforce || userDistribution.reduce((sum, d) => sum + d.count, 0) || 1;

  if (!userDistribution.length) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400 dark:text-slate-500">
        <Users className="w-8 h-8 mb-2 opacity-40" />
        <p className="text-xs">No active staff assignments detected.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-700 dark:text-slate-300">
          Workforce Headcount by Role
        </span>
        <span className="text-slate-400 dark:text-slate-500 font-mono">
          {totalAssigned} assigned total
        </span>
      </div>

      <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
        {userDistribution.map((item) => {
          const percentageOfTotal = Math.round((item.count / totalAssigned) * 100);
          const barWidthPercent = Math.max(Math.round((item.count / maxCount) * 100), item.count > 0 ? 4 : 1);
          const isHovered = hoveredRoleId === item.roleId;

          return (
            <div
              key={item.roleId || item.name}
              onMouseEnter={() => setHoveredRoleId(item.roleId)}
              onMouseLeave={() => setHoveredRoleId(null)}
              className={cn(
                'group p-2 rounded-lg transition-all duration-150',
                isHovered
                  ? 'bg-slate-100/80 dark:bg-[#1A3125]/50 ring-1 ring-[#00C471]/30'
                  : 'hover:bg-slate-50 dark:hover:bg-[#111D17]'
              )}
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <div className="flex items-center gap-1.5 truncate pr-2">
                  {item.isSystem ? (
                    <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  ) : (
                    <Shield className="w-3.5 h-3.5 text-brand shrink-0" />
                  )}
                  <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                    {item.name}
                  </span>
                  <span
                    className={cn(
                      'text-[9px] px-1.5 py-0.5 rounded-full font-mono font-semibold',
                      item.isSystem
                        ? 'bg-amber-100/70 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400'
                        : 'bg-emerald-100/70 text-brand dark:bg-emerald-950/50 dark:text-[#00C471]'
                    )}
                  >
                    {item.isSystem ? 'System' : 'Custom'}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0 font-mono text-[11px]">
                  <span className="font-semibold text-slate-900 dark:text-white tabular-nums">
                    {item.count} <span className="text-[10px] text-slate-400 font-sans font-normal">staff</span>
                  </span>
                  <span className="text-slate-400 dark:text-slate-500 w-9 text-right tabular-nums">
                    {percentageOfTotal}%
                  </span>
                </div>
              </div>

              {/* Progress Track */}
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800/80 overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    item.isSystem
                      ? 'bg-gradient-to-r from-amber-500 to-amber-400'
                      : 'bg-gradient-to-r from-[#00C471] to-[#10B981]'
                  )}
                  style={{ width: `${barWidthPercent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default RoleDistributionChart;

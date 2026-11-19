/**
 * @file RoleAnalyticsSection.jsx
 * @description Visual analytics container component hosting RoleDistributionChart & ModulePermissionDonut.
 * Follows the Forest & Emerald Enterprise theme (#061A14, #111D17, #1A3125, #00C471).
 */

import React, { useState } from 'react';
import { BarChart3, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { RoleDistributionChart } from './RoleDistributionChart.jsx';
import { ModulePermissionDonut } from './ModulePermissionDonut.jsx';
import { cn } from '../../../lib/utils.js';

export function RoleAnalyticsSection({ analytics = {}, isLoading = false }) {
  const [isExpanded, setIsExpanded] = useState(true);

  const {
    userDistribution = [],
    moduleCoverage = [],
    systemVsCustom = {}
  } = analytics;

  return (
    <div className="rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] shadow-2xs overflow-hidden mb-6 transition-all">
      {/* Header Bar */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between px-4 py-3 cursor-pointer select-none border-b border-slate-100 dark:border-[#1A3125]/60 hover:bg-slate-50/50 dark:hover:bg-[#1A3125]/20 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-[#00C471]">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              Workforce Access Distribution & Permission Topology
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                Live Analytics
              </span>
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Correlating staff headcount per role against registered module capability footprints
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span className="hidden sm:inline text-[11px]">
            {isExpanded ? 'Collapse' : 'Expand'}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </div>
      </div>

      {/* Collapsible Content */}
      {isExpanded && (
        <div className="p-5">
          {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-pulse">
              <div className="h-48 bg-slate-100 dark:bg-slate-800/40 rounded-xl" />
              <div className="h-48 bg-slate-100 dark:bg-slate-800/40 rounded-xl" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start divide-y lg:divide-y-0 lg:divide-x divide-slate-100 dark:divide-[#1A3125]">
              {/* Left Column: Role Distribution Flex-bars */}
              <div className="pt-2 lg:pt-0 lg:pr-6">
                <RoleDistributionChart userDistribution={userDistribution} />
              </div>

              {/* Right Column: Module Permission Categories Donut */}
              <div className="pt-6 lg:pt-0 lg:pl-8">
                <ModulePermissionDonut moduleCoverage={moduleCoverage} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default RoleAnalyticsSection;

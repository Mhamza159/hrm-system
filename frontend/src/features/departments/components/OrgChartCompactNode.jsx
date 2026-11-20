/**
 * @file OrgChartCompactNode.jsx
 * @description Compact High-Density Node Chip for Scalable Organizational Visualization.
 * 
 * FEATURES:
 * - Ultra-streamlined 190px chip width for large org rosters.
 * - Avatar with status indicator dot.
 * - Employee name, code badge, and designation.
 * - Expand/collapse trigger for subordinates.
 * - Logged-in user highlight (`isMe`), reporting chain indicator, and selection state.
 */

import React from 'react';
import {
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Users
} from 'lucide-react';

export const OrgChartCompactNode = ({
  node,
  isMe = false,
  isSelected = false,
  isInReportingChain = false,
  isExpanded = true,
  onToggleExpand,
  onSelectNode
}) => {
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div
      id={`org-compact-node-${node.id}`}
      onClick={() => onSelectNode && onSelectNode(node)}
      className={`relative flex items-center justify-between gap-2 w-48 px-2.5 py-2 rounded-xl cursor-pointer select-none transition-all duration-200 group shadow-xs ${
        isMe
          ? 'bg-emerald-50/95 dark:bg-emerald-950/70 border-2 border-[#00C471] shadow-[0_0_16px_rgba(0,196,113,0.35)] scale-[1.02]'
          : isSelected
          ? 'bg-cyan-50/90 dark:bg-cyan-950/60 border-2 border-cyan-500 shadow-sm'
          : isInReportingChain
          ? 'bg-white dark:bg-[#15241C] border-2 border-emerald-500/70 shadow-2xs'
          : 'bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] hover:border-emerald-500/60 hover:shadow-sm'
      }`}
    >
      {/* Avatar with Status Dot */}
      <div className="relative shrink-0">
        {node.avatar ? (
          <img
            src={node.avatar}
            alt={node.name}
            className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
          />
        ) : (
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
              isMe
                ? 'bg-[#00C471] text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200'
            }`}
          >
            {node.name
              ? node.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .substring(0, 2)
                  .toUpperCase()
              : 'EM'}
          </div>
        )}
        <span
          className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 border-2 border-white dark:border-[#111D17] rounded-full ${
            node.status === 'On Leave'
              ? 'bg-amber-500'
              : node.status === 'Probation'
              ? 'bg-blue-500'
              : 'bg-emerald-500'
          }`}
          title={node.status || 'Active'}
        />
      </div>

      {/* Info Block */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-[#00C471] transition-colors">
            {node.name}
          </p>
          {isMe && (
            <ShieldCheck className="w-3 h-3 text-emerald-500 shrink-0" title="You" />
          )}
        </div>
        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
          {node.designation}
        </p>
      </div>

      {/* Expand / Direct Reports Pill */}
      {hasChildren && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand && onToggleExpand();
          }}
          className="shrink-0 flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300 transition-colors"
          title={`${node.children.length} direct reports`}
        >
          <Users className="w-2.5 h-2.5 text-slate-400" />
          <span>{node.children.length}</span>
          {isExpanded ? (
            <ChevronDown className="w-3 h-3 ml-0.5 text-slate-400" />
          ) : (
            <ChevronRight className="w-3 h-3 ml-0.5 text-slate-400" />
          )}
        </button>
      )}
    </div>
  );
};

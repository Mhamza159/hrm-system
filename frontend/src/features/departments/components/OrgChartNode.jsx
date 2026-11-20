/**
 * @file OrgChartNode.jsx
 * @description Hierarchical Tree Node Component for Visual Org Chart.
 * 
 * SPECIFICATION & CAPABILITIES (Phases 38):
 * - Renders enterprise employee cards in Elvara Forest theme (`#061A14`, `#111D17`, `#00C471`).
 * - Dual-density rendering support (Standard Cards vs Compact Chips).
 * - Multi-column leaf grid stacking when reporting span > 6 individual contributors.
 * - Highlights logged-in user (`isMe`) with emerald glow and "You" badge.
 * - Illuminates ancestral `reportingChain` and active search matches.
 * - Robust SVG & CSS connectors with department and status filtering.
 */

import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Building,
  Briefcase,
  Mail,
  Phone,
  Users,
  Eye
} from 'lucide-react';
import { OrgChartCompactNode } from './OrgChartCompactNode.jsx';

export const OrgChartNode = ({
  node,
  reportingChain = [],
  highlightedId = null,
  searchMatchIds = new Set(),
  searchAncestorIds = new Set(),
  selectedDept = 'ALL',
  selectedStatus = 'all',
  isCompact = false,
  onSelectNode
}) => {
  const isSearchAncestor = searchAncestorIds && searchAncestorIds.has(node.id);
  const isSearchMatch = searchMatchIds && searchMatchIds.has(node.id);
  const [isExpanded, setIsExpanded] = useState(true);

  if (!node) return null;

  const hasChildren = node.children && node.children.length > 0;
  const isMe = node.isMe;
  const isInReportingChain = reportingChain.includes(node.id);
  const isSelected = highlightedId === node.id || isSearchMatch;
  const isDeptMatch = !selectedDept || selectedDept === 'ALL' || node.department === selectedDept;
  const isStatusMatch = selectedStatus === 'all' || node.status?.toLowerCase() === selectedStatus?.toLowerCase();

  // If node is an ancestor of a search match, force expanded so match is exposed
  const effectivelyExpanded = isExpanded || isSearchAncestor;

  // Check if all children are leaves (no subordinates of their own)
  const areAllChildrenLeaves = hasChildren && node.children.every((c) => !c.children || c.children.length === 0);
  const useLeafGrid = areAllChildrenLeaves && node.children.length > 6;

  // Grade badge styling
  const gradeStyles = {
    Executive: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-300/80 dark:border-amber-500/30',
    Lead: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-300/80 dark:border-purple-500/30',
    Senior: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-300/80 dark:border-blue-500/30',
    Mid: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-300/80 dark:border-emerald-500/30',
    Junior: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300/80 dark:border-slate-700'
  };

  return (
    <div className="flex flex-col items-center">
      {/* Node Render (Standard Card vs Compact Chip) */}
      {isCompact ? (
        <OrgChartCompactNode
          node={node}
          isMe={isMe}
          isSelected={isSelected}
          isInReportingChain={isInReportingChain}
          isSearchMatch={isSearchMatch}
          isExpanded={effectivelyExpanded}
          onToggleExpand={() => setIsExpanded(!isExpanded)}
          onSelectNode={onSelectNode}
        />
      ) : (
        <div
          id={`org-node-${node.id}`}
          onClick={() => onSelectNode && onSelectNode(node)}
          className={`relative w-72 rounded-2xl p-4 cursor-pointer transition-all duration-200 select-none group shadow-xs ${
            !isDeptMatch || !isStatusMatch ? 'opacity-35 hover:opacity-100' : 'opacity-100'
          } ${
            isMe
              ? 'bg-emerald-50/90 dark:bg-emerald-950/60 border-2 border-[#00C471] shadow-[0_4px_24px_rgba(0,196,113,0.22)] dark:shadow-[0_0_24px_rgba(0,196,113,0.35)] scale-[1.02]'
              : isSearchMatch
              ? 'bg-cyan-50/95 dark:bg-cyan-950/70 border-2 border-cyan-400 ring-4 ring-cyan-400/25 shadow-[0_4px_24px_rgba(6,182,212,0.3)] scale-[1.03] animate-pulse'
              : isSelected
              ? 'bg-cyan-50/90 dark:bg-cyan-950/50 border-2 border-cyan-500 shadow-[0_4px_20px_rgba(6,182,212,0.25)] scale-[1.01]'
              : isInReportingChain
              ? 'bg-white dark:bg-[#13221A] border-2 border-emerald-500/70 shadow-sm'
              : 'bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] hover:border-emerald-500/60 dark:hover:border-emerald-500/60 hover:shadow-md hover:-translate-y-0.5'
          }`}
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-md">
                {node.employeeCode}
              </span>
              {isMe && (
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-500/25 border border-emerald-300 dark:border-emerald-500/40 px-2 py-0.5 rounded-full shadow-2xs">
                  <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> You
                </span>
              )}
              {!isMe && isInReportingChain && (
                <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-600/40 px-2 py-0.5 rounded-full">
                  Reporting Chain
                </span>
              )}
            </div>

            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shadow-2xs ${
                gradeStyles[node.grade] || gradeStyles.Mid
              }`}
            >
              {node.grade}
            </span>
          </div>

          {/* Profile Identity */}
          <div className="flex items-start gap-3">
            <div className="relative shrink-0">
              {node.avatar ? (
                <img
                  src={node.avatar}
                  alt={node.name}
                  className={`w-11 h-11 rounded-full object-cover shrink-0 shadow-sm ${
                    isMe ? 'ring-2 ring-[#00C471]' : 'border border-slate-200 dark:border-slate-700'
                  }`}
                />
              ) : (
                <div
                  className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-sm ${
                    isMe
                      ? 'bg-[#00C471] text-white ring-2 ring-[#00C471]/30'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
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
                className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-white dark:border-[#111D17] rounded-full ${
                  node.status === 'On Leave'
                    ? 'bg-amber-500'
                    : node.status === 'Probation'
                    ? 'bg-blue-500'
                    : 'bg-emerald-500'
                }`}
                title={node.status || 'Active'}
              />
            </div>

            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-[#00C471] transition-colors">
                {node.name}
              </h4>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium truncate flex items-center gap-1.5 mt-0.5">
                <Briefcase className="w-3 h-3 shrink-0" />
                <span className="truncate">{node.designation}</span>
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1.5 mt-0.5">
                <Building className="w-3 h-3 shrink-0 text-slate-400" />
                <span className="truncate">{node.department}</span>
              </p>
            </div>
          </div>

          {/* Contact Coordinates */}
          {(node.email || node.phone) && (
            <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/60 space-y-1">
              {node.email && (
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1.5">
                  <Mail className="w-3 h-3 shrink-0 text-slate-400" />
                  <span className="truncate font-mono">{node.email}</span>
                </p>
              )}
              {node.phone && (
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1.5">
                  <Phone className="w-3 h-3 shrink-0 text-slate-400" />
                  <span className="truncate">{node.phone}</span>
                </p>
              )}
            </div>
          )}

          {/* Action Footer: Direct Reports Count & Expand Toggle */}
          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
            {hasChildren ? (
              <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Users className="w-3 h-3 text-slate-400" />
                <span>Reports:</span>
                <span className="font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800/50 px-1.5 py-0.2 rounded text-[10px]">
                  {node.children.length}
                </span>
              </span>
            ) : (
              <span className="text-[10px] text-slate-400 dark:text-slate-500 italic">
                Direct Contributor
              </span>
            )}

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectNode && onSelectNode(node);
                }}
                title="Inspect in Detail Drawer"
                className="p-1 rounded-md text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>

              {hasChildren && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(!isExpanded);
                  }}
                  className="flex items-center gap-1 text-[10px] text-slate-700 dark:text-emerald-400 hover:text-slate-900 dark:hover:text-emerald-300 font-medium px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 transition-colors cursor-pointer"
                >
                  {isExpanded ? (
                    <>
                      <ChevronDown className="w-3 h-3" /> Hide
                    </>
                  ) : (
                    <>
                      <ChevronRight className="w-3 h-3" /> Show ({node.children.length})
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Children Tree Connectors & Children Rendering */}
      {hasChildren && effectivelyExpanded && (
        <div className="flex flex-col items-center">
          {/* Vertical Trunk Line down from parent */}
          <div
            className={`w-0.5 h-6 ${
              isInReportingChain || isSearchAncestor ? 'bg-[#00C471]' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          />

          {/* Child Container: Either Leaf Grid or Horizontal Row */}
          {useLeafGrid ? (
            <div className="relative pt-4 p-4 rounded-2xl bg-slate-100/50 dark:bg-[#0A140F]/60 border border-dashed border-slate-300 dark:border-[#1A3125]">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2.5 text-center">
                Direct Reports Roster ({node.children.length} Members)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {node.children.map((child) => (
                  <OrgChartCompactNode
                    key={child.id}
                    node={child}
                    isMe={child.isMe}
                    isSelected={highlightedId === child.id}
                    isInReportingChain={reportingChain.includes(child.id) || (searchAncestorIds && searchAncestorIds.has(child.id))}
                    isSearchMatch={searchMatchIds && searchMatchIds.has(child.id)}
                    isExpanded={false}
                    onSelectNode={onSelectNode}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="relative flex pt-4 gap-6">
              {node.children.map((child, index) => {
                const isFirst = index === 0;
                const isLast = index === node.children.length - 1;
                const isOnlyChild = node.children.length === 1;
                const isChildActiveInChain = child.isMe || reportingChain.includes(child.id) || (searchAncestorIds && searchAncestorIds.has(child.id));

                return (
                  <div key={child.id} className="relative flex flex-col items-center">
                    {/* Top horizontal branch lines */}
                    {!isOnlyChild && (
                      <div
                        className={`absolute -top-4 h-0.5 ${
                          isFirst
                            ? 'left-1/2 right-0'
                            : isLast
                            ? 'left-0 right-1/2'
                            : 'left-0 right-0'
                        } ${
                          isChildActiveInChain
                            ? 'bg-[#00C471]'
                            : 'bg-slate-300 dark:bg-slate-700'
                        }`}
                      />
                    )}

                    {/* Vertical drop line to child card */}
                    <div
                      className={`w-0.5 h-4 -mt-4 mb-2 ${
                        isChildActiveInChain
                          ? 'bg-[#00C471]'
                          : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    />

                    {/* Recursive Child Node */}
                    <OrgChartNode
                      node={child}
                      reportingChain={reportingChain}
                      highlightedId={highlightedId}
                      searchMatchIds={searchMatchIds}
                      searchAncestorIds={searchAncestorIds}
                      selectedDept={selectedDept}
                      selectedStatus={selectedStatus}
                      isCompact={isCompact}
                      onSelectNode={onSelectNode}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * @file OrgChartNode.jsx
 * @description Hierarchical Tree Node Component for Visual Org Chart.
 * 
 * SPECIFICATION & CAPABILITIES (Slices 4.5 & 4.7):
 * - Renders employee card with avatar, name, code, designation, grade badge, and department.
 * - Displays expandable/collapsible toggle with children count badge.
 * - Highlights when node represents logged-in user (`isMe`) with emerald glow and "You" indicator.
 * - Highlights when node is part of the user's vertical ancestral `reportingChain`.
 * - Zero TypeScript, plain JSX, Lucide icons, Dark Craft design system.
 */

import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  User,
  ShieldCheck,
  Building,
  Briefcase,
  Mail,
  Phone
} from 'lucide-react';
import { StatusBadge } from '../../../components/common/StatusBadge.jsx';

export const OrgChartNode = ({
  node,
  reportingChain = [],
  highlightedId = null,
  onSelectNode
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!node) return null;

  const hasChildren = node.children && node.children.length > 0;
  const isMe = node.isMe;
  const isInReportingChain = reportingChain.includes(node.id);
  const isSelected = highlightedId === node.id;

  // Grade badge color styling
  const gradeStyles = {
    Executive: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    Lead: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    Senior: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    Mid: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    Junior: 'bg-slate-500/10 text-slate-400 border-slate-500/20'
  };

  return (
    <div className="flex flex-col items-center">
      {/* Node Card */}
      <div
        id={`org-node-${node.id}`}
        onClick={() => onSelectNode && onSelectNode(node)}
        className={`relative w-72 rounded-xl p-4 cursor-pointer transition-all duration-300 backdrop-blur-md ${
          isMe
            ? 'bg-emerald-950/40 border-2 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.35)] scale-[1.02]'
            : isSelected
            ? 'bg-cyan-950/40 border-2 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
            : isInReportingChain
            ? 'bg-slate-900/90 border-2 border-emerald-500/60 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
            : 'bg-slate-900/80 border border-slate-800 hover:border-slate-700 hover:shadow-lg'
        }`}
      >
        {/* Top Badges: isMe Indicator or Reporting Chain Tag */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-mono font-semibold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
              {node.employeeCode}
            </span>
            {isMe && (
              <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 rounded-full animate-pulse">
                <ShieldCheck className="w-3 h-3" /> You
              </span>
            )}
            {!isMe && isInReportingChain && (
              <span className="text-[10px] font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-600/30 px-1.5 py-0.5 rounded">
                Chain
              </span>
            )}
          </div>
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
              gradeStyles[node.grade] || gradeStyles.Mid
            }`}
          >
            {node.grade}
          </span>
        </div>

        {/* Avatar & User Details */}
        <div className="flex items-start gap-3">
          <div
            className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm shrink-0 shadow-inner ${
              isMe
                ? 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-400/50'
                : 'bg-gradient-to-br from-slate-700 to-slate-800 text-slate-200 border border-slate-700'
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

          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-semibold text-slate-100 truncate flex items-center gap-1">
              {node.name}
            </h4>
            <p className="text-xs text-slate-400 truncate flex items-center gap-1 mt-0.5">
              <Briefcase className="w-3 h-3 shrink-0 text-slate-500" />
              {node.designation}
            </p>
            <p className="text-xs text-slate-500 truncate flex items-center gap-1 mt-0.5">
              <Building className="w-3 h-3 shrink-0 text-slate-600" />
              {node.department}
            </p>
          </div>
        </div>

        {/* Direct Reports Count Toggle Button */}
        {hasChildren && (
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Direct Reports:{' '}
              <span className="font-semibold text-slate-200">
                {node.children.length}
              </span>
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-medium px-2 py-1 rounded bg-slate-800/60 hover:bg-slate-800 transition-colors"
            >
              {isExpanded ? (
                <>
                  <ChevronDown className="w-3.5 h-3.5" /> Collapse
                </>
              ) : (
                <>
                  <ChevronRight className="w-3.5 h-3.5" /> Expand (
                  {node.children.length})
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Children Tree Connectors & Recursive Children */}
      {hasChildren && isExpanded && (
        <div className="flex flex-col items-center">
          {/* Vertical Trunk Line down from parent */}
          <div
            className={`w-0.5 h-6 ${
              isInReportingChain ? 'bg-emerald-500' : 'bg-slate-700'
            }`}
          />

          {/* Children container with horizontal connector bar */}
          <div className="relative flex pt-4 gap-8">
            {node.children.map((child, index) => {
              const isFirst = index === 0;
              const isLast = index === node.children.length - 1;
              const isOnlyChild = node.children.length === 1;

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
                        child.isMe || reportingChain.includes(child.id)
                          ? 'bg-emerald-500'
                          : 'bg-slate-700'
                      }`}
                    />
                  )}

                  {/* Vertical drop line to child card */}
                  <div
                    className={`w-0.5 h-4 -mt-4 mb-2 ${
                      child.isMe || reportingChain.includes(child.id)
                        ? 'bg-emerald-500'
                        : 'bg-slate-700'
                    }`}
                  />

                  {/* Recursive Child Node */}
                  <OrgChartNode
                    node={child}
                    reportingChain={reportingChain}
                    highlightedId={highlightedId}
                    onSelectNode={onSelectNode}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

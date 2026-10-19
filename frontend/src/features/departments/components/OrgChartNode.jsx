/**
 * @file OrgChartNode.jsx
 * @description Hierarchical Tree Node Component for Visual Org Chart.
 * 
 * SPECIFICATION & CAPABILITIES (Slices 4.5 & 4.7):
 * - Renders employee card with avatar, active status indicator, name, code, designation, grade badge, email, and department.
 * - Displays expandable/collapsible toggle with children count badge.
 * - Highlights when node represents logged-in user (`isMe`) with emerald glow and "You" indicator.
 * - Highlights when node is part of the user's vertical ancestral `reportingChain`.
 * - Department spotlight support via `selectedDept`.
 * - Zero TypeScript, plain JSX, Lucide icons, Dark Craft design system.
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
  Users
} from 'lucide-react';

export const OrgChartNode = ({
  node,
  reportingChain = [],
  highlightedId = null,
  selectedDept = 'ALL',
  onSelectNode
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!node) return null;

  const hasChildren = node.children && node.children.length > 0;
  const isMe = node.isMe;
  const isInReportingChain = reportingChain.includes(node.id);
  const isSelected = highlightedId === node.id;
  const isDeptMatch = !selectedDept || selectedDept === 'ALL' || node.department === selectedDept;

  // Grade badge color styling
  const gradeStyles = {
    Executive: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    Lead: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    Senior: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    Mid: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    Junior: 'bg-slate-700/60 text-slate-300 border-slate-600/50'
  };

  return (
    <div className="flex flex-col items-center">
      {/* Node Card */}
      <div
        id={`org-node-${node.id}`}
        onClick={() => onSelectNode && onSelectNode(node)}
        className={`relative w-80 rounded-2xl p-4 cursor-pointer transition-all duration-300 backdrop-blur-md select-none group ${
          !isDeptMatch ? 'opacity-40 hover:opacity-100' : 'opacity-100'
        } ${
          isMe
            ? 'bg-emerald-950/60 border-2 border-emerald-500 shadow-[0_0_24px_rgba(16,185,129,0.35)] scale-[1.02]'
            : isSelected
            ? 'bg-cyan-950/50 border-2 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.35)]'
            : isInReportingChain
            ? 'bg-slate-900/95 border-2 border-emerald-500/70 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
            : 'bg-slate-900/85 border border-slate-800 hover:border-slate-700 hover:shadow-xl hover:-translate-y-0.5'
        }`}
      >
        {/* Top Header: Employee Code + Badges */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-mono font-bold text-slate-300 bg-slate-800/90 border border-slate-700/70 px-2 py-0.5 rounded-md">
              {node.employeeCode}
            </span>
            {isMe && (
              <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300 bg-emerald-500/25 border border-emerald-500/40 px-2 py-0.5 rounded-full animate-pulse shadow-sm">
                <ShieldCheck className="w-3 h-3" /> You
              </span>
            )}
            {!isMe && isInReportingChain && (
              <span className="text-[10px] font-semibold text-emerald-300 bg-emerald-950/80 border border-emerald-600/40 px-2 py-0.5 rounded-full">
                Reporting Chain
              </span>
            )}
          </div>
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shadow-sm ${
              gradeStyles[node.grade] || gradeStyles.Mid
            }`}
          >
            {node.grade}
          </span>
        </div>

        {/* Avatar & User Details */}
        <div className="flex items-start gap-3.5">
          {/* Avatar with Status Indicator Dot */}
          <div className="relative shrink-0">
            {node.avatar ? (
              <img
                src={node.avatar}
                alt={node.name}
                className={`w-12 h-12 rounded-full object-cover shrink-0 shadow-md ${
                  isMe ? 'ring-2 ring-emerald-400' : 'border border-slate-700'
                }`}
              />
            ) : (
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm shrink-0 shadow-md ${
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
            )}
            <span
              className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-900 rounded-full"
              title="Active Status"
            />
          </div>

          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-bold text-slate-100 truncate group-hover:text-emerald-400 transition-colors">
              {node.name}
            </h4>
            <p className="text-xs text-slate-300 font-medium truncate flex items-center gap-1.5 mt-0.5">
              <Briefcase className="w-3.5 h-3.5 shrink-0 text-emerald-400/90" />
              <span className="truncate">{node.designation}</span>
            </p>
            <p className="text-[11px] text-slate-400 truncate flex items-center gap-1.5 mt-0.5">
              <Building className="w-3.5 h-3.5 shrink-0 text-slate-500" />
              <span className="truncate">{node.department}</span>
            </p>
          </div>
        </div>

        {/* Contact Info Snippet */}
        {(node.email || node.phone) && (
          <div className="mt-2.5 pt-2 border-t border-slate-800/60 space-y-1">
            {node.email && (
              <p className="text-[11px] text-slate-400 hover:text-slate-200 truncate flex items-center gap-1.5 transition-colors">
                <Mail className="w-3 h-3 shrink-0 text-slate-500" />
                <span className="truncate font-mono">{node.email}</span>
              </p>
            )}
            {node.phone && (
              <p className="text-[11px] text-slate-400 truncate flex items-center gap-1.5">
                <Phone className="w-3 h-3 shrink-0 text-slate-500" />
                <span className="truncate">{node.phone}</span>
              </p>
            )}
          </div>
        )}

        {/* Direct Reports Count & Expand/Collapse Action */}
        {hasChildren && (
          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-500" />
              <span>Direct Reports:</span>
              <span className="font-semibold text-emerald-400 bg-emerald-950/70 border border-emerald-800/50 px-1.5 py-0.5 rounded text-[10px]">
                {node.children.length}
              </span>
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 font-medium px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 transition-colors shadow-sm"
            >
              {isExpanded ? (
                <>
                  <ChevronDown className="w-3.5 h-3.5" /> Collapse
                </>
              ) : (
                <>
                  <ChevronRight className="w-3.5 h-3.5" /> Expand ({node.children.length})
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
                    selectedDept={selectedDept}
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

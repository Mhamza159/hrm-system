/**
 * @file OrgChartCanvasControls.jsx
 * @description Floating Canvas Navigation HUD for Org Chart.
 * 
 * FEATURES:
 * - Zoom in, zoom out, reset to 100%, and live percentage indicator.
 * - Fit to Screen auto-scaler.
 * - Center on Root & Find My Position.
 * - Hierarchy depth level selector (L1 Executive, L2 Heads, L3 Leads, All Levels).
 * - Bulk Expand All / Collapse All.
 * - Density Switcher (Standard Card vs Compact Chip).
 * - Native Fullscreen toggle.
 */

import React from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  Crosshair,
  Layers,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  Minimize,
  Download
} from 'lucide-react';

export const OrgChartCanvasControls = ({
  zoom = 1,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onFitToScreen,
  onCenterRoot,
  onFindMyPosition,
  hasMyPosition = false,
  isFullscreen = false,
  onToggleFullscreen,
  maxDepthLimit,
  onChangeDepth,
  onExpandAll,
  onCollapseAll,
  isCompact = false,
  onToggleCompact,
  onExportPng
}) => {
  return (
    <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-white/95 dark:bg-[#111D17]/95 backdrop-blur-md border border-slate-200 dark:border-[#1A3125] shadow-lg text-slate-700 dark:text-slate-300 select-none">
      {/* Zoom Controls */}
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={onZoomOut}
          title="Zoom Out (Ctrl + Scroll Down)"
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1A3125] transition-colors cursor-pointer"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <span
          title="Click to reset to 100%"
          onClick={onResetZoom}
          className="text-[11px] font-mono font-bold px-2 py-1 min-w-[3.2rem] text-center rounded-md bg-slate-50 dark:bg-[#061A14] border border-slate-200 dark:border-[#1A3125] cursor-pointer hover:text-emerald-500 transition-colors"
        >
          {Math.round(zoom * 100)}%
        </span>

        <button
          type="button"
          onClick={onZoomIn}
          title="Zoom In (Ctrl + Scroll Up)"
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1A3125] transition-colors cursor-pointer"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onResetZoom}
          title="Reset Zoom to 100%"
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1A3125] transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="w-px h-5 bg-slate-200 dark:bg-[#1A3125] mx-0.5" />

      {/* Auto Navigation & Fit */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onFitToScreen}
          title="Fit Entire Organization to Screen"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1A3125] transition-colors cursor-pointer"
        >
          <Minimize className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden sm:inline">Fit Screen</span>
        </button>

        <button
          type="button"
          onClick={onCenterRoot}
          title="Center Canvas on Executive Leadership"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1A3125] transition-colors cursor-pointer"
        >
          <Layers className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden sm:inline">Center Root</span>
        </button>

        {hasMyPosition && (
          <button
            type="button"
            onClick={onFindMyPosition}
            title="Locate & Highlight My Position"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25 transition-all cursor-pointer shadow-2xs"
          >
            <Crosshair className="w-3.5 h-3.5 text-emerald-500" />
            <span>Find Me</span>
          </button>
        )}
      </div>

      <div className="w-px h-5 bg-slate-200 dark:bg-[#1A3125] mx-0.5" />

      {/* Depth Level Selector */}
      <div className="flex items-center gap-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 pl-1 hidden md:inline">
          Levels:
        </span>
        {[
          { label: 'L1', depth: 1, title: 'Level 1: Executive Roots' },
          { label: 'L2', depth: 2, title: 'Level 2: Department Heads' },
          { label: 'L3', depth: 3, title: 'Level 3: Team Leads' },
          { label: 'All', depth: 10, title: 'All Hierarchy Levels' }
        ].map((lvl) => (
          <button
            key={lvl.label}
            type="button"
            onClick={() => onChangeDepth && onChangeDepth(lvl.depth)}
            title={lvl.title}
            className={`px-2 py-0.5 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
              maxDepthLimit === lvl.depth
                ? 'bg-[#00C471] text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1A3125]'
            }`}
          >
            {lvl.label}
          </button>
        ))}
      </div>

      <div className="w-px h-5 bg-slate-200 dark:bg-[#1A3125] mx-0.5" />

      {/* Bulk Expand / Collapse & Density */}
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={onExpandAll}
          title="Expand All Branches"
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1A3125] transition-colors cursor-pointer"
        >
          <ChevronDown className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onCollapseAll}
          title="Collapse to Roots"
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1A3125] transition-colors cursor-pointer"
        >
          <ChevronUp className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onToggleCompact}
          title={isCompact ? 'Switch to Standard Cards View' : 'Switch to Compact Chips View'}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            isCompact
              ? 'bg-emerald-500/15 text-[#00C471] font-bold'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1A3125]'
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
        </button>

        {onExportPng && (
          <button
            type="button"
            onClick={onExportPng}
            title="Export Org Chart as PNG"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1A3125] transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
          </button>
        )}

        <button
          type="button"
          onClick={onToggleFullscreen}
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1A3125] transition-colors cursor-pointer"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};

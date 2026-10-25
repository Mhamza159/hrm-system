/**
 * @file ScreenSkeleton.jsx
 * @description Unified, enterprise-grade loading skeleton for all screens in HRM.
 * Follows the Forest & Emerald design system with shimmering light reflections.
 */

import React from 'react';
import { Sparkles } from 'lucide-react';

export function ScreenSkeleton({
  variant = 'table', // 'table' | 'profile' | 'orgchart' | 'cards' | 'matrix'
  title = null,
  message = 'Retrieving live records from database...',
  rows = 5,
  cards = 6
}) {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Live Telemetry / Sync Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-white dark:bg-[#111D17] border border-slate-200/80 dark:border-[#1A3125] shadow-xs relative overflow-hidden">
        {/* Shimmer sweep */}
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 dark:via-emerald-400/5 to-transparent animate-shimmer pointer-events-none" />

        <div className="flex items-center gap-3">
          <div className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                {title || 'Database Synchronizing'}
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
                Fetching
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{message}</p>
          </div>
        </div>

        {/* Live Pulse Track */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          <div className="w-28 sm:w-36 h-1.5 rounded-full bg-slate-100 dark:bg-[#162820] overflow-hidden relative">
            <div className="h-full w-2/3 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full animate-pulse" />
          </div>
          <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">Syncing</span>
        </div>
      </div>

      {/* 2. Specific Screen Skeletons */}
      {variant === 'profile' && <ProfileSkeletonContent />}
      {variant === 'orgchart' && <OrgChartSkeletonContent />}
      {variant === 'cards' && <CardGridSkeletonContent count={cards} />}
      {variant === 'table' && <TablePageSkeletonContent rows={rows} />}
      {variant === 'matrix' && <MatrixSkeletonContent />}
    </div>
  );
}

// ============================================================================
// Variant: Profile Screen Skeleton (Employee Profile / My Profile)
// ============================================================================
function ProfileSkeletonContent() {
  return (
    <div className="space-y-6">
      {/* Profile Hero Card */}
      <div className="bg-white dark:bg-[#111D17] rounded-3xl p-6 border border-slate-200/80 dark:border-[#1A3125] shadow-sm relative overflow-hidden">
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 dark:via-emerald-400/5 to-transparent animate-shimmer pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {/* Avatar skeleton */}
            <div className="w-20 h-20 rounded-2xl bg-slate-200 dark:bg-[#1A3125] animate-pulse shrink-0" />
            <div className="space-y-2.5">
              <div className="flex items-center gap-3">
                <div className="h-6 w-48 bg-slate-200 dark:bg-[#1A3125] rounded-md animate-pulse" />
                <div className="h-5 w-20 bg-slate-100 dark:bg-[#162820] rounded-full animate-pulse" />
              </div>
              <div className="flex items-center gap-4">
                <div className="h-3.5 w-36 bg-slate-100 dark:bg-[#162820] rounded-md animate-pulse" />
                <div className="h-3.5 w-28 bg-slate-100 dark:bg-[#162820] rounded-md animate-pulse" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="h-9 w-24 bg-slate-100 dark:bg-[#162820] rounded-xl animate-pulse" />
            <div className="h-9 w-28 bg-slate-200 dark:bg-[#1A3125] rounded-xl animate-pulse" />
          </div>
        </div>
      </div>

      {/* Tabs Bar Skeleton */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-[#111D17] rounded-2xl border border-slate-200 dark:border-[#1A3125] overflow-x-auto">
        {[1, 2, 3, 4, 5].map((tab) => (
          <div
            key={tab}
            className="h-9 w-32 bg-white dark:bg-[#162820] rounded-xl animate-pulse shrink-0 border border-slate-200/40 dark:border-[#1E3A2B]/40"
          />
        ))}
      </div>

      {/* Profile Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white dark:bg-[#111D17] rounded-2xl p-6 border border-slate-200/80 dark:border-[#1A3125] shadow-xs relative overflow-hidden space-y-4">
          <div className="h-4 w-40 bg-slate-200 dark:bg-[#1A3125] rounded-md animate-pulse" />
          <div className="grid grid-cols-2 gap-4 pt-2">
            {[1, 2, 3, 4, 5, 6].map((field) => (
              <div key={field} className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-[#14261D]/40">
                <div className="h-3 w-20 bg-slate-200 dark:bg-[#1A3125] rounded-md animate-pulse" />
                <div className="h-4 w-32 bg-slate-100 dark:bg-[#162820] rounded-md animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-[#111D17] rounded-2xl p-6 border border-slate-200/80 dark:border-[#1A3125] shadow-xs relative overflow-hidden space-y-4">
          <div className="h-4 w-32 bg-slate-200 dark:bg-[#1A3125] rounded-md animate-pulse" />
          <div className="space-y-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-[#14261D]/40">
                <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-[#1A3125] animate-pulse" />
                <div className="space-y-1 flex-1">
                  <div className="h-3 w-24 bg-slate-200 dark:bg-[#1A3125] rounded-md animate-pulse" />
                  <div className="h-2.5 w-16 bg-slate-100 dark:bg-[#162820] rounded-md animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Variant: Org Chart Skeleton
// ============================================================================
function OrgChartSkeletonContent() {
  return (
    <div className="bg-white dark:bg-[#111D17] rounded-3xl p-8 border border-slate-200/80 dark:border-[#1A3125] shadow-xs relative overflow-hidden min-h-[480px] flex flex-col items-center justify-center">
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 dark:via-emerald-400/5 to-transparent animate-shimmer pointer-events-none" />

      {/* Root Node Skeleton */}
      <div className="w-64 p-4 rounded-2xl bg-slate-50 dark:bg-[#14261D] border-2 border-emerald-500/30 dark:border-emerald-600/30 shadow-xs flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-[#1A3125] animate-pulse shrink-0" />
        <div className="space-y-1.5 flex-1">
          <div className="h-3.5 w-28 bg-slate-200 dark:bg-[#1A3125] rounded-md animate-pulse" />
          <div className="h-2.5 w-20 bg-slate-100 dark:bg-[#162820] rounded-md animate-pulse" />
        </div>
      </div>

      {/* Tree Connector Line */}
      <div className="w-0.5 h-10 bg-slate-200 dark:bg-[#1A3125] my-1 animate-pulse" />

      {/* Horizontal Branch Line */}
      <div className="w-3/4 max-w-2xl h-0.5 bg-slate-200 dark:bg-[#1A3125] animate-pulse" />

      {/* Child Nodes Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-4 w-full max-w-3xl">
        {[1, 2, 3].map((node) => (
          <div
            key={node}
            className="p-4 rounded-2xl bg-slate-50 dark:bg-[#14261D] border border-slate-200/60 dark:border-[#1A3125] shadow-xs flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-[#1A3125] animate-pulse shrink-0" />
            <div className="space-y-1.5 flex-1">
              <div className="h-3.5 w-24 bg-slate-200 dark:bg-[#1A3125] rounded-md animate-pulse" />
              <div className="h-2.5 w-16 bg-slate-100 dark:bg-[#162820] rounded-md animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Variant: Card Grid Skeleton (My Team / Announcements)
// ============================================================================
function CardGridSkeletonContent({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-[#111D17] rounded-2xl p-5 border border-slate-200/80 dark:border-[#1A3125] shadow-xs relative overflow-hidden flex flex-col justify-between"
        >
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 dark:via-emerald-400/5 to-transparent animate-shimmer pointer-events-none" />

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-[#1A3125] animate-pulse shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="h-4 w-32 bg-slate-200 dark:bg-[#1A3125] rounded-md animate-pulse" />
              <div className="h-3 w-24 bg-slate-100 dark:bg-[#162820] rounded-md animate-pulse" />
            </div>
            <div className="h-5 w-14 bg-slate-100 dark:bg-[#162820] rounded-full animate-pulse" />
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-[#1A3125] flex items-center justify-between">
            <div className="h-3 w-28 bg-slate-100 dark:bg-[#162820] rounded-md animate-pulse" />
            <div className="h-7 w-20 bg-slate-100 dark:bg-[#162820] rounded-lg animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Variant: Standalone Table Skeleton (Payroll / Reports / Approvals)
// ============================================================================
function TablePageSkeletonContent({ rows = 6 }) {
  return (
    <div className="bg-white dark:bg-[#111D17] rounded-2xl border border-slate-200/80 dark:border-[#1A3125] shadow-xs relative overflow-hidden">
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 dark:via-emerald-400/5 to-transparent animate-shimmer pointer-events-none" />

      {/* Table Toolbar Skeleton */}
      <div className="p-4 border-b border-slate-100 dark:border-[#1A3125] flex items-center justify-between gap-4">
        <div className="h-9 w-64 bg-slate-100 dark:bg-[#162820] rounded-xl animate-pulse" />
        <div className="flex items-center gap-2">
          <div className="h-9 w-24 bg-slate-100 dark:bg-[#162820] rounded-xl animate-pulse" />
          <div className="h-9 w-20 bg-slate-100 dark:bg-[#162820] rounded-xl animate-pulse" />
        </div>
      </div>

      {/* Table Rows Skeleton */}
      <div className="divide-y divide-slate-100 dark:divide-[#1A3125]">
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div key={rIdx} className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-[#1A3125] animate-pulse shrink-0" />
              <div className="space-y-1.5 flex-1 max-w-xs">
                <div className="h-3.5 w-36 bg-slate-200 dark:bg-[#1A3125] rounded-md animate-pulse" />
                <div className="h-2.5 w-24 bg-slate-100 dark:bg-[#162820] rounded-md animate-pulse" />
              </div>
            </div>
            <div className="h-3.5 w-28 bg-slate-100 dark:bg-[#162820] rounded-md animate-pulse hidden md:block" />
            <div className="h-6 w-20 bg-slate-100 dark:bg-[#162820] rounded-full animate-pulse" />
            <div className="h-7 w-16 bg-slate-100 dark:bg-[#162820] rounded-lg animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Variant: Permissions Matrix Skeleton
// ============================================================================
function MatrixSkeletonContent() {
  return (
    <div className="bg-white dark:bg-[#111D17] rounded-2xl border border-slate-200/80 dark:border-[#1A3125] shadow-xs relative overflow-hidden p-6 space-y-6">
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 dark:via-emerald-400/5 to-transparent animate-shimmer pointer-events-none" />

      {[1, 2, 3, 4].map((module) => (
        <div key={module} className="space-y-3">
          <div className="h-4 w-44 bg-slate-200 dark:bg-[#1A3125] rounded-md animate-pulse" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((action) => (
              <div
                key={action}
                className="p-3 rounded-xl bg-slate-50 dark:bg-[#14261D]/50 border border-slate-100 dark:border-[#1A3125]/40 flex items-center justify-between"
              >
                <div className="h-3 w-20 bg-slate-200 dark:bg-[#1A3125] rounded-md animate-pulse" />
                <div className="w-4 h-4 rounded-md bg-slate-200 dark:bg-[#1A3125] animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * @file DashboardSkeleton.jsx
 * @description High-fidelity enterprise skeleton loader with Forest & Emerald shimmer design.
 * Renders role-tailored skeleton architecture matching live dashboard layouts.
 */

import React from 'react';
import { Activity, Sparkles } from 'lucide-react';

export function DashboardSkeleton({
  variant = 'admin',
  message = 'Aggregating live operational intelligence...'
}) {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Live Telemetry Status Bar */}
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
                Live Operational Telemetry
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
                Syncing
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{message}</p>
          </div>
        </div>

        {/* Pulsing micro progress track */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          <div className="w-28 sm:w-36 h-1.5 rounded-full bg-slate-100 dark:bg-[#162820] overflow-hidden relative">
            <div className="h-full w-2/3 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full animate-pulse" />
          </div>
          <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">Live</span>
        </div>
      </div>

      {/* 2. Top Metric KPI Row (4 Cards) */}
      {variant === 'employee' ? (
        <EmployeeTopCardsSkeleton />
      ) : (
        <StandardTopCardsSkeleton />
      )}

      {/* 3. Middle Visual Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Chart Skeleton: Attendance Trend */}
        <div className="bg-white dark:bg-[#111D17] rounded-2xl p-5 border border-slate-200/80 dark:border-[#1A3125] shadow-xs relative overflow-hidden flex flex-col">
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 dark:via-emerald-400/5 to-transparent animate-shimmer pointer-events-none" />

          {/* Chart Header */}
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-[#1A3125]">
            <div className="space-y-1.5">
              <div className="h-4 w-44 bg-slate-200 dark:bg-[#1A3125] rounded-md animate-pulse" />
              <div className="h-3 w-28 bg-slate-100 dark:bg-[#162820] rounded-md animate-pulse" />
            </div>
            <div className="h-7 w-20 bg-slate-100 dark:bg-[#162820] rounded-lg animate-pulse" />
          </div>

          {/* Chart Bars Skeleton Simulation */}
          <div className="h-60 flex items-end justify-between gap-3 pt-6 pb-2 px-3">
            {[45, 75, 60, 90, 80, 65, 88].map((height, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <div
                  className="w-full max-w-[36px] bg-gradient-to-t from-slate-200 to-slate-100 dark:from-emerald-950/40 dark:to-emerald-800/30 rounded-t-lg transition-all animate-pulse"
                  style={{ height: `${height}%` }}
                />
                <div className="h-2.5 w-6 bg-slate-100 dark:bg-[#162820] rounded-sm animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* Right Chart / Widget Skeleton */}
        {variant === 'admin' ? (
          <DeptDistributionSkeleton />
        ) : variant === 'hr' ? (
          <BirthdaysSkeleton />
        ) : variant === 'manager' ? (
          <TeamRosterSkeleton />
        ) : (
          <RecentActivitySkeleton />
        )}
      </div>

      {/* 4. Bottom Activity / Approvals / Notices Skeleton */}
      <BottomSectionSkeleton variant={variant} />
    </div>
  );
}

// ============================================================================
// Sub-components: Top Cards Skeletons
// ============================================================================

function StandardTopCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((item) => (
        <div
          key={item}
          className="bg-white dark:bg-[#111D17] rounded-2xl p-5 border border-slate-200/80 dark:border-[#1A3125] shadow-xs relative overflow-hidden"
        >
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 dark:via-emerald-400/5 to-transparent animate-shimmer pointer-events-none" />
          
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1 mr-3">
              <div className="h-3 w-24 bg-slate-200 dark:bg-[#1A3125] rounded-md animate-pulse" />
              <div className="h-7 w-28 bg-slate-200 dark:bg-[#1A3125] rounded-lg animate-pulse" />
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-[#162820] border border-slate-200/50 dark:border-[#1E3A2B] animate-pulse shrink-0" />
          </div>

          <div className="mt-4 flex items-center gap-2">
            <div className="h-4 w-12 bg-slate-100 dark:bg-[#162820] rounded-md animate-pulse" />
            <div className="h-3 w-32 bg-slate-100 dark:bg-[#162820] rounded-md animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmployeeTopCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Punch in hero card skeleton */}
      <div className="md:col-span-1 bg-white dark:bg-[#111D17] rounded-2xl p-5 border border-slate-200/80 dark:border-[#1A3125] shadow-xs relative overflow-hidden flex flex-col justify-between">
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 dark:via-emerald-400/5 to-transparent animate-shimmer pointer-events-none" />
        <div className="space-y-3">
          <div className="h-3.5 w-32 bg-slate-200 dark:bg-[#1A3125] rounded-md animate-pulse" />
          <div className="h-9 w-40 bg-slate-200 dark:bg-[#1A3125] rounded-lg animate-pulse" />
          <div className="h-3 w-48 bg-slate-100 dark:bg-[#162820] rounded-md animate-pulse" />
        </div>
        <div className="mt-5 h-11 w-full bg-slate-200 dark:bg-[#1A3125] rounded-xl animate-pulse" />
      </div>

      {/* 2 stat cards */}
      <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[1, 2].map((item) => (
          <div
            key={item}
            className="bg-white dark:bg-[#111D17] rounded-2xl p-5 border border-slate-200/80 dark:border-[#1A3125] shadow-xs relative overflow-hidden"
          >
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 dark:via-emerald-400/5 to-transparent animate-shimmer pointer-events-none" />
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="h-3 w-24 bg-slate-200 dark:bg-[#1A3125] rounded-md animate-pulse" />
                <div className="h-7 w-28 bg-slate-200 dark:bg-[#1A3125] rounded-lg animate-pulse" />
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-[#162820] border border-slate-200/50 dark:border-[#1E3A2B] animate-pulse" />
            </div>
            <div className="mt-4 h-3 w-36 bg-slate-100 dark:bg-[#162820] rounded-md animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Sub-components: Widget Skeletons
// ============================================================================

function DeptDistributionSkeleton() {
  return (
    <div className="bg-white dark:bg-[#111D17] rounded-2xl p-5 border border-slate-200/80 dark:border-[#1A3125] shadow-xs relative overflow-hidden">
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 dark:via-emerald-400/5 to-transparent animate-shimmer pointer-events-none" />
      
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-[#1A3125]">
        <div className="space-y-1.5">
          <div className="h-4 w-48 bg-slate-200 dark:bg-[#1A3125] rounded-md animate-pulse" />
          <div className="h-3 w-32 bg-slate-100 dark:bg-[#162820] rounded-md animate-pulse" />
        </div>
        <div className="h-7 w-16 bg-slate-100 dark:bg-[#162820] rounded-lg animate-pulse" />
      </div>

      <div className="space-y-4 pt-2">
        {[78, 55, 42, 28].map((width, idx) => (
          <div key={idx} className="space-y-1.5">
            <div className="flex justify-between">
              <div className="h-3 w-28 bg-slate-200 dark:bg-[#1A3125] rounded-md animate-pulse" />
              <div className="h-3 w-16 bg-slate-100 dark:bg-[#162820] rounded-md animate-pulse" />
            </div>
            <div className="h-3 w-full bg-slate-100 dark:bg-[#162820] rounded-full overflow-hidden">
              <div
                className="h-full bg-slate-200 dark:bg-emerald-900/40 rounded-full animate-pulse"
                style={{ width: `${width}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BirthdaysSkeleton() {
  return (
    <div className="bg-white dark:bg-[#111D17] rounded-2xl p-5 border border-slate-200/80 dark:border-[#1A3125] shadow-xs relative overflow-hidden">
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 dark:via-emerald-400/5 to-transparent animate-shimmer pointer-events-none" />

      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-[#1A3125]">
        <div className="h-4 w-40 bg-slate-200 dark:bg-[#1A3125] rounded-md animate-pulse" />
        <div className="h-5 w-14 bg-slate-100 dark:bg-[#162820] rounded-full animate-pulse" />
      </div>

      <div className="space-y-3.5">
        {[1, 2, 3].map((item) => (
          <div key={item} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-[#14261D]/60">
            <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-[#1A3125] shrink-0 animate-pulse" />
            <div className="space-y-1.5 flex-1">
              <div className="h-3 w-28 bg-slate-200 dark:bg-[#1A3125] rounded-md animate-pulse" />
              <div className="h-2.5 w-20 bg-slate-100 dark:bg-[#162820] rounded-md animate-pulse" />
            </div>
            <div className="h-5 w-16 bg-slate-200 dark:bg-[#1A3125] rounded-full animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

function TeamRosterSkeleton() {
  return (
    <div className="bg-white dark:bg-[#111D17] rounded-2xl p-5 border border-slate-200/80 dark:border-[#1A3125] shadow-xs relative overflow-hidden">
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 dark:via-emerald-400/5 to-transparent animate-shimmer pointer-events-none" />
      
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-[#1A3125]">
        <div className="h-4 w-36 bg-slate-200 dark:bg-[#1A3125] rounded-md animate-pulse" />
        <div className="h-6 w-20 bg-slate-100 dark:bg-[#162820] rounded-lg animate-pulse" />
      </div>

      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-[#1A3125]/60 last:border-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-[#1A3125] animate-pulse" />
              <div className="space-y-1">
                <div className="h-3 w-24 bg-slate-200 dark:bg-[#1A3125] rounded-md animate-pulse" />
                <div className="h-2.5 w-16 bg-slate-100 dark:bg-[#162820] rounded-md animate-pulse" />
              </div>
            </div>
            <div className="h-5 w-16 bg-slate-100 dark:bg-[#162820] rounded-full animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

function RecentActivitySkeleton() {
  return (
    <div className="bg-white dark:bg-[#111D17] rounded-2xl p-5 border border-slate-200/80 dark:border-[#1A3125] shadow-xs relative overflow-hidden">
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 dark:via-emerald-400/5 to-transparent animate-shimmer pointer-events-none" />
      
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-[#1A3125]">
        <div className="h-4 w-40 bg-slate-200 dark:bg-[#1A3125] rounded-md animate-pulse" />
        <div className="h-5 w-12 bg-slate-100 dark:bg-[#162820] rounded-md animate-pulse" />
      </div>

      <div className="space-y-3">
        {[1, 2, 3].map((item) => (
          <div key={item} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#14261D]/50">
            <div className="space-y-1.5">
              <div className="h-3.5 w-36 bg-slate-200 dark:bg-[#1A3125] rounded-md animate-pulse" />
              <div className="h-2.5 w-24 bg-slate-100 dark:bg-[#162820] rounded-md animate-pulse" />
            </div>
            <div className="h-6 w-20 bg-slate-200 dark:bg-[#1A3125] rounded-md animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Sub-components: Bottom Section Skeleton
// ============================================================================

function BottomSectionSkeleton({ variant }) {
  return (
    <div className="bg-white dark:bg-[#111D17] rounded-2xl p-5 border border-slate-200/80 dark:border-[#1A3125] shadow-xs relative overflow-hidden">
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 dark:via-emerald-400/5 to-transparent animate-shimmer pointer-events-none" />
      
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-[#1A3125]">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-md bg-slate-200 dark:bg-[#1A3125] animate-pulse" />
          <div className="h-4 w-44 bg-slate-200 dark:bg-[#1A3125] rounded-md animate-pulse" />
        </div>
        <div className="h-6 w-24 bg-slate-100 dark:bg-[#162820] rounded-lg animate-pulse" />
      </div>

      <div className="space-y-3">
        {[1, 2, 3].map((row) => (
          <div
            key={row}
            className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 dark:bg-[#14261D]/40 border border-slate-100 dark:border-[#1A3125]/40"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-[#1A3125] animate-pulse shrink-0" />
              <div className="space-y-1.5">
                <div className="h-3.5 w-48 bg-slate-200 dark:bg-[#1A3125] rounded-md animate-pulse" />
                <div className="h-2.5 w-32 bg-slate-100 dark:bg-[#162820] rounded-md animate-pulse" />
              </div>
            </div>
            <div className="h-6 w-20 bg-slate-200 dark:bg-[#1A3125] rounded-full animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

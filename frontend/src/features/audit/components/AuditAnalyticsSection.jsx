/**
 * @file AuditAnalyticsSection.jsx
 * @description Enterprise Analytics Visualizer with zero-dependency responsive charts.
 * Visualizes activity throughput, module distributions, and security alert trends.
 */

import React from 'react';
import {
  TrendingUp,
  Layers,
  ShieldAlert,
  Zap
} from 'lucide-react';
import { cn } from '../../../lib/utils.js';

export const AuditAnalyticsSection = ({
  analytics = {},
  timeRange = '7d',
  onTimeRangeChange,
  isLoading = false
}) => {
  const timeline = analytics.timeline || [];
  const moduleDistribution = analytics.moduleDistribution || [];
  const securityTrends = analytics.securityTrends || [];
  const actionDistribution = analytics.actionDistribution || [];

  const maxTimelineTotal = Math.max(...timeline.map((t) => t.total), 1);
  const totalModuleEvents = moduleDistribution.reduce((acc, m) => acc + m.count, 0) || 1;

  const timeRangeOptions = [
    { value: '24h', label: '24 Hours' },
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' }
  ];

  return (
    <div className="space-y-4">
      {/* Analytics Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border border-border/80 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">
              Audit Forensics & Activity Analytics
            </h3>
            <p className="text-xs text-muted-foreground">
              Real-time activity velocity, module distributions, and anomaly indicators.
            </p>
          </div>
        </div>

        {/* Time Range Pills */}
        <div className="flex items-center gap-1.5 bg-muted/50 p-1 rounded-xl border border-border">
          {timeRangeOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onTimeRangeChange(opt.value)}
              className={cn(
                'px-3 py-1 text-xs font-semibold rounded-lg transition-all',
                timeRange === opt.value
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 1. Activity Velocity Timeline */}
        <div className="lg:col-span-2 bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 font-semibold text-foreground">
              <Zap className="w-4 h-4 text-emerald-500" />
              <span>Activity Velocity ({timeRange.toUpperCase()})</span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                Success
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                Failure
              </span>
            </div>
          </div>

          {isLoading ? (
            <div className="h-48 flex items-center justify-center text-xs text-muted-foreground">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-2" />
              Calculating timeline aggregation...
            </div>
          ) : timeline.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-xs text-muted-foreground">
              No audit activities recorded in this time window.
            </div>
          ) : (
            <div className="h-48 flex items-end gap-1.5 sm:gap-2 pt-6 px-1">
              {timeline.map((point, idx) => {
                const totalHeightPct = Math.max(Math.round((point.total / maxTimelineTotal) * 100), 6);
                const successHeightPct = point.total > 0 ? (point.success / point.total) * 100 : 100;
                const dateLabel = String(point.date || '').slice(5); // e.g. 11-19

                return (
                  <div
                    key={idx}
                    className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end"
                  >
                    {/* Tooltip */}
                    <div className="absolute -top-12 z-20 hidden group-hover:flex flex-col items-center bg-popover text-popover-foreground text-[10px] py-1 px-2 rounded-lg shadow-xl border border-border whitespace-nowrap pointer-events-none">
                      <span className="font-bold">{point.date}</span>
                      <span>Total: {point.total} ({point.success} ok / {point.failure} err)</span>
                    </div>

                    {/* Stacked Bar */}
                    <div
                      style={{ height: `${totalHeightPct}%` }}
                      className="w-full max-w-[28px] rounded-t-md overflow-hidden flex flex-col justify-end bg-rose-500/80 transition-all duration-300 group-hover:brightness-110"
                    >
                      <div
                        style={{ height: `${successHeightPct}%` }}
                        className="w-full bg-emerald-500 transition-all duration-300"
                      />
                    </div>

                    {/* Date label */}
                    <span className="text-[9px] text-muted-foreground truncate w-full text-center">
                      {dateLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 2. Module Distribution */}
        <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 font-semibold text-foreground">
              <Layers className="w-4 h-4 text-blue-500" />
              <span>Module Distribution</span>
            </div>
            <span className="text-[11px] text-muted-foreground font-mono">
              {totalModuleEvents} events
            </span>
          </div>

          {isLoading ? (
            <div className="h-48 flex items-center justify-center text-xs text-muted-foreground">
              Loading module stats...
            </div>
          ) : moduleDistribution.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-xs text-muted-foreground">
              No module distribution data available.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[190px] overflow-y-auto pr-1">
              {moduleDistribution.map((item, idx) => {
                const pct = Math.round((item.count / totalModuleEvents) * 100);
                const colors = [
                  'bg-emerald-500',
                  'bg-blue-500',
                  'bg-indigo-500',
                  'bg-purple-500',
                  'bg-cyan-500',
                  'bg-amber-500',
                  'bg-rose-500'
                ];
                const colorClass = colors[idx % colors.length];

                return (
                  <div key={item.module} className="text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="capitalize font-medium text-foreground truncate max-w-[120px]">
                        {item.module}
                      </span>
                      <span className="font-mono text-muted-foreground text-[11px]">
                        {item.count} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        style={{ width: `${pct}%` }}
                        className={cn('h-full rounded-full transition-all duration-300', colorClass)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Security Alerts & Top Audited Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Security Anomaly Monitor */}
        <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <ShieldAlert className="w-4 h-4 text-amber-500" />
            <span>Security Alerts & Anomalies</span>
          </div>

          {securityTrends.length === 0 ? (
            <div className="p-4 text-center text-xs text-muted-foreground">
              Zero security alerts recorded in this time window.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {securityTrends.slice(0, 4).map((sec, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 flex flex-col justify-between"
                >
                  <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-semibold truncate">
                    {sec.action}
                  </span>
                  <span className="text-lg font-bold text-foreground mt-1">
                    {sec.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Audited Actions */}
        <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <Zap className="w-4 h-4 text-primary" />
            <span>Frequent Operational Actions</span>
          </div>

          <div className="flex flex-wrap gap-1.5 max-h-[85px] overflow-y-auto">
            {actionDistribution.slice(0, 8).map((act, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-muted/60 border border-border rounded-lg text-[11px] font-mono text-foreground"
              >
                <span>{act.action}</span>
                <span className="text-primary font-bold">({act.count})</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

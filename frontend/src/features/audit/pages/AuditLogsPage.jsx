/**
 * @file AuditLogsPage.jsx
 * @description Master Audit Trail & Forensic Monitoring Console.
 * 
 * SPECIFICATION:
 * - Module: X1 Security / Phase 31 Audit Log Overhaul
 * - CASL Permissions: audit.view, audit.analytics, audit.export
 */

import React, { useState } from 'react';
import {
  ShieldCheck,
  Activity,
  Download,
  Archive,
  Table,
  Clock,
  Users,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import {
  useGetAuditLogsQuery,
  useGetAuditStatsQuery,
  useGetAuditAnalyticsQuery
} from '../auditApi.js';
import { usePermission } from '../../../hooks/usePermission.js';
import { ScreenSkeleton } from '../../../components/common/ScreenSkeleton.jsx';
import { RefreshButton } from '../../../components/common/RefreshButton.jsx';
import { AuditStatsCards } from '../components/AuditStatsCards.jsx';
import { AuditAnalyticsSection } from '../components/AuditAnalyticsSection.jsx';
import { AuditLogFilterToolbar } from '../components/AuditLogFilterToolbar.jsx';
import { AuditLogTableView } from '../components/AuditLogTableView.jsx';
import { AuditLogTimelineView } from '../components/AuditLogTimelineView.jsx';
import { AuditLogUserActivityView } from '../components/AuditLogUserActivityView.jsx';
import { AuditLogDiffModal } from '../components/AuditLogDiffModal.jsx';
import { AuditExportModal } from '../components/AuditExportModal.jsx';
import { AuditRetentionModal } from '../components/AuditRetentionModal.jsx';
import { AUDIT_BUTTON_STYLES } from '../utils/auditTheme.js';
import { cn } from '../../../lib/utils.js';

export const AuditLogsPage = () => {
  const { can } = usePermission();

  const [viewMode, setViewMode] = useState('table'); // 'table' | 'timeline' | 'user'
  const [analyticsTimeRange, setAnalyticsTimeRange] = useState('7d');

  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    module: '',
    action: '',
    status: '',
    severity: '',
    category: '',
    startDate: '',
    endDate: '',
    search: ''
  });

  const [selectedLog, setSelectedLog] = useState(null);
  const [diffModalOpen, setDiffModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [retentionModalOpen, setRetentionModalOpen] = useState(false);

  // Queries
  const {
    data: logsResponse,
    isLoading: logsLoading,
    isFetching: logsFetching,
    isError: logsError,
    refetch: refetchLogs
  } = useGetAuditLogsQuery(filters);

  const {
    data: statsResponse,
    isLoading: statsLoading,
    refetch: refetchStats
  } = useGetAuditStatsQuery({
    module: filters.module || undefined,
    startDate: filters.startDate || undefined,
    endDate: filters.endDate || undefined
  });

  const {
    data: analyticsResponse,
    isLoading: analyticsLoading,
    refetch: refetchAnalytics
  } = useGetAuditAnalyticsQuery({
    timeRange: analyticsTimeRange,
    module: filters.module || undefined
  });

  const handleFilterChange = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleResetFilters = () => {
    setFilters({
      page: 1,
      limit: 20,
      module: '',
      action: '',
      status: '',
      severity: '',
      category: '',
      startDate: '',
      endDate: '',
      search: ''
    });
  };

  const handleViewDiff = (log) => {
    setSelectedLog(log);
    setDiffModalOpen(true);
  };

  const handleRefreshAll = () => {
    refetchLogs();
    refetchStats();
    refetchAnalytics();
  };

  const auditItems = logsResponse?.data || [];
  const meta = logsResponse?.meta || { total: 0, page: 1, limit: 20, totalPages: 1 };
  const stats = statsResponse?.data || {};
  const analytics = analyticsResponse?.data || {};

  if (logsLoading && !logsResponse) {
    return (
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        <ScreenSkeleton variant="table" />
      </div>
    );
  }

  // Permission checks
  const canExport = can('manage', 'all') || can('audit.export', 'AuditLog') || can('audit.export', 'all');
  const canViewAnalytics = can('manage', 'all') || can('audit.analytics', 'AuditLog') || can('audit.view', 'all');

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 text-primary rounded-2xl border border-primary/20">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Audit & Compliance Trails
            </h1>
            <p className="text-xs text-muted-foreground">
              Forensic inspection of immutable system records, operational diffs, and security events.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <RefreshButton onRefresh={handleRefreshAll} isFetching={logsFetching} />

          {/* Export Button (Permission Guarded) */}
          {canExport && (
            <button
              type="button"
              onClick={() => setExportModalOpen(true)}
              className={AUDIT_BUTTON_STYLES.secondary}
            >
              <Download className="w-3.5 h-3.5 text-[#00C471]" />
              <span>Export Records</span>
            </button>
          )}

          {/* Retention Policy Button */}
          <button
            type="button"
            onClick={() => setRetentionModalOpen(true)}
            className={AUDIT_BUTTON_STYLES.secondary}
          >
            <Archive className="w-3.5 h-3.5 text-indigo-500" />
            <span>Retention Policy</span>
          </button>

          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 text-xs font-bold rounded-xl border border-emerald-200 dark:border-emerald-500/20 shadow-xs">
            <Activity className="w-3.5 h-3.5" />
            <span>Immutable Ledger</span>
          </span>
        </div>
      </div>

      {/* 8-Card Metric Grid */}
      <AuditStatsCards stats={stats} isLoading={statsLoading} />

      {/* Analytics Visualizer (Guarded) */}
      {canViewAnalytics && (
        <AuditAnalyticsSection
          analytics={analytics}
          timeRange={analyticsTimeRange}
          onTimeRangeChange={setAnalyticsTimeRange}
          isLoading={analyticsLoading}
        />
      )}

      {/* Filter Toolbar */}
      <AuditLogFilterToolbar
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {/* Multi-View Header & Container */}
      <div className="bg-card border border-border/80 rounded-2xl shadow-sm overflow-hidden">
        {/* View Switcher Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-border bg-muted/20">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-foreground">Explorer View:</span>
            <div className="flex items-center gap-1 bg-muted p-1 rounded-xl border border-border">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer',
                  viewMode === 'table'
                    ? 'bg-card text-foreground shadow-xs border border-border/80'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                )}
              >
                <Table className="w-3.5 h-3.5 text-[#00C471]" />
                <span>Table</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('timeline')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer',
                  viewMode === 'timeline'
                    ? 'bg-card text-foreground shadow-xs border border-border/80'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                )}
              >
                <Clock className="w-3.5 h-3.5 text-blue-500" />
                <span>Timeline</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('user')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer',
                  viewMode === 'user'
                    ? 'bg-card text-foreground shadow-xs border border-border/80'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                )}
              >
                <Users className="w-3.5 h-3.5 text-purple-500" />
                <span>User Activity</span>
              </button>
            </div>
          </div>

          <div className="text-xs text-muted-foreground font-mono">
            Showing {auditItems.length} of {meta.total.toLocaleString()} records
          </div>
        </div>

        {/* View Content */}
        {logsLoading ? (
          <div className="p-12 text-center text-muted-foreground space-y-3">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            <p className="text-xs">Streaming audit log records from database...</p>
          </div>
        ) : logsError ? (
          <div className="p-8 text-center text-destructive space-y-2">
            <AlertCircle className="w-8 h-8 mx-auto" />
            <p className="font-semibold text-sm">Failed to retrieve audit records.</p>
            <button
              onClick={() => refetchLogs()}
              className="text-xs underline text-muted-foreground hover:text-foreground"
            >
              Try Again
            </button>
          </div>
        ) : auditItems.length === 0 ? (
          <div className="p-12 text-center text-xs text-muted-foreground">
            No audit log records match the selected filters.
          </div>
        ) : (
          <div>
            {viewMode === 'table' && (
              <AuditLogTableView items={auditItems} onInspect={handleViewDiff} />
            )}
            {viewMode === 'timeline' && (
              <AuditLogTimelineView items={auditItems} onInspect={handleViewDiff} />
            )}
            {viewMode === 'user' && (
              <AuditLogUserActivityView items={auditItems} onInspect={handleViewDiff} />
            )}

            {/* Pagination Controls */}
            {meta.totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-border bg-muted/10 text-xs">
                <span className="text-muted-foreground font-mono">
                  Page {meta.page} of {meta.totalPages} ({meta.total} total)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={meta.page <= 1}
                    onClick={() => handleFilterChange({ page: meta.page - 1 })}
                    className="p-1.5 rounded-lg border border-border text-foreground hover:bg-muted disabled:opacity-40 transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={meta.page >= meta.totalPages}
                    onClick={() => handleFilterChange({ page: meta.page + 1 })}
                    className="p-1.5 rounded-lg border border-border text-foreground hover:bg-muted disabled:opacity-40 transition"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Forensics Diff Modal */}
      <AuditLogDiffModal
        log={selectedLog}
        isOpen={diffModalOpen}
        onClose={() => {
          setDiffModalOpen(false);
          setSelectedLog(null);
        }}
      />

      {/* Export Modal */}
      <AuditExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        filters={filters}
      />

      {/* Retention Modal */}
      <AuditRetentionModal
        isOpen={retentionModalOpen}
        onClose={() => setRetentionModalOpen(false)}
      />
    </div>
  );
};

export default AuditLogsPage;

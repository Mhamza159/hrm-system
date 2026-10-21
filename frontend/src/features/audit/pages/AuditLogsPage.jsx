/**
 * @file AuditLogsPage.jsx
 * @description Master Audit Trail & Compliance Inspection Console.
 * 
 * SPECIFICATION:
 * - Module: X1 Security, Audit & Quality Gate (BUILD-GUIDE Section 14 · Row X1.1)
 * - CASL Permission: audit.view (Scope: 'all')
 */

import React, { useState } from 'react';
import { ShieldCheck, Eye, Activity, Database, AlertCircle } from 'lucide-react';
import { useGetAuditLogsQuery } from '../auditApi.js';
import { AuditLogFilterToolbar } from '../components/AuditLogFilterToolbar.jsx';
import { AuditLogDiffModal } from '../components/AuditLogDiffModal.jsx';
import { DataTable } from '../../../components/common/DataTable.jsx';
import { formatDate } from '../../../lib/formatters.js';

export const AuditLogsPage = () => {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    module: '',
    action: '',
    startDate: '',
    endDate: '',
    search: ''
  });

  const [selectedLog, setSelectedLog] = useState(null);
  const [diffModalOpen, setDiffModalOpen] = useState(false);

  const { data: response, isLoading, isError, refetch } = useGetAuditLogsQuery(filters);

  const handleFilterChange = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleResetFilters = () => {
    setFilters({
      page: 1,
      limit: 20,
      module: '',
      action: '',
      startDate: '',
      endDate: '',
      search: ''
    });
  };

  const handleViewDiff = (log) => {
    setSelectedLog(log);
    setDiffModalOpen(true);
  };

  const auditItems = response?.data || [];
  const meta = response?.meta || { total: 0, page: 1, limit: 20, totalPages: 1 };

  const columns = [
    {
      header: 'Timestamp (PKT)',
      key: 'createdAt',
      render: (row) => (
        <div>
          <div className="font-medium text-foreground text-xs">
            {formatDate(row.createdAt, 'DD MMM YYYY')}
          </div>
          <div className="text-[11px] text-muted-foreground">
            {formatDate(row.createdAt, 'HH:mm:ss')}
          </div>
        </div>
      )
    },
    {
      header: 'Actor',
      key: 'actorEmail',
      render: (row) => (
        <div>
          <div className="font-medium text-foreground text-xs truncate max-w-[180px]">
            {row.actorEmail}
          </div>
          <div className="text-[10px] uppercase font-semibold text-primary">
            {row.actorRole}
          </div>
        </div>
      )
    },
    {
      header: 'Action',
      key: 'action',
      render: (row) => (
        <span className="font-mono text-xs px-2 py-0.5 bg-muted border border-border rounded text-foreground">
          {row.action}
        </span>
      )
    },
    {
      header: 'Module / Target',
      key: 'module',
      render: (row) => (
        <div>
          <span className="text-xs font-semibold capitalize text-foreground">{row.module}</span>
          {row.targetModel && (
            <span className="text-[11px] text-muted-foreground ml-1.5 font-mono">
              ({row.targetModel})
            </span>
          )}
        </div>
      )
    },
    {
      header: 'Client IP',
      key: 'ipAddress',
      render: (row) => (
        <span className="text-xs font-mono text-muted-foreground">
          {row.ipAddress || 'Internal'}
        </span>
      )
    },
    {
      header: 'State Diff',
      key: 'diff',
      render: (row) => (
        <button
          onClick={() => handleViewDiff(row)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 rounded-md transition cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Inspect</span>
        </button>
      )
    }
  ];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
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
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-500 text-xs font-semibold rounded-full border border-emerald-500/20">
            <Activity className="w-3.5 h-3.5" />
            <span>Immutable Ledger</span>
          </span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <AuditLogFilterToolbar
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {/* Main Table */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground space-y-3">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            <p className="text-xs">Streaming audit log records from database...</p>
          </div>
        ) : isError ? (
          <div className="p-8 text-center text-destructive space-y-2">
            <AlertCircle className="w-8 h-8 mx-auto" />
            <p className="font-semibold text-sm">Failed to retrieve audit records.</p>
            <button
              onClick={() => refetch()}
              className="text-xs underline text-muted-foreground hover:text-foreground"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="p-2 sm:p-4">
            <DataTable
              columns={columns}
              data={auditItems}
              pagination={{
                page: meta.page || 1,
                limit: meta.limit || 20,
                totalDocs: meta.total || 0,
                totalPages: meta.totalPages || 1,
                onPageChange: (newPage) => handleFilterChange({ page: newPage })
              }}
              emptyMessage="No audit log records match the selected filters."
            />
          </div>
        )}
      </div>

      {/* Diff Modal */}
      <AuditLogDiffModal
        log={selectedLog}
        isOpen={diffModalOpen}
        onClose={() => {
          setDiffModalOpen(false);
          setSelectedLog(null);
        }}
      />
    </div>
  );
};

export default AuditLogsPage;

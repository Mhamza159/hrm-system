/**
 * @file LoginHistoryPage.jsx
 * @description Authentication Audit Trail & Login History View.
 * 
 * SPECIFICATION (BUILD-GUIDE Section 4 · Slice 1.12):
 * - Displays data-dense chronological log of authentication events.
 * - Formats all timestamps strictly into Asia/Karachi timezone.
 * - Shows codified status badges (SUCCESS, FAILED, LOCKED, 2FA_PENDING).
 * - Scoped automatically: Employees view own events, Super Admin / HR view company-wide audit.
 */

import React, { useState } from 'react';
import { ShieldAlert, RefreshCw, Monitor, Smartphone, Tablet, HelpCircle } from 'lucide-react';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { DataTable } from '../../../components/common/DataTable.jsx';
import { StatusBadge } from '../../../components/common/StatusBadge.jsx';
import { useGetLoginHistoryQuery } from '../authApi.js';
import { useAuth } from '../../../hooks/useAuth.js';

export default function LoginHistoryPage() {
  const { isHR, isSuperAdmin } = useAuth();
  const [page, setPage] = useState(1);
  const limit = 25;

  // Query login history audit log (always fresh on mount)
  const { data: historyResponse, isLoading, isFetching, refetch } = useGetLoginHistoryQuery(
    {
      page,
      limit
    },
    {
      refetchOnMountOrArgChange: true
    }
  );

  const docs = historyResponse?.data?.docs || [];
  const total = historyResponse?.data?.total || 0;
  const totalPages = historyResponse?.data?.totalPages || 1;

  // Status mapping to StatusBadge keys
  const getStatusMapping = (status) => {
    switch (status) {
      case 'SUCCESS':
        return { status: 'active', label: 'Success' };
      case 'FAILED':
        return { status: 'rejected', label: 'Failed' };
      case 'LOCKED':
        return { status: 'late', label: 'Locked' };
      case '2FA_PENDING':
        return { status: 'pending', label: '2FA Challenged' };
      default:
        return { status: 'inactive', label: status };
    }
  };

  // Device icon helper
  const renderDeviceIcon = (deviceType) => {
    switch (deviceType) {
      case 'MOBILE':
        return <Smartphone className="w-3.5 h-3.5 text-[#94A3B8]" />;
      case 'TABLET':
        return <Tablet className="w-3.5 h-3.5 text-[#94A3B8]" />;
      case 'DESKTOP':
        return <Monitor className="w-3.5 h-3.5 text-[#94A3B8]" />;
      default:
        return <HelpCircle className="w-3.5 h-3.5 text-[#64748B]" />;
    }
  };

  // Table columns definition
  const columns = [
    {
      key: 'createdAt',
      label: 'Timestamp (PKT)',
      sortable: true,
      render: (row) => {
        const date = new Date(row.createdAt);
        const formatted = date.toLocaleString('en-GB', {
          timeZone: 'Asia/Karachi',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        });

        return (
          <div className="font-mono text-xs text-slate-800 dark:text-slate-100">
            <span className="font-semibold">{formatted}</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 block">Asia/Karachi</span>
          </div>
        );
      }
    },
    {
      key: 'email',
      label: 'Account Identity',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-[11px] font-bold text-[#00C471]">
            {row.email ? row.email.charAt(0).toUpperCase() : 'U'}
          </div>
          <span className="font-semibold text-slate-800 dark:text-slate-100 text-xs">{row.email}</span>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (row) => {
        const { status, label } = getStatusMapping(row.status);
        return <StatusBadge status={status} label={label} />;
      }
    },
    {
      key: 'ipAddress',
      label: 'IP Origin',
      render: (row) => (
        <span className="font-mono text-xs text-slate-600 dark:text-slate-300">
          {row.ipAddress || '127.0.0.1'}
        </span>
      )
    },
    {
      key: 'deviceType',
      label: 'Client Device',
      render: (row) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
          {renderDeviceIcon(row.deviceType)}
          <span className="capitalize font-medium">{String(row.deviceType).toLowerCase()}</span>
        </div>
      )
    },
    {
      key: 'failureReason',
      label: 'Notes / Failure Reason',
      render: (row) => (
        <span className="text-xs">
          {row.failureReason ? (
            <span className="text-rose-500 font-medium">{row.failureReason}</span>
          ) : (
            <span className="text-slate-400">—</span>
          )}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Authentication Audit Log"
        description={
          isHR || isSuperAdmin
            ? 'Company-wide authentication logs, lockout occurrences, and security challenge records'
            : 'Personal account login records and security activity trail'
        }
        actions={
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-[#15241C] shadow-xs transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            <span>Refresh Log</span>
          </button>
        }
      />

      {/* Audit Log Table */}
      <DataTable
        columns={columns}
        data={docs}
        isLoading={isLoading}
        searchPlaceholder="Filter logs by email or status..."
        emptyMessage="No authentication events recorded"
        pagination={{
          page,
          totalPages,
          totalDocs: total,
          limit,
          onPageChange: (newPage) => setPage(newPage)
        }}
      />
    </div>
  );
}

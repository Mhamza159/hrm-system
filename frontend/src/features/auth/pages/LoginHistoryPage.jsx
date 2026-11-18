/**
 * @file LoginHistoryPage.jsx
 * @description Authentication Audit Trail & Login History View.
 * 
 * SPECIFICATION (Phase 24):
 * - Displays data-dense chronological log of authentication events with full audit metadata.
 * - Formats all timestamps strictly into Asia/Karachi timezone.
 * - Shows codified status badges (SUCCESS, FAILED, LOCKED, 2FA_PENDING, RESTRICTED).
 * - KPI Summary Stat Cards & Filter Toolbar with date presets, status pills, and CSV export.
 * - Scoped automatically: Employees view own events, Super Admin / HR view company-wide audit.
 * - Detailed attempt inspection modal with threat correlation.
 */

import React, { useState } from 'react';
import {
  RefreshCw,
  Monitor,
  Smartphone,
  Tablet,
  HelpCircle,
  Eye,
  Globe
} from 'lucide-react';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { DataTable } from '../../../components/common/DataTable.jsx';
import { StatusBadge } from '../../../components/common/StatusBadge.jsx';
import { RoleBadge } from '../../../components/common/RoleBadge.jsx';
import { useGetLoginHistoryQuery, useGetLoginHistoryStatsQuery } from '../authApi.js';
import { useAuth } from '../../../hooks/useAuth.js';
import { usePermission } from '../../../hooks/usePermission.js';
import { LoginHistoryStatsCards } from '../components/LoginHistoryStatsCards.jsx';
import { LoginHistoryFilterBar } from '../components/LoginHistoryFilterBar.jsx';
import { SecurityAlertBanner } from '../components/SecurityAlertBanner.jsx';
import { LoginDetailModal } from '../components/LoginDetailModal.jsx';

export default function LoginHistoryPage() {
  const { isHR, isSuperAdmin } = useAuth();
  const { can } = usePermission();
  const canViewAll = isSuperAdmin || isHR || can('login.history', 'all');

  const [page, setPage] = useState(1);
  const limit = 20;

  // Filter state
  const [filters, setFilters] = useState({
    search: '',
    status: 'ALL',
    deviceType: 'ALL',
    datePreset: 'ALL',
    startDate: '',
    endDate: ''
  });

  // Modal inspection state
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Update filter helper (resets page to 1)
  const handleFilterChange = (updates) => {
    setFilters((prev) => ({ ...prev, ...updates }));
    setPage(1);
  };

  // Reset filters helper
  const handleResetFilters = () => {
    setFilters({
      search: '',
      status: 'ALL',
      deviceType: 'ALL',
      datePreset: 'ALL',
      startDate: '',
      endDate: ''
    });
    setPage(1);
  };

  // Fetch KPI Stats
  const { data: statsResponse, isLoading: isStatsLoading, refetch: refetchStats } =
    useGetLoginHistoryStatsQuery(
      {
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined
      },
      { refetchOnMountOrArgChange: true }
    );
  const stats = statsResponse?.data || {};

  // Fetch Paginated Logs
  const queryParams = {
    page,
    limit,
    search: filters.search || undefined,
    status: filters.status !== 'ALL' ? filters.status : undefined,
    deviceType: filters.deviceType !== 'ALL' ? filters.deviceType : undefined,
    startDate: filters.startDate || undefined,
    endDate: filters.endDate || undefined,
    sortBy: 'newest',
    sortOrder: 'desc'
  };

  const {
    data: historyResponse,
    isLoading: isHistoryLoading,
    isFetching,
    refetch: refetchHistory
  } = useGetLoginHistoryQuery(queryParams, {
    refetchOnMountOrArgChange: true
  });

  const docs = historyResponse?.data?.docs || [];
  const total = historyResponse?.data?.total || 0;
  const totalPages = historyResponse?.data?.totalPages || 1;

  const handleRefresh = () => {
    refetchHistory();
    refetchStats();
  };

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
      case 'RESTRICTED':
      case 'BLOCKED':
        return { status: 'rejected', label: 'Blocked' };
      default:
        return { status: 'inactive', label: status || 'Unknown' };
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
        if (isNaN(date.getTime())) {
          return <span className="text-xs text-slate-400">—</span>;
        }

        const dateStr = date.toLocaleDateString('en-GB', {
          timeZone: 'Asia/Karachi',
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });

        const timeStr = date.toLocaleTimeString('en-GB', {
          timeZone: 'Asia/Karachi',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        });

        return (
          <div className="font-mono text-xs text-slate-800 dark:text-slate-100">
            <span className="font-semibold block">{dateStr}</span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
              {timeStr}
            </span>
          </div>
        );
      }
    },
    {
      key: 'account',
      label: 'Account Identity',
      sortable: true,
      render: (row) => {
        const resolvedName =
          row.employeeName && row.employeeName !== 'Unregistered Account'
            ? row.employeeName
            : row.email
            ? row.email.split('@')[0]
            : 'Unregistered Account';
        const initial = (resolvedName || 'U').charAt(0).toUpperCase();

        return (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-xs font-bold text-[#00C471] shrink-0">
              {initial}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-800 dark:text-slate-100 text-xs truncate">
                  {resolvedName}
                </span>
                {row.employeeCode && (
                  <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-slate-100 dark:bg-[#1A3125] text-slate-500 dark:text-slate-400 shrink-0">
                    {row.employeeCode}
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono block truncate">
                {row.email || '—'}
              </span>
            </div>
          </div>
        );
      }
    },
    {
      key: 'role',
      label: 'Role / Dept',
      render: (row) => (
        <div className="space-y-0.5">
          {row.role ? (
            <RoleBadge role={row.role} size="sm" />
          ) : (
            <span className="text-xs text-slate-400">—</span>
          )}
          {row.department && (
            <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
              {row.department}
            </span>
          )}
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
        <div className="space-y-0.5 font-mono text-xs">
          <span className="text-slate-700 dark:text-slate-300 font-semibold block">
            {row.ipAddress || '127.0.0.1'}
          </span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
            <Globe className="w-2.5 h-2.5 text-slate-400" />
            <span>{row.location || 'Local Net'}</span>
          </span>
        </div>
      )
    },
    {
      key: 'client',
      label: 'Client Environment',
      render: (row) => (
        <div className="text-xs text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-1.5 font-medium">
            {renderDeviceIcon(row.deviceType)}
            <span className="capitalize">{String(row.deviceType || 'unknown').toLowerCase()}</span>
            <span className="text-slate-400">·</span>
            <span>{row.browser || 'Browser'}</span>
          </div>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
            {row.os || 'Unknown OS'}
          </span>
        </div>
      )
    },
    {
      key: 'failureReason',
      label: 'Notice / Reason',
      render: (row) => {
        if (!row.failureReason) {
          return <span className="text-slate-400">—</span>;
        }
        let colorClass = 'text-rose-500 font-medium';
        if (row.status === 'SUCCESS') {
          colorClass = 'text-[#00C471] dark:text-[#00C471] font-medium';
        } else if (row.status === '2FA_PENDING') {
          colorClass = 'text-amber-500 dark:text-amber-400 font-medium';
        }
        return <span className={`text-xs ${colorClass}`}>{row.failureReason}</span>;
      }
    },
    {
      key: 'actions',
      label: '',
      align: 'right',
      render: (row) => (
        <button
          type="button"
          onClick={() => {
            setSelectedRecord(row);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200 dark:border-[#1A3125] text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:text-[#00C471] hover:border-[#00C471] transition-all cursor-pointer"
          title="Inspect attempt details"
        >
          <Eye className="w-3 h-3" />
          <span>Inspect</span>
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title={canViewAll ? 'Authentication Audit Log' : 'My Login Activity & Security'}
        description={
          canViewAll
            ? 'Company-wide authentication logs, lockout occurrences, device environments, and security audit trail.'
            : 'Personal account login records, client devices, and authentication activity trail.'
        }
        actions={
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isFetching}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-[#15241C] shadow-xs transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-[#00C471]' : ''}`} />
            <span>Refresh Log</span>
          </button>
        }
      />

      {/* KPI Stats Cards */}
      <LoginHistoryStatsCards stats={stats} isLoading={isStatsLoading} />

      {/* Security Alert Banner (Lockout Warning) */}
      {canViewAll && (
        <SecurityAlertBanner
          lockedCount={stats.lockedAttempts || 0}
          onFilterLocked={() => handleFilterChange({ status: 'LOCKED' })}
        />
      )}

      {/* Filter Toolbar */}
      <div className="rounded-2xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] p-4 shadow-xs">
        <LoginHistoryFilterBar
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={handleResetFilters}
          totalRecords={total}
          canExport={canViewAll}
        />
      </div>

      {/* Primary Audit Log Table */}
      <DataTable
        columns={columns}
        data={docs}
        isLoading={isHistoryLoading}
        emptyMessage="No authentication events matching your criteria"
        pagination={{
          page,
          totalPages,
          totalDocs: total,
          limit,
          onPageChange: (newPage) => setPage(newPage)
        }}
      />

      {/* Attempt Inspection Modal */}
      <LoginDetailModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedRecord(null);
        }}
        recordId={selectedRecord?._id}
        initialRecord={selectedRecord}
      />
    </div>
  );
}

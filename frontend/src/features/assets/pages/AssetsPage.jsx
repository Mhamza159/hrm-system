/**
 * @file AssetsPage.jsx
 * @description Master Asset Inventory & Equipment Registry Dashboard with Active/Archive Lifecycle.
 * 
 * SPECIFICATION & DESIGN:
 * - Module: M23 Asset Management (BUILD-GUIDE Section 20 · Rows 23.1 to 23.4)
 * - Design System: Forest & Emerald (#111D17 dark surface, #1A3125 dark border, #00C471 emerald accent).
 * - Active & Archive Tabs: Live counters and dedicated data views.
 * - Critical Business Rule: If an asset has an active custodian assigned, it CANNOT be deleted.
 *   Enforced in both frontend UI (locked/disabled controls with clear explanations) and backend API.
 * - PBAC/RBAC: All actions wrapped in permission checks (`asset.manage`, `asset.create`, `asset.assign`).
 */

import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Laptop,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Wrench,
  Archive,
  ChevronRight,
  ShieldAlert,
  UserCheck,
  PackageCheck,
  Building2,
  Briefcase,
  Layers,
  ArrowUpRight,
  RotateCcw,
  Trash2,
  Lock,
  Tag,
  Eye,
  ShieldCheck,
  XCircle
} from 'lucide-react';
import {
  useGetAssetsQuery,
  useDeleteAssetMutation,
  useRestoreAssetMutation,
  usePermanentDeleteAssetMutation,
  useUpdateAssetRepairMutation
} from '../assetApi.js';
import { AssetFormModal } from '../components/AssetFormModal.jsx';
import { AssetAssignModal } from '../components/AssetAssignModal.jsx';
import { AssetReturnModal } from '../components/AssetReturnModal.jsx';
import { AssetRepairModal } from '../components/AssetRepairModal.jsx';
import { AssetDetailModal } from '../components/AssetDetailModal.jsx';
import { AssetArchiveDetailModal } from '../components/AssetArchiveDetailModal.jsx';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog.jsx';
import { usePermission } from '../../../hooks/usePermission.js';
import { Can } from '../../../components/common/Can.jsx';
import { ScreenSkeleton } from '../../../components/common/ScreenSkeleton.jsx';
import { RefreshButton } from '../../../components/common/RefreshButton.jsx';
import { formatDate } from '../../../lib/formatters.js';
import { toast } from 'sonner';

export const AssetsPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { can } = usePermission();

  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'archive'
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [expiringSoon, setExpiringSoon] = useState(() => searchParams.get('expiringSoon') === 'true');

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [assigningAsset, setAssigningAsset] = useState(null);
  const [returningAsset, setReturningAsset] = useState(null);
  const [repairingAsset, setRepairingAsset] = useState(null);
  const [inspectingAsset, setInspectingAsset] = useState(null);
  const [inspectingArchiveAsset, setInspectingArchiveAsset] = useState(null);
  const [assetToDelete, setAssetToDelete] = useState(null);
  const [repairToCompleteAsset, setRepairToCompleteAsset] = useState(null);

  // Queries & Mutations
  const { data: assetsRes, isLoading, isFetching, refetch } = useGetAssetsQuery({
    page,
    limit: 15,
    search: search.trim() || undefined,
    status: activeTab === 'active' && statusFilter !== 'all' ? statusFilter : undefined,
    type: typeFilter !== 'all' ? typeFilter : undefined,
    expiringSoon: expiringSoon ? 'true' : undefined,
    archived: activeTab === 'archive' ? 'true' : undefined
  });

  const [deleteAsset, { isLoading: isDeleting }] = useDeleteAssetMutation();
  const [restoreAsset, { isLoading: isRestoring }] = useRestoreAssetMutation();
  const [permanentDeleteAsset, { isLoading: isPermanentDeleting }] = usePermanentDeleteAssetMutation();
  const [updateAssetRepair, { isLoading: isCompletingRepair }] = useUpdateAssetRepairMutation();

  const assets = assetsRes?.data || [];
  const meta = assetsRes?.meta || { page: 1, limit: 15, total: 0, pages: 1 };
  const stats = meta?.stats || {
    total: 0,
    available: 0,
    assigned: 0,
    inRepair: 0,
    archived: 0
  };

  if (isLoading && !assetsRes) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <ScreenSkeleton variant="table" />
      </div>
    );
  }

  // Soft delete handler
  const handleConfirmDelete = async () => {
    if (!assetToDelete) return;

    if (assetToDelete.status === 'assigned' || assetToDelete.assignedTo) {
      toast.error('Cannot delete an assigned asset. Please return it to inventory first.');
      setAssetToDelete(null);
      return;
    }

    try {
      await deleteAsset(assetToDelete._id).unwrap();
      toast.success(`Asset '${assetToDelete.assetTag}' moved to archive.`);
      setAssetToDelete(null);
    } catch (err) {
      toast.error(err?.data?.message || err?.message || 'Failed to archive asset.');
    }
  };

  // Revert handler
  const handleRevert = async (asset) => {
    try {
      await restoreAsset(asset._id).unwrap();
      toast.success(`Asset '${asset.assetTag}' reverted back to active inventory.`);
      setInspectingArchiveAsset(null);
    } catch (err) {
      toast.error(err?.data?.message || err?.message || 'Failed to revert asset.');
    }
  };

  // Permanent delete handler
  const handlePermanentDelete = async (asset) => {
    if (asset.status === 'assigned' || asset.assignedTo) {
      toast.error('Forbidden: Assigned asset cannot be permanently deleted.');
      return;
    }

    try {
      await permanentDeleteAsset(asset._id).unwrap();
      toast.success(`Asset '${asset.assetTag}' permanently deleted from registry.`);
      setInspectingArchiveAsset(null);
    } catch (err) {
      toast.error(err?.data?.message || err?.message || 'Failed to delete asset permanently.');
    }
  };

  // Complete repair and restore to inventory
  const handleConfirmCompleteRepair = async () => {
    if (!repairToCompleteAsset) return;
    try {
      const activeRepair = repairToCompleteAsset.repairs?.slice()?.reverse()?.find((r) => r.status === 'in_progress');
      const repairId = activeRepair?._id || 'latest';

      await updateAssetRepair({
        id: repairToCompleteAsset._id,
        repairId,
        status: 'completed',
        resolutionNotes: 'Repairs completed and equipment verified operational.'
      }).unwrap();

      toast.success(`Asset '${repairToCompleteAsset.assetTag}' repair completed. Returned to inventory.`);
      setRepairToCompleteAsset(null);
      if (inspectingAsset?._id === repairToCompleteAsset._id) {
        setInspectingAsset(null);
      }
    } catch (err) {
      toast.error(err?.data?.message || err?.message || 'Failed to complete repair.');
    }
  };

  const renderStatusBadge = (status, hasOpenIssue) => {
    if (hasOpenIssue) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50">
          <AlertTriangle className="w-3 h-3 text-rose-500 animate-pulse" />
          <span>Open Defect</span>
        </span>
      );
    }

    switch (status) {
      case 'available':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
            <CheckCircle2 className="w-3 h-3 text-[#00C471]" />
            <span>Available</span>
          </span>
        );
      case 'assigned':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800/60">
            <Clock className="w-3 h-3 text-cyan-500" />
            <span>Assigned</span>
          </span>
        );
      case 'under_repair':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
            <Wrench className="w-3 h-3 text-amber-500" />
            <span>In Repair</span>
          </span>
        );
      case 'retired':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <Archive className="w-3 h-3 text-slate-400" />
            <span>Retired</span>
          </span>
        );
      case 'lost':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50">
            <XCircle className="w-3 h-3 text-rose-500" />
            <span>Lost / Stolen</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-[#162820] text-emerald-600 dark:text-[#00C471] flex items-center justify-center border border-emerald-100 dark:border-[#1A3125]">
              <Laptop className="w-5 h-5 text-[#00C471]" />
            </div>
            <span>Asset Register & Equipment</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Centrally catalog, assign, monitor lifecycle, and track warranties of company hardware and software.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <RefreshButton onRefresh={refetch} isFetching={isFetching} />
          <Can I={['asset.create', 'create']} a="Asset">
            <button
              onClick={() => {
                setEditingAsset(null);
                setIsFormModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[#00C471] hover:bg-[#049856] text-white shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Register New Asset</span>
            </button>
          </Can>
        </div>
      </div>

      {/* KPI Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Active</span>
            <PackageCheck className="w-4 h-4 text-[#00C471]" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
            {stats.total}
          </p>
          <span className="text-[11px] text-slate-400">Live operational items</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Available</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
            {stats.available}
          </p>
          <span className="text-[11px] text-slate-400">Ready for allocation</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">In Custody</span>
            <Clock className="w-4 h-4 text-cyan-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
            {stats.assigned}
          </p>
          <span className="text-[11px] text-slate-400">With employees</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Archived Pool</span>
            <Archive className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
            {stats.archived || 0}
          </p>
          <span className="text-[11px] text-slate-400">Decommissioned items</span>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl overflow-hidden shadow-2xs">
        {/* Navigation Tabs (Active vs Archive) & Toolbar */}
        <div className="p-4 border-b border-slate-100 dark:border-[#1A3125] flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50 dark:bg-[#0B1511]/50">
          {/* Active / Archive Switcher */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-[#162820] rounded-xl border border-slate-200 dark:border-[#1A3125] w-fit">
            <button
              onClick={() => {
                setActiveTab('active');
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center gap-2 cursor-pointer ${
                activeTab === 'active'
                  ? 'bg-white dark:bg-[#111D17] text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <span>Active Assets</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeTab === 'active'
                  ? 'bg-emerald-100 dark:bg-[#162820] text-emerald-700 dark:text-[#00C471]'
                  : 'bg-slate-200 dark:bg-[#0B1511] text-slate-500'
              }`}>
                {stats.total}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('archive');
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center gap-2 cursor-pointer ${
                activeTab === 'archive'
                  ? 'bg-white dark:bg-[#111D17] text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <span>Archive Bucket</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeTab === 'archive'
                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400'
                  : 'bg-slate-200 dark:bg-[#0B1511] text-slate-500'
              }`}>
                {stats.archived || 0}
              </span>
            </button>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tag, name, serial..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-[#00C471] focus:ring-1 focus:ring-[#00C471]"
              />
            </div>

            {/* Category Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-xl text-slate-700 dark:text-slate-300 focus:outline-hidden focus:border-[#00C471]"
            >
              <option value="all">All Types</option>
              <option value="laptop">Laptops</option>
              <option value="desktop">Desktops</option>
              <option value="monitor">Monitors</option>
              <option value="smartphone">Smartphones</option>
              <option value="software_license">Software Licenses</option>
              <option value="network_device">Network Devices</option>
              <option value="printer">Printers</option>
              <option value="other">Other</option>
            </select>

            {/* Status Filter (Active Tab only) */}
            {activeTab === 'active' && (
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-xl text-slate-700 dark:text-slate-300 focus:outline-hidden focus:border-[#00C471]"
              >
                <option value="all">All Statuses</option>
                <option value="available">Available</option>
                <option value="assigned">Assigned</option>
                <option value="under_repair">In Repair</option>
                <option value="retired">Retired</option>
              </select>
            )}
          </div>
        </div>

        {/* Data Table */}
        {assets.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-[#162820] text-slate-400 flex items-center justify-center mx-auto border border-slate-200 dark:border-[#1A3125]">
              <PackageCheck className="w-6 h-6 text-[#00C471]" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {activeTab === 'active' ? 'No active assets found' : 'Archive bucket is empty'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {activeTab === 'active'
                ? 'Try adjusting your search criteria or register a new company asset above.'
                : 'Decommissioned equipment will be kept safely in this audit bucket.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-[#1A3125] text-slate-400 dark:text-slate-500 bg-slate-50/70 dark:bg-[#0B1511]/70 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Asset Tag & Category</th>
                  <th className="py-3 px-4">Device / Asset Name</th>
                  <th className="py-3 px-4">Serial Number</th>
                  <th className="py-3 px-4">{activeTab === 'active' ? 'Current Custodian' : 'Last Known Custodian'}</th>
                  <th className="py-3 px-4">{activeTab === 'active' ? 'Status' : 'Archived Date'}</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#1A3125]">
                {assets.map((asset) => {
                  const custodian = asset.assignedTo;
                  const custodianName = custodian
                    ? (custodian.name || `${custodian.firstName || ''} ${custodian.lastName || ''}`.trim() || custodian.employeeCode)
                    : null;
                  const isAssigned = asset.status === 'assigned' || Boolean(custodian);

                  return (
                    <tr
                      key={asset._id}
                      onClick={() => {
                        if (activeTab === 'active') {
                          setInspectingAsset(asset);
                        } else {
                          setInspectingArchiveAsset(asset);
                        }
                      }}
                      className="hover:bg-slate-50/80 dark:hover:bg-[#162820]/50 transition-colors cursor-pointer group"
                    >
                      {/* Asset Tag & Category */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            {asset.assetTag}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-400 capitalize">
                            {asset.type?.replace('_', ' ') || 'Hardware'}
                          </span>
                        </div>
                      </td>

                      {/* Name & Model */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white group-hover:text-[#00C471] transition-colors">
                          {asset.name}
                        </div>
                        {asset.modelNumber && (
                          <div className="text-[11px] text-slate-400">
                            Model: {asset.modelNumber}
                          </div>
                        )}
                      </td>

                      {/* Serial Number */}
                      <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300 tabular-nums">
                        {asset.serialNumber || '—'}
                      </td>

                      {/* Custodian */}
                      <td className="py-3 px-4">
                        {custodian ? (
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold flex items-center justify-center border border-emerald-300 dark:border-emerald-800 text-[10px] shrink-0">
                              {custodian.avatar ? (
                                <img src={custodian.avatar} alt={custodianName} className="w-full h-full rounded-full object-cover" />
                              ) : (
                                custodianName?.slice(0, 2).toUpperCase() || 'EMP'
                              )}
                            </div>
                            <div className="truncate">
                              <span className="font-medium text-slate-800 dark:text-slate-200 truncate block">
                                {custodianName}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400">
                                {custodian.employeeCode}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500">
                            Unassigned
                          </span>
                        )}
                      </td>

                      {/* Status / Archived Date */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {activeTab === 'active' ? (
                          renderStatusBadge(asset.status, asset.hasOpenIssue)
                        ) : (
                          <span className="font-mono text-slate-500">
                            {formatDate(asset.updatedAt)}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          {activeTab === 'active' ? (
                            <>
                              {/* Assign action */}
                              {can('asset.assign') && asset.status === 'available' && (
                                <button
                                  onClick={() => setAssigningAsset(asset)}
                                  title="Assign to custodian"
                                  className="px-2 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 hover:bg-emerald-100 transition-colors cursor-pointer"
                                >
                                  Assign
                                </button>
                              )}

                              {/* Return action */}
                              {can('asset.assign') && asset.status === 'assigned' && (
                                <button
                                  onClick={() => setReturningAsset(asset)}
                                  title="Return asset to inventory"
                                  className="px-2 py-1 rounded-lg text-xs font-semibold bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-400 hover:bg-cyan-100 transition-colors cursor-pointer"
                                >
                                  Return
                                </button>
                              )}

                              {/* Repair action */}
                              {can('asset.manage') && asset.status !== 'under_repair' && (
                                <button
                                  onClick={() => setRepairingAsset(asset)}
                                  title="Send for service repair"
                                  className="p-1 rounded-lg text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-[#162820] transition-colors cursor-pointer"
                                >
                                  <Wrench className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Complete Repair action */}
                              {can('asset.manage') && asset.status === 'under_repair' && (
                                <button
                                  onClick={() => setRepairToCompleteAsset(asset)}
                                  title="Mark repair completed and return to inventory"
                                  className="px-2 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-[#00C471] hover:bg-emerald-100 dark:hover:bg-[#162820] border border-emerald-200 dark:border-[#1A3125] transition-colors cursor-pointer flex items-center gap-1 shrink-0 shadow-xs"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5 text-[#00C471]" />
                                  <span>Complete Repair</span>
                                </button>
                              )}

                              {/* Edit action */}
                              {can('asset.manage') && (
                                <button
                                  onClick={() => {
                                    setEditingAsset(asset);
                                    setIsFormModalOpen(true);
                                  }}
                                  title="Edit asset details"
                                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#162820] transition-colors cursor-pointer"
                                >
                                  <Tag className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Delete action with Critical Assigned Asset Protection */}
                              {can('asset.manage') && (
                                isAssigned ? (
                                  <button
                                    onClick={() => toast.error(`Asset '${asset.assetTag}' is currently assigned to ${custodianName}. Please return it to inventory before deleting.`)}
                                    title={`Assigned to ${custodianName} — Deletion prohibited`}
                                    className="p-1 rounded-lg text-slate-300 dark:text-slate-700 cursor-not-allowed"
                                  >
                                    <Lock className="w-3.5 h-3.5" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => setAssetToDelete(asset)}
                                    title="Move asset to archive"
                                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                  >
                                    <Archive className="w-3.5 h-3.5" />
                                  </button>
                                )
                              )}
                            </>
                          ) : (
                            /* Archive Tab Actions */
                            <div className="flex items-center gap-1.5">
                              {can('asset.manage') && (
                                <button
                                  onClick={() => handleRevert(asset)}
                                  title="Restore to active inventory"
                                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#00C471]/10 text-[#00C471] hover:bg-[#00C471]/20 transition-colors flex items-center gap-1 cursor-pointer"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                  <span>Revert</span>
                                </button>
                              )}
                              {can('asset.manage') && (
                                <button
                                  onClick={() => setInspectingArchiveAsset(asset)}
                                  title="Inspect & delete permanently"
                                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#162820] transition-colors cursor-pointer"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Active Asset Detail Modal */}
      <AssetDetailModal
        isOpen={Boolean(inspectingAsset)}
        onClose={() => setInspectingAsset(null)}
        asset={inspectingAsset}
        canManage={can('asset.manage')}
        onAssign={(asset) => setAssigningAsset(asset)}
        onReturn={(asset) => setReturningAsset(asset)}
        onRepair={(asset) => setRepairingAsset(asset)}
        onCompleteRepair={(asset) => setRepairToCompleteAsset(asset)}
      />

      {/* Archive Asset Detail Modal */}
      <AssetArchiveDetailModal
        isOpen={Boolean(inspectingArchiveAsset)}
        onClose={() => setInspectingArchiveAsset(null)}
        asset={inspectingArchiveAsset}
        onRevert={handleRevert}
        onPermanentDelete={handlePermanentDelete}
        isReverting={isRestoring}
        isDeleting={isPermanentDeleting}
      />

      {/* Complete Repair Confirmation Modal */}
      <ConfirmDialog
        isOpen={Boolean(repairToCompleteAsset)}
        onClose={() => setRepairToCompleteAsset(null)}
        onConfirm={handleConfirmCompleteRepair}
        title="Complete Repair & Return to Inventory"
        message={`Confirm that service repair for ${repairToCompleteAsset?.assetTag} (${repairToCompleteAsset?.name}) is complete? The asset will be marked operational and returned to Central Inventory.`}
        confirmText="Complete & Return to Inventory"
        variant="primary"
        isLoading={isCompletingRepair}
      />

      {/* Soft Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={Boolean(assetToDelete)}
        onClose={() => setAssetToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Move Asset to Archive?"
        message={`Are you sure you want to decommission asset ${assetToDelete?.assetTag} (${assetToDelete?.name})? It will be moved to the archive bucket and removed from active operations.`}
        confirmText="Archive Asset"
        variant="warning"
        isLoading={isDeleting}
      />

      {/* Create / Edit Modal */}
      <AssetFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingAsset(null);
        }}
        asset={editingAsset}
      />

      {/* Assign Custodian Modal */}
      <AssetAssignModal
        isOpen={Boolean(assigningAsset)}
        onClose={() => setAssigningAsset(null)}
        asset={assigningAsset}
      />

      {/* Return Asset Modal */}
      <AssetReturnModal
        isOpen={Boolean(returningAsset)}
        onClose={() => setReturningAsset(null)}
        asset={returningAsset}
      />

      {/* Service Repair Modal */}
      <AssetRepairModal
        isOpen={Boolean(repairingAsset)}
        onClose={() => setRepairingAsset(null)}
        asset={repairingAsset}
      />
    </div>
  );
};

export default AssetsPage;

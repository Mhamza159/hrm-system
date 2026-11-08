/**
 * @file AssetsPage.jsx
 * @description Master Asset Inventory & Equipment Registry Dashboard.
 * 
 * SPECIFICATION:
 * - Module: M23 Asset Management (BUILD-GUIDE Section 20 · Rows 23.1, 23.3)
 * - Layer: Frontend Page View
 * - RBAC: Filtered and guarded by CASL permissions ('asset.view', 'asset.create', 'asset.manage').
 * - Design System: Forest & Emerald (#111D17 dark surface, #1A3125 dark border, #00C471 emerald accent).
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
  ArrowUpRight
} from 'lucide-react';
import { useGetAssetsQuery, useDeleteAssetMutation } from '../assetApi.js';
import { AssetFormModal } from '../components/AssetFormModal.jsx';
import { usePermission } from '../../../hooks/usePermission.js';
import { Can } from '../../../components/common/Can.jsx';
import { ScreenSkeleton } from '../../../components/common/ScreenSkeleton.jsx';
import { RefreshButton } from '../../../components/common/RefreshButton.jsx';
import { toast } from 'sonner';

export const AssetsPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { can } = usePermission();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [expiringSoon, setExpiringSoon] = useState(() => searchParams.get('expiringSoon') === 'true');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);

  const { data: assetsRes, isLoading, isFetching, refetch } = useGetAssetsQuery({
    page,
    limit: 15,
    search: search.trim() || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    type: typeFilter !== 'all' ? typeFilter : undefined,
    expiringSoon: expiringSoon ? 'true' : undefined
  });

  const [deleteAsset, { isLoading: isDeleting }] = useDeleteAssetMutation();

  const assets = assetsRes?.data || [];
  const meta = assetsRes?.meta || { page: 1, limit: 15, total: 0, pages: 1 };
  const stats = meta?.stats || {
    total: assets.length,
    available: assets.filter((a) => a.status === 'available').length,
    assigned: assets.filter((a) => a.status === 'assigned').length,
    inRepair: assets.filter((a) => a.status === 'under_repair' || a.hasOpenIssue).length
  };

  if (isLoading && !assetsRes) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <ScreenSkeleton variant="table" />
      </div>
    );
  }

  const handleOpenCreate = () => {
    setEditingAsset(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (asset, e) => {
    e.stopPropagation();
    setEditingAsset(asset);
    setIsModalOpen(true);
  };

  const handleDelete = async (asset, e) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to remove asset ${asset.assetTag} (${asset.name}) from registry?`)) {
      try {
        await deleteAsset(asset._id).unwrap();
        toast.success(`Asset '${asset.assetTag}' deleted successfully.`);
      } catch (err) {
        toast.error(err?.data?.message || err?.message || 'Failed to delete asset.');
      }
    }
  };

  const renderStatusBadge = (status, hasOpenIssue) => {
    if (hasOpenIssue) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50">
          <AlertTriangle className="w-3 h-3 text-rose-500 animate-pulse" />
          <span>Open Defect</span>
        </span>
      );
    }

    switch (status) {
      case 'available':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-[#162820] text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-[#1A3125]">
            <CheckCircle2 className="w-3 h-3 text-[#00C471]" />
            <span>Available</span>
          </span>
        );
      case 'assigned':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/50">
            <Clock className="w-3 h-3 text-blue-500" />
            <span>Assigned</span>
          </span>
        );
      case 'under_repair':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50">
            <Wrench className="w-3 h-3 text-amber-500" />
            <span>In Repair</span>
          </span>
        );
      case 'retired':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            <Archive className="w-3 h-3 text-slate-400" />
            <span>Retired</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
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
            <span>Asset Management & Inventory</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Enterprise physical hardware, devices, licenses, custodian custody, and lifecycle audit history.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <RefreshButton onRefresh={refetch} isFetching={isFetching} />
          <Can I="asset.create" a="Asset">
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-all active:scale-95 self-start cursor-pointer hover:shadow-emerald-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Register New Asset</span>
            </button>
          </Can>
        </div>
      </div>

      {/* Executive Inventory KPI Cards (T005) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Assets */}
        <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] p-5 rounded-2xl shadow-xs transition-all hover:border-emerald-500/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Registered</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-[#162820] text-emerald-600 dark:text-[#00C471] flex items-center justify-center border border-emerald-100 dark:border-[#1A3125]">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              {stats.total ?? 0}
            </span>
            <span className="text-xs text-slate-400 font-medium">assets</span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Physical hardware & licenses</p>
        </div>

        {/* Assigned in Custody */}
        <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] p-5 rounded-2xl shadow-xs transition-all hover:border-blue-500/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Assigned in Custody</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/50">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-blue-600 dark:text-blue-400">
              {stats.assigned ?? 0}
            </span>
            <span className="text-xs text-slate-400 font-medium">deployed</span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Held by verified staff members</p>
        </div>

        {/* Available in Store */}
        <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] p-5 rounded-2xl shadow-xs transition-all hover:border-emerald-500/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Available in Store</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-[#162820] text-emerald-600 dark:text-[#00C471] flex items-center justify-center border border-emerald-100 dark:border-[#1A3125]">
              <PackageCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-[#00C471]">
              {stats.available ?? 0}
            </span>
            <span className="text-xs text-slate-400 font-medium">ready to assign</span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Operational in central inventory</p>
        </div>

        {/* In Repair / Defects */}
        <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] p-5 rounded-2xl shadow-xs transition-all hover:border-amber-500/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Maintenance & Issues</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-100 dark:border-amber-900/50">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400">
              {stats.inRepair ?? 0}
            </span>
            <span className="text-xs text-slate-400 font-medium">tickets</span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Under repair or pending defect</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] p-4 rounded-2xl flex flex-col md:flex-row gap-3 items-center justify-between shadow-xs">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by tag, serial, model..."
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#162820] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-[#00C471]"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap justify-end">
          {/* Status Tabs */}
          <div className="inline-flex p-1 bg-slate-100 dark:bg-[#162820] rounded-xl border border-slate-200 dark:border-[#1A3125]">
            {[
              { id: 'all', label: 'All' },
              { id: 'available', label: 'Available' },
              { id: 'assigned', label: 'Assigned' },
              { id: 'under_repair', label: 'In Repair' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-white dark:bg-[#111D17] text-slate-900 dark:text-white shadow-xs font-semibold'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Expiring Soon Toggle */}
          <button
            onClick={() => setExpiringSoon(!expiringSoon)}
            className={`px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 border transition-all cursor-pointer ${
              expiringSoon
                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-800 shadow-xs'
                : 'bg-slate-50 dark:bg-[#162820] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-[#1A3125] hover:bg-slate-100 dark:hover:bg-[#1a3125]/80'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Expiring Soon (30d)</span>
          </button>
        </div>
      </div>

      {/* Assets Inventory Table */}
      <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-16 text-center text-xs text-slate-400">Loading asset inventory...</div>
        ) : assets.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-[#162820] text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto border border-slate-200 dark:border-[#1A3125]">
              <Laptop className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">No Assets Found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              {search || statusFilter !== 'all' || expiringSoon
                ? 'No assets match your search or filter criteria. Try clearing filters.'
                : 'No company hardware or software has been registered in the system yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-[#1A3125] text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider bg-slate-50/50 dark:bg-[#162820]/40">
                  <th className="py-3.5 px-4">Asset Tag</th>
                  <th className="py-3.5 px-4">Equipment & Specs</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Current Custodian</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Warranty / Expiry</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#1A3125] text-xs">
                {assets.map((asset) => {
                  const custodian = asset.assignedTo;
                  const custodianName = custodian
                    ? (custodian.name || `${custodian.firstName || ''} ${custodian.lastName || ''}`.trim() || 'Staff')
                    : null;
                  const deptName = custodian?.departmentId?.name || custodian?.departmentId?.code || null;
                  const desigTitle = custodian?.designationId?.title || custodian?.designationId?.code || null;

                  return (
                    <tr
                      key={asset._id}
                      onClick={() => navigate(`/assets/${asset._id}`)}
                      className="hover:bg-slate-50/80 dark:hover:bg-[#162820]/60 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-[#00C471] dark:text-[#00C471] tracking-tight">
                        {asset.assetTag}
                      </td>
                      <td className="py-3.5 px-4">
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white group-hover:text-[#00C471] transition-colors">
                            {asset.name}
                          </p>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                            {asset.modelNumber || asset.serialNumber}
                            {asset.specifications?.ramGb ? ` · ${asset.specifications.ramGb}GB RAM` : ''}
                            {asset.specifications?.processor ? ` · ${asset.specifications.processor}` : ''}
                          </p>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 capitalize text-slate-600 dark:text-slate-300">
                        {asset.type.replace('_', ' ')}
                      </td>
                      <td className="py-3.5 px-4">
                        {custodian ? (
                          <div className="flex items-center gap-2.5">
                            <div className="relative">
                              {custodian.avatar ? (
                                <img
                                  src={custodian.avatar}
                                  alt={custodianName}
                                  className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-[#1A3125]"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-[#162820] text-emerald-700 dark:text-[#00C471] font-bold text-xs flex items-center justify-center border border-emerald-200 dark:border-[#1A3125]">
                                  {(custodianName?.[0] || 'U').toUpperCase()}
                                </div>
                              )}
                              <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-[#00C471] ring-2 ring-white dark:ring-[#111D17]" />
                            </div>
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-semibold text-slate-900 dark:text-white text-xs">
                                  {custodianName}
                                </span>
                                {custodian.employeeCode && (
                                  <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-[#162820] text-slate-600 dark:text-emerald-400 border border-slate-200 dark:border-[#1A3125]">
                                    {custodian.employeeCode}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500">
                                {desigTitle && <span>{desigTitle}</span>}
                                {desigTitle && deptName && <span>•</span>}
                                {deptName && <span className="text-slate-500 dark:text-slate-400">{deptName}</span>}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-[#162820] text-slate-500 dark:text-emerald-400/80 border border-slate-200 dark:border-[#1A3125]">
                            <PackageCheck className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Available in Store</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {renderStatusBadge(asset.status, asset.hasOpenIssue)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 text-[11px] font-mono tabular-nums">
                        {asset.warrantyExpiresAt
                          ? `Warranty: ${new Date(asset.warrantyExpiresAt).toLocaleDateString()}`
                          : asset.licenseExpiresAt
                          ? `License: ${new Date(asset.licenseExpiresAt).toLocaleDateString()}`
                          : 'No expiry registered'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => navigate(`/assets/${asset._id}`)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg cursor-pointer"
                            title="View Details"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                          <Can I="asset.manage" a="Asset">
                            <button
                              onClick={(e) => handleOpenEdit(asset, e)}
                              className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-[#00C471] rounded-lg text-xs font-semibold cursor-pointer"
                              title="Edit Asset"
                            >
                              Edit
                            </button>
                            <button
                              onClick={(e) => handleDelete(asset, e)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg text-xs font-semibold cursor-pointer"
                              title="Delete Asset"
                            >
                              Delete
                            </button>
                          </Can>
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

      {/* Register / Edit Modal */}
      <AssetFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        asset={editingAsset}
      />
    </div>
  );
};

export default AssetsPage;

/**
 * @file AssetsPage.jsx
 * @description Master Asset Inventory & Equipment Registry Dashboard.
 * 
 * SPECIFICATION:
 * - Module: M23 Asset Management (BUILD-GUIDE Section 20 · Rows 23.1, 23.3)
 * - Layer: Frontend Page View
 * - RBAC: Filtered and guarded by CASL permissions ('asset.view', 'asset.create', 'asset.manage').
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  MoreVertical,
  ExternalLink,
  ShieldAlert,
  Cpu
} from 'lucide-react';
import { useGetAssetsQuery, useDeleteAssetMutation } from '../assetApi.js';
import { AssetFormModal } from '../components/AssetFormModal.jsx';
import { usePermission } from '../../../hooks/usePermission.js';
import { Can } from '../../../components/common/Can.jsx';
import { toast } from 'sonner';

export const AssetsPage = () => {
  const navigate = useNavigate();
  const { can } = usePermission();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [expiringSoon, setExpiringSoon] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);

  const { data: assetsRes, isLoading, isFetching } = useGetAssetsQuery({
    page,
    limit: 12,
    search: search.trim() || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    type: typeFilter !== 'all' ? typeFilter : undefined,
    expiringSoon: expiringSoon ? 'true' : undefined
  });

  const [deleteAsset, { isLoading: isDeleting }] = useDeleteAssetMutation();

  const assets = assetsRes?.data || [];
  const meta = assetsRes?.meta || { page: 1, limit: 12, total: 0, pages: 1 };

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
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
          <AlertTriangle className="w-3 h-3" />
          <span>Issue Reported</span>
        </span>
      );
    }

    switch (status) {
      case 'available':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3" />
            <span>Available</span>
          </span>
        );
      case 'assigned':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
            <Clock className="w-3 h-3" />
            <span>Assigned</span>
          </span>
        );
      case 'under_repair':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
            <Wrench className="w-3 h-3" />
            <span>In Repair</span>
          </span>
        );
      case 'retired':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            <Archive className="w-3 h-3" />
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Laptop className="w-7 h-7 text-emerald-500" />
            Asset Management & Inventory
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Enterprise physical hardware, devices, software licenses, custodian custody, and maintenance records.
          </p>
        </div>

        <Can I="asset.create" a="Asset">
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-all active:scale-95 self-start cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Register New Asset</span>
          </button>
        </Can>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#0F111A] border border-slate-200 dark:border-[#1E2235] p-4 rounded-2xl flex flex-col md:flex-row gap-3 items-center justify-between shadow-xs">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by tag, serial, model..."
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#151926] border border-slate-200 dark:border-[#1E2235] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-emerald-500"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap justify-end">
          {/* Status Tabs */}
          <div className="inline-flex p-1 bg-slate-100 dark:bg-[#151926] rounded-xl border border-slate-200 dark:border-[#1E2235]">
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
                    ? 'bg-white dark:bg-[#0F111A] text-slate-900 dark:text-white shadow-xs font-semibold'
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
                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700 shadow-xs'
                : 'bg-slate-50 dark:bg-[#151926] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-[#1E2235] hover:bg-slate-100'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Expiring Soon (30d)</span>
          </button>
        </div>
      </div>

      {/* Assets Inventory Table */}
      <div className="bg-white dark:bg-[#0F111A] border border-slate-200 dark:border-[#1E2235] rounded-2xl overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-16 text-center text-xs text-slate-400">Loading asset inventory...</div>
        ) : assets.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <Laptop className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">No Assets Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {search || statusFilter !== 'all' || expiringSoon
                ? 'No assets match your search or filter criteria. Try clearing filters.'
                : 'No company hardware or software has been registered in the system yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-[#1E2235] text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-[#151926]/40">
                  <th className="py-3.5 px-4">Asset Tag</th>
                  <th className="py-3.5 px-4">Equipment & Specs</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Current Custodian</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Warranty / Expiry</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#1E2235] text-xs">
                {assets.map((asset) => (
                  <tr
                    key={asset._id}
                    onClick={() => navigate(`/assets/${asset._id}`)}
                    className="hover:bg-slate-50/80 dark:hover:bg-[#151926]/60 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {asset.assetTag}
                    </td>
                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors">
                          {asset.name}
                        </p>
                        <p className="text-[11px] text-slate-400">
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
                      {asset.assignedTo ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-[10px] font-bold flex items-center justify-center">
                            {asset.assignedTo.firstName?.[0]}
                          </div>
                          <div>
                            <p className="font-medium text-slate-800 dark:text-slate-200 text-xs">
                              {asset.assignedTo.firstName} {asset.assignedTo.lastName}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              {asset.assignedTo.employeeCode}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs italic">Unassigned (In Store)</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {renderStatusBadge(asset.status, asset.hasOpenIssue)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 text-[11px]">
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
                          className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg"
                          title="View Details"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        <Can I="asset.manage" a="Asset">
                          <button
                            onClick={(e) => handleOpenEdit(asset, e)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg text-xs font-semibold"
                            title="Edit Asset"
                          >
                            Edit
                          </button>
                          <button
                            onClick={(e) => handleDelete(asset, e)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg text-xs font-semibold"
                            title="Delete Asset"
                          >
                            Delete
                          </button>
                        </Can>
                      </div>
                    </td>
                  </tr>
                ))}
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

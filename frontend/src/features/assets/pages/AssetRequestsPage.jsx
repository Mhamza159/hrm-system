/**
 * @file AssetRequestsPage.jsx
 * @description Department Manager Asset Requisitions & HR Review / Allocation Portal.
 * 
 * SPECIFICATION & DESIGN:
 * - Module: M23 Asset Management (BUILD-GUIDE Section 20 · Row 23.5)
 * - Design System: Forest & Emerald (#00C471 brand primary, #111D17 dark surface, #1A3125 dark border).
 * - Full Workflow: Status tabs, KPI counters, high-density data table, and modern allocation/rejection modals.
 * - PBAC/RBAC: Approval and allocation actions guarded by `asset.manage`.
 */

import React, { useState, useMemo } from 'react';
import {
  Send,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Laptop,
  Check,
  X,
  Search,
  Filter,
  PackageCheck,
  User,
  Building2,
  Briefcase,
  Layers,
  ArrowRight,
  ShieldCheck,
  FileText
} from 'lucide-react';
import {
  useGetAssetRequestsQuery,
  useApproveAssetRequestMutation,
  useRejectAssetRequestMutation,
  useGetAssetsQuery
} from '../assetApi.js';
import { AssetRequestModal } from '../components/AssetRequestModal.jsx';
import { Can } from '../../../components/common/Can.jsx';
import { ScreenSkeleton } from '../../../components/common/ScreenSkeleton.jsx';
import { RefreshButton } from '../../../components/common/RefreshButton.jsx';
import { formatDate } from '../../../lib/formatters.js';
import { toast } from 'sonner';

export const AssetRequestsPage = () => {
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Allocation modal state
  const [allocatingRequest, setAllocatingRequest] = useState(null);
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [assetSearchQuery, setAssetSearchQuery] = useState('');

  // Rejection modal state
  const [rejectingRequest, setRejectingRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // View details modal state
  const [viewingRequest, setViewingRequest] = useState(null);

  const { data: requestsRes, isLoading, isFetching, refetch } = useGetAssetRequestsQuery();
  const requests = Array.isArray(requestsRes?.data) ? requestsRes.data : (Array.isArray(requestsRes) ? requestsRes : []);

  // Fetch available inventory when allocation modal is active
  const { data: availableAssetsRes } = useGetAssetsQuery(
    allocatingRequest ? { status: 'available', type: allocatingRequest.assetType, limit: 100 } : { status: 'available' },
    { skip: !allocatingRequest }
  );

  const [approveRequest, { isLoading: isApproving }] = useApproveAssetRequestMutation();
  const [rejectRequest, { isLoading: isRejecting }] = useRejectAssetRequestMutation();

  const availableAssets = availableAssetsRes?.data || [];

  // Filtered available assets for allocation modal
  const filteredAvailableAssets = useMemo(() => {
    if (!assetSearchQuery.trim()) return availableAssets;
    const q = assetSearchQuery.toLowerCase();
    return availableAssets.filter((a) => {
      const tag = (a.assetTag || '').toLowerCase();
      const name = (a.name || '').toLowerCase();
      const sn = (a.serialNumber || '').toLowerCase();
      const model = (a.modelNumber || '').toLowerCase();
      return tag.includes(q) || name.includes(q) || sn.includes(q) || model.includes(q);
    });
  }, [availableAssets, assetSearchQuery]);

  // KPI Calculations
  const stats = useMemo(() => {
    const total = requests.length;
    const pending = requests.filter((r) => r.status === 'pending').length;
    const approved = requests.filter((r) => r.status === 'approved').length;
    const rejected = requests.filter((r) => r.status === 'rejected').length;
    return { total, pending, approved, rejected };
  }, [requests]);

  // Filtered Requisitions based on tab & search
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      if (statusFilter !== 'all' && req.status !== statusFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const empName = (req.employeeId?.name || `${req.employeeId?.firstName || ''} ${req.employeeId?.lastName || ''}`).toLowerCase();
        const empCode = (req.employeeId?.employeeCode || '').toLowerCase();
        const type = (req.assetType || '').toLowerCase();
        const just = (req.justification || '').toLowerCase();
        return empName.includes(q) || empCode.includes(q) || type.includes(q) || just.includes(q);
      }

      return true;
    });
  }, [requests, statusFilter, searchQuery]);

  if (isLoading && !requestsRes) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <ScreenSkeleton variant="table" />
      </div>
    );
  }

  const closeAllocation = () => {
    setAllocatingRequest(null);
    setSelectedAssetId('');
    setAssetSearchQuery('');
  };

  const handleConfirmAllocation = async () => {
    if (!selectedAssetId) {
      toast.error('Please select an available asset to allocate.');
      return;
    }

    try {
      await approveRequest({
        id: allocatingRequest._id,
        allocatedAssetId: selectedAssetId
      }).unwrap();

      toast.success('Asset allocated and requisition approved successfully.');
      closeAllocation();
    } catch (err) {
      toast.error(err?.data?.message || err?.message || 'Failed to approve request.');
    }
  };

  const handleConfirmRejection = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Rejection reason is required.');
      return;
    }

    try {
      await rejectRequest({
        id: rejectingRequest._id,
        rejectionReason: rejectionReason.trim()
      }).unwrap();

      toast.success('Asset requisition declined.');
      setRejectingRequest(null);
      setRejectionReason('');
    } catch (err) {
      toast.error(err?.data?.message || err?.message || 'Failed to reject request.');
    }
  };

  const tabPills = [
    { id: 'all', label: 'All Requests', count: stats.total },
    { id: 'pending', label: 'Pending Review', count: stats.pending },
    { id: 'approved', label: 'Allocated / Fulfilled', count: stats.approved },
    { id: 'rejected', label: 'Declined', count: stats.rejected }
  ];

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'high':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 uppercase">
            High Priority
          </span>
        );
      case 'low':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700 uppercase">
            Low Priority
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50 uppercase">
            Medium Priority
          </span>
        );
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
            <CheckCircle2 className="w-3 h-3 text-[#00C471]" />
            <span>Allocated</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50">
            <XCircle className="w-3 h-3 text-rose-500" />
            <span>Declined</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
            <Clock className="w-3 h-3 text-amber-500" />
            <span>Pending Review</span>
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
              <Send className="w-5 h-5 text-[#00C471]" />
            </div>
            <span>Asset Requisitions & Approvals</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Department manager equipment requests, review pipeline, and hardware allocation.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <RefreshButton onRefresh={refetch} isFetching={isFetching} />
          <Can I="asset.request" a="AssetRequest">
            <button
              onClick={() => setRequestModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[#00C471] hover:bg-[#049856] text-white shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Requisition</span>
            </button>
          </Can>
        </div>
      </div>

      {/* KPI Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Requisitions</span>
            <Layers className="w-4 h-4 text-[#00C471]" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
            {stats.total}
          </p>
          <span className="text-[11px] text-slate-400">All submissions</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Pending Review</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1 tabular-nums">
            {stats.pending}
          </p>
          <span className="text-[11px] text-slate-400">Awaiting HR decision</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Allocated</span>
            <CheckCircle2 className="w-4 h-4 text-[#00C471]" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
            {stats.approved}
          </p>
          <span className="text-[11px] text-slate-400">Equipment delivered</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Declined</span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
            {stats.rejected}
          </p>
          <span className="text-[11px] text-slate-400">Rejected requests</span>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl overflow-hidden shadow-2xs">
        {/* Pills Switcher & Search Bar */}
        <div className="p-4 border-b border-slate-100 dark:border-[#1A3125] flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50 dark:bg-[#0B1511]/50">
          {/* Pills Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 custom-scrollbar">
            {tabPills.map((tab) => {
              const isActive = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 flex items-center gap-1.5 shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-[#00C471] text-white shadow-2xs shadow-emerald-500/20'
                      : 'bg-white dark:bg-[#162820] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1E362B] border border-slate-200 dark:border-[#1A3125]'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 dark:bg-[#0B1511] text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-72 shrink-0">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search employee, category..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-[#00C471] focus:ring-1 focus:ring-[#00C471]"
            />
          </div>
        </div>

        {/* Data Table */}
        {filteredRequests.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-[#162820] text-slate-400 flex items-center justify-center mx-auto border border-slate-200 dark:border-[#1A3125]">
              <Clock className="w-6 h-6 text-[#00C471]" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {searchQuery ? 'No matching requisitions found' : 'No Requisitions In This Category'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery
                ? 'Try adjusting your search criteria or switching to a different tab.'
                : 'There are currently no asset requests under this filter.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-[#1A3125] text-slate-400 dark:text-slate-500 bg-slate-50/70 dark:bg-[#0B1511]/70 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Requested Category</th>
                  <th className="py-3 px-4">Target Employee</th>
                  <th className="py-3 px-4">Requested By</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#1A3125]">
                {filteredRequests.map((req) => {
                  const emp = req.employeeId;
                  const empName = emp
                    ? (emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.employeeCode)
                    : 'Unassigned';

                  return (
                    <tr
                      key={req._id}
                      onClick={() => setViewingRequest(req)}
                      className="hover:bg-slate-50/80 dark:hover:bg-[#162820]/50 transition-colors cursor-pointer group"
                    >
                      {/* Requested Category */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 dark:text-white capitalize">
                            {req.assetType?.replace('_', ' ') || 'Equipment'}
                          </span>
                        </div>
                        {req.specificationsRequired && (
                          <div className="text-[11px] text-slate-400 truncate max-w-xs">
                            {req.specificationsRequired}
                          </div>
                        )}
                      </td>

                      {/* Target Employee */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold flex items-center justify-center border border-emerald-300 dark:border-emerald-800 text-xs shrink-0">
                            {emp?.avatar ? (
                              <img src={emp.avatar} alt={empName} className="w-full h-full rounded-full object-cover" />
                            ) : (
                              empName?.slice(0, 2).toUpperCase() || 'EMP'
                            )}
                          </div>
                          <div className="truncate">
                            <span className="font-semibold text-slate-900 dark:text-white truncate block">
                              {empName}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {emp?.employeeCode} {req.departmentId?.name ? `· ${req.departmentId.name}` : ''}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Requested By & Date */}
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        <div className="font-medium text-slate-700 dark:text-slate-300">
                          {req.requestedByName || req.requestedBy?.email || 'Department Manager'}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {formatDate(req.createdAt)}
                        </div>
                      </td>

                      {/* Priority */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {getPriorityBadge(req.priority)}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {getStatusBadge(req.status)}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          {req.status === 'pending' ? (
                            <Can I="asset.manage" a="Asset">
                              <button
                                onClick={() => setAllocatingRequest(req)}
                                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#00C471] text-white hover:bg-[#049856] transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Allocate</span>
                              </button>
                              <button
                                onClick={() => setRejectingRequest(req)}
                                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-100 transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Decline</span>
                              </button>
                            </Can>
                          ) : (
                            <button
                              onClick={() => setViewingRequest(req)}
                              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-[#162820] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#1E362B] transition-colors cursor-pointer"
                            >
                              View Details
                            </button>
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

      {/* Allocation Modal */}
      {allocatingRequest && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/15 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] w-full max-w-lg rounded-2xl shadow-2xl p-6 overflow-hidden space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#1A3125]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-[#162820] text-[#00C471] flex items-center justify-center border border-emerald-100 dark:border-[#1A3125]">
                  <Laptop className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Allocate Available Asset</h3>
                  <p className="text-xs text-slate-500 capitalize">
                    {allocatingRequest.assetType?.replace('_', ' ')} for {allocatingRequest.employeeId?.name || 'Employee'}
                  </p>
                </div>
              </div>
              <button
                onClick={closeAllocation}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#162820] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Requisition Brief */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B1511] border border-slate-100 dark:border-[#1A3125] text-xs space-y-1">
              <span className="text-slate-400 font-semibold block text-[10px] uppercase">Required Specs & Justification</span>
              <p className="text-slate-700 dark:text-slate-300 font-medium">{allocatingRequest.specificationsRequired || 'Standard specification'}</p>
              <p className="text-slate-500 italic text-[11px]">"{allocatingRequest.justification}"</p>
            </div>

            {/* Inventory Selector */}
            <div className="space-y-2 text-xs">
              <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                Select Available Inventory Item <span className="text-rose-500">*</span>
              </label>

              {/* Search available assets */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={assetSearchQuery}
                  onChange={(e) => setAssetSearchQuery(e.target.value)}
                  placeholder="Filter available equipment..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-[#0B1511] border border-slate-200 dark:border-[#1A3125] rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-[#00C471]"
                />
              </div>

              <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-[#1A3125] border border-slate-200 dark:border-[#1A3125] rounded-xl p-1 custom-scrollbar">
                {filteredAvailableAssets.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No available equipment of type <strong>{allocatingRequest.assetType}</strong> found in central inventory.
                  </div>
                ) : (
                  filteredAvailableAssets.map((asset) => {
                    const isSelected = selectedAssetId === asset._id;
                    return (
                      <div
                        key={asset._id}
                        onClick={() => setSelectedAssetId(asset._id)}
                        className={`p-2.5 rounded-lg flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-emerald-50 dark:bg-[#162820] border border-emerald-200 dark:border-emerald-800'
                            : 'hover:bg-slate-50 dark:hover:bg-[#162820]/60'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-[#1A3125] text-slate-700 dark:text-slate-300">
                              {asset.assetTag}
                            </span>
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {asset.name}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            S/N: {asset.serialNumber} {asset.modelNumber ? `· ${asset.modelNumber}` : ''}
                          </div>
                        </div>

                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-[#00C471] shrink-0" />
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-[#1A3125]">
              <button
                onClick={closeAllocation}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-[#162820] border border-slate-200 dark:border-[#1A3125] text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAllocation}
                disabled={!selectedAssetId || isApproving}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#00C471] hover:bg-[#049856] text-white transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isApproving ? 'Allocating...' : 'Confirm & Allocate'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decline Requisition Modal */}
      {rejectingRequest && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/15 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] w-full max-w-md rounded-2xl shadow-2xl p-6 overflow-hidden space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#1A3125]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-100 dark:border-rose-900/50">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Decline Requisition</h3>
                  <p className="text-xs text-slate-500">Provide official feedback to the requesting manager</p>
                </div>
              </div>
              <button
                onClick={() => setRejectingRequest(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#162820] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                Reason for Rejection <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="State the reason (e.g. equipment out of budget, alternative device recommended)..."
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-[#0B1511] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white text-xs placeholder-slate-400 focus:outline-hidden focus:border-[#00C471]"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-[#1A3125]">
              <button
                onClick={() => setRejectingRequest(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-[#162820] border border-slate-200 dark:border-[#1A3125] text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRejection}
                disabled={!rejectionReason.trim() || isRejecting}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                <span>{isRejecting ? 'Declining...' : 'Decline Requisition'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Justification Modal */}
      {viewingRequest && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/15 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] w-full max-w-md rounded-2xl shadow-2xl p-6 overflow-hidden space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#1A3125]">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-[#00C471]" />
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Requisition Details</h3>
              </div>
              <button
                onClick={() => setViewingRequest(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#162820] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Status</span>
                {getStatusBadge(viewingRequest.status)}
              </div>

              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Requested Specs</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200">{viewingRequest.specificationsRequired || 'Standard specification'}</p>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Business Justification</span>
                <p className="text-slate-700 dark:text-slate-300 p-3 rounded-xl bg-slate-50 dark:bg-[#0B1511] border border-slate-100 dark:border-[#1A3125] italic">
                  "{viewingRequest.justification}"
                </p>
              </div>

              {viewingRequest.rejectionReason && (
                <div>
                  <span className="text-rose-500 text-[10px] uppercase font-bold block">Rejection Feedback</span>
                  <p className="text-rose-700 dark:text-rose-400 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50">
                    {viewingRequest.rejectionReason}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-[#1A3125] flex justify-end">
              <button
                onClick={() => setViewingRequest(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-[#162820] border border-slate-200 dark:border-[#1A3125] text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Requisition Modal */}
      <AssetRequestModal
        isOpen={requestModalOpen}
        onClose={() => setRequestModalOpen(false)}
      />
    </div>
  );
};

export default AssetRequestsPage;

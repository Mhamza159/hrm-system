/**
 * @file AssetRequestsPage.jsx
 * @description Department Manager Asset Requisitions & HR Review / Allocation Portal.
 * 
 * SPECIFICATION:
 * - Module: M23 Asset Management (BUILD-GUIDE Section 20 · Row 23.5)
 * - Layer: Frontend Page View
 */

import React, { useState } from 'react';
import {
  Send,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Laptop,
  Check,
  X
} from 'lucide-react';
import {
  useGetAssetRequestsQuery,
  useApproveAssetRequestMutation,
  useRejectAssetRequestMutation,
  useGetAssetsQuery
} from '../assetApi.js';
import { AssetRequestModal } from '../components/AssetRequestModal.jsx';
import { Can } from '../../../components/common/Can.jsx';
import { toast } from 'sonner';

export const AssetRequestsPage = () => {
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  // Allocation modal state
  const [allocatingRequest, setAllocatingRequest] = useState(null);
  const [selectedAssetId, setSelectedAssetId] = useState('');

  // Rejection modal state
  const [rejectingRequest, setRejectingRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const { data: requests = [], isLoading } = useGetAssetRequestsQuery();
  const { data: availableAssetsRes } = useGetAssetsQuery(
    allocatingRequest ? { status: 'available', type: allocatingRequest.assetType } : { status: 'available' },
    { skip: !allocatingRequest }
  );

  const availableAssets = availableAssetsRes?.data || [];

  const [approveRequest, { isLoading: isApproving }] = useApproveAssetRequestMutation();
  const [rejectRequest, { isLoading: isRejecting }] = useRejectAssetRequestMutation();

  const filteredRequests = requests.filter((r) => {
    if (statusFilter === 'all') return true;
    return r.status === statusFilter;
  });

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

      toast.success('Asset allocated and requisition approved.');
      setAllocatingRequest(null);
      setSelectedAssetId('');
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

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Send className="w-6 h-6 text-purple-500" />
            Asset Requisitions
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Department manager equipment requests, review queue, and inventory allocation.
          </p>
        </div>

        <Can I="asset.request" a="AssetRequest">
          <button
            onClick={() => setRequestModalOpen(true)}
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer self-start"
          >
            <Plus className="w-4 h-4" />
            <span>New Requisition</span>
          </button>
        </Can>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-[#1E2235] pb-2">
        {[
          { id: 'all', label: `All Requests (${requests.length})` },
          { id: 'pending', label: `Pending Review (${requests.filter((r) => r.status === 'pending').length})` },
          { id: 'approved', label: `Allocated (${requests.filter((r) => r.status === 'approved').length})` },
          { id: 'rejected', label: `Declined (${requests.filter((r) => r.status === 'rejected').length})` }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              statusFilter === tab.id
                ? 'bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400 border border-purple-200 dark:border-purple-800'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Requests Grid */}
      {isLoading ? (
        <div className="p-16 text-center text-xs text-slate-400">Loading requisitions...</div>
      ) : filteredRequests.length === 0 ? (
        <div className="p-16 text-center space-y-2 bg-white dark:bg-[#0F111A] border border-slate-200 dark:border-[#1E2235] rounded-2xl">
          <Clock className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">No Requisitions Found</h3>
          <p className="text-xs text-slate-500">There are no asset requests matching this filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRequests.map((req) => (
            <div
              key={req._id}
              className="bg-white dark:bg-[#0F111A] border border-slate-200 dark:border-[#1E2235] rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-xs uppercase px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
                    {req.assetType.replace('_', ' ')}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase">
                      Priority: {req.priority}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      req.status === 'approved'
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                        : req.status === 'rejected'
                        ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
                        : 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'
                    }`}>
                      {req.status}
                    </span>
                  </div>
                </div>

                <div className="mt-3 text-xs space-y-1">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    Target Member: {req.employeeId?.firstName} {req.employeeId?.lastName} ({req.employeeId?.employeeCode})
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Department: {req.departmentId?.name || 'Department'} · Requested by: {req.requestedBy?.name || 'Manager'}
                  </p>
                  {req.specificationsRequired && (
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 pt-1">
                      <span className="font-semibold text-slate-500">Specs:</span> {req.specificationsRequired}
                    </p>
                  )}
                  <p className="text-slate-600 dark:text-slate-400 text-xs pt-1 italic">
                    "{req.justification}"
                  </p>
                </div>

                {req.status === 'approved' && req.allocatedAssetId && (
                  <div className="mt-3 p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800 text-[11px] text-emerald-700 dark:text-emerald-300">
                    Allocated Asset: <span className="font-bold">{req.allocatedAssetId.name}</span> ({req.allocatedAssetId.assetTag})
                  </div>
                )}

                {req.status === 'rejected' && req.rejectionReason && (
                  <div className="mt-3 p-2.5 rounded-xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-800 text-[11px] text-rose-700 dark:text-rose-300">
                    Decline Reason: <span className="font-medium">{req.rejectionReason}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons for HR */}
              {req.status === 'pending' && (
                <Can I="asset.manage" a="Asset">
                  <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-[#1E2235]">
                    <button
                      onClick={() => setAllocatingRequest(req)}
                      className="flex-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve & Allocate</span>
                    </button>
                    <button
                      onClick={() => setRejectingRequest(req)}
                      className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-700 dark:text-slate-300 hover:text-rose-600 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Decline</span>
                    </button>
                  </div>
                </Can>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Allocation Modal */}
      {allocatingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0F111A] border border-slate-200 dark:border-[#1E2235] w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4">
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
              Allocate Available Asset
            </h3>
            <p className="text-xs text-slate-500">
              Select an available {allocatingRequest.assetType} to assign to {allocatingRequest.employeeId?.firstName} {allocatingRequest.employeeId?.lastName}.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Available In Inventory
              </label>
              {availableAssets.length === 0 ? (
                <p className="text-xs text-rose-500 italic p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl">
                  No available {allocatingRequest.assetType} in store. Please register a new asset first.
                </p>
              ) : (
                <select
                  value={selectedAssetId}
                  onChange={(e) => setSelectedAssetId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#151926] border border-slate-200 dark:border-[#1E2235] text-slate-900 dark:text-white"
                >
                  <option value="">-- Choose asset --</option>
                  {availableAssets.map((ast) => (
                    <option key={ast._id} value={ast._id}>
                      {ast.assetTag} · {ast.name} ({ast.modelNumber || ast.serialNumber})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setAllocatingRequest(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAllocation}
                disabled={!selectedAssetId || isApproving}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-xs"
              >
                {isApproving ? 'Allocating...' : 'Confirm Allocation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {rejectingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0F111A] border border-slate-200 dark:border-[#1E2235] w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4">
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
              Decline Requisition
            </h3>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Reason for Rejection <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Budget exhausted, equipment already assigned to employee"
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#151926] border border-slate-200 dark:border-[#1E2235] text-slate-900 dark:text-white focus:outline-hidden"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setRejectingRequest(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRejection}
                disabled={!rejectionReason.trim() || isRejecting}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl shadow-xs"
              >
                {isRejecting ? 'Declining...' : 'Confirm Decline'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      <AssetRequestModal
        isOpen={requestModalOpen}
        onClose={() => setRequestModalOpen(false)}
      />
    </div>
  );
};

export default AssetRequestsPage;

/**
 * @file WfhLocationsPage.jsx
 * @description WFH Approved Remote Locations Directory & Approval Management.
 *
 * SPECIFICATION:
 * - Module M14 (BUILD-GUIDE Section 17 · Row 14.4)
 */

import React, { useState } from 'react';
import {
  Home,
  Plus,
  MapPin,
  CheckCircle,
  XCircle,
  Clock,
  ShieldCheck,
  Trash2,
  Check,
  X,
  AlertCircle
} from 'lucide-react';
import {
  useGetWfhLocationsQuery,
  useUpdateWfhLocationStatusMutation,
  useDeleteWfhLocationMutation
} from '../attendanceApi.js';
import { WfhLocationModal } from '../components/WfhLocationModal.jsx';
import { usePermission } from '../../../hooks/usePermission.js';
import { useAuth } from '../../../hooks/useAuth.js';
import { toast } from 'sonner';

export const WfhLocationsPage = () => {
  const { can } = usePermission();
  const { isSuperAdmin, isHR } = useAuth();
  const canApprove = isSuperAdmin || isHR || can('attendance.approve');

  const [modalOpen, setModalOpen] = useState(false);
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [decisionStatus, setDecisionStatus] = useState('approved');
  const [remarks, setRemarks] = useState('');

  const { data, isLoading, refetch } = useGetWfhLocationsQuery();
  const [updateStatus, { isLoading: isUpdating }] = useUpdateWfhLocationStatusMutation();
  const [deleteLocation] = useDeleteWfhLocationMutation();

  const locations = data?.data || [];

  const handleOpenDecision = (loc, status) => {
    setSelectedLocation(loc);
    setDecisionStatus(status);
    setRemarks('');
    setDecisionModalOpen(true);
  };

  const handleConfirmDecision = async (e) => {
    e.preventDefault();
    try {
      await updateStatus({
        id: selectedLocation._id,
        status: decisionStatus,
        remarks: remarks.trim()
      }).unwrap();

      toast.success(`WFH Location ${decisionStatus} successfully.`);
      setDecisionModalOpen(false);
      refetch();
    } catch (err) {
      toast.error(err.data?.message || err.message || 'Failed to update location status.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this WFH location?')) return;
    try {
      await deleteLocation(id).unwrap();
      toast.success('Location removed successfully.');
      refetch();
    } catch (err) {
      toast.error(err.data?.message || err.message || 'Failed to delete location.');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <XCircle className="w-3.5 h-3.5 text-rose-500" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            Pending Approval
          </span>
        );
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Home className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Approved WFH Locations
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Register your verified home residence coordinates for authorized Work-From-Home attendance check-ins.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Register WFH Location</span>
        </button>
      </div>

      {/* Locations Grid / Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-slate-400">Loading registered WFH locations...</div>
        ) : locations.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <MapPin className="w-10 h-10 text-indigo-400 mx-auto" />
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
              No WFH locations registered
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              You haven't registered any remote work coordinates yet. Register your residence to clock in smoothly during approved WFH days.
            </p>
            <button
              onClick={() => setModalOpen(true)}
              className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-medium cursor-pointer"
            >
              Add First Location
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Location Name</th>
                  {canApprove && <th className="py-3 px-4">Employee</th>}
                  <th className="py-3 px-4">Address</th>
                  <th className="py-3 px-4">Coordinates & Radius</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                {locations.map((loc) => (
                  <tr key={loc._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <Home className="w-4 h-4 text-indigo-500 shrink-0" />
                        <span>{loc.name}</span>
                      </div>
                    </td>
                    {canApprove && (
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {loc.employeeId?.name || 'Employee'}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {loc.employeeId?.employeeCode || ''}
                        </div>
                      </td>
                    )}
                    <td className="py-3.5 px-4 max-w-xs truncate text-slate-600 dark:text-slate-400">
                      {loc.address}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      <div>{loc.latitude?.toFixed(4)}, {loc.longitude?.toFixed(4)}</div>
                      <div className="text-indigo-600 dark:text-indigo-400 font-medium font-sans">
                        Radius: {loc.radiusMeters || 100}m
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {getStatusBadge(loc.status)}
                      {loc.decisionRemarks && (
                        <div className="text-[10px] text-slate-400 mt-1 truncate max-w-xs">
                          "{loc.decisionRemarks}"
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {canApprove && loc.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleOpenDecision(loc, 'approved')}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-lg transition-colors cursor-pointer"
                              title="Approve Location"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenDecision(loc, 'rejected')}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                              title="Reject Location"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDelete(loc._id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          title="Delete Location"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Registration Modal */}
      <WfhLocationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => refetch()}
      />

      {/* Approval / Rejection Decision Modal */}
      {decisionModalOpen && selectedLocation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              {decisionStatus === 'approved' ? 'Approve WFH Location' : 'Reject WFH Location'}
            </h3>
            <p className="text-xs text-slate-500">
              {selectedLocation.name} — {selectedLocation.employeeId?.name || 'Employee'}
            </p>

            <form onSubmit={handleConfirmDecision} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Manager Remarks (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Verification comments or feedback..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setDecisionModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className={`px-4 py-1.5 font-semibold text-white rounded-lg cursor-pointer ${
                    decisionStatus === 'approved'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {isUpdating ? 'Saving...' : `Confirm ${decisionStatus}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default WfhLocationsPage;


/**
 * @file FlaggedPunchesPage.jsx
 * @description Flagged Punches Review & Regularization Queue for Managers and HR.
 *
 * SPECIFICATION:
 * - Module M14 (BUILD-GUIDE Section 17 · Row 14.6)
 */

import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Search,
  Filter,
  Check,
  X,
  User,
  ShieldAlert
} from 'lucide-react';
import {
  useGetFlaggedPunchesQuery,
  useReviewFlaggedPunchMutation
} from '../attendanceApi.js';
import { toast } from 'sonner';

export const FlaggedPunchesPage = () => {
  const [statusFilter, setStatusFilter] = useState('pending');
  const [page, setPage] = useState(1);
  const [selectedPunch, setSelectedPunch] = useState(null);
  const [decision, setDecision] = useState('approved');
  const [comments, setComments] = useState('');

  const { data, isLoading, refetch } = useGetFlaggedPunchesQuery({
    status: statusFilter,
    page,
    limit: 15
  });

  const [reviewFlaggedPunch, { isLoading: isSubmitting }] = useReviewFlaggedPunchMutation();

  const punches = data?.data || [];
  const meta = data?.meta || { total: 0, totalPages: 1 };

  const handleOpenReview = (punch) => {
    setSelectedPunch(punch);
    setDecision('approved');
    setComments('');
  };

  const handleCloseReview = () => {
    setSelectedPunch(null);
    setComments('');
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!comments.trim() || comments.trim().length < 5) {
      toast.error('Comments must be at least 5 characters long.');
      return;
    }

    try {
      await reviewFlaggedPunch({
        id: selectedPunch._id,
        decision,
        comments: comments.trim()
      }).unwrap();

      toast.success(
        decision === 'approved'
          ? 'Flagged punch approved and regularized.'
          : 'Flagged punch rejected and marked absent.'
      );
      handleCloseReview();
      refetch();
    } catch (err) {
      toast.error(err.data?.message || err.message || 'Failed to submit punch review.');
    }
  };

  const getReasonLabel = (reason) => {
    switch (reason) {
      case 'geofence_violation':
        return { label: 'Geofence Violation', color: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800' };
      case 'low_accuracy':
        return { label: 'Low GPS Accuracy', color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800' };
      case 'mock_gps':
        return { label: 'Mock GPS Spoof', color: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800' };
      default:
        return { label: reason || 'Flagged Punch', color: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700' };
    }
  };

  const renderPunchMetrics = (p) => {
    if (p.flagReason === 'face_match_failed' || (p.confidenceDistance !== null && p.confidenceDistance !== undefined)) {
      return (
        <div className="flex items-center gap-2">
          {p.snapshotUrl && (
            <img
              src={p.snapshotUrl}
              alt="Face Snapshot"
              className="w-8 h-8 rounded-lg object-cover border border-purple-300 dark:border-purple-800"
            />
          )}
          <div className="font-mono text-xs text-purple-700 dark:text-purple-300">
            <div className="flex items-center gap-1">
              <Camera className="w-3 h-3 text-purple-500" />
              <span>Dist: {p.confidenceDistance ? p.confidenceDistance.toFixed(3) : 'N/A'}</span>
            </div>
            <div className="text-[10px] text-slate-400">Threshold: 0.500</div>
          </div>
        </div>
      );
    }

    return (
      <>
        <div className="flex items-center gap-1 font-mono">
          <MapPin className="w-3 h-3 text-rose-500" />
          <span>
            {p.distanceFromOfficeMeters ? `${Math.round(p.distanceFromOfficeMeters)}m from office` : 'N/A'}
          </span>
        </div>
        {p.location?.accuracy && (
          <div className="text-[10px] text-slate-400">
            Accuracy: ±${Math.round(p.location.accuracy)}m
          </div>
        )}
      </>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-rose-600 dark:text-rose-400" />
            Flagged Punches Queue
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review and regularize attendance records flagged for out-of-bounds geofencing or inaccurate GPS signals.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl self-start">
          {[
            { id: 'pending', label: 'Pending Review' },
            { id: 'resolved', label: 'Resolved' },
            { id: 'all', label: 'All Records' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setStatusFilter(tab.id);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === tab.id
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-slate-400">Loading flagged punch records...</div>
        ) : punches.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto" />
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
              No flagged punches found
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              All employees clocked in within authorized boundaries or all flagged records have been reviewed.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Flag Reason</th>
                  <th className="py-3 px-4">Distance / GPS</th>
                  <th className="py-3 px-4">Resolution Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                {punches.map((p) => {
                  const reasonMeta = getReasonLabel(p.flagReason);
                  const isResolved = p.flagResolved;
                  return (
                    <tr key={p._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4 font-medium">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 text-xs">
                            {p.employeeId?.name ? p.employeeId.name.charAt(0) : 'E'}
                          </div>
                          <div>
                            <div className="text-slate-900 dark:text-white font-semibold">
                              {p.employeeId?.name || 'Employee'}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {p.employeeId?.employeeCode || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {new Date(p.date).toLocaleDateString()}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {p.checkIn ? new Date(p.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${reasonMeta.color}`}>
                          {reasonMeta.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1 font-mono">
                          <MapPin className="w-3 h-3 text-rose-500" />
                          <span>
                            {p.distanceFromOfficeMeters ? `${Math.round(p.distanceFromOfficeMeters)}m from office` : 'N/A'}
                          </span>
                        </div>
                        {p.location?.accuracy && (
                          <div className="text-[10px] text-slate-400">
                            Accuracy: ±{Math.round(p.location.accuracy)}m
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {isResolved ? (
                          <div className="space-y-0.5">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                p.flagResolution?.decision === 'approved'
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                  : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                              }`}
                            >
                              {p.flagResolution?.decision === 'approved' ? (
                                <Check className="w-3 h-3" />
                              ) : (
                                <X className="w-3 h-3" />
                              )}
                              {p.flagResolution?.decision?.toUpperCase()}
                            </span>
                            {p.flagResolution?.comments && (
                              <div className="text-[11px] text-slate-500 truncate max-w-xs">
                                "{p.flagResolution.comments}"
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            Pending Review
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {!isResolved ? (
                          <button
                            onClick={() => handleOpenReview(p)}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-xs transition-colors cursor-pointer"
                          >
                            Review
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400">Resolved</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination footer */}
        {meta.totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <div>
              Page {meta.page} of {meta.totalPages} ({meta.total} total flagged)
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 border rounded-lg disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 border rounded-lg disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedPunch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Review Flagged Punch
              </h3>
              <button
                onClick={handleCloseReview}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Punch details preview */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Employee:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  {selectedPunch.employeeId?.name} ({selectedPunch.employeeId?.employeeCode})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date & Check-in:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  {new Date(selectedPunch.date).toLocaleDateString()} at{' '}
                  {selectedPunch.checkIn
                    ? new Date(selectedPunch.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Flag Reason:</span>
                <span className="font-semibold text-rose-600 dark:text-rose-400">
                  {getReasonLabel(selectedPunch.flagReason).label}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Distance From Office:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  {selectedPunch.distanceFromOfficeMeters ? `${Math.round(selectedPunch.distanceFromOfficeMeters)} meters` : 'Unknown'}
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              {/* Decision Toggle */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Resolution Decision
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDecision('approved')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      decision === 'approved'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    Approve / Regularize
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecision('rejected')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      decision === 'rejected'
                        ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <XCircle className="w-4 h-4 text-rose-500" />
                    Reject (Mark Absent)
                  </button>
                </div>
              </div>

              {/* Review Comments */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Manager Remarks / Justification <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Provide detailed justification for approving or rejecting this flagged punch..."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-[10px] text-slate-400">Minimum 5 characters required.</span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleCloseReview}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || comments.trim().length < 5}
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-sm cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : 'Confirm Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default FlaggedPunchesPage;


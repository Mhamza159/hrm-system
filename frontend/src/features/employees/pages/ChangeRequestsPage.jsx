/**
 * @file ChangeRequestsPage.jsx
 * @description HR Review Center for Employee Sensitive Profile Change Requests.
 * 
 * SPECIFICATION & DATAFLOW:
 * - Module: M3 Employee Management (BUILD-GUIDE Section 8 · Row 3.16)
 * - Layer: Frontend Page Component (HR Review Queue)
 * - Theme: Forest & Emerald Enterprise Craft.
 */

import React, { useState } from 'react';
import { toast } from 'sonner';
import {
  FileCheck2,
  CheckCircle2,
  User,
  Loader2
} from 'lucide-react';
import { Card } from '../../../components/common/Card.jsx';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { ScreenSkeleton } from '../../../components/common/ScreenSkeleton.jsx';
import { RefreshButton } from '../../../components/common/RefreshButton.jsx';
import {
  useGetChangeRequestsQuery,
  useDecideChangeRequestMutation
} from '../employeesApi.js';
import { formatDate } from '../../../lib/formatters.js';

export default function ChangeRequestsPage() {
  const [selectedStatus, setSelectedStatus] = useState('pending');
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const { data: requestData, isLoading, isFetching, refetch } = useGetChangeRequestsQuery(
    selectedStatus === 'all' ? {} : { status: selectedStatus }
  );

  const [decideChangeRequest, { isLoading: isDeciding }] = useDecideChangeRequestMutation();

  const requests = requestData?.data || [];

  if (isLoading && !requestData) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto pb-12">
        <ScreenSkeleton variant="table" />
      </div>
    );
  }

  const handleApprove = async (id) => {
    try {
      await decideChangeRequest({ id, action: 'approved' }).unwrap();
      toast.success('Change request approved and profile updated');
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to approve request');
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      toast.error('Please specify a rejection reason');
      return;
    }

    try {
      await decideChangeRequest({
        id: rejectingId,
        action: 'rejected',
        rejectionReason: rejectionReason.trim()
      }).unwrap();

      toast.success('Change request rejected');
      setRejectingId(null);
      setRejectionReason('');
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to reject request');
    }
  };

  const renderRequestedDiff = (req) => {
    const val = req.requestedValue;
    if (req.field === 'bankDetails') {
      return (
        <div className="text-xs space-y-1.5 bg-slate-50 dark:bg-[#0A110D] p-3 rounded-xl border border-slate-200 dark:border-[#1A3125]">
          <div><span className="text-slate-400 dark:text-slate-500">Bank:</span> <span className="font-semibold text-slate-800 dark:text-slate-200">{val?.bankName || '—'}</span></div>
          <div><span className="text-slate-400 dark:text-slate-500">Account Title:</span> <span className="font-semibold text-slate-800 dark:text-slate-200">{val?.accountTitle || '—'}</span></div>
          <div><span className="text-slate-400 dark:text-slate-500">Account #:</span> <span className="font-mono text-slate-800 dark:text-slate-200">{val?.accountNumber || '—'}</span></div>
          <div><span className="text-slate-400 dark:text-slate-500">IBAN:</span> <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{val?.iban || '—'}</span></div>
        </div>
      );
    }
    if (req.field === 'address') {
      return (
        <div className="text-xs space-y-1.5 bg-slate-50 dark:bg-[#0A110D] p-3 rounded-xl border border-slate-200 dark:border-[#1A3125]">
          <div><span className="text-slate-400 dark:text-slate-500">Street:</span> <span className="font-semibold text-slate-800 dark:text-slate-200">{val?.street || '—'}</span></div>
          <div><span className="text-slate-400 dark:text-slate-500">City / State:</span> <span className="font-semibold text-slate-800 dark:text-slate-200">{val?.city}, {val?.state}</span></div>
          <div><span className="text-slate-400 dark:text-slate-500">Postal Code:</span> <span className="font-mono text-slate-800 dark:text-slate-200">{val?.postalCode || '—'}</span></div>
        </div>
      );
    }
    if (req.field === 'emergencyContact') {
      return (
        <div className="text-xs space-y-1.5 bg-slate-50 dark:bg-[#0A110D] p-3 rounded-xl border border-slate-200 dark:border-[#1A3125]">
          <div><span className="text-slate-400 dark:text-slate-500">Person:</span> <span className="font-semibold text-slate-800 dark:text-slate-200">{val?.name} ({val?.relationship})</span></div>
          <div><span className="text-slate-400 dark:text-slate-500">Phone:</span> <span className="font-mono text-slate-800 dark:text-slate-200">{val?.phone}</span></div>
        </div>
      );
    }
    return <pre className="text-xs font-mono p-2 bg-slate-50 dark:bg-[#0A110D] rounded-xl text-slate-800 dark:text-slate-200">{JSON.stringify(val, null, 2)}</pre>;
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <PageHeader
        title="Profile Change Requests"
        description="Review and authorize employee requests for sensitive banking coordinates, residential addresses, and emergency contacts."
        actions={<RefreshButton onRefresh={refetch} isFetching={isFetching} />}
      />

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-[#1A3125] pb-3 overflow-x-auto">
        {[
          { id: 'pending', label: 'Pending Review' },
          { id: 'approved', label: 'Approved' },
          { id: 'rejected', label: 'Rejected' },
          { id: 'all', label: 'All Requests' }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSelectedStatus(tab.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              selectedStatus === tab.id
                ? 'bg-[#00C471] text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#00C471]" />
        </div>
      ) : requests.length === 0 ? (
        <Card className="p-10 text-center text-slate-400 dark:text-slate-500 border-slate-200 dark:border-[#1A3125]">
          <FileCheck2 className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3 stroke-1" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">No requests in this view</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">No profile change requests found matching current filter.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <Card key={req._id} className="p-5 border-slate-200 dark:border-[#1A3125] space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-[#1A3125] pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 border border-emerald-200/80 dark:border-emerald-800/60">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      {req.employeeId?.name || 'Employee'}{' '}
                      <span className="font-mono text-slate-500 dark:text-slate-400">({req.employeeId?.employeeCode})</span>
                    </h4>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">
                      Requested by {req.requestedBy?.email} on {formatDate(req.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                      req.status === 'pending'
                        ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/40'
                        : req.status === 'approved'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40'
                        : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/40'
                    }`}
                  >
                    {req.status}
                  </span>
                </div>
              </div>

              {/* Justification & Proposed Data */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h5 className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Employee Justification
                  </h5>
                  <p className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-[#0A110D] p-3 rounded-xl border border-slate-200 dark:border-[#1A3125] italic">
                    "{req.reason}"
                  </p>
                </div>

                <div>
                  <h5 className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Proposed Data ({req.field})
                  </h5>
                  {renderRequestedDiff(req)}
                </div>
              </div>

              {/* Rejection Notes if already rejected */}
              {req.status === 'rejected' && req.rejectionReason && (
                <div className="text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/30 p-3 rounded-xl border border-rose-200 dark:border-rose-800/40">
                  <span className="font-semibold">Rejection Reason:</span> {req.rejectionReason}
                </div>
              )}

              {/* Actions for Pending Requests */}
              {req.status === 'pending' && (
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-[#1A3125]">
                  <button
                    type="button"
                    onClick={() => setRejectingId(req._id)}
                    disabled={isDeciding}
                    className="px-4 py-2 rounded-xl border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Reject Request
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApprove(req._id)}
                    disabled={isDeciding}
                    className="px-4 py-2 rounded-xl bg-[#00C471] hover:bg-[#00ad64] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Approve & Apply Updates
                  </button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Rejection Modal */}
      {rejectingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-[#111D17] rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-[#1A3125] p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Reject Profile Change Request</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Provide a clear reason explaining why this update was declined for the employee.
            </p>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Bank statement title does not match official employee name..."
              className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50 dark:bg-[#0A110D] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/30 resize-none"
            />
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-[#1A3125]">
              <button
                type="button"
                onClick={() => {
                  setRejectingId(null);
                  setRejectionReason('');
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#15241C] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={isDeciding || !rejectionReason.trim()}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold disabled:opacity-50 cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

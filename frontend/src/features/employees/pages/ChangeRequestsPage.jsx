/**
 * @file ChangeRequestsPage.jsx
 * @description HR Review Center for Employee Sensitive Profile Change Requests.
 * 
 * SPECIFICATION & DATAFLOW:
 * - Module: M3 Employee Management (BUILD-GUIDE Section 8 · Row 3.16)
 * - Layer: Frontend Page Component (HR Review Queue)
 * - Dataflow: GET /api/v1/change-requests $\rightarrow$ Inspect Proposed Diffs $\rightarrow$ Approve / Reject Mutation
 */

import React, { useState } from 'react';
import { toast } from 'sonner';
import {
  FileCheck2,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  ShieldAlert,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Card } from '../../../components/common/Card.jsx';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import {
  useGetChangeRequestsQuery,
  useDecideChangeRequestMutation
} from '../employeesApi.js';
import { formatDate } from '../../../lib/formatters.js';

export default function ChangeRequestsPage() {
  const [selectedStatus, setSelectedStatus] = useState('pending');
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const { data: requestData, isLoading, refetch } = useGetChangeRequestsQuery(
    selectedStatus === 'all' ? {} : { status: selectedStatus }
  );

  const [decideChangeRequest, { isLoading: isDeciding }] = useDecideChangeRequestMutation();

  const requests = requestData?.data || [];

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
        <div className="text-xs space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-200">
          <div><span className="text-slate-500">Bank:</span> <span className="font-semibold">{val?.bankName || '—'}</span></div>
          <div><span className="text-slate-500">Account Title:</span> <span className="font-semibold">{val?.accountTitle || '—'}</span></div>
          <div><span className="text-slate-500">Account #:</span> <span className="font-mono">{val?.accountNumber || '—'}</span></div>
          <div><span className="text-slate-500">IBAN:</span> <span className="font-mono font-bold text-emerald-700">{val?.iban || '—'}</span></div>
        </div>
      );
    }
    if (req.field === 'address') {
      return (
        <div className="text-xs space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-200">
          <div><span className="text-slate-500">Street:</span> <span className="font-semibold">{val?.street || '—'}</span></div>
          <div><span className="text-slate-500">City / State:</span> <span className="font-semibold">{val?.city}, {val?.state}</span></div>
          <div><span className="text-slate-500">Postal Code:</span> <span className="font-mono">{val?.postalCode || '—'}</span></div>
        </div>
      );
    }
    if (req.field === 'emergencyContact') {
      return (
        <div className="text-xs space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-200">
          <div><span className="text-slate-500">Person:</span> <span className="font-semibold">{val?.name} ({val?.relationship})</span></div>
          <div><span className="text-slate-500">Phone:</span> <span className="font-mono">{val?.phone}</span></div>
        </div>
      );
    }
    return <pre className="text-xs font-mono p-2 bg-slate-50 rounded">{JSON.stringify(val, null, 2)}</pre>;
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <PageHeader
        title="Profile Change Requests"
        subtitle="Review and authorize employee requests for sensitive banking coordinates, residential addresses, and emergency contacts."
      />

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
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
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              selectedStatus === tab.id
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
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
        <Card className="p-10 text-center text-slate-400">
          <FileCheck2 className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <h3 className="text-sm font-bold text-slate-700">No requests in this view</h3>
          <p className="text-xs text-slate-500">No profile change requests found matching current filter.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <Card key={req._id} className="p-5 border-slate-200 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      {req.employeeId?.name || 'Employee'}{' '}
                      <span className="font-mono text-slate-500">({req.employeeId?.employeeCode})</span>
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Requested by {req.requestedBy?.email} on {formatDate(req.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                      req.status === 'pending'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : req.status === 'approved'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-100 text-rose-800 border border-rose-200'
                    }`}
                  >
                    {req.status}
                  </span>
                </div>
              </div>

              {/* Justification & Proposed Data */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h5 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Employee Justification
                  </h5>
                  <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200 italic">
                    "{req.reason}"
                  </p>
                </div>

                <div>
                  <h5 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Proposed Data ({req.field})
                  </h5>
                  {renderRequestedDiff(req)}
                </div>
              </div>

              {/* Rejection Notes if already rejected */}
              {req.status === 'rejected' && req.rejectionReason && (
                <div className="text-xs text-rose-700 bg-rose-50 p-3 rounded-lg border border-rose-200">
                  <span className="font-semibold">Rejection Reason:</span> {req.rejectionReason}
                </div>
              )}

              {/* Actions for Pending Requests */}
              {req.status === 'pending' && (
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setRejectingId(req._id)}
                    disabled={isDeciding}
                    className="px-4 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Reject Request
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApprove(req._id)}
                    disabled={isDeciding}
                    className="px-4 py-2 rounded-xl bg-[#00C471] hover:bg-[#049856] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
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
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Reject Profile Change Request</h3>
            <p className="text-xs text-slate-500">
              Provide a clear reason explaining why this update was declined for the employee.
            </p>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Bank statement title does not match official employee name..."
              className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500/30 resize-none"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setRejectingId(null);
                  setRejectionReason('');
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={isDeciding || !rejectionReason.trim()}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold disabled:opacity-50"
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

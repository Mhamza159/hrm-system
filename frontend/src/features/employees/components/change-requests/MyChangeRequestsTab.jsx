/**
 * @file MyChangeRequestsTab.jsx
 * @description Self-Service Tab embedded in MyProfilePage.jsx allowing employees to view,
 * track, cancel, and submit their own profile & organizational change requests.
 * Strictly adheres to docs/UI-REFERENCE.md (Elvara Forest & Emerald Enterprise Craft).
 */

import React, { useState } from 'react';
import { toast } from 'sonner';
import {
  FileText,
  Plus,
  Eye,
  Ban,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { Card } from '../../../../components/common/Card.jsx';
import {
  useGetMyChangeRequestsQuery,
  useCancelChangeRequestMutation
} from '../../employeesApi.js';
import {
  getStatusBadge,
  getCategoryBadge,
  getPriorityBadge
} from './changeRequestTheme.js';
import { formatDate } from '../../../../lib/formatters.js';
import { ChangeRequestInspectModal } from './ChangeRequestInspectModal.jsx';
import { ChangeRequestSubmitModal } from './ChangeRequestSubmitModal.jsx';

export function MyChangeRequestsTab({ currentEmployee }) {
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [inspectedRequest, setInspectedRequest] = useState(null);
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);

  const { data: requestsData, isLoading, isFetching, refetch } = useGetMyChangeRequestsQuery(
    selectedStatus === 'all' ? {} : { status: selectedStatus }
  );

  const [cancelChangeRequest, { isLoading: isCancelling }] = useCancelChangeRequestMutation();

  const requests = requestsData?.data || requestsData || [];

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to withdraw this change request?')) return;
    try {
      setCancellingId(id);
      await cancelChangeRequest({ id, reason: 'Withdrawn by employee' }).unwrap();
      toast.success('Change request withdrawn successfully');
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to cancel change request');
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-white dark:bg-[#111D17] rounded-2xl border border-slate-200 dark:border-[#1A3125]">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            My Change Requests
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Track status and reviewer decisions for your sensitive info and organizational requests
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2 rounded-xl border border-slate-200 dark:border-[#1A3125] text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer transition-colors"
            title="Refresh requests"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => setIsSubmitOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-[#00C471] hover:bg-[#00ad64] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" /> New Change Request
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-[#1A3125] pb-2.5 overflow-x-auto">
        {[
          { id: 'all', label: 'All Requests' },
          { id: 'pending', label: 'Pending Review' },
          { id: 'approved', label: 'Approved' },
          { id: 'rejected', label: 'Rejected' },
          { id: 'returned', label: 'Returned for Revision' }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSelectedStatus(tab.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedStatus === tab.id
                ? 'bg-[#00C471] text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Requests List */}
      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#00C471]" />
        </div>
      ) : requests.length === 0 ? (
        <Card className="p-10 text-center border-slate-200 dark:border-[#1A3125]">
          <FileText className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2 stroke-1" />
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
            No Change Requests Found
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            You haven't submitted any change requests matching this filter.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => {
            const statusCfg = getStatusBadge(req.status);
            const categoryCfg = getCategoryBadge(req.category);
            const priorityCfg = getPriorityBadge(req.priority);
            const StatusIcon = statusCfg.icon;
            const CategoryIcon = categoryCfg.icon;

            const isPending = req.status === 'pending' || req.status === 'under_review';

            return (
              <Card
                key={req._id}
                className="p-4 border-slate-200 dark:border-[#1A3125] space-y-3 hover:shadow-xs transition-shadow"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 border-b border-slate-100 dark:border-[#1A3125] pb-2.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${categoryCfg.colorClass}`}
                    >
                      <CategoryIcon className="w-3 h-3" />
                      {categoryCfg.label}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${priorityCfg.badgeClass}`}>
                      {priorityCfg.label}
                    </span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                      • {formatDate(req.createdAt)}
                    </span>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusCfg.badgeClass}`}
                  >
                    <StatusIcon className="w-3 h-3" />
                    {statusCfg.label}
                  </span>
                </div>

                {/* Reason & Content */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Your Reason
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 italic mt-0.5">
                      "{req.reason}"
                    </p>
                  </div>

                  {req.decisionReason && (
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Reviewer Feedback
                      </div>
                      <p className="text-slate-800 dark:text-slate-200 font-medium mt-0.5">
                        "{req.decisionReason}"
                      </p>
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-[#1A3125]">
                  <button
                    type="button"
                    onClick={() => setInspectedRequest(req)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#1A3125] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" /> View Details & Diff
                  </button>

                  {isPending && (
                    <button
                      type="button"
                      onClick={() => handleCancel(req._id)}
                      disabled={isCancelling && cancellingId === req._id}
                      className="px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Ban className="w-3.5 h-3.5" /> Cancel Request
                    </button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Inspect Modal */}
      <ChangeRequestInspectModal
        isOpen={Boolean(inspectedRequest)}
        onClose={() => setInspectedRequest(null)}
        request={inspectedRequest}
        canApprove={false}
      />

      {/* Submit Modal */}
      <ChangeRequestSubmitModal
        isOpen={isSubmitOpen}
        onClose={() => {
          setIsSubmitOpen(false);
          refetch();
        }}
        currentEmployee={currentEmployee}
      />
    </div>
  );
}

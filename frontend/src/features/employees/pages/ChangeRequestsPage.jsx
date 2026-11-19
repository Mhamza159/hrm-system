/**
 * @file ChangeRequestsPage.jsx
 * @description Master HR & Administrative Review Center for Employee Profile & Organizational Change Requests.
 * Strictly adheres to docs/UI-REFERENCE.md (Elvara Forest & Emerald Enterprise Craft).
 */

import React, { useState } from 'react';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { RefreshButton } from '../../../components/common/RefreshButton.jsx';
import {
  useGetChangeRequestsQuery,
  useGetChangeRequestStatsQuery,
  useDecideChangeRequestMutation,
  useReturnChangeRequestMutation,
  useGetMyProfileQuery
} from '../employeesApi.js';
import { useGetDepartmentsQuery } from '../../departments/departmentsApi.js';
import { ChangeRequestDashboard } from '../components/change-requests/ChangeRequestDashboard.jsx';
import { ChangeRequestFilterBar } from '../components/change-requests/ChangeRequestFilterBar.jsx';
import { ChangeRequestTable } from '../components/change-requests/ChangeRequestTable.jsx';
import { ChangeRequestInspectModal } from '../components/change-requests/ChangeRequestInspectModal.jsx';
import { ChangeRequestDecisionModal } from '../components/change-requests/ChangeRequestDecisionModal.jsx';
import { ChangeRequestSubmitModal } from '../components/change-requests/ChangeRequestSubmitModal.jsx';

export default function ChangeRequestsPage() {
  // Query Filter States
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Modals State
  const [inspectedRequest, setInspectedRequest] = useState(null);
  const [decisionModalConfig, setDecisionModalConfig] = useState(null); // { request, actionType: 'approve' | 'reject' | 'return' }
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  // Fetch Lookups
  const { data: profileData } = useGetMyProfileQuery();
  const currentEmployee = profileData?.data;

  const { data: deptData } = useGetDepartmentsQuery();
  const departments = deptData?.data || [];

  // Fetch Stats
  const {
    data: statsData,
    isLoading: isStatsLoading,
    refetch: refetchStats
  } = useGetChangeRequestStatsQuery();
  const stats = statsData?.data;

  // Build Query Params
  const queryParams = {
    page,
    limit,
    ...(selectedStatus !== 'all' && { status: selectedStatus }),
    ...(selectedCategory !== 'all' && { category: selectedCategory }),
    ...(selectedPriority !== 'all' && { priority: selectedPriority }),
    ...(selectedDepartmentId !== 'all' && { departmentId: selectedDepartmentId }),
    ...(search.trim() && { search: search.trim() })
  };

  // Fetch Filtered Requests
  const {
    data: requestsData,
    isLoading: isRequestsLoading,
    isFetching,
    refetch: refetchRequests
  } = useGetChangeRequestsQuery(queryParams);

  const [decideChangeRequest, { isLoading: isDeciding }] = useDecideChangeRequestMutation();
  const [returnChangeRequest, { isLoading: isReturning }] = useReturnChangeRequestMutation();

  const requestsPayload = requestsData?.data;
  const requests = Array.isArray(requestsPayload)
    ? requestsPayload
    : requestsPayload?.requests || [];
  const total = requestsPayload?.total || requests.length;
  const totalPages = requestsPayload?.totalPages || 1;

  const handleRefreshAll = () => {
    refetchStats();
    refetchRequests();
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedStatus('all');
    setSelectedCategory('all');
    setSelectedPriority('all');
    setSelectedDepartmentId('all');
    setPage(1);
  };

  // Decision Modal Confirmation Handler
  const handleConfirmDecision = async ({ id, action, rejectionReason, notes }) => {
    try {
      if (action === 'returned') {
        await returnChangeRequest({ id, notes }).unwrap();
        toast.success('Change request returned to employee for correction');
      } else {
        await decideChangeRequest({
          id,
          action,
          rejectionReason,
          decisionReason: rejectionReason
        }).unwrap();
        toast.success(
          action === 'approved'
            ? 'Change request approved and profile updated'
            : 'Change request rejected'
        );
      }
      setDecisionModalConfig(null);
      handleRefreshAll();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to process change request decision');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Top Header */}
      <PageHeader
        title="Change Request Center"
        description="Comprehensive review queue for sensitive banking, personal info, department transfers, and organizational changes."
        actions={
          <div className="flex items-center gap-2">
            <RefreshButton onRefresh={handleRefreshAll} isFetching={isFetching} />
            <button
              type="button"
              onClick={() => setIsSubmitModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#00C471] hover:bg-[#00ad64] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" /> New Change Request
            </button>
          </div>
        }
      />

      {/* KPI Metrics Dashboard & SVG Analytics */}
      <ChangeRequestDashboard stats={stats} isLoading={isStatsLoading} />

      {/* Filter & Search Toolbar */}
      <ChangeRequestFilterBar
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        status={selectedStatus}
        onStatusChange={(val) => {
          setSelectedStatus(val);
          setPage(1);
        }}
        category={selectedCategory}
        onCategoryChange={(val) => {
          setSelectedCategory(val);
          setPage(1);
        }}
        priority={selectedPriority}
        onPriorityChange={(val) => {
          setSelectedPriority(val);
          setPage(1);
        }}
        departments={departments}
        departmentId={selectedDepartmentId}
        onDepartmentChange={(val) => {
          setSelectedDepartmentId(val);
          setPage(1);
        }}
        onResetFilters={handleResetFilters}
      />

      {/* Main Records Table */}
      <ChangeRequestTable
        requests={requests}
        isLoading={isRequestsLoading}
        page={page}
        limit={limit}
        total={total}
        totalPages={totalPages}
        onPageChange={setPage}
        onLimitChange={(newLimit) => {
          setLimit(newLimit);
          setPage(1);
        }}
        onInspect={(req) => setInspectedRequest(req)}
        onApprove={(req) => setDecisionModalConfig({ request: req, actionType: 'approve' })}
        onReject={(req) => setDecisionModalConfig({ request: req, actionType: 'reject' })}
        onReturn={(req) => setDecisionModalConfig({ request: req, actionType: 'return' })}
        canApprove={true}
      />

      {/* Inspect Forensic Diff Modal */}
      <ChangeRequestInspectModal
        isOpen={Boolean(inspectedRequest)}
        onClose={() => setInspectedRequest(null)}
        request={inspectedRequest}
        onApprove={(req) => setDecisionModalConfig({ request: req, actionType: 'approve' })}
        onReject={(req) => setDecisionModalConfig({ request: req, actionType: 'reject' })}
        onReturn={(req) => setDecisionModalConfig({ request: req, actionType: 'return' })}
        canApprove={true}
      />

      {/* Decision Rationale Modal */}
      <ChangeRequestDecisionModal
        isOpen={Boolean(decisionModalConfig)}
        onClose={() => setDecisionModalConfig(null)}
        request={decisionModalConfig?.request}
        actionType={decisionModalConfig?.actionType}
        onConfirm={handleConfirmDecision}
        isLoading={isDeciding || isReturning}
      />

      {/* Submit Change Request Modal */}
      <ChangeRequestSubmitModal
        isOpen={isSubmitModalOpen}
        onClose={() => {
          setIsSubmitModalOpen(false);
          handleRefreshAll();
        }}
        currentEmployee={currentEmployee}
      />
    </div>
  );
}

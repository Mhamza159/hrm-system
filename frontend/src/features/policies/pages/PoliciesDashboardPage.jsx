/**
 * @file PoliciesDashboardPage.jsx
 * @description Administrative Command Center for Company Policies with live KPIs, category management, and workflow modals.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Archive,
  ShieldAlert,
  TrendingUp,
  LayoutGrid,
  List,
  RefreshCw,
  FolderPlus,
  BookOpen
} from 'lucide-react';
import {
  useGetPoliciesQuery,
  useGetPolicyStatsQuery,
  useGetCategoriesQuery,
  useDeletePolicyMutation,
  useSubmitPolicyForApprovalMutation
} from '../policyApi.js';
import { useAuth } from '../../../hooks/useAuth.js';
import PolicyCard from '../components/PolicyCard.jsx';
import PolicyTable from '../components/PolicyTable.jsx';
import PolicyFormModal from '../components/PolicyFormModal.jsx';
import CategoryManagementModal from '../components/CategoryManagementModal.jsx';
import PolicyDetailDrawer from '../components/PolicyDetailDrawer.jsx';
import PolicyVersionHistoryModal from '../components/PolicyVersionHistoryModal.jsx';
import PolicyApprovalModal from '../components/PolicyApprovalModal.jsx';
import PublishPolicyModal from '../components/PublishPolicyModal.jsx';
import PolicyAcknowledgementRosterModal from '../components/PolicyAcknowledgementRosterModal.jsx';

export const PoliciesDashboardPage = () => {
  const navigate = useNavigate();
  const { isHR, isSuperAdmin, isDeptManager } = useAuth();
  const canManage = isHR || isSuperAdmin;
  const canApprove = isHR || isSuperAdmin || isDeptManager;

  // Filter States
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedScope, setSelectedScope] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Modal & Drawer States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isRosterModalOpen, setIsRosterModalOpen] = useState(false);

  const [activePolicy, setActivePolicy] = useState(null);

  // Queries
  const { data: statsData, refetch: refetchStats } = useGetPolicyStatsQuery();
  const { data: categories = [], refetch: refetchCategories } = useGetCategoriesQuery();
  const {
    data: policiesData,
    isLoading: isPoliciesLoading,
    refetch: refetchPolicies
  } = useGetPoliciesQuery({
    search: search || undefined,
    category: selectedCategory || undefined,
    status: selectedStatus || undefined,
    scope: selectedScope || undefined,
    limit: 50
  });

  const [deletePolicy] = useDeletePolicyMutation();
  const [submitPolicyForApproval] = useSubmitPolicyForApprovalMutation();

  const policies = policiesData?.policies || [];
  const stats = statsData?.stats || {
    total: 0,
    published: 0,
    draft: 0,
    pendingApproval: 0,
    archived: 0,
    requiresAck: 0,
    complianceRate: 0
  };

  const handleRefresh = () => {
    refetchStats();
    refetchCategories();
    refetchPolicies();
  };

  const handleOpenCreate = () => {
    setActivePolicy(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (policy) => {
    setActivePolicy(policy);
    setIsFormModalOpen(true);
  };

  const handleOpenView = (policy) => {
    setActivePolicy(policy);
    setIsDetailDrawerOpen(true);
  };

  const handleOpenHistory = (policy) => {
    setActivePolicy(policy);
    setIsVersionModalOpen(true);
  };

  const handleOpenApproval = (policy) => {
    setActivePolicy(policy);
    setIsApprovalModalOpen(true);
  };

  const handleOpenPublish = (policy) => {
    setActivePolicy(policy);
    setIsPublishModalOpen(true);
  };

  const handleOpenRoster = (policy) => {
    setActivePolicy(policy);
    setIsRosterModalOpen(true);
  };

  const handleSubmitForApproval = async (policy) => {
    if (window.confirm(`Submit "${policy.title}" for management approval?`)) {
      try {
        await submitPolicyForApproval(policy._id).unwrap();
        handleRefresh();
      } catch (err) {
        alert(err?.data?.message || 'Failed to submit policy for approval.');
      }
    }
  };

  const handleDelete = async (policy) => {
    if (window.confirm(`Archive "${policy.title}" (${policy.policyCode})?`)) {
      try {
        await deletePolicy(policy._id).unwrap();
        handleRefresh();
      } catch (err) {
        alert(err?.data?.message || 'Failed to archive policy.');
      }
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-[#1A3125]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#00C471] bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
              Corporate Governance & Compliance
            </span>
            <span className="text-xs font-mono text-slate-400">· Module M21</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            Company Policies & Regulatory Guidelines
          </h1>
          <p className="text-xs text-slate-500 dark:text-[#7E9E8F] mt-0.5">
            Manage handbooks, standard operating procedures, compliance mandates, and employee acknowledgement tracking.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => navigate('/policies/my-policies')}
            className="h-9 px-3.5 rounded-lg border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#162820] text-xs font-semibold flex items-center gap-1.5 transition shadow-xs"
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-500" />
            <span>Employee Portal</span>
          </button>

          {canManage && (
            <button
              type="button"
              onClick={() => setIsCategoryModalOpen(true)}
              className="h-9 px-3.5 rounded-lg border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#162820] text-xs font-semibold flex items-center gap-1.5 transition shadow-xs"
            >
              <FolderPlus className="w-3.5 h-3.5 text-emerald-500" />
              <span>Categories</span>
            </button>
          )}

          {canManage && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="h-9 px-4 rounded-lg bg-[#00C471] hover:bg-emerald-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Policy</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleRefresh}
            className="h-9 w-9 rounded-lg border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-400 hover:text-slate-600 dark:hover:text-white flex items-center justify-center transition shadow-xs"
            title="Refresh policies"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 7 KPI Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* Total */}
        <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-xl p-3.5 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-[#7E9E8F]">Total</span>
            <div className="w-6 h-6 rounded-md bg-slate-100 dark:bg-[#162820] flex items-center justify-center text-slate-500">
              <FileText className="w-3.5 h-3.5" />
            </div>
          </div>
          <span className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-2">
            {stats.total}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5">All directives</span>
        </div>

        {/* Published */}
        <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-xl p-3.5 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-[#7E9E8F]">Published</span>
            <div className="w-6 h-6 rounded-md bg-emerald-500/10 text-[#00C471] flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <span className="text-xl font-bold font-mono text-emerald-600 dark:text-[#00C471] mt-2">
            {stats.published}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5">Enforced rules</span>
        </div>

        {/* Draft */}
        <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-xl p-3.5 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-[#7E9E8F]">Drafts</span>
            <div className="w-6 h-6 rounded-md bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <span className="text-xl font-bold font-mono text-blue-600 dark:text-blue-400 mt-2">
            {stats.draft}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5">Authoring</span>
        </div>

        {/* Pending Approval */}
        <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-xl p-3.5 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-[#7E9E8F]">In Review</span>
            <div className="w-6 h-6 rounded-md bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <span className="text-xl font-bold font-mono text-amber-500 mt-2">
            {stats.pendingApproval}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5">Awaiting sign-off</span>
        </div>

        {/* Archived */}
        <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-xl p-3.5 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-[#7E9E8F]">Archived</span>
            <div className="w-6 h-6 rounded-md bg-slate-500/10 text-slate-500 flex items-center justify-center">
              <Archive className="w-3.5 h-3.5" />
            </div>
          </div>
          <span className="text-xl font-bold font-mono text-slate-600 dark:text-slate-400 mt-2">
            {stats.archived}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5">Superseded</span>
        </div>

        {/* Mandatory Sign-off */}
        <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-xl p-3.5 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-[#7E9E8F]">Mandatory</span>
            <div className="w-6 h-6 rounded-md bg-violet-500/10 text-violet-500 flex items-center justify-center">
              <ShieldAlert className="w-3.5 h-3.5" />
            </div>
          </div>
          <span className="text-xl font-bold font-mono text-violet-600 dark:text-violet-400 mt-2">
            {stats.requiresAck}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5">Sign-off required</span>
        </div>

        {/* Compliance Rate */}
        <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-xl p-3.5 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-[#7E9E8F]">Compliance</span>
            <div className="w-6 h-6 rounded-md bg-emerald-500/10 text-[#00C471] flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <span className="text-xl font-bold font-mono text-[#00C471] mt-2">
            {stats.complianceRate}%
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5">Workforce rate</span>
        </div>
      </div>

      {/* Filter and Control Toolbar */}
      <div className="p-4 bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl shadow-xs space-y-3">
        {/* Top Controls Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by policy title, code, or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-lg bg-slate-50 dark:bg-[#0C1712] border border-slate-200 dark:border-[#1A3125] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#00C471]"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Status Selector */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-9 px-3 rounded-lg bg-slate-50 dark:bg-[#0C1712] border border-slate-200 dark:border-[#1A3125] text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#00C471]"
            >
              <option value="">All Statuses</option>
              <option value="Published">Published</option>
              <option value="Draft">Draft</option>
              <option value="Pending Approval">Pending Approval</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Archived">Archived</option>
            </select>

            {/* Scope Selector */}
            <select
              value={selectedScope}
              onChange={(e) => setSelectedScope(e.target.value)}
              className="h-9 px-3 rounded-lg bg-slate-50 dark:bg-[#0C1712] border border-slate-200 dark:border-[#1A3125] text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#00C471]"
            >
              <option value="">All Scopes</option>
              <option value="All Employees">All Employees</option>
              <option value="Department Specific">Department Specific</option>
              <option value="Role Specific">Role Specific</option>
              <option value="Management Only">Management Only</option>
            </select>

            {/* View Mode Toggle */}
            <div className="inline-flex rounded-lg border border-slate-200 dark:border-[#1A3125] p-0.5 bg-slate-50 dark:bg-[#0C1712]">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-[#162820] text-[#00C471] shadow-xs'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-white'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md transition cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-[#162820] text-[#00C471] shadow-xs'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-white'
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 text-xs">
          <button
            type="button"
            onClick={() => setSelectedCategory('')}
            className={`px-3 py-1.5 rounded-full font-semibold transition whitespace-nowrap cursor-pointer ${
              selectedCategory === ''
                ? 'bg-[#00C471] text-slate-950 shadow-xs'
                : 'bg-slate-100 dark:bg-[#162820] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#1A3125]'
            }`}
          >
            All Categories ({stats.total})
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id}
              type="button"
              onClick={() => setSelectedCategory(cat._id)}
              className={`px-3 py-1.5 rounded-full font-semibold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                selectedCategory === cat._id
                  ? 'bg-[#00C471] text-slate-950 shadow-xs'
                  : 'bg-slate-100 dark:bg-[#162820] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#1A3125]'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: cat.color }}
              />
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Presentation (Grid or Table) */}
      {isPoliciesLoading ? (
        <div className="p-16 text-center text-xs text-slate-400 bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl">
          Loading policies...
        </div>
      ) : policies.length === 0 ? (
        <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-16 text-center shadow-xs">
          <FileText className="w-12 h-12 text-slate-300 dark:text-[#1A3125] mx-auto mb-3" />
          <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No Policies Found
          </h4>
          <p className="text-xs text-slate-500 dark:text-[#7E9E8F] mt-1 max-w-sm mx-auto">
            Try adjusting your search filters or create a new policy directive.
          </p>
          {canManage && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="mt-4 h-9 px-4 rounded-lg bg-[#00C471] hover:bg-emerald-600 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Author First Policy</span>
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {policies.map((p) => (
            <PolicyCard
              key={p._id}
              policy={p}
              canManage={canManage}
              onView={handleOpenView}
              onEdit={handleOpenEdit}
              onSubmitApproval={handleSubmitForApproval}
              onPublish={handleOpenPublish}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <PolicyTable
          policies={policies}
          canManage={canManage}
          onView={handleOpenView}
          onEdit={handleOpenEdit}
          onSubmitApproval={handleSubmitForApproval}
          onPublish={handleOpenPublish}
          onViewHistory={handleOpenHistory}
          onDelete={handleDelete}
        />
      )}

      {/* Modals & Drawers */}
      <PolicyFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        initialPolicy={activePolicy}
        onSuccess={handleRefresh}
      />

      <CategoryManagementModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
      />

      <PolicyDetailDrawer
        isOpen={isDetailDrawerOpen}
        onClose={() => setIsDetailDrawerOpen(false)}
        policy={activePolicy}
        canManage={canManage}
        canApprove={canApprove}
        onEdit={handleOpenEdit}
        onSubmitApproval={handleSubmitForApproval}
        onApprove={handleOpenApproval}
        onPublish={handleOpenPublish}
        onViewHistory={handleOpenHistory}
        onViewRoster={handleOpenRoster}
      />

      <PolicyVersionHistoryModal
        isOpen={isVersionModalOpen}
        onClose={() => setIsVersionModalOpen(false)}
        policy={activePolicy}
      />

      <PolicyApprovalModal
        isOpen={isApprovalModalOpen}
        onClose={() => setIsApprovalModalOpen(false)}
        policy={activePolicy}
        onSuccess={handleRefresh}
      />

      <PublishPolicyModal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        policy={activePolicy}
        onSuccess={handleRefresh}
      />

      <PolicyAcknowledgementRosterModal
        isOpen={isRosterModalOpen}
        onClose={() => setIsRosterModalOpen(false)}
        policy={activePolicy}
      />
    </div>
  );
};

export default PoliciesDashboardPage;

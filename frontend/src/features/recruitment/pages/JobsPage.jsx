/**
 * @file JobsPage.jsx
 * @description Internal Job Openings & Headcount Requisitions Command Center with Active & Archive Lifecycles (Module M15 / Rows 15.1, 15.2, 15.3).
 * 
 * SPECIFICATION & DESIGN SYSTEM:
 * - Module: M15 Recruitment & AI Screening (BUILD-GUIDE Section 24 · Rows 15.1 to 15.3)
 * - Design System: Forest & Emerald (#111D17 dark surface, #1A3125 dark border, #00C471 emerald accent).
 * - Tabs: Active Openings, Archived Openings, Headcount Requisitions.
 * - Actions: Create, Publish, Close, Archive, Revert, and Permanent Delete with safety checks.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Plus,
  CheckCircle2,
  XCircle,
  Building2,
  Users,
  Search,
  Filter,
  Eye,
  FileCheck,
  Calendar,
  Layers,
  ArrowRight,
  Clock,
  Sparkles,
  Trash2,
  Archive,
  RotateCcw,
  AlertTriangle,
  MapPin,
  ExternalLink
} from 'lucide-react';
import {
  useGetJobsQuery,
  useGetRequisitionsQuery,
  useDecideRequisitionMutation,
  useUpdateJobMutation,
  useDeleteJobMutation,
  useRestoreJobMutation,
  usePermanentDeleteJobMutation
} from '../recruitmentApi.js';
import { useAuth } from '../../../hooks/useAuth.js';
import { usePermission } from '../../../hooks/usePermission.js';
import { RequisitionModal } from '../components/RequisitionModal.jsx';
import { JobArchiveDetailModal } from '../components/JobArchiveDetailModal.jsx';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog.jsx';
import { RefreshButton } from '../components/RefreshButton.jsx';
import { formatDate } from '../../../lib/formatters.js';
import { toast } from 'sonner';

export const JobsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { can, isSuperAdmin } = usePermission();

  // Active top-level tab: 'active' | 'archive' | 'requisitions'
  const [activeTab, setActiveTab] = useState('active');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState('all');

  // Modals state
  const [isReqModalOpen, setIsReqModalOpen] = useState(false);
  const [selectedArchiveJob, setSelectedArchiveJob] = useState(null);
  const [jobToArchive, setJobToArchive] = useState(null);

  // Requisition decision state
  const [selectedReq, setSelectedReq] = useState(null);
  const [decisionAction, setDecisionAction] = useState(null); // 'approved' | 'rejected'
  const [decisionRemarks, setDecisionRemarks] = useState('');

  // Fetch Jobs based on active tab
  const isArchiveTab = activeTab === 'archive';
  const {
    data: jobsRes,
    isLoading: isLoadingJobs,
    isFetching: isFetchingJobs,
    refetch: refetchJobs
  } = useGetJobsQuery({
    search: search.trim() || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    employmentType: employmentTypeFilter !== 'all' ? employmentTypeFilter : undefined,
    archived: isArchiveTab ? 'true' : 'false'
  });

  const {
    data: reqsRes,
    isLoading: isLoadingReqs,
    isFetching: isFetchingReqs,
    refetch: refetchReqs
  } = useGetRequisitionsQuery();

  const [decideRequisition, { isLoading: isDeciding }] = useDecideRequisitionMutation();
  const [updateJob, { isLoading: isUpdatingJob }] = useUpdateJobMutation();
  const [deleteJob, { isLoading: isArchivingJob }] = useDeleteJobMutation();
  const [restoreJob, { isLoading: isRestoringJob }] = useRestoreJobMutation();
  const [permanentDeleteJob, { isLoading: isPermanentDeletingJob }] = usePermanentDeleteJobMutation();

  const jobs = jobsRes?.data?.items || [];
  const stats = jobsRes?.data?.stats || {};
  const requisitions = reqsRes?.data?.items || [];

  const pendingReqsCount = requisitions.filter((r) => r.status === 'Pending_Approval').length;
  const activeCount = stats.active ?? jobs.filter((j) => !j.isDeleted).length;
  const archivedCount = stats.archived ?? 0;
  const publishedCount = stats.published ?? jobs.filter((j) => j.status === 'Published').length;
  const draftCount = stats.draft ?? jobs.filter((j) => j.status === 'Draft').length;

  // Handle Requisition approval/rejection
  const handleDecisionSubmit = async () => {
    if (!selectedReq || !decisionAction) return;
    try {
      await decideRequisition({
        id: selectedReq._id,
        decision: decisionAction,
        remarks: decisionRemarks.trim()
      }).unwrap();

      toast.success(
        decisionAction === 'approved'
          ? 'Requisition approved! A new draft job opening has been automatically created.'
          : 'Requisition rejected with recorded remarks.'
      );
      setSelectedReq(null);
      setDecisionAction(null);
      setDecisionRemarks('');
    } catch (err) {
      toast.error(err?.data?.message || err?.message || 'Failed to submit decision.');
    }
  };

  // Status toggle (Draft -> Published, Published -> Closed)
  const handleStatusToggle = async (job, newStatus) => {
    if (job.status === 'Closed' && newStatus === 'Published') {
      toast.error('Closed jobs cannot be republished. A new job opening must be initiated.');
      return;
    }
    try {
      await updateJob({ id: job._id, status: newStatus }).unwrap();
      toast.success(`Job '${job.title}' is now ${newStatus}.`);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to update job status.');
    }
  };

  // Soft delete / Move to archive
  const handleArchiveConfirm = async () => {
    if (!jobToArchive) return;
    try {
      await deleteJob(jobToArchive._id).unwrap();
      toast.success(`Job '${jobToArchive.title}' moved to archive.`);
      setJobToArchive(null);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to archive job opening.');
    }
  };

  // Restore from archive
  const handleRestoreJob = async (job) => {
    try {
      await restoreJob(job._id).unwrap();
      toast.success(`Job '${job.title}' restored to Active list as Draft.`);
      setSelectedArchiveJob(null);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to restore job opening.');
    }
  };

  // Permanent Delete
  const handlePermanentDeleteJob = async (job) => {
    try {
      await permanentDeleteJob(job._id).unwrap();
      toast.success(`Job '${job.title}' permanently deleted.`);
      setSelectedArchiveJob(null);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to permanently delete job opening.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Briefcase className="w-6 h-6 text-[#00C471]" />
            Recruitment & Job Openings
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Enterprise talent acquisition, public careers portal management, and headcount approval pipelines
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <RefreshButton
            onRefresh={() => {
              if (activeTab === 'requisitions') return refetchReqs();
              return refetchJobs();
            }}
            isFetching={isFetchingJobs || isFetchingReqs}
          />

          {can('recruitment.requisition.create') && (
            <button
              onClick={() => setIsReqModalOpen(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-300 dark:border-[#1A3125] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#162820] transition cursor-pointer flex items-center gap-2"
            >
              <Plus className="w-4 h-4 text-[#00C471]" />
              Request Headcount
            </button>
          )}

          {can('recruitment.candidate.view') && (
            <button
              onClick={() => navigate('/recruitment/pipeline')}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#00C471] hover:bg-[#049856] text-white transition cursor-pointer flex items-center gap-2 shadow-xs"
            >
              <Layers className="w-4 h-4" />
              Candidate Pipeline
            </button>
          )}
        </div>
      </div>

      {/* KPI Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] flex items-center gap-3.5 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-[#162820] flex items-center justify-center text-[#00C471] border border-emerald-100 dark:border-[#1A3125] shrink-0">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Published
            </p>
            <p className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">
              {publishedCount}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] flex items-center gap-3.5 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-500 border border-amber-100 dark:border-amber-900/40 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Drafts
            </p>
            <p className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">
              {draftCount}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] flex items-center gap-3.5 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0">
            <Archive className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Archived
            </p>
            <p className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">
              {archivedCount}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] flex items-center gap-3.5 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-500 border border-blue-100 dark:border-blue-900/40 shrink-0">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Pending Reqs
            </p>
            <p className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">
              {pendingReqsCount}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] flex items-center gap-3.5 shadow-xs col-span-2 sm:col-span-2 lg:col-span-1">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-[#162820] flex items-center justify-center text-[#00C471] border border-emerald-100 dark:border-[#1A3125] shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Public Portal
            </p>
            <a
              href="/careers"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-bold text-[#00C471] hover:underline flex items-center gap-1 mt-0.5"
            >
              Visit Careers <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-[#1A3125] pb-2">
        <button
          onClick={() => setActiveTab('active')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'active'
              ? 'bg-emerald-50 dark:bg-[#162820] text-emerald-700 dark:text-[#00C471] border border-emerald-200 dark:border-[#1A3125]'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          Active Openings ({activeCount})
        </button>

        <button
          onClick={() => setActiveTab('archive')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'archive'
              ? 'bg-emerald-50 dark:bg-[#162820] text-emerald-700 dark:text-[#00C471] border border-emerald-200 dark:border-[#1A3125]'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Archive className="w-3.5 h-3.5" />
          Archive ({archivedCount})
        </button>

        {can('recruitment.requisition.view') && (
          <button
            onClick={() => setActiveTab('requisitions')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'requisitions'
                ? 'bg-emerald-50 dark:bg-[#162820] text-emerald-700 dark:text-[#00C471] border border-emerald-200 dark:border-[#1A3125]'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            Headcount Requisitions ({requisitions.length})
            {pendingReqsCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            )}
          </button>
        )}
      </div>

      {/* Tab Content: Active Openings */}
      {activeTab === 'active' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search active jobs by title, department, or keywords..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-[#00C471]"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl text-xs bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white focus:outline-hidden focus:border-[#00C471] cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="Published">Published (Public)</option>
                <option value="Draft">Draft</option>
                <option value="Closed">Closed</option>
              </select>

              <select
                value={employmentTypeFilter}
                onChange={(e) => setEmploymentTypeFilter(e.target.value)}
                className="px-3 py-2 rounded-xl text-xs bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white focus:outline-hidden focus:border-[#00C471] cursor-pointer"
              >
                <option value="all">All Types</option>
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Remote">Remote</option>
                <option value="Internship">Internship</option>
              </select>
            </div>
          </div>

          {/* Active Jobs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.map((job) => (
              <div
                key={job._id}
                className="p-5 rounded-2xl bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] hover:border-[#00C471]/50 transition shadow-xs flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        job.status === 'Published'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-[#00C471] border border-emerald-200 dark:border-[#1A3125]'
                          : job.status === 'Draft'
                          ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      {job.status}
                    </span>

                    <span className="text-[11px] text-slate-400 font-mono">
                      {job.employmentType}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                      {job.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      {job.departmentId?.name || 'Department'}
                    </p>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                    {job.description}
                  </p>

                  {job.requirements?.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      {job.requirements.slice(0, 3).map((r, i) => (
                        <span
                          key={i}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#162820] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#1A3125]"
                        >
                          {r}
                        </span>
                      ))}
                      {job.requirements.length > 3 && (
                        <span className="text-[10px] text-slate-400">
                          +{job.requirements.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-[#1A3125] flex items-center justify-between">
                  <button
                    onClick={() => navigate(`/recruitment/pipeline?jobId=${job._id}`)}
                    className="text-xs font-semibold text-[#00C471] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    View Pipeline <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  {can('recruitment.job.manage') && (
                    <div className="flex items-center gap-1.5">
                      {job.status === 'Draft' && (
                        <>
                          <button
                            onClick={() => handleStatusToggle(job, 'Published')}
                            className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-emerald-50 dark:bg-[#162820] text-[#00C471] border border-emerald-200 dark:border-[#1A3125] hover:bg-emerald-100 cursor-pointer transition-colors"
                          >
                            Publish
                          </button>
                          <button
                            onClick={() => setJobToArchive(job)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition cursor-pointer"
                            title="Move to Archive"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}

                      {job.status === 'Published' && (
                        <button
                          onClick={() => handleStatusToggle(job, 'Closed')}
                          className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-100 dark:bg-[#162820] text-slate-600 dark:text-slate-300 hover:bg-slate-200 cursor-pointer transition-colors"
                        >
                          Close Job
                        </button>
                      )}

                      {job.status === 'Closed' && (
                        <button
                          onClick={() => setJobToArchive(job)}
                          className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40 hover:bg-amber-100 cursor-pointer flex items-center gap-1 transition-colors"
                          title="Move to Archive"
                        >
                          <Archive className="w-3.5 h-3.5" />
                          Archive
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {jobs.length === 0 && !isLoadingJobs && (
              <div className="col-span-full py-12 text-center text-slate-400 bg-white dark:bg-[#111D17] rounded-2xl border border-slate-200 dark:border-[#1A3125]">
                <Briefcase className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                <p className="text-xs font-semibold">No active job openings found.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab Content: Archived Openings */}
      {activeTab === 'archive' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 dark:border-[#1A3125] flex items-center justify-between gap-4 flex-wrap bg-slate-50/50 dark:bg-[#0B1511]/50">
              <div className="flex items-center gap-2">
                <Archive className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Archived Jobs Register
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#1A3125] text-slate-600 dark:text-slate-300">
                  {jobs.length} archived
                </span>
              </div>

              <div className="relative w-72">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search archived jobs..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs bg-white dark:bg-[#0B1511] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-[#00C471]"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-[#162820] text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-[#1A3125]">
                  <tr>
                    <th className="py-3 px-4">Job Title & Code</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Designation</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Compensation (PKR)</th>
                    <th className="py-3 px-4">Archived Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#1A3125]">
                  {jobs.map((job) => {
                    const minSal = job.minSalaryPaisa ? (job.minSalaryPaisa / 100).toLocaleString() : null;
                    const maxSal = job.maxSalaryPaisa ? (job.maxSalaryPaisa / 100).toLocaleString() : null;

                    return (
                      <tr
                        key={job._id}
                        onClick={() => setSelectedArchiveJob(job)}
                        className="hover:bg-slate-50/60 dark:hover:bg-[#162820]/40 cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {job.title}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400">
                            {job.slug}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                          {job.departmentId?.name || '—'}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                          {job.designationId?.title || '—'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-[#1A3125] text-slate-600 dark:text-slate-300">
                            {job.employmentType}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-medium text-slate-700 dark:text-slate-300">
                          {minSal && maxSal ? `${minSal} - ${maxSal}` : minSal ? `From ${minSal}` : '—'}
                        </td>
                        <td className="py-3 px-4 text-slate-400 text-[11px]">
                          {job.updatedAt ? formatDate(job.updatedAt) : '—'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedArchiveJob(job);
                            }}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-[#162820] text-[#00C471] hover:bg-emerald-100 dark:hover:bg-[#1E362B] transition-colors cursor-pointer"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {jobs.length === 0 && !isLoadingJobs && (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-slate-400">
                        <Archive className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-400" />
                        <p className="text-xs font-semibold">No archived jobs found.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Headcount Requisitions Queue */}
      {activeTab === 'requisitions' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-[#162820] text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-[#1A3125]">
                  <tr>
                    <th className="py-3 px-4">Designation</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Requested By</th>
                    <th className="py-3 px-4">Openings</th>
                    <th className="py-3 px-4">Monthly Salary Band</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#1A3125]">
                  {requisitions.map((req) => (
                    <tr key={req._id} className="hover:bg-slate-50/50 dark:hover:bg-[#162820]/40">
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        {req.designationId?.title || 'Open Position'}
                        <p className="text-[10px] text-slate-400 font-normal mt-0.5 line-clamp-1">
                          {req.justification}
                        </p>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        {req.departmentId?.name || '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-900 dark:text-white">
                            {req.requestedBy?.name || req.requestedBy?.email || '—'}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {req.requestedBy?.employeeCode}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                        {req.openingsCount}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                        PKR {(req.minSalaryPaisa / 100).toLocaleString()} - {(req.maxSalaryPaisa / 100).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            req.status === 'Approved'
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-[#00C471] border border-emerald-200 dark:border-[#1A3125]'
                              : req.status === 'Pending_Approval'
                              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40'
                              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40'
                          }`}
                        >
                          {req.status?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {req.status === 'Pending_Approval' && isSuperAdmin && (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedReq(req);
                                setDecisionAction('approved');
                              }}
                              className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-[#00C471] text-white hover:bg-[#049856] transition cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                setSelectedReq(req);
                                setDecisionAction('rejected');
                              }}
                              className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 border border-rose-200 dark:border-rose-900/40 hover:bg-rose-100 cursor-pointer"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                        {req.status === 'Approved' && req.jobId && (
                          <button
                            onClick={() => {
                              setActiveTab('active');
                              setSearch(req.designationId?.title || '');
                            }}
                            className="text-xs text-[#00C471] hover:underline font-semibold cursor-pointer"
                          >
                            View Job
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}

                  {requisitions.length === 0 && !isLoadingReqs && (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-slate-400">
                        <FileCheck className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-400" />
                        <p className="text-xs font-semibold">No headcount requisitions submitted.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Requisition Creation Modal */}
      <RequisitionModal
        isOpen={isReqModalOpen}
        onClose={() => setIsReqModalOpen(false)}
      />

      {/* Archive Inspection Modal with Revert & Permanent Delete */}
      <JobArchiveDetailModal
        isOpen={Boolean(selectedArchiveJob)}
        onClose={() => setSelectedArchiveJob(null)}
        job={selectedArchiveJob}
        onRevert={handleRestoreJob}
        onPermanentDelete={handlePermanentDeleteJob}
        isReverting={isRestoringJob}
        isDeleting={isPermanentDeletingJob}
      />

      {/* Confirm Soft-Delete / Move to Archive Dialog */}
      <ConfirmDialog
        isOpen={Boolean(jobToArchive)}
        title="Archive Job Opening"
        message={`Are you sure you want to archive '${jobToArchive?.title}'? It will be unlisted from the public careers portal and moved to the Archive tab.`}
        confirmText="Archive Job"
        confirmVariant="danger"
        isDestructive={true}
        isLoading={isArchivingJob}
        onConfirm={handleArchiveConfirm}
        onCancel={() => setJobToArchive(null)}
      />

      {/* Requisition Approval/Rejection Decision Dialog */}
      {selectedReq && decisionAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] w-full max-w-md rounded-2xl p-5 space-y-4 shadow-xl">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              Confirm Requisition {decisionAction === 'approved' ? 'Approval' : 'Rejection'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {decisionAction === 'approved'
                ? `Approving this requisition will automatically create an internal Draft Job opening for '${selectedReq.designationId?.title}'.`
                : `Rejecting this requisition will notify the requesting manager.`}
            </p>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Decision Remarks (Optional)
              </label>
              <textarea
                value={decisionRemarks}
                onChange={(e) => setDecisionRemarks(e.target.value)}
                placeholder="Add context or notes for the department manager..."
                rows={3}
                className="w-full p-2.5 rounded-xl text-xs bg-slate-50 dark:bg-[#0B1511] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white focus:outline-hidden focus:border-[#00C471]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setSelectedReq(null);
                  setDecisionAction(null);
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#162820] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDecisionSubmit}
                disabled={isDeciding}
                className={`px-4 py-1.5 rounded-xl text-xs font-semibold text-white cursor-pointer ${
                  decisionAction === 'approved'
                    ? 'bg-[#00C471] hover:bg-[#049856]'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {isDeciding ? 'Saving...' : decisionAction === 'approved' ? 'Confirm Approval' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobsPage;

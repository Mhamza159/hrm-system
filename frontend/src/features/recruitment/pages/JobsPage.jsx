/**
 * @file JobsPage.jsx
 * @description Internal Job Openings & Headcount Requisitions Command Center (Module M15 / Rows 15.1, 15.2, 15.3).
 * 
 * SPECIFICATION:
 * - Module: M15 Recruitment & AI Screening (BUILD-GUIDE Section 24 · Rows 15.1 to 15.3)
 * - Design System: Forest & Emerald (#111D17 dark surface, #1A3125 dark border, #00C471 emerald accent).
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
  Trash2
} from 'lucide-react';
import {
  useGetJobsQuery,
  useGetRequisitionsQuery,
  useDecideRequisitionMutation,
  useUpdateJobMutation,
  useDeleteJobMutation
} from '../recruitmentApi.js';
import { useAuth } from '../../../hooks/useAuth.js';
import { usePermission } from '../../../hooks/usePermission.js';
import { RequisitionModal } from '../components/RequisitionModal.jsx';
import { RefreshButton } from '../components/RefreshButton.jsx';
import { toast } from 'sonner';

export const JobsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('jobs'); // 'jobs' | 'requisitions'
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isReqModalOpen, setIsReqModalOpen] = useState(false);

  // Requisition decision state
  const [selectedReq, setSelectedReq] = useState(null);
  const [decisionAction, setDecisionAction] = useState(null); // 'approved' | 'rejected'
  const [decisionRemarks, setDecisionRemarks] = useState('');
  const [jobToDelete, setJobToDelete] = useState(null);

  const {
    data: jobsRes,
    isLoading: isLoadingJobs,
    isFetching: isFetchingJobs,
    refetch: refetchJobs
  } = useGetJobsQuery({
    search,
    status: statusFilter
  });
  const {
    data: reqsRes,
    isLoading: isLoadingReqs,
    isFetching: isFetchingReqs,
    refetch: refetchReqs
  } = useGetRequisitionsQuery();
  const [decideRequisition, { isLoading: isDeciding }] = useDecideRequisitionMutation();
  const [updateJob] = useUpdateJobMutation();
  const [deleteJob, { isLoading: isDeletingJob }] = useDeleteJobMutation();

  const { can, isSuperAdmin } = usePermission();
  const jobs = jobsRes?.data?.items || [];
  const requisitions = reqsRes?.data?.items || [];

  const pendingReqsCount = requisitions.filter((r) => r.status === 'Pending_Approval').length;
  const publishedJobsCount = jobs.filter((j) => j.status === 'Published').length;

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

  const handleDeleteJob = async () => {
    if (!jobToDelete) return;
    try {
      await deleteJob(jobToDelete._id).unwrap();
      toast.success(`Job '${jobToDelete.title}' has been deleted.`);
      setJobToDelete(null);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to delete job.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Briefcase className="w-6 h-6 text-[#00C471]" />
            Recruitment & Job Openings
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage headcount requests, public listings, and talent acquisition pipelines
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <RefreshButton
            onRefresh={() => {
              if (activeTab === 'jobs') return refetchJobs();
              return refetchReqs();
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
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#00C471] hover:bg-[#00B065] text-slate-950 font-medium transition cursor-pointer flex items-center gap-2 shadow-sm"
            >
              <Layers className="w-4 h-4" />
              Candidate Pipeline
            </button>
          )}
        </div>
      </div>

      {/* Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] flex items-center gap-3.5 shadow-xs">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-[#162820] flex items-center justify-center text-[#00C471] border border-emerald-100 dark:border-[#1A3125]">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Active Published Jobs
            </p>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
              {publishedJobsCount}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] flex items-center gap-3.5 shadow-xs">
          <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-500 border border-amber-100 dark:border-amber-900/40">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Pending Requisitions
            </p>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
              {pendingReqsCount}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] flex items-center gap-3.5 shadow-xs">
          <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-500 border border-blue-100 dark:border-blue-900/40">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Positions
            </p>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
              {jobs.length}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] flex items-center gap-3.5 shadow-xs">
          <div className="w-11 h-11 rounded-xl bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center text-purple-500 border border-purple-100 dark:border-purple-900/40">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Public Careers Portal
            </p>
            <a
              href="/careers"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold text-[#00C471] hover:underline flex items-center gap-1 mt-1"
            >
              View Live Portal <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-[#1A3125] pb-2">
        <button
          onClick={() => setActiveTab('jobs')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'jobs'
              ? 'bg-emerald-50 dark:bg-[#162820] text-emerald-700 dark:text-[#00C471] border border-emerald-200 dark:border-[#1A3125]'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          Job Openings ({jobs.length})
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

      {/* Tab 1: Job Openings */}
      {activeTab === 'jobs' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search jobs by title, department, or keywords..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white focus:outline-hidden focus:border-[#00C471]"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl text-xs bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white focus:outline-hidden focus:border-[#00C471]"
            >
              <option value="">All Statuses</option>
              <option value="Published">Published (Public)</option>
              <option value="Draft">Draft</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          {/* Jobs Grid */}
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

                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
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
                            className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-emerald-50 dark:bg-[#162820] text-[#00C471] border border-emerald-200 dark:border-[#1A3125] hover:bg-emerald-100 cursor-pointer"
                          >
                            Publish
                          </button>
                          <button
                            onClick={() => setJobToDelete(job)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                            title="Delete Draft Job"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}

                      {job.status === 'Published' && (
                        <button
                          onClick={() => handleStatusToggle(job, 'Closed')}
                          className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-100 dark:bg-[#162820] text-slate-600 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
                        >
                          Close
                        </button>
                      )}

                      {job.status === 'Closed' && (
                        <button
                          onClick={() => setJobToDelete(job)}
                          className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 border border-rose-200 dark:border-rose-900/40 hover:bg-rose-100 cursor-pointer flex items-center gap-1"
                          title="Delete Closed Job"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete Job
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {jobs.length === 0 && !isLoadingJobs && (
              <div className="col-span-full py-12 text-center text-slate-400">
                <Briefcase className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs font-semibold">No job openings found.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Requisitions Queue */}
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
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {req.requestedBy?.name || 'Department Head'}
                          </span>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            {req.requestedBy?.employeeCode && (
                              <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/40">
                                {req.requestedBy.employeeCode}
                              </span>
                            )}
                            <span className="text-[10px] text-slate-500 dark:text-slate-400">
                              {req.requestedBy?.designationId?.title || 'Dept Head'}
                            </span>
                            {req.requestedBy?.userId?.roles?.[0]?.name && (
                              <span className="text-[9px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-[#162820] px-1.5 py-0.5 rounded border border-slate-200 dark:border-[#1A3125]">
                                {req.requestedBy.userId.roles[0].name}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono">
                        {req.openingsCount}
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums text-slate-600 dark:text-slate-300">
                        PKR {(req.minSalaryPaisa / 100).toLocaleString('en-PK')} - {(req.maxSalaryPaisa / 100).toLocaleString('en-PK')}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            req.status === 'Approved'
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-[#00C471] border border-emerald-200 dark:border-[#1A3125]'
                              : req.status === 'Pending_Approval'
                              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40'
                              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 border border-rose-200'
                          }`}
                        >
                          {req.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {req.status === 'Pending_Approval' && can('recruitment.requisition.decide') ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setSelectedReq(req);
                                setDecisionAction('approved');
                              }}
                              className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-[#00C471] hover:bg-[#00B065] text-slate-950 cursor-pointer flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                setSelectedReq(req);
                                setDecisionAction('rejected');
                              }}
                              className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 border border-rose-200 hover:bg-rose-100 cursor-pointer flex items-center gap-1"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            {req.status === 'Approved' ? 'Spawned Job' : 'Decided'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}

                  {requisitions.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-400">
                        No requisitions found.
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

      {/* Decision Remarks Confirmation Modal */}
      {selectedReq && decisionAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] w-full max-w-md rounded-2xl p-6 space-y-4">
            <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
              Confirm Requisition {decisionAction === 'approved' ? 'Approval' : 'Rejection'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Position: <span className="font-semibold text-slate-700 dark:text-slate-200">{selectedReq.designationId?.title}</span> ({selectedReq.departmentId?.name})
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Executive Remarks / Feedback
              </label>
              <textarea
                rows={3}
                placeholder="Optional notes for requesting department manager..."
                value={decisionRemarks}
                onChange={(e) => setDecisionRemarks(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#162820] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white focus:outline-hidden focus:border-[#00C471]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedReq(null);
                  setDecisionAction(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#162820] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeciding}
                onClick={handleDecisionSubmit}
                className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
                  decisionAction === 'approved'
                    ? 'bg-[#00C471] hover:bg-[#00B065] text-slate-950 font-medium'
                    : 'bg-rose-600 hover:bg-rose-700 text-white'
                }`}
              >
                {isDeciding ? 'Saving...' : `Confirm ${decisionAction === 'approved' ? 'Approval' : 'Rejection'}`}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Job Deletion Confirmation Modal */}
      {jobToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] w-full max-w-md rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center border border-rose-200 dark:border-rose-900/40">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
                  Delete Job Opening
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete the job opening <span className="font-semibold text-slate-900 dark:text-white">"{jobToDelete.title}"</span>? All associated listing data will be archived.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setJobToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#162820] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingJob}
                onClick={handleDeleteJob}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer disabled:opacity-60"
              >
                {isDeletingJob ? 'Deleting...' : 'Delete Job'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobsPage;


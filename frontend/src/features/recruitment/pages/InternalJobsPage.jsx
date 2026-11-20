/**
 * @file InternalJobsPage.jsx
 * @description Internal Job Mobility & Employee Referrals Portal (Module M15 / Row 15.12).
 * 
 * SPECIFICATION:
 * - Module: M15 Recruitment & AI Screening (BUILD-GUIDE Section 24 · Row 15.12)
 * - Design System: Forest & Emerald (#111D17 dark surface, #1A3125 dark border, #00C471 emerald accent).
 */

import React, { useState } from 'react';
import {
  Users,
  Briefcase,
  Building2,
  MapPin,
  Search,
  Plus,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Clock,
  DollarSign,
  UserCheck,
  Award,
  Filter,
  Eye,
  X,
  FileText,
  BadgeCheck,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { useGetInternalJobsQuery, useGetMyReferralsQuery } from '../recruitmentApi.js';
import { usePermission } from '../../../hooks/usePermission.js';
import { EmployeeReferralModal } from '../components/EmployeeReferralModal.jsx';
import { AIScreeningBadge } from '../components/AIScreeningBadge.jsx';
import { RefreshButton } from '../components/RefreshButton.jsx';

const STAGE_CONFIG = {
  Applied: { label: 'Applied', bg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700' },
  Shortlisted: { label: 'Shortlisted', bg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/40' },
  Interview: { label: 'Interview', bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/40' },
  Technical_Test: { label: 'Technical Test', bg: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-900/40' },
  Offer: { label: 'Offer Issued', bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/40' },
  Hired: { label: 'Hired', bg: 'bg-[#00C471]/15 text-[#00C471] border-[#00C471]/30' },
  Rejected: { label: 'Archived', bg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/40' }
};

export const InternalJobsPage = () => {
  const { can } = usePermission();
  const [activeTab, setActiveTab] = useState('openings'); // 'openings' | 'my-referrals'
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [selectedJobForReferral, setSelectedJobForReferral] = useState(null);
  const [inspectingJob, setInspectingJob] = useState(null);

  const {
    data: jobsRes,
    isLoading: isLoadingJobs,
    isFetching: isFetchingJobs,
    refetch: refetchJobs
  } = useGetInternalJobsQuery({ search });

  const {
    data: myRefRes,
    isLoading: isLoadingReferrals,
    isFetching: isFetchingReferrals,
    refetch: refetchReferrals
  } = useGetMyReferralsQuery();

  const allJobs = jobsRes?.data?.items || [];
  const myReferrals = myRefRes?.data?.items || [];

  // Filter jobs by department if selected
  const jobs = allJobs.filter((job) => {
    if (!departmentFilter) return true;
    return job.departmentId?._id === departmentFilter || job.departmentId?.name === departmentFilter;
  });

  // Extract unique departments for filter dropdown
  const departments = Array.from(
    new Map(
      allJobs
        .filter((j) => j.departmentId)
        .map((j) => [j.departmentId._id || j.departmentId.name, j.departmentId])
    ).values()
  );

  // Stats calculation
  const totalInternalOpenings = allJobs.length;
  const totalReferrals = myReferrals.length;
  const inProgressReferrals = myReferrals.filter(
    (r) => ['Shortlisted', 'Interview', 'Technical_Test', 'Offer'].includes(r.stage)
  ).length;
  const hiredReferrals = myReferrals.filter((r) => r.stage === 'Hired').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Users className="w-6 h-6 text-[#00C471]" />
            Internal Mobility & Employee Referrals
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Explore internal career transitions or refer top talent to open roles across the company
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <RefreshButton
            onRefresh={() => {
              if (activeTab === 'openings') return refetchJobs();
              return refetchReferrals();
            }}
            isFetching={isFetchingJobs || isFetchingReferrals}
          />

          {can('recruitment.referral.submit') && (
            <button
              onClick={() => setSelectedJobForReferral({})}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#00C471] hover:bg-[#00B065] text-slate-950 transition cursor-pointer flex items-center gap-2 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Refer a Candidate
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Internal Openings</p>
            <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">{totalInternalOpenings}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-[#162820] text-[#00C471] flex items-center justify-center border border-emerald-100 dark:border-[#1A3125]">
            <Briefcase className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">My Referrals</p>
            <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">{totalReferrals}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-500 flex items-center justify-center border border-blue-100 dark:border-blue-900/40">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">In Evaluation</p>
            <p className="text-2xl font-bold font-mono text-amber-500 mt-1">{inProgressReferrals}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center border border-amber-100 dark:border-amber-900/40">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Hired & Rewarded</p>
            <p className="text-2xl font-bold font-mono text-[#00C471] mt-1">{hiredReferrals}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-[#162820] text-[#00C471] flex items-center justify-center border border-emerald-100 dark:border-[#1A3125]">
            <Award className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Tabs & Search Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-[#1A3125] pb-3">
        {/* Tab Pills */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('openings')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'openings'
                ? 'bg-emerald-50 dark:bg-[#162820] text-emerald-700 dark:text-[#00C471] border border-emerald-200 dark:border-[#1A3125]'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            Open Positions
            <span className="text-[11px] font-mono px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-[#111D17] text-slate-700 dark:text-slate-300">
              {allJobs.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('my-referrals')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'my-referrals'
                ? 'bg-emerald-50 dark:bg-[#162820] text-emerald-700 dark:text-[#00C471] border border-emerald-200 dark:border-[#1A3125]'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            My Referrals
            <span className="text-[11px] font-mono px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-[#111D17] text-slate-700 dark:text-slate-300">
              {myReferrals.length}
            </span>
          </button>
        </div>

        {/* Search and Filters */}
        {activeTab === 'openings' && (
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            {departments.length > 0 && (
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="px-3 py-2 rounded-xl text-xs bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white focus:outline-hidden focus:border-[#00C471]"
              >
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d._id || d.name} value={d._id || d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            )}

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search positions or skills..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-3 py-2 rounded-xl text-xs bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white focus:outline-hidden focus:border-[#00C471] w-48 sm:w-64"
              />
            </div>
          </div>
        )}
      </div>

      {/* Tab 1: Open Positions */}
      {activeTab === 'openings' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.map((job) => (
              <div
                key={job._id}
                className="p-5 rounded-2xl bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] hover:border-[#00C471]/60 transition shadow-xs flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-[#00C471] border border-emerald-200 dark:border-[#1A3125]">
                      {job.employmentType || 'Full-time'}
                    </span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                      <MapPin className="w-3 h-3 text-slate-400" /> {job.location}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base group-hover:text-[#00C471] transition">
                      {job.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      {job.departmentId?.name || 'General Department'}
                    </p>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                    {job.description}
                  </p>

                  {/* Skills badges */}
                  {job.requirements && job.requirements.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {job.requirements.slice(0, 3).map((req, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#162820] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#1A3125]"
                        >
                          {req}
                        </span>
                      ))}
                      {job.requirements.length > 3 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-[#162820] text-slate-400">
                          +{job.requirements.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Compensation pill */}
                  {job.salaryRange && (job.salaryRange.min || job.salaryRange.max) && (
                    <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-emerald-700 dark:text-[#00C471] bg-emerald-50/60 dark:bg-[#162820]/60 px-2.5 py-1 rounded-lg border border-emerald-100 dark:border-[#1A3125]">
                      <DollarSign className="w-3.5 h-3.5" />
                      {job.salaryRange.currency || 'USD'} {Number(job.salaryRange.min).toLocaleString()} - {Number(job.salaryRange.max).toLocaleString()}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-[#1A3125] flex items-center justify-between gap-2">
                  <button
                    onClick={() => setInspectingJob(job)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#162820] transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-400" />
                    Details
                  </button>

                  {can('recruitment.referral.submit') && (
                    <button
                      onClick={() => setSelectedJobForReferral(job)}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#00C471] hover:bg-[#00B065] text-slate-950 transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Refer Candidate
                    </button>
                  )}
                </div>
              </div>
            ))}

            {jobs.length === 0 && !isLoadingJobs && (
              <div className="col-span-full py-16 text-center text-slate-400 bg-white dark:bg-[#111D17] border border-dashed border-slate-200 dark:border-[#1A3125] rounded-2xl">
                <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-30 text-slate-400" />
                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">No Open Positions Match Your Search</h4>
                <p className="text-xs text-slate-400 mt-1">Try clearing your filters or check back later for new internal postings.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: My Referrals */}
      {activeTab === 'my-referrals' && (
        <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#162820] text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-[#1A3125]">
                <tr>
                  <th className="py-3.5 px-4">Candidate Profile</th>
                  <th className="py-3.5 px-4">Target Position</th>
                  <th className="py-3.5 px-4">Submitted Date</th>
                  <th className="py-3.5 px-4">AI Fit Evaluation</th>
                  <th className="py-3.5 px-4">Pipeline Status</th>
                  <th className="py-3.5 px-4 text-right">Incentive Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#1A3125]">
                {myReferrals.map((cand) => {
                  const stageMeta = STAGE_CONFIG[cand.stage] || STAGE_CONFIG.Applied;

                  return (
                    <tr key={cand._id} className="hover:bg-slate-50/50 dark:hover:bg-[#162820]/40 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white text-xs">
                          {cand.name}
                        </div>
                        <div className="text-[11px] text-slate-400 font-normal">
                          {cand.email} {cand.phone ? `· ${cand.phone}` : ''}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {cand.jobId?.title || 'Open Position'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {cand.jobId?.departmentId?.name || 'Department'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-mono">
                        {cand.createdAt ? new Date(cand.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        }) : '—'}
                      </td>

                      <td className="py-3.5 px-4">
                        <AIScreeningBadge
                          score={cand.aiScore}
                          reason={cand.aiScreeningReason}
                          strengths={cand.parsedProfile?.matchingStrengths}
                          missing={cand.parsedProfile?.missingSkills}
                        />
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${stageMeta.bg}`}>
                          {stageMeta.label}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {cand.stage === 'Hired' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#00C471] bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-900/40">
                            <BadgeCheck className="w-3.5 h-3.5" /> Bonus Eligible ($1,000)
                          </span>
                        ) : cand.stage === 'Rejected' ? (
                          <span className="text-[11px] text-slate-400 italic">Not Awarded</span>
                        ) : (
                          <span className="text-[11px] text-amber-500 font-medium">Pending Decision</span>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {myReferrals.length === 0 && !isLoadingReferrals && (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400">
                      <Users className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-400" />
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">You haven't submitted any candidate referrals yet.</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Explore open positions above and refer exceptional talent from your network.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Opening Inspection Modal */}
      {inspectingJob && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/15 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] w-full max-w-2xl rounded-2xl shadow-2xl p-6 overflow-hidden max-h-[90vh] flex flex-col space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#1A3125]">
              <div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-[#00C471]">
                  {inspectingJob.employmentType || 'Full-time'}
                </span>
                <h3 className="font-bold text-slate-900 dark:text-white text-base mt-1">
                  {inspectingJob.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                  <span>{inspectingJob.departmentId?.name}</span>
                  <span>·</span>
                  <span>{inspectingJob.location}</span>
                </p>
              </div>
              <button
                onClick={() => setInspectingJob(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-[#162820] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto pr-1 flex-1 text-xs">
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white mb-1.5">Role Overview</h4>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {inspectingJob.description}
                </p>
              </div>

              {inspectingJob.requirements && inspectingJob.requirements.length > 0 && (
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-1.5">Required Skills & Competencies</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {inspectingJob.requirements.map((req, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#162820] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#1A3125]"
                      >
                        {req}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {inspectingJob.responsibilities && inspectingJob.responsibilities.length > 0 && (
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-1.5">Key Responsibilities</h4>
                  <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-300">
                    {inspectingJob.responsibilities.map((resp, i) => (
                      <li key={i}>{resp}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#162820] border border-slate-200 dark:border-[#1A3125]">
                  <p className="text-slate-400 text-[10px]">Minimum Experience</p>
                  <p className="font-bold text-slate-900 dark:text-white font-mono mt-0.5">
                    {inspectingJob.minExperienceYears || 0} years
                  </p>
                </div>

                {inspectingJob.salaryRange && (inspectingJob.salaryRange.min || inspectingJob.salaryRange.max) && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#162820] border border-slate-200 dark:border-[#1A3125]">
                    <p className="text-slate-400 text-[10px]">Salary Compensation</p>
                    <p className="font-bold text-[#00C471] font-mono mt-0.5">
                      {inspectingJob.salaryRange.currency || 'USD'} {Number(inspectingJob.salaryRange.min).toLocaleString()} - {Number(inspectingJob.salaryRange.max).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-[#1A3125]">
              <button
                onClick={() => setInspectingJob(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#162820] cursor-pointer"
              >
                Close
              </button>
              {can('recruitment.referral.submit') && (
                <button
                  onClick={() => {
                    const j = inspectingJob;
                    setInspectingJob(null);
                    setSelectedJobForReferral(j);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#00C471] hover:bg-[#00B065] text-slate-950 transition cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Refer Candidate for this Role
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Referral Modal */}
      <EmployeeReferralModal
        isOpen={Boolean(selectedJobForReferral)}
        onClose={() => setSelectedJobForReferral(null)}
        defaultJob={selectedJobForReferral?._id ? selectedJobForReferral : null}
      />
    </div>
  );
};

export default InternalJobsPage;

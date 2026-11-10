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
  Clock
} from 'lucide-react';
import { useGetInternalJobsQuery, useGetMyReferralsQuery } from '../recruitmentApi.js';
import { usePermission } from '../../../hooks/usePermission.js';
import { EmployeeReferralModal } from '../components/EmployeeReferralModal.jsx';
import { RefreshButton } from '../components/RefreshButton.jsx';

export const InternalJobsPage = () => {
  const { can } = usePermission();
  const [activeTab, setActiveTab] = useState('openings'); // 'openings' | 'my-referrals'
  const [search, setSearch] = useState('');
  const [selectedJobForReferral, setSelectedJobForReferral] = useState(null);

  const {
    data: jobsRes,
    isLoading: isLoadingJobs,
    isFetching: isFetchingJobs,
    refetch: refetchJobs
  } = useGetInternalJobsQuery({ search });
  const {
    data: myRefRes,
    isFetching: isFetchingReferrals,
    refetch: refetchReferrals
  } = useGetMyReferralsQuery();

  const jobs = jobsRes?.data?.items || [];
  const myReferrals = myRefRes?.data?.items || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Users className="w-6 h-6 text-[#00C471]" />
            Internal Mobility & Employee Referrals
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Refer exceptional candidates to open positions or explore internal transfers
          </p>
        </div>

        <div className="flex items-center gap-2">
          <RefreshButton
            onRefresh={() => {
              if (activeTab === 'openings') return refetchJobs();
              return refetchReferrals();
            }}
            isFetching={isFetchingJobs || isFetchingReferrals}
          />

          <button
            onClick={() => setActiveTab('openings')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === 'openings'
                ? 'bg-emerald-50 dark:bg-[#162820] text-emerald-700 dark:text-[#00C471] border border-emerald-200 dark:border-[#1A3125]'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Open Positions ({jobs.length})
          </button>

          <button
            onClick={() => setActiveTab('my-referrals')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === 'my-referrals'
                ? 'bg-emerald-50 dark:bg-[#162820] text-emerald-700 dark:text-[#00C471] border border-emerald-200 dark:border-[#1A3125]'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            My Referrals ({myReferrals.length})
          </button>
        </div>
      </div>

      {/* Tab 1: Open Positions */}
      {activeTab === 'openings' && (
        <div className="space-y-4">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search internal openings..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white focus:outline-hidden focus:border-[#00C471]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.map((job) => (
              <div
                key={job._id}
                className="p-5 rounded-2xl bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] flex flex-col justify-between shadow-xs space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-[#00C471]">
                      {job.employmentType}
                    </span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {job.location}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    {job.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" />
                    {job.departmentId?.name}
                  </p>

                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                    {job.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-[#1A3125] flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-mono">
                    Min {job.minExperienceYears} yrs exp
                  </span>

                  {can('recruitment.referral.submit') && (
                    <button
                      onClick={() => setSelectedJobForReferral(job)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#00C471] hover:bg-[#00B065] text-slate-950 font-medium transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" /> Refer Candidate
                    </button>
                  )}
                </div>
              </div>
            ))}

            {jobs.length === 0 && !isLoadingJobs && (
              <div className="col-span-full py-12 text-center text-slate-400">
                <Briefcase className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs font-semibold">No open positions for referral at this time.</p>
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
                  <th className="py-3 px-4">Candidate</th>
                  <th className="py-3 px-4">Position</th>
                  <th className="py-3 px-4">Submitted Date</th>
                  <th className="py-3 px-4">AI Score</th>
                  <th className="py-3 px-4">Current Stage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#1A3125]">
                {myReferrals.map((cand) => (
                  <tr key={cand._id} className="hover:bg-slate-50/50 dark:hover:bg-[#162820]/40">
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      {cand.name}
                      <p className="text-[10px] text-slate-400 font-normal">{cand.email}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {cand.jobId?.title || 'Open Opening'}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono">
                      {new Date(cand.createdAt).toLocaleDateString('en-PK')}
                    </td>
                    <td className="py-3 px-4">
                      {cand.aiScore !== null ? (
                        <span className="font-bold text-[#00C471] font-mono">
                          {cand.aiScore}% Match
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Pending</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#162820] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#1A3125]">
                        {cand.stage}
                      </span>
                    </td>
                  </tr>
                ))}

                {myReferrals.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-400">
                      You have not submitted any employee referrals yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Referral Modal */}
      <EmployeeReferralModal
        isOpen={Boolean(selectedJobForReferral)}
        onClose={() => setSelectedJobForReferral(null)}
        defaultJob={selectedJobForReferral}
      />
    </div>
  );
};

export default InternalJobsPage;


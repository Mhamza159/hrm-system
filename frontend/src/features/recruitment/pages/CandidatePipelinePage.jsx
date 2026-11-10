/**
 * @file CandidatePipelinePage.jsx
 * @description Interactive Drag-and-Drop Candidate Kanban Pipeline Board (Module M15 / Row 15.7).
 * 
 * SPECIFICATION:
 * - Module: M15 Recruitment & AI Screening (BUILD-GUIDE Section 24 · Row 15.7)
 * - Design System: Forest & Emerald (#111D17 dark surface, #1A3125 dark border, #00C471 emerald accent).
 */

import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Layers,
  Search,
  Filter,
  Briefcase,
  Users,
  Sparkles,
  ArrowRight,
  MoreVertical,
  Plus,
  ArrowLeft,
  ChevronRight,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import {
  useGetCandidatesQuery,
  useGetJobsQuery,
  useUpdateCandidateStageMutation,
  useDeleteCandidateMutation
} from '../recruitmentApi.js';
import { AIScreeningBadge } from '../components/AIScreeningBadge.jsx';
import { CandidateDetailModal } from '../components/CandidateDetailModal.jsx';
import { RefreshButton } from '../components/RefreshButton.jsx';
import { toast } from 'sonner';

const STAGES = [
  { id: 'Applied', title: 'Applied', color: 'border-slate-300 dark:border-slate-700' },
  { id: 'Shortlisted', title: 'Shortlisted', color: 'border-blue-300 dark:border-blue-900' },
  { id: 'Interview', title: 'Interview', color: 'border-amber-300 dark:border-amber-900' },
  { id: 'Technical_Test', title: 'Technical Test', color: 'border-purple-300 dark:border-purple-900' },
  { id: 'Offer', title: 'Offer Issued', color: 'border-emerald-300 dark:border-emerald-900' },
  { id: 'Hired', title: 'Hired', color: 'border-[#00C471]' }
];

export const CandidatePipelinePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const selectedJobId = searchParams.get('jobId') || '';
  const [search, setSearch] = useState('');
  const [minScoreFilter, setMinScoreFilter] = useState('');
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);
  const [candidateToDelete, setCandidateToDelete] = useState(null);

  const { data: jobsRes } = useGetJobsQuery({ limit: 100 });
  const {
    data: candidatesRes,
    isLoading,
    isFetching: isFetchingCandidates,
    refetch: refetchCandidates
  } = useGetCandidatesQuery({
    jobId: selectedJobId || undefined,
    search: search.trim() || undefined
  });
  const [updateCandidateStage] = useUpdateCandidateStageMutation();
  const [deleteCandidate, { isLoading: isDeletingCandidate }] = useDeleteCandidateMutation();

  const jobs = jobsRes?.data?.items || [];
  let candidates = candidatesRes?.data?.items || [];

  if (minScoreFilter) {
    const minVal = Number(minScoreFilter);
    candidates = candidates.filter((c) => (c.aiScore || 0) >= minVal);
  }

  const handleStageMove = async (candidate, targetStage) => {
    try {
      await updateCandidateStage({
        id: candidate._id,
        stage: targetStage
      }).unwrap();
      toast.success(`Moved ${candidate.name} to ${targetStage}.`);
    } catch (err) {
      toast.error('Failed to update stage.');
    }
  };

  const handleDeleteCandidate = async () => {
    if (!candidateToDelete) return;
    try {
      await deleteCandidate(candidateToDelete._id).unwrap();
      toast.success(`Candidate ${candidateToDelete.name} has been removed.`);
      setCandidateToDelete(null);
      if (selectedCandidateId === candidateToDelete._id) {
        setSelectedCandidateId(null);
      }
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to remove candidate.');
    }
  };

  const handleDragStart = (e, candidate) => {
    e.dataTransfer.setData('text/plain', candidate._id);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetStage) => {
    e.preventDefault();
    const candidateId = e.dataTransfer.getData('text/plain');
    const cand = candidates.find((c) => c._id === candidateId);
    if (cand && cand.stage !== targetStage) {
      handleStageMove(cand, targetStage);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/recruitment/jobs')}
            className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1.5 mb-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Job Openings
          </button>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-[#00C471]" />
            Candidate Pipeline Board
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Interactive drag-and-drop Kanban hiring workflow with AI fit evaluation
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <RefreshButton
            onRefresh={() => refetchCandidates()}
            isFetching={isFetchingCandidates}
          />

          <select
            value={selectedJobId}
            onChange={(e) => setSearchParams(e.target.value ? { jobId: e.target.value } : {})}
            className="px-3 py-2 rounded-xl text-xs bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white focus:outline-hidden focus:border-[#00C471]"
          >
            <option value="">All Job Positions</option>
            {jobs.map((j) => (
              <option key={j._id} value={j._id}>
                {j.title} ({j.departmentId?.name || ''})
              </option>
            ))}
          </select>

          <select
            value={minScoreFilter}
            onChange={(e) => setMinScoreFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white focus:outline-hidden focus:border-[#00C471]"
          >
            <option value="">All Match Scores</option>
            <option value="80">Top Fit (≥ 80%)</option>
            <option value="60">Promising (≥ 60%)</option>
          </select>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search candidate..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-2 rounded-xl text-xs bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white focus:outline-hidden focus:border-[#00C471]"
            />
          </div>
        </div>
      </div>

      {/* Kanban Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5 items-start">
        {STAGES.map((col) => {
          const colCandidates = candidates.filter((c) => c.stage === col.id);

          return (
            <div
              key={col.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
              className="bg-slate-50/70 dark:bg-[#111D17]/80 rounded-2xl border border-slate-200 dark:border-[#1A3125] p-3 space-y-3 min-h-[480px] flex flex-col"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-[#1A3125]">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full border-2 ${col.color} bg-white dark:bg-[#111D17]`} />
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                    {col.title}
                  </span>
                </div>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-white dark:bg-[#162820] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#1A3125]">
                  {colCandidates.length}
                </span>
              </div>

              {/* Cards Container */}
              <div className="space-y-2.5 flex-1">
                {colCandidates.map((cand) => (
                  <div
                    key={cand._id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, cand)}
                    onClick={() => setSelectedCandidateId(cand._id)}
                    className="p-3 rounded-xl bg-white dark:bg-[#162820] border border-slate-200 dark:border-[#1A3125] hover:border-[#00C471]/60 shadow-xs hover:shadow-md transition cursor-pointer space-y-2 group"
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-xs group-hover:text-[#00C471] transition">
                          {cand.name}
                        </h4>
                        <p className="text-[10px] text-slate-400 line-clamp-1">
                          {cand.jobId?.title || 'Position'}
                        </p>
                      </div>

                      <AIScreeningBadge
                        score={cand.aiScore}
                        reason={cand.aiScreeningReason}
                        strengths={cand.parsedProfile?.matchingStrengths}
                        missing={cand.parsedProfile?.missingSkills}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100 dark:border-[#1A3125]/80">
                      <span>{cand.parsedProfile?.totalExperienceYears ? `${cand.parsedProfile.totalExperienceYears} yrs exp` : 'Profile parsed'}</span>
                      <div className="flex items-center gap-1.5">
                        {cand.referredBy && (
                          <span className="text-amber-500 font-semibold">Referral</span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCandidateToDelete(cand);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition cursor-pointer"
                          title="Delete Candidate"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {colCandidates.length === 0 && (
                  <div className="py-8 text-center text-slate-400 dark:text-slate-600 text-[11px] border border-dashed border-slate-200 dark:border-[#1A3125] rounded-xl">
                    Drop candidates here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Candidate Profile Details Drawer / Modal */}
      <CandidateDetailModal
        isOpen={Boolean(selectedCandidateId)}
        onClose={() => setSelectedCandidateId(null)}
        candidateId={selectedCandidateId}
        onCandidateDeleted={() => {
          setSelectedCandidateId(null);
          refetchCandidates();
        }}
        onHiredSuccess={(emp) => {
          setSelectedCandidateId(null);
          navigate(`/employees/${emp._id || emp.id}`);
        }}
      />

      {/* Candidate Deletion Confirmation Modal */}
      {candidateToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] w-full max-w-md rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center border border-rose-200 dark:border-rose-900/40">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
                  Remove Candidate Application
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  This will archive the candidate from the pipeline board.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to delete <span className="font-semibold text-slate-900 dark:text-white">{candidateToDelete.name}</span>'s application for <span className="font-semibold text-slate-900 dark:text-white">{candidateToDelete.jobId?.title || 'this position'}</span>? Any active interview schedules will be cancelled.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCandidateToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#162820] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingCandidate}
                onClick={handleDeleteCandidate}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer disabled:opacity-60"
              >
                {isDeletingCandidate ? 'Deleting...' : 'Delete Candidate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidatePipelinePage;


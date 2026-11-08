/**
 * @file CandidateDetailModal.jsx
 * @description Comprehensive Candidate Profile Drawer & Actions (Module M15 / Rows 15.5 to 15.11).
 * 
 * SPECIFICATION:
 * - Module: M15 Recruitment & AI Screening (BUILD-GUIDE Section 24 · Rows 15.5 to 15.11)
 * - Design System: Forest & Emerald (#111D17 dark surface, #1A3125 dark border, #00C471 emerald accent).
 */

import React, { useState } from 'react';
import {
  X,
  User,
  Mail,
  Phone,
  Calendar,
  Briefcase,
  FileText,
  Sparkles,
  Award,
  Send,
  UserCheck,
  XCircle,
  ExternalLink,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import {
  useGetCandidateByIdQuery,
  useScreenCandidateMutation,
  useUpdateCandidateStageMutation,
  useSendTechnicalTestMutation,
  useHireCandidateMutation
} from '../recruitmentApi.js';
import { AIScreeningBadge } from './AIScreeningBadge.jsx';
import { InterviewScheduleModal } from './InterviewScheduleModal.jsx';
import { ScorecardModal } from './ScorecardModal.jsx';
import { OfferLetterModal } from './OfferLetterModal.jsx';
import { toast } from 'sonner';

export const CandidateDetailModal = ({ isOpen, onClose, candidateId, onHiredSuccess }) => {
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [selectedInterviewForScorecard, setSelectedInterviewForScorecard] = useState(null);
  const [isOfferOpen, setIsOfferOpen] = useState(false);

  // Technical Test prompt state
  const [isTestPromptOpen, setIsTestPromptOpen] = useState(false);
  const [testUrl, setTestUrl] = useState('https://hackerrank.com/assessments/hrm-senior-engineer');
  const [testInstructions, setTestInstructions] = useState('Please complete the coding assessment within 48 hours.');

  // Reject confirmation state
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('Qualifications did not match required seniority level');

  const { data: detailRes, isLoading } = useGetCandidateByIdQuery(candidateId, {
    skip: !isOpen || !candidateId
  });
  const [screenCandidate, { isLoading: isScreening }] = useScreenCandidateMutation();
  const [updateCandidateStage] = useUpdateCandidateStageMutation();
  const [sendTechnicalTest, { isLoading: isSendingTest }] = useSendTechnicalTestMutation();
  const [hireCandidate, { isLoading: isHiring }] = useHireCandidateMutation();

  const candidate = detailRes?.data?.candidate;
  const interviews = detailRes?.data?.interviews || [];

  if (!isOpen || !candidateId) return null;

  const handleRunAIScreen = async () => {
    try {
      await screenCandidate(candidate._id).unwrap();
      toast.success('AI resume analysis & scoring updated successfully.');
    } catch (err) {
      toast.error('Failed to run AI screening.');
    }
  };

  const handleStageChange = async (newStage, notes = '') => {
    try {
      await updateCandidateStage({ id: candidate._id, stage: newStage, notes }).unwrap();
      toast.success(`Candidate moved to ${newStage}.`);
    } catch (err) {
      toast.error('Failed to update stage.');
    }
  };

  const handleTestSubmit = async (e) => {
    e.preventDefault();
    try {
      await sendTechnicalTest({
        candidateId: candidate._id,
        testUrl: testUrl.trim(),
        instructions: testInstructions.trim()
      }).unwrap();

      toast.success('Technical assessment dispatched to candidate.');
      setIsTestPromptOpen(false);
    } catch (err) {
      toast.error('Failed to dispatch technical test.');
    }
  };

  const handleRejectSubmit = async () => {
    try {
      await updateCandidateStage({
        id: candidate._id,
        stage: 'Rejected',
        notes: rejectReason
      }).unwrap();

      toast.success('Candidate application marked as Rejected.');
      setIsRejectOpen(false);
    } catch (err) {
      toast.error('Failed to reject candidate.');
    }
  };

  const handleHireSubmit = async () => {
    try {
      const res = await hireCandidate({
        candidateId: candidate._id
      }).unwrap();

      toast.success(
        `Candidate successfully hired! Created Employee ${res?.data?.employee?.employeeCode || ''}.`
      );
      if (onHiredSuccess) onHiredSuccess(res?.data?.employee);
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || err?.message || 'Failed to hire candidate.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] w-full max-w-3xl rounded-2xl shadow-2xl p-6 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#1A3125]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-[#162820] text-emerald-600 dark:text-[#00C471] flex items-center justify-center font-bold text-base border border-emerald-100 dark:border-[#1A3125]">
              {candidate?.name?.[0] || 'C'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  {candidate?.name}
                </h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#162820] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#1A3125]">
                  Stage: {candidate?.stage}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Applied for: <span className="text-slate-700 dark:text-slate-200 font-semibold">{candidate?.jobId?.title}</span> ({candidate?.jobId?.departmentId?.name})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="mt-4 space-y-5 overflow-y-auto pr-1 flex-1 text-xs">
          {/* Quick Info & AI Screen Banner */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#162820]/50 border border-slate-200 dark:border-[#1A3125] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-4 flex-wrap text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                {candidate?.email}
              </span>
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                {candidate?.phone}
              </span>
              {candidate?.cvUrl && (
                <a
                  href={candidate.cvUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-[#00C471] hover:underline font-semibold"
                >
                  <FileText className="w-3.5 h-3.5" /> View CV Document
                </a>
              )}
            </div>

            <div className="flex items-center gap-2">
              <AIScreeningBadge
                score={candidate?.aiScore}
                reason={candidate?.aiScreeningReason}
                strengths={candidate?.parsedProfile?.matchingStrengths}
                missing={candidate?.parsedProfile?.missingSkills}
              />
              <button
                type="button"
                disabled={isScreening}
                onClick={handleRunAIScreen}
                className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-emerald-50 dark:bg-[#162820] text-emerald-700 dark:text-[#00C471] border border-emerald-200 dark:border-[#1A3125] hover:bg-emerald-100 cursor-pointer flex items-center gap-1 disabled:opacity-50"
              >
                <Sparkles className="w-3 h-3" />
                {isScreening ? 'Screening...' : 'Re-screen'}
              </button>
            </div>
          </div>

          {/* Parsed Profile Details */}
          {candidate?.parsedProfile && (
            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                Extracted Resume Attributes
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17]">
                <div>
                  <span className="text-[10px] text-slate-400">Total Experience</span>
                  <p className="font-bold text-slate-800 dark:text-slate-100 text-xs mt-0.5">
                    {candidate.parsedProfile.totalExperienceYears || 0} Years
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">Highest Education</span>
                  <p className="font-bold text-slate-800 dark:text-slate-100 text-xs mt-0.5">
                    {candidate.parsedProfile.highestEducation || 'Degree'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">Sourced Via</span>
                  <p className="font-bold text-slate-800 dark:text-slate-100 text-xs mt-0.5">
                    {candidate.referredBy ? `Referral (${candidate.referredBy.name})` : 'Public Portal'}
                  </p>
                </div>
              </div>

              {candidate.parsedProfile.parsedSkills?.length > 0 && (
                <div className="pt-2">
                  <span className="text-[10px] text-slate-400 block mb-1">Parsed Skills</span>
                  <div className="flex flex-wrap gap-1.5">
                    {candidate.parsedProfile.parsedSkills.map((sk, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#162820] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#1A3125]"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Technical Test Status Banner */}
          {candidate?.technicalTest?.status !== 'Not_Sent' && (
            <div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5" /> Technical Assessment Dispatched
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300">
                  {candidate.technicalTest?.status}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Link: <a href={candidate.technicalTest?.testUrl} target="_blank" rel="noreferrer" className="text-blue-500 underline">{candidate.technicalTest?.testUrl}</a>
              </p>
            </div>
          )}

          {/* Offer Details Banner */}
          {candidate?.offerDetails?.status === 'Issued' && (
            <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20 flex items-center justify-between">
              <div>
                <span className="font-bold text-emerald-800 dark:text-[#00C471] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Formal Offer Issued
                </span>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                  Base Salary: PKR {((candidate.offerDetails.baseSalaryPaisa || 0) / 100).toLocaleString('en-PK')} • Joining: {new Date(candidate.offerDetails.joiningDate).toLocaleDateString('en-PK')}
                </p>
              </div>

              <a
                href={`/api/v1/recruitment/candidates/${candidate._id}/offer/pdf`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-1"
              >
                <FileText className="w-3.5 h-3.5" /> Download PDF
              </a>
            </div>
          )}

          {/* Interviews & Scorecards Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                Interview Rounds ({interviews.length})
              </h4>
              <button
                type="button"
                onClick={() => setIsScheduleOpen(true)}
                className="text-xs font-semibold text-[#00C471] hover:underline flex items-center gap-1 cursor-pointer"
              >
                + Schedule Round
              </button>
            </div>

            <div className="space-y-2">
              {interviews.map((iv) => (
                <div
                  key={iv._id}
                  className="p-3 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">
                        Round {iv.roundNumber}: {iv.roundType}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#162820] text-slate-600 dark:text-slate-300 font-semibold">
                        {iv.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {new Date(iv.scheduledDate).toLocaleString('en-PK')} ({iv.durationMinutes} mins)
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Panelists: {iv.interviewers?.map((p) => p.name).join(', ') || 'Assigned'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {iv.scorecards?.length > 0 && (
                      <span className="text-[11px] font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/40 px-2 py-1 rounded-lg border border-amber-200">
                        {iv.scorecards.length} Scorecard(s)
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => setSelectedInterviewForScorecard(iv)}
                      className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-100 dark:bg-[#162820] text-slate-700 dark:text-slate-200 hover:bg-slate-200 cursor-pointer"
                    >
                      Submit Scorecard
                    </button>
                  </div>
                </div>
              ))}

              {interviews.length === 0 && (
                <p className="text-center py-4 text-slate-400 italic">
                  No interview rounds scheduled yet.
                </p>
              )}
            </div>
          </div>

          {/* Stage Progression Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-[#1A3125]">
            <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] mb-2">
              Recruitment Actions
            </h4>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setIsTestPromptOpen(true)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/40 hover:bg-blue-100 cursor-pointer flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" /> Send Technical Test
              </button>

              <button
                type="button"
                onClick={() => setIsOfferOpen(true)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900/40 hover:bg-purple-100 cursor-pointer flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" /> Configure Offer
              </button>

              {candidate?.stage !== 'Hired' && (
                <button
                  type="button"
                  disabled={isHiring}
                  onClick={handleHireSubmit}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#00C471] hover:bg-[#00B065] text-slate-950 font-medium transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  {isHiring ? 'Converting...' : 'Convert to Employee (Hire)'}
                </button>
              )}

              {candidate?.stage !== 'Rejected' && (
                <button
                  type="button"
                  onClick={() => setIsRejectOpen(true)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-600 border border-rose-200 hover:bg-rose-100 cursor-pointer flex items-center gap-1.5"
                >
                  <XCircle className="w-3.5 h-3.5" /> Reject Candidate
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-100 dark:border-[#1A3125] flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-[#162820] text-slate-700 dark:text-slate-200 hover:bg-slate-200 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* Sub-modals */}
      <InterviewScheduleModal
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        candidate={candidate}
      />

      <ScorecardModal
        isOpen={Boolean(selectedInterviewForScorecard)}
        onClose={() => setSelectedInterviewForScorecard(null)}
        interview={selectedInterviewForScorecard}
        candidateName={candidate?.name}
      />

      <OfferLetterModal
        isOpen={isOfferOpen}
        onClose={() => setIsOfferOpen(false)}
        candidate={candidate}
      />

      {/* Technical Test Prompt Modal */}
      {isTestPromptOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] w-full max-w-md rounded-2xl p-5 space-y-3">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">
              Dispatch Technical Assessment
            </h4>
            <form onSubmit={handleTestSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Assessment URL</label>
                <input
                  type="url"
                  value={testUrl}
                  onChange={(e) => setTestUrl(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#162820] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Custom Candidate Instructions</label>
                <textarea
                  rows={2}
                  value={testInstructions}
                  onChange={(e) => setTestInstructions(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#162820] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTestPromptOpen(false)}
                  className="px-3 py-1.5 rounded-xl font-semibold text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSendingTest}
                  className="px-4 py-1.5 rounded-xl font-semibold bg-[#00C471] text-slate-950 font-medium"
                >
                  {isSendingTest ? 'Sending...' : 'Send Test Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Confirmation Modal */}
      {isRejectOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] w-full max-w-md rounded-2xl p-5 space-y-3">
            <h4 className="font-bold text-sm text-rose-600 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" /> Confirm Candidate Rejection
            </h4>
            <p className="text-xs text-slate-500">
              Please specify the rationale for rejecting {candidate?.name}:
            </p>
            <textarea
              rows={2}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#162820] border border-slate-200 dark:border-[#1A3125] text-xs text-slate-900 dark:text-white"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsRejectOpen(false)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectSubmit}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateDetailModal;

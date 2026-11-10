/**
 * @file ScorecardModal.jsx
 * @description Interviewer Scorecard & Evaluation Modal (Module M15 / Row 15.8).
 * 
 * SPECIFICATION:
 * - Module: M15 Recruitment & AI Screening (BUILD-GUIDE Section 24 · Row 15.8)
 * - Design System: Forest & Emerald (#111D17 dark surface, #1A3125 dark border, #00C471 emerald accent).
 */

import React, { useState, useEffect } from 'react';
import { X, Star, CheckCircle2, AlertCircle, Award, Lock } from 'lucide-react';
import { useSubmitScorecardMutation } from '../recruitmentApi.js';
import { useAuth } from '../../../hooks/useAuth.js';
import { toast } from 'sonner';

export const ScorecardModal = ({ isOpen, onClose, interview, candidateName }) => {
  const { user } = useAuth();

  // Find if a scorecard already exists for this round
  const existingScorecard = interview?.scorecards?.find(
    (sc) =>
      String(sc.interviewerId?._id || sc.interviewerId) === String(user?.employeeId) ||
      String(sc.interviewerId?._id || sc.interviewerId) === String(user?._id)
  ) || (interview?.scorecards?.length > 0 ? interview.scorecards[0] : null);

  const isLocked = Boolean(existingScorecard);

  const [technicalRating, setTechnicalRating] = useState(4);
  const [communicationRating, setCommunicationRating] = useState(4);
  const [culturalRating, setCulturalRating] = useState(4);
  const [recommendation, setRecommendation] = useState('Hire');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [submitScorecard, { isLoading }] = useSubmitScorecardMutation();

  useEffect(() => {
    if (existingScorecard) {
      setTechnicalRating(existingScorecard.technicalRating || 4);
      setCommunicationRating(existingScorecard.communicationRating || 4);
      setCulturalRating(existingScorecard.culturalRating || 4);
      setRecommendation(existingScorecard.recommendation || 'Hire');
      setNotes(existingScorecard.notes || '');
    } else {
      setTechnicalRating(4);
      setCommunicationRating(4);
      setCulturalRating(4);
      setRecommendation('Hire');
      setNotes('');
    }
  }, [existingScorecard]);

  if (!isOpen || !interview) return null;

  const overallRating = existingScorecard
    ? (
        ((existingScorecard.technicalRating || 0) +
          (existingScorecard.communicationRating || 0) +
          (existingScorecard.culturalRating || 0)) /
        3
      ).toFixed(1)
    : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLocked) {
      onClose();
      return;
    }
    setErrorMsg('');

    try {
      await submitScorecard({
        interviewId: interview._id,
        technicalRating: Number(technicalRating),
        communicationRating: Number(communicationRating),
        culturalRating: Number(culturalRating),
        recommendation,
        notes: notes.trim()
      }).unwrap();

      toast.success('Interview evaluation scorecard submitted successfully.');
      onClose();
    } catch (err) {
      setErrorMsg(err?.data?.message || err?.message || 'Failed to submit scorecard.');
    }
  };

  const renderStarPicker = (label, value, setter) => (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          {label}
        </label>
        <span className="text-xs font-mono font-bold text-[#00C471]">
          {value}/5
        </span>
      </div>
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={isLocked}
            onClick={() => !isLocked && setter(star)}
            className={`p-1 rounded-lg transition ${
              isLocked ? 'cursor-default opacity-85' : 'hover:scale-110 cursor-pointer'
            }`}
          >
            <Star
              className={`w-5 h-5 ${
                star <= value
                  ? 'text-amber-400 fill-amber-400'
                  : 'text-slate-300 dark:text-slate-700'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#1A3125]">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
              isLocked
                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-500 border-amber-200 dark:border-amber-900/40'
                : 'bg-emerald-50 dark:bg-[#162820] text-[#00C471] border-emerald-100 dark:border-[#1A3125]'
            }`}>
              {isLocked ? <Lock className="w-4 h-4" /> : <Award className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                {isLocked ? 'Interview Evaluation (Locked)' : 'Submit Interview Scorecard'}
              </h3>
              <p className="text-[10px] text-slate-500">
                Candidate: {candidateName} • Round {interview.roundNumber} ({interview.roundType})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Locked Banner Indicator */}
        {isLocked && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-xl text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-amber-800 dark:text-amber-400">
              <Lock className="w-3.5 h-3.5" />
              <span>Evaluation Locked</span>
            </div>
            <p className="text-[11px] text-amber-700 dark:text-amber-300/90 leading-relaxed">
              Candidate has already been evaluated with an overall rating of <strong className="font-bold">{overallRating}/5.0</strong> ({recommendation.replace('_', ' ')}). Submitted ratings cannot be changed.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-600 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {renderStarPicker('Technical Competence & Problem Solving', technicalRating, setTechnicalRating)}
          {renderStarPicker('Communication & Collaboration', communicationRating, setCommunicationRating)}
          {renderStarPicker('Cultural & Values Alignment', culturalRating, setCulturalRating)}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Hiring Recommendation
            </label>
            <select
              value={recommendation}
              disabled={isLocked}
              onChange={(e) => setRecommendation(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#162820] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white focus:outline-hidden focus:border-[#00C471] disabled:opacity-75 disabled:cursor-not-allowed"
            >
              <option value="Strong_Hire">Strong Hire (Top 5% Candidate)</option>
              <option value="Hire">Hire (Meets All Standards)</option>
              <option value="Hold">Hold / Re-evaluate</option>
              <option value="No_Hire">No Hire (Does Not Meet Bar)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Interviewer Notes & Rationale
            </label>
            <textarea
              rows={3}
              readOnly={isLocked}
              placeholder="Strengths, technical gaps, project discussions, or specific observations..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#162820] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white focus:outline-hidden focus:border-[#00C471] disabled:opacity-75"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-[#1A3125]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#162820] cursor-pointer"
            >
              {isLocked ? 'Close' : 'Cancel'}
            </button>
            {!isLocked && (
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#00C471] hover:bg-[#00B065] text-slate-950 font-medium transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                {isLoading ? 'Submitting...' : 'Submit Evaluation'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};


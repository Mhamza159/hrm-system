/**
 * @file RetentionNotesModal.jsx
 * @description Modal for Logging Retention Interventions & Viewing Tailored Recommendations.
 * 
 * SPECIFICATION:
 * - Module: M17 Attrition Prediction (BUILD-GUIDE Section 26 · Row 17.4)
 * - Tailored Advice: Analyzes top factors and generates concrete retention interventions.
 */

import React, { useState } from 'react';
import {
  X,
  Lightbulb,
  MessageSquarePlus,
  Clock,
  Calendar,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  History
} from 'lucide-react';
import { useAddRetentionNoteMutation } from '../attritionApi.js';
import { RiskTierBadge } from './RiskTierBadge.jsx';

/**
 * Derives actionable recommendations from contributing risk factors
 */
function getActionableAdvice(factors = []) {
  const suggestions = [];

  const text = factors.join(' ').toLowerCase();

  if (text.includes('salary') || text.includes('increment')) {
    suggestions.push({
      title: 'Compensation Benchmark Review',
      description: 'Schedule an off-cycle salary evaluation or performance-linked bonus adjustment.'
    });
  }
  if (text.includes('absence') || text.includes('late')) {
    suggestions.push({
      title: 'Wellness & Flexibility Check-in',
      description: 'Conduct an informal 1-on-1 to discuss potential personal challenges, burnout, or explore remote work.'
    });
  }
  if (text.includes('appraisal') || text.includes('overdue')) {
    suggestions.push({
      title: 'Appraisal Alignment Session',
      description: 'Expedite overdue appraisal sign-off and define 90-day career milestones.'
    });
  }
  if (text.includes('stagnation') || text.includes('designation') || text.includes('tenure')) {
    suggestions.push({
      title: 'Career Pathing & Promotion Discussion',
      description: 'Explore senior title progression, lateral rotation, or high-visibility project ownership.'
    });
  }

  if (suggestions.length === 0) {
    suggestions.push({
      title: 'Proactive Engagement 1-on-1',
      description: 'Schedule a quarterly catch-up to review workload balance, team satisfaction, and upcoming goals.'
    });
  }

  return suggestions;
}

export const RetentionNotesModal = ({ isOpen, onClose, scoreData }) => {
  const [note, setNote] = useState('');
  const [actionTaken, setActionTaken] = useState('One-on-One Wellness Check');
  const [followUpDate, setFollowUpDate] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [addNoteMutation, { isLoading: isSubmitting }] = useAddRetentionNoteMutation();

  if (!isOpen || !scoreData) return null;

  const emp = scoreData.employeeId || {};
  const factors = scoreData.topFactors || [];
  const notesHistory = scoreData.notes || [];
  const adviceList = getActionableAdvice(factors);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!note.trim() || note.trim().length < 3) {
      setErrorMessage('Please provide an intervention note (at least 3 characters).');
      return;
    }

    try {
      await addNoteMutation({
        id: scoreData._id,
        note: note.trim(),
        actionTaken,
        followUpDate: followUpDate || null
      }).unwrap();

      setNote('');
      setFollowUpDate('');
      onClose();
    } catch (err) {
      setErrorMessage(err?.data?.message || err?.message || 'Failed to record intervention note.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
              {emp.name ? emp.name.charAt(0).toUpperCase() : 'E'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">{emp.name || 'Employee'}</h3>
                <RiskTierBadge level={scoreData.riskLevel} score={scoreData.riskScore} size="sm" />
              </div>
              <p className="text-xs text-slate-500">
                {emp.employeeCode} · {scoreData.departmentId?.name || 'Department'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {errorMessage && (
            <div className="p-3 text-xs bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Actionable Retention Advice */}
          <div className="bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 rounded-xl p-4 space-y-2.5">
            <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5 uppercase tracking-wider">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              Recommended Retention Interventions
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {adviceList.map((adv, idx) => (
                <div
                  key={idx}
                  className="bg-white/80 dark:bg-slate-800/80 p-3 rounded-lg border border-amber-200/40 text-xs space-y-1"
                >
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{adv.title}</p>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">{adv.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Log New Intervention Note Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5 border-t pt-4 border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 uppercase tracking-wider">
              <MessageSquarePlus className="h-4 w-4 text-primary" />
              Log Retention Action / Meeting Note
            </h4>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Intervention Strategy
              </label>
              <select
                value={actionTaken}
                onChange={(e) => setActionTaken(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:outline-none"
              >
                <option value="One-on-One Wellness Check">One-on-One Wellness Check</option>
                <option value="Compensation Review">Compensation Review</option>
                <option value="Career Pathing / Promotion">Career Pathing / Promotion</option>
                <option value="Workload Rebalancing">Workload Rebalancing</option>
                <option value="Performance Counseling">Performance Counseling</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Confidential Action Notes <span className="text-red-500">*</span>
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="E.g. Met with employee regarding recent workload stress. Agreed on temporary remote flexibility and scheduled 6-month compensation review..."
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Target Follow-up Date (Optional)
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <span className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Save Action Note</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Past Notes Timeline */}
          {notesHistory.length > 0 && (
            <div className="border-t pt-4 border-slate-100 dark:border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 uppercase tracking-wider">
                <History className="h-4 w-4 text-slate-500" />
                Intervention History ({notesHistory.length})
              </h4>
              <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                {notesHistory
                  .slice()
                  .reverse()
                  .map((item, idx) => (
                    <div
                      key={item._id || idx}
                      className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200/60 dark:border-slate-700/60 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span className="font-semibold text-primary">{item.actionTaken}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap">{item.note}</p>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/40 text-[10px] text-slate-400">
                        <span>Logged by: {item.authorName || 'HR'}</span>
                        {item.followUpDate && (
                          <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                            <Calendar className="h-2.5 w-2.5" /> Follow-up: {new Date(item.followUpDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RetentionNotesModal;


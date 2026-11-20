/**
 * @file EmployeeRiskDetailModal.jsx
 * @description Executive Flight-Risk Dossier Modal displaying employee credentials,
 * 5-factor breakdown progress bars, primary risk drivers, contextual retention recommendations,
 * and audit-trailed intervention notes. Styled in Forest & Emerald Enterprise theme.
 */

import React, { useState } from 'react';
import {
  X,
  Calendar,
  AlertTriangle,
  Lightbulb,
  MessageSquare,
  Clock,
  Loader2,
  Send,
  Plus
} from 'lucide-react';
import { useAddRetentionNoteMutation, useGetRetentionNotesQuery } from '../attritionApi.js';
import { RiskTierBadge } from './RiskTierBadge.jsx';
import { toast } from 'sonner';

// Helper to format tenure relative to score calculation timestamp
const formatTenure = (joiningDate, calculatedAt) => {
  if (!joiningDate) return 'N/A';
  const joinTs = new Date(joiningDate).getTime();
  if (Number.isNaN(joinTs)) return 'N/A';
  const refTs = calculatedAt ? new Date(calculatedAt).getTime() : joinTs;
  const months = Math.max(0, Math.floor((refTs - joinTs) / (1000 * 60 * 60 * 24 * 30.44)));
  const years = Math.floor(months / 12);
  const remMonths = months % 12;
  if (years === 0) return `${remMonths} mo`;
  return `${years} yr${years > 1 ? 's' : ''} ${remMonths > 0 ? `${remMonths} mo` : ''}`;
};

export const EmployeeRiskDetailModal = ({
  isOpen,
  onClose,
  score,
  userRoles: _userRoles = []
}) => {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'notes'
  const [noteText, setNoteText] = useState('');
  const [actionTaken, setActionTaken] = useState('One-on-One Wellness Check');
  const [followUpDate, setFollowUpDate] = useState('');

  const [addNoteMutation, { isLoading: isAddingNote }] = useAddRetentionNoteMutation();
  const { data: notesData, isLoading: isLoadingNotes } = useGetRetentionNotesQuery(score?._id, {
    skip: !isOpen || !score?._id
  });

  if (!isOpen || !score) return null;

  const employee = score.employeeId || {};
  const department = score.departmentId || {};
  const breakdown = score.breakdown || {
    attendance: 0,
    salaryStagnation: 0,
    appraisal: 0,
    tenure: 0,
    engagement: 0
  };
  const topFactors = score.topFactors || [];
  const notes = notesData?.data || score.notes || [];

  const tenureText = formatTenure(employee.joiningDate, score.calculatedAt);

  // Dynamic Contextual Retention Recommendations
  const getRetentionRecommendations = () => {
    const recs = [];
    if (breakdown.salaryStagnation >= 12) {
      recs.push({
        title: 'Compensation Benchmarking & Review',
        desc: 'Employee has experienced compensation stagnation. Schedule an immediate market compensation review or consider merit adjustment.',
        priority: 'High Priority',
        color: 'text-amber-500 bg-amber-500/10 border-amber-500/20'
      });
    }
    if (breakdown.attendance >= 15) {
      recs.push({
        title: 'One-on-One Wellness & Flexibility Check',
        desc: 'Noticeable attendance disruptions detected. Conduct a supportive check-in to discuss work-life balance, remote flexibility, or wellness support.',
        priority: 'Urgent',
        color: 'text-red-500 bg-red-500/10 border-red-500/20'
      });
    }
    if (breakdown.appraisal >= 10) {
      recs.push({
        title: 'Appraisal & Performance Alignment',
        desc: 'Overdue review cycle or recent performance dip. Align on clear objectives, supportive coaching, and recognition milestones.',
        priority: 'Medium',
        color: 'text-blue-500 bg-blue-500/10 border-blue-500/20'
      });
    }
    if (breakdown.tenure >= 15) {
      recs.push({
        title: 'Career Pathing & Role Elevation',
        desc: 'Extended tenure in current designation without title change. Explore cross-functional leadership projects or promotion roadmap.',
        priority: 'Growth',
        color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
      });
    }
    if (recs.length === 0) {
      recs.push({
        title: 'Routine Retention Maintenance',
        desc: 'Risk signals are within nominal limits. Maintain standard one-on-one frequency and continuous peer appreciation.',
        priority: 'Standard',
        color: 'text-[#00C471] bg-emerald-500/10 border-emerald-500/20'
      });
    }
    return recs;
  };

  const recommendations = getRetentionRecommendations();

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim()) {
      toast.error('Intervention note content cannot be empty');
      return;
    }

    try {
      await addNoteMutation({
        id: score._id,
        note: noteText.trim(),
        actionTaken,
        followUpDate: followUpDate || null
      }).unwrap();

      toast.success('Retention intervention note logged');
      setNoteText('');
      setFollowUpDate('');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to log intervention note');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-[#1A3125] flex items-center justify-between bg-slate-50/50 dark:bg-[#061A14]/30">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[#00C471] flex items-center justify-center font-bold text-sm shrink-0">
              {employee.avatar ? (
                <img src={employee.avatar} alt={employee.name} className="w-11 h-11 rounded-full object-cover" />
              ) : (
                (employee.name || 'EM').slice(0, 2).toUpperCase()
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  {employee.name || 'Employee Profile'}
                </h3>
                <span className="font-mono text-xs text-[#00C471] bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  {employee.employeeCode || 'EMP'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-[#7E9E8F] flex items-center gap-2 mt-0.5">
                <span>{employee.designationId?.title || 'Designation N/A'}</span>
                <span>•</span>
                <span>{department.name || 'Department N/A'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <RiskTierBadge score={score.riskScore} level={score.riskLevel} />
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1A3125] transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 border-b border-slate-100 dark:border-[#1A3125] flex gap-4 bg-slate-50/20 dark:bg-[#061A14]/20">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`py-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'overview'
                ? 'border-[#00C471] text-[#00C471]'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span>Flight Risk Intelligence</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('notes')}
            className={`py-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'notes'
                ? 'border-[#00C471] text-[#00C471]'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Intervention Notes ({notes.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-6 custom-scrollbar">
          {activeTab === 'overview' ? (
            <>
              {/* Top Overview Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#061A14] border border-slate-200 dark:border-[#1A3125] flex flex-col justify-between h-20">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-[#7E9E8F] block tracking-wider">
                    Calculated Risk Score
                  </span>
                  <p className="font-mono text-xl font-bold text-slate-900 dark:text-white">
                    {score.riskScore}
                    <span className="text-xs font-normal text-slate-400">/100</span>
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#061A14] border border-slate-200 dark:border-[#1A3125] flex flex-col justify-between h-20">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-[#7E9E8F] block tracking-wider">
                    Tenure at Firm
                  </span>
                  <p className="font-mono text-base font-bold text-slate-900 dark:text-white">
                    {tenureText}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#061A14] border border-slate-200 dark:border-[#1A3125] flex flex-col justify-between h-20">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-[#7E9E8F] block tracking-wider">
                    Evaluation Date
                  </span>
                  <p className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                    {score.calculatedAt ? new Date(score.calculatedAt).toLocaleDateString() : 'Recent'}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#061A14] border border-slate-200 dark:border-[#1A3125] flex flex-col justify-between h-20">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-[#7E9E8F] block tracking-wider">
                    Intervention Logs
                  </span>
                  <p className="font-mono text-base font-bold text-[#00C471]">
                    {notes.length} logged
                  </p>
                </div>
              </div>

              {/* 5-Factor Contribution Breakdown */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#061A14]/30 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Signal Contribution Breakdown
                  </h4>
                  <span className="text-[10px] text-slate-400">Points Assigned vs Max Weight</span>
                </div>

                <div className="space-y-2.5">
                  {[
                    { label: 'Attendance & Tardiness', score: breakdown.attendance, max: 30, color: 'bg-emerald-500' },
                    { label: 'Compensation Stagnation', score: breakdown.salaryStagnation, max: 25, color: 'bg-amber-500' },
                    { label: 'Performance & Appraisal', score: breakdown.appraisal, max: 20, color: 'bg-red-500' },
                    { label: 'Tenure & Role Progression', score: breakdown.tenure, max: 15, color: 'bg-blue-500' },
                    { label: 'Workplace Engagement Signals', score: breakdown.engagement, max: 10, color: 'bg-teal-500' }
                  ].map((row) => (
                    <div key={row.label} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-slate-700 dark:text-slate-300">{row.label}</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          {row.score} <span className="text-[10px] text-slate-400">/ {row.max} pts</span>
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-[#162820] overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${row.color}`}
                          style={{ width: `${(row.score / row.max) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Primary Detected Flight Signals */}
              {topFactors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    <span>Primary Detected Triggers ({topFactors.length})</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {topFactors.map((factor, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl border border-red-500/20 bg-red-500/5 dark:bg-red-950/20 text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-2"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                        <span>{factor}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Contextual Retention Recommendations */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-[#00C471]" />
                  <span>Recommended Retention Interventions</span>
                </h4>
                <div className="grid grid-cols-1 gap-2.5">
                  {recommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#061A14] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                    >
                      <div className="space-y-0.5">
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${rec.color} inline-block mb-1`}>
                          {rec.priority}
                        </span>
                        <h5 className="font-bold text-xs text-slate-900 dark:text-white">{rec.title}</h5>
                        <p className="text-[11px] text-slate-500 dark:text-[#7E9E8F] leading-relaxed">
                          {rec.desc}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setActionTaken(
                            rec.title.includes('Compensation')
                              ? 'Compensation Review'
                              : rec.title.includes('Wellness')
                              ? 'One-on-One Wellness Check'
                              : rec.title.includes('Career')
                              ? 'Career Pathing / Promotion'
                              : 'One-on-One Wellness Check'
                          );
                          setActiveTab('notes');
                        }}
                        className="h-8 px-3 text-xs font-bold rounded-lg border border-emerald-500/30 text-[#00C471] hover:bg-emerald-500/10 flex items-center transition shrink-0 self-start sm:self-center cursor-pointer"
                      >
                        Log This Action
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Log New Intervention Note Form */}
              <form onSubmit={handleAddNote} className="p-4 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#061A14]/30 space-y-3.5">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-[#00C471]" />
                  <span>Log New Retention Intervention</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-[#7E9E8F] block mb-1">
                      Action Strategy *
                    </label>
                    <select
                      value={actionTaken}
                      onChange={(e) => setActionTaken(e.target.value)}
                      className="w-full h-9 px-3 text-xs bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-[#00C471]"
                    >
                      <option value="One-on-One Wellness Check">One-on-One Wellness Check</option>
                      <option value="Compensation Review">Compensation Review</option>
                      <option value="Career Pathing / Promotion">Career Pathing / Promotion</option>
                      <option value="Workload Rebalancing">Workload Rebalancing</option>
                      <option value="Performance Counseling">Performance Counseling</option>
                      <option value="Other">Other Interventions</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-[#7E9E8F] block mb-1">
                      Follow-Up Scheduled Date
                    </label>
                    <input
                      type="date"
                      value={followUpDate}
                      onChange={(e) => setFollowUpDate(e.target.value)}
                      className="w-full h-9 px-3 text-xs bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-[#00C471]"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-[#7E9E8F]">
                      Confidential Case Note *
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">{noteText.length}/1000</span>
                  </div>
                  <textarea
                    rows={3}
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Document discussion outcomes, commitments made, or adjustments approved..."
                    maxLength={1000}
                    className="w-full text-xs p-2.5 bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#00C471] transition"
                    required
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isAddingNote || !noteText.trim()}
                    className="h-9 px-4 text-xs font-bold rounded-xl bg-[#00C471] hover:bg-[#00B064] text-white transition flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    {isAddingNote ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>Record Intervention</span>
                  </button>
                </div>
              </form>

              {/* Notes History Timeline */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#00C471]" />
                  <span>Historical Intervention Docket ({notes.length})</span>
                </h4>

                {isLoadingNotes ? (
                  <div className="p-6 text-center text-xs text-slate-400 dark:text-[#7E9E8F]">
                    Loading notes docket...
                  </div>
                ) : notes.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 dark:text-[#7E9E8F] border border-dashed border-slate-200 dark:border-[#1A3125] rounded-xl">
                    No intervention notes have been recorded for this employee yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notes.map((n, idx) => (
                      <div
                        key={n._id || idx}
                        className="p-3.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#061A14] space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-white">
                              {n.authorName || 'HR Leader'}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {n.createdAt ? new Date(n.createdAt).toLocaleDateString() : 'Recent'}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold text-[#00C471] bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                            {n.actionTaken}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 dark:text-[#F8FAFC] leading-relaxed whitespace-pre-wrap">
                          {n.note}
                        </p>

                        {n.followUpDate && (
                          <div className="text-[10px] text-amber-500 font-semibold flex items-center gap-1 pt-1">
                            <Calendar className="w-3 h-3" />
                            <span>Follow-Up Target: {new Date(n.followUpDate).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeRiskDetailModal;

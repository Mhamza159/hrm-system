/**
 * @file SubmitFeedbackPage.jsx
 * @description Page for submitting anonymous feedback, suggestions, or formal grievances (BUILD-GUIDE Row 21.1).
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Send,
  Shield,
  EyeOff,
  User,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  Copy,
  ArrowRight,
  HelpCircle,
  FileText,
  Paperclip,
  Plus,
  X,
  Lock,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { useSubmitFeedbackMutation } from '../feedbackApi.js';
import { useGetDepartmentsQuery } from '../../departments/departmentsApi.js';

export function SubmitFeedbackPage() {
  const navigate = useNavigate();
  const [submitFeedback, { isLoading }] = useSubmitFeedbackMutation();
  const { data: deptData } = useGetDepartmentsQuery({});

  const departments = deptData?.data || [];

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Suggestion',
    priority: 'Medium',
    departmentId: '',
    isAnonymous: true,
    attachments: []
  });

  const [attachmentInput, setAttachmentInput] = useState('');
  const [generatedCode, setGeneratedCode] = useState(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const categories = [
    {
      id: 'Suggestion',
      label: 'Open Suggestion',
      desc: 'Ideas for workplace improvements, culture, or productivity.',
      icon: Lightbulb,
      activeColor: 'border-[#00C471] bg-[#00C471]/10 text-[#00C471]',
      badgeColor: 'bg-[#00C471]/15 text-[#00C471]'
    },
    {
      id: 'Grievance',
      label: 'Formal Grievance',
      desc: 'General unfair treatment, policy violations, or management disputes.',
      icon: FileText,
      activeColor: 'border-blue-500 bg-blue-500/10 text-blue-400',
      badgeColor: 'bg-blue-500/15 text-blue-400'
    },
    {
      id: 'Workplace Issue',
      label: 'Workplace Issue',
      desc: 'Interpersonal friction, team conflicts, or environmental issues.',
      icon: AlertTriangle,
      activeColor: 'border-purple-500 bg-purple-500/10 text-purple-400',
      badgeColor: 'bg-purple-500/15 text-purple-400'
    },
    {
      id: 'Harassment',
      label: 'Harassment Complaint',
      desc: 'Protected channel routed strictly to the designated Inquiry Committee.',
      icon: Shield,
      activeColor: 'border-rose-500 bg-rose-500/10 text-rose-400',
      badgeColor: 'bg-rose-500/15 text-rose-400'
    },
    {
      id: 'Safety',
      label: 'Health & Safety',
      desc: 'Physical safety concerns, hazard reports, or ergonomic equipment needs.',
      icon: AlertTriangle,
      activeColor: 'border-amber-500 bg-amber-500/10 text-amber-400',
      badgeColor: 'bg-amber-500/15 text-amber-400'
    },
    {
      id: 'Other',
      label: 'Other Matters',
      desc: 'Any other matter requiring HR or executive leadership attention.',
      icon: HelpCircle,
      activeColor: 'border-slate-400 bg-slate-500/10 text-slate-300',
      badgeColor: 'bg-slate-500/15 text-slate-300'
    }
  ];

  const handleAddAttachment = () => {
    const url = attachmentInput.trim();
    if (!url) return;
    if (!url.startsWith('https://')) {
      toast.error('Attachment URL must start with https:// for security.');
      return;
    }
    if (formData.attachments.length >= 5) {
      toast.error('Maximum of 5 attachments allowed.');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      attachments: [...prev.attachments, url]
    }));
    setAttachmentInput('');
  };

  const handleRemoveAttachment = (indexToRemove) => {
    setFormData((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, idx) => idx !== indexToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      return toast.error('Please provide a subject or title for your submission.');
    }
    if (formData.description.trim().length < 10) {
      return toast.error('Description must be at least 10 characters long.');
    }

    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        priority: formData.priority,
        isAnonymous: formData.isAnonymous,
        departmentId: formData.departmentId || undefined,
        attachments: formData.attachments
      };

      const res = await submitFeedback(payload).unwrap();
      const code = res?.data?.trackingCode || res?.trackingCode;
      setGeneratedCode(code);
      setIsSuccessModalOpen(true);
      toast.success('Your submission has been securely recorded.');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to submit feedback. Please try again.');
    }
  };

  const copyCode = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      toast.success('Tracking code copied to clipboard!');
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] shadow-sm">
        <div className="flex items-start gap-3.5">
          <div className="p-3 rounded-xl bg-[#00C471]/15 text-[#00C471] border border-[#00C471]/30">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-[#F8FAFC]">
              Feedback & Grievance Portal
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-[#7E9E8F] mt-1 max-w-xl">
              Submit suggestions, voice workplace concerns, or file formal grievances with guaranteed confidentiality and end-to-end status tracking.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/feedback/track')}
          className="self-start sm:self-auto px-4 py-2 rounded-xl text-xs font-semibold text-[#00C471] bg-[#00C471]/10 hover:bg-[#00C471]/20 border border-[#00C471]/30 transition-all flex items-center gap-1.5"
        >
          <span>Track Existing Case</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-6 sm:p-8 shadow-sm">
        {/* Anonymity Switcher Banner */}
        <div className={`p-4 rounded-xl border transition-all ${
          formData.isAnonymous
            ? 'bg-[#00C471]/10 border-[#00C471]/30 text-slate-900 dark:text-[#F8FAFC]'
            : 'bg-blue-500/10 border-blue-500/30 text-slate-900 dark:text-[#F8FAFC]'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-xl shrink-0 ${
                formData.isAnonymous
                  ? 'bg-[#00C471]/20 text-[#00C471]'
                  : 'bg-blue-500/20 text-blue-400'
              }`}>
                {formData.isAnonymous ? <EyeOff className="w-5 h-5" /> : <User className="w-5 h-5" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm text-slate-900 dark:text-[#F8FAFC]">
                    {formData.isAnonymous ? 'Anonymous Submission Mode' : 'Named Employee Submission'}
                  </h3>
                  <span className={`px-2 py-0.5 text-[10px] font-mono rounded-full uppercase tracking-wider font-bold ${
                    formData.isAnonymous ? 'bg-[#00C471]/20 text-[#00C471]' : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {formData.isAnonymous ? 'Identity Erased' : 'Identified'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-[#7E9E8F] mt-1 leading-relaxed">
                  {formData.isAnonymous
                    ? 'Your user ID is completely omitted from the database record. A cryptographic tracking code is generated for progress updates.'
                    : 'Your employee profile is attached to this case so investigating officers can coordinate directly with you.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-[#0A110D] border border-slate-200 dark:border-[#1A3125] self-start sm:self-center shrink-0">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, isAnonymous: true })}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  formData.isAnonymous
                    ? 'bg-[#00C471] text-white shadow-sm'
                    : 'text-slate-600 dark:text-[#7E9E8F] hover:text-slate-900 dark:hover:text-[#F8FAFC]'
                }`}
              >
                <EyeOff className="w-3.5 h-3.5" />
                <span>Anonymous</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, isAnonymous: false })}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  !formData.isAnonymous
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-[#7E9E8F] hover:text-slate-900 dark:hover:text-[#F8FAFC]'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Named</span>
              </button>
            </div>
          </div>
        </div>

        {/* Category Grid */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#7E9E8F] mb-3">
            Case Category <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = formData.category === cat.id;
              return (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => setFormData({ ...formData, category: cat.id })}
                  className={`text-left p-3.5 rounded-xl border transition-all ${
                    isSelected
                      ? `${cat.activeColor} ring-1 ring-offset-0 bg-[#00C471]/10`
                      : 'border-slate-200 dark:border-[#1A3125] hover:border-slate-300 dark:hover:border-[#2D4A3A] bg-slate-50 dark:bg-[#0A110D]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <span className={`p-1.5 rounded-lg border border-transparent ${cat.badgeColor}`}>
                      <Icon className="w-4 h-4" />
                    </span>
                    <span className="font-semibold text-xs text-slate-900 dark:text-[#F8FAFC]">
                      {cat.label}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-[#7E9E8F] line-clamp-2 leading-relaxed">
                    {cat.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Harassment Quarantine Callout */}
        {formData.category === 'Harassment' && (
          <div className="p-4 rounded-xl bg-[#1A0B10] border border-rose-500/30 text-rose-200 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-rose-600/20 text-rose-400 border border-rose-500/30 shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div className="text-xs space-y-1">
              <p className="font-bold text-rose-300">Confidential Inquiry Committee Quarantine Protocol</p>
              <p className="text-rose-200/80 leading-relaxed">
                Cases marked under Harassment bypass ordinary HR staff and department management. In compliance with the Pakistan Protection Against Harassment at the Workplace Act, only certified Inquiry Committee officers and executive leadership can access this docket.
              </p>
            </div>
          </div>
        )}

        {/* Title */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#7E9E8F] mb-1.5">
            Subject / Case Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            maxLength={150}
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Brief, specific summary of the suggestion or grievance..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#0A110D] text-slate-900 dark:text-[#F8FAFC] text-xs sm:text-sm focus:outline-none focus:border-[#00C471] focus:ring-1 focus:ring-[#00C471] transition-all placeholder:text-slate-400 dark:placeholder:text-[#4E6E5D]"
          />
        </div>

        {/* Department & Priority Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#7E9E8F] mb-1.5">
              Target Department <span className="text-[10px] text-slate-400 font-normal lowercase">(optional)</span>
            </label>
            <select
              value={formData.departmentId}
              onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#0A110D] text-slate-900 dark:text-[#F8FAFC] text-xs sm:text-sm focus:outline-none focus:border-[#00C471] focus:ring-1 focus:ring-[#00C471] transition-all"
            >
              <option value="">General / Company-Wide Matter</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#7E9E8F] mb-1.5">
              Severity / Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#0A110D] text-slate-900 dark:text-[#F8FAFC] text-xs sm:text-sm focus:outline-none focus:border-[#00C471] focus:ring-1 focus:ring-[#00C471] transition-all"
            >
              <option value="Low">Low — Open Idea / Minor Inconvenience</option>
              <option value="Medium">Medium — Standard Workplace Matter</option>
              <option value="High">High — Operational Impediment or Dispute</option>
              <option value="Urgent">Urgent — Severe Safety or Regulatory Risk</option>
            </select>
          </div>
        </div>

        {/* Detailed Description */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#7E9E8F]">
              Incident Description & Evidence Details <span className="text-rose-500">*</span>
            </label>
            <span className="text-[11px] font-mono text-slate-400 dark:text-[#7E9E8F]">
              {formData.description.length} / 3000
            </span>
          </div>
          <textarea
            required
            rows={5}
            maxLength={3000}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Please detail what occurred, dates, parties involved, or suggested remedies..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#0A110D] text-slate-900 dark:text-[#F8FAFC] text-xs sm:text-sm focus:outline-none focus:border-[#00C471] focus:ring-1 focus:ring-[#00C471] transition-all placeholder:text-slate-400 dark:placeholder:text-[#4E6E5D] resize-y"
          />
          <p className="mt-1 text-[11px] text-slate-400 dark:text-[#4E6E5D]">
            Minimum 10 characters required. If submitting anonymously, avoid including your personal phone number, direct name, or private desk coordinates.
          </p>
        </div>

        {/* Attachment URLs */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#7E9E8F] mb-1.5">
            Evidence & Document Links <span className="text-[10px] text-slate-400 font-normal lowercase">(optional, max 5)</span>
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Paperclip className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="url"
                value={attachmentInput}
                onChange={(e) => setAttachmentInput(e.target.value)}
                placeholder="https://drive.google.com/... or secure cloud link"
                className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#0A110D] text-slate-900 dark:text-[#F8FAFC] text-xs focus:outline-none focus:border-[#00C471] focus:ring-1 focus:ring-[#00C471] transition-all placeholder:text-slate-400 dark:placeholder:text-[#4E6E5D]"
              />
            </div>
            <button
              type="button"
              onClick={handleAddAttachment}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-[#00C471]/10 hover:bg-[#00C471]/20 text-[#00C471] border border-[#00C471]/30 transition-all flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>

          {formData.attachments.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-2">
              {formData.attachments.map((url, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#0A110D] border border-slate-200 dark:border-[#1A3125] text-xs text-slate-700 dark:text-[#CBD5E1]"
                >
                  <Paperclip className="w-3 h-3 text-[#00C471]" />
                  <span className="truncate max-w-[200px] text-[11px] font-mono">{url}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveAttachment(idx)}
                    className="text-slate-400 hover:text-rose-400 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Toolbar */}
        <div className="pt-4 border-t border-slate-200 dark:border-[#1A3125] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-[11px] text-slate-500 dark:text-[#7E9E8F] flex items-center gap-1">
            <Lock className="w-3 h-3 text-[#00C471]" />
            <span>Submissions protected by encrypted PBAC case governance.</span>
          </p>

          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2.5 rounded-xl bg-[#00C471] hover:bg-[#00B064] text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <span>Registering Submission...</span>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Submit Case</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Success / Tracking Code Dialog */}
      {isSuccessModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl max-w-md w-full p-6 text-center shadow-2xl animate-in fade-in zoom-in-95">
            <div className="w-14 h-14 rounded-2xl bg-[#00C471]/15 text-[#00C471] border border-[#00C471]/30 mx-auto flex items-center justify-center mb-4">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 dark:text-[#F8FAFC]">
              Case Docket Successfully Registered
            </h3>
            <p className="text-xs text-slate-500 dark:text-[#7E9E8F] mt-1.5 leading-relaxed">
              Your grievance has been securely vaulted and queued for investigation triage.
            </p>

            <div className="mt-5 p-4 rounded-xl bg-slate-50 dark:bg-[#0A110D] border border-slate-200 dark:border-[#1A3125] text-left">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-[#7E9E8F]">
                  Confidential Tracking Code
                </span>
                <span className="text-[10px] text-[#00C471] font-mono flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Key
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <span className="text-xl font-mono font-bold tracking-widest text-[#00C471]">
                  {generatedCode}
                </span>
                <button
                  type="button"
                  onClick={copyCode}
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] hover:bg-slate-100 dark:hover:bg-[#1A3125] text-xs font-semibold text-slate-700 dark:text-[#CBD5E1] flex items-center gap-1.5 transition-all"
                >
                  <Copy className="w-3.5 h-3.5 text-[#00C471]" />
                  <span>{copied ? 'Copied! ✓' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div className="mt-3.5 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-left">
              <p className="text-xs text-amber-300 leading-relaxed">
                <strong>CRITICAL NOTICE:</strong> Copy or record this tracking code now. If you submitted anonymously, this key is the <strong>only mechanism</strong> to view status progression and investigator remarks.
              </p>
            </div>

            <div className="mt-5 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => navigate(`/feedback/track?code=${generatedCode}`)}
                className="w-full py-2.5 rounded-xl bg-[#00C471] hover:bg-[#00B064] text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <span>Track Case Progress Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSuccessModalOpen(false);
                  setFormData({
                    title: '',
                    description: '',
                    category: 'Suggestion',
                    priority: 'Medium',
                    departmentId: '',
                    isAnonymous: true,
                    attachments: []
                  });
                }}
                className="w-full py-2 rounded-xl text-xs font-semibold text-slate-500 dark:text-[#7E9E8F] hover:text-slate-900 dark:hover:text-[#F8FAFC] transition-colors"
              >
                Submit Another Feedback
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SubmitFeedbackPage;

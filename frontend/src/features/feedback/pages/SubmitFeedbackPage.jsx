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
  CheckCircle,
  Copy,
  ArrowRight,
  HelpCircle,
  FileText
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
    isAnonymous: true
  });

  const [generatedCode, setGeneratedCode] = useState(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const categories = [
    {
      id: 'Suggestion',
      label: 'Open Suggestion',
      desc: 'Ideas for workplace improvements, culture, or productivity.',
      icon: Lightbulb,
      color: 'text-amber-500 bg-amber-50 border-amber-200'
    },
    {
      id: 'Grievance',
      label: 'Formal Grievance',
      desc: 'General unfair treatment, policy violations, or disputes.',
      icon: FileText,
      color: 'text-blue-500 bg-blue-50 border-blue-200'
    },
    {
      id: 'Workplace Issue',
      label: 'Workplace Issue',
      desc: 'Interpersonal conflicts, team friction, or work environment issues.',
      icon: AlertTriangle,
      color: 'text-purple-500 bg-purple-50 border-purple-200'
    },
    {
      id: 'Harassment',
      label: 'Harassment Complaint',
      desc: 'Protected channel routed strictly to the designated Inquiry Committee.',
      icon: Shield,
      color: 'text-rose-500 bg-rose-50 border-rose-200'
    },
    {
      id: 'Safety',
      label: 'Health & Safety',
      desc: 'Physical safety concerns, hazard reports, or ergonomic issues.',
      icon: AlertTriangle,
      color: 'text-orange-500 bg-orange-50 border-orange-200'
    },
    {
      id: 'Other',
      label: 'Other',
      desc: 'Any other matter you wish to bring to leadership attention.',
      icon: HelpCircle,
      color: 'text-slate-500 bg-slate-50 border-slate-200'
    }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      return toast.error('Please provide a title');
    }
    if (formData.description.trim().length < 10) {
      return toast.error('Description must be at least 10 characters long');
    }

    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        priority: formData.priority,
        isAnonymous: formData.isAnonymous,
        departmentId: formData.departmentId || undefined
      };

      const res = await submitFeedback(payload).unwrap();
      const code = res?.data?.trackingCode || res?.trackingCode;
      setGeneratedCode(code);
      setIsSuccessModalOpen(true);
      toast.success('Your submission has been recorded securely.');
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
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-3">
          <Shield className="w-8 h-8 text-primary" />
          Feedback & Grievance Portal
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Share suggestions, express concerns, or file formal complaints with zero risk. You have total control over your anonymity.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8 shadow-sm">
        {/* Anonymity Selector Banner */}
        <div className={`p-4 rounded-xl border transition-all ${
          formData.isAnonymous
            ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50 text-emerald-900 dark:text-emerald-200'
            : 'bg-blue-50/70 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/50 text-blue-900 dark:text-blue-200'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${formData.isAnonymous ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400' : 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'}`}>
                {formData.isAnonymous ? <EyeOff className="w-5 h-5" /> : <User className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="font-semibold text-base">
                  {formData.isAnonymous ? 'Anonymous Submission Mode' : 'Named Submission Mode'}
                </h3>
                <p className="text-sm mt-0.5 opacity-90">
                  {formData.isAnonymous
                    ? 'Your user identity is NOT recorded in the database. You will be given a secure code to track status.'
                    : 'Your name will be visible to investigators so they can follow up with you directly.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, isAnonymous: true })}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  formData.isAnonymous
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border hover:bg-slate-50'
                }`}
              >
                Anonymous
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, isAnonymous: false })}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  !formData.isAnonymous
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border hover:bg-slate-50'
                }`}
              >
                Named
              </button>
            </div>
          </div>
        </div>

        {/* Category Grid */}
        <div>
          <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">
            Select Category <span className="text-rose-500">*</span>
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
                      ? 'border-primary ring-2 ring-primary/20 bg-primary/5 dark:bg-primary/10'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <span className={`p-1.5 rounded-lg border ${cat.color}`}>
                      <Icon className="w-4 h-4" />
                    </span>
                    <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                      {cat.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                    {cat.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Harassment Callout */}
        {formData.category === 'Harassment' && (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 flex items-start gap-3">
            <Shield className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm space-y-1">
              <p className="font-semibold">Confidential Inquiry Committee Quarantine</p>
              <p className="text-xs text-rose-700 dark:text-rose-300">
                Reports filed under Workplace Harassment bypass standard management and HR channels. Only authorized Inquiry Committee members and executive leadership have clearance to access this case file.
              </p>
            </div>
          </div>
        )}

        {/* Title */}
        <div>
          <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1.5">
            Subject / Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Brief summary of the suggestion or concern..."
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        {/* Department & Priority Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1.5">
              Related Department <span className="text-xs text-slate-400 font-normal">(Optional)</span>
            </label>
            <select
              value={formData.departmentId}
              onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="">General / Company-wide</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1.5">
              Severity / Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="Low">Low (Informational / Idea)</option>
              <option value="Medium">Medium (Standard Matter)</option>
              <option value="High">High (Needs Prompt Attention)</option>
              <option value="Urgent">Urgent (Immediate Safety / Legal Concern)</option>
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1.5">
            Detailed Description <span className="text-rose-500">*</span>
          </label>
          <textarea
            required
            rows={5}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Please detail what occurred, dates, parties involved, or suggested remedies..."
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-y"
          />
          <p className="mt-1 text-xs text-slate-400">
            Minimum 10 characters. Avoid including personal names or contact info if you wish to remain anonymous.
          </p>
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/feedback/track')}
            className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
          >
            Already have a tracking code? Track here &rarr;
          </button>

          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-white font-medium text-sm flex items-center gap-2 shadow-sm transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <span>Submitting...</span>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Submit Feedback
              </>
            )}
          </button>
        </div>
      </form>

      {/* Success / Tracking Code Modal */}
      {isSuccessModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 text-center shadow-xl animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Submission Received!
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
              Your report has been securely registered in the system.
            </p>

            <div className="mt-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-left">
              <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
                Your Confidential Tracking Code
              </span>
              <div className="mt-2 flex items-center justify-between gap-3">
                <span className="text-2xl font-mono font-bold tracking-widest text-primary">
                  {generatedCode}
                </span>
                <button
                  type="button"
                  onClick={copyCode}
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-700 border hover:bg-slate-100 text-xs font-semibold flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-xl text-left">
              <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                <strong>IMPORTANT:</strong> Save this code now! Because this feedback is confidential, this code is the <strong>only way</strong> to track investigation updates without exposing your identity.
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => navigate(`/feedback/track?code=${generatedCode}`)}
                className="w-full py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-white font-medium text-sm flex items-center justify-center gap-2"
              >
                Track Case Progress Now
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
                    isAnonymous: true
                  });
                }}
                className="w-full py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 text-sm font-medium"
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

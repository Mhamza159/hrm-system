/**
 * @file EmployeeReferralModal.jsx
 * @description Internal Employee Referral Submission Modal (Module M15 / Row 15.12).
 * 
 * SPECIFICATION:
 * - Module: M15 Recruitment & AI Screening (BUILD-GUIDE Section 24 · Row 15.12)
 * - Design System: Forest & Emerald (#111D17 dark surface, #1A3125 dark border, #00C471 emerald accent).
 */

import React, { useState } from 'react';
import { X, Users, UploadCloud, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { useSubmitReferralMutation } from '../recruitmentApi.js';
import { toast } from 'sonner';

export const EmployeeReferralModal = ({ isOpen, onClose, defaultJob }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [referralNotes, setReferralNotes] = useState('');
  const [file, setFile] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const [submitReferral, { isLoading }] = useSubmitReferralMutation();

  if (!isOpen || !defaultJob) return null;

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (selected.size > 5 * 1024 * 1024) {
      setErrorMsg('File size exceeds the 5MB limit.');
      return;
    }
    setErrorMsg('');
    setFile(selected);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!file) {
      setErrorMsg('Please attach the candidate’s resume/CV.');
      return;
    }

    if (!referralNotes.trim() || referralNotes.trim().length < 5) {
      setErrorMsg('Please explain how you know this candidate or why they are a strong fit.');
      return;
    }

    const formData = new FormData();
    formData.append('jobId', defaultJob._id);
    formData.append('name', name.trim());
    formData.append('email', email.trim().toLowerCase());
    formData.append('phone', phone.trim());
    if (linkedinUrl.trim()) formData.append('linkedinUrl', linkedinUrl.trim());
    formData.append('referralNotes', referralNotes.trim());
    formData.append('cv', file);

    try {
      await submitReferral(formData).unwrap();
      toast.success(`Referral for ${name} submitted successfully!`);
      onClose();
    } catch (err) {
      setErrorMsg(err?.data?.message || err?.message || 'Failed to submit referral.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] w-full max-w-lg rounded-2xl shadow-2xl p-6 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#1A3125]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-[#162820] text-emerald-600 dark:text-[#00C471] flex items-center justify-center border border-emerald-100 dark:border-[#1A3125]">
              <Users className="w-5 h-5 text-[#00C471]" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Refer a Candidate</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Position: <span className="font-semibold text-slate-700 dark:text-slate-200">{defaultJob.title}</span>
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

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 overflow-y-auto pr-1 flex-1">
          {errorMsg && (
            <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-600 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Candidate Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#162820] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white focus:outline-hidden focus:border-[#00C471]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#162820] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white focus:outline-hidden focus:border-[#00C471]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Contact Phone <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#162820] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white focus:outline-hidden focus:border-[#00C471]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                LinkedIn Profile URL
              </label>
              <input
                type="url"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#162820] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white focus:outline-hidden focus:border-[#00C471]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Resume / CV (PDF or DOCX) <span className="text-rose-500">*</span>
            </label>
            <div className="border border-dashed border-slate-300 dark:border-[#1A3125] rounded-xl p-4 text-center bg-slate-50 dark:bg-[#162820]/40 relative cursor-pointer">
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                required
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
              />
              <div className="flex items-center justify-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                <UploadCloud className="w-4 h-4 text-[#00C471]" />
                <span>{file ? file.name : 'Select or drop CV attachment (up to 5MB)'}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Referral Notes & Recommendation <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="How do you know this candidate? What are their key strengths for this role?"
              value={referralNotes}
              onChange={(e) => setReferralNotes(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#162820] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white focus:outline-hidden focus:border-[#00C471]"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-[#1A3125]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#162820] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#00C471] hover:bg-[#00B065] text-slate-950 font-medium transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isLoading ? 'Submitting...' : 'Submit Referral'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

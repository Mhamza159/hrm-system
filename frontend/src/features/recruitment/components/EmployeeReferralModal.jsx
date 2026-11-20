/**
 * @file EmployeeReferralModal.jsx
 * @description Internal Employee Referral Submission Modal (Module M15 / Row 15.12).
 * 
 * SPECIFICATION:
 * - Module: M15 Recruitment & AI Screening (BUILD-GUIDE Section 24 · Row 15.12)
 * - Design System: Forest & Emerald (#111D17 dark surface, #1A3125 dark border, #00C471 emerald accent).
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Users,
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  User,
  Mail,
  Phone,
  Linkedin,
  Loader2,
  Trash2
} from 'lucide-react';
import { useSubmitReferralMutation, useGetInternalJobsQuery } from '../recruitmentApi.js';
import { toast } from 'sonner';

const RELATIONSHIP_OPTIONS = [
  'Former Colleague',
  'Friend / Personal Network',
  'Worked on Previous Project',
  'Industry / Conference Contact',
  'University / Alumni Network',
  'Other Professional Reference'
];

export const EmployeeReferralModal = ({ isOpen, onClose, defaultJob }) => {
  const [selectedJobId, setSelectedJobId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [relationship, setRelationship] = useState(RELATIONSHIP_OPTIONS[0]);
  const [referralNotes, setReferralNotes] = useState('');
  const [file, setFile] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const { data: jobsRes } = useGetInternalJobsQuery({}, { skip: !isOpen });
  const internalJobs = jobsRes?.data?.items || [];

  const [submitReferral, { isLoading }] = useSubmitReferralMutation();

  useEffect(() => {
    if (defaultJob?._id) {
      setSelectedJobId(defaultJob._id);
    } else if (internalJobs.length > 0 && !selectedJobId) {
      setSelectedJobId(internalJobs[0]._id);
    }
  }, [defaultJob, internalJobs, selectedJobId]);

  if (!isOpen) return null;

  const currentJob = defaultJob || internalJobs.find((j) => j._id === selectedJobId);

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (selected.size > 5 * 1024 * 1024) {
      setErrorMsg('File size exceeds the 5MB limit.');
      return;
    }
    const ext = selected.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'doc', 'docx'].includes(ext)) {
      setErrorMsg('Only PDF, DOC, and DOCX files are supported.');
      return;
    }

    setErrorMsg('');
    setFile(selected);
  };

  const handleRemoveFile = (e) => {
    e.stopPropagation();
    setFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const targetJobId = defaultJob?._id || selectedJobId;
    if (!targetJobId) {
      setErrorMsg('Please select a valid job opening.');
      return;
    }

    if (!file) {
      setErrorMsg('Please attach the candidate’s resume/CV.');
      return;
    }

    if (!referralNotes.trim() || referralNotes.trim().length < 10) {
      setErrorMsg('Please provide a meaningful recommendation explaining why this candidate is a strong fit.');
      return;
    }

    const fullNotes = `[Relationship: ${relationship}]\n${referralNotes.trim()}`;

    const formData = new FormData();
    formData.append('jobId', targetJobId);
    formData.append('name', name.trim());
    formData.append('email', email.trim().toLowerCase());
    formData.append('phone', phone.trim());
    if (linkedinUrl.trim()) formData.append('linkedinUrl', linkedinUrl.trim());
    formData.append('referralNotes', fullNotes);
    formData.append('cv', file);

    try {
      await submitReferral(formData).unwrap();
      toast.success(`Referral for ${name} submitted successfully!`);
      // Reset form
      setName('');
      setEmail('');
      setPhone('');
      setLinkedinUrl('');
      setReferralNotes('');
      setFile(null);
      setErrorMsg('');
      onClose();
    } catch (err) {
      setErrorMsg(err?.data?.message || err?.message || 'Failed to submit candidate referral.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-[#1A3125]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-[#162820] text-emerald-600 dark:text-[#00C471] flex items-center justify-center border border-emerald-100 dark:border-[#1A3125]">
              <Users className="w-5 h-5 text-[#00C471]" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Submit Employee Referral</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {currentJob ? (
                  <>Position: <span className="font-semibold text-emerald-600 dark:text-[#00C471]">{currentJob.title}</span></>
                ) : (
                  'Recommend top talent from your network'
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-[#162820] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4 overflow-y-auto flex-1 text-xs">
          {errorMsg && (
            <div className="p-3 text-xs bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 rounded-xl flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Job Selection if not pre-locked */}
          {!defaultJob && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-[#00C471]" />
                Target Job Position <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-[#162820] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white focus:outline-hidden focus:border-[#00C471]"
              >
                {internalJobs.map((j) => (
                  <option key={j._id} value={j._id}>
                    {j.title} · {j.departmentId?.name || 'General'} ({j.location})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                Candidate Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Sarah Jenkins"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-[#162820] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white focus:outline-hidden focus:border-[#00C471]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                placeholder="sarah.jenkins@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-[#162820] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white focus:outline-hidden focus:border-[#00C471]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                Contact Phone <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-[#162820] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white focus:outline-hidden focus:border-[#00C471]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Linkedin className="w-3.5 h-3.5 text-blue-500" />
                LinkedIn Profile URL
              </label>
              <input
                type="url"
                placeholder="https://linkedin.com/in/..."
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-[#162820] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white focus:outline-hidden focus:border-[#00C471]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Professional Relationship <span className="text-rose-500">*</span>
            </label>
            <select
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-[#162820] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white focus:outline-hidden focus:border-[#00C471]"
            >
              {RELATIONSHIP_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Resume Upload Drag & Drop */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Resume / CV Attachment <span className="text-rose-500">*</span></span>
              <span className="text-[10px] text-slate-400">PDF, DOC, DOCX up to 5MB</span>
            </label>

            {!file ? (
              <div className="border-2 border-dashed border-slate-200 dark:border-[#1A3125] hover:border-[#00C471]/60 rounded-xl p-5 text-center bg-slate-50/50 dark:bg-[#162820]/30 relative transition group cursor-pointer">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  required
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                />
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-[#111D17] text-[#00C471] flex items-center justify-center border border-emerald-100 dark:border-[#1A3125]">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Click to browse or drop resume file
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Our AI parser will analyze skills against job requirements
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#162820] border border-slate-200 dark:border-[#1A3125]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-[#111D17] text-[#00C471] flex items-center justify-center border border-emerald-100 dark:border-[#1A3125]">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">{file.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {(file.size / 1024 / 1024).toFixed(2)} MB · Ready for AI screening
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                  title="Remove file"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Why do you recommend this candidate? <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="Highlight their key strengths, accomplishments, and cultural alignment with the team..."
              value={referralNotes}
              onChange={(e) => setReferralNotes(e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-[#162820] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white focus:outline-hidden focus:border-[#00C471] leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-[#1A3125]">
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
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#00C471] hover:bg-[#00B065] text-slate-950 transition cursor-pointer flex items-center gap-1.5 shadow-xs disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Submitting Referral...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Submit Referral
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

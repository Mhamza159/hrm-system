/**
 * @file ApplyPage.jsx
 * @description Public Candidate Job Application & CV Upload Page (Module M15 / Row 15.4).
 * 
 * SPECIFICATION:
 * - Module: M15 Recruitment & AI Screening (BUILD-GUIDE Section 24 · Row 15.4)
 * - Public: No authentication required.
 * - Design System: Forest & Emerald (#111D17 dark surface, #1A3125 dark border, #00C471 emerald accent).
 */

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Briefcase,
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  User,
  Globe,
  Lock
} from 'lucide-react';
import { useGetPublicJobBySlugQuery, useApplyForJobMutation } from '../recruitmentApi.js';
import { toast } from 'sonner';

export const ApplyPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [file, setFile] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedCandidate, setSubmittedCandidate] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const { data: jobRes, isLoading: isLoadingJob } = useGetPublicJobBySlugQuery(slug);
  const [applyForJob, { isLoading: isSubmitting }] = useApplyForJobMutation();

  const job = jobRes?.data;

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (selected.size > 5 * 1024 * 1024) {
      setErrorMsg('File size exceeds the 5MB limit. Please upload a smaller PDF or DOCX file.');
      return;
    }

    const validExtensions = ['.pdf', '.doc', '.docx'];
    const ext = selected.name.substring(selected.name.lastIndexOf('.')).toLowerCase();
    if (!validExtensions.includes(ext)) {
      setErrorMsg('Invalid file format. Only PDF, DOC, and DOCX files are allowed.');
      return;
    }

    setErrorMsg('');
    setFile(selected);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!job?._id) {
      setErrorMsg('Job opening not loaded.');
      return;
    }

    if (!file) {
      setErrorMsg('Please upload your resume/CV (PDF or DOCX).');
      return;
    }

    const formData = new FormData();
    formData.append('name', name.trim());
    formData.append('email', email.trim().toLowerCase());
    formData.append('phone', phone.trim());
    if (linkedinUrl.trim()) formData.append('linkedinUrl', linkedinUrl.trim());
    if (portfolioUrl.trim()) formData.append('portfolioUrl', portfolioUrl.trim());
    formData.append('cv', file);

    try {
      const res = await applyForJob({
        jobId: job._id,
        formData
      }).unwrap();

      setSubmittedCandidate(res?.data);
      setIsSubmitted(true);
      toast.success('Application submitted successfully!');
    } catch (err) {
      setErrorMsg(err?.data?.message || err?.message || 'Failed to submit application.');
    }
  };

  if (isLoadingJob) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <p className="text-xs text-slate-400">Loading opening details...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center flex-col gap-3">
        <AlertCircle className="w-8 h-8 text-rose-500" />
        <p className="text-sm font-semibold">Job opening not found or currently closed.</p>
        <button
          onClick={() => navigate('/careers')}
          className="text-xs text-[#00C471] hover:underline"
        >
          Return to Careers Directory
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans py-10 px-4">
      <div className="max-w-2xl mx-auto w-full space-y-6">
        <button
          onClick={() => navigate('/careers')}
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to all jobs
        </button>

        {/* Card Container */}
        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
          {/* Header */}
          <div className="border-b border-slate-800 pb-5">
            <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded bg-emerald-950 text-[#00C471] border border-emerald-900/40">
              {job.employmentType}
            </span>
            <h1 className="text-2xl font-extrabold text-white mt-2">
              Apply for {job.title}
            </h1>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              {job.departmentId?.name} • {job.location}
            </p>
          </div>

          {isSubmitted ? (
            <div className="py-10 text-center space-y-4 animate-in fade-in duration-300">
              <div className="w-16 h-16 rounded-full bg-emerald-950 text-[#00C471] flex items-center justify-center mx-auto border border-emerald-800">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-white">Application Received!</h2>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                Thank you, <span className="font-semibold text-white">{name}</span>. Your application and resume have been ingested into our applicant tracking system. Our automated AI screening and talent team are reviewing your submission.
              </p>
              {submittedCandidate?._id && (
                <p className="text-[11px] font-mono text-slate-500">
                  Application Ref: {submittedCandidate._id}
                </p>
              )}
              <div className="pt-4">
                <button
                  onClick={() => navigate('/careers')}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#00C471] hover:bg-[#00B065] text-slate-950 font-medium transition cursor-pointer"
                >
                  Return to Careers Portal
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3 text-xs bg-rose-950/40 border border-rose-900/50 text-rose-400 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      placeholder="e.g. Ayesha Khan"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl text-xs bg-slate-900 border border-slate-800 text-white focus:outline-hidden focus:border-[#00C471]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="email"
                      placeholder="e.g. ayesha@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl text-xs bg-slate-900 border border-slate-800 text-white focus:outline-hidden focus:border-[#00C471]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Contact Phone Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="tel"
                    placeholder="e.g. +92 300 1234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl text-xs bg-slate-900 border border-slate-800 text-white focus:outline-hidden focus:border-[#00C471]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    LinkedIn Profile URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://linkedin.com/in/username"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-900 border border-slate-800 text-white focus:outline-hidden focus:border-[#00C471]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    GitHub / Portfolio Website
                  </label>
                  <input
                    type="url"
                    placeholder="https://github.com/username"
                    value={portfolioUrl}
                    onChange={(e) => setPortfolioUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-900 border border-slate-800 text-white focus:outline-hidden focus:border-[#00C471]"
                  />
                </div>
              </div>

              {/* CV File Upload Box */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Upload Resume / CV (PDF, DOCX up to 5MB) <span className="text-rose-500">*</span>
                </label>
                <div className="border-2 border-dashed border-slate-800 hover:border-[#00C471]/50 rounded-2xl p-6 text-center bg-slate-900/60 relative cursor-pointer group transition">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                    required
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                  />
                  <div className="flex flex-col items-center gap-2">
                    <UploadCloud className="w-8 h-8 text-[#00C471] group-hover:scale-110 transition" />
                    {file ? (
                      <div>
                        <p className="text-xs font-bold text-white flex items-center justify-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-[#00C471]" />
                          {file.name}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {(file.size / (1024 * 1024)).toFixed(2)} MB • Ready for submission
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs font-semibold text-slate-300">
                          Click to browse or drag and drop your CV file here
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Supports PDF, DOC, and DOCX up to 5MB
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-slate-800">
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Secure transmission & encrypted storage
                </span>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl text-xs font-semibold bg-[#00C471] hover:bg-[#00B065] text-slate-950 font-medium transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isSubmitting ? 'Submitting & Parsing...' : 'Submit Job Application'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApplyPage;

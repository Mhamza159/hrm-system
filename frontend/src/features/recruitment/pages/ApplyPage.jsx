/**
 * @file ApplyPage.jsx
 * @description Public Candidate Job Application & CV Upload Page (Module M15 / Row 15.4).
 * 
 * SPECIFICATION & DESIGN:
 * - Module: M15 Recruitment & AI Screening (BUILD-GUIDE Section 24 · Row 15.4)
 * - Public: No authentication required.
 * - Design System: Forest & Emerald (#061A14 dark canvas, #111D17 dark surface, #1A3125 dark border, #00C471 emerald accent).
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
  Lock,
  MapPin,
  Sparkles,
  X,
  ShieldCheck
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

    const validExtensions = ['.pdf', '.doc', '.docx', '.txt'];
    const ext = (selected.name ? selected.name.slice(selected.name.lastIndexOf('.')) : '').toLowerCase();
    if (!validExtensions.includes(ext)) {
      setErrorMsg('Invalid file format. Only PDF, DOC, and DOCX files are allowed.');
      return;
    }

    setErrorMsg('');
    setFile(selected);
  };

  const handleFileRemove = (e) => {
    e.stopPropagation();
    setFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!job?._id) {
      setErrorMsg('Job opening not loaded.');
      return;
    }

    if (!file) {
      setErrorMsg('Please upload your resume/CV (PDF, DOC, or DOCX).');
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
      <div className="min-h-screen bg-[#061A14] text-white flex items-center justify-center">
        <div className="flex items-center gap-2.5 text-xs text-slate-400">
          <div className="w-4 h-4 rounded-full border-2 border-[#00C471] border-t-transparent animate-spin" />
          <span>Loading job opening details...</span>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-[#061A14] text-white flex items-center justify-center flex-col gap-3 p-4">
        <AlertCircle className="w-10 h-10 text-rose-500 opacity-80" />
        <h2 className="text-base font-bold text-white">Job Opening Not Found</h2>
        <p className="text-xs text-slate-400">This opening may have been archived or filled.</p>
        <button
          onClick={() => navigate('/careers')}
          className="mt-2 text-xs font-semibold text-[#00C471] hover:underline flex items-center gap-1 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Return to Careers Directory
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#061A14] text-slate-100 flex flex-col font-sans py-8 px-4 selection:bg-[#00C471]/30 selection:text-white">
      <div className="max-w-5xl mx-auto w-full space-y-6">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/careers')}
            className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer px-2.5 py-1.5 rounded-lg hover:bg-[#162820]"
          >
            <ArrowLeft className="w-4 h-4" /> Back to open positions
          </button>

          <span className="text-[11px] font-mono text-slate-500">
            ELVARA TALENT ACQUISITION
          </span>
        </div>

        {/* Success View */}
        {isSubmitted ? (
          <div className="bg-[#111D17] border border-[#1A3125] rounded-3xl p-8 sm:p-12 shadow-2xl text-center space-y-5 animate-in fade-in duration-300 max-w-2xl mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-[#162820] text-[#00C471] flex items-center justify-center mx-auto border border-[#00C471]/30">
              <CheckCircle2 className="w-8 h-8 text-[#00C471]" />
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-white">Application Received!</h2>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                Thank you, <span className="font-semibold text-white">{name}</span>. Your application for <strong className="text-emerald-400">{job.title}</strong> has been received by our recruiting team.
              </p>
            </div>

            {submittedCandidate?._id && (
              <div className="p-3 rounded-xl bg-[#0B1511] border border-[#1A3125] inline-block font-mono text-xs text-slate-300">
                Application Ref: <span className="text-[#00C471] font-bold">{submittedCandidate._id}</span>
              </div>
            )}

            {/* Next Steps Roadmap */}
            <div className="pt-2 text-left bg-[#0B1511] border border-[#1A3125] rounded-2xl p-4 text-xs space-y-2">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                What Happens Next?
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-400">
                <div className="p-2 rounded-lg bg-[#111D17] border border-[#1A3125]/80">
                  <span className="text-emerald-400 font-bold block mb-0.5">1. AI Screening</span>
                  Automated profile match & skill evaluation.
                </div>
                <div className="p-2 rounded-lg bg-[#111D17] border border-[#1A3125]/80">
                  <span className="text-emerald-400 font-bold block mb-0.5">2. Team Review</span>
                  Hiring manager reviews qualified portfolios.
                </div>
                <div className="p-2 rounded-lg bg-[#111D17] border border-[#1A3125]/80">
                  <span className="text-emerald-400 font-bold block mb-0.5">3. Direct Contact</span>
                  We reach out to schedule your interview.
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => navigate('/careers')}
                className="px-6 py-2.5 rounded-xl text-xs font-semibold bg-[#00C471] hover:bg-[#049856] text-white transition-colors cursor-pointer"
              >
                Return to Careers Directory
              </button>
            </div>
          </div>
        ) : (
          /* Application Form View with 2-Column Split */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Job Overview Sticky Card */}
            <div className="lg:col-span-5 bg-[#111D17] border border-[#1A3125] rounded-3xl p-6 shadow-xl space-y-5 lg:sticky lg:top-24">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#162820] text-[#00C471] border border-[#1A3125]">
                    {job.employmentType}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    {job.location}
                  </span>
                </div>

                <h1 className="text-xl font-bold text-white">
                  {job.title}
                </h1>

                <p className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" />
                  {job.departmentId?.name || 'Department'}
                </p>
              </div>

              <div className="space-y-2 text-xs text-slate-300 border-t border-[#1A3125] pt-4">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  About the Opening
                </span>
                <p className="line-clamp-4 leading-relaxed text-slate-400 text-xs">
                  {job.description}
                </p>
              </div>

              {job.requirements?.length > 0 && (
                <div className="space-y-2 border-t border-[#1A3125] pt-4">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Key Requirements
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {job.requirements.map((req, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-2 py-0.5 rounded bg-[#0B1511] text-slate-300 border border-[#1A3125]"
                      >
                        {req}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-3.5 rounded-2xl bg-[#0B1511] border border-[#1A3125] flex items-center gap-2.5 text-xs text-slate-400">
                <ShieldCheck className="w-4 h-4 text-[#00C471] shrink-0" />
                <span className="text-[11px] leading-tight">
                  All applications are encrypted and processed by our compliance team.
                </span>
              </div>
            </div>

            {/* Right Column: Application Form */}
            <div className="lg:col-span-7 bg-[#111D17] border border-[#1A3125] rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
              <div>
                <h2 className="text-lg font-bold text-white">Submit Your Application</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Complete the candidate profile details below and attach your latest resume.
                </p>
              </div>

              {errorMsg && (
                <div className="p-3.5 text-xs bg-rose-950/40 border border-rose-900/50 text-rose-400 rounded-xl flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                {/* Personal Information */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Full Legal Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="e.g. Ayesha Khan"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="w-full pl-10 pr-3 py-2.5 rounded-xl text-xs bg-[#0B1511] border border-[#1A3125] text-white placeholder-slate-500 focus:outline-hidden focus:border-[#00C471] transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        placeholder="e.g. ayesha@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full pl-10 pr-3 py-2.5 rounded-xl text-xs bg-[#0B1511] border border-[#1A3125] text-white placeholder-slate-500 focus:outline-hidden focus:border-[#00C471] transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      placeholder="e.g. +92 300 1234567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl text-xs bg-[#0B1511] border border-[#1A3125] text-white placeholder-slate-500 focus:outline-hidden focus:border-[#00C471] transition-colors"
                    />
                  </div>
                </div>

                {/* Professional Links */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      LinkedIn Profile
                    </label>
                    <input
                      type="url"
                      placeholder="https://linkedin.com/in/username"
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[#0B1511] border border-[#1A3125] text-white placeholder-slate-500 focus:outline-hidden focus:border-[#00C471] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      GitHub or Portfolio Website
                    </label>
                    <input
                      type="url"
                      placeholder="https://github.com/username"
                      value={portfolioUrl}
                      onChange={(e) => setPortfolioUrl(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[#0B1511] border border-[#1A3125] text-white placeholder-slate-500 focus:outline-hidden focus:border-[#00C471] transition-colors"
                    />
                  </div>
                </div>

                {/* CV File Upload Box */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Upload Resume / CV (PDF, DOCX up to 5MB) <span className="text-rose-500">*</span>
                  </label>
                  <div className="border-2 border-dashed border-[#1A3125] hover:border-[#00C471]/60 rounded-2xl p-6 text-center bg-[#0B1511] relative cursor-pointer group transition-colors">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileChange}
                      required={!file}
                      className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                    />
                    <div className="flex flex-col items-center gap-2">
                      <UploadCloud className="w-8 h-8 text-[#00C471] group-hover:scale-105 transition-transform" />
                      {file ? (
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-white flex items-center justify-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-[#00C471]" />
                            <span>{file.name}</span>
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {(file.size / (1024 * 1024)).toFixed(2)} MB • Ready to upload
                          </p>
                          <button
                            type="button"
                            onClick={handleFileRemove}
                            className="mt-1 text-[11px] text-rose-400 hover:text-rose-300 underline cursor-pointer"
                          >
                            Remove and replace file
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-slate-200">
                            Click to browse or drag and drop your resume file here
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Accepts PDF, DOC, and DOCX formats up to 5MB
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#1A3125]">
                  <span className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-slate-400" /> Automated anti-tampering & TLS security
                  </span>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-semibold bg-[#00C471] hover:bg-[#049856] text-white transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isSubmitting ? 'Submitting & Parsing...' : 'Submit Application'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplyPage;

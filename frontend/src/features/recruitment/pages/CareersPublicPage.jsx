/**
 * @file CareersPublicPage.jsx
 * @description External Public Careers & Talent Acquisition Portal (Module M15 / Row 15.3).
 * 
 * SPECIFICATION & DESIGN:
 * - Module: M15 Recruitment & AI Screening (BUILD-GUIDE Section 24 · Row 15.3)
 * - Public: No authentication required.
 * - Design System: Forest & Emerald (#061A14 dark canvas, #111D17 dark surface, #1A3125 dark border, #00C471 emerald accent).
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase,
  MapPin,
  Clock,
  Building2,
  Search,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  DollarSign,
  X,
  ChevronRight,
  Filter
} from 'lucide-react';
import { useGetPublicJobsQuery } from '../recruitmentApi.js';
import { useGetPublicBrandingQuery } from '../../settings/settingsApi.js';

export const CareersPublicPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedJob, setSelectedJob] = useState(null);

  const { data: jobsRes, isLoading } = useGetPublicJobsQuery({
    search: search.trim() || undefined,
    departmentId: selectedDept !== 'all' ? selectedDept : undefined,
    employmentType: selectedType !== 'all' ? selectedType : undefined
  });

  const { data: brandingRes } = useGetPublicBrandingQuery();
  const company = brandingRes?.data || {};
  const companyName = company.name || 'ELVARA';

  const jobs = jobsRes?.data?.items || [];

  // Derive unique departments from public jobs
  const departments = useMemo(() => {
    return Array.from(
      new Map(
        jobs
          .filter((j) => j.departmentId && (j.departmentId._id || j.departmentId.name))
          .map((j) => [j.departmentId._id || j.departmentId.name, j.departmentId])
      ).values()
    );
  }, [jobs]);

  return (
    <div className="min-h-screen bg-[#061A14] text-slate-100 flex flex-col font-sans selection:bg-[#00C471]/30 selection:text-white">
      {/* Public Navbar */}
      <header className="border-b border-[#1A3125] bg-[#0B1511]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#00C471]/15 text-[#00C471] flex items-center justify-center border border-[#00C471]/30">
              <Briefcase className="w-5 h-5 text-[#00C471]" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-wide text-white">{companyName}</span>
              <span className="text-[10px] text-[#00C471] font-mono block">CAREERS & TALENT</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="/login"
              className="text-xs font-semibold text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-[#162820]"
            >
              Employee Login
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-6 bg-gradient-to-b from-[#09221A] via-[#061A14] to-[#061A14] border-b border-[#1A3125]">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#00C471]/10 text-[#00C471] border border-[#00C471]/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>We Are Hiring Top Engineers & Operators</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Build High-Impact Enterprise Systems With Us
          </h1>

          <p className="text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Join our mission to engineer next-generation workforce automation, AI resume screening, and financial integrity platforms.
          </p>

          {/* Search & Filter Bar */}
          <div className="pt-6 max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative col-span-1 sm:col-span-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search job title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 rounded-xl text-xs bg-[#111D17] border border-[#1A3125] text-white placeholder-slate-400 focus:outline-hidden focus:border-[#00C471] transition-colors"
              />
            </div>

            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="px-3 py-2.5 rounded-xl text-xs bg-[#111D17] border border-[#1A3125] text-white focus:outline-hidden focus:border-[#00C471] cursor-pointer"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d._id || d.name} value={d._id || d.name}>
                  {d.name}
                </option>
              ))}
            </select>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2.5 rounded-xl text-xs bg-[#111D17] border border-[#1A3125] text-white focus:outline-hidden focus:border-[#00C471] cursor-pointer"
            >
              <option value="all">All Employment Types</option>
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Contract">Contract</option>
              <option value="Remote">Remote</option>
              <option value="Internship">Internship</option>
            </select>
          </div>
        </div>
      </section>

      {/* Positions Grid */}
      <main className="max-w-6xl mx-auto px-6 py-12 flex-1 w-full space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <span>Available Openings</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-[#162820] text-[#00C471] border border-[#1A3125]">
              {jobs.length}
            </span>
          </h2>

          <span className="text-xs text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#00C471]" />
            AI Resume Fit Evaluation Enabled
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs.map((job) => {
            const minSal = job.minSalaryPaisa ? (job.minSalaryPaisa / 100).toLocaleString() : null;
            const maxSal = job.maxSalaryPaisa ? (job.maxSalaryPaisa / 100).toLocaleString() : null;

            return (
              <div
                key={job._id}
                className="p-6 rounded-2xl bg-[#111D17] border border-[#1A3125] hover:border-[#00C471]/60 transition-all duration-200 flex flex-col justify-between group shadow-lg"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-[#162820] text-[#00C471] border border-[#1A3125]">
                      {job.employmentType}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      {job.location}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-[#00C471] transition-colors">
                      {job.title}
                    </h3>
                    <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1 font-medium">
                      <Building2 className="w-3.5 h-3.5 text-slate-500" />
                      {job.departmentId?.name}
                    </p>
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                    {job.description}
                  </p>

                  {/* Compensation pill if disclosed */}
                  {job.isSalaryDisclosed && minSal && (
                    <div className="inline-flex items-center gap-1 text-[11px] font-mono font-medium text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/40">
                      <span>PKR {minSal} {maxSal ? `- ${maxSal}` : ''} / month</span>
                    </div>
                  )}

                  {/* Requirements chips */}
                  {job.requirements?.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      {job.requirements.slice(0, 4).map((req, i) => (
                        <span
                          key={i}
                          className="text-[10px] px-2 py-0.5 rounded bg-[#0B1511] text-slate-300 border border-[#1A3125]"
                        >
                          {req}
                        </span>
                      ))}
                      {job.requirements.length > 4 && (
                        <span className="text-[10px] text-slate-500">
                          +{job.requirements.length - 4} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-6 mt-4 border-t border-[#1A3125] flex items-center justify-between">
                  <button
                    onClick={() => setSelectedJob(job)}
                    className="text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    View Details
                  </button>

                  <button
                    onClick={() => navigate(`/careers/${job.slug}/apply`)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#00C471] hover:bg-[#049856] text-white transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    <span>Apply Now</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}

          {jobs.length === 0 && !isLoading && (
            <div className="col-span-full py-16 text-center text-slate-400 bg-[#111D17]/60 rounded-2xl border border-[#1A3125]">
              <Briefcase className="w-10 h-10 mx-auto mb-2 opacity-30 text-slate-400" />
              <p className="text-sm font-semibold text-white">No open positions matching your search.</p>
              <p className="text-xs text-slate-500 mt-1">Please check back soon or try clearing filters.</p>
            </div>
          )}
        </div>
      </main>

      {/* Job Details Modal Drawer */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-[#111D17] border border-[#1A3125] w-full max-w-2xl rounded-2xl p-6 space-y-5 max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#162820] text-[#00C471] border border-[#1A3125]">
                  {selectedJob.employmentType}
                </span>
                <h2 className="text-xl font-bold text-white mt-1.5">{selectedJob.title}</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {selectedJob.departmentId?.name} • {selectedJob.location}
                </p>
              </div>

              <button
                onClick={() => setSelectedJob(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#162820] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs leading-relaxed text-slate-300">
              <div>
                <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-1">
                  About the Role
                </h4>
                <p className="whitespace-pre-line text-slate-300 leading-relaxed">{selectedJob.description}</p>
              </div>

              {selectedJob.requirements?.length > 0 && (
                <div>
                  <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-1.5">
                    Requirements & Qualifications
                  </h4>
                  <ul className="space-y-1 text-slate-300 list-disc pl-4 leading-relaxed">
                    {selectedJob.requirements.map((req, i) => (
                      <li key={i}>{req}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedJob.responsibilities?.length > 0 && (
                <div>
                  <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-1.5">
                    Key Responsibilities
                  </h4>
                  <ul className="space-y-1 text-slate-300 list-disc pl-4 leading-relaxed">
                    {selectedJob.responsibilities.map((res, i) => (
                      <li key={i}>{res}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-[#1A3125] flex items-center justify-end gap-3">
              <button
                onClick={() => setSelectedJob(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-[#162820] transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => navigate(`/careers/${selectedJob.slug}/apply`)}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#00C471] hover:bg-[#049856] text-white transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span>Apply for this Position</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-[#1A3125] bg-[#0B1511] py-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} {companyName} • Equal Opportunity Employer
      </footer>
    </div>
  );
};

export default CareersPublicPage;

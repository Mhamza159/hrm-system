/**
 * @file CareersPublicPage.jsx
 * @description External Public Careers & Talent Acquisition Portal (Module M15 / Row 15.3).
 * 
 * SPECIFICATION:
 * - Module: M15 Recruitment & AI Screening (BUILD-GUIDE Section 24 · Row 15.3)
 * - Public: No authentication required.
 * - Design System: Forest & Emerald (#111D17 dark surface, #1A3125 dark border, #00C471 emerald accent).
 */

import React, { useState } from 'react';
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
  ExternalLink
} from 'lucide-react';
import { useGetPublicJobsQuery } from '../recruitmentApi.js';
import { useGetDepartmentsQuery } from '../../departments/departmentsApi.js';

export const CareersPublicPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);

  const { data: jobsRes, isLoading } = useGetPublicJobsQuery({
    search,
    departmentId: selectedDept,
    employmentType: selectedType
  });
  const { data: deptRes } = useGetDepartmentsQuery({ limit: 100 });

  const jobs = jobsRes?.data?.items || [];
  const departments = deptRes?.data?.items || deptRes?.data || [];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Public Navbar */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#00C471]/15 text-[#00C471] flex items-center justify-center border border-[#00C471]/30">
              <Briefcase className="w-5 h-5 text-[#00C471]" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-wide text-white">HRM ENTERPRISE</span>
              <span className="text-[10px] text-emerald-400 font-mono block">CAREERS & TALENT</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="/login"
              className="text-xs font-semibold text-slate-400 hover:text-white transition"
            >
              Staff Portal Login
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-6 bg-radial from-emerald-950/30 via-slate-900 to-slate-950 border-b border-slate-800/80">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#00C471]/10 text-[#00C471] border border-[#00C471]/20">
            <Sparkles className="w-3.5 h-3.5" />
            We Are Hiring Top Engineering & Operations Talent
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Build Next-Generation Enterprise Systems With Us
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Join our mission to craft high-concurrency human resources, automated payroll, and AI decision systems. Explore open positions below.
          </p>

          {/* Search & Filter Bar */}
          <div className="pt-6 max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative col-span-1 sm:col-span-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search job title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 rounded-xl text-xs bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-hidden focus:border-[#00C471]"
              />
            </div>

            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="px-3 py-2.5 rounded-xl text-xs bg-slate-950 border border-slate-800 text-white focus:outline-hidden focus:border-[#00C471]"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name}
                </option>
              ))}
            </select>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2.5 rounded-xl text-xs bg-slate-950 border border-slate-800 text-white focus:outline-hidden focus:border-[#00C471]"
            >
              <option value="">All Employment Types</option>
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
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Available Openings ({jobs.length})
          </h2>
          <span className="text-xs text-slate-400">
            Powered by Automated AI CV Screening
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs.map((job) => (
            <div
              key={job._id}
              className="p-6 rounded-2xl bg-slate-950 border border-slate-800/90 hover:border-[#00C471]/50 transition flex flex-col justify-between group shadow-lg"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-emerald-950/60 text-[#00C471] border border-emerald-900/40">
                    {job.employmentType}
                  </span>
                  <span className="text-xs text-slate-500 flex items-center gap-1 font-mono">
                    <MapPin className="w-3.5 h-3.5" />
                    {job.location}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-white group-hover:text-[#00C471] transition">
                    {job.title}
                  </h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1 font-medium">
                    <Building2 className="w-3.5 h-3.5 text-slate-500" />
                    {job.departmentId?.name}
                  </p>
                </div>

                <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                  {job.description}
                </p>

                {job.requirements?.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-2">
                    {job.requirements.slice(0, 4).map((req, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800"
                      >
                        {req}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-6 mt-4 border-t border-slate-800/80 flex items-center justify-between">
                <button
                  onClick={() => setSelectedJob(job)}
                  className="text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer"
                >
                  View Details
                </button>

                <button
                  onClick={() => navigate(`/careers/${job.slug}/apply`)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#00C471] hover:bg-[#00B065] text-slate-950 font-medium transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  Apply Now <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {jobs.length === 0 && !isLoading && (
            <div className="col-span-full py-16 text-center text-slate-500 bg-slate-950/40 rounded-2xl border border-slate-800">
              <Briefcase className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-semibold">No open positions matching your search.</p>
              <p className="text-xs text-slate-500 mt-1">Please check back soon or try clearing filters.</p>
            </div>
          )}
        </div>
      </main>

      {/* Job Details Modal Drawer */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-slate-950 border border-slate-800 w-full max-w-2xl rounded-2xl p-6 space-y-5 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-950 text-[#00C471] border border-emerald-900/50">
                  {selectedJob.employmentType}
                </span>
                <h2 className="text-xl font-bold text-white mt-1.5">{selectedJob.title}</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {selectedJob.departmentId?.name} • {selectedJob.location}
                </p>
              </div>

              <button
                onClick={() => setSelectedJob(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs leading-relaxed text-slate-300">
              <div>
                <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-1">
                  About the Role
                </h4>
                <p className="whitespace-pre-line text-slate-400">{selectedJob.description}</p>
              </div>

              {selectedJob.requirements?.length > 0 && (
                <div>
                  <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-1.5">
                    Requirements & Qualifications
                  </h4>
                  <ul className="space-y-1 text-slate-300 list-disc pl-4">
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
                  <ul className="space-y-1 text-slate-300 list-disc pl-4">
                    {selectedJob.responsibilities.map((res, i) => (
                      <li key={i}>{res}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                onClick={() => setSelectedJob(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => navigate(`/careers/${selectedJob.slug}/apply`)}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#00C471] hover:bg-[#00B065] text-slate-950 font-medium transition cursor-pointer flex items-center gap-1.5"
              >
                Apply for this Position <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} HRM Enterprise Suite • Equal Opportunity Employer
      </footer>
    </div>
  );
};

export default CareersPublicPage;

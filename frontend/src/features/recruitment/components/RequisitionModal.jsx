/**
 * @file RequisitionModal.jsx
 * @description Headcount Requisition Creation Modal for Department Managers (Module M15 / Row 15.1).
 * 
 * SPECIFICATION:
 * - Module: M15 Recruitment & AI Screening (BUILD-GUIDE Section 24 · Row 15.1)
 * - Design System: Forest & Emerald (#111D17 dark surface, #1A3125 dark border, #00C471 emerald accent).
 */

import React, { useState } from 'react';
import { X, UserPlus, AlertCircle, Building2, Briefcase, DollarSign, FileText, CheckCircle2 } from 'lucide-react';
import { useCreateRequisitionMutation } from '../recruitmentApi.js';
import { useGetDepartmentsQuery, useGetDesignationsQuery } from '../../departments/departmentsApi.js';
import { toast } from 'sonner';

export const RequisitionModal = ({ isOpen, onClose }) => {
  const [departmentId, setDepartmentId] = useState('');
  const [designationId, setDesignationId] = useState('');
  const [openingsCount, setOpeningsCount] = useState(1);
  const [employmentType, setEmploymentType] = useState('Full-time');
  const [minExperienceYears, setMinExperienceYears] = useState(2);
  const [minSalaryPkr, setMinSalaryPkr] = useState('');
  const [maxSalaryPkr, setMaxSalaryPkr] = useState('');
  const [justification, setJustification] = useState('');
  const [skillsInput, setSkillsInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const { data: deptRes } = useGetDepartmentsQuery({ limit: 100 });
  const { data: desigRes } = useGetDesignationsQuery({ limit: 100 });
  const [createRequisition, { isLoading }] = useCreateRequisitionMutation();

  const departments = deptRes?.data?.items || deptRes?.data || [];
  const designations = desigRes?.data?.items || desigRes?.data || [];

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!departmentId || !designationId) {
      setErrorMsg('Please select both department and target designation.');
      return;
    }

    const minSal = Number(minSalaryPkr);
    const maxSal = Number(maxSalaryPkr);

    if (isNaN(minSal) || isNaN(maxSal) || minSal <= 0 || maxSal <= 0) {
      setErrorMsg('Please enter valid positive salary amounts.');
      return;
    }

    if (maxSal < minSal) {
      setErrorMsg('Maximum salary cannot be less than minimum salary.');
      return;
    }

    if (!justification.trim() || justification.trim().length < 5) {
      setErrorMsg('Please provide a meaningful justification for this headcount request.');
      return;
    }

    const requiredSkills = skillsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      await createRequisition({
        departmentId,
        designationId,
        openingsCount: Number(openingsCount),
        employmentType,
        minExperienceYears: Number(minExperienceYears),
        minSalaryPaisa: Math.round(minSal * 100),
        maxSalaryPaisa: Math.round(maxSal * 100),
        justification: justification.trim(),
        requiredSkills
      }).unwrap();

      toast.success('Job requisition submitted successfully for executive approval.');
      onClose();
    } catch (err) {
      setErrorMsg(err?.data?.message || err?.message || 'Failed to submit requisition.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] w-full max-w-lg rounded-2xl shadow-2xl p-6 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#1A3125]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-[#162820] text-emerald-600 dark:text-[#00C471] flex items-center justify-center border border-emerald-100 dark:border-[#1A3125]">
              <UserPlus className="w-5 h-5 text-[#00C471]" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Request Headcount Requisition</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Submit departmental position request for Super Admin authorization
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#162820] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 overflow-y-auto pr-1 flex-1">
          {errorMsg && (
            <div className="p-3 text-xs bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Department <span className="text-rose-500">*</span>
              </label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#162820] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white focus:outline-hidden focus:border-[#00C471]"
              >
                <option value="">-- Choose department --</option>
                {departments.map((dept) => (
                  <option key={dept._id} value={dept._id}>
                    {dept.name} ({dept.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Target Designation <span className="text-rose-500">*</span>
              </label>
              <select
                value={designationId}
                onChange={(e) => setDesignationId(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#162820] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white focus:outline-hidden focus:border-[#00C471]"
              >
                <option value="">-- Choose designation --</option>
                {designations.map((desig) => (
                  <option key={desig._id} value={desig._id}>
                    {desig.title} {desig.grade ? `(${desig.grade})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Openings Count
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={openingsCount}
                onChange={(e) => setOpeningsCount(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#162820] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white focus:outline-hidden focus:border-[#00C471]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Employment Type
              </label>
              <select
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#162820] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white focus:outline-hidden focus:border-[#00C471]"
              >
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Remote">Remote</option>
                <option value="Internship">Internship</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Min Exp (Years)
              </label>
              <input
                type="number"
                min="0"
                max="30"
                value={minExperienceYears}
                onChange={(e) => setMinExperienceYears(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#162820] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white focus:outline-hidden focus:border-[#00C471]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Min Salary (PKR / mo) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                placeholder="e.g. 150000"
                value={minSalaryPkr}
                onChange={(e) => setMinSalaryPkr(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#162820] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white focus:outline-hidden focus:border-[#00C471]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Max Salary (PKR / mo) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                placeholder="e.g. 250000"
                value={maxSalaryPkr}
                onChange={(e) => setMaxSalaryPkr(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#162820] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white focus:outline-hidden focus:border-[#00C471]"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Required Skills (comma-separated)
            </label>
            <input
              type="text"
              placeholder="e.g. React, Node.js, TypeScript, Tailwind, MongoDB"
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#162820] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white focus:outline-hidden focus:border-[#00C471]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Business Justification <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="Explain why this position is required, project deliverable alignment, or workload scaling..."
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#162820] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white focus:outline-hidden focus:border-[#00C471]"
              required
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
              {isLoading ? 'Submitting...' : 'Submit Requisition'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

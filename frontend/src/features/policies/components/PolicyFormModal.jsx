/**
 * @file PolicyFormModal.jsx
 * @description Administrative modal for authoring and revising company policies.
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  FileText,
  Users,
  ShieldCheck,
  Calendar,
  Paperclip,
  Check,
  AlertCircle
} from 'lucide-react';
import {
  useGetCategoriesQuery,
  useCreatePolicyMutation,
  useUpdatePolicyMutation
} from '../policyApi.js';
import { useGetDepartmentsQuery } from '../../departments/departmentsApi.js';

const SYSTEM_ROLES = [
  'Super Admin',
  'HR Manager',
  'Department Manager',
  'Employee',
  'Payroll Admin'
];

const getInitialFormData = (initialPolicy, categories) => {
  if (initialPolicy) {
    return {
      title: initialPolicy.title || '',
      policyCode: initialPolicy.policyCode || '',
      categoryId: initialPolicy.categoryId?._id || initialPolicy.categoryId || '',
      description: initialPolicy.description || '',
      content: initialPolicy.content || '',
      scope: initialPolicy.scope || 'All Employees',
      departmentIds: initialPolicy.departmentIds?.map((d) => d._id || d) || [],
      targetRoles: initialPolicy.targetRoles || [],
      effectiveDate: initialPolicy.effectiveDate ? initialPolicy.effectiveDate.split('T')[0] : '',
      reviewDate: initialPolicy.reviewDate ? initialPolicy.reviewDate.split('T')[0] : '',
      expiresAt: initialPolicy.expiresAt ? initialPolicy.expiresAt.split('T')[0] : '',
      requiresAcknowledgement: initialPolicy.requiresAcknowledgement ?? true,
      gracePeriodDays: initialPolicy.gracePeriodDays || 7,
      changeSummary: '',
      fileUrl: initialPolicy.fileUrl || '',
      fileName: initialPolicy.fileName || '',
      fileType: initialPolicy.fileType || 'pdf'
    };
  }
  return {
    title: '',
    policyCode: '',
    categoryId: categories?.[0]?._id || '',
    description: '',
    content: '',
    scope: 'All Employees',
    departmentIds: [],
    targetRoles: [],
    effectiveDate: '',
    reviewDate: '',
    expiresAt: '',
    requiresAcknowledgement: true,
    gracePeriodDays: 7,
    changeSummary: '',
    fileUrl: '',
    fileName: '',
    fileType: 'pdf'
  };
};

export const PolicyFormModal = ({
  isOpen,
  onClose,
  initialPolicy = null,
  onSuccess
}) => {
  const isEditing = Boolean(initialPolicy?._id);

  const { data: rawCategoriesData } = useGetCategoriesQuery();
  const categories = useMemo(() => {
    const raw = rawCategoriesData?.data || (Array.isArray(rawCategoriesData) ? rawCategoriesData : []);
    return Array.isArray(raw) ? raw : [];
  }, [rawCategoriesData]);

  const { data: departmentsData } = useGetDepartmentsQuery();
  const departments = useMemo(() => {
    const raw = departmentsData?.data || (Array.isArray(departmentsData) ? departmentsData : []);
    return Array.isArray(raw) ? raw : [];
  }, [departmentsData]);

  const [createPolicy, { isLoading: isCreating }] = useCreatePolicyMutation();
  const [updatePolicy, { isLoading: isUpdating }] = useUpdatePolicyMutation();

  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'scope' | 'content' | 'compliance'
  const [errorMessage, setErrorMessage] = useState('');

  const [formData, setFormData] = useState(() => getInitialFormData(initialPolicy, categories));
  const prevPolicyRef = useRef(initialPolicy);

  useEffect(() => {
    if (prevPolicyRef.current !== initialPolicy) {
      prevPolicyRef.current = initialPolicy;
      setFormData(getInitialFormData(initialPolicy, categories));
      setActiveTab('general');
      setErrorMessage('');
    }
  }, [initialPolicy, categories]);

  if (!isOpen) return null;

  // Auto-generate a policy code if empty when category is selected
  const handleCategoryChange = (e) => {
    const catId = e.target.value;
    const selectedCat = categories.find((c) => c._id === catId);
    let newCode = formData.policyCode;
    if (!isEditing && (!formData.policyCode || formData.policyCode.startsWith('POL-'))) {
      const prefix = selectedCat?.code || 'GEN';
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      newCode = `POL-${prefix}-${randomSuffix}`;
    }
    setFormData((prev) => ({ ...prev, categoryId: catId, policyCode: newCode }));
  };

  const handleDepartmentToggle = (deptId) => {
    setFormData((prev) => {
      const exists = prev.departmentIds.includes(deptId);
      return {
        ...prev,
        departmentIds: exists
          ? prev.departmentIds.filter((id) => id !== deptId)
          : [...prev.departmentIds, deptId]
      };
    });
  };

  const handleRoleToggle = (role) => {
    setFormData((prev) => {
      const exists = prev.targetRoles.includes(role);
      return {
        ...prev,
        targetRoles: exists
          ? prev.targetRoles.filter((r) => r !== role)
          : [...prev.targetRoles, role]
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.title.trim()) {
      setErrorMessage('Policy Title is required.');
      setActiveTab('general');
      return;
    }

    if (!formData.policyCode.trim()) {
      setErrorMessage('Policy Code is required.');
      setActiveTab('general');
      return;
    }

    if (!formData.categoryId) {
      setErrorMessage('Please select a Category.');
      setActiveTab('general');
      return;
    }

    if (!formData.content.trim()) {
      setErrorMessage('Policy content is required.');
      setActiveTab('content');
      return;
    }

    const payload = {
      title: formData.title.trim(),
      policyCode: formData.policyCode.toUpperCase().trim(),
      categoryId: formData.categoryId,
      description: formData.description,
      content: formData.content,
      scope: formData.scope,
      applicableDepartmentIds: formData.scope === 'Department Specific' ? formData.departmentIds : [],
      applicableRoleNames: formData.scope === 'Role Specific' ? formData.targetRoles : [],
      requiresAcknowledgement: formData.requiresAcknowledgement,
      acknowledgementGracePeriodDays: formData.gracePeriodDays || 7,
      effectiveDate: formData.effectiveDate || undefined,
      reviewDate: formData.reviewDate || undefined,
      expiryDate: formData.expiresAt || undefined,
      changeSummary: formData.changeSummary || undefined,
      fileUrl: formData.fileUrl ? formData.fileUrl : undefined,
      fileType: formData.fileUrl ? (formData.fileType || 'pdf') : undefined
    };

    try {
      if (isEditing) {
        await updatePolicy({
          id: initialPolicy._id,
          ...payload
        }).unwrap();
      } else {
        await createPolicy(payload).unwrap();
      }
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setErrorMessage(err?.data?.message || err?.message || 'Failed to save policy.');
    }
  };

  const isLoading = isCreating || isUpdating;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-3xl bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-[#1A3125] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[#00C471]">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white leading-tight">
                {isEditing ? `Edit Policy (${initialPolicy?.policyCode})` : 'Author New Company Policy'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#7E9E8F]">
                Define guidelines, procedural rules, compliance mandates, and eligibility criteria
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-slate-100 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#0C1712]/50 overflow-x-auto text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`px-3 py-2 border-b-2 font-semibold transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'general'
                ? 'border-[#00C471] text-[#00C471]'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-[#7E9E8F]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>1. General & Code</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('scope')}
            className={`px-3 py-2 border-b-2 font-semibold transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'scope'
                ? 'border-[#00C471] text-[#00C471]'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-[#7E9E8F]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>2. Scope & Audience</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('content')}
            className={`px-3 py-2 border-b-2 font-semibold transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'content'
                ? 'border-[#00C471] text-[#00C471]'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-[#7E9E8F]'
            }`}
          >
            <Paperclip className="w-3.5 h-3.5" />
            <span>3. Policy Content</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('compliance')}
            className={`px-3 py-2 border-b-2 font-semibold transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'compliance'
                ? 'border-[#00C471] text-[#00C471]'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-[#7E9E8F]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>4. Dates & Compliance</span>
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="p-6 overflow-y-auto space-y-4 flex-1">
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* TAB 1: GENERAL */}
            {activeTab === 'general' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Policy Title *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Remote Work & Telecommuting Standards"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full h-9 px-3 rounded-lg bg-white dark:bg-[#0C1712] border border-slate-200 dark:border-[#1A3125] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#00C471]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Category *
                    </label>
                    <select
                      value={formData.categoryId}
                      onChange={handleCategoryChange}
                      className="w-full h-9 px-3 rounded-lg bg-white dark:bg-[#0C1712] border border-slate-200 dark:border-[#1A3125] text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#00C471]"
                    >
                      <option value="">Select a Category</option>
                      {categories.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name} ({c.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Policy Identifier Code *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. POL-HR-101"
                      value={formData.policyCode}
                      onChange={(e) =>
                        setFormData({ ...formData, policyCode: e.target.value.toUpperCase() })
                      }
                      className="w-full h-9 px-3 rounded-lg bg-white dark:bg-[#0C1712] border border-slate-200 dark:border-[#1A3125] text-xs font-mono uppercase text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#00C471]"
                    />
                  </div>

                  {isEditing && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Revision Reason / Change Summary
                      </label>
                      <input
                        type="text"
                        placeholder="What changed in this revision?"
                        value={formData.changeSummary}
                        onChange={(e) =>
                          setFormData({ ...formData, changeSummary: e.target.value })
                        }
                        className="w-full h-9 px-3 rounded-lg bg-white dark:bg-[#0C1712] border border-slate-200 dark:border-[#1A3125] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#00C471]"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Executive Summary / Description
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Provide a clear, brief high-level overview of this policy..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full p-3 rounded-lg bg-white dark:bg-[#0C1712] border border-slate-200 dark:border-[#1A3125] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#00C471]"
                  />
                </div>
              </div>
            )}

            {/* TAB 2: SCOPE */}
            {activeTab === 'scope' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Policy Scope & Target Workforce
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {['All Employees', 'Department Specific', 'Role Specific', 'Management Only'].map(
                      (scopeOption) => (
                        <button
                          key={scopeOption}
                          type="button"
                          onClick={() => setFormData({ ...formData, scope: scopeOption })}
                          className={`p-3 rounded-xl border text-xs font-semibold transition text-center cursor-pointer ${
                            formData.scope === scopeOption
                              ? 'border-[#00C471] bg-emerald-500/10 text-[#00C471]'
                              : 'border-slate-200 dark:border-[#1A3125] text-slate-600 dark:text-slate-400 hover:border-slate-300'
                          }`}
                        >
                          {scopeOption}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {formData.scope === 'Department Specific' && (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0C1712] border border-slate-200 dark:border-[#1A3125]">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Select Target Departments ({formData.departmentIds.length} selected)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                      {departments.map((dept) => {
                        const checked = formData.departmentIds.includes(dept._id);
                        return (
                          <div
                            key={dept._id}
                            onClick={() => handleDepartmentToggle(dept._id)}
                            className={`p-2 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition ${
                              checked
                                ? 'border-[#00C471] bg-emerald-500/10 text-emerald-600 dark:text-[#00C471]'
                                : 'border-slate-200 dark:border-[#1A3125] text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <span className="truncate">{dept.name}</span>
                            {checked && <Check className="w-3.5 h-3.5 text-[#00C471] shrink-0" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {formData.scope === 'Role Specific' && (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0C1712] border border-slate-200 dark:border-[#1A3125]">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Select Target Roles ({formData.targetRoles.length} selected)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {SYSTEM_ROLES.map((role) => {
                        const checked = formData.targetRoles.includes(role);
                        return (
                          <div
                            key={role}
                            onClick={() => handleRoleToggle(role)}
                            className={`p-2 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition ${
                              checked
                                ? 'border-[#00C471] bg-emerald-500/10 text-emerald-600 dark:text-[#00C471]'
                                : 'border-slate-200 dark:border-[#1A3125] text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <span>{role}</span>
                            {checked && <Check className="w-3.5 h-3.5 text-[#00C471] shrink-0" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: CONTENT */}
            {activeTab === 'content' && (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Policy Document Body (Markdown supported) *
                    </label>
                    <span className="text-[11px] text-slate-400">
                      {formData.content.length} characters
                    </span>
                  </div>
                  <textarea
                    rows={12}
                    required
                    placeholder="## 1. Objective and Scope&#10;Describe the principal purpose...&#10;&#10;## 2. General Principles&#10;List company standards and regulatory guidelines...&#10;&#10;## 3. Violations and Disciplinary Measures&#10;Detail procedures for non-compliance..."
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="w-full p-3 font-mono text-xs rounded-lg bg-white dark:bg-[#0C1712] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#00C471] leading-relaxed"
                  />
                </div>

                {/* Optional Attached PDF or Document */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0C1712] border border-slate-200 dark:border-[#1A3125] space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-[#00C471]" />
                    <span>Optional Document Attachment</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Attachment URL (PDF/DOCX)
                      </label>
                      <input
                        type="url"
                        placeholder="https://company.storage/policies/doc.pdf"
                        value={formData.fileUrl}
                        onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                        className="w-full h-9 px-3 rounded-lg bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#00C471]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        File Display Label
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Employee_Handbook_2026.pdf"
                        value={formData.fileName}
                        onChange={(e) => setFormData({ ...formData, fileName: e.target.value })}
                        className="w-full h-9 px-3 rounded-lg bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#00C471]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: COMPLIANCE & SCHEDULE */}
            {activeTab === 'compliance' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Effective Date</span>
                    </label>
                    <input
                      type="date"
                      value={formData.effectiveDate}
                      onChange={(e) =>
                        setFormData({ ...formData, effectiveDate: e.target.value })
                      }
                      className="w-full h-9 px-3 rounded-lg bg-white dark:bg-[#0C1712] border border-slate-200 dark:border-[#1A3125] text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#00C471]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-blue-500" />
                      <span>Next Review Date</span>
                    </label>
                    <input
                      type="date"
                      value={formData.reviewDate}
                      onChange={(e) => setFormData({ ...formData, reviewDate: e.target.value })}
                      className="w-full h-9 px-3 rounded-lg bg-white dark:bg-[#0C1712] border border-slate-200 dark:border-[#1A3125] text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#00C471]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Expiry Date (Optional)</span>
                    </label>
                    <input
                      type="date"
                      value={formData.expiresAt}
                      onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                      className="w-full h-9 px-3 rounded-lg bg-white dark:bg-[#0C1712] border border-slate-200 dark:border-[#1A3125] text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#00C471]"
                    />
                  </div>
                </div>

                {/* Mandate Acknowledgement Toggle */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0C1712] border border-slate-200 dark:border-[#1A3125] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-[#00C471]" />
                        <span>Require Employee Digital Acknowledgement</span>
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-[#7E9E8F] mt-0.5">
                        Mandates all targeted employees to digitally review and sign off on this policy
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.requiresAcknowledgement}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            requiresAcknowledgement: e.target.checked
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-[#00C471]" />
                    </label>
                  </div>

                  {formData.requiresAcknowledgement && (
                    <div className="pt-2 border-t border-slate-200 dark:border-[#1A3125]">
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Sign-off Grace Period (Days)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={90}
                        value={formData.gracePeriodDays}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            gracePeriodDays: parseInt(e.target.value, 10) || 7
                          })
                        }
                        className="w-32 h-9 px-3 rounded-lg bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#00C471]"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-3 border-t border-slate-100 dark:border-[#1A3125] flex items-center justify-between bg-slate-50/50 dark:bg-[#0C1712]/50">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 rounded-lg border border-slate-200 dark:border-[#1A3125] text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#162820] transition cursor-pointer"
            >
              Cancel
            </button>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={isLoading}
                className="h-9 px-5 rounded-lg bg-[#00C471] hover:bg-emerald-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer shadow-xs"
              >
                <Check className="w-4 h-4" />
                <span>{isEditing ? 'Save Changes' : 'Save as Draft'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PolicyFormModal;

/**
 * @file ChecklistTemplatesPage.jsx
 * @description Master Template Management for Onboarding and Offboarding Lifecycle Workflows.
 * 
 * SPECIFICATION:
 * - Module: M18 Onboarding & Offboarding (BUILD-GUIDE Section 21 · Row 18.1)
 * - Permissions: Guarded by 'onboard.view' and 'onboard.manage'
 * - Design System: Forest & Emerald (#111D17 dark surface, #1A3125 dark border, #00C471 emerald accent).
 */

import React, { useState } from 'react';
import {
  ListChecks,
  Plus,
  Search,
  Building2,
  CheckCircle2,
  Edit2,
  Trash2,
  ShieldCheck,
  Eye,
  Layers,
  Sparkles
} from 'lucide-react';
import {
  useGetChecklistTemplatesQuery,
  useDeleteChecklistTemplateMutation
} from '../onboardingApi.js';
import { useGetDepartmentsQuery } from '../../departments/departmentsApi.js';
import { ChecklistTemplateModal } from '../components/ChecklistTemplateModal.jsx';
import { ChecklistTemplateDetailModal } from '../components/ChecklistTemplateDetailModal.jsx';
import { Can } from '../../../components/common/Can.jsx';
import { ScreenSkeleton } from '../../../components/common/ScreenSkeleton.jsx';
import { RefreshButton } from '../../../components/common/RefreshButton.jsx';
import { toast } from 'sonner';

export const ChecklistTemplatesPage = () => {
  const [activeTab, setActiveTab] = useState('onboarding');
  const [selectedDept, setSelectedDept] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const { data: templatesRes, isLoading, isFetching, refetch } = useGetChecklistTemplatesQuery({
    type: activeTab,
    departmentId: selectedDept || undefined
  });
  const templates = templatesRes?.data || [];

  const { data: deptData } = useGetDepartmentsQuery();
  const departments = deptData?.data || [];

  const [deleteTemplate] = useDeleteChecklistTemplateMutation();

  if (isLoading && !templatesRes) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <ScreenSkeleton variant="cards" />
      </div>
    );
  }

  const filteredTemplates = templates.filter((tpl) => {
    if (searchQuery.trim()) {
      return tpl.name.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  const totalTemplates = templates.length;
  const activeCount = templates.filter((t) => t.isActive).length;
  const onboardingCount = templates.filter((t) => t.type === 'onboarding').length;
  const offboardingCount = templates.filter((t) => t.type === 'offboarding').length;

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete template "${name}"? Active employee checklists remain preserved.`)) {
      try {
        await deleteTemplate(id).unwrap();
        toast.success('Checklist template deleted');
      } catch (err) {
        toast.error(err?.data?.message || 'Failed to delete template');
      }
    }
  };

  const handleEdit = (tpl) => {
    setSelectedTemplate(tpl);
    setIsModalOpen(true);
  };

  const handleView = (tpl) => {
    setSelectedTemplate(tpl);
    setIsDetailOpen(true);
  };

  const handleCreate = () => {
    setSelectedTemplate(null);
    setIsModalOpen(true);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-[#162820] text-emerald-700 dark:text-[#00C471] flex items-center justify-center border border-emerald-200 dark:border-emerald-900/60 shadow-xs">
            <ListChecks className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Checklist Templates
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Standardize role-based onboarding and offboarding task workflows across departments.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <RefreshButton onRefresh={refetch} isFetching={isFetching} />
          <Can perform="onboard.manage">
            <button
              onClick={handleCreate}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              New Template
            </button>
          </Can>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total In View
            </span>
            <Layers className="w-4 h-4 text-emerald-600 dark:text-[#00C471]" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1.5 font-mono">
            {totalTemplates}
          </p>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Onboarding Rubrics
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-[#00C471]" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1.5 font-mono">
            {onboardingCount}
          </p>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Offboarding Rubrics
            </span>
            <ShieldCheck className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1.5 font-mono">
            {offboardingCount}
          </p>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Active Templates
            </span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1.5 font-mono">
            {activeCount}
          </p>
        </div>
      </div>

      {/* Tabs & Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-[#1A3125] pb-4">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-[#162820]/60 border border-slate-200 dark:border-[#1A3125]">
          <button
            onClick={() => setActiveTab('onboarding')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
              activeTab === 'onboarding'
                ? 'bg-white dark:bg-[#111D17] text-emerald-700 dark:text-[#00C471] shadow-xs border border-slate-200/60 dark:border-[#1A3125]'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Onboarding Workflows
          </button>
          <button
            onClick={() => setActiveTab('offboarding')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
              activeTab === 'offboarding'
                ? 'bg-white dark:bg-[#111D17] text-emerald-700 dark:text-[#00C471] shadow-xs border border-slate-200/60 dark:border-[#1A3125]'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Offboarding Workflows
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d._id} value={d._id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Template Cards Grid */}
      {isLoading ? (
        <div className="py-12 text-center text-xs text-slate-400">Loading checklist templates...</div>
      ) : filteredTemplates.length === 0 ? (
        <div className="py-16 text-center rounded-2xl border border-dashed border-slate-200 dark:border-[#1A3125] bg-white/50 dark:bg-[#111D17]/50">
          <ListChecks className="w-12 h-12 mx-auto text-slate-400 mb-3" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            No templates configured
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-4">
            Create standard {activeTab} task lists with assigned role owners and target due dates.
          </p>
          <Can perform="onboard.manage">
            <button
              onClick={handleCreate}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Create First Template
            </button>
          </Can>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((tpl) => (
            <div
              key={tpl._id}
              className="rounded-2xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] p-5 shadow-xs hover:border-emerald-300 dark:hover:border-emerald-800/80 transition flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                      tpl.isActive
                        ? 'bg-emerald-50 dark:bg-[#162820] text-emerald-700 dark:text-[#00C471] border-emerald-200 dark:border-emerald-900/60'
                        : 'bg-slate-100 dark:bg-[#162820] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-[#1A3125]'
                    }`}
                  >
                    {tpl.isActive ? 'Active' : 'Archived'}
                  </span>
                  <span className="text-[11px] font-semibold font-mono text-slate-500 dark:text-slate-400">
                    {tpl.tasks?.length || 0} tasks
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-[#00C471] transition">
                  {tpl.name}
                </h3>

                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  {tpl.departmentId?.name || 'Company-Wide (All Departments)'}
                </p>

                {/* Tasks preview */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#1A3125] space-y-1.5">
                  {tpl.tasks?.slice(0, 3).map((t, idx) => (
                    <div
                      key={idx}
                      className="text-xs flex items-center justify-between gap-2 text-slate-600 dark:text-slate-300"
                    >
                      <span className="truncate flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-[#00C471] shrink-0" />
                        <span className="truncate">{t.title}</span>
                      </span>
                      <span className="text-[10px] text-slate-400 uppercase font-mono shrink-0">
                        +{t.dueDaysOffset || 0}d
                      </span>
                    </div>
                  ))}
                  {tpl.tasks?.length > 3 && (
                    <p className="text-[10px] text-slate-400 italic">
                      +{tpl.tasks.length - 3} more items in rubric...
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-[#1A3125] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleView(tpl)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-emerald-600 dark:text-[#00C471]" />
                  View Rubric
                </button>

                <div className="flex items-center gap-1">
                  <Can perform="onboard.manage">
                    <button
                      onClick={() => handleEdit(tpl)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#162820] transition cursor-pointer"
                      title="Edit Template"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(tpl._id, tpl.name)}
                      className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                      title="Delete Template"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </Can>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Authoring & Editing Modal */}
      {isModalOpen && (
        <ChecklistTemplateModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedTemplate(null);
          }}
          template={selectedTemplate}
        />
      )}

      {/* Read-Only Rubric Inspection Modal */}
      {isDetailOpen && (
        <ChecklistTemplateDetailModal
          isOpen={isDetailOpen}
          onClose={() => {
            setIsDetailOpen(false);
            setSelectedTemplate(null);
          }}
          template={selectedTemplate}
          onEdit={(tpl) => handleEdit(tpl)}
        />
      )}
    </div>
  );
};

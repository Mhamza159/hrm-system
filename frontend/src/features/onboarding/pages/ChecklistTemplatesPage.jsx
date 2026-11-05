/**
 * @file ChecklistTemplatesPage.jsx
 * @description Master Template Management for Onboarding and Offboarding Lifecycle Workflows.
 * 
 * SPECIFICATION:
 * - Module: M18 Onboarding & Offboarding (BUILD-GUIDE Section 21 · Row 18.1)
 * - Permissions: Guarded by 'onboard.view' and 'onboard.manage'
 */

import React, { useState } from 'react';
import {
  ListChecks,
  Plus,
  Search,
  Filter,
  Building2,
  CheckCircle2,
  Edit2,
  Trash2,
  ArrowRight,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import {
  useGetChecklistTemplatesQuery,
  useDeleteChecklistTemplateMutation
} from '../onboardingApi.js';
import { useGetDepartmentsQuery } from '../../departments/departmentsApi.js';
import { ChecklistTemplateModal } from '../components/ChecklistTemplateModal.jsx';
import { Can } from '../../../components/common/Can.jsx';
import { ScreenSkeleton } from '../../../components/common/ScreenSkeleton.jsx';
import { RefreshButton } from '../../../components/common/RefreshButton.jsx';
import { toast } from 'sonner';

export const ChecklistTemplatesPage = () => {
  const [activeTab, setActiveTab] = useState('onboarding');
  const [selectedDept, setSelectedDept] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);

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

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete template "${name}"?`)) {
      try {
        await deleteTemplate(id).unwrap();
        toast.success('Checklist template deleted');
      } catch (err) {
        toast.error(err?.data?.message || 'Failed to delete template');
      }
    }
  };

  const handleEdit = (tpl) => {
    setEditingTemplate(tpl);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingTemplate(null);
    setIsModalOpen(true);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-lg">
              <ListChecks className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Checklist Templates
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Author and standardize role-based onboarding and offboarding task workflows.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <RefreshButton onRefresh={refetch} isFetching={isFetching} />
          <Can perform="onboard.manage">
            <button
              onClick={handleCreate}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              New Template
            </button>
          </Can>
        </div>
      </div>

      {/* Lifecycle Selector Tabs & Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-4">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('onboarding')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
              activeTab === 'onboarding'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            Onboarding ({templates.filter((t) => t.type === 'onboarding').length || (activeTab === 'onboarding' ? templates.length : 0)})
          </button>
          <button
            onClick={() => setActiveTab('offboarding')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
              activeTab === 'offboarding'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            Offboarding ({templates.filter((t) => t.type === 'offboarding').length || (activeTab === 'offboarding' ? templates.length : 0)})
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates..."
              className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
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
        <div className="py-12 text-center text-sm text-gray-500">Loading checklist templates...</div>
      ) : filteredTemplates.length === 0 ? (
        <div className="py-16 text-center rounded-xl border border-dashed border-gray-300 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
          <ListChecks className="w-12 h-12 mx-auto text-gray-400 mb-3" />
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            No templates configured
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto mt-1 mb-4">
            Create standard {activeTab} task lists with assigned role owners and target due dates.
          </p>
          <Can perform="onboard.manage">
            <button
              onClick={handleCreate}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition"
            >
              <Plus className="w-4 h-4" />
              Create First Template
            </button>
          </Can>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTemplates.map((tpl) => (
            <div
              key={tpl._id}
              className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span
                    className={`text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                      tpl.type === 'onboarding'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                    }`}
                  >
                    {tpl.type}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {tpl.isActive ? (
                      <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Active
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-gray-400">Inactive</span>
                    )}
                  </div>
                </div>

                <h3 className="text-base font-bold text-gray-900 dark:text-white line-clamp-1">
                  {tpl.name}
                </h3>

                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" />
                  {tpl.departmentId ? tpl.departmentId.name : 'Company-wide (All Departments)'}
                </p>

                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 space-y-2">
                  <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Total Workflow Steps</span>
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                      {tpl.tasks?.length || 0} tasks
                    </span>
                  </div>

                  {/* Preview first 3 tasks */}
                  <div className="space-y-1">
                    {tpl.tasks?.slice(0, 3).map((task, i) => (
                      <div
                        key={i}
                        className="text-xs text-gray-600 dark:text-gray-300 flex items-center gap-1.5 truncate"
                      >
                        <CheckCircle2 className="w-3 h-3 text-indigo-400 shrink-0" />
                        <span className="truncate">{task.title}</span>
                      </div>
                    ))}
                    {tpl.tasks?.length > 3 && (
                      <p className="text-[11px] text-gray-400 italic">
                        +{tpl.tasks.length - 3} more tasks...
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="mt-5 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-2">
                <Can perform="onboard.manage">
                  <button
                    onClick={() => handleEdit(tpl)}
                    className="p-1.5 text-gray-500 hover:text-indigo-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                    title="Edit Template"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(tpl._id, tpl.name)}
                    className="p-1.5 text-gray-500 hover:text-red-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                    title="Delete Template"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </Can>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Authoring Modal */}
      <ChecklistTemplateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        template={editingTemplate}
      />
    </div>
  );
};


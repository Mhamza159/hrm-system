/**
 * @file ChecklistTemplateModal.jsx
 * @description Modal for authoring and editing Onboarding & Offboarding checklist templates and task lists.
 * 
 * SPECIFICATION:
 * - Module: M18 Onboarding & Offboarding (BUILD-GUIDE Section 21 · Row 18.1)
 * - Design System: Forest & Emerald (#111D17 dark surface, #1A3125 dark border, #00C471 emerald accent).
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  CheckCircle2,
  ListChecks,
  Info
} from 'lucide-react';
import {
  useCreateChecklistTemplateMutation,
  useUpdateChecklistTemplateMutation
} from '../onboardingApi.js';
import { useGetDepartmentsQuery } from '../../departments/departmentsApi.js';
import { toast } from 'sonner';

export const ChecklistTemplateModal = ({ isOpen, onClose, template }) => {
  const [createTemplate, { isLoading: isCreating }] = useCreateChecklistTemplateMutation();
  const [updateTemplate, { isLoading: isUpdating }] = useUpdateChecklistTemplateMutation();
  const { data: deptData } = useGetDepartmentsQuery();
  const departments = deptData?.data || [];

  const [formData, setFormData] = useState({
    name: '',
    type: 'onboarding',
    departmentId: '',
    isActive: true,
    tasks: []
  });

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name || '',
        type: template.type || 'onboarding',
        departmentId: template.departmentId?._id || template.departmentId || '',
        isActive: template.isActive ?? true,
        tasks: template.tasks?.map((t) => ({
          title: t.title || '',
          description: t.description || '',
          category: t.category || 'hr',
          roleAssignee: t.roleAssignee || 'employee',
          dueDaysOffset: t.dueDaysOffset ?? 0,
          isMandatory: t.isMandatory ?? true
        })) || []
      });
    } else {
      setFormData({
        name: '',
        type: 'onboarding',
        departmentId: '',
        isActive: true,
        tasks: [
          {
            title: 'Complete Employee Profile & Emergency Contacts',
            description: 'Fill in all personal details, bank info, and emergency contacts.',
            category: 'hr',
            roleAssignee: 'employee',
            dueDaysOffset: 1,
            isMandatory: true
          },
          {
            title: 'Provision Workstation & System Credentials',
            description: 'Setup laptop, corporate email, VPN, and dev tools access.',
            category: 'it',
            roleAssignee: 'it_admin',
            dueDaysOffset: 0,
            isMandatory: true
          },
          {
            title: 'Team Introduction & Project Orientation',
            description: 'Introduce to team members and walk through active sprint backlogs.',
            category: 'department',
            roleAssignee: 'manager',
            dueDaysOffset: 2,
            isMandatory: true
          }
        ]
      });
    }
  }, [template, isOpen]);

  if (!isOpen) return null;

  const handleAddTask = () => {
    setFormData((prev) => ({
      ...prev,
      tasks: [
        ...prev.tasks,
        {
          title: '',
          description: '',
          category: 'hr',
          roleAssignee: 'employee',
          dueDaysOffset: 0,
          isMandatory: true
        }
      ]
    }));
  };

  const handleRemoveTask = (index) => {
    setFormData((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((_, i) => i !== index)
    }));
  };

  const handleTaskChange = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.tasks];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, tasks: updated };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Please provide a template name');
      return;
    }
    if (formData.tasks.length === 0) {
      toast.error('Template must have at least one task item');
      return;
    }
    for (const [idx, t] of formData.tasks.entries()) {
      if (!t.title.trim()) {
        toast.error(`Task #${idx + 1} requires a title`);
        return;
      }
    }

    try {
      const payload = {
        name: formData.name.trim(),
        type: formData.type,
        departmentId: formData.departmentId ? formData.departmentId : null,
        isActive: formData.isActive,
        tasks: formData.tasks.map((t) => ({
          ...t,
          dueDaysOffset: Number(t.dueDaysOffset) || 0
        }))
      };

      if (template) {
        await updateTemplate({ id: template._id, ...payload }).unwrap();
        toast.success('Checklist template updated successfully');
      } else {
        await createTemplate(payload).unwrap();
        toast.success('Checklist template created successfully');
      }
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to save checklist template');
    }
  };

  const isSaving = isCreating || isUpdating;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/15 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#111D17] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#1A3125] w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-[#1A3125] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-[#162820] text-emerald-700 dark:text-[#00C471] flex items-center justify-center border border-emerald-200 dark:border-emerald-900/60">
              <ListChecks className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {template ? 'Edit Checklist Template' : 'New Checklist Template'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Define master lifecycle task requirements, departmental owners, and completion offsets.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#162820] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* Safe Modification Callout Banner */}
          <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-[#162820]/40 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-emerald-700 dark:text-[#00C471] shrink-0 mt-0.5" />
            <div className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
              <strong className="font-semibold text-slate-800 dark:text-slate-100">Immutable Instance Isolation:</strong> Changes made here only govern future instantiated checklists. Currently active employee onboarding and offboarding records remain protected and unchanged.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Template Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Engineering Onboarding Standard"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Workflow Lifecycle *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="onboarding">Onboarding Workflow</option>
                <option value="offboarding">Offboarding / Exit Clearance</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Department Scope
              </label>
              <select
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="">Company-Wide (All Departments)</option>
                {departments.map((dept) => (
                  <option key={dept._id} value={dept._id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 text-emerald-600 rounded border-slate-300 dark:border-[#1A3125] focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
            />
            <label htmlFor="isActive" className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
              Active template (available for automatic new-hire clone or manual assignment)
            </label>
          </div>

          {/* Tasks Section */}
          <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-[#1A3125]">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#00C471]" />
                  Task Checklist Items ({formData.tasks.length})
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Configure tasks, default owners, and expected completion deadlines relative to start date.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddTask}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 dark:bg-[#162820] text-emerald-700 dark:text-[#00C471] hover:bg-emerald-100 dark:hover:bg-[#1A3125] border border-emerald-200 dark:border-emerald-900/60 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Task
              </button>
            </div>

            <div className="space-y-3">
              {formData.tasks.map((task, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50/60 dark:bg-[#162820]/30 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                      Task #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTask(idx)}
                      className="text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 p-1 rounded-md transition cursor-pointer"
                      title="Remove Task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                        Task Title *
                      </label>
                      <input
                        type="text"
                        required
                        value={task.title}
                        onChange={(e) => handleTaskChange(idx, 'title', e.target.value)}
                        placeholder="e.g. Set up Corporate Email & Slack"
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                        Task Description / Instructions
                      </label>
                      <input
                        type="text"
                        value={task.description}
                        onChange={(e) => handleTaskChange(idx, 'description', e.target.value)}
                        placeholder="Specific guidelines for assignee..."
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                        Category
                      </label>
                      <select
                        value={task.category}
                        onChange={(e) => handleTaskChange(idx, 'category', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      >
                        <option value="hr">HR</option>
                        <option value="it">IT</option>
                        <option value="department">Department</option>
                        <option value="finance">Finance</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                        Role Assignee
                      </label>
                      <select
                        value={task.roleAssignee}
                        onChange={(e) => handleTaskChange(idx, 'roleAssignee', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      >
                        <option value="employee">Employee</option>
                        <option value="manager">Manager</option>
                        <option value="it_admin">IT Admin</option>
                        <option value="hr">HR</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                        Due Offset (Days)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="90"
                        value={task.dueDaysOffset}
                        onChange={(e) => handleTaskChange(idx, 'dueDaysOffset', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-4">
                      <input
                        type="checkbox"
                        id={`task-mandatory-${idx}`}
                        checked={task.isMandatory}
                        onChange={(e) => handleTaskChange(idx, 'isMandatory', e.target.checked)}
                        className="w-4 h-4 text-emerald-600 rounded border-slate-300 dark:border-[#1A3125] focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
                      />
                      <label
                        htmlFor={`task-mandatory-${idx}`}
                        className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
                      >
                        Mandatory
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-4 border-t border-slate-200 dark:border-[#1A3125] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#162820] text-xs font-semibold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isSaving ? 'Saving Template...' : template ? 'Save Changes' : 'Create Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/**
 * @file ChecklistTemplateModal.jsx
 * @description Modal for authoring and editing Onboarding & Offboarding checklist templates and task lists.
 * 
 * SPECIFICATION:
 * - Module: M18 Onboarding & Offboarding (BUILD-GUIDE Section 21 · Row 18.1)
 */

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, CheckCircle2, ListChecks, Calendar, UserCheck } from 'lucide-react';
import { useCreateChecklistTemplateMutation, useUpdateChecklistTemplateMutation } from '../onboardingApi.js';
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ListChecks className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {template ? 'Edit Checklist Template' : 'New Checklist Template'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                Template Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Engineering Onboarding Standard"
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                Workflow Lifecycle *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              >
                <option value="onboarding">Onboarding</option>
                <option value="offboarding">Offboarding</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                Department Filter
              </label>
              <select
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
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

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 text-indigo-600 rounded border-gray-300 dark:border-gray-700"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Active template (available for automatic or manual instantiation)
            </label>
          </div>

          {/* Tasks Section */}
          <div className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                  Task Checklist Items ({formData.tasks.length})
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Configure tasks, default owners, and expected completion deadlines relative to start date.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddTask}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Task
              </button>
            </div>

            <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1">
              {formData.tasks.map((task, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-lg border border-gray-200 dark:border-gray-700/80 bg-gray-50/70 dark:bg-gray-800/40 space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-gray-400 dark:text-gray-500">
                      #{idx + 1}
                    </span>
                    <input
                      type="text"
                      required
                      value={task.title}
                      onChange={(e) => handleTaskChange(idx, 'title', e.target.value)}
                      placeholder="Task Title (e.g. Sign NDA & Employee Handbook)"
                      className="flex-1 px-3 py-1.5 text-xs rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-1 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveTask(idx)}
                      disabled={formData.tasks.length <= 1}
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded disabled:opacity-30 transition"
                      title="Remove task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <div>
                      <label className="text-[10px] uppercase font-semibold text-gray-500">Category</label>
                      <select
                        value={task.category}
                        onChange={(e) => handleTaskChange(idx, 'category', e.target.value)}
                        className="w-full px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                      >
                        <option value="hr">HR</option>
                        <option value="it">IT Operations</option>
                        <option value="department">Department</option>
                        <option value="finance">Finance</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-semibold text-gray-500">Assignee Role</label>
                      <select
                        value={task.roleAssignee}
                        onChange={(e) => handleTaskChange(idx, 'roleAssignee', e.target.value)}
                        className="w-full px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                      >
                        <option value="employee">Employee (Self)</option>
                        <option value="manager">Dept Manager</option>
                        <option value="hr">HR Specialist</option>
                        <option value="it_admin">IT Admin</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-semibold text-gray-500">Days Offset</label>
                      <input
                        type="number"
                        value={task.dueDaysOffset}
                        onChange={(e) => handleTaskChange(idx, 'dueDaysOffset', e.target.value)}
                        placeholder="0 = Day 1"
                        className="w-full px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                      />
                    </div>

                    <div className="flex items-center pt-4 space-x-1.5">
                      <input
                        type="checkbox"
                        id={`mandatory-${idx}`}
                        checked={task.isMandatory}
                        onChange={(e) => handleTaskChange(idx, 'isMandatory', e.target.checked)}
                        className="w-3.5 h-3.5 text-indigo-600 rounded border-gray-300"
                      />
                      <label htmlFor={`mandatory-${idx}`} className="text-xs text-gray-700 dark:text-gray-300">
                        Mandatory
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-800 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating || isUpdating}
              className="px-5 py-2 text-sm font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm disabled:opacity-50 transition"
            >
              {isCreating || isUpdating ? 'Saving...' : template ? 'Save Changes' : 'Create Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

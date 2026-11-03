/**
 * @file ProjectModal.jsx
 * @description Modal for authoring and updating project charters, budgets, and managers.
 * 
 * SPECIFICATION:
 * - Module: M22 Projects & Timesheets (BUILD-GUIDE Section 23 · Row 22.1)
 */

import React, { useState, useEffect } from 'react';
import { X, Briefcase, Hash, Calendar, DollarSign, Building2, User, Loader2 } from 'lucide-react';
import { useCreateProjectMutation, useUpdateProjectMutation, useGetClientsQuery } from '../projectsApi.js';
import { useGetDepartmentsQuery } from '../../departments/departmentsApi.js';
import { useGetUsersQuery } from '../../auth/authApi.js';
import { toast } from 'sonner';

export const ProjectModal = ({ isOpen, onClose, project = null }) => {
  const [createProject, { isLoading: isCreating }] = useCreateProjectMutation();
  const [updateProject, { isLoading: isUpdating }] = useUpdateProjectMutation();
  const isLoading = isCreating || isUpdating;

  const { data: clientsRes } = useGetClientsQuery({ limit: 100 });
  const { data: departmentsRes } = useGetDepartmentsQuery({ limit: 100 });
  const { data: usersRes } = useGetUsersQuery({ limit: 100 });

  const clients = clientsRes?.data || [];
  const departments = departmentsRes?.data || [];
  const users = usersRes?.data || [];

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    clientId: '',
    departmentId: '',
    managerId: '',
    billingType: 'hourly',
    hourlyBillingRateRupees: '',
    budgetRupees: '',
    status: 'active',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || '',
        code: project.code || '',
        description: project.description || '',
        clientId: project.clientId?._id || project.clientId || '',
        departmentId: project.departmentId?._id || project.departmentId || '',
        managerId: project.managerId?._id || project.managerId || '',
        billingType: project.billingType || 'hourly',
        hourlyBillingRateRupees: project.hourlyBillingRatePaisa ? (project.hourlyBillingRatePaisa / 100).toString() : '',
        budgetRupees: project.budgetPaisa ? (project.budgetPaisa / 100).toString() : '',
        status: project.status || 'active',
        startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '',
        endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : ''
      });
    } else {
      setFormData({
        name: '',
        code: '',
        description: '',
        clientId: clients[0]?._id || '',
        departmentId: departments[0]?._id || '',
        managerId: users[0]?._id || '',
        billingType: 'hourly',
        hourlyBillingRateRupees: '2500',
        budgetRupees: '500000',
        status: 'active',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
    }
  }, [project, isOpen, clients.length, departments.length, users.length]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.code.trim() || !formData.clientId || !formData.departmentId || !formData.managerId) {
      toast.error('Please fill in all required fields (Name, Code, Client, Department, Manager)');
      return;
    }

    const payload = {
      name: formData.name.trim(),
      code: formData.code.trim().toUpperCase(),
      description: formData.description.trim(),
      clientId: formData.clientId,
      departmentId: formData.departmentId,
      managerId: formData.managerId,
      billingType: formData.billingType,
      hourlyBillingRatePaisa: Math.round(Number(formData.hourlyBillingRateRupees || 0) * 100),
      budgetPaisa: Math.round(Number(formData.budgetRupees || 0) * 100),
      status: formData.status,
      startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
      endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null
    };

    try {
      if (project) {
        await updateProject({ id: project._id, ...payload }).unwrap();
        toast.success(`Project "${payload.name}" updated successfully`);
      } else {
        await createProject(payload).unwrap();
        toast.success(`Project "${payload.name}" created successfully`);
      }
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to save project charter');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl rounded-xl bg-card border border-border shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {project ? 'Edit Project Charter' : 'Create New Project'}
              </h2>
              <p className="text-xs text-muted-foreground">
                {project ? 'Update project deliverables, budget, and assignments' : 'Initialize a new software/client project'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Project Name <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. ERP Cloud Transformation"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Project Code <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  required
                  disabled={Boolean(project)}
                  placeholder="e.g. PRJ-ERP"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-input bg-background uppercase focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition disabled:opacity-60"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">
              Description
            </label>
            <textarea
              rows={2}
              placeholder="Brief summary of project objectives and scope..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Client <span className="text-destructive">*</span>
              </label>
              <select
                required
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
              >
                <option value="">Select Client</option>
                {clients.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.companyName} ({c.currency || 'PKR'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Department <span className="text-destructive">*</span>
              </label>
              <select
                required
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
              >
                <option value="">Select Department</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Project Manager <span className="text-destructive">*</span>
              </label>
              <select
                required
                value={formData.managerId}
                onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
              >
                <option value="">Select Manager</option>
                {users.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Billing Model
              </label>
              <select
                value={formData.billingType}
                onChange={(e) => setFormData({ ...formData, billingType: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
              >
                <option value="hourly">Hourly Rate</option>
                <option value="fixed">Fixed Price</option>
                <option value="non_billable">Internal / Non-Billable</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Billing Rate (PKR / hr)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="number"
                  min="0"
                  step="50"
                  disabled={formData.billingType === 'non_billable'}
                  placeholder="2500"
                  value={formData.hourlyBillingRateRupees}
                  onChange={(e) => setFormData({ ...formData, hourlyBillingRateRupees: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Budget (PKR)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="number"
                  min="0"
                  step="5000"
                  placeholder="500000"
                  value={formData.budgetRupees}
                  onChange={(e) => setFormData({ ...formData, budgetRupees: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
              >
                <option value="active">Active</option>
                <option value="on_hold">On Hold</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Start Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                End Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-input bg-background text-foreground hover:bg-muted transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {project ? 'Update Project' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


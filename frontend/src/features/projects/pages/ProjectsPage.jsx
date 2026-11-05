/**
 * @file ProjectsPage.jsx
 * @description Main Projects & Clients portfolio management page.
 * 
 * SPECIFICATION:
 * - Module: M22 Projects & Timesheets (BUILD-GUIDE Section 23 · Rows 22.1, 22.2)
 * - Layer: Feature Page Component
 */

import React, { useState } from 'react';
import {
  Briefcase,
  Building2,
  Plus,
  Search,
  Filter,
  Users,
  Calendar,
  DollarSign,
  Edit,
  Trash2,
  UserPlus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FolderKanban
} from 'lucide-react';
import {
  useGetProjectsQuery,
  useGetClientsQuery,
  useDeleteProjectMutation,
  useDeleteClientMutation
} from '../projectsApi.js';
import { ProjectModal } from '../components/ProjectModal.jsx';
import { ClientModal } from '../components/ClientModal.jsx';
import { ProjectMembersModal } from '../components/ProjectMembersModal.jsx';
import { Can } from '../../../components/common/Can.jsx';
import { ScreenSkeleton } from '../../../components/common/ScreenSkeleton.jsx';
import { RefreshButton } from '../../../components/common/RefreshButton.jsx';
import { toast } from 'sonner';

export const ProjectsPage = () => {
  const [activeTab, setActiveTab] = useState('projects'); // 'projects' | 'clients'
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals state
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);

  // Queries & Mutations
  const { data: projectsRes, isLoading: isProjectsLoading, isFetching: isProjectsFetching, refetch: refetchProjects } = useGetProjectsQuery({
    search: search.trim() || undefined,
    status: statusFilter || undefined,
    limit: 50
  });

  const { data: clientsRes, isLoading: isClientsLoading, isFetching: isClientsFetching, refetch: refetchClients } = useGetClientsQuery({
    search: search.trim() || undefined,
    limit: 50
  });

  const [deleteProject] = useDeleteProjectMutation();
  const [deleteClient] = useDeleteClientMutation();

  const projects = projectsRes?.data || [];

  if ((isProjectsLoading || isClientsLoading) && !projectsRes) {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <ScreenSkeleton variant="table" />
      </div>
    );
  }
  const clients = clientsRes?.data || [];

  const activeProjectsCount = projects.filter((p) => p.status === 'active').length;
  const totalAllocatedMembers = projects.reduce((sum, p) => sum + (p.members?.length || 0), 0);

  const handleDeleteProject = async (proj) => {
    if (!window.confirm(`Are you sure you want to delete project "${proj.name}" (${proj.code})?`)) return;
    try {
      await deleteProject(proj._id).unwrap();
      toast.success(`Project "${proj.name}" deleted successfully`);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to delete project');
    }
  };

  const handleDeleteClient = async (cli) => {
    if (!window.confirm(`Are you sure you want to delete client "${cli.companyName}"?`)) return;
    try {
      await deleteClient(cli._id).unwrap();
      toast.success(`Client "${cli.companyName}" deleted successfully`);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to delete client');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FolderKanban className="h-7 w-7 text-primary" />
            Projects & Client Portfolio
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage corporate client accounts, project charters, budgets, and team allocations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <RefreshButton onRefresh={() => { refetchProjects(); refetchClients(); }} isFetching={isProjectsFetching || isClientsFetching} />
          <Can I="project.manage">
            <button
              onClick={() => {
                setSelectedClient(null);
                setIsClientModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-input bg-background hover:bg-muted transition"
            >
              <Building2 className="h-4 w-4 text-muted-foreground" />
              New Client
            </button>
            <button
              onClick={() => {
                setSelectedProject(null);
                setIsProjectModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition"
            >
              <Plus className="h-4 w-4" />
              New Project
            </button>
          </Can>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-border bg-card shadow-sm flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Briefcase className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Total Projects</p>
            <p className="text-xl font-bold text-foreground">{projects.length}</p>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card shadow-sm flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Active Deliveries</p>
            <p className="text-xl font-bold text-foreground">{activeProjectsCount}</p>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card shadow-sm flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Corporate Clients</p>
            <p className="text-xl font-bold text-foreground">{clients.length}</p>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card shadow-sm flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Team Allocations</p>
            <p className="text-xl font-bold text-foreground">{totalAllocatedMembers}</p>
          </div>
        </div>
      </div>

      {/* Main Container with Tab Switcher & Search */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        {/* Navigation Tabs & Filters */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-border p-4 gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('projects')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                activeTab === 'projects'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              Projects ({projects.length})
            </button>
            <button
              onClick={() => setActiveTab('clients')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                activeTab === 'clients'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              Clients ({clients.length})
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder={activeTab === 'projects' ? 'Search project name, code...' : 'Search company, email...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-56 md:w-64 pl-9 pr-3 py-1.5 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
              />
            </div>

            {activeTab === 'projects' && (
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="on_hold">On Hold</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            )}
          </div>
        </div>

        {/* Tab 1: Projects Table */}
        {activeTab === 'projects' && (
          <div className="overflow-x-auto">
            {isProjectsLoading ? (
              <div className="p-8 text-center text-sm text-muted-foreground">Loading projects portfolio...</div>
            ) : projects.length === 0 ? (
              <div className="p-12 text-center">
                <Briefcase className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                <h3 className="text-sm font-medium text-foreground">No projects found</h3>
                <p className="text-xs text-muted-foreground mt-1">Get started by creating a new project charter.</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border">
                  <tr>
                    <th className="px-6 py-3">Project & Code</th>
                    <th className="px-6 py-3">Client</th>
                    <th className="px-6 py-3">Department</th>
                    <th className="px-6 py-3">Manager</th>
                    <th className="px-6 py-3">Billing & Budget</th>
                    <th className="px-6 py-3">Team</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {projects.map((proj) => (
                    <tr key={proj._id} className="hover:bg-muted/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-foreground">{proj.name}</div>
                        <div className="text-xs font-mono text-primary font-semibold">{proj.code}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-foreground">{proj.clientId?.companyName || 'N/A'}</div>
                        <div className="text-xs text-muted-foreground">{proj.clientId?.currency || 'PKR'}</div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {proj.departmentId?.name || 'Unassigned'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-foreground">{proj.managerId?.name || 'Unassigned'}</div>
                        <div className="text-xs text-muted-foreground">{proj.managerId?.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-foreground capitalize">
                          {proj.billingType === 'hourly'
                            ? `PKR ${(proj.hourlyBillingRatePaisa / 100).toLocaleString()}/hr`
                            : proj.billingType === 'fixed'
                            ? 'Fixed Price'
                            : 'Internal Non-Billable'}
                        </div>
                        {proj.budgetPaisa > 0 && (
                          <div className="text-xs text-muted-foreground">
                            Budget: PKR {(proj.budgetPaisa / 100).toLocaleString()}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-700 dark:text-purple-300">
                            <Users className="h-3 w-3" />
                            {proj.members?.length || 0}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            proj.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-600'
                              : proj.status === 'on_hold'
                              ? 'bg-amber-500/10 text-amber-600'
                              : proj.status === 'completed'
                              ? 'bg-blue-500/10 text-blue-600'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {proj.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Can I="project.manage">
                            <button
                              title="Assign Team Members"
                              onClick={() => {
                                setSelectedProject(proj);
                                setIsMembersModalOpen(true);
                              }}
                              className="p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition"
                            >
                              <UserPlus className="h-4 w-4 text-primary" />
                            </button>
                            <button
                              title="Edit Project"
                              onClick={() => {
                                setSelectedProject(proj);
                                setIsProjectModalOpen(true);
                              }}
                              className="p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              title="Delete Project"
                              onClick={() => handleDeleteProject(proj)}
                              className="p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-lg transition"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </Can>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab 2: Clients Table */}
        {activeTab === 'clients' && (
          <div className="overflow-x-auto">
            {isClientsLoading ? (
              <div className="p-8 text-center text-sm text-muted-foreground">Loading corporate clients...</div>
            ) : clients.length === 0 ? (
              <div className="p-12 text-center">
                <Building2 className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                <h3 className="text-sm font-medium text-foreground">No clients registered</h3>
                <p className="text-xs text-muted-foreground mt-1">Add client accounts to sponsor projects.</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border">
                  <tr>
                    <th className="px-6 py-3">Company Name</th>
                    <th className="px-6 py-3">Contact Person</th>
                    <th className="px-6 py-3">Email & Phone</th>
                    <th className="px-6 py-3">Billing Currency</th>
                    <th className="px-6 py-3">Address</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {clients.map((cli) => (
                    <tr key={cli._id} className="hover:bg-muted/40 transition-colors">
                      <td className="px-6 py-4 font-medium text-foreground">
                        {cli.companyName}
                      </td>
                      <td className="px-6 py-4 text-foreground">{cli.name}</td>
                      <td className="px-6 py-4">
                        <div className="text-foreground">{cli.email}</div>
                        <div className="text-xs text-muted-foreground">{cli.phone || '—'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-muted text-foreground">
                          {cli.currency || 'PKR'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground text-xs">
                        {cli.address || '—'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Can I="project.manage">
                            <button
                              title="Edit Client"
                              onClick={() => {
                                setSelectedClient(cli);
                                setIsClientModalOpen(true);
                              }}
                              className="p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              title="Delete Client"
                              onClick={() => handleDeleteClient(cli)}
                              className="p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-lg transition"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </Can>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        project={selectedProject}
      />
      <ClientModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        client={selectedClient}
      />
      <ProjectMembersModal
        isOpen={isMembersModalOpen}
        onClose={() => setIsMembersModalOpen(false)}
        project={selectedProject}
      />
    </div>
  );
};

/**
 * @file ProjectMembersModal.jsx
 * @description Modal for assigning team members, project roles, and custom billing rates.
 * 
 * SPECIFICATION:
 * - Module: M22 Projects & Timesheets (BUILD-GUIDE Section 23 · Row 22.2)
 */

import React, { useState, useEffect } from 'react';
import { X, Users, UserPlus, Trash2, DollarSign, Shield, Loader2 } from 'lucide-react';
import { useAssignProjectMembersMutation } from '../projectsApi.js';
import { useGetEmployeesQuery } from '../../employees/employeesApi.js';
import { toast } from 'sonner';

export const ProjectMembersModal = ({ isOpen, onClose, project = null }) => {
  const [assignMembers, { isLoading }] = useAssignProjectMembersMutation();
  const { data: employeesRes } = useGetEmployeesQuery({ limit: 150 });
  const allEmployees = Array.isArray(employeesRes?.data?.items)
    ? employeesRes.data.items
    : Array.isArray(employeesRes?.data)
    ? employeesRes.data
    : [];

  const [membersList, setMembersList] = useState([]);
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [selectedRole, setSelectedRole] = useState('Developer');
  const [customRateRupees, setCustomRateRupees] = useState('');

  useEffect(() => {
    if (project?.members) {
      setMembersList(
        project.members.map((m) => ({
          employeeId: m.employeeId?._id || m.employeeId,
          name: m.employeeId?.name || 'Assigned Member',
          email: m.employeeId?.email || '',
          projectRole: m.projectRole || 'Developer',
          customHourlyRateRupees: m.customHourlyRatePaisa ? (m.customHourlyRatePaisa / 100).toString() : '0'
        }))
      );
    } else {
      setMembersList([]);
    }
    setSelectedEmpId('');
    setSelectedRole('Developer');
    setCustomRateRupees('');
  }, [project, isOpen]);

  if (!isOpen || !project) return null;

  const handleAddMember = () => {
    if (!selectedEmpId) {
      toast.error('Please select an employee to add to the team');
      return;
    }

    if (membersList.some((m) => m.employeeId === selectedEmpId)) {
      toast.error('This employee is already assigned to the project');
      return;
    }

    const empObj = allEmployees.find((e) => e._id === selectedEmpId);
    setMembersList([
      ...membersList,
      {
        employeeId: selectedEmpId,
        name: empObj?.name || 'Selected Employee',
        email: empObj?.email || '',
        projectRole: selectedRole,
        customHourlyRateRupees: customRateRupees || '0'
      }
    ]);

    setSelectedEmpId('');
    setSelectedRole('Developer');
    setCustomRateRupees('');
  };

  const handleRemoveMember = (empId) => {
    setMembersList(membersList.filter((m) => m.employeeId !== empId));
  };

  const handleSave = async () => {
    const payload = membersList.map((m) => ({
      employeeId: m.employeeId,
      projectRole: m.projectRole,
      customHourlyRatePaisa: Math.round(Number(m.customHourlyRateRupees || 0) * 100)
    }));

    try {
      await assignMembers({ id: project._id, members: payload }).unwrap();
      toast.success(`Assigned ${payload.length} member(s) to project "${project.code}"`);
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to update project team');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl rounded-xl bg-card border border-border shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Project Team: {project.name}
              </h2>
              <p className="text-xs text-muted-foreground font-mono">
                Code: {project.code} · Only assigned members can log timesheets
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

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Add Member Row */}
          <div className="p-4 rounded-lg border border-border bg-muted/30 space-y-3">
            <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
              <UserPlus className="h-3.5 w-3.5 text-primary" />
              Add Team Member
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-5">
                <select
                  value={selectedEmpId}
                  onChange={(e) => setSelectedEmpId(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                >
                  <option value="">Select Employee...</option>
                  {Array.isArray(allEmployees) &&
                    allEmployees.map((emp) => (
                      <option key={emp._id} value={emp._id}>
                        {emp.name} ({emp.designationId?.title || emp.employeeCode || emp.employeeId || 'Staff'})
                      </option>
                    ))}
                </select>
              </div>

              <div className="sm:col-span-3">
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                >
                  <option value="Developer">Developer</option>
                  <option value="Lead">Lead</option>
                  <option value="QA">QA</option>
                  <option value="Designer">Designer</option>
                  <option value="DevOps">DevOps</option>
                  <option value="Consultant">Consultant</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <input
                  type="number"
                  min="0"
                  placeholder="Rate"
                  value={customRateRupees}
                  onChange={(e) => setCustomRateRupees(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-input bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                />
              </div>

              <div className="sm:col-span-2">
                <button
                  type="button"
                  onClick={handleAddMember}
                  className="w-full px-3 py-1.5 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition shadow-sm"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Members Table */}
          <div>
            <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-2">
              Assigned Roster ({membersList.length})
            </h4>
            {membersList.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-border rounded-lg text-xs text-muted-foreground">
                No team members assigned yet. Add team members above.
              </div>
            ) : (
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted/50 text-xs text-muted-foreground border-b border-border">
                    <tr>
                      <th className="px-4 py-2.5">Member</th>
                      <th className="px-4 py-2.5">Role</th>
                      <th className="px-4 py-2.5">Custom Rate</th>
                      <th className="px-4 py-2.5 text-right">Remove</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {membersList.map((m) => (
                      <tr key={m.employeeId} className="hover:bg-muted/30">
                        <td className="px-4 py-2.5">
                          <div className="font-medium text-foreground">{m.name}</div>
                          {m.email && <div className="text-xs text-muted-foreground">{m.email}</div>}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
                            {m.projectRole}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground">
                          {Number(m.customHourlyRateRupees) > 0 ? (
                            <span className="font-medium text-foreground">
                              PKR {Number(m.customHourlyRateRupees).toLocaleString()}/hr
                            </span>
                          ) : (
                            <span>Standard Project Rate</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(m.employeeId)}
                            className="p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded transition"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-input bg-background text-foreground hover:bg-muted transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Team Roster
          </button>
        </div>
      </div>
    </div>
  );
};


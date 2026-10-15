/**
 * @file MyProfilePage.jsx
 * @description Self-Service "My Profile" Portal for Personnel Records, Assigned Shift & Change Requests.
 * 
 * SPECIFICATION & DATAFLOW:
 * - Module: M3 Employee Management (BUILD-GUIDE Section 8 · Rows 3.12, 3.15, 3.16)
 * - Layer: Frontend Page Component
 * - Dataflow: GET /api/v1/employees/me $\rightarrow$ Render Cards $\rightarrow$ Trigger Info Update Modal
 */

import React, { useState } from 'react';
import { toast } from 'sonner';
import {
  User,
  Mail,
  Phone,
  Shield,
  CreditCard,
  Building2,
  Clock,
  MapPin,
  Calendar,
  AlertCircle,
  FileEdit,
  Tag,
  Plus,
  X,
  Loader2,
  Send
} from 'lucide-react';
import { Card } from '../../../components/common/Card.jsx';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { StatusBadge } from '../../../components/common/StatusBadge.jsx';
import { ChangeRequestModal } from '../components/ChangeRequestModal.jsx';
import {
  useGetMyProfileQuery,
  useUpdateSkillsMutation
} from '../employeesApi.js';
import { formatCNIC, formatDate } from '../../../lib/formatters.js';

export default function MyProfilePage() {
  const { data: profileData, isLoading, error, refetch } = useGetMyProfileQuery();
  const [updateSkills, { isLoading: isUpdatingSkills }] = useUpdateSkillsMutation();

  const [isChangeRequestOpen, setIsChangeRequestOpen] = useState(false);
  const [newSkill, setNewSkill] = useState('');

  const employee = profileData?.data;

  const handleAddSkill = async (e) => {
    e.preventDefault();
    if (!newSkill.trim()) return;

    const trimmed = newSkill.trim();
    const currentSkills = employee?.skills || [];
    if (currentSkills.includes(trimmed)) {
      toast.error('Skill is already added');
      return;
    }

    try {
      await updateSkills({ skills: [...currentSkills, trimmed] }).unwrap();
      toast.success(`Skill '${trimmed}' added`);
      setNewSkill('');
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to update skills');
    }
  };

  const handleRemoveSkill = async (skillToRemove) => {
    const currentSkills = employee?.skills || [];
    const updated = currentSkills.filter((s) => s !== skillToRemove);
    try {
      await updateSkills({ skills: updated }).unwrap();
      toast.success(`Skill '${skillToRemove}' removed`);
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to remove skill');
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#00C471]" />
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="p-8 text-center space-y-4 max-w-md mx-auto">
        <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-800">Profile Not Linked</h3>
        <p className="text-xs text-slate-500">
          {error?.data?.message || 'Your user account is not currently associated with an active employee record.'}
        </p>
      </div>
    );
  }

  const initials = employee.name
    ? employee.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'ME';

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <PageHeader
        title="My Employee Profile"
        subtitle="Review your organizational assignment, shift schedules, emergency contacts, and personal credentials."
        action={
          <button
            type="button"
            onClick={() => setIsChangeRequestOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-[#00C471] hover:bg-[#049856] text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
          >
            <FileEdit className="w-4 h-4" /> Request Info Update
          </button>
        }
      />

      {/* Hero Profile Card */}
      <Card className="p-6 border-slate-200">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-800 font-bold text-xl flex items-center justify-center shrink-0 border border-emerald-200">
            {initials}
          </div>

          <div className="space-y-1 text-center sm:text-left flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h2 className="text-lg font-bold text-slate-900">{employee.name}</h2>
              <span className="text-xs font-mono font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                {employee.employeeCode}
              </span>
              <StatusBadge status={employee.status} />
            </div>

            <p className="text-xs text-slate-600 font-medium">
              {employee.designationId?.title || 'Job Title Unassigned'} •{' '}
              {employee.departmentId?.name || 'Department Unassigned'}
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-500 pt-2">
              <span className="inline-flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                {employee.email || '—'}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                {employee.phone || '—'}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-slate-400" />
                CNIC: {formatCNIC(employee.cnic) || '—'}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Grid: Job Assignment & Shift Hours */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card className="p-5 border-slate-200 space-y-3">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-xs border-b pb-2">
            <Building2 className="w-4 h-4 text-emerald-600" />
            <span>Organizational Assignment</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Department</span>
              <span className="font-semibold text-slate-800">{employee.departmentId?.name || 'Unassigned'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Designation</span>
              <span className="font-semibold text-slate-800">{employee.designationId?.title || 'Unassigned'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Employment Type</span>
              <span className="font-semibold text-slate-800">{employee.employmentType || 'Permanent'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Joining Date</span>
              <span className="font-semibold text-slate-800">{formatDate(employee.joiningDate)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Direct Manager</span>
              <span className="font-semibold text-slate-800">
                {employee.managerId ? `${employee.managerId.name} (${employee.managerId.employeeCode})` : 'None Assigned'}
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-5 border-slate-200 space-y-3">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-xs border-b pb-2">
            <Clock className="w-4 h-4 text-emerald-600" />
            <span>Assigned Shift & Timings</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Shift Name</span>
              <span className="font-semibold text-slate-800">{employee.shiftId?.name || 'General Shift'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Working Hours</span>
              <span className="font-mono font-semibold text-slate-800">
                {employee.shiftId ? `${employee.shiftId.startTime} - ${employee.shiftId.endTime}` : '09:00 - 18:00'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Grace Period</span>
              <span className="font-semibold text-slate-800">
                {employee.shiftId?.graceMinutes ? `${employee.shiftId.graceMinutes} minutes` : '15 minutes'}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Shift Type</span>
              <span className="font-semibold text-slate-800">{employee.shiftId?.type || 'Standard Fixed'}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Grid: Bank Details & Address */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card className="p-5 border-slate-200 space-y-3">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-xs border-b pb-2">
            <CreditCard className="w-4 h-4 text-emerald-600" />
            <span>Payroll Bank Coordinates</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Bank Name</span>
              <span className="font-semibold text-slate-800">{employee.bankDetails?.bankName || 'Not Set'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Account Title</span>
              <span className="font-semibold text-slate-800">{employee.bankDetails?.accountTitle || 'Not Set'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Account Number</span>
              <span className="font-mono font-semibold text-slate-800">{employee.bankDetails?.accountNumber || '—'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">IBAN</span>
              <span className="font-mono font-semibold text-emerald-700">{employee.bankDetails?.iban || '—'}</span>
            </div>
          </div>
        </Card>

        <Card className="p-5 border-slate-200 space-y-3">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-xs border-b pb-2">
            <MapPin className="w-4 h-4 text-emerald-600" />
            <span>Residential Address & Emergency</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Address</span>
              <span className="font-semibold text-slate-800 text-right max-w-xs">
                {employee.address?.street ? `${employee.address.street}, ${employee.address.city}` : '—'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Emergency Contact</span>
              <span className="font-semibold text-slate-800">
                {employee.emergencyContact?.name || '—'}{' '}
                {employee.emergencyContact?.relationship ? `(${employee.emergencyContact.relationship})` : ''}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Emergency Phone</span>
              <span className="font-mono font-semibold text-slate-800">{employee.emergencyContact?.phone || '—'}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Skills Taxonomy Management (Self-Service) */}
      <Card className="p-5 border-slate-200 space-y-4">
        <div className="flex items-center justify-between border-b pb-2">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
            <Tag className="w-4 h-4 text-emerald-600" />
            <span>Professional Skills Taxonomy</span>
          </div>
          <span className="text-[11px] text-slate-400">Self-managed competency tags</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(!employee.skills || employee.skills.length === 0) ? (
            <span className="text-xs text-slate-400 italic">No skill tags listed yet.</span>
          ) : (
            employee.skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill)}
                  className="hover:text-rose-600 cursor-pointer"
                  title="Remove skill"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))
          )}
        </div>

        <form onSubmit={handleAddSkill} className="flex items-center gap-2 pt-2 max-w-md">
          <input
            type="text"
            placeholder="Add a new skill (e.g. React, Node.js, MERN)..."
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            className="flex-1 text-xs px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00C471]/30"
          />
          <button
            type="submit"
            disabled={isUpdatingSkills || !newSkill.trim()}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </form>
      </Card>

      {/* Change Request Modal */}
      <ChangeRequestModal
        isOpen={isChangeRequestOpen}
        onClose={() => setIsChangeRequestOpen(false)}
        currentEmployee={employee}
      />
    </div>
  );
}

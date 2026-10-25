/**
 * @file MyProfilePage.jsx
 * @description RBAC & PBAC-Aware Master Self-Service Portal & Role Profiles.
 * 
 * SPECIFICATION & ARCHITECTURE:
 * - Module: M3 Employee Management & Security Authorization
 * - RBAC / PBAC Personas:
 *   1. Super Admin: Supreme System Owner, Unrestricted Apex Governance, Full Root Access.
 *   2. HR Manager: Enterprise People Lead, Company-Wide Workforce Oversight, Full CRUD & Financial View.
 *   3. Department Manager: Department Leadership, Team-Scoped Approvals (3-day limit), Approval Delegation.
 *   4. Standard Employee: Self-Service Portal, Organizational Assignment, Shift Timings, Change Requests.
 * - Global Profile Security: Interactive 2FA Modal, Password Reset, and Login History for all roles.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
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
  Edit,
  Tag,
  Plus,
  X,
  Loader2,
  Crown,
  ShieldCheck,
  ShieldAlert,
  Award,
  Settings,
  Users,
  KeyRound,
  History,
  Lock,
  Briefcase,
  FileSpreadsheet,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Camera
} from 'lucide-react';

import { useAuth } from '../../../hooks/useAuth.js';
import { usePermission } from '../../../hooks/usePermission.js';
import { Card } from '../../../components/common/Card.jsx';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { StatusBadge } from '../../../components/common/StatusBadge.jsx';
import { ScreenSkeleton } from '../../../components/common/ScreenSkeleton.jsx';
import { ChangeRequestModal } from '../components/ChangeRequestModal.jsx';
import { TwoFactorModal } from '../../auth/components/TwoFactorModal.jsx';
import { ChangePasswordModal } from '../../auth/components/ChangePasswordModal.jsx';
import { updateUser } from '../../auth/authSlice.js';
import {
  useGetMyProfileQuery,
  useUpdateSkillsMutation,
  useUploadAvatarMutation
} from '../employeesApi.js';
import { formatCNIC, formatDate } from '../../../lib/formatters.js';

export default function MyProfilePage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const { can } = usePermission();
  const { data: profileData, isLoading, error, refetch } = useGetMyProfileQuery();
  const [updateSkills, { isLoading: isUpdatingSkills }] = useUpdateSkillsMutation();
  const [uploadAvatar, { isLoading: isUploadingAvatar }] = useUploadAvatarMutation();
  const fileInputRef = useRef(null);

  const [isChangeRequestOpen, setIsChangeRequestOpen] = useState(false);
  const [is2faModalOpen, setIs2faModalOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [newSkill, setNewSkill] = useState('');

  const employee = profileData?.data;
  const currentAvatar = employee?.avatar || user?.avatar;

  // Derive granular role persona
  const isSuperAdminRole = hasRole('Super Admin');
  const isHRRole = !isSuperAdminRole && hasRole('HR Manager');
  const isDeptManagerRole = !isSuperAdminRole && !isHRRole && hasRole('Department Manager');
  const isRegularEmployeeRole = !isSuperAdminRole && !isHRRole && !isDeptManagerRole;

  // PBAC capability evaluations
  const canEditDirectly = isSuperAdminRole || can('employee.edit', 'Employee');
  const canViewFinancials = isSuperAdminRole || isHRRole || can('employee.salary.view', 'Employee');

  // Reliable 2FA status from either Redux session or populated Employee record
  const is2faActive = Boolean(user?.twoFactorEnabled ?? employee?.userId?.twoFactorEnabled);

  // Synchronize Redux session with authoritative DB state when profile loads
  useEffect(() => {
    if (
      employee?.userId?.twoFactorEnabled !== undefined &&
      user &&
      user.twoFactorEnabled !== employee.userId.twoFactorEnabled
    ) {
      dispatch(updateUser({ twoFactorEnabled: employee.userId.twoFactorEnabled }));
    }
  }, [employee?.userId?.twoFactorEnabled, user, dispatch]);

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

  const handleAvatarSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const ext = file.name.split('.').pop()?.toLowerCase();
    const allowedExts = ['jpg', 'jpeg', 'png', 'webp'];

    if (!allowedTypes.includes(file.type) || !allowedExts.includes(ext)) {
      toast.error('Invalid format! Only JPG, JPEG, PNG, and WEBP image files are allowed.');
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      toast.error('Image size must be less than 3MB');
      return;
    }

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const res = await uploadAvatar({
        id: isSuperAdminRole && employee?._id ? employee._id : null,
        formData
      }).unwrap();

      const newAvatarUrl = res.data?.avatarUrl || res.avatarUrl;
      if (newAvatarUrl) {
        dispatch(updateUser({ avatar: newAvatarUrl }));
      }
      refetch();
      toast.success('Profile photo updated successfully!');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to upload profile photo');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const initials = employee?.name
    ? employee.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : isSuperAdminRole ? 'SA' : 'ME';

  const renderAvatarUploadBlock = (
    badgeIcon = null,
    borderColor = 'border-white/20',
    sizeClasses = 'w-20 h-20 md:w-24 md:h-24'
  ) => {
    return (
      <div className="relative shrink-0 group">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleAvatarSelect}
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
        />

        <div
          onClick={() => fileInputRef.current?.click()}
          className={`relative ${sizeClasses} rounded-2xl overflow-hidden cursor-pointer shadow-xl border-2 ${borderColor} transition-all duration-200 group-hover:scale-[1.02] flex items-center justify-center select-none`}
          title="Click to update profile photo"
        >
          {currentAvatar ? (
            <img
              src={currentAvatar}
              alt={employee?.name || 'Profile'}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className={`w-full h-full flex items-center justify-center font-black text-2xl md:text-3xl tracking-wider ${
                isSuperAdminRole
                  ? 'bg-gradient-to-tr from-[#00C471] to-[#029555] text-slate-950'
                  : isHRRole
                  ? 'bg-gradient-to-tr from-indigo-500 to-indigo-700 text-white'
                  : isDeptManagerRole
                  ? 'bg-gradient-to-tr from-teal-500 to-teal-700 text-white'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {initials}
            </div>
          )}

          {/* Hover / Loading Overlay */}
          <div
            className={`absolute inset-0 bg-black/55 backdrop-blur-2xs flex flex-col items-center justify-center gap-1 transition-opacity duration-200 ${
              isUploadingAvatar ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
          >
            {isUploadingAvatar ? (
              <Loader2 className="w-6 h-6 animate-spin text-white" />
            ) : (
              <>
                <Camera className="w-5 h-5 text-white drop-shadow" />
                <span className="text-[10px] font-bold text-white tracking-wider uppercase drop-shadow">
                  {currentAvatar ? 'Change' : 'Upload'}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Persona Authority Badge */}
        {badgeIcon && (
          <div className="absolute -bottom-2 -right-2 z-10 pointer-events-none">
            {badgeIcon}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return <ScreenSkeleton variant="profile" title="My Profile Records" message="Loading your personal employee file, documents & compensation..." />;
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

  // =========================================================================
  // 1. SUPER ADMIN / OWNER EXECUTIVE PROFILE VIEW
  // =========================================================================
  if (isSuperAdminRole) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto pb-12">
        <PageHeader
          title="Executive Profile & System Ownership"
          subtitle="Platform Owner, Root Administrator & Supreme Governance Authority of ELVARA Enterprise."
          action={
            <button
              type="button"
              onClick={() => navigate(`/employees/${employee._id}/edit`)}
              className="px-4 py-2.5 rounded-xl bg-[#00C471] hover:bg-[#049856] text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
            >
              <Edit className="w-4 h-4" /> Edit Executive Profile
            </button>
          }
        />

        {/* Executive Hero Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#061A14] via-[#0B2A20] to-[#04130E] border border-[#00C471]/30 p-6 md:p-8 text-white shadow-lg">
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#00C471]/15 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-[#00C471]/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6">
            {renderAvatarUploadBlock(
              <div
                className="bg-amber-400 text-amber-950 p-1.5 rounded-xl shadow-md border-2 border-[#061A14]"
                title="System Owner & Root Authority"
              >
                <Crown className="w-4 h-4 fill-amber-950" />
              </div>,
              'border-[#00C471]/40'
            )}

            <div className="space-y-2 text-center md:text-left flex-1">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">{employee.name}</h1>
                <span className="text-xs font-mono font-bold text-[#00C471] bg-[#00C471]/20 border border-[#00C471]/40 px-2.5 py-0.5 rounded-md">
                  {employee.employeeCode || 'EMP-000'}
                </span>
                <span className="text-[11px] font-bold text-amber-300 bg-amber-400/20 border border-amber-400/30 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                  <Crown className="w-3 h-3 fill-amber-300" /> System Owner
                </span>
                <StatusBadge status={employee.status || 'Active'} />
              </div>

              <p className="text-xs md:text-sm text-slate-300 font-medium">
                Chief Executive Officer & Platform Owner • ELVARA HRM Enterprise
              </p>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-5 text-xs text-slate-300 pt-3">
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-[#00C471]" />
                  {employee.email || '—'}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-[#00C471]" />
                  {employee.phone || '—'}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-[#00C471]" />
                  CNIC: {formatCNIC(employee.cnic) || '—'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Grid: Corporate Governance & Security Authorization */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Card className="p-5 border-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b pb-2.5">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                <Building2 className="w-4 h-4 text-emerald-600" />
                <span>Corporate Governance & Hierarchy</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Supreme Authority
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Corporate Role</span>
                <span className="font-semibold text-slate-900">Founder / Platform Owner</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Hierarchy Level</span>
                <span className="font-mono font-bold text-emerald-700">Apex (Level 0)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Direct Reporting</span>
                <span className="font-semibold text-slate-900">Top of Corporate Tree (No Superior)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Supervisory Scope</span>
                <span className="font-semibold text-slate-900">All Departments, HR & Personnel</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Organization</span>
                <span className="font-semibold text-slate-900">ELVARA HRM Enterprise</span>
              </div>
            </div>
          </Card>

          <Card className="p-5 border-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b pb-2.5">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Security & Access Authorization</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Root Access
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Access Privilege Level</span>
                <span className="font-bold text-emerald-700">Global Root Super Administrator</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Two-Factor Authentication (2FA)</span>
                <span className="flex items-center gap-1.5 font-semibold">
                  {is2faActive ? (
                    <span className="text-emerald-600 flex items-center gap-1 text-[11px] font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active & Protected
                    </span>
                  ) : (
                    <span className="text-amber-600 flex items-center gap-1 text-[11px] font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Disabled
                    </span>
                  )}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">CASL Policy Boundary</span>
                <span className="font-semibold text-slate-900">Unrestricted System Override</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Authentication Protocol</span>
                <span className="font-semibold text-slate-900">Encrypted JWT + Salted Bcrypt</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Account Governance</span>
                <span className="font-semibold text-slate-900">Protected Master Account</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">PBAC Password Governance</span>
                <span className="font-semibold text-emerald-700">Master Authority (`manage: all`)</span>
              </div>
            </div>

            {/* Quick Security Action Buttons */}
            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setIs2faModalOpen(true)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                {is2faActive ? 'Manage 2FA' : 'Enable 2FA'}
              </button>
              <button
                type="button"
                onClick={() => setIsChangePasswordOpen(true)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                Change Password
              </button>
              <button
                type="button"
                onClick={() => navigate('/users')}
                className="px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/60 text-emerald-800 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                title="Trigger administrative password reset for any system user"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-emerald-600" />
                Reset User Passwords
              </button>
              <button
                type="button"
                onClick={() => navigate('/login-history')}
                className="px-3 py-1.5 rounded-lg border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <History className="w-3.5 h-3.5 text-slate-500" />
                Login History
              </button>
            </div>
          </Card>
        </div>

        {/* Grid: Personal Coordinates & Corporate Banking */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Card className="p-5 border-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b pb-2.5">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>Executive Personal Coordinates</span>
              </div>
              <button
                type="button"
                onClick={() => navigate(`/employees/${employee._id}/edit`)}
                className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 cursor-pointer"
              >
                Edit
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Residential Address</span>
                <span className="font-semibold text-slate-900 text-right max-w-xs">
                  {employee.address?.street ? `${employee.address.street}, ${employee.address.city}` : 'Not Specified'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Emergency Contact</span>
                <span className="font-semibold text-slate-900">
                  {employee.emergencyContact?.name || 'Not Specified'}{' '}
                  {employee.emergencyContact?.relationship ? `(${employee.emergencyContact.relationship})` : ''}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Emergency Phone</span>
                <span className="font-mono font-semibold text-slate-900">{employee.emergencyContact?.phone || 'Not Specified'}</span>
              </div>
            </div>
          </Card>

          <Card className="p-5 border-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b pb-2.5">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span>Corporate Disbursement & Banking</span>
              </div>
              <button
                type="button"
                onClick={() => navigate(`/employees/${employee._id}/edit`)}
                className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 cursor-pointer"
              >
                Edit
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Bank Name</span>
                <span className="font-semibold text-slate-900">{employee.bankDetails?.bankName || 'Not Set'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Account Title</span>
                <span className="font-semibold text-slate-900">{employee.bankDetails?.accountTitle || 'Not Set'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Account Number</span>
                <span className="font-mono font-semibold text-slate-900">{employee.bankDetails?.accountNumber || '—'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">IBAN</span>
                <span className="font-mono font-semibold text-emerald-700">{employee.bankDetails?.iban || '—'}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Administrative Control Hub Shortcuts */}
        <Card className="p-5 border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b pb-2.5">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
              <Crown className="w-4 h-4 text-amber-500" />
              <span>Administrative Master Hub</span>
            </div>
            <span className="text-[11px] text-slate-400">Owner Direct System Access</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            <button
              type="button"
              onClick={() => navigate('/users')}
              className="p-3.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 text-left transition-all group cursor-pointer"
            >
              <Users className="w-4 h-4 text-slate-600 group-hover:text-emerald-600 mb-1.5 transition-colors" />
              <span className="text-xs font-bold text-slate-800 block">User Access</span>
              <span className="text-[10px] text-slate-400 block">Manage accounts</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/roles')}
              className="p-3.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 text-left transition-all group cursor-pointer"
            >
              <Shield className="w-4 h-4 text-slate-600 group-hover:text-emerald-600 mb-1.5 transition-colors" />
              <span className="text-xs font-bold text-slate-800 block">Roles & Security</span>
              <span className="text-[10px] text-slate-400 block">Permissions matrix</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/departments')}
              className="p-3.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 text-left transition-all group cursor-pointer"
            >
              <Building2 className="w-4 h-4 text-slate-600 group-hover:text-emerald-600 mb-1.5 transition-colors" />
              <span className="text-xs font-bold text-slate-800 block">Departments</span>
              <span className="text-[10px] text-slate-400 block">Company units</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/designations')}
              className="p-3.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 text-left transition-all group cursor-pointer"
            >
              <Award className="w-4 h-4 text-slate-600 group-hover:text-emerald-600 mb-1.5 transition-colors" />
              <span className="text-xs font-bold text-slate-800 block">Designations</span>
              <span className="text-[10px] text-slate-400 block">Job hierarchy</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/settings')}
              className="p-3.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 text-left transition-all group cursor-pointer"
            >
              <Settings className="w-4 h-4 text-slate-600 group-hover:text-emerald-600 mb-1.5 transition-colors" />
              <span className="text-xs font-bold text-slate-800 block">Settings</span>
              <span className="text-[10px] text-slate-400 block">Global config</span>
            </button>
          </div>
        </Card>

        {/* Two-Factor Authentication Modal */}
        <TwoFactorModal
          isOpen={is2faModalOpen}
          onClose={() => {
            setIs2faModalOpen(false);
            refetch();
          }}
          user={{ ...user, twoFactorEnabled: is2faActive }}
        />
        <ChangePasswordModal
          isOpen={isChangePasswordOpen}
          onClose={() => setIsChangePasswordOpen(false)}
        />
      </div>
    );
  }

  // =========================================================================
  // 2. HR MANAGER EXECUTIVE PROFILE VIEW
  // =========================================================================
  if (isHRRole) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto pb-12">
        <PageHeader
          title="HR Executive & People Operations Profile"
          subtitle="Enterprise Workforce Governance, Employment Contracts, Shift Rosters & Organizational Oversight."
          action={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsChangeRequestOpen(true)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <FileEdit className="w-4 h-4 text-slate-500" /> Request Change
              </button>
              {canEditDirectly && (
                <button
                  type="button"
                  onClick={() => navigate(`/employees/${employee._id}/edit`)}
                  className="px-4 py-2.5 rounded-xl bg-[#00C471] hover:bg-[#049856] text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
                >
                  <Edit className="w-4 h-4" /> Edit Profile Directly
                </button>
              )}
            </div>
          }
        />

        {/* HR Executive Hero Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0B132B] via-[#1C2541] to-[#0B132B] border border-indigo-500/30 p-6 md:p-8 text-white shadow-lg">
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6">
            {renderAvatarUploadBlock(
              <div
                className="bg-indigo-400 text-indigo-950 p-1.5 rounded-xl shadow-md border-2 border-[#0B132B]"
                title="People & Culture Authority"
              >
                <ShieldCheck className="w-4 h-4" />
              </div>,
              'border-indigo-400/40'
            )}

            <div className="space-y-2 text-center md:text-left flex-1">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">{employee.name}</h1>
                <span className="text-xs font-mono font-bold text-indigo-300 bg-indigo-500/20 border border-indigo-400/40 px-2.5 py-0.5 rounded-md">
                  {employee.employeeCode}
                </span>
                <span className="text-[11px] font-bold text-indigo-200 bg-indigo-500/30 border border-indigo-400/30 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> HR Operations Lead
                </span>
                <StatusBadge status={employee.status || 'Active'} />
              </div>

              <p className="text-xs md:text-sm text-slate-300 font-medium">
                {employee.designationId?.title || 'Head of Human Resources & People Operations'} • {employee.departmentId?.name || 'Human Resources'}
              </p>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-5 text-xs text-slate-300 pt-3">
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-indigo-400" />
                  {employee.email || '—'}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-indigo-400" />
                  {employee.phone || '—'}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-indigo-400" />
                  CNIC: {formatCNIC(employee.cnic) || '—'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Grid: Enterprise Workforce Scope & Security */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Card className="p-5 border-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b pb-2.5">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                <Users className="w-4 h-4 text-indigo-600" />
                <span>Enterprise Workforce Governance</span>
              </div>
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                Company-Wide Scope
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Supervisory Scope</span>
                <span className="font-semibold text-slate-900">All Company Employees & Personnel</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Direct Reporting</span>
                <span className="font-semibold text-slate-900">Chief Executive Officer / Super Admin</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">CASL Policy Scope</span>
                <span className="font-mono font-bold text-indigo-700">Scope: ALL (Full Workforce CRUD)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Financial Clearance</span>
                <span className="font-semibold text-emerald-700">Unmasked Sensitive Financials View</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Operational Mandate</span>
                <span className="font-semibold text-slate-900">Contracts, Shifts, Payroll & Approvals</span>
              </div>
            </div>
          </Card>

          <Card className="p-5 border-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b pb-2.5">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Security & Access Authorization</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                HR Manager Tier
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Account Role</span>
                <span className="font-bold text-indigo-700">Human Resources Manager</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Two-Factor Authentication (2FA)</span>
                <span className="flex items-center gap-1.5 font-semibold">
                  {is2faActive ? (
                    <span className="text-emerald-600 flex items-center gap-1 text-[11px] font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active & Protected
                    </span>
                  ) : (
                    <span className="text-amber-600 flex items-center gap-1 text-[11px] font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Disabled
                    </span>
                  )}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Session Defense</span>
                <span className="font-semibold text-emerald-700">JWT Token Rotation + Active Guard</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Change Request Authority</span>
                <span className="font-semibold text-slate-900">Approval & Rejection Authority</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Direct Edit Privilege</span>
                <span className="font-semibold text-emerald-700">Authorized (`employee.edit: all`)</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">PBAC Password Governance</span>
                <span className="font-semibold text-emerald-700">Staff Reset Authorized (`user.manage`)</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setIs2faModalOpen(true)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                {is2faActive ? 'Manage 2FA' : 'Enable 2FA'}
              </button>
              <button
                type="button"
                onClick={() => setIsChangePasswordOpen(true)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                Change Password
              </button>
              <button
                type="button"
                onClick={() => navigate('/users')}
                className="px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/60 text-emerald-800 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                title="Reset user credentials in users management"
              >
                <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                Reset User Passwords
              </button>
              <button
                type="button"
                onClick={() => navigate('/login-history')}
                className="px-3 py-1.5 rounded-lg border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <History className="w-3.5 h-3.5 text-slate-500" />
                Login History
              </button>
            </div>
          </Card>
        </div>

        {/* HR Operations & People Command Hub */}
        <Card className="p-5 border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b pb-2.5">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
              <Briefcase className="w-4 h-4 text-indigo-600" />
              <span>HR People Operations Command Hub</span>
            </div>
            <span className="text-[11px] text-slate-400">Executive People Shortcuts</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            <button
              type="button"
              onClick={() => navigate('/employees')}
              className="p-3.5 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/40 text-left transition-all group cursor-pointer"
            >
              <Users className="w-4 h-4 text-slate-600 group-hover:text-indigo-600 mb-1.5 transition-colors" />
              <span className="text-xs font-bold text-slate-800 block">Directory</span>
              <span className="text-[10px] text-slate-400 block">All employees</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/employees/new')}
              className="p-3.5 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/40 text-left transition-all group cursor-pointer"
            >
              <Plus className="w-4 h-4 text-slate-600 group-hover:text-indigo-600 mb-1.5 transition-colors" />
              <span className="text-xs font-bold text-slate-800 block">Onboard Staff</span>
              <span className="text-[10px] text-slate-400 block">5-step wizard</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/employees/import')}
              className="p-3.5 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/40 text-left transition-all group cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-slate-600 group-hover:text-indigo-600 mb-1.5 transition-colors" />
              <span className="text-xs font-bold text-slate-800 block">Excel Import</span>
              <span className="text-[10px] text-slate-400 block">Bulk workforce</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/change-requests')}
              className="p-3.5 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/40 text-left transition-all group cursor-pointer"
            >
              <FileEdit className="w-4 h-4 text-slate-600 group-hover:text-indigo-600 mb-1.5 transition-colors" />
              <span className="text-xs font-bold text-slate-800 block">Change Requests</span>
              <span className="text-[10px] text-slate-400 block">Review profile edits</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/departments')}
              className="p-3.5 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/40 text-left transition-all group cursor-pointer"
            >
              <Building2 className="w-4 h-4 text-slate-600 group-hover:text-indigo-600 mb-1.5 transition-colors" />
              <span className="text-xs font-bold text-slate-800 block">Departments</span>
              <span className="text-[10px] text-slate-400 block">Units & Roster</span>
            </button>
          </div>
        </Card>

        {/* Grid: Coordinates & Banking */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Card className="p-5 border-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b pb-2.5">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                <MapPin className="w-4 h-4 text-indigo-600" />
                <span>Personal Residential & Emergency</span>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Residential Address</span>
                <span className="font-semibold text-slate-900 text-right max-w-xs">
                  {employee.address?.street ? `${employee.address.street}, ${employee.address.city}` : 'Not Specified'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Emergency Contact</span>
                <span className="font-semibold text-slate-900">
                  {employee.emergencyContact?.name || 'Not Specified'}{' '}
                  {employee.emergencyContact?.relationship ? `(${employee.emergencyContact.relationship})` : ''}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Emergency Phone</span>
                <span className="font-mono font-semibold text-slate-900">{employee.emergencyContact?.phone || 'Not Specified'}</span>
              </div>
            </div>
          </Card>

          <Card className="p-5 border-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b pb-2.5">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                <CreditCard className="w-4 h-4 text-indigo-600" />
                <span>Payroll Bank Coordinates</span>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Bank Name</span>
                <span className="font-semibold text-slate-900">{employee.bankDetails?.bankName || 'Not Set'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Account Title</span>
                <span className="font-semibold text-slate-900">{employee.bankDetails?.accountTitle || 'Not Set'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Account Number</span>
                <span className="font-mono font-semibold text-slate-900">{employee.bankDetails?.accountNumber || '—'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">IBAN</span>
                <span className="font-mono font-semibold text-indigo-700">{employee.bankDetails?.iban || '—'}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Skills Taxonomy */}
        <Card className="p-5 border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
              <Tag className="w-4 h-4 text-indigo-600" />
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
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200"
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
              placeholder="Add skill (e.g. Talent Acquisition, Payroll Compliance)..."
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              className="flex-1 text-xs px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
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

        {/* Modals */}
        <ChangeRequestModal
          isOpen={isChangeRequestOpen}
          onClose={() => setIsChangeRequestOpen(false)}
          currentEmployee={employee}
        />
        <TwoFactorModal
          isOpen={is2faModalOpen}
          onClose={() => {
            setIs2faModalOpen(false);
            refetch();
          }}
          user={{ ...user, twoFactorEnabled: is2faActive }}
        />
        <ChangePasswordModal
          isOpen={isChangePasswordOpen}
          onClose={() => setIsChangePasswordOpen(false)}
        />
      </div>
    );
  }

  // =========================================================================
  // 3. DEPARTMENT MANAGER PROFILE VIEW
  // =========================================================================
  if (isDeptManagerRole) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto pb-12">
        <PageHeader
          title="Departmental Leadership Profile"
          subtitle="Department Management, Direct Team Supervision, Leave Approvals & Delegations."
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

        {/* Department Manager Hero Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#092327] via-[#0E3B43] to-[#092327] border border-teal-500/30 p-6 md:p-8 text-white shadow-lg">
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-teal-500/15 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6">
            {renderAvatarUploadBlock(
              <div
                className="bg-teal-400 text-teal-950 p-1.5 rounded-xl shadow-md border-2 border-[#092327]"
                title="Department Manager"
              >
                <Briefcase className="w-4 h-4" />
              </div>,
              'border-teal-400/40'
            )}

            <div className="space-y-2 text-center md:text-left flex-1">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">{employee.name}</h1>
                <span className="text-xs font-mono font-bold text-teal-300 bg-teal-500/20 border border-teal-400/40 px-2.5 py-0.5 rounded-md">
                  {employee.employeeCode}
                </span>
                <span className="text-[11px] font-bold text-teal-200 bg-teal-500/30 border border-teal-400/30 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5" /> Department Lead
                </span>
                <StatusBadge status={employee.status || 'Active'} />
              </div>

              <p className="text-xs md:text-sm text-slate-300 font-medium">
                {employee.designationId?.title || 'Department Manager'} • {employee.departmentId?.name || 'Assigned Department'}
              </p>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-5 text-xs text-slate-300 pt-3">
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-teal-400" />
                  {employee.email || '—'}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-teal-400" />
                  {employee.phone || '—'}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-teal-400" />
                  CNIC: {formatCNIC(employee.cnic) || '—'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Grid: Department Leadership & Security Authorization */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Card className="p-5 border-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b pb-2.5">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                <Building2 className="w-4 h-4 text-teal-600" />
                <span>Departmental Leadership Scope</span>
              </div>
              <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                Team Scope
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Assigned Department</span>
                <span className="font-semibold text-slate-900">{employee.departmentId?.name || 'Assigned Department'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Supervisory Scope</span>
                <span className="font-semibold text-slate-900">Direct Team Subordinates (`scope: team`)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Leave Approval Limit</span>
                <span className="font-mono font-bold text-teal-700">Up to 3 Days (`limit: 3`)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Delegation Capability</span>
                <span className="font-semibold text-emerald-700">Peer Approval Delegation (`delegation.create`)</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Direct Manager</span>
                <span className="font-semibold text-slate-900">
                  {employee.managerId ? `${employee.managerId.name} (${employee.managerId.employeeCode})` : 'Executive Management'}
                </span>
              </div>
            </div>
          </Card>

          <Card className="p-5 border-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b pb-2.5">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Security & Access Authorization</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Manager Tier
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Role Privilege Level</span>
                <span className="font-bold text-teal-700">Department Manager</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Two-Factor Authentication (2FA)</span>
                <span className="flex items-center gap-1.5 font-semibold">
                  {is2faActive ? (
                    <span className="text-emerald-600 flex items-center gap-1 text-[11px] font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active & Protected
                    </span>
                  ) : (
                    <span className="text-amber-600 flex items-center gap-1 text-[11px] font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Disabled
                    </span>
                  )}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Session Guard</span>
                <span className="font-semibold text-emerald-700">Active Idle Timeout Defense</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Profile Updates</span>
                <span className="font-semibold text-slate-900">Requires HR Approval</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">PBAC Password Governance</span>
                <span className="font-semibold text-slate-700">Self-Service Only (`scope: own`)</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setIs2faModalOpen(true)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                {is2faActive ? 'Manage 2FA' : 'Enable 2FA'}
              </button>
              <button
                type="button"
                onClick={() => setIsChangePasswordOpen(true)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                Change Password
              </button>
              <button
                type="button"
                onClick={() => navigate('/login-history')}
                className="px-3 py-1.5 rounded-lg border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <History className="w-3.5 h-3.5 text-slate-500" />
                Login History
              </button>
            </div>
          </Card>
        </div>

        {/* Team Leadership Command Hub */}
        <Card className="p-5 border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b pb-2.5">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
              <Users className="w-4 h-4 text-teal-600" />
              <span>Team Leadership & Delegation Hub</span>
            </div>
            <span className="text-[11px] text-slate-400">Department Direct Access</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => navigate('/teams/my')}
              className="p-3.5 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50/40 text-left transition-all group cursor-pointer"
            >
              <Users className="w-4 h-4 text-slate-600 group-hover:text-teal-600 mb-1.5 transition-colors" />
              <span className="text-xs font-bold text-slate-800 block">My Team Roster</span>
              <span className="text-[10px] text-slate-400 block">Subordinate details & shifts</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/delegations')}
              className="p-3.5 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50/40 text-left transition-all group cursor-pointer"
            >
              <Shield className="w-4 h-4 text-slate-600 group-hover:text-teal-600 mb-1.5 transition-colors" />
              <span className="text-xs font-bold text-slate-800 block">Approval Delegations</span>
              <span className="text-[10px] text-slate-400 block">Delegate review rights to peers</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/org-chart')}
              className="p-3.5 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50/40 text-left transition-all group cursor-pointer"
            >
              <Building2 className="w-4 h-4 text-slate-600 group-hover:text-teal-600 mb-1.5 transition-colors" />
              <span className="text-xs font-bold text-slate-800 block">Org Hierarchy</span>
              <span className="text-[10px] text-slate-400 block">Visual departmental tree</span>
            </button>
          </div>
        </Card>

        {/* Assigned Shift Timings */}
        <Card className="p-5 border-slate-200 space-y-3">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-xs border-b pb-2">
            <Clock className="w-4 h-4 text-teal-600" />
            <span>Assigned Shift & Department Hours</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[11px] text-slate-500 block">Shift Name</span>
              <span className="font-semibold text-slate-800 block mt-0.5">{employee.shiftId?.name || 'General Management'}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[11px] text-slate-500 block">Timings</span>
              <span className="font-mono font-semibold text-slate-800 block mt-0.5">
                {employee.shiftId ? `${employee.shiftId.startTime} - ${employee.shiftId.endTime}` : '09:00 - 18:00'}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[11px] text-slate-500 block">Grace Period</span>
              <span className="font-semibold text-slate-800 block mt-0.5">
                {employee.shiftId?.graceMinutes ? `${employee.shiftId.graceMinutes} mins` : '15 mins'}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[11px] text-slate-500 block">Schedule Type</span>
              <span className="font-semibold text-slate-800 block mt-0.5">{employee.shiftId?.type || 'Standard Fixed'}</span>
            </div>
          </div>
        </Card>

        {/* Coordinates & Banking */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Card className="p-5 border-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b pb-2.5">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                <MapPin className="w-4 h-4 text-teal-600" />
                <span>Personal Residential & Emergency</span>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Residential Address</span>
                <span className="font-semibold text-slate-900 text-right max-w-xs">
                  {employee.address?.street ? `${employee.address.street}, ${employee.address.city}` : 'Not Specified'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Emergency Contact</span>
                <span className="font-semibold text-slate-900">
                  {employee.emergencyContact?.name || 'Not Specified'}{' '}
                  {employee.emergencyContact?.relationship ? `(${employee.emergencyContact.relationship})` : ''}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Emergency Phone</span>
                <span className="font-mono font-semibold text-slate-900">{employee.emergencyContact?.phone || 'Not Specified'}</span>
              </div>
            </div>
          </Card>

          <Card className="p-5 border-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b pb-2.5">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                <CreditCard className="w-4 h-4 text-teal-600" />
                <span>Payroll Bank Coordinates</span>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Bank Name</span>
                <span className="font-semibold text-slate-900">{employee.bankDetails?.bankName || 'Not Set'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Account Title</span>
                <span className="font-semibold text-slate-900">{employee.bankDetails?.accountTitle || 'Not Set'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Account Number</span>
                <span className="font-mono font-semibold text-slate-900">{employee.bankDetails?.accountNumber || '—'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">IBAN</span>
                <span className="font-mono font-semibold text-teal-700">{employee.bankDetails?.iban || '—'}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Skills Taxonomy */}
        <Card className="p-5 border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
              <Tag className="w-4 h-4 text-teal-600" />
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
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200"
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
              placeholder="Add skill (e.g. Leadership, Agile, Strategic Planning)..."
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              className="flex-1 text-xs px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
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

        {/* Modals */}
        <ChangeRequestModal
          isOpen={isChangeRequestOpen}
          onClose={() => setIsChangeRequestOpen(false)}
          currentEmployee={employee}
        />
        <TwoFactorModal
          isOpen={is2faModalOpen}
          onClose={() => {
            setIs2faModalOpen(false);
            refetch();
          }}
          user={{ ...user, twoFactorEnabled: is2faActive }}
        />
        <ChangePasswordModal
          isOpen={isChangePasswordOpen}
          onClose={() => setIsChangePasswordOpen(false)}
        />
      </div>
    );
  }

  // =========================================================================
  // 4. STANDARD EMPLOYEE SELF-SERVICE PROFILE VIEW
  // =========================================================================
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
          {renderAvatarUploadBlock(
            null,
            'border-emerald-300',
            'w-16 h-16'
          )}

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

      {/* Security & Account Protection (Self-Service) */}
      <Card className="p-5 border-slate-200 space-y-4">
        <div className="flex items-center justify-between border-b pb-2">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Security & Authentication Credentials</span>
          </div>
          <span className="text-[11px] text-slate-400">Account Defense</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-700 block">Account Password</span>
                <span className="text-[10px] text-slate-400">PBAC Scope: Self-Service Only (`scope: own`)</span>
              </div>
              <button
                type="button"
                onClick={() => setIsChangePasswordOpen(true)}
                className="px-2.5 py-1 rounded-lg border border-slate-200 hover:border-emerald-500 hover:bg-white text-emerald-700 text-[11px] font-semibold transition-all cursor-pointer"
              >
                Change Password
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              Regularly updating your password safeguards your corporate access.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">Two-Factor Authentication</span>
                {is2faActive ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    Active
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                    Disabled
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIs2faModalOpen(true)}
                className="px-2.5 py-1 rounded-lg border border-slate-200 hover:border-emerald-500 hover:bg-white text-emerald-700 text-[11px] font-semibold transition-all cursor-pointer"
              >
                {is2faActive ? 'Manage 2FA' : 'Enable 2FA'}
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              Enforce a one-time verification code on every account login.
            </p>
          </div>
        </div>

        <div className="pt-1 flex items-center justify-between text-xs">
          <span className="text-slate-500">Track recent session and device sign-in activity:</span>
          <button
            type="button"
            onClick={() => navigate('/login-history')}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
          >
            <History className="w-3.5 h-3.5" /> View Login History
          </button>
        </div>
      </Card>

      {/* Employee Quick Access Portal */}
      <Card className="p-5 border-slate-200 space-y-4">
        <div className="flex items-center justify-between border-b pb-2.5">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
            <Award className="w-4 h-4 text-emerald-600" />
            <span>Employee Self-Service Navigation</span>
          </div>
          <span className="text-[11px] text-slate-400">Quick Links</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => navigate('/org-chart')}
            className="p-3.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 text-left transition-all group cursor-pointer flex items-center justify-between"
          >
            <div>
              <span className="text-xs font-bold text-slate-800 block">Organization Chart</span>
              <span className="text-[10px] text-slate-400 block">Explore company departments & reporting lines</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
          </button>

          <button
            type="button"
            onClick={() => navigate('/policies')}
            className="p-3.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 text-left transition-all group cursor-pointer flex items-center justify-between"
          >
            <div>
              <span className="text-xs font-bold text-slate-800 block">Company Policies</span>
              <span className="text-[10px] text-slate-400 block">Working hours, late rules & code of conduct</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
          </button>
        </div>
      </Card>

      {/* Modals */}
      <ChangeRequestModal
        isOpen={isChangeRequestOpen}
        onClose={() => setIsChangeRequestOpen(false)}
        currentEmployee={employee}
      />
      <TwoFactorModal
        isOpen={is2faModalOpen}
        onClose={() => {
          setIs2faModalOpen(false);
          refetch();
        }}
        user={{ ...user, twoFactorEnabled: is2faActive }}
      />
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </div>
  );
}

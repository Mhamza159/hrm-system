/**
 * @file MyProfilePage.jsx
 * @description Master Self-Service Portal & Identity Governance across all system personas.
 * 
 * SPECIFICATION & ARCHITECTURE:
 * - Module: M3 Employee Management / M1 Identity & Authorization
 * - Personas: Super Admin (Root), HR Manager (People Operations), Department Manager (Team Lead), Staff Employee (Self-Service)
 * - Design Archetype: Forest & Emerald Enterprise Craft (#111D17 surface, #1A3125 border, #00C471 accent)
 * - PBAC Enforcement: Protected financial/identity mutations require Change Request approval.
 */

import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { toast } from 'sonner';
import { FileEdit, AlertCircle, CreditCard } from 'lucide-react';

import { useAuth } from '../../../hooks/useAuth.js';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { ScreenSkeleton } from '../../../components/common/ScreenSkeleton.jsx';
import { RefreshButton } from '../../../components/common/RefreshButton.jsx';
import { ChangeRequestModal } from '../components/ChangeRequestModal.jsx';
import { MyChangeRequestsTab } from '../components/change-requests/MyChangeRequestsTab.jsx';
import { TwoFactorModal } from '../../auth/components/TwoFactorModal.jsx';
import { ChangePasswordModal } from '../../auth/components/ChangePasswordModal.jsx';
import { EmployeeIdCardModal } from '../components/EmployeeIdCardModal.jsx';
import { updateUser } from '../../auth/authSlice.js';
import {
  useGetMyProfileQuery,
  useUpdateSkillsMutation,
  useUploadAvatarMutation
} from '../employeesApi.js';

// Sub-components
import { ProfileHeader } from '../components/profile/ProfileHeader.jsx';
import { PersonalInfoCard } from '../components/profile/PersonalInfoCard.jsx';
import { EmploymentDetailsCard } from '../components/profile/EmploymentDetailsCard.jsx';
import { AccountSecurityCard } from '../components/profile/AccountSecurityCard.jsx';
import { SkillsQualificationsCard } from '../components/profile/SkillsQualificationsCard.jsx';
import { PayrollBankCard } from '../components/profile/PayrollBankCard.jsx';
import { RoleGovernanceCard } from '../components/profile/RoleGovernanceCard.jsx';

export default function MyProfilePage() {
  const dispatch = useDispatch();
  const { user, hasRole } = useAuth();
  const { data: profileData, isLoading, error, refetch } = useGetMyProfileQuery();
  const [updateSkills, { isLoading: isUpdatingSkills }] = useUpdateSkillsMutation();
  const [uploadAvatar, { isLoading: isUploadingAvatar }] = useUploadAvatarMutation();

  const [isChangeRequestOpen, setIsChangeRequestOpen] = useState(false);
  const [is2faModalOpen, setIs2faModalOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isIdCardOpen, setIsIdCardOpen] = useState(false);

  const employee = profileData?.data;

  // Granular role persona derivation
  const isSuperAdminRole = hasRole('Super Admin');
  const isHRRole = !isSuperAdminRole && hasRole('HR Manager');
  const isDeptManagerRole = !isSuperAdminRole && !isHRRole && hasRole('Department Manager');

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

  // Avatar Upload Handler
  const handleUploadAvatar = async (file) => {
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
    }
  };

  // Add Skill Handler
  const handleAddSkill = async (newSkill) => {
    const trimmed = newSkill.trim();
    if (!trimmed) return;

    const currentSkills = employee?.skills || [];
    if (currentSkills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      toast.error('Skill is already added');
      return;
    }

    const updatedSkills = [...currentSkills, trimmed];
    try {
      await updateSkills({
        id: isSuperAdminRole && employee?._id ? employee._id : null,
        skills: updatedSkills
      }).unwrap();
      refetch();
      toast.success(`Skill "${trimmed}" added`);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to add skill');
    }
  };

  // Remove Skill Handler
  const handleRemoveSkill = async (skillToRemove) => {
    const currentSkills = employee?.skills || [];
    const updatedSkills = currentSkills.filter((s) => s !== skillToRemove);
    try {
      await updateSkills({
        id: isSuperAdminRole && employee?._id ? employee._id : null,
        skills: updatedSkills
      }).unwrap();
      refetch();
      toast.success(`Skill "${skillToRemove}" removed`);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to remove skill');
    }
  };

  if (isLoading) {
    return <ScreenSkeleton type="profile" />;
  }

  if (error) {
    return (
      <div className="p-8 text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-slate-800">Unable to load profile</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          {error?.data?.message || 'Failed to retrieve profile data from server.'}
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold cursor-pointer"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Page title & subtitle based on persona
  const pageTitle = isSuperAdminRole
    ? 'Executive Profile & Platform Governance'
    : isHRRole
    ? 'HR Executive & People Operations Profile'
    : isDeptManagerRole
    ? 'Department Leadership & Operations Profile'
    : 'My Employee Profile';

  const pageSubtitle = isSuperAdminRole
    ? 'System Owner & Root Authority • Master Access & Configuration Control.'
    : isHRRole
    ? 'Enterprise Workforce Governance, Employment Contracts & Operations Oversight.'
    : isDeptManagerRole
    ? 'Departmental Leadership, Team Governance & Approval Delegations.'
    : 'Personal Identity, Organizational Assignment, Shift Timings & Account Credentials.';

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Page Header */}
      <PageHeader
        title={pageTitle}
        subtitle={pageSubtitle}
        action={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsIdCardOpen(true)}
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] hover:bg-slate-50 dark:hover:bg-[#162820] text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="View and print your official corporate ID credential"
            >
              <CreditCard className="w-4 h-4 text-[#00C471]" /> My ID Card
            </button>
            {!isSuperAdminRole && (
              <button
                type="button"
                onClick={() => setIsChangeRequestOpen(true)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] hover:bg-slate-50 dark:hover:bg-[#162820] text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <FileEdit className="w-4 h-4 text-[#00C471]" /> Request Info Update
              </button>
            )}
            <RefreshButton onRefresh={refetch} />
          </div>
        }
      />

      {/* Hero Banner with Avatar & Primary Badges */}
      <ProfileHeader
        employee={employee}
        user={user}
        isSuperAdminRole={isSuperAdminRole}
        isHRRole={isHRRole}
        isDeptManagerRole={isDeptManagerRole}
        onUploadAvatar={handleUploadAvatar}
        isUploadingAvatar={isUploadingAvatar}
      />

      {/* Responsive Two-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Column: Personal, Employment & Financials */}
        <div className="space-y-6">
          <PersonalInfoCard
            employee={employee}
            user={user}
            isSuperAdminRole={isSuperAdminRole}
            onRequestChange={() => setIsChangeRequestOpen(true)}
          />

          <EmploymentDetailsCard
            employee={employee}
            isSuperAdminRole={isSuperAdminRole}
            isHRRole={isHRRole}
            isDeptManagerRole={isDeptManagerRole}
          />

          {!isSuperAdminRole && (
            <PayrollBankCard
              bankDetails={employee?.bankDetails}
              emergencyContact={employee?.emergencyContact}
              onRequestChange={() => setIsChangeRequestOpen(true)}
            />
          )}
        </div>

        {/* Right Column: Security, Governance & Skills */}
        <div className="space-y-6">
          <AccountSecurityCard
            user={user}
            employee={employee}
            is2faActive={is2faActive}
            onOpen2faModal={() => setIs2faModalOpen(true)}
            onOpenChangePasswordModal={() => setIsChangePasswordOpen(true)}
          />

          <RoleGovernanceCard
            isSuperAdminRole={isSuperAdminRole}
            isHRRole={isHRRole}
            isDeptManagerRole={isDeptManagerRole}
          />

          {!isSuperAdminRole && (
            <SkillsQualificationsCard
              skills={employee?.skills || []}
              onAddSkill={handleAddSkill}
              onRemoveSkill={handleRemoveSkill}
              isUpdating={isUpdatingSkills}
            />
          )}
        </div>
      </div>

      {/* Self-Service Change Requests History Section */}
      {!isSuperAdminRole && (
        <div className="pt-2">
          <MyChangeRequestsTab currentEmployee={employee} />
        </div>
      )}

      {/* Interactive Modals */}
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

      {/* Official Self-Service Employee ID Card Modal (Phase 36) */}
      <EmployeeIdCardModal
        isSelf={true}
        isOpen={isIdCardOpen}
        onClose={() => setIsIdCardOpen(false)}
      />
    </div>
  );
}

/**
 * @file EmployeeProfilePage.jsx
 * @description Comprehensive Master Profile View with Modular Tabbed Navigation.
 * 
 * SPECIFICATION & ACCESS CONTROL:
 * - Module: M3 Employee Management (BUILD-GUIDE Section 8 · Rows 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11)
 * - Tabs: Overview, Documents, Career History, Compensation.
 * - CASL Authorization: Field-level masking, permission guards for edit and status changes.
 */

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  User,
  Briefcase,
  FileText,
  Clock,
  Calendar,
  CreditCard,
  Edit,
  ShieldAlert,
  Trash2,
  Building2,
  TrendingUp,
  Loader2,
  ArrowLeft
} from 'lucide-react';

import {
  useGetEmployeeByIdQuery,
  useDeleteEmployeeMutation
} from '../employeesApi.js';
import { useAuth } from '../../../hooks/useAuth.js';
import { usePermission } from '../../../hooks/usePermission.js';
import { Card } from '../../../components/common/Card.jsx';
import { StatusBadge } from '../../../components/common/StatusBadge.jsx';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog.jsx';
import { Can } from '../../../components/common/Can.jsx';
import { ProfileOverviewTab } from '../components/ProfileOverviewTab.jsx';
import { ProfileDocumentsTab } from '../components/ProfileDocumentsTab.jsx';
import { ProfileHistoryTab } from '../components/ProfileHistoryTab.jsx';
import { ProfileSalaryTab } from '../components/ProfileSalaryTab.jsx';
import { StatusChangeModal } from '../components/StatusChangeModal.jsx';
import { cn } from '../../../lib/utils.js';

export default function EmployeeProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isHR, isSuperAdmin } = useAuth();
  const { can } = usePermission();

  const [activeTab, setActiveTab] = useState('overview');
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isArchiveConfirmOpen, setIsArchiveConfirmOpen] = useState(false);

  const { data: employeeData, isLoading, error } = useGetEmployeeByIdQuery(id);
  const [deleteEmployee, { isLoading: isDeleting }] = useDeleteEmployeeMutation();

  const employee = employeeData?.data;

  const isOwn =
    String(employee?.userId?._id || employee?.userId) === String(user?._id) ||
    String(employee?._id) === String(user?.employeeId);

  const isTargetSuperAdmin =
    employee?.email === 'admin@hrm.company.pk' ||
    employee?.employeeCode === 'EMP-000';

  const canManage = (isSuperAdmin || isHR) && (!isTargetSuperAdmin || isSuperAdmin);
  const canViewFinancials = canManage || isOwn;

  const handleArchive = async () => {
    try {
      await deleteEmployee(id).unwrap();
      toast.success('Employee archived successfully');
      navigate('/employees');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to archive employee');
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
      <div className="p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-800">Unable to load employee profile</h3>
        <p className="text-xs text-slate-500">
          {error?.data?.message || 'The requested profile does not exist or access is restricted.'}
        </p>
        <button
          type="button"
          onClick={() => navigate('/employees')}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white"
        >
          Return to Directory
        </button>
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
    : 'EM';

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Back button */}
      <button
        type="button"
        onClick={() => navigate('/employees')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Employee Directory
      </button>

      {/* Header Profile Hero Card */}
      <Card className="p-6 border-slate-200">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#061A14] to-[#0C2A20] text-[#00C471] font-bold text-xl flex items-center justify-center shrink-0 border-2 border-[#00C471]/30 shadow-md">
              {initials}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg font-bold text-slate-900">{employee.name}</h2>
                <span className="font-mono text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  {employee.employeeCode}
                </span>
                <StatusBadge status={employee.status} />
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                  {employee.designationId?.title || 'Designation Unassigned'}
                  {employee.designationId?.grade && ` (${employee.designationId.grade})`}
                </span>
                <span>•</span>
                <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  {employee.departmentId?.name || 'Department Unassigned'}
                </span>
                <span>•</span>
                <span>{employee.email || '—'}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 self-end md:self-center">
            <Can I="employee.edit" a="Employee">
              <button
                type="button"
                onClick={() => setIsStatusModalOpen(true)}
                className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                Change Status
              </button>

              <button
                type="button"
                onClick={() => navigate(`/employees/${id}/edit`)}
                className="px-3.5 py-2 rounded-xl bg-[#00C471] hover:bg-[#049856] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5" /> Edit Profile
              </button>
            </Can>

            <Can I="employee.delete" a="Employee">
              <button
                type="button"
                onClick={() => setIsArchiveConfirmOpen(true)}
                className="p-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                title="Archive Employee"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </Can>
          </div>
        </div>

        {/* Tab Header Navigation */}
        <div className="flex items-center gap-1 border-t border-slate-100 mt-6 pt-2 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview', icon: User },
            { id: 'documents', label: 'Document Vault', icon: FileText, count: employee.documents?.length || 0 },
            { id: 'history', label: 'Career History', icon: TrendingUp },
            ...(canManage
              ? [{ id: 'salary', label: 'Salary Structure', icon: CreditCard }]
              : [])
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border',
                  isActive
                    ? 'bg-[#00C471]/10 text-[#00C471] border-[#00C471]/30 font-bold shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 border-transparent'
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {typeof tab.count === 'number' && (
                  <span
                    className={cn(
                      'px-1.5 py-0.2 rounded-full text-[10px] font-mono',
                      isActive ? 'bg-[#00C471] text-white' : 'bg-slate-100 text-slate-600'
                    )}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Tab Panels */}
      <div>
        {activeTab === 'overview' && (
          <ProfileOverviewTab
            employee={employee}
            isOwn={isOwn}
            canViewFinancials={canViewFinancials}
          />
        )}

        {activeTab === 'documents' && (
          <ProfileDocumentsTab
            employeeId={id}
            documents={employee.documents || []}
            canManage={canManage}
          />
        )}

        {activeTab === 'history' && (
          <ProfileHistoryTab
            employeeId={id}
            canManage={canManage}
          />
        )}

        {activeTab === 'salary' && canManage && (
          <ProfileSalaryTab
            employee={employee}
            canView={canManage}
          />
        )}
      </div>

      {/* Status Transition Modal */}
      <StatusChangeModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        employeeId={id}
        currentStatus={employee.status}
      />

      {/* Archive Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isArchiveConfirmOpen}
        title="Archive Employee"
        message={`Are you sure you want to archive ${employee.name}? Their login will be disabled.`}
        confirmText="Archive"
        confirmVariant="danger"
        isLoading={isDeleting}
        onConfirm={handleArchive}
        onClose={() => setIsArchiveConfirmOpen(false)}
      />
    </div>
  );
}

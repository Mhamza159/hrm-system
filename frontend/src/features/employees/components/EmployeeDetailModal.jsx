/**
 * @file EmployeeDetailModal.jsx
 * @description Comprehensive 10-Section Employee Inspection Sheet & Action Modal.
 * 
 * SPECIFICATION & DATA SECTIONS:
 * - Module: M3 Employee Management / Profile Sheet
 * - 10 Structured Tabs:
 *   1. Overview
 *   2. Personal Information
 *   3. Employment Details
 *   4. Department & Designation
 *   5. Reporting Structure
 *   6. Contact Coordinates
 *   7. Document Vault
 *   8. Career History
 *   9. Account & Security
 *   10. Financial Coordinates (PBAC Protected)
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  User,
  Building2,
  Briefcase,
  Phone,
  FileText,
  History,
  ShieldCheck,
  CreditCard,
  UserCheck,
  AlertTriangle,
  Download,
  KeyRound,
  Edit,
  ShieldAlert,
  Trash2,
  RotateCcw,
  ExternalLink
} from 'lucide-react';
import { StatusBadge } from '../../../components/common/StatusBadge.jsx';
import { Can } from '../../../components/common/Can.jsx';
import { useAuth } from '../../../hooks/useAuth.js';
import { usePermission } from '../../../hooks/usePermission.js';
import { formatDate, formatCNIC, maskCNIC } from '../../../lib/formatters.js';
import { openSecureFile } from '../../../utils/fileHelper.js';
import { useGetEmployeeByIdQuery } from '../employeesApi.js';

const TABS = [
  { id: 'overview', label: 'Overview', icon: User },
  { id: 'personal', label: 'Personal', icon: UserCheck },
  { id: 'employment', label: 'Employment', icon: Briefcase },
  { id: 'department', label: 'Department & Role', icon: Building2 },
  { id: 'contact', label: 'Contact & Address', icon: Phone },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'history', label: 'History', icon: History },
  { id: 'account', label: 'Account & 2FA', icon: ShieldCheck },
  { id: 'financials', label: 'Financials', icon: CreditCard }
];

export function EmployeeDetailModal({
  isOpen,
  onClose,
  employee: initialEmployee,
  onEdit,
  onChangeStatus,
  onResetPassword,
  onArchive,
  onRestore,
  isArchived = false
}) {
  const navigate = useNavigate();
  const { user, isSuperAdmin, isHR } = useAuth();
  const { can } = usePermission();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: detailRes } = useGetEmployeeByIdQuery(initialEmployee?._id, {
    skip: !isOpen || !initialEmployee?._id
  });

  const employee = detailRes?.data || initialEmployee;

  const isOwn = Boolean(
    employee &&
    (String(employee.userId?._id || employee.userId) === String(user?._id) ||
     String(employee._id) === String(user?.employeeId))
  );

  const canViewFinancials =
    isSuperAdmin || isHR || isOwn || can('employee.salary.view', 'Employee');

  const visibleTabs = useMemo(() => {
    return TABS.filter((t) => {
      if (t.id === 'financials') return canViewFinancials;
      return true;
    });
  }, [canViewFinancials]);

  // Fallback to overview if activeTab is hidden
  useEffect(() => {
    if (activeTab === 'financials' && !canViewFinancials) {
      setActiveTab('overview');
    }
  }, [activeTab, canViewFinancials]);

  if (!isOpen || !employee) return null;

  const isRowSuperAdmin =
    employee.employeeCode === 'EMP-000' ||
    employee.email === 'admin@hrm.company.pk' ||
    employee.email === 'mhamzaofficial159@gmail.com';

  const initials = employee.name
    ? employee.name
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'EM';

  const desig = employee.designationId;

  // Address string
  const addressString = employee.address?.street
    ? [
        employee.address.street,
        employee.address.city,
        employee.address.state,
        employee.address.postalCode,
        employee.address.country || 'Pakistan'
      ]
        .filter(Boolean)
        .join(', ')
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#111D17] rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 dark:border-[#1A3125] overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Modal Top Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#0B1A13] via-[#11241B] to-[#0A1811] p-6 text-white border-b border-[#1A3125] shrink-0">
          <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-[#00C471]/15 blur-2xl pointer-events-none" />

          <div className="relative z-10 flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              {employee.avatar ? (
                <img
                  src={employee.avatar}
                  alt={employee.name}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-[#1A3125] shadow-md shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#047857] to-[#00C471] text-slate-950 font-black text-xl flex items-center justify-center shrink-0 shadow-md">
                  {initials}
                </div>
              )}

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg md:text-xl font-bold tracking-tight text-white">
                    {employee.name}
                  </h2>
                  <span className="font-mono text-xs font-bold text-[#00C471] bg-[#00C471]/15 border border-[#00C471]/30 px-2.5 py-0.5 rounded-md">
                    {employee.employeeCode}
                  </span>
                  <StatusBadge status={employee.status || 'Active'} />
                </div>

                <p className="text-xs text-slate-300">
                  {desig?.title || 'Designation Unassigned'} •{' '}
                  {employee.departmentId?.name || 'Department Unassigned'}
                </p>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-1">
                  <span>{employee.email || '—'}</span>
                  {employee.phone && <span>• {employee.phone}</span>}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tab Bar */}
          <div className="flex items-center gap-1 overflow-x-auto pt-6 border-t border-white/10 mt-4 -mb-2 scrollbar-none">
            {visibleTabs.map((tab) => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-[#00C471] text-slate-950 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <TabIcon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content Body (Scrollable) */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs flex-1">
          {/* 1. OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Alert: Probation */}
              {employee.status === 'Probation' && employee.probationEndDate && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center gap-3 text-amber-800 dark:text-amber-200">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <div>
                    <span className="font-bold block">Probationary Period Active</span>
                    <span>
                      Evaluation scheduled on {formatDate(employee.probationEndDate)}. Performance confirmation required.
                    </span>
                  </div>
                </div>
              )}

              {/* Grid: At a Glance */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#162820]/40 space-y-2">
                  <span className="font-bold text-slate-900 dark:text-white block border-b border-slate-200/60 dark:border-[#1A3125] pb-1.5">
                    Job Assignment
                  </span>
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Department</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {employee.departmentId?.name || 'Unassigned'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Designation</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {desig?.title || 'Unassigned'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Reporting Manager</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {employee.managerId ? employee.managerId.name : 'Executive Line'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Shift</span>
                      <span className="font-mono text-[#00C471]">
                        {employee.shiftId ? `${employee.shiftId.startTime} - ${employee.shiftId.endTime}` : 'General Shift'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#162820]/40 space-y-2">
                  <span className="font-bold text-slate-900 dark:text-white block border-b border-slate-200/60 dark:border-[#1A3125] pb-1.5">
                    Key Identifiers
                  </span>
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Employee Code</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        {employee.employeeCode}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Joining Date</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {formatDate(employee.joiningDate)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">National ID (CNIC)</span>
                      <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                        {canViewFinancials ? formatCNIC(employee.cnic) : maskCNIC(employee.cnic)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Employment Type</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {employee.employmentType || 'Permanent'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Skills taxonomy chips */}
              {employee.skills?.length > 0 && (
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#162820]/40 space-y-2">
                  <span className="font-bold text-slate-900 dark:text-white block">
                    Competencies & Skills
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {employee.skills.map((skill) => (
                      <span
                        key={skill}
                        className="px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-[#162820] text-emerald-700 dark:text-[#00C471] border border-emerald-200 dark:border-emerald-900/60"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. PERSONAL TAB */}
          {activeTab === 'personal' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-[#1A3125] space-y-2.5">
                <span className="font-bold text-slate-900 dark:text-white block border-b border-slate-100 dark:border-[#1A3125] pb-1.5">
                  Identity Details
                </span>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Full Legal Name</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{employee.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">CNIC Number</span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {canViewFinancials ? formatCNIC(employee.cnic) : maskCNIC(employee.cnic)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">CNIC Expiry</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {employee.cnicExpiry ? formatDate(employee.cnicExpiry) : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Date of Birth</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {employee.dob ? formatDate(employee.dob) : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Gender</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{employee.gender || '—'}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-slate-200 dark:border-[#1A3125] space-y-2.5">
                <span className="font-bold text-slate-900 dark:text-white block border-b border-slate-100 dark:border-[#1A3125] pb-1.5">
                  Residential Coordinates
                </span>
                <div className="space-y-2">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block mb-0.5">Full Address</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 leading-relaxed block">
                      {addressString || 'No residential address recorded'}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-slate-500 dark:text-slate-400">City / Province</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {employee.address?.city ? `${employee.address.city}, ${employee.address.state || 'Pakistan'}` : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Postal Code</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200">
                      {employee.address?.postalCode || '—'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. EMPLOYMENT TAB */}
          {activeTab === 'employment' && (
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-[#1A3125] space-y-3">
              <span className="font-bold text-slate-900 dark:text-white block border-b border-slate-100 dark:border-[#1A3125] pb-2">
                Contract & Timeline Parameters
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Employment Status</span>
                    <StatusBadge status={employee.status || 'Active'} />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Employment Type</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{employee.employmentType || 'Permanent'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Joining Date</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{formatDate(employee.joiningDate)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Probation End Date</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {employee.probationEndDate ? formatDate(employee.probationEndDate) : 'Confirmed'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Shift Name</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{employee.shiftId?.name || 'General Shift'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Grace Minutes</span>
                    <span className="font-semibold text-[#00C471]">{employee.shiftId?.graceMinutes || 15} minutes</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4. DEPARTMENT & ROLE TAB */}
          {activeTab === 'department' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-[#1A3125] space-y-2">
                <span className="font-bold text-slate-900 dark:text-white block border-b border-slate-100 dark:border-[#1A3125] pb-1.5">
                  Department Information
                </span>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Department Name</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{employee.departmentId?.name || 'Unassigned'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Department Code</span>
                    <span className="font-mono text-[#00C471]">{employee.departmentId?.code || '—'}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-slate-200 dark:border-[#1A3125] space-y-2">
                <span className="font-bold text-slate-900 dark:text-white block border-b border-slate-100 dark:border-[#1A3125] pb-1.5">
                  Designation & Hierarchy
                </span>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Job Title</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{desig?.title || 'Unassigned'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Designation Code</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200">{desig?.code || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Grade Tier</span>
                    <span className="font-semibold text-[#00C471]">{desig?.grade || 'Standard'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 5. CONTACT TAB */}
          {activeTab === 'contact' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-[#1A3125] space-y-2">
                <span className="font-bold text-slate-900 dark:text-white block border-b border-slate-100 dark:border-[#1A3125] pb-1.5">
                  Direct Contact
                </span>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Official Email</span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{employee.email || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Phone Number</span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{employee.phone || '—'}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-slate-200 dark:border-[#1A3125] space-y-2">
                <span className="font-bold text-slate-900 dark:text-white block border-b border-slate-100 dark:border-[#1A3125] pb-1.5">
                  Emergency Contact
                </span>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Contact Person</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{employee.emergencyContact?.name || 'Not Registered'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Relationship</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{employee.emergencyContact?.relationship || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Emergency Phone</span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{employee.emergencyContact?.phone || '—'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 6. DOCUMENTS TAB */}
          {activeTab === 'documents' && (
            <div className="space-y-3">
              {(!employee.documents || employee.documents.length === 0) ? (
                <div className="p-8 text-center border border-dashed border-slate-200 dark:border-[#1A3125] rounded-2xl text-slate-400 dark:text-slate-500">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-50 text-[#00C471]" />
                  <p>No documents uploaded in the employee vault.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {employee.documents.map((doc) => (
                    <div
                      key={doc._id}
                      className="p-3.5 rounded-2xl border border-slate-200 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#162820]/40 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-white dark:bg-[#0B1A13] border border-slate-200 dark:border-[#1A3125] flex items-center justify-center text-[#00C471] shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-slate-800 dark:text-slate-100 block truncate">
                            {doc.title || doc.fileName}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            {doc.type} • {formatDate(doc.uploadedAt)}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => openSecureFile(doc.fileUrl)}
                        className="p-2 rounded-lg border border-slate-200 dark:border-[#1A3125] hover:border-[#00C471] hover:bg-emerald-50 dark:hover:bg-[#162820] text-emerald-700 dark:text-[#00C471] transition-colors shrink-0 cursor-pointer"
                        title="Download / View Document"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 7. HISTORY TAB */}
          {activeTab === 'history' && (
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-[#1A3125] space-y-3">
              <span className="font-bold text-slate-900 dark:text-white block border-b border-slate-100 dark:border-[#1A3125] pb-2">
                Organizational Career Transitions
              </span>
              <p className="text-slate-500 dark:text-slate-400 text-xs">
                To inspect complete career transitions, promotions, and compensation changes, navigate to the comprehensive profile view.
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate(`/employees/${employee._id}`);
                }}
                className="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-[#162820] text-emerald-700 dark:text-[#00C471] border border-emerald-200 dark:border-emerald-900/60 font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Open Full Career Timeline
              </button>
            </div>
          )}

          {/* 8. ACCOUNT TAB */}
          {activeTab === 'account' && (
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-[#1A3125] space-y-3">
              <span className="font-bold text-slate-900 dark:text-white block border-b border-slate-100 dark:border-[#1A3125] pb-2">
                Authentication & Security Governance
              </span>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Linked Account Status</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {employee.userId ? 'Active Linked User' : 'No Account Provisioned'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Two-Factor Authentication (2FA)</span>
                  <span className="font-semibold text-[#00C471]">
                    {employee.userId?.twoFactorEnabled ? 'Active & Protected' : 'Disabled'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Last Sign-In</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {employee.userId?.lastLoginAt ? formatDate(employee.userId.lastLoginAt) : 'Never'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 9. FINANCIALS TAB */}
          {canViewFinancials && activeTab === 'financials' && (
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-[#1A3125] space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1A3125] pb-2">
                <span className="font-bold text-slate-900 dark:text-white">
                  Payroll Coordinates
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Bank Name</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {employee.bankDetails?.bankName || 'Not Set'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Account Title</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {employee.bankDetails?.accountTitle || 'Not Set'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Account Number</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">
                    {canViewFinancials ? employee.bankDetails?.accountNumber || '—' : '••••••••••••'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">IBAN</span>
                  <span className="font-mono font-bold text-[#00C471]">
                    {canViewFinancials ? employee.bankDetails?.iban || '—' : '••••••••••••••••'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Action Footer */}
        <div className="p-4 bg-slate-50 dark:bg-[#0B1A13] border-t border-slate-200 dark:border-[#1A3125] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate(`/employees/${employee._id}`);
              }}
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] hover:bg-slate-100 dark:hover:bg-[#162820] text-slate-700 dark:text-slate-200 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Full Profile Page
            </button>
          </div>

          <div className="flex items-center gap-2">
            {isArchived ? (
              <Can I="employee.delete" a="Employee">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onRestore(employee);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-[#162820] text-emerald-700 dark:text-[#00C471] border border-emerald-200 dark:border-emerald-900/60 font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Revert Archive
                </button>
              </Can>
            ) : (
              <>
                <Can I="user.manage" a="User">
                  {employee.userId && (!isRowSuperAdmin || isSuperAdmin) && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onResetPassword(employee);
                      }}
                      className="px-3 py-2 rounded-xl border border-amber-200 dark:border-amber-900/40 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <KeyRound className="w-3.5 h-3.5" /> Reset Password
                    </button>
                  )}
                </Can>

                <Can I="employee.edit" a="Employee">
                  {(!isRowSuperAdmin || isSuperAdmin) && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onChangeStatus(employee);
                        }}
                        className="px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#162820] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-500" /> Change Status
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onEdit(employee);
                        }}
                        className="px-3.5 py-2 rounded-xl bg-[#00C471] hover:bg-[#049856] text-slate-950 font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                      >
                        <Edit className="w-3.5 h-3.5" /> Edit Profile
                      </button>
                    </>
                  )}
                </Can>

                <Can I="employee.delete" a="Employee">
                  {!isRowSuperAdmin && onArchive && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onArchive(employee._id);
                      }}
                      className="px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Archive
                    </button>
                  )}
                </Can>
              </>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/10 font-semibold transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

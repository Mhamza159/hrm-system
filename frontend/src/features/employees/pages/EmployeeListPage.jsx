/**
 * @file EmployeeListPage.jsx
 * @description Enterprise Scoped Employee Directory & Faceted Management.
 * 
 * SPECIFICATION & INTEGRITY:
 * - Module: M3 Employee Management (BUILD-GUIDE Section 8 · Rows 3.4, 3.8, 3.14)
 * - Layer: Frontend Page Component (DataTable, Faceted filters, StatusBadges)
 * - Permissions: Guarded by CASL <Can> for Add, Edit, Delete, and Export.
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  UserPlus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  FileSpreadsheet,
  Building2,
  Shield,
  Briefcase,
  UploadCloud,
  KeyRound,
  RefreshCw,
  X,
  RotateCcw
} from 'lucide-react';

import {
  useGetEmployeesQuery,
  useDeleteEmployeeMutation
} from '../employeesApi.js';
import { useAdminResetPasswordMutation } from '../../auth/authApi.js';
import { useGetDepartmentsQuery } from '../../departments/departmentsApi.js';
import { useAuth } from '../../../hooks/useAuth.js';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { DataTable } from '../../../components/common/DataTable.jsx';
import { StatusBadge } from '../../../components/common/StatusBadge.jsx';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog.jsx';
import { Can } from '../../../components/common/Can.jsx';
import { cn } from '../../../lib/utils.js';

export default function EmployeeListPage() {
  const navigate = useNavigate();

  // Filters & Search state
  const [search, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Archive modal state
  const [deleteId, setDeleteId] = useState(null);
  const [resetTargetEmployee, setResetTargetEmployee] = useState(null);

  const { token, isSuperAdmin } = useAuth();
  const [isExporting, setIsExporting] = useState(false);

  // Queries
  const { data: deptData } = useGetDepartmentsQuery({ limit: 100 });
  const { data: empData, isLoading, isFetching, refetch } = useGetEmployeesQuery({
    page,
    limit,
    search: search.trim() || undefined,
    departmentId: selectedDept || undefined,
    status: selectedStatus || undefined
  });

  // Manual data reload handler
  const handleRefresh = async () => {
    try {
      const res = await refetch();
      if (res?.error) {
        toast.error('Failed to reload employees');
      } else {
        toast.success('Employee directory reloaded successfully');
      }
    } catch {
      toast.error('Network error while reloading');
    }
  };

  const gradeStyles = {
    Executive: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-300/80 dark:border-amber-500/30',
    Lead: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-300/80 dark:border-purple-500/30',
    Senior: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-300/80 dark:border-blue-500/30',
    Mid: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-300/80 dark:border-emerald-500/30',
    Junior: 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-300/80 dark:border-slate-700'
  };

  const [deleteEmployee, { isLoading: isDeleting }] = useDeleteEmployeeMutation();
  const [adminResetPassword, { isLoading: isResettingPassword }] = useAdminResetPasswordMutation();

  const departments = deptData?.data || [];
  const rawEmployees = empData?.data?.items || [];
  const employees = useMemo(() => {
    return rawEmployees.filter(
      (emp) =>
        emp.employeeCode !== 'EMP-000' &&
        emp.email !== 'admin@hrm.company.pk' &&
        emp.email !== 'mhamzaofficial159@gmail.com'
    );
  }, [rawEmployees]);
  const total = empData?.data?.total || 0;
  const totalPages = empData?.data?.totalPages || 1;

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const queryParams = new URLSearchParams();
      if (selectedDept) queryParams.append('departmentId', selectedDept);
      if (selectedStatus) queryParams.append('status', selectedStatus);

      const response = await fetch(`/api/v1/employees/export?${queryParams.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to export employee directory');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `employees-directory-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      toast.success('Employee directory exported successfully');
    } catch (err) {
      toast.error(err.message || 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const handleArchive = async () => {
    if (!deleteId) return;
    try {
      await deleteEmployee(deleteId).unwrap();
      toast.success('Employee archived successfully');
      setDeleteId(null);
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to archive employee');
    }
  };

  const handleListAdminReset = async () => {
    if (!resetTargetEmployee) return;
    const targetUserId =
      resetTargetEmployee.userId?._id ||
      (typeof resetTargetEmployee.userId === 'string'
        ? resetTargetEmployee.userId
        : null);

    if (!targetUserId) {
      toast.error('No linked user account found for this employee.');
      setResetTargetEmployee(null);
      return;
    }

    try {
      const response = await adminResetPassword(targetUserId).unwrap();
      toast.success(
        response?.message || 'Temporary password generated and emailed to employee successfully.'
      );
    } catch (err) {
      toast.error(
        err?.data?.message || err?.error || 'Failed to trigger emergency password reset.'
      );
    } finally {
      setResetTargetEmployee(null);
    }
  };

  const columns = [
    {
      key: 'employeeCode',
      header: 'Code',
      render: (row) => (
        <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-[#0A110D] px-2.5 py-1 rounded-md border border-slate-200 dark:border-[#1A3125]">
          {row.employeeCode}
        </span>
      )
    },
    {
      key: 'name',
      header: 'Employee Name & Email',
      render: (row) => {
        const initials = row.name
          ? row.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2)
          : 'EM';

        return (
          <div className="flex items-center gap-3">
            {row.avatar ? (
              <img
                src={row.avatar}
                alt={row.name}
                className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-200 dark:border-slate-700 shadow-2xs"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0 border border-emerald-200/80 dark:border-emerald-800/60 shadow-2xs">
                {initials}
              </div>
            )}
            <div className="min-w-0">
              <span className="block text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight truncate">
                {row.name}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal truncate block mt-0.5">
                {row.email || '—'}
              </span>
            </div>
          </div>
        );
      }
    },
    {
      key: 'departmentId',
      header: 'Department',
      render: (row) => (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300">
          <Building2 className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
          {row.departmentId?.name || 'Unassigned'}
        </span>
      )
    },
    {
      key: 'designationId',
      header: 'Designation & Grade',
      render: (row) => (
        <div className="space-y-1">
          <span className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
            {row.designationId?.title || '—'}
          </span>
          {row.designationId?.grade && (
            <span
              className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                gradeStyles[row.designationId.grade] || gradeStyles.Mid
              }`}
            >
              {row.designationId.grade}
            </span>
          )}
        </div>
      )
    },
    {
      key: 'shiftId',
      header: 'Shift Timing',
      render: (row) => (
        <span className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-[#0A110D] px-2 py-0.5 rounded-md border border-slate-200/80 dark:border-[#1A3125]">
          {row.shiftId ? `${row.shiftId.startTime} - ${row.shiftId.endTime}` : 'General Shift'}
        </span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => {
        const isRowSuperAdmin =
          row.employeeCode === 'EMP-000' ||
          row.email === 'admin@hrm.company.pk' ||
          row.email === 'mhamzaofficial159@gmail.com';
        if (isRowSuperAdmin && !isSuperAdmin) {
          return null;
        }

        return (
          <div className="flex items-center gap-1 justify-end">
            <button
              type="button"
              onClick={() => navigate(`/employees/${row._id}`)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="View Full Profile"
            >
              <Eye className="w-4 h-4" />
            </button>

            <Can I="employee.edit" a="Employee">
              <button
                type="button"
                onClick={() => navigate(`/employees/${row._id}/edit`)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
                title="Edit Profile"
              >
                <Edit className="w-4 h-4" />
              </button>
            </Can>

            <Can I="user.manage" a="User">
              {row.userId && !isRowSuperAdmin && (
                <button
                  type="button"
                  onClick={() => setResetTargetEmployee(row)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors cursor-pointer"
                  title="Reset Employee Password"
                >
                  <KeyRound className="w-4 h-4" />
                </button>
              )}
            </Can>

            <Can I="employee.delete" a="Employee">
              {!isRowSuperAdmin && (
                <button
                  type="button"
                  onClick={() => setDeleteId(row._id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                  title="Archive Employee"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </Can>
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employee Directory"
        description="Manage personnel profiles, organizational assignments, and workforce records."
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isFetching}
              title="Reload employee directory from database"
              className="inline-flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-[#15241C] shadow-xs transition-all cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-[#00C471]' : 'text-slate-400'}`} />
              <span>{isFetching ? 'Refreshing...' : 'Refresh'}</span>
            </button>

            <Can I="report.export" a="Report">
              <button
                type="button"
                onClick={handleExport}
                disabled={isExporting}
                className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] hover:bg-slate-50 dark:hover:bg-[#15241C] text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                {isExporting ? 'Exporting...' : 'Export to Excel'}
              </button>
            </Can>

            <Can I="employee.create" a="Employee">
              <button
                type="button"
                onClick={() => navigate('/employees/import')}
                className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] hover:bg-slate-50 dark:hover:bg-[#15241C] text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <UploadCloud className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Bulk Ingest
              </button>
              <button
                type="button"
                onClick={() => navigate('/employees/new')}
                className="px-4 py-2.5 rounded-xl bg-[#00C471] hover:bg-[#00ad64] text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <UserPlus className="w-4 h-4" /> Onboard Employee
              </button>
            </Can>
          </div>
        }
      />

      {/* Filter Toolbar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white dark:bg-[#111D17] p-3.5 rounded-2xl border border-slate-200 dark:border-[#1A3125] shadow-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by code, name, email..."
            value={search}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-8 py-2 rounded-xl bg-slate-50 dark:bg-[#0A110D] border border-slate-200 dark:border-[#1A3125] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00C471]/25 focus:border-[#00C471] transition-all"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto flex-wrap">
          <div className="relative">
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50 dark:bg-[#0A110D] text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00C471]/25 focus:border-[#00C471] cursor-pointer transition-all"
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept._id} value={dept._id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50 dark:bg-[#0A110D] text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00C471]/25 focus:border-[#00C471] cursor-pointer transition-all"
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Probation">Probation</option>
              <option value="Notice">Notice</option>
              <option value="Resigned">Resigned</option>
              <option value="Terminated">Terminated</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>

          {(search || selectedDept || selectedStatus) && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedDept('');
                setSelectedStatus('');
              }}
              className="flex items-center gap-1 text-xs px-2.5 py-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
              title="Reset all filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Main DataTable */}
      <DataTable
        columns={columns}
        data={employees}
        isLoading={isLoading}
        showSearch={false}
        emptyMessage="No employees found matching the specified filters."
        pagination={{
          page,
          limit,
          totalPages,
          totalDocs: total,
          onPageChange: (newPage) => setPage(newPage),
          searchControlled: true
        }}
      />

      {/* Confirmation Dialog for Archiving Employee */}
      <ConfirmDialog
        isOpen={Boolean(deleteId)}
        title="Archive Employee Record"
        message="Are you sure you want to archive this employee? Their login account will be deactivated, but historical payroll and attendance records will remain preserved."
        confirmText="Archive Employee"
        confirmVariant="danger"
        isLoading={isDeleting}
        onConfirm={handleArchive}
        onClose={() => setDeleteId(null)}
      />

      {/* Confirmation Dialog for Emergency Password Reset */}
      <ConfirmDialog
        isOpen={Boolean(resetTargetEmployee)}
        title="Emergency Password Reset"
        message={`Are you sure you want to trigger an emergency password reset for ${resetTargetEmployee?.name} (${resetTargetEmployee?.email})? A secure temporary password will be automatically generated and emailed to them, requiring a password change upon next login.`}
        confirmText="Generate & Email Temp Password"
        confirmVariant="primary"
        isLoading={isResettingPassword}
        onConfirm={handleListAdminReset}
        onClose={() => setResetTargetEmployee(null)}
      />
    </div>
  );
}

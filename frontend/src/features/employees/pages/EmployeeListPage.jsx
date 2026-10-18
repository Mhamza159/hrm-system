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
  UploadCloud
} from 'lucide-react';

import {
  useGetEmployeesQuery,
  useDeleteEmployeeMutation
} from '../employeesApi.js';
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

  const { token, isSuperAdmin } = useAuth();
  const [isExporting, setIsExporting] = useState(false);

  // Queries
  const { data: deptData } = useGetDepartmentsQuery({ limit: 100 });
  const { data: empData, isLoading, refetch } = useGetEmployeesQuery({
    page,
    limit,
    search: search.trim() || undefined,
    departmentId: selectedDept || undefined,
    status: selectedStatus || undefined
  });

  const [deleteEmployee, { isLoading: isDeleting }] = useDeleteEmployeeMutation();

  const departments = deptData?.data || [];
  const rawEmployees = empData?.data?.items || [];
  const employees = useMemo(() => {
    if (isSuperAdmin) return rawEmployees;
    return rawEmployees.filter(
      (emp) => emp.employeeCode !== 'EMP-000' && emp.email !== 'admin@hrm.company.pk'
    );
  }, [rawEmployees, isSuperAdmin]);
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

  const columns = [
    {
      key: 'employeeCode',
      header: 'Code',
      render: (row) => (
        <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
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
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0 border border-emerald-200">
              {initials}
            </div>
            <div>
              <span className="block text-xs font-semibold text-slate-900 leading-tight">
                {row.name}
              </span>
              <span className="text-[11px] text-slate-500 font-normal">{row.email || '—'}</span>
            </div>
          </div>
        );
      }
    },
    {
      key: 'departmentId',
      header: 'Department',
      render: (row) => (
        <span className="inline-flex items-center gap-1.5 text-xs text-slate-700">
          <Building2 className="w-3.5 h-3.5 text-slate-400" />
          {row.departmentId?.name || 'Unassigned'}
        </span>
      )
    },
    {
      key: 'designationId',
      header: 'Designation & Grade',
      render: (row) => (
        <div>
          <span className="block text-xs font-medium text-slate-800">
            {row.designationId?.title || '—'}
          </span>
          {row.designationId?.grade && (
            <span className="text-[10px] text-slate-500 bg-slate-50 px-1.5 py-0.2 rounded border border-slate-200">
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
        <span className="text-xs text-slate-600 font-mono">
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
        const isRowSuperAdmin = row.employeeCode === 'EMP-000' || row.email === 'admin@hrm.company.pk';
        if (isRowSuperAdmin && !isSuperAdmin) {
          return null;
        }

        return (
          <div className="flex items-center gap-1.5 justify-end">
            <button
              type="button"
              onClick={() => navigate(`/employees/${row._id}`)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              title="View Full Profile"
            >
              <Eye className="w-4 h-4" />
            </button>

            <Can I="employee.edit" a="Employee">
              <button
                type="button"
                onClick={() => navigate(`/employees/${row._id}/edit`)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                title="Edit Profile"
              >
                <Edit className="w-4 h-4" />
              </button>
            </Can>

            <Can I="employee.delete" a="Employee">
              {!isRowSuperAdmin && (
                <button
                  type="button"
                  onClick={() => setDeleteId(row._id)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
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
            <Can I="report.export" a="Report">
              <button
                type="button"
                onClick={handleExport}
                disabled={isExporting}
                className="px-3.5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                {isExporting ? 'Exporting...' : 'Export to Excel'}
              </button>
            </Can>

            <Can I="employee.create" a="Employee">
              <button
                type="button"
                onClick={() => navigate('/employees/import')}
                className="px-3.5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
              >
                <UploadCloud className="w-4 h-4 text-emerald-600" /> Bulk Ingest
              </button>
              <button
                type="button"
                onClick={() => navigate('/employees/new')}
                className="px-4 py-2.5 rounded-xl bg-[#00C471] hover:bg-[#049856] text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
              >
                <UserPlus className="w-4 h-4" /> Onboard Employee
              </button>
            </Can>
          </div>
        }
      />

      {/* Filter Toolbar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by code, name, email..."
            value={search}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471]"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#00C471]/30"
          >
            <option value="">All Departments</option>
            {departments.map((dept) => (
              <option key={dept._id} value={dept._id}>
                {dept.name}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#00C471]/30"
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
      </div>

      {/* Main DataTable */}
      <DataTable
        columns={columns}
        data={employees}
        isLoading={isLoading}
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
    </div>
  );
}

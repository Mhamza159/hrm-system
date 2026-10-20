/**
 * @file FinalSettlementPage.jsx
 * @description Offboarding management & final exit settlement console for HR.
 * 
 * SPECIFICATION:
 * - Module: M9 Payroll (BUILD-GUIDE Section 12 · Row 9.13)
 * - Layer: Feature Page (React 18 / Tailwind)
 * - Features: Filter offboarding staff, compute statutory gratuity, leave encashment, net clearance payout.
 */

import React, { useState } from 'react';
import {
  UserX,
  Search,
  Filter,
  DollarSign,
  Calendar,
  Building2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  ArrowRight
} from 'lucide-react';
import { useGetEmployeesQuery } from '../../employees/employeesApi.js';
import { useGetEmployeeSalaryStructureQuery } from '../payrollApi.js';
import { SettlementGratuityModal } from '../components/SettlementGratuityModal.jsx';

export function FinalSettlementPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: employeesData, isLoading: isLoadingEmployees, refetch } = useGetEmployeesQuery({
    page,
    limit: 20,
    search: search ? search : undefined,
    status: statusFilter ? statusFilter : undefined
  });

  const { data: salaryData } = useGetEmployeeSalaryStructureQuery(
    selectedEmployee?._id,
    { skip: !selectedEmployee }
  );

  const employees = employeesData?.data || [];
  const meta = employeesData?.meta || { totalDocs: 0, totalPages: 1 };

  const handleOpenSettlement = (emp) => {
    setSelectedEmployee(emp);
    setIsModalOpen(true);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Resigned':
      case 'resigned':
        return (
          <span className="px-2.5 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-full text-xs font-semibold">
            Resigned
          </span>
        );
      case 'Terminated':
      case 'terminated':
        return (
          <span className="px-2.5 py-1 bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded-full text-xs font-semibold">
            Terminated
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-semibold">
            Active
          </span>
        );
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-2xl">
            <UserX className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Full & Final Exit Settlements
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Calculate service gratuity, annual leave encashment, and generate final clearance statements
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search offboarding staff by name, code or CNIC..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">All Employment Statuses</option>
          <option value="Resigned">Resigned</option>
          <option value="Terminated">Terminated</option>
          <option value="Active">Active (Pre-clearance)</option>
        </select>
      </div>

      {/* Staff Settlement Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        {isLoadingEmployees ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-3 border-rose-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-500">Loading offboarding staff...</p>
          </div>
        ) : employees.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <UserX className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
            <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300">
              No offboarding employees found
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Select or search for employees currently marked as Resigned, Terminated, or undergoing clearance.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Department / Title</th>
                  <th className="py-3 px-4">Joining Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {employees.map((emp) => (
                  <tr key={emp._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">
                          {(emp.name || emp.firstName || 'E').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim()}
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono">
                            {emp.employeeCode || emp.employeeId}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="text-slate-800 dark:text-slate-200">
                        {emp.departmentId?.name || emp.department?.name || 'General'}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {emp.designationId?.title || emp.designation?.title || 'Staff'}
                      </p>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      {emp.joiningDate || emp.dateOfJoining
                        ? new Date(emp.joiningDate || emp.dateOfJoining).toLocaleDateString('en-PK', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })
                        : '—'}
                    </td>

                    <td className="py-3.5 px-4">
                      {getStatusBadge(emp.employmentStatus || emp.status)}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenSettlement(emp)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>Process Settlement</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {meta.totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>
              Page {page} of {meta.totalPages} ({meta.totalDocs} total)
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && selectedEmployee && (
        <SettlementGratuityModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          employee={selectedEmployee}
          activeSalary={salaryData?.data}
          onSuccess={() => {
            refetch();
            setIsModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
export default FinalSettlementPage;

/**
 * @file DepartmentCostInspectionModal.jsx
 * @description Department Workforce Cost Analysis & Staff Roster Inspection Modal.
 * Styled in Forest & Emerald Enterprise theme with zero external chart dependencies.
 */

import React from 'react';
import { X, PieChart } from 'lucide-react';
import { useGetReportInspectionQuery } from '../../reportsApi.js';

export const DepartmentCostInspectionModal = ({ isOpen, onClose, departmentId }) => {
  const { data: response, isLoading } = useGetReportInspectionQuery(
    { type: 'department-cost', departmentId },
    { skip: !isOpen || !departmentId }
  );

  if (!isOpen) return null;

  const data = response?.data || {};
  const department = data.department || {};
  const summary = data.summary || {};
  const roster = data.roster || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-[#1A3125]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-[#00C471] flex items-center justify-center font-bold text-sm shrink-0">
              <PieChart className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                  {department.name || 'Department Cost Analysis'}
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#061A14] text-slate-500 border border-slate-200 dark:border-[#1A3125]">
                  {department.code || 'DEPT'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-[#7E9E8F] mt-0.5">
                Workforce compensation attribution and personnel roster
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl border border-slate-200 dark:border-[#1A3125] text-slate-400 hover:text-slate-600 dark:hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {isLoading ? (
            <div className="py-20 text-center text-xs text-slate-400">Loading department cost attribution...</div>
          ) : (
            <>
              {/* Cost Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#061A14] border border-slate-200/80 dark:border-[#1A3125] space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Gross Cost</span>
                  <p className="font-mono text-lg font-bold text-slate-900 dark:text-white">
                    PKR {summary.totalGrossPkr || '0'}
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#061A14] border border-slate-200/80 dark:border-[#1A3125] space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Net Disbursed</span>
                  <p className="font-mono text-lg font-bold text-[#00C471]">
                    PKR {summary.totalNetPkr || '0'}
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#061A14] border border-slate-200/80 dark:border-[#1A3125] space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Cost / Head</span>
                  <p className="font-mono text-lg font-bold text-blue-500">
                    PKR {summary.avgCostPerEmpPkr || '0'}
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#061A14] border border-slate-200/80 dark:border-[#1A3125] space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Staff Headcount</span>
                  <p className="font-mono text-lg font-bold text-slate-900 dark:text-white">
                    {summary.headcount || 0}
                  </p>
                </div>
              </div>

              {/* Department Roster Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Department Staff Roster ({roster.length} members)
                </h4>
                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-[#1A3125]">
                  <table className="w-full text-left text-xs min-w-[650px]">
                    <thead className="bg-slate-50 dark:bg-[#061A14] text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-[#1A3125]">
                      <tr>
                        <th className="py-2.5 px-3">Employee</th>
                        <th className="py-2.5 px-3">Designation</th>
                        <th className="py-2.5 px-3">Gross Salary (PKR)</th>
                        <th className="py-2.5 px-3">Tax Withheld (PKR)</th>
                        <th className="py-2.5 px-3">Net Payout (PKR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-[#1A3125]/60 font-mono">
                      {roster.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-xs text-slate-400">
                            No employees assigned to this department.
                          </td>
                        </tr>
                      ) : (
                        roster.map((emp) => (
                          <tr key={emp._id} className="hover:bg-slate-50/50 dark:hover:bg-[#162820]/30 transition">
                            <td className="py-2.5 px-3 font-sans">
                              <span className="font-bold text-slate-900 dark:text-white block">{emp.name}</span>
                              <span className="font-mono text-[10px] text-slate-400">{emp.employeeCode}</span>
                            </td>
                            <td className="py-2.5 px-3 font-sans text-slate-600 dark:text-slate-300">
                              {emp.designation}
                            </td>
                            <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                              {emp.grossPkr}
                            </td>
                            <td className="py-2.5 px-3 text-rose-500">
                              {emp.taxPkr}
                            </td>
                            <td className="py-2.5 px-3 font-bold text-[#00C471]">
                              {emp.netPkr}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-4 px-6 border-t border-slate-100 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#061A14]/50">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 text-xs font-bold rounded-xl border border-slate-200 dark:border-[#1A3125] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#162820] transition cursor-pointer"
          >
            Close Analysis
          </button>
        </div>
      </div>
    </div>
  );
};

export default DepartmentCostInspectionModal;

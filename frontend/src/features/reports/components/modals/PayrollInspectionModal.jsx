/**
 * @file PayrollInspectionModal.jsx
 * @description Deep Itemized Payslips Inspection Modal for Payroll Cycles.
 * Styled in Forest & Emerald Enterprise theme with zero external chart dependencies.
 */

import React from 'react';
import { X, DollarSign } from 'lucide-react';
import { useGetReportInspectionQuery } from '../../reportsApi.js';

export const PayrollInspectionModal = ({ isOpen, onClose, runId }) => {
  const { data: response, isLoading } = useGetReportInspectionQuery(
    { type: 'payroll', runId },
    { skip: !isOpen || !runId }
  );

  if (!isOpen) return null;

  const data = response?.data || {};
  const run = data.run || {};
  const payslips = data.payslips || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-[#1A3125]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-[#00C471] flex items-center justify-center font-bold text-sm shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                  Payroll Cycle Dossier — {run.month || 'Cycle'}
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-[#00C471] border border-emerald-500/20">
                  {run.status || 'APPROVED'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-[#7E9E8F] mt-0.5">
                Detailed employee payslip line items and statutory withholding
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
            <div className="py-20 text-center text-xs text-slate-400">Loading payroll itemization...</div>
          ) : (
            <>
              {/* Financial Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#061A14] border border-slate-200/80 dark:border-[#1A3125] space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gross Payroll</span>
                  <p className="font-mono text-lg font-bold text-slate-900 dark:text-white">PKR {run.grossPkr || '0'}</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#061A14] border border-slate-200/80 dark:border-[#1A3125] space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Net Disbursed</span>
                  <p className="font-mono text-lg font-bold text-[#00C471]">PKR {run.netPkr || '0'}</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#061A14] border border-slate-200/80 dark:border-[#1A3125] space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">FBR Tax Withheld</span>
                  <p className="font-mono text-lg font-bold text-rose-500">PKR {run.taxPkr || '0'}</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#061A14] border border-slate-200/80 dark:border-[#1A3125] space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Employees Paid</span>
                  <p className="font-mono text-lg font-bold text-blue-500">{run.totalEmployees || 0}</p>
                </div>
              </div>

              {/* Payslips Roster Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Itemized Employee Payslips ({payslips.length})
                </h4>
                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-[#1A3125]">
                  <table className="w-full text-left text-xs min-w-[750px]">
                    <thead className="bg-slate-50 dark:bg-[#061A14] text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-[#1A3125]">
                      <tr>
                        <th className="py-2.5 px-3">Employee</th>
                        <th className="py-2.5 px-3">Department</th>
                        <th className="py-2.5 px-3">Gross (PKR)</th>
                        <th className="py-2.5 px-3">FBR Tax (PKR)</th>
                        <th className="py-2.5 px-3">Deductions (PKR)</th>
                        <th className="py-2.5 px-3">Net Pay (PKR)</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-[#1A3125]/60 font-mono">
                      {payslips.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-xs text-slate-400">
                            No individual payslip items found for this cycle.
                          </td>
                        </tr>
                      ) : (
                        payslips.map((ps) => (
                          <tr key={ps._id} className="hover:bg-slate-50/50 dark:hover:bg-[#162820]/30 transition">
                            <td className="py-2.5 px-3 font-sans">
                              <span className="font-bold text-slate-900 dark:text-white block">{ps.name}</span>
                              <span className="font-mono text-[10px] text-slate-400">{ps.employeeCode}</span>
                            </td>
                            <td className="py-2.5 px-3 font-sans text-slate-600 dark:text-slate-300">{ps.department}</td>
                            <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">{ps.grossPkr}</td>
                            <td className="py-2.5 px-3 text-rose-500">{ps.taxPkr}</td>
                            <td className="py-2.5 px-3 text-amber-500">{ps.deductionsPkr}</td>
                            <td className="py-2.5 px-3 font-bold text-[#00C471]">{ps.netPkr}</td>
                            <td className="py-2.5 px-3 font-sans">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-[#00C471]">
                                {ps.status}
                              </span>
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
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
};

export default PayrollInspectionModal;

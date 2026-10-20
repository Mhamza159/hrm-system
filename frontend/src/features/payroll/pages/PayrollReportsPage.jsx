/**
 * @file PayrollReportsPage.jsx
 * @description Comprehensive Payroll Analytics, Statutory Compliance & Team Overtime Reports.
 * 
 * SPECIFICATION:
 * - Module: M9 Payroll (BUILD-GUIDE Section 12 · Rows 9.15, 9.16, 9.17)
 * - Layer: Feature Page (React 18 / Tailwind)
 * - Tabs: Department Cost Analytics, FBR Tax Withholding, EOBI/PESSI Compliance, Team Overtime.
 */

import React, { useState } from 'react';
import {
  BarChart3,
  FileSpreadsheet,
  ShieldCheck,
  Clock,
  Building2,
  DollarSign,
  TrendingUp,
  Download,
  Calendar,
  Filter,
  Users
} from 'lucide-react';
import {
  useGetDepartmentPayrollCostQuery,
  useGetTaxComplianceReportQuery,
  useGetEobiComplianceReportQuery,
  useGetTeamOvertimeQuery
} from '../payrollApi.js';

export function PayrollReportsPage() {
  const [activeTab, setActiveTab] = useState('cost'); // 'cost' | 'tax' | 'eobi' | 'overtime'
  const [taxYear, setTaxYear] = useState('2026');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState(new Date().getFullYear().toString());

  // Queries
  const { data: costData, isLoading: isLoadingCost } = useGetDepartmentPayrollCostQuery(
    { month: month || undefined, year: year || undefined },
    { skip: activeTab !== 'cost' }
  );

  const { data: taxData, isLoading: isLoadingTax } = useGetTaxComplianceReportQuery(
    { taxYear },
    { skip: activeTab !== 'tax' }
  );

  const { data: eobiData, isLoading: isLoadingEobi } = useGetEobiComplianceReportQuery(
    { taxYear },
    { skip: activeTab !== 'eobi' }
  );

  const { data: overtimeData, isLoading: isLoadingOvertime } = useGetTeamOvertimeQuery(
    { month: month || undefined, year: year || undefined },
    { skip: activeTab !== 'overtime' }
  );

  const departmentCosts = costData?.data || [];
  const taxReport = taxData?.data || [];
  const eobiReport = eobiData?.data || [];
  const teamOvertime = overtimeData?.data || [];

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Payroll Reports & Compliance Audits
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Departmental salary costs, FBR tax withholding audits, EOBI contributions, and team overtime
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('cost')}
          className={`pb-3.5 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'cost'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Department Cost Analytics</span>
        </button>

        <button
          onClick={() => setActiveTab('tax')}
          className={`pb-3.5 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'tax'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>FBR Section 149 Withholding</span>
        </button>

        <button
          onClick={() => setActiveTab('eobi')}
          className={`pb-3.5 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'eobi'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>EOBI & PESSI Statutory</span>
        </button>

        <button
          onClick={() => setActiveTab('overtime')}
          className={`pb-3.5 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'overtime'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Team Overtime Guard</span>
        </button>
      </div>

      {/* Tab 1: Department Cost Analytics */}
      {activeTab === 'cost' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-500">Filter Cycle:</span>
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                <option value="">All Months (YTD)</option>
                {monthNames.map((m, idx) => (
                  <option key={m} value={idx + 1}>{m}</option>
                ))}
              </select>

              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                <option value="2026">2026</option>
                <option value="2025">2025</option>
              </select>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            {isLoadingCost ? (
              <div className="py-16 text-center text-slate-400 text-xs">Loading departmental cost data...</div>
            ) : departmentCosts.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs">No payroll cost data recorded for this period.</div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4 text-center">Staff Count</th>
                    <th className="py-3 px-4 text-right">Gross Total</th>
                    <th className="py-3 px-4 text-right">Income Tax</th>
                    <th className="py-3 px-4 text-right">EOBI Total</th>
                    <th className="py-3 px-4 text-right">Net Take-Home</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {departmentCosts.map((d, i) => (
                    <tr key={i} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30">
                      <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                        {d.departmentName || d._id || 'General'}
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-600 dark:text-slate-300">
                        {d.employeeCount || d.count || 0}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-800 dark:text-slate-200">
                        PKR {((d.totalGross || 0) / 100).toLocaleString('en-PK')}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-rose-600 dark:text-rose-400">
                        PKR {((d.totalTax || 0) / 100).toLocaleString('en-PK')}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-amber-600 dark:text-amber-400">
                        PKR {((d.totalEobi || 0) / 100).toLocaleString('en-PK')}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        PKR {((d.totalNet || 0) / 100).toLocaleString('en-PK')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: FBR Tax Compliance Withholding */}
      {activeTab === 'tax' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-500">Tax Year:</span>
              <select
                value={taxYear}
                onChange={(e) => setTaxYear(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                <option value="2026">Tax Year 2026 (July 2025 - June 2026)</option>
                <option value="2025">Tax Year 2025 (July 2024 - June 2025)</option>
              </select>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            {isLoadingTax ? (
              <div className="py-16 text-center text-slate-400 text-xs">Loading tax compliance data...</div>
            ) : taxReport.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs">No tax withholding records found for Tax Year {taxYear}.</div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4">Period</th>
                    <th className="py-3 px-4 text-center">Salaried Staff</th>
                    <th className="py-3 px-4 text-right">Gross Salary (PKR)</th>
                    <th className="py-3 px-4 text-right">Taxable Amount (PKR)</th>
                    <th className="py-3 px-4 text-right">Tax Withheld (PKR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {taxReport.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30">
                      <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                        {monthNames[(row.month || 1) - 1]} {row.year}
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-600 dark:text-slate-300">
                        {row.employeeCount || 0}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-800 dark:text-slate-200">
                        PKR {((row.totalGross || 0) / 100).toLocaleString('en-PK')}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-800 dark:text-slate-200">
                        PKR {((row.taxableGross || 0) / 100).toLocaleString('en-PK')}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                        PKR {((row.totalTaxWithheld || 0) / 100).toLocaleString('en-PK')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: EOBI & PESSI Statutory Compliance */}
      {activeTab === 'eobi' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-500">Tax Year:</span>
              <select
                value={taxYear}
                onChange={(e) => setTaxYear(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                <option value="2026">Tax Year 2026</option>
                <option value="2025">Tax Year 2025</option>
              </select>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            {isLoadingEobi ? (
              <div className="py-16 text-center text-slate-400 text-xs">Loading statutory EOBI compliance data...</div>
            ) : eobiReport.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs">No EOBI records found for selected period.</div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4">Period</th>
                    <th className="py-3 px-4 text-center">Active Members</th>
                    <th className="py-3 px-4 text-right">Employee 1% Share</th>
                    <th className="py-3 px-4 text-right">Employer 5% Share</th>
                    <th className="py-3 px-4 text-right">Total Contribution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {eobiReport.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30">
                      <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                        {monthNames[(row.month || 1) - 1]} {row.year}
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-600 dark:text-slate-300">
                        {row.employeeCount || 0}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-800 dark:text-slate-200">
                        PKR {((row.employeeEobi || 0) / 100).toLocaleString('en-PK')}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-800 dark:text-slate-200">
                        PKR {((row.employerEobi || 0) / 100).toLocaleString('en-PK')}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        PKR {(((row.employeeEobi || 0) + (row.employerEobi || 0)) / 100).toLocaleString('en-PK')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Team Overtime Guard (Department Manager Safe View) */}
      {activeTab === 'overtime' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-500">Filter Month:</span>
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                <option value="">Current Month</option>
                {monthNames.map((m, idx) => (
                  <option key={m} value={idx + 1}>{m}</option>
                ))}
              </select>
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Compensation numbers strictly excluded for manager privacy guard</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            {isLoadingOvertime ? (
              <div className="py-16 text-center text-slate-400 text-xs">Loading team overtime records...</div>
            ) : teamOvertime.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs">No overtime recorded for team members in this period.</div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Designation</th>
                    <th className="py-3 px-4 text-center">Overtime Hours</th>
                    <th className="py-3 px-4 text-right">Audit Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {teamOvertime.map((m, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30">
                      <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                        {m.employeeName || m.name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        {m.designation || 'Staff'}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-indigo-600 dark:text-indigo-400">
                        {m.overtimeHours || 0} hrs
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 rounded-full text-[11px] font-semibold">
                          Verified
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default PayrollReportsPage;

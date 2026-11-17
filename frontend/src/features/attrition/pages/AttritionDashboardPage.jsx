/**
 * @file AttritionDashboardPage.jsx
 * @description Executive Workforce Attrition Risk Intelligence & Retention Management Console.
 * Styled in Forest & Emerald Enterprise theme with native SVG charts, risk gauges, and CSV export.
 */

import React, { useState, useMemo } from 'react';
import {
  TrendingDown,
  Users,
  RefreshCw,
  Search,
  Download,
  AlertTriangle,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ArrowUpDown,
  RotateCcw
} from 'lucide-react';
import {
  useGetAttritionScoresQuery,
  useGetDepartmentRiskAnalyticsQuery,
  useRecalculateAttritionScoresMutation
} from '../attritionApi.js';
import { useGetDepartmentsQuery } from '../../departments/departmentsApi.js';
import { useAuth } from '../../../hooks/useAuth.js';
import { RiskTierBadge } from '../components/RiskTierBadge.jsx';
import { RiskScoreGauge } from '../components/RiskScoreGauge.jsx';
import { DepartmentRiskChart } from '../components/DepartmentRiskChart.jsx';
import { AttritionRiskDonutChart } from '../components/AttritionRiskDonutChart.jsx';
import { AttritionFactorsChart } from '../components/AttritionFactorsChart.jsx';
import { EmployeeRiskDetailModal } from '../components/EmployeeRiskDetailModal.jsx';
import { toast } from 'sonner';

// Format tenure duration relative to calculation timestamp
const formatTenure = (joiningDate, calculatedAt) => {
  if (!joiningDate) return '—';
  const joinTs = new Date(joiningDate).getTime();
  if (Number.isNaN(joinTs)) return '—';
  const refTs = calculatedAt ? new Date(calculatedAt).getTime() : joinTs;
  const months = Math.max(0, Math.floor((refTs - joinTs) / (1000 * 60 * 60 * 24 * 30.44)));
  const years = Math.floor(months / 12);
  const remMonths = months % 12;
  if (years === 0) return `${remMonths}m`;
  return `${years}y ${remMonths > 0 ? `${remMonths}m` : ''}`;
};

export const AttritionDashboardPage = () => {
  const { user, isHR, isSuperAdmin } = useAuth();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [riskLevel, setRiskLevel] = useState('');
  const [sortBy, setSortBy] = useState('riskScore');
  const [sortOrder, setSortOrder] = useState('desc');

  const [selectedScore, setSelectedScore] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Queries
  const {
    data: scoresResponse,
    isLoading: isScoresLoading,
    isFetching: isScoresFetching,
    refetch: refetchScores
  } = useGetAttritionScoresQuery({
    page,
    limit,
    search: search.trim() || undefined,
    departmentId: departmentId || undefined,
    riskLevel: riskLevel || undefined,
    sortBy,
    sortOrder
  });

  const {
    data: deptAnalyticsResponse,
    isLoading: isDeptLoading,
    refetch: refetchDeptAnalytics
  } = useGetDepartmentRiskAnalyticsQuery();

  const { data: deptData } = useGetDepartmentsQuery({ limit: 100 });
  const departmentsList = useMemo(() => deptData?.data || [], [deptData?.data]);

  const [recalculateMutation, { isLoading: isRecalculating }] = useRecalculateAttritionScoresMutation();

  const scores = useMemo(() => scoresResponse?.data || [], [scoresResponse?.data]);
  const pagination = scoresResponse?.meta || { page: 1, limit: 10, total: 0, pages: 1 };
  const departmentStats = useMemo(() => deptAnalyticsResponse?.data || [], [deptAnalyticsResponse?.data]);

  // Aggregate Metrics
  const highRiskTotal = useMemo(() => departmentStats.reduce((sum, d) => sum + (d.highRisk || 0), 0), [departmentStats]);
  const mediumRiskTotal = useMemo(() => departmentStats.reduce((sum, d) => sum + (d.mediumRisk || 0), 0), [departmentStats]);
  const lowRiskTotal = useMemo(() => departmentStats.reduce((sum, d) => sum + (d.lowRisk || 0), 0), [departmentStats]);
  const totalWorkforce = highRiskTotal + mediumRiskTotal + lowRiskTotal;

  const averageScore = useMemo(() => {
    if (departmentStats.length === 0) return 0;
    const totalScore = departmentStats.reduce((sum, d) => sum + (d.totalScoreSum || 0), 0);
    return totalWorkforce > 0 ? Math.round(totalScore / totalWorkforce) : 0;
  }, [departmentStats, totalWorkforce]);

  // Handle Recalculation
  const handleRecalculate = async () => {
    try {
      const res = await recalculateMutation().unwrap();
      toast.success(res?.message || 'Company-wide attrition evaluation completed');
      refetchScores();
      refetchDeptAnalytics();
    } catch (err) {
      if (err?.status === 409) {
        toast.warning(err?.data?.message || 'Calculation already in progress');
      } else {
        toast.error(err?.data?.message || 'Failed to recalculate flight-risk scores');
      }
    }
  };

  // Open Details Modal
  const handleOpenDetailModal = (scoreDoc) => {
    setSelectedScore(scoreDoc);
    setIsDetailModalOpen(true);
  };

  // Handle Column Sort Toggle
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPage(1);
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearch('');
    setDepartmentId('');
    setRiskLevel('');
    setPage(1);
  };

  // Export CSV
  const handleExportCSV = () => {
    if (!scores.length) {
      toast.error('No employee risk data available to export');
      return;
    }

    const headers = [
      'Employee Code',
      'Name',
      'Email',
      'Department',
      'Designation',
      'Joining Date',
      'Risk Score',
      'Risk Level',
      'Attendance Pts',
      'Salary Pts',
      'Appraisal Pts',
      'Tenure Pts',
      'Top Factors',
      'Notes Count'
    ];

    const rows = scores.map((s) => [
      `"${s.employeeId?.employeeCode || 'N/A'}"`,
      `"${s.employeeId?.name || 'N/A'}"`,
      `"${s.employeeId?.email || 'N/A'}"`,
      `"${s.departmentId?.name || 'N/A'}"`,
      `"${s.employeeId?.designationId?.title || 'N/A'}"`,
      `"${s.employeeId?.joiningDate ? new Date(s.employeeId.joiningDate).toLocaleDateString() : 'N/A'}"`,
      s.riskScore,
      `"${s.riskLevel}"`,
      s.breakdown?.attendance || 0,
      s.breakdown?.salaryStagnation || 0,
      s.breakdown?.appraisal || 0,
      s.breakdown?.tenure || 0,
      `"${(s.topFactors || []).join('; ').replace(/"/g, '""')}"`,
      s.notes?.length || 0
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `attrition-risk-report-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Attrition risk report exported successfully');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#061A14] p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] p-5 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shrink-0">
            <TrendingDown className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Attrition Risk Intelligence
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-[#00C471] border border-emerald-500/20">
                Predictive Analytics
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-[#7E9E8F] mt-0.5">
              Workforce retention intelligence synthesizing attendance, compensation, and performance trajectories
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2.5 self-end md:self-center">
          {(isHR || isSuperAdmin) && (
            <button
              type="button"
              onClick={handleRecalculate}
              disabled={isRecalculating}
              className="h-9 px-4 text-xs font-bold text-white bg-[#00C471] hover:bg-[#00B064] rounded-xl transition-all shadow-sm flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRecalculating ? 'animate-spin' : ''}`} />
              <span>{isRecalculating ? 'Evaluating Signals...' : 'Recalculate Risk'}</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Workforce Evaluated */}
        <div className="bg-white dark:bg-[#111D17] p-5 rounded-2xl border border-slate-200 dark:border-[#1A3125] shadow-sm flex flex-col justify-between h-32">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-[#7E9E8F]">
              Evaluated Workforce
            </span>
            <div className="h-11 w-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[#00C471]">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-white">{totalWorkforce}</p>
            <span className="text-[11px] text-slate-400 font-medium">
              Active staff analyzed
            </span>
          </div>
        </div>

        {/* High Flight Risk */}
        <div className="bg-white dark:bg-[#111D17] p-5 rounded-2xl border border-red-500/30 dark:border-red-900/40 shadow-sm flex flex-col justify-between h-32">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-red-600 dark:text-red-400">
              High Flight Risk
            </span>
            <div className="h-11 w-11 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
              <ShieldAlert className="h-5 w-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold font-mono tracking-tight text-red-600 dark:text-red-400">{highRiskTotal}</p>
            <span className="text-[11px] text-slate-400 font-medium">
              Score &ge; 70 ({totalWorkforce > 0 ? ((highRiskTotal / totalWorkforce) * 100).toFixed(0) : 0}%)
            </span>
          </div>
        </div>

        {/* Moderate Risk */}
        <div className="bg-white dark:bg-[#111D17] p-5 rounded-2xl border border-amber-500/30 dark:border-amber-900/40 shadow-sm flex flex-col justify-between h-32">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
              Moderate Risk
            </span>
            <div className="h-11 w-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold font-mono tracking-tight text-amber-600 dark:text-amber-400">{mediumRiskTotal}</p>
            <span className="text-[11px] text-slate-400 font-medium">
              Score 40–69 ({totalWorkforce > 0 ? ((mediumRiskTotal / totalWorkforce) * 100).toFixed(0) : 0}%)
            </span>
          </div>
        </div>

        {/* Stable Retention */}
        <div className="bg-white dark:bg-[#111D17] p-5 rounded-2xl border border-emerald-500/30 dark:border-emerald-900/40 shadow-sm flex flex-col justify-between h-32">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600 dark:text-[#00C471]">
              Stable Retention
            </span>
            <div className="h-11 w-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[#00C471]">
              <Sparkles className="h-5 w-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold font-mono tracking-tight text-emerald-600 dark:text-[#00C471]">{lowRiskTotal}</p>
            <span className="text-[11px] text-slate-400 font-medium">
              Score &lt; 40 ({totalWorkforce > 0 ? ((lowRiskTotal / totalWorkforce) * 100).toFixed(0) : 0}%)
            </span>
          </div>
        </div>
      </div>

      {/* Analytics Charts Suite Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        <div className="lg:col-span-1 h-full">
          <AttritionRiskDonutChart
            highRisk={highRiskTotal}
            mediumRisk={mediumRiskTotal}
            lowRisk={lowRiskTotal}
            averageScore={averageScore}
            selectedRiskLevel={riskLevel}
            onSelectRiskLevel={(tier) => {
              setRiskLevel(tier);
              setPage(1);
            }}
            isLoading={isDeptLoading}
          />
        </div>
        <div className="lg:col-span-2 h-full">
          <AttritionFactorsChart />
        </div>
      </div>

      {/* Analytics Charts Suite Row 2: Department Risk Distribution */}
      <DepartmentRiskChart
        data={departmentStats}
        isLoading={isDeptLoading}
        selectedDepartmentId={departmentId}
        onSelectDepartment={(id) => {
          setDepartmentId(id);
          setPage(1);
        }}
      />

      {/* Main Scored Employee Table Card */}
      <div className="bg-white dark:bg-[#111D17] rounded-2xl border border-slate-200 dark:border-[#1A3125] shadow-sm overflow-hidden p-5 space-y-4">
        {/* Table Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-[#1A3125]">
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Evaluated Workforce Risk Docket
              </h3>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#162820] text-slate-600 dark:text-[#7E9E8F] border border-slate-200 dark:border-[#1A3125]">
                {pagination.total} records
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-[#7E9E8F] mt-0.5">
              Inspect individual signal contributions, drill down into drivers, and record confidential retention interventions
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            {/* Export CSV Button */}
            <button
              type="button"
              onClick={handleExportCSV}
              className="h-9 px-3.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-[#1A3125] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#162820] transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-xs"
            >
              <Download className="h-4 w-4 text-[#00C471]" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Dedicated Full-Width Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-50/70 dark:bg-[#061A14]/70 border border-slate-200/80 dark:border-[#1A3125]">
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
            {/* Search Input */}
            <div className="relative min-w-[200px] flex-1 max-w-xs">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by name or code..."
                className="w-full h-9 pl-9 pr-3 text-xs rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#00C471] transition"
              />
            </div>

            {/* Department Dropdown (HR Manager & Super Admin) */}
            {(isHR || isSuperAdmin) && (
              <select
                value={departmentId}
                onChange={(e) => {
                  setDepartmentId(e.target.value);
                  setPage(1);
                }}
                className="h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-900 dark:text-white focus:outline-none focus:border-[#00C471]"
              >
                <option value="">All Departments</option>
                {departmentsList.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name}
                  </option>
                ))}
              </select>
            )}

            {/* Risk Tier Segmented Buttons */}
            <div className="h-9 p-0.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] flex items-center text-xs shadow-xs">
              {[
                { id: '', label: 'All' },
                { id: 'High', label: 'High' },
                { id: 'Medium', label: 'Moderate' },
                { id: 'Low', label: 'Stable' }
              ].map((btn) => (
                <button
                  key={btn.id}
                  type="button"
                  onClick={() => {
                    setRiskLevel(btn.id);
                    setPage(1);
                  }}
                  className={`h-7.5 px-3 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center whitespace-nowrap ${
                    riskLevel === btn.id
                      ? 'bg-[#00C471] text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* Reset Filters Action */}
          {(search || departmentId || riskLevel) && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="h-9 px-3 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition cursor-pointer flex items-center gap-1.5"
              title="Reset filters"
            >
              <RotateCcw className="h-3.5 w-3.5 text-amber-500" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[1050px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-[#1A3125] text-[11px] font-bold text-slate-500 dark:text-[#7E9E8F] uppercase tracking-wider">
                <th className="py-3 px-3 w-[260px]">Employee</th>
                <th className="py-3 px-3 w-[200px]">Department & Role</th>
                <th className="py-3 px-3 w-[90px]">Tenure</th>
                <th
                  className="py-3 px-3 w-[180px] cursor-pointer hover:text-slate-900 dark:hover:text-white transition select-none"
                  onClick={() => handleSort('riskScore')}
                >
                  <div className="flex items-center gap-1">
                    <span>Flight Risk Gauge</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-3 w-[140px]">Risk Tier</th>
                <th className="py-3 px-3 w-[250px]">Primary Signal Triggers</th>
                <th className="py-3 px-3 w-[130px] text-right">Interventions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#1A3125]/40">
              {isScoresLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-slate-400 dark:text-[#7E9E8F]">
                    Loading flight risk records...
                  </td>
                </tr>
              ) : scores.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-slate-400 dark:text-[#7E9E8F]">
                    No evaluated employees found matching the active criteria.
                  </td>
                </tr>
              ) : (
                scores.map((scoreDoc) => {
                  const emp = scoreDoc.employeeId || {};
                  const dept = scoreDoc.departmentId || {};
                  const factors = scoreDoc.topFactors || [];

                  return (
                    <tr
                      key={scoreDoc._id}
                      className="hover:bg-slate-50/70 dark:hover:bg-[#162820]/50 transition group"
                    >
                      {/* Employee Identity */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[#00C471] flex items-center justify-center font-bold text-[11px] shrink-0">
                            {emp.avatar ? (
                              <img src={emp.avatar} alt={emp.name} className="w-8 h-8 rounded-full object-cover" />
                            ) : (
                              (emp.name || 'EM').slice(0, 2).toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0 max-w-[200px]">
                            <span className="font-bold text-slate-900 dark:text-white block group-hover:text-[#00C471] transition truncate">
                              {emp.name || 'Unnamed Employee'}
                            </span>
                            <span className="font-mono text-[10px] text-[#7E9E8F] block truncate">
                              {emp.employeeCode || 'EMP-N/A'} • {emp.email || ''}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Department & Role */}
                      <td className="py-3.5 px-3">
                        <span className="font-medium text-slate-800 dark:text-slate-200 block truncate max-w-[180px]">
                          {dept.name || 'Department N/A'}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-[#7E9E8F] block truncate max-w-[180px]">
                          {emp.designationId?.title || 'Designation N/A'}
                        </span>
                      </td>

                      {/* Tenure */}
                      <td className="py-3.5 px-3">
                        <span className="font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          {formatTenure(emp.joiningDate, scoreDoc.calculatedAt)}
                        </span>
                      </td>

                      {/* Risk Gauge */}
                      <td className="py-3.5 px-3">
                        <RiskScoreGauge score={scoreDoc.riskScore} size="sm" />
                      </td>

                      {/* Risk Tier Badge */}
                      <td className="py-3.5 px-3">
                        <RiskTierBadge score={scoreDoc.riskScore} level={scoreDoc.riskLevel} size="sm" showScore={false} />
                      </td>

                      {/* Top Factor Chips */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-1.5 flex-wrap max-w-[240px]">
                          {factors.slice(0, 2).map((factor, fIdx) => (
                            <span
                              key={fIdx}
                              className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#061A14] border border-slate-200 dark:border-[#1A3125] text-slate-600 dark:text-[#7E9E8F] whitespace-nowrap"
                              title={factor}
                            >
                              {factor.split(':')[0]}
                            </span>
                          ))}
                          {factors.length > 2 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-[#061A14] text-slate-400 whitespace-nowrap font-mono">
                              +{factors.length - 2}
                            </span>
                          )}
                          {factors.length === 0 && (
                            <span className="text-[10px] text-slate-400 whitespace-nowrap">Nominal signals</span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenDetailModal(scoreDoc)}
                          className="h-8 px-3.5 text-xs font-bold rounded-lg border border-emerald-500/30 text-[#00C471] hover:bg-emerald-500/10 transition cursor-pointer whitespace-nowrap inline-flex items-center justify-center shadow-xs"
                        >
                          View Dossier
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-[#1A3125] text-xs">
          <div className="text-slate-500 dark:text-[#7E9E8F]">
            Showing <span className="font-bold text-slate-900 dark:text-white">{(pagination.page - 1) * limit + (scores.length > 0 ? 1 : 0)}</span> to{' '}
            <span className="font-bold text-slate-900 dark:text-white">{(pagination.page - 1) * limit + scores.length}</span> of{' '}
            <span className="font-bold text-slate-900 dark:text-white">{pagination.total}</span> records
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 text-[11px]">Rows:</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="h-8 px-2 text-xs rounded-lg border border-slate-200 dark:border-[#1A3125] bg-slate-50 dark:bg-[#061A14] text-slate-900 dark:text-white focus:outline-none focus:border-[#00C471]"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pagination.page <= 1 || isScoresFetching}
                className="h-8 w-8 rounded-lg border border-slate-200 dark:border-[#1A3125] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#162820] disabled:opacity-40 transition flex items-center justify-center cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-mono text-xs text-slate-700 dark:text-slate-300">
                {pagination.page} / {pagination.pages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                disabled={pagination.page >= pagination.pages || isScoresFetching}
                className="h-8 w-8 rounded-lg border border-slate-200 dark:border-[#1A3125] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#162820] disabled:opacity-40 transition flex items-center justify-center cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Employee Risk Detail Modal */}
      {selectedScore && (
        <EmployeeRiskDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedScore(null);
          }}
          score={selectedScore}
          userRoles={user?.roles || []}
        />
      )}
    </div>
  );
};

export default AttritionDashboardPage;

/**
 * @file ProjectProfitabilityPage.jsx
 * @description Executive Project Profitability & Cost Intelligence (Super Admin Only).
 * 
 * SPECIFICATION:
 * - Module: M22 Projects & Timesheets (BUILD-GUIDE Section 23 · Row 22.6)
 * - Security: Super Admin Access Guard.
 */

import React from 'react';
import {
  DollarSign,
  TrendingUp,
  Briefcase,
  ShieldAlert,
  Clock,
  PieChart,
  Percent,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { useGetProjectProfitabilityReportQuery } from '../projectsApi.js';
import { useAuth } from '../../../hooks/useAuth.js';

export const ProjectProfitabilityPage = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.roles?.some((r) => r === 'Super Admin' || r?.name === 'Super Admin');

  const { data: reportRes, isLoading, error } = useGetProjectProfitabilityReportQuery(undefined, {
    skip: !isSuperAdmin
  });

  if (!isSuperAdmin) {
    return (
      <div className="p-12 text-center max-w-md mx-auto my-12 rounded-xl border border-destructive/20 bg-destructive/5 space-y-3">
        <ShieldAlert className="h-12 w-12 text-destructive mx-auto" />
        <h2 className="text-lg font-bold text-foreground">Access Restricted</h2>
        <p className="text-sm text-muted-foreground">
          Project cost and profitability intelligence links sensitive employee payroll structures and is strictly restricted to Super Admin.
        </p>
      </div>
    );
  }

  const projects = reportRes?.data || [];

  const totalRevenue = projects.reduce((sum, p) => sum + (p.totalRevenuePaisa || 0), 0) / 100;
  const totalLaborCost = projects.reduce((sum, p) => sum + (p.totalLaborCostPaisa || 0), 0) / 100;
  const netGrossProfit = totalRevenue - totalLaborCost;
  const overallMargin = totalRevenue > 0 ? Math.round((netGrossProfit / totalRevenue) * 10000) / 100 : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <DollarSign className="h-7 w-7 text-primary" />
            Project Cost & Profitability Intelligence
          </h1>
          <p className="text-sm text-muted-foreground">
            Executive financial telemetry comparing client billing revenues against salary-derived internal labor costs.
          </p>
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20">
          <Lock className="h-3.5 w-3.5" /> Super Admin Only
        </span>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-border bg-card shadow-sm flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Total Billed Revenue</p>
            <p className="text-xl font-bold text-foreground font-mono">
              PKR {totalRevenue.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card shadow-sm flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Internal Labor Cost</p>
            <p className="text-xl font-bold text-foreground font-mono">
              PKR {totalLaborCost.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card shadow-sm flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Net Gross Profit</p>
            <p className="text-xl font-bold text-foreground font-mono">
              PKR {netGrossProfit.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card shadow-sm flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
            <Percent className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Gross Profit Margin</p>
            <p className="text-xl font-bold text-foreground">
              {overallMargin}%
            </p>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Project-by-Project Margin Ledger</h3>
          <span className="text-xs text-muted-foreground">
            Cost formula: Basic Salary ÷ (22 workdays × 8 hours)
          </span>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Calculating project profitability telemetry...</div>
          ) : projects.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground">No active project financial records found.</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-6 py-3">Project & Client</th>
                  <th className="px-6 py-3">Billing Type</th>
                  <th className="px-6 py-3">Hours (Billable / Total)</th>
                  <th className="px-6 py-3">Total Revenue</th>
                  <th className="px-6 py-3">Labor Cost</th>
                  <th className="px-6 py-3">Gross Profit</th>
                  <th className="px-6 py-3 text-right">Margin %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {projects.map((proj) => {
                  const rev = (proj.totalRevenuePaisa || 0) / 100;
                  const cost = (proj.totalLaborCostPaisa || 0) / 100;
                  const profit = (proj.grossProfitPaisa || 0) / 100;

                  return (
                    <tr key={proj.projectId} className="hover:bg-muted/30">
                      <td className="px-6 py-4">
                        <div className="font-medium text-foreground">{proj.projectName}</div>
                        <div className="text-xs font-mono text-primary font-semibold">{proj.projectCode}</div>
                        <div className="text-xs text-muted-foreground">{proj.client}</div>
                      </td>
                      <td className="px-6 py-4 capitalize text-muted-foreground text-xs">
                        {proj.billingType}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs">
                        <span className="font-semibold text-foreground">{proj.totalBillableHours}h</span> / {proj.totalLoggedHours}h
                      </td>
                      <td className="px-6 py-4 font-mono font-semibold text-emerald-600">
                        PKR {rev.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 font-mono text-muted-foreground">
                        PKR {cost.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-foreground">
                        PKR {profit.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            proj.profitMarginPercentage >= 50
                              ? 'bg-emerald-500/10 text-emerald-600'
                              : proj.profitMarginPercentage >= 25
                              ? 'bg-blue-500/10 text-blue-600'
                              : proj.profitMarginPercentage > 0
                              ? 'bg-amber-500/10 text-amber-600'
                              : 'bg-destructive/10 text-destructive'
                          }`}
                        >
                          {proj.profitMarginPercentage}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};


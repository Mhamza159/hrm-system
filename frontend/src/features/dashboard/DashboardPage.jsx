/**
 * @file DashboardPage.jsx
 * @description Enterprise HRM Overview Dashboard adhering strictly to docs/ui-reference.png.
 */

import React from 'react';
import {
  FolderKanban,
  CheckSquare,
  Clock,
  CheckCircle2,
  Calendar,
  AlertCircle,
  MoreVertical,
  ArrowUpRight,
  User
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader.jsx';
import { StatCard } from '../../components/common/StatCard.jsx';
import { Card } from '../../components/common/Card.jsx';
import { StatusBadge } from '../../components/common/StatusBadge.jsx';
import { useAuth } from '../../hooks/useAuth.js';

export default function DashboardPage() {
  const { user } = useAuth();
  const userName = user?.name || user?.email?.split('@')[0] || 'Member';

  return (
    <div className="space-y-6">
      {/* 1. Header with greeting and live time pill */}
      <PageHeader
        title={`Good Afternoon, ${userName} 👋`}
        description="Here's what is happening across your workspace today."
      />

      {/* 2. Row 1: 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          label="Total Projects"
          value="24"
          caption="+12% from last month"
          variant="emerald"
          icon={FolderKanban}
        />
        <StatCard
          label="Total Tasks"
          value="142"
          caption="+8% from last week"
          variant="blue"
          icon={CheckSquare}
        />
        <StatCard
          label="In Progress"
          value="38"
          caption="12 pending review"
          variant="purple"
          icon={Clock}
        />
        <StatCard
          label="Completed"
          value="96"
          caption="94% on-time completion"
          variant="rose"
          icon={CheckCircle2}
        />
      </div>

      {/* 3. Row 2: 3 Analytics & Activity Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1: Project Progress Donut */}
        <Card title="Project Progress" badge="Overall" actionText="Details">
          <div className="flex flex-col items-center justify-center py-2">
            {/* SVG Donut */}
            <div className="relative w-44 h-44 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                {/* Background Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="currentColor"
                  className="text-slate-100 dark:text-[#1A3125]"
                  strokeWidth="11"
                />
                {/* Segment 1: Emerald (Completed 68%) */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="#00C471"
                  strokeWidth="11"
                  strokeDasharray="251.2"
                  strokeDashoffset="80.3"
                  strokeLinecap="round"
                />
                {/* Segment 2: Blue accent (20%) */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="#38BDF8"
                  strokeWidth="11"
                  strokeDasharray="251.2"
                  strokeDashoffset="200"
                  strokeLinecap="round"
                />
              </svg>
              {/* Center Stat */}
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
                  68%
                </span>
                <span className="text-[11px] font-medium text-slate-400">
                  Completed
                </span>
              </div>
            </div>

            {/* Segment Breakdown */}
            <div className="w-full mt-4 space-y-2 pt-2 border-t border-slate-100 dark:border-[#1A3125]">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00C471]" />
                  <span className="text-slate-600 dark:text-slate-300 font-medium">Core Architecture</span>
                </div>
                <span className="font-semibold text-slate-900 dark:text-white">68%</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#38BDF8]" />
                  <span className="text-slate-600 dark:text-slate-300 font-medium">UI Integration</span>
                </div>
                <span className="font-semibold text-slate-900 dark:text-white">20%</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                  <span className="text-slate-600 dark:text-slate-300 font-medium">Review & QA</span>
                </div>
                <span className="font-semibold text-slate-900 dark:text-white">12%</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Card 2: Tasks by Status Bar Chart */}
        <Card title="Tasks by Status" badge="This Week" actionText="Analytics">
          <div className="flex flex-col justify-between h-full pt-1">
            {/* SVG Bar Chart */}
            <div className="h-44 w-full flex items-end justify-between gap-3 px-2 pt-4">
              {[
                { day: 'Mon', h: '60%', count: 18 },
                { day: 'Tue', h: '85%', count: 24 },
                { day: 'Wed', h: '70%', count: 21 },
                { day: 'Thu', h: '95%', count: 28 },
                { day: 'Fri', h: '50%', count: 15 },
                { day: 'Sat', h: '35%', count: 9 }
              ].map((item, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <div className="w-full bg-slate-100 dark:bg-[#1A3125] rounded-t-lg h-36 flex items-end p-1 relative">
                    <div
                      style={{ height: item.h }}
                      className="w-full bg-[#00C471] hover:bg-[#049856] rounded-t-md transition-all group-hover:opacity-90"
                    />
                  </div>
                  <span className="text-[11px] font-medium text-slate-400">
                    {item.day}
                  </span>
                </div>
              ))}
            </div>

            {/* Bottom Chart Legend */}
            <div className="flex items-center justify-between text-xs pt-4 mt-2 border-t border-slate-100 dark:border-[#1A3125]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00C471]" />
                <span className="text-slate-500 dark:text-slate-400">Completed: 115</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-[#1A3125]" />
                <span className="text-slate-500 dark:text-slate-400">Pending: 27</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Card 3: Recent Activity Feed */}
        <Card title="Recent Activity" badge="Live" actionText="View All">
          <div className="space-y-4">
            {[
              {
                user: 'Sarah Connor',
                role: 'Senior Engineer',
                action: 'merged pull request into',
                target: 'm1-auth-flow',
                time: '10m ago',
                initials: 'SC'
              },
              {
                user: 'Alex Rivera',
                role: 'Tech Lead',
                action: 'created task',
                target: 'Employee Onboarding V2',
                time: '35m ago',
                initials: 'AR'
              },
              {
                user: 'Basit Aziz',
                role: 'Super Admin',
                action: 'updated security policy for',
                target: 'Two-Factor Authentication',
                time: '2h ago',
                initials: 'BA'
              },
              {
                user: 'Zainab Tariq',
                role: 'HR Manager',
                action: 'approved document verification for',
                target: 'Hamza Malik',
                time: '4h ago',
                initials: 'ZT'
              }
            ].map((item, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-xs font-bold text-[#00C471] shrink-0">
                  {item.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-800 dark:text-slate-200 leading-snug">
                    <span className="font-semibold">{item.user}</span>{' '}
                    <span className="text-slate-500 dark:text-slate-400">{item.action}</span>{' '}
                    <span className="font-medium text-[#00C471]">{item.target}</span>
                  </p>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    {item.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* 4. Row 3: 3 Detailed Operational Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1: My Projects */}
        <Card title="My Projects" badge="3 Active" actionText="All Projects">
          <div className="space-y-4">
            {[
              {
                name: 'HRM Platform V2',
                lead: 'Basit Aziz',
                progress: 82,
                status: 'active',
                label: 'On Track'
              },
              {
                name: 'Employee Mobile Portal',
                lead: 'Alex Rivera',
                progress: 45,
                status: 'pending',
                label: 'In Progress'
              },
              {
                name: 'Security & PBAC Audit',
                lead: 'Sarah Connor',
                progress: 95,
                status: 'active',
                label: 'Final Review'
              }
            ].map((p, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-slate-100 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#0A110D]/50 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      {p.name}
                    </h4>
                    <p className="text-[11px] text-slate-400">Lead: {p.lead}</p>
                  </div>
                  <StatusBadge status={p.status} label={p.label} />
                </div>
                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>Progress</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200">
                      {p.progress}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-200 dark:bg-[#1A3125] rounded-full overflow-hidden">
                    <div
                      style={{ width: `${p.progress}%` }}
                      className="h-full bg-[#00C471] rounded-full"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Card 2: Upcoming Deadlines */}
        <Card title="Upcoming Deadlines" badge="Next 7 Days" actionText="Calendar">
          <div className="space-y-3.5">
            {[
              {
                title: 'Sprint 4 Release Gate',
                date: 'Tomorrow, 5:00 PM',
                priority: 'High',
                color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60'
              },
              {
                title: 'Q3 Performance Appraisals',
                date: 'Oct 15, 2026',
                priority: 'Medium',
                color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60'
              },
              {
                title: 'Monthly Payroll Batch Finalization',
                date: 'Oct 18, 2026',
                priority: 'Normal',
                color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
              }
            ].map((d, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#0A110D]/50"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-800 dark:text-white">
                      {d.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">{d.date}</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${d.color}`}>
                  {d.priority}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Card 3: Team Members */}
        <Card title="Team Members" badge="Active Now" actionText="Directory">
          <div className="space-y-3.5">
            {[
              {
                name: 'Basit Aziz',
                role: 'Super Admin',
                status: 'online',
                initials: 'BA'
              },
              {
                name: 'Ayesha Khan',
                role: 'HR Manager',
                status: 'online',
                initials: 'AK'
              },
              {
                name: 'Omar Farooq',
                role: 'Department Lead',
                status: 'away',
                initials: 'OF'
              },
              {
                name: 'Fatima Noor',
                role: 'Senior Specialist',
                status: 'online',
                initials: 'FN'
              }
            ].map((m, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50/80 dark:hover:bg-[#15241C] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-[#1A3125] border border-slate-200 dark:border-[#1E362A] flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-200">
                      {m.initials}
                    </div>
                    {/* Status Dot */}
                    <span
                      className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-[#111D17] ${
                        m.status === 'online' ? 'bg-[#00C471]' : 'bg-amber-400'
                      }`}
                    />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-800 dark:text-white">
                      {m.name}
                    </h4>
                    <p className="text-[11px] text-slate-400">{m.role}</p>
                  </div>
                </div>
                <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 capitalize">
                  {m.status}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

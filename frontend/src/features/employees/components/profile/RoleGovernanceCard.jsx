/**
 * @file RoleGovernanceCard.jsx
 * @description Contextual quick-navigation hub rendering role-specific shortcuts and governance tools.
 * 
 * SPECIFICATION & NAVIGATION MATRIX:
 * - Super Admin: System administration consoles (/users, /roles, /departments, /designations, /settings)
 * - HR Manager: People operations consoles (/employees, /change-requests, /onboarding, /offboarding, /attendance/shifts)
 * - Department Manager: Team leadership & approvals (/delegations, /leaves, /attendance)
 * - Regular Employee: Self-service tools (/org-chart, /policies, /leaves, /attendance)
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Crown,
  Users,
  Shield,
  Building2,
  Award,
  Settings,
  FileEdit,
  UserPlus,
  LogOut,
  Clock,
  Briefcase,
  Share2,
  CalendarDays,
  CheckCircle2,
  Network,
  BookOpen,
  ChevronRight
} from 'lucide-react';
import { Card } from '../../../../components/common/Card.jsx';

export function RoleGovernanceCard({
  isSuperAdminRole,
  isHRRole,
  isDeptManagerRole
}) {
  const navigate = useNavigate();

  // Super Admin Navigation Items
  const superAdminItems = [
    {
      title: 'User Access',
      desc: 'Manage logins & accounts',
      icon: Users,
      path: '/users'
    },
    {
      title: 'Roles & Security',
      desc: 'PBAC permissions matrix',
      icon: Shield,
      path: '/roles'
    },
    {
      title: 'Departments',
      desc: 'Organizational units',
      icon: Building2,
      path: '/departments'
    },
    {
      title: 'Designations',
      desc: 'Job titles & grades',
      icon: Award,
      path: '/designations'
    },
    {
      title: 'Settings',
      desc: 'Global system configuration',
      icon: Settings,
      path: '/settings'
    }
  ];

  // HR Manager Navigation Items
  const hrManagerItems = [
    {
      title: 'Employee Directory',
      desc: 'Workforce records & contracts',
      icon: Users,
      path: '/employees'
    },
    {
      title: 'Profile Change Requests',
      desc: 'Review pending staff edits',
      icon: FileEdit,
      path: '/change-requests'
    },
    {
      title: 'Onboarding Pipeline',
      desc: 'New hire checklists',
      icon: UserPlus,
      path: '/onboarding'
    },
    {
      title: 'Exit Clearance',
      desc: 'Offboarding & settlements',
      icon: LogOut,
      path: '/offboarding'
    },
    {
      title: 'Work Shifts',
      desc: 'Rosters & timing policies',
      icon: Clock,
      path: '/attendance/shifts'
    }
  ];

  // Department Manager Navigation Items
  const deptManagerItems = [
    {
      title: 'Approval Delegations',
      desc: 'Delegate temporary authority',
      icon: Share2,
      path: '/delegations'
    },
    {
      title: 'Team Leave Requests',
      desc: 'Review subordinate time off',
      icon: CalendarDays,
      path: '/leaves'
    },
    {
      title: 'Team Attendance',
      desc: 'Inspect daily clock-ins & late entries',
      icon: Clock,
      path: '/attendance'
    },
    {
      title: 'Organization Chart',
      desc: 'Department reporting lines',
      icon: Network,
      path: '/org-chart'
    }
  ];

  // Regular Employee Navigation Items
  const employeeItems = [
    {
      title: 'Organization Chart',
      desc: 'Company hierarchy & reporting lines',
      icon: Network,
      path: '/org-chart'
    },
    {
      title: 'Company Policies',
      desc: 'Working hours, leave rules & code of conduct',
      icon: BookOpen,
      path: '/policies'
    },
    {
      title: 'My Leave Balance',
      desc: 'Request time off & track approvals',
      icon: CalendarDays,
      path: '/leaves'
    },
    {
      title: 'My Attendance Logs',
      desc: 'Daily clock-in & shift history',
      icon: CheckCircle2,
      path: '/attendance'
    }
  ];

  const activeConfig = isSuperAdminRole
    ? {
        title: 'Administrative Master Hub',
        desc: 'Direct platform governance & master consoles',
        badge: 'Owner Access',
        icon: Crown,
        items: superAdminItems
      }
    : isHRRole
    ? {
        title: 'People Operations Hub',
        desc: 'Workforce lifecycle & HR control centers',
        badge: 'HR Oversight',
        icon: Users,
        items: hrManagerItems
      }
    : isDeptManagerRole
    ? {
        title: 'Department Leadership Hub',
        desc: 'Team supervision & delegation tools',
        badge: 'Team Scope',
        icon: Briefcase,
        items: deptManagerItems
      }
    : {
        title: 'Self-Service Navigation Hub',
        desc: 'Quick access to employee operations',
        badge: 'Staff Portal',
        icon: Award,
        items: employeeItems
      };

  const HeaderIcon = activeConfig.icon;

  return (
    <Card className="p-5 border-slate-200 dark:border-[#1A3125] dark:bg-[#111D17] space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1A3125] pb-3">
        <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xs">
          <HeaderIcon className="w-4 h-4 text-[#00C471]" />
          <span>{activeConfig.title}</span>
        </div>
        <span className="text-[10px] font-bold text-emerald-700 dark:text-[#00C471] bg-emerald-50 dark:bg-[#162820] px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-900/60">
          {activeConfig.badge}
        </span>
      </div>

      {/* Grid of Navigation Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {activeConfig.items.map((item) => {
          const ItemIcon = item.icon;
          return (
            <button
              key={item.title}
              type="button"
              onClick={() => navigate(item.path)}
              className="p-3 rounded-xl border border-slate-100 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#162820]/40 hover:border-[#00C471] dark:hover:border-[#00C471]/60 hover:bg-emerald-50/40 dark:hover:bg-[#162820] text-left transition-all duration-200 group cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white dark:bg-[#0B1A13] border border-slate-200 dark:border-[#1A3125] group-hover:border-[#00C471] flex items-center justify-center text-slate-600 dark:text-slate-300 group-hover:text-[#00C471] transition-colors shrink-0">
                  <ItemIcon className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-[#00C471] block transition-colors">
                    {item.title}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-400 block line-clamp-1">
                    {item.desc}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-[#00C471] group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
            </button>
          );
        })}
      </div>
    </Card>
  );
}

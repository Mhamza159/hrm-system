/**
 * @file Sidebar.jsx
 * @description Fixed Sidebar Navigation Component with Tree Dropdown Groups.
 * 
 * SPECIFICATION & ACCESSIBILITY:
 * - Module: M0 Foundation (BUILD-GUIDE Section 3 · Row 0.12)
 * - Design Reference: User UI tree guide line + circular bullets
 * - Theme: Deep Forest Black-Green #061A14 with solid Emerald #00C471 active pill.
 * - Collapsible Dropdowns:
 *   - Attendance (My Attendance, Team Attendance, Attendance Lock)
 *   - Leaves & Holidays (My Leaves, Leave Approvals, Leave Calendar, Leave Encashment, Public Holidays, Leave Types)
 *   - Payroll (My Payslips, Payroll Dashboard, Salary Structures, Payroll Runs, Exit Settlements, Payroll Reports)
 * - Navigation links filter conditionally based on active user roles & CASL permissions.
 */

import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  LayoutDashboard,
  Users,
  Clock,
  Calendar,
  CalendarDays,
  BadgeDollarSign,
  Shield,
  Settings,
  Bell,
  History,
  LogOut,
  FolderKanban,
  BookOpen,
  Building2,
  Award,
  Network,
  UserCheck,
  User,
  FileCheck,
  Megaphone,
  Coins,
  BarChart3,
  ShieldCheck,
  ChevronDown,
  X
} from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '../../hooks/useAuth.js';
import { usePermission } from '../../hooks/usePermission.js';
import { logout } from '../../features/auth/authSlice.js';
import { useLogoutMutation } from '../../features/auth/authApi.js';
import { useGetNotificationsQuery } from '../../features/notifications/notificationsApi.js';
import { RoleBadge } from '../common/RoleBadge.jsx';
import { getUserDisplayName } from '../../lib/formatters.js';
import { cn } from '../../lib/utils.js';

export function Sidebar({ isOpen = false, onClose }) {
  const { user, isHR, isSuperAdmin } = useAuth();
  const { can } = usePermission();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [logoutApi] = useLogoutMutation();

  const { data: notifData } = useGetNotificationsQuery(
    { page: 1, limit: 1, unreadOnly: 'false' },
    { pollingInterval: 60000 }
  );
  const unreadCount = notifData?.data?.unreadCount || 0;

  const userName = getUserDisplayName(user);
  const primaryRole = user?.roles?.[0] || 'Employee';

  // Helper to filter items based on CASL permission & role guards
  const isItemVisible = (item) => {
    if (item.excludeSuperAdmin && isSuperAdmin) return false;
    if (item.permission && !can(item.permission)) return false;
    if (item.hrOnly && !isHR && !can('user.manage')) return false;
    if (item.superAdminOnly && !isSuperAdmin) return false;
    return true;
  };

  // Main navigation structure with standalone links & tree dropdown groups
  const navStructure = [
    { type: 'link', name: 'Dashboard', path: '/', icon: LayoutDashboard, exact: true },
    { type: 'link', name: 'My Profile', path: '/me', icon: User },
    { type: 'link', name: 'Org Chart', path: '/org-chart', icon: Network, permission: 'org.view' },
    { type: 'link', name: 'My Team', path: '/teams/my', icon: UserCheck, permission: 'org.view' },
    { type: 'link', name: 'Employees', path: '/employees', icon: Users, permission: 'employee.view' },
    {
      type: 'group',
      name: 'Attendance',
      icon: Clock,
      children: [
        { name: 'My Attendance', path: '/attendance/my', permission: 'attendance.view' },
        { name: 'Team Attendance', path: '/attendance/team', permission: 'attendance.approve' },
        { name: 'Attendance Lock', path: '/attendance/lock', permission: 'attendance.lock' }
      ]
    },
    {
      type: 'group',
      name: 'Leaves & Holidays',
      icon: Calendar,
      children: [
        { name: 'My Leaves', path: '/leaves', permission: 'leave.view', excludeSuperAdmin: true },
        { name: 'Leave Approvals', path: '/leaves/approvals', permission: 'leave.approve' },
        { name: 'Leave Calendar', path: '/leaves/calendar', permission: 'leave.view' },
        { name: 'Leave Encashment', path: '/leaves/encashment', permission: 'leave.view' },
        { name: 'Public Holidays', path: '/holidays' },
        { name: 'Leave Types', path: '/leave-types', permission: 'leave.settings' }
      ]
    },
    {
      type: 'group',
      name: 'Payroll',
      icon: BadgeDollarSign,
      children: [
        { name: 'My Payslips', path: '/payroll/my-payslips', excludeSuperAdmin: true },
        { name: 'Payroll Overview', path: '/payroll', permission: 'payroll.manage' },
        { name: 'Salary Structures', path: '/payroll/salary-structures', permission: 'payroll.manage' },
        { name: 'Payroll Runs', path: '/payroll/runs', permission: 'payroll.manage' },
        { name: 'Exit Settlements', path: '/payroll/settlement', permission: 'payroll.manage' },
        { name: 'Payroll Reports', path: '/payroll/reports', permission: 'payroll.view' }
      ]
    },
    {
      type: 'group',
      name: 'Loans & Advances',
      icon: Coins,
      children: [
        { name: 'My Loans', path: '/loans', permission: 'loan.view', excludeSuperAdmin: true },
        { name: 'Loan Approvals', path: '/loans/approvals', permission: 'loan.recommend' },
        { name: 'Company Ledger', path: '/loans/ledger', permission: 'loan.prepay' }
      ]
    },
    { type: 'link', name: 'Reports', path: '/reports', icon: BarChart3, permission: 'report.view' },
    { type: 'link', name: 'Company Policies', path: '/policies', icon: BookOpen, permission: 'settings.view' },
    { type: 'link', name: 'Announcements', path: '/announcements', icon: Megaphone, permission: 'announcement.view' },
    { type: 'link', name: 'Notifications', path: '/notifications', icon: Bell, badge: unreadCount > 0 ? unreadCount : undefined },
    { type: 'link', name: 'Login History', path: '/login-history', icon: History, permission: 'login.history' }
  ];

  // Admin section items
  const adminNavItems = [
    { name: 'Departments', path: '/departments', icon: Building2, permission: 'org.view' },
    { name: 'Designations', path: '/designations', icon: Award, permission: 'org.view' },
    { name: 'Work Shifts', path: '/shifts', icon: Clock, permission: 'org.view' },
    { name: 'Roles & Permissions', path: '/roles', icon: Shield, permission: 'role.view' },
    { name: 'Audit Logs', path: '/audit-logs', icon: ShieldCheck, permission: 'audit.view', superAdminOnly: true },
    { name: 'Change Requests', path: '/change-requests', icon: FileCheck, permission: 'employee.edit' },
    { name: 'User Access', path: '/users', icon: Users, permission: 'user.manage' },
    { name: 'Settings', path: '/settings', icon: Settings, permission: 'settings.manage' }
  ];

  // State to track expanded dropdown groups
  const [openGroups, setOpenGroups] = useState({
    Attendance: false,
    'Leaves & Holidays': false,
    Payroll: false,
    'Loans & Advances': false
  });

  // Auto-expand group if the active route is within its children
  useEffect(() => {
    const currentPath = location.pathname;
    navStructure.forEach((item) => {
      if (item.type === 'group' && item.children) {
        const matchesChild = item.children.some((child) =>
          child.path === '/'
            ? currentPath === '/'
            : currentPath.startsWith(child.path)
        );
        if (matchesChild) {
          setOpenGroups((prev) => ({ ...prev, [item.name]: true }));
        }
      }
    });
  }, [location.pathname]);

  const toggleGroup = (groupName) => {
    setOpenGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  const handleLogout = async () => {
    try {
      await logoutApi().unwrap();
    } catch {
      // Proceed even on network error
    }
    dispatch(logout());
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 w-[280px] bg-[#061A14] flex flex-col shrink-0 h-full border-r border-[#0B261D] select-none transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Brand & Client Identification (Matching docs/ui-reference.png) */}
        <div className="h-[72px] flex items-center justify-between px-6 border-b border-[#0B261D]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#00C471] flex items-center justify-center text-white shadow-[0_2px_8px_rgba(0,196,113,0.3)]">
              <FolderKanban className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-base tracking-wider text-white block leading-tight">
                ELVARA
              </span>
              <span className="text-[10px] text-emerald-400/80 font-medium block">
                HRM Enterprise
              </span>
            </div>
          </div>

          {/* Close button for mobile */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-emerald-400/80 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Link List */}
        <nav className="flex-1 py-5 px-3.5 space-y-1.5 overflow-y-auto sidebar-scrollbar">
          {navStructure.map((item) => {
            // Standalone Link
            if (item.type === 'link') {
              if (!isItemVisible(item)) return null;
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.exact}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group relative',
                      isActive
                        ? 'bg-[#00C471] text-white font-semibold shadow-[0_2px_10px_rgba(0,196,113,0.3)]'
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon className={cn('w-4 h-4 transition-colors', isActive ? 'text-white' : 'text-white/70 group-hover:text-white')} />
                      <span>{item.name}</span>
                      {item.badge && (
                        <span
                          className={cn(
                            'ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors',
                            isActive
                              ? 'bg-white/25 text-white'
                              : 'bg-[#00C471] text-white'
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              );
            }

            // Dropdown Group with Tree Styling
            if (item.type === 'group') {
              const visibleChildren = (item.children || []).filter(isItemVisible);
              if (visibleChildren.length === 0) return null;

              const isGroupOpen = Boolean(openGroups[item.name]);
              const isGroupActive = visibleChildren.some((child) =>
                child.path === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(child.path)
              );

              const Icon = item.icon;

              return (
                <div key={item.name} className="space-y-1">
                  {/* Group Parent Trigger Button */}
                  <button
                    type="button"
                    onClick={() => toggleGroup(item.name)}
                    className={cn(
                      'flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group cursor-pointer select-none',
                      isGroupActive
                        ? 'text-white bg-white/[0.06] font-semibold'
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={cn('w-4 h-4 transition-colors', isGroupActive ? 'text-[#00C471]' : 'text-white/70 group-hover:text-white')} />
                      <span>{item.name}</span>
                    </div>
                    <ChevronDown
                      className={cn(
                        'w-4 h-4 transition-transform duration-200 text-white/50 group-hover:text-white',
                        isGroupOpen && 'rotate-180 text-white'
                      )}
                    />
                  </button>

                  {/* Dropdown Items with Tree Indicator Line & Bullets */}
                  {isGroupOpen && (
                    <div className="relative ml-[21px] my-1 space-y-1">
                      {/* Vertical Connecting Line */}
                      <div className="absolute left-0 top-1.5 bottom-1.5 w-[1.5px] bg-white/20" />

                      {visibleChildren.map((child) => (
                        <NavLink
                          key={child.path}
                          to={child.path}
                          onClick={onClose}
                          className={({ isActive }) =>
                            cn(
                              'relative flex items-center pl-4 pr-3 py-1.5 rounded-lg text-xs font-medium transition-all group select-none',
                              isActive
                                ? 'text-[#00C471] font-semibold bg-emerald-500/10'
                                : 'text-white/65 hover:text-white hover:bg-white/5'
                            )
                          }
                        >
                          {({ isActive }) => (
                            <>
                              {/* Circular Dot on the vertical line (matching reference image) */}
                              <span
                                className={cn(
                                  'absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-[#061A14] transition-all',
                                  isActive
                                    ? 'bg-[#00C471] ring-2 ring-[#00C471]/30 shadow-[0_0_8px_rgba(0,196,113,0.6)]'
                                    : 'bg-white/40 group-hover:bg-white/80'
                                )}
                              />
                              <span className="truncate">{child.name}</span>
                            </>
                          )}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return null;
          })}

          {/* ADMIN Section Heading */}
          {(can('role.view') || can('user.manage') || can('settings.manage') || can('employee.edit') || isSuperAdmin) && (
            <div className="pt-4">
              <div className="text-[11px] font-semibold text-emerald-400/60 uppercase tracking-widest px-3.5 mb-2">
                Admin
              </div>
              {adminNavItems.map((item) => {
                if (!isItemVisible(item)) return null;
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group relative mb-1',
                        isActive
                          ? 'bg-[#00C471] text-white font-semibold shadow-[0_2px_10px_rgba(0,196,113,0.3)]'
                          : 'text-white/70 hover:text-white hover:bg-white/5'
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon className={cn('w-4 h-4 transition-colors', isActive ? 'text-white' : 'text-white/70 group-hover:text-white')} />
                        <span>{item.name}</span>
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          )}
        </nav>

        {/* Bottom User Card (Matching docs/ui-reference.png) */}
        <div className="p-3.5 border-t border-[#0B261D]">
          <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.05] flex items-center gap-3">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={userName}
                className="w-10 h-10 rounded-full object-cover border border-[#00C471]/50 shadow-xs shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-[#00C471]/40 flex items-center justify-center text-xs font-bold text-emerald-300 shrink-0">
                {userName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate leading-tight">
                {userName}
              </p>
              <div className="mt-1">
                <RoleBadge role={primaryRole} />
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

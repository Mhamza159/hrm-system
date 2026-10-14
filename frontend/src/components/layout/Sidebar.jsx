/**
 * @file Sidebar.jsx
 * @description Fixed Sidebar Navigation Component.
 * 
 * SPECIFICATION & ACCESSIBILITY:
 * - Module: M0 Foundation (BUILD-GUIDE Section 3 · Row 0.12)
 * - Design Reference: docs/ui-reference.png & docs/UI-REFERENCE.md
 * - Theme: Deep Forest Black-Green #061A14 with solid Emerald #00C471 active pill.
 * - Navigation links filter conditionally based on active user roles:
 *   - Super Admin: Full system settings, user permissions, and modules.
 *   - HR Manager: User Access, Payroll, Employee records, Leaves, Attendance.
 *   - Department Manager & Employee: Scoped access without Administrative Settings or Payroll.
 */

import React from 'react';
import { NavLink } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Clock,
  Calendar,
  BadgeDollarSign,
  Shield,
  Settings,
  Bell,
  History,
  LogOut,
  FolderKanban,
  BookOpen,
  X
} from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '../../hooks/useAuth.js';
import { usePermission } from '../../hooks/usePermission.js';
import { logout } from '../../features/auth/authSlice.js';
import { useLogoutMutation } from '../../features/auth/authApi.js';
import { cn } from '../../lib/utils.js';

export function Sidebar({ isOpen = false, onClose }) {
  const { user, isHR, isSuperAdmin } = useAuth();
  const { can } = usePermission();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [logoutApi] = useLogoutMutation();

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

  // Main navigation items
  const mainNavItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Employees', path: '/employees', icon: Users },
    { name: 'Attendance', path: '/attendance', icon: Clock },
    { name: 'Leaves', path: '/leaves', icon: Calendar },
    { name: 'Payroll', path: '/payroll', icon: BadgeDollarSign, hrOnly: true },
    { name: 'Company Policies', path: '/policies', icon: BookOpen },
    { name: 'Notifications', path: '/notifications', icon: Bell, badge: 3 },
    { name: 'Login History', path: '/login-history', icon: History }
  ];

  // Admin section items
  const adminNavItems = [
    { name: 'Roles & Permissions', path: '/roles', icon: Shield, permission: 'role.view' },
    { name: 'User Access', path: '/users', icon: Users, hrOnly: true },
    { name: 'Settings', path: '/settings', icon: Settings, permission: 'settings.manage' }
  ];

  const userRole = typeof user?.roles?.[0] === 'object'
    ? user?.roles?.[0]?.name || 'Employee'
    : user?.roles?.[0] || 'Employee';

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
      <nav className="flex-1 py-5 px-3.5 space-y-1.5 overflow-y-auto">
        {mainNavItems.map((item) => {
          if (item.hrOnly && !isHR) return null;
          if (item.superAdminOnly && !isSuperAdmin) return null;

          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
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
        })}

        {/* ADMIN Section Heading */}
        {(isHR || isSuperAdmin || can('role.view')) && (
          <div className="pt-4">
            <div className="text-[11px] font-semibold text-emerald-400/60 uppercase tracking-widest px-3.5 mb-2">
              Admin
            </div>
            {adminNavItems.map((item) => {
              if (item.permission && !can(item.permission)) return null;
              if (item.hrOnly && !isHR && !can('user.manage')) return null;
              if (item.superAdminOnly && !isSuperAdmin && !can('settings.manage')) return null;

              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
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
          <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-[#00C471]/40 flex items-center justify-center text-xs font-bold text-emerald-300 shrink-0">
            {user?.email?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-white truncate leading-tight">
              {user?.email?.split('@')[0] || 'User'}
            </p>
            <p className="text-[11px] text-[#00C471] font-medium truncate mt-0.5">
              {userRole}
            </p>
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

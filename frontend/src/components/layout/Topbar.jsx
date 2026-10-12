/**
 * @file Topbar.jsx
 * @description Fixed Top Navigation Bar Component.
 * 
 * SPECIFICATION & FEATURES:
 * - Module: M0 Foundation (BUILD-GUIDE Section 3 · Row 0.12) / Slice 1.5 Logout
 * - Design Reference: docs/ui-reference.png & docs/UI-REFERENCE.md
 * - Visual Archetype: Pure White #FFFFFF with 1px border #EAECF0, fully rounded search with ⌘K,
 *   notification count badge, dark mode toggle, and active user status capsule.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { LogOut, Bell, Search, Moon, Sun, ChevronDown, Menu } from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '../../hooks/useAuth.js';
import { logout } from '../../features/auth/authSlice.js';
import { useLogoutMutation } from '../../features/auth/authApi.js';

export function Topbar({ onToggleMenu }) {
  const { user } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [logoutApi] = useLogoutMutation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
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

  const userRole = typeof user?.roles?.[0] === 'object'
    ? user?.roles?.[0]?.name || 'Employee'
    : user?.roles?.[0] || 'Employee';

  const userDisplayName = user?.email?.split('@')[0] || 'User';

  return (
    <header className="h-[72px] bg-white dark:bg-[#111D17] border-b border-[#EAECF0] dark:border-[#1A3125] px-4 lg:px-8 flex items-center justify-between shrink-0 select-none transition-colors">
      {/* 1. Hamburger menu button (Mobile only) + Global Search Box (Left, matching docs/ui-reference.png) */}
      <div className="flex items-center gap-2 sm:gap-3">
        {onToggleMenu && (
          <button
            type="button"
            onClick={onToggleMenu}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
            title="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="relative flex items-center">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Search anything..."
            readOnly
            className="w-[180px] sm:w-[260px] md:w-[360px] h-10 pl-10 pr-10 sm:pr-12 rounded-full border border-slate-200 dark:border-[#1A3125] bg-slate-50/60 dark:bg-[#0A110D] text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#00C471] focus:ring-2 focus:ring-[#00C471]/20 transition-all cursor-pointer"
          />
          <div className="absolute inset-y-0 right-0 pr-3 hidden sm:flex items-center pointer-events-none">
            <kbd className="inline-flex items-center px-1.5 py-0.5 rounded border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#13221B] text-[10px] font-mono text-slate-500 dark:text-slate-400 shadow-2xs">
              ⌘K
            </kbd>
          </div>
        </div>
      </div>

      {/* 2. Utility Actions & Profile Capsule (Right) */}
      <div className="flex items-center gap-3 md:gap-4">
        {/* Notification Bell with Red Badge (3) */}
        <button
          type="button"
          title="Notifications"
          className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-[#111D17]">
            3
          </span>
        </button>

        {/* Theme Dark/Light Mode Moon Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          title="Toggle Theme"
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
        >
          {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Vertical Divider */}
        <div className="h-6 w-[1px] bg-slate-200 dark:bg-[#1A3125] mx-1" />

        {/* Profile Capsule Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-xs font-bold text-emerald-700 dark:text-emerald-300">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="text-left hidden sm:block">
              <span className="text-xs font-bold text-slate-900 dark:text-white block leading-tight">
                {userDisplayName}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                  {userRole}
                </span>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
          </button>

          {/* Elevated Floating Popover Menu */}
          {dropdownOpen && (
            <div
              className="absolute right-0 mt-2 w-52 rounded-2xl bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] shadow-xl py-1.5 z-50 animate-in fade-in"
              onMouseLeave={() => setDropdownOpen(false)}
            >
              <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-[#1A3125]">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user?.email}</p>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium capitalize">{userRole}</p>
              </div>
              <div className="p-1">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors cursor-pointer text-left"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Dedicated Direct Logout Icon (Rightmost, matching docs/ui-reference.png) */}
        <button
          type="button"
          onClick={handleLogout}
          title="Sign Out"
          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer hidden md:flex items-center justify-center"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}

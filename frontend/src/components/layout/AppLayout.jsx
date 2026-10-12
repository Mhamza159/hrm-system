/**
 * @file AppLayout.jsx
 * @description Main Application Layout Shell for authenticated HRM portal.
 * 
 * DESIGN STRUCTURE (Matching docs/ui-reference.png):
 * - Left Sidebar: ~280px wide deep forest black-green #061A14.
 * - Topbar: Clean white header with global search, notifications, and profile capsule.
 * - Content Canvas: Light slate #F8FAFC canvas (with dark mode equivalent #0A110D).
 */

import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar.jsx';
import { Topbar } from './Topbar.jsx';
import { useIdleTimer } from '../../hooks/useIdleTimer.js';
import { AbilityProvider } from '../../lib/ability.js';

export function AppLayout() {
  // Activate automatic 30-minute inactivity auto-logout (Slice 1.11)
  useIdleTimer();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <AbilityProvider>
      <div className="flex h-screen bg-[#F8FAFC] dark:bg-[#0A110D] text-slate-800 dark:text-slate-100 overflow-hidden font-sans antialiased transition-colors">
        {/* 1. Responsive Left Sidebar Drawer */}
        <Sidebar
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
        />

        {/* 2. Main Fluid Viewport Container */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          {/* Topbar Header */}
          <Topbar onToggleMenu={() => setMobileMenuOpen((prev) => !prev)} />

          {/* Scrollable Active Route Viewport */}
          <main className="flex-1 overflow-y-auto p-6 lg:p-8 bg-[#F8FAFC] dark:bg-[#0A110D]">
            <div className="max-w-[1600px] mx-auto space-y-6">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </AbilityProvider>
  );
}

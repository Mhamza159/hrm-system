/**
 * @file useRealtimeCacheSync.js
 * @description Universal Top-Level Real-Time Cache Synchronization Hook (Phase 41).
 * 
 * ARCHITECTURAL DESIGN & INVARIANTS:
 * 1. Universally Mounted: Mounted directly inside AppLayout.jsx so it runs across all authenticated views.
 * 2. Cross-User Sync: Dispatches RTK Query cache invalidations when other users perform actions on the system.
 * 3. Zero Page Reload: Eliminates manual F5 refreshing by causing active components to silently re-fetch in the background.
 * 4. Resilient Lifecycle: Cleanly binds listeners on socket connection and cleans them up on unmount or logout.
 */

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSocket, getSocket } from '../features/notifications/hooks/useSocket.js';
import { baseApi } from '../lib/baseApi.js';

export const useRealtimeCacheSync = () => {
  const dispatch = useDispatch();
  const socket = useSocket();
  const token = useSelector((state) => state.auth?.accessToken);
  const user = useSelector((state) => state.auth?.user);
  const activeSocket = socket || getSocket();

  useEffect(() => {
    if (!activeSocket || !token || !user) return;

    // 1. Generic Structured Invalidation Signal from Backend
    const handleCacheInvalidate = (payload) => {
      if (payload?.tags && Array.isArray(payload.tags) && payload.tags.length > 0) {
        dispatch(baseApi.util.invalidateTags(payload.tags));
      }
    };

    // 2. Domain-Specific Broadcast Events
    const handleAttendanceSync = () => {
      dispatch(baseApi.util.invalidateTags(['Attendance', 'Team', 'WFH', 'Correction', 'AttendanceLock']));
    };

    const handleLeaveSync = () => {
      dispatch(baseApi.util.invalidateTags(['Leave', 'LeaveType', 'Attendance', 'NotificationCounts']));
    };

    const handleEmployeeSync = () => {
      dispatch(baseApi.util.invalidateTags(['Employee', 'Users', 'Departments', 'Designations', 'OrgChart']));
    };

    const handleDepartmentSync = () => {
      dispatch(baseApi.util.invalidateTags(['Departments', 'Designations', 'Shifts', 'OrgChart']));
    };

    const handleShiftSync = () => {
      dispatch(baseApi.util.invalidateTags(['Shifts', 'Attendance']));
    };

    const handleRoleSync = () => {
      dispatch(baseApi.util.invalidateTags(['Roles', 'RoleStats', 'RoleAnalytics', 'Permissions', 'Delegations']));
    };

    const handleAssetSync = () => {
      dispatch(baseApi.util.invalidateTags(['Assets', 'Asset', 'AssetRequests']));
    };

    const handlePayrollSync = () => {
      dispatch(baseApi.util.invalidateTags(['Payroll']));
    };

    const handleSettingsSync = () => {
      dispatch(baseApi.util.invalidateTags(['Settings', 'Policies']));
    };

    // Register listeners
    activeSocket.on('cache:invalidate', handleCacheInvalidate);
    activeSocket.on('attendance:sync', handleAttendanceSync);
    activeSocket.on('attendance:punch', handleAttendanceSync);
    activeSocket.on('leave:sync', handleLeaveSync);
    activeSocket.on('employee:sync', handleEmployeeSync);
    activeSocket.on('department:sync', handleDepartmentSync);
    activeSocket.on('shift:sync', handleShiftSync);
    activeSocket.on('role:sync', handleRoleSync);
    activeSocket.on('asset:sync', handleAssetSync);
    activeSocket.on('payroll:sync', handlePayrollSync);
    activeSocket.on('settings:sync', handleSettingsSync);

    return () => {
      activeSocket.off('cache:invalidate', handleCacheInvalidate);
      activeSocket.off('attendance:sync', handleAttendanceSync);
      activeSocket.off('attendance:punch', handleAttendanceSync);
      activeSocket.off('leave:sync', handleLeaveSync);
      activeSocket.off('employee:sync', handleEmployeeSync);
      activeSocket.off('department:sync', handleDepartmentSync);
      activeSocket.off('shift:sync', handleShiftSync);
      activeSocket.off('role:sync', handleRoleSync);
      activeSocket.off('asset:sync', handleAssetSync);
      activeSocket.off('payroll:sync', handlePayrollSync);
      activeSocket.off('settings:sync', handleSettingsSync);
    };
  }, [activeSocket, token, user, dispatch]);
};

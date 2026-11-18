# Quick Task: Integrate Employee / User Avatar in Login History Module

**Task**: Display real User / Employee profile photo (avatar) in the Login History data table and attempt inspection modal, falling back gracefully to standard styled initials when an avatar is not uploaded.  
**Path**: `.planning/quick/20261118-login-history-avatar-integration/PLAN.md`  
**Date**: 2026-11-18  
**Status**: in-progress

---

## 1. Objectives

1. **Database Schema & Backend Capture**:
   - Add `avatar` field (`type: String, default: null, trim: true`) to `LoginHistory` schema in `backend/src/models/loginHistory.model.js`.
   - In `recordLoginHistory` (`backend/src/modules/auth/auth.service.js`), capture `employee.avatar || targetUser.avatar || null` at authentication time.
   - In `enrichLoginRecord` (`backend/src/modules/auth/auth.service.js`), dynamically resolve `avatar` from the user or linked employee record for all queries and exports.
   - Backfill existing Atlas records with avatar URLs for users who have profile photos in Cloudinary.

2. **Frontend Table Integration ([`LoginHistoryPage.jsx`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/frontend/src/features/auth/pages/LoginHistoryPage.jsx))**:
   - Utilize canonical `PersonAvatar` component from `components/common/Person.jsx`.
   - Pass `src={row.avatar}` and `name={resolvedName}`.
   - High-contrast, polished styling with fallback initials.

3. **Frontend Modal Inspection Integration ([`LoginDetailModal.jsx`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/frontend/src/features/auth/components/LoginDetailModal.jsx))**:
   - Display prominent `PersonAvatar` (`size="lg"`) in Section A (Account Identity), alongside employee name, employee code, and email.

4. **Testing & Quality Gates**:
   - Run Vitest E2E suite (`tests/auth.login-history.e2e.test.js`) to ensure zero regressions.
   - Run Oxlint and Vite build.

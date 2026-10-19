# Quick Task: Admin Notifications & Announcements Channel Settings Tab

## Goal
Implement a dedicated "Notifications & Announcements" tab in the Admin Company Settings panel (`/settings`), allowing administrators to configure system-wide delivery channels (In-App, Email, WhatsApp, or Mixed). Ensure the central `notify()` pipeline and announcement broadcasts enforce these admin selections dynamically.

## User Requirements
1. **Admin Control in Settings**: Admin can decide delivery method for notifications & announcements:
   - Email only
   - In-App only
   - WhatsApp only
   - Mixed (e.g., In-App + Email, or In-App + Email + WhatsApp)
2. **Channel Enforcement**:
   - If Admin turns OFF In-App, no in-app alert or websocket is generated.
   - If Admin turns OFF Email, no email is sent.
   - If Admin turns OFF WhatsApp, no WhatsApp message is dispatched.
   - If Admin enables a specific combination, alerts are strictly routed to the chosen channels.
3. **Dedicated UI in Settings**:
   - In `SettingsPage.jsx`, add a tab "Notifications & Alerts".
   - Create `NotificationSettingsForm.jsx` allowing toggles for global master channels and category overrides (Attendance, Leaves, Payroll, Announcements).

## Implementation Slices
1. **BE-1**: Define `notifications` schema in `backend/src/modules/settings/setting.validation.js` and add default blueprint in `setting.service.js`.
2. **BE-2**: Connect `notify.service.js` to `SettingService.getSetting('notifications')` so channel dispatch respects Admin configuration.
3. **FE-1**: Create `frontend/src/features/settings/components/NotificationSettingsForm.jsx` with toggles for In-App, Email, and WhatsApp.
4. **FE-2**: Add "Notifications & Alerts" tab to `SettingsPage.jsx`.
5. **TEST**: Integration test verifying admin setting changes directly alter `notify()` channel routing.

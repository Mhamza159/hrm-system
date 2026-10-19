# Tasks Breakdown: M8 Notifications & Announcements

**Feature Identifier**: `07-notifications`  
**Feature Branch**: `feature/07-notifications`  
**Target Module**: Module M8 (Notifications & Announcements · Core HR Group)  
**Spec Document**: [`.specify/specs/07-notifications/spec.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/.specify/specs/07-notifications/spec.md)  
**Plan Document**: [`.specify/specs/07-notifications/plan.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/.specify/specs/07-notifications/plan.md)  
**Governing Guide**: [`docs/BUILD-GUIDE.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/docs/BUILD-GUIDE.md) Section 9 (Rows 8.1–8.8)  
**Architecture Rules**: Plain JavaScript only (`.js` / `.jsx`), Vertical Slice order (BE $\rightarrow$ FE $\rightarrow$ Row Test), P1 first then P2.

---

## Phase 1: Core Real-Time In-App & Operational Alerts (Priority P1)

### Slice 8.1: Unified Multi-Channel `notify()` Service & Socket.io Room Engine (BUILD-GUIDE ID 8.1)
- [x] **8.1-BE**: Install `socket.io` in backend. In `backend/src/server.js`, upgrade server bootstrapper using `http.createServer(app)`. Create `backend/src/services/socket.service.js` with Socket.io JWT authentication middleware, room joining (`user:<userId>`, `dept:<deptId>`, `company:broadcast`), and emitter helper `emitToUser(userId, event, data)`. Create `backend/src/models/notification.model.js` schema (`userId`, `type`, `title`, `body`, `link`, `isRead`, `readAt`, `metadata`) with compound index `{ userId: 1, isRead: 1, createdAt: -1 }` and 90-day TTL index. Create `backend/src/services/notify.service.js` implementing the single canonical function `notify(userIds, payload)`: insert documents to MongoDB, emit real-time event `notification:new` via Socket.io, and check user preferences before queueing external delivery.
- [x] **8.1-FE**: Install `socket.io-client` in frontend. Create `frontend/src/features/notifications/hooks/useSocket.js` managing authenticated WebSocket connection lifecycle with JWT token, room listener `notification:new`, and automatic reconnect. Create `frontend/src/features/notifications/notificationsApi.js` with RTK Query base injection.
- [x] **8.1-TEST**: Unit & integration test in `backend/tests/notify.service.test.js`: verify calling `notify()` saves records in MongoDB; verify event emission to specific user socket room; verify bulk dispatch to multiple recipients; verify resilient execution if socket or queue has transient errors.

---

### Slice 8.2: Real-Time In-App Notification Bell, Slide-Out Drawer & Archive (BUILD-GUIDE ID 8.2)
- [x] **8.2-BE**: In `backend/src/modules/notifications/notification.validation.js`, define query schema (page, limit, unreadOnly). In `notification.service.js`, implement `getUserNotifications(userId, query)`, `markAsRead(notificationId, userId)`, and `markAllAsRead(userId)`. In `notification.controller.js` and `notification.routes.js`, implement `GET /api/v1/notifications`, `PATCH /api/v1/notifications/:id/read`, and `PATCH /api/v1/notifications/read-all` guarded by `authenticate` and `checkPermission('notification.view')`. Mount routes in `backend/src/app.js`.
- [x] **8.2-FE**: In `notificationsApi.js`, add queries `getNotifications`, `markAsRead`, and `markAllAsRead` with tag invalidation (`['Notification']`). Create `frontend/src/features/notifications/components/NotificationBell.jsx` displaying bell icon with live animated unread count badge. Create `NotificationDrawer.jsx` slide-out drawer showing recent notifications list, "Mark all read" button, and empty state. Create `NotificationItem.jsx` showing type badge, title, body, timestamp (PKT), and click-to-navigate action. Mount `NotificationBell` in `frontend/src/components/layout/Topbar.jsx`. Create `frontend/src/features/notifications/pages/NotificationsPage.jsx` for full paginated history with tab filters (All, Unread). Register `/notifications` in `App.jsx`.
- [x] **8.2-TEST**: Integration test in `backend/tests/notifications.api.test.js`: verify authenticated user retrieves paginated notifications with unread counter (HTTP 200); verify marking notification as read updates `isRead: true` and sets `readAt` (HTTP 200); verify marking all read updates all unread records (HTTP 200); verify user cannot read or mutate another user's notifications (HTTP 403 / 404).

---

### Slice 8.5: Granular User Notification Preferences Center (BUILD-GUIDE ID 8.5)
- [x] **8.5-BE**: In `backend/src/models/user.model.js`, extend schema with `notificationPrefs` sub-document containing categories (`attendance`, `leave`, `payroll`, `announcement`) each with `{ inApp: Boolean, email: Boolean, whatsapp: Boolean }`. In `notification.validation.js`, define `updatePreferencesSchema`. In `notification.service.js`, implement `getPreferences(userId)` and `updatePreferences(userId, prefs)`. In `notification.routes.js`, implement `GET /api/v1/notifications/preferences` and `PATCH /api/v1/notifications/preferences`. Update `notify.service.js` to evaluate recipient preferences before dispatching email or WhatsApp.
- [x] **8.5-FE**: Add `getPreferences` and `updatePreferences` in `notificationsApi.js`. Create `frontend/src/features/notifications/pages/NotificationSettingsPage.jsx` with category cards, clean toggle switches for In-App, Email, and WhatsApp channels, and save feedback. Add "Notification Settings" link in `Topbar.jsx` user dropdown and register `/settings/notifications` in `App.jsx`.
- [x] **8.5-TEST**: Integration test in `backend/tests/notifications.api.test.js`: verify user fetches default preferences (HTTP 200); verify updating preferences persists toggle state (HTTP 200); verify `notify()` suppresses email dispatch when user has `email: false` for that category while in-app notification still delivers.

---

### Slice 8.3: Asynchronous Transactional Email Notification Queue (BUILD-GUIDE ID 8.3)
- [x] **8.3-BE**: Create `backend/src/services/queue.service.js` using BullMQ configuring `notificationQueue` and worker with Redis connection. Create email notification processor: pull company email template from Module M2 (`TemplatesForm.jsx`), replace variables (`{{employeeName}}`, `{{actionTitle}}`, `{{details}}`, `{{portalUrl}}`), and deliver via `email.service.js` (Nodemailer). Configure graceful fallback to direct asynchronous dispatch if Redis is disabled or in local test environment.
- [x] **8.3-TEST**: Test email queue in `backend/tests/email-notifications.test.js`: verify triggering a notification with email preference active queues a BullMQ job; verify template variables are replaced accurately; verify email is dispatched via SMTP mock without blocking HTTP response.

---

### Slice 8.6: Company & Department Broadcast Announcements (BUILD-GUIDE ID 8.6)
- [x] **8.6-BE**: Register permissions `announcement.view`, `announcement.create`, `announcement.edit`, `announcement.delete`, `announcement.pin` in `backend/src/shared/permissions.js` and seed core roles in `roles.seed.js`. Create `backend/src/models/announcement.model.js` schema (`title`, `content`, `targetAudience`, `departmentId`, `priority`, `pinned`, `authorId`, `readBy`, `isDeleted`). In `backend/src/modules/announcements/announcement.validation.js`, define create and update schemas. In `announcement.service.js`, implement `getAnnouncements(query, actor, scope)`, `createAnnouncement(payload, actor)`, `updateAnnouncement(id, payload, actor)`, and `deleteAnnouncement(id, actor)`. In `announcement.routes.js`, implement CRUD `/api/v1/announcements` with CASL guards. Trigger `notify()` for targeted audience upon publishing.
- [x] **8.6-FE**: Create `frontend/src/features/announcements/announcementsApi.js` with RTK Query CRUD endpoints. Create `frontend/src/features/announcements/components/AnnouncementCard.jsx` showing author avatar, role badge, department tag, priority pill, relative time, and content. Create `AnnouncementFormModal.jsx` for creating/editing with title, rich content textarea, audience selector (Company vs Department), and priority selector. Create `frontend/src/features/announcements/pages/AnnouncementsPage.jsx` with search bar, department filter pills, and "New Announcement" button wrapped in `<Can I="announcement.create" a="Announcement">`. Register `/announcements` in `App.jsx` and add link in `Sidebar.jsx`.
- [x] **8.6-TEST**: Integration test in `backend/tests/announcements.api.test.js`: verify Super Admin and HR Manager create company-wide and department announcements (HTTP 201); verify Department Manager publishes announcement strictly to own department (HTTP 201); verify Department Manager attempt to post company-wide returns HTTP 403 Forbidden; verify Employee receives only company announcements and announcements matching their department.

---

## Phase 2: Notice Board, Read Receipts, WhatsApp & E2E (Priority P2)

### Slice 8.7: Executive Notice Board & Pinned Announcement Cards (BUILD-GUIDE ID 8.7)
- [x] **8.7-BE**: In `announcement.service.js`, implement `togglePinAnnouncement(id, pinned, actor)`: verify actor holds `announcement.pin`; enforce maximum 3 pinned announcements at any time (if 4th is pinned, automatically unpin the oldest pinned announcement); record audit log. In `announcement.routes.js`, implement `PATCH /api/v1/announcements/:id/pin`.
- [x] **8.7-FE**: Add `togglePinAnnouncement` in `announcementsApi.js`. Add pin/unpin action button with icon on `AnnouncementCard.jsx` wrapped in `<Can I="announcement.pin" a="Announcement">`. Create `frontend/src/features/announcements/components/PinnedNoticeBoard.jsx` displaying pinned announcement cards with golden accent highlight and badge. Mount `PinnedNoticeBoard` on `frontend/src/features/dashboard/DashboardPage.jsx` for all user roles.
- [x] **8.7-TEST**: Test pinning in `backend/tests/announcements.api.test.js`: verify HR Manager pins announcement (HTTP 200); verify pinned announcements appear at the top of the list; verify pinning a 4th announcement automatically unpins the oldest; verify Employee receiving HTTP 403 when attempting to pin.

---

### Slice 8.8: Live Read Receipts Tracking & Engagement Analytics (BUILD-GUIDE ID 8.8)
- [x] **8.8-BE**: In `announcement.service.js`, implement `recordReadReceipt(announcementId, userId)`: check if `userId` is already in `readBy.userId`; if not, push `{ userId, readAt: new Date() }`. Implement `getReadReceipts(announcementId, actor)` returning populated list of readers with user name, email, department, and `readAt`. In `announcement.routes.js`, implement `PATCH /api/v1/announcements/:id/read` and `GET /api/v1/announcements/:id/receipts` guarded by `checkPermission('announcement.view')`.
- [x] **8.8-FE**: Add `recordReadReceipt` and `getReadReceipts` in `announcementsApi.js`. In `AnnouncementCard.jsx`, trigger `recordReadReceipt` on component view. Render "Seen by X of Y staff" progress bar visible to author, HR, and Admin. Create `frontend/src/features/announcements/components/ReadReceiptsModal.jsx` displaying table of readers, department, and timestamps.
- [x] **8.8-TEST**: Test read receipts in `backend/tests/announcements.api.test.js`: verify employee reading announcement records receipt (HTTP 200); verify subsequent views do not duplicate entries; verify HR Manager inspects read receipts breakdown with percentage (HTTP 200); verify Employee cannot view other users' read receipts (HTTP 403).

---

### Slice 8.4: WhatsApp Notifications Gateway & Cloud API Adapter (BUILD-GUIDE ID 8.4)
- [x] **8.4-BE**: Create `backend/src/services/whatsapp.service.js`: implement `sendWhatsAppMessage({ to, message, templateName, templateData })` supporting WhatsApp Cloud API integration and automatic fallback to structured sandbox logger in development/test environments. Wire into BullMQ worker for urgent operational alerts.
- [x] **8.4-TEST**: Test WhatsApp service in `backend/tests/whatsapp-notifications.test.js`: verify payload formatting for Pakistani mobile numbers (`+923XXXXXXXXX`); verify sandbox logger records outgoing alert without throwing error when API keys are unconfigured.

---

## Phase 3: Multi-Role End-to-End Verification (`E2E-M8`)

### Slice E2E-M8: Multi-Role Live End-to-End Playwright Verification (All 4 Default Roles)
- [x] **E2E-M8**: Create automated test `backend/tests/m8.notifications.e2e.test.js` verifying complete end-to-end user journeys:
  1. **Super Admin Flow**: Log in $\rightarrow$ publish pinned company announcement "Annual Company Retreat & Holiday Schedule" $\rightarrow$ inspect notice board on dashboard $\rightarrow$ verify real-time Socket.io broadcast.
  2. **HR Manager Flow**: Log in $\rightarrow$ trigger operational alert via unified `notify()` $\rightarrow$ verify in-app bell notification is delivered to all staff $\rightarrow$ inspect read receipts modal showing reader percentages $\rightarrow$ configure template dispatches.
  3. **Department Manager Flow**: Log in $\rightarrow$ navigate to `/announcements` $\rightarrow$ publish department-specific notice for "Engineering Sprint Deadline" $\rightarrow$ verify blocked from publishing company-wide announcement (HTTP 403) $\rightarrow$ inspect subordinate read receipts.
  4. **Employee Flow**: Log in with onboarded credentials $\rightarrow$ observe live topbar notification bell badge update $\rightarrow$ open notification drawer and click notice $\rightarrow$ verify auto-navigation and read receipt recorded $\rightarrow$ navigate to `/settings/notifications` and toggle channel preferences.

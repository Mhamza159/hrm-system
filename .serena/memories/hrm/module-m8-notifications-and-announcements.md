# Module M8: Notifications & Announcements (Completed & Verified)

## Overview
Module M8 provides an omnichannel notification engine (In-App, Email, WhatsApp) and an Executive Announcement Board with pinned notices, data scoping, and live read receipts.

## Models
1. **Notification (`backend/src/models/notification.model.js`)**:
   - `userId`: ObjectId ref to User (indexed).
   - `type`: Enum ['leave', 'attendance', 'payroll', 'announcement', 'security', 'profile', 'system'].
   - `title`: String (required).
   - `body`: String (required).
   - `link`: String (relative portal route, optional).
   - `isRead`: Boolean (default: false, indexed compound with userId).
   - `readAt`: Date.
   - `metadata`: Mixed object (e.g., announcementId, priority).

2. **Announcement (`backend/src/models/announcement.model.js`)**:
   - `title`: String (required, trimmed).
   - `content`: String (required).
   - `authorId`: ObjectId ref to User (required).
   - `targetAudience`: Enum ['company', 'department'] (default: 'company').
   - `departmentId`: ObjectId ref to Department (required if targetAudience is 'department').
   - `priority`: Enum ['low', 'normal', 'high', 'urgent'] (default: 'normal').
   - `pinned`: Boolean (default: false, indexed compound with isDeleted). Max 3 active pinned notices.
   - `readBy`: Array of subdocuments `{ userId: ObjectId, readAt: Date }`.
   - `isDeleted`: Boolean (soft deletion, indexed).

3. **Notification Settings Schema (`backend/src/modules/settings/setting.validation.js`)**:
   - Stored under key `'notifications'` in `Setting` collection.
   - `channels`: `{ inApp: boolean, email: boolean, whatsapp: boolean }` (Global master delivery toggles).
   - `announcements`: `{ inApp: boolean, email: boolean, whatsapp: boolean }` (Broadcast delivery toggles).
   - `categories`: `{ attendance, leave, payroll, announcement }` (Granular module delivery toggles).

## Core Services & Architecture
- **Centralized `notify()` (`backend/src/services/notify.service.js`)**: Single entry point used across all modules. Dynamically checks `SettingService.getSetting('notifications')` to enforce Admin channel strategy (In-App Only, Email Only, WhatsApp Only, Mixed).
- **Real-Time Hub (`backend/src/services/socket.service.js`)**: Socket.io authenticated via JWT. Automatically joins `user:${userId}`, `company:broadcast`, and `department:${deptId}` rooms.
- **WhatsApp Gateway (`backend/src/services/whatsapp.service.js`)**: Standardizes Pakistani phone numbers to E.164 (`+923XXXXXXXXX`) and handles Meta WhatsApp Cloud API with sandbox fallback.
- **Queue Service (`backend/src/services/queue.service.js`)**: Dispatches async BullMQ jobs for branded HTML emails.

## REST APIs
- `GET /api/v1/notifications` — Paginated user notifications & unread badge count.
- `PATCH /api/v1/notifications/:id/read` — Mark single notification as read.
- `PATCH /api/v1/notifications/read-all` — Mark all unread notifications as read.
- `GET /api/v1/notifications/preferences` — Get user channel preferences.
- `PATCH /api/v1/notifications/preferences` — Update user channel preferences.
- `GET /api/v1/announcements` — List scoped announcements (company + user's department).
- `POST /api/v1/announcements` — Create announcement (Scoped to company or actor's department).
- `PATCH /api/v1/announcements/:id` — Update announcement (Author/HR).
- `DELETE /api/v1/announcements/:id` — Soft-delete announcement.
- `PATCH /api/v1/announcements/:id/pin` — Toggle pin status (enforces FIFO max-3 constraint).
- `PATCH /api/v1/announcements/:id/read` — Record employee read receipt.
- `GET /api/v1/announcements/:id/receipts` — Author/HR view seen breakdown.
- `PATCH /api/v1/settings/notifications` — Admin channel strategy configuration.

## CASL Permissions
- `announce.company`: Manage company-wide announcements (Super Admin, HR Manager).
- `announce.team`: Manage department-specific announcements (Department Manager).
- `announce.view`: View visible announcements and notice board (All roles).
- `settings.manage`: Configure notification & announcement channel strategies (Super Admin, HR Manager).

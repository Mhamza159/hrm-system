# Feature Specification: Module M8 — Notifications & Announcements

**Feature Branch**: `feature/07-notifications`  
**Created**: 2026-10-19  
**Status**: Ready for Architectural Planning & Implementation  
**Module ID**: M8  
**Module Name**: Notifications & Announcements (Core HR Group · Launch Scope P1)  
**Spec Folder**: `.specify/specs/07-notifications`  
**Governing Documents**:
- [`docs/FRD.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/docs/FRD.md) Section M8 (Notifications & Announcements) & Section 11 (Permission Matrix M8 Row)
- [`docs/BUILD-GUIDE.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/docs/BUILD-GUIDE.md) Section 9 (Rows 8.1 to 8.8)
- [`docs/TECH-SPEC.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/docs/TECH-SPEC.md) Section 1, 2, 4, 7 & 8

---

## 1. Executive Summary & Architecture Integration

Module M8 provides the real-time communication, operational alerting, and broadcast notice infrastructure across the HRM system. It replaces fragmented notification patterns with a single, unified backend service adapter: `notify(userIds, payload)`.

### Architectural Invariants & Cross-Module Dependencies
- **Centralized Event Dispatch (`notify.service.js`)**: All upstream and downstream modules (Authentication, Attendance, Leaves, Approvals, Profile Changes, Payroll, and Settings) invoke this service rather than implementing ad-hoc email or notification logic.
- **Multi-Channel Delivery Engine**:
  1. **In-App & Real-Time**: Instant push via **Socket.io** rooms (`user:<id>`, `dept:<id>`, `company`) with live unread badge updates and audio-visual cues.
  2. **Database Persistence**: Saved in MongoDB `notifications` collection with indexed fast pagination and TTL auto-cleanup.
  3. **Transactional Email**: Queued via **BullMQ** worker using **Nodemailer** with branded company templates (from Module M2).
  4. **WhatsApp Alerts**: Cloud API / sandbox adapter queued via BullMQ for high-priority operational alerts (e.g. emergency announcements, leave decisions, payslip availability).
- **User Preference Enforcement**: Checks recipient `notificationPrefs` prior to dispatching email or WhatsApp. If a user turns off email alerts for a category, only in-app alerts are delivered.
- **Broadcast Announcements**: Company-wide and department-scoped notice board with pinning capabilities and real-time read receipts (`Seen by X/Y`).
- **M26 RBAC Integration**: Governed by granular CASL permissions:
  - `notification.view`, `notification.manage`
  - `announcement.view`, `announcement.create`, `announcement.edit`, `announcement.delete`, `announcement.pin`
  - Scopes: Super Admin (`all`), HR Manager (`all`), Department Manager (`department`), Employee (`own`).

---

## 2. Context7 Verified Library Syntax Patterns

### 2.1 Socket.io v4 Room-Based Push & Auth Middleware
*Source: Official Socket.IO v4 Server Documentation via Context7 (`/websites/socket_io_v4`)*

```javascript
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

let io = null;

export const initSocketIO = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN || 'http://localhost:5173',
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  // Socket.io JWT Authentication Middleware
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
      if (!token) {
        return next(new Error('Authentication token required'));
      }
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
      socket.data.user = decoded; // { userId, email, roles, departmentId }
      next();
    } catch (err) {
      next(new Error('Invalid socket credentials'));
    }
  });

  io.on('connection', (socket) => {
    const { userId, departmentId } = socket.data.user;

    // Join personal user room for private alerts
    socket.join(`user:${userId}`);

    // Join department room for team alerts
    if (departmentId) {
      socket.join(`dept:${departmentId}`);
    }

    // Join company broadcast room
    socket.join('company:broadcast');

    socket.on('disconnect', () => {
      // Clean room departure handled automatically by Socket.io
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io has not been initialized');
  }
  return io;
};
```

### 2.2 BullMQ Queue & Worker Architecture for Async Notifications
*Source: Official BullMQ Documentation via Context7 (`/websites/bullmq_io`)*

```javascript
import { Queue, Worker } from 'bullmq';
import { redisConnection } from '../config/redis.js';

export const NOTIFICATION_QUEUE_NAME = 'hrm_notification_queue';

// Queue instance for producer modules
export const notificationQueue = new Queue(NOTIFICATION_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000
    },
    removeOnComplete: 100,
    removeOnFail: 500
  }
});

// Worker instance for consumer processing
export const initNotificationWorker = (emailHandler, whatsappHandler) => {
  const worker = new Worker(
    NOTIFICATION_QUEUE_NAME,
    async (job) => {
      const { channel, recipient, subject, body, metadata } = job.data;
      if (channel === 'email') {
        await emailHandler({ to: recipient, subject, html: body, metadata });
      } else if (channel === 'whatsapp') {
        await whatsappHandler({ to: recipient, message: body, metadata });
      }
    },
    { connection: redisConnection, concurrency: 5 }
  );

  worker.on('failed', (job, err) => {
    console.error(`[BullMQ] Notification Job ${job?.id} failed:`, err.message);
  });

  return worker;
};
```

---

## 3. Role-Based Permissions & Access Matrix

Governed by [`docs/FRD.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/HRM/docs/FRD.md) Section 11 (Permission Matrix M8 Row):

| Role | Scope | In-App Notifications | Announcements | Read Receipts | Preferences |
| :--- | :---: | :--- | :--- | :--- | :--- |
| **Super Admin** | `all` | Full view of own alerts; manage all system templates | Create, edit, delete & pin Company and Department announcements | Inspect full company read receipts | Configure own and system default preferences |
| **HR Manager** | `all` | Full view of own alerts; trigger system broadcasts | Create, edit, delete & pin Company and Department announcements | Inspect complete read receipts with breakdown | Configure own preferences |
| **Department Manager** | `department` | View alerts for self and direct subordinates | Create and pin announcements scoped to own Department | Inspect read receipts for own department | Configure own preferences |
| **Employee** | `own` | View, mark read, and archive own in-app notifications | View company announcements and assigned department announcements | Mark announcement as read (records receipt) | Configure personal channel preferences |

---

## 4. User Stories & Acceptance Criteria (Rows 8.1 to 8.8)

### Story 8.1 (Priority P1): Unified `notify(userIds, payload)` Multi-Channel Service (BUILD-GUIDE 8.1)
**As a** system service across any HRM module (Auth, Attendance, Leave, Payroll, Settings),  
**I want to** invoke a single unified `notify(userIds, payload)` function,  
**So that** database storage, real-time Socket.io push, and background Email/WhatsApp alerts happen in a decoupled, robust pipeline.

#### Acceptance Criteria
1. **Given** one or more recipient user IDs (`string` or `string[]`) and a payload `{ type, title, body, link, channel?, metadata }`,
2. **When** `notify()` is invoked,
3. **Then**:
   - Persists a new `Notification` document for each user in MongoDB.
   - Pushes real-time Socket.io event `notification:new` to `user:<id>` room.
   - Checks each recipient's `notificationPrefs` to evaluate if email or WhatsApp channels are enabled for this notification category.
   - If enabled and configured, dispatches async jobs to BullMQ (`notificationQueue`) for email/WhatsApp processing.
   - Returns summary `{ success: true, count: number }` without blocking caller execution.

---

### Story 8.2 (Priority P1): Real-Time In-App Notification Bell & Drawer (BUILD-GUIDE 8.2)
**As an** authenticated user (Super Admin, HR, Department Manager, Employee),  
**I want to** see a notification bell in the topbar with an unread badge counter and slide-out drawer,  
**So that** I am instantly alerted to pending tasks, approvals, and system events.

#### Acceptance Criteria
1. **Given** an authenticated user on any page,
2. **When** a new notification is dispatched to their user ID,
3. **Then**:
   - The notification bell badge increments in real time without refreshing the page.
   - Clicking the bell opens a slide-out drawer showing recent notifications with type icons, timestamp (in PKT), and preview text.
   - Clicking an unread notification marks it as read (`PATCH /api/v1/notifications/:id/read`), decrements the unread count, and navigates to the associated `link`.
   - Clicking "Mark All as Read" (`PATCH /api/v1/notifications/read-all`) updates all unread notifications to read status.
   - A link "View All Notifications" navigates to `/notifications` (`NotificationsPage.jsx`) with pagination and filter tabs (All, Unread, Mentions).

---

### Story 8.3 (Priority P1): Automated Transactional Email Notifications & Template Dispatch (BUILD-GUIDE 8.3)
**As an** employee or manager,  
**I want to** receive branded email alerts for key operational milestones (leave approvals, probation notices, payslips),  
**So that** I stay informed even when not logged into the portal.

#### Acceptance Criteria
1. **Given** a high-priority event (e.g. Leave Approved/Rejected, Password Reset, Profile Change Request Decision),
2. **When** `notify()` executes with email enabled in user preferences,
3. **Then**:
   - BullMQ picks up the job and compiles the email using the configured company email template (from Module M2).
   - Variables like `{{employeeName}}`, `{{actionTitle}}`, `{{details}}`, `{{portalUrl}}` are dynamically populated.
   - Nodemailer delivers the email via configured SMTP credentials.
   - If SMTP fails or times out, BullMQ retries up to 3 times with exponential backoff before logging a failure without affecting the in-app notification.

---

### Story 8.4 (Priority P2): WhatsApp Notifications Gateway / Cloud API Adapter (BUILD-GUIDE 8.4)
**As an** organization administrator,  
**I want to** optionally route urgent alerts to employees via WhatsApp Business API,  
**So that** critical operational events (emergency announcements, shift changes, salary disbarment) are noticed immediately.

#### Acceptance Criteria
1. **Given** WhatsApp configuration enabled in `.env` / Company Settings and user phone number in valid E.164 Pakistani format (`+923XXXXXXXXX`),
2. **When** a critical notification triggers with `channels: ['whatsapp']` and user preference is active,
3. **Then**:
   - `whatsapp.service.js` compiles the message template and executes the WhatsApp Cloud API POST request (or sandbox mock in development/test mode).
   - In test/development mode, sandbox logger captures the payload without requiring a live Meta account.
   - Delivery failures are logged gracefully in audit logs without halting the application flow.

---

### Story 8.5 (Priority P1): Granular Notification Preferences Center (BUILD-GUIDE 8.5)
**As an** employee or manager,  
**I want to** customize my notification preferences across channels (In-App, Email, WhatsApp) for each event category,  
**So that** I am not overwhelmed by unwanted notifications.

#### Acceptance Criteria
1. **Given** any authenticated user navigating to `/settings/notifications` (`NotificationSettingsPage.jsx`),
2. **When** inspecting the preferences grid,
3. **Then**:
   - Categories are grouped cleanly:
     - *Attendance & Shifts* (Check-in reminders, shift changes, late alerts)
     - *Leaves & Holidays* (Application status, approvals, holiday alerts)
     - *Payroll* (Payslip generated, bonus disbursement)
     - *Announcements* (Company notices, department bulletins)
   - Each category features individual toggle switches for `inApp`, `email`, and `whatsapp`.
   - Updating a toggle calls `PATCH /api/v1/notifications/preferences` and saves the updated configuration to `user.notificationPrefs`.
   - Turning off a channel immediately stops subsequent dispatches on that specific channel for that category.

---

### Story 8.6 (Priority P1): Company & Department Broadcast Announcements (BUILD-GUIDE 8.6)
**As a** Super Admin, HR Manager, or Department Manager,  
**I want to** publish rich text announcements targeted at the entire company or a specific department,  
**So that** staff members receive official organizational news and updates.

#### Acceptance Criteria
1. **Given** Super Admin or HR Manager (`announcement.create` with `all` scope),
   - They can publish announcements targeted to `All Company` or select a specific `Department`.
2. **Given** Department Manager (`announcement.create` with `department` scope),
   - They can publish announcements strictly targeted to their own `Department`.
   - Attempting to publish company-wide returns `403 Forbidden`.
3. **Given** an Employee (`announcement.view`),
   - They can view company-wide announcements and announcements matching their assigned `departmentId`.
   - They cannot view announcements intended for other departments.
4. **When** an announcement is published:
   - It is stored in `announcements` collection.
   - A real-time Socket.io broadcast is sent (`announcement:new`).
   - All targeted users receive an in-app notification linking to `/announcements/:id`.

---

### Story 8.7 (Priority P2): Executive Notice Board & Pinned Announcement Cards (BUILD-GUIDE 8.7)
**As an** employee or manager visiting the dashboard,  
**I want to** see pinned announcements highlighted at the top of the Notice Board,  
**So that** critical policy changes or urgent messages are never missed.

#### Acceptance Criteria
1. **Given** an announcement with `pinned: true`,
2. **When** users open the Dashboard (`/dashboard`) or Announcements page (`/announcements`),
3. **Then**:
   - Pinned announcements render with priority gold/accent border and a prominent "Pinned Notice" badge.
   - Pinned cards support a maximum of 3 pinned items at a time; if a 4th is pinned, the oldest pinned item is automatically unpinned.
   - Super Admin and HR Manager can toggle pin status via `PATCH /api/v1/announcements/:id/pin`.
   - Department Managers can pin announcements within their own department.

---

### Story 8.8 (Priority P2): Live Read Receipts & Engagement Analytics (BUILD-GUIDE 8.8)
**As an** author or HR administrator who published an announcement,  
**I want to** track who has viewed the notice with real-time read receipts,  
**So that** I have compliance proof of company-wide communication.

#### Acceptance Criteria
1. **Given** an active announcement viewed by an employee,
2. **When** the employee opens the announcement page or views the card for $>2$ seconds,
3. **Then**:
   - Triggers `PATCH /api/v1/announcements/:id/read`.
   - If user ID is not in `readBy.userId`, appends `{ userId: req.user._id, readAt: new Date() }`.
   - Authors (Super Admin, HR, Manager) see an engagement banner: `"Seen by 24 of 30 staff (80%)"` with a visual progress bar.
   - Clicking the receipt summary opens an audit modal listing readers, department, and exact read timestamp (PKT).
   - Employees only see that their own receipt has been recorded (`"You read this on Oct 19, 2026, 11:30 AM"`).

---

## 5. Data Models Schema Specification

### 5.1 Notification Model (`backend/src/models/notification.model.js`)
```javascript
import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ['system', 'attendance', 'leave', 'payroll', 'announcement', 'security', 'profile'],
      default: 'system',
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150
    },
    body: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500
    },
    link: {
      type: String,
      default: null
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true
    },
    readAt: {
      type: Date,
      default: null
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

// Compound index for instant querying of unread user notifications
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

// 90-day TTL index to automatically purge ancient notifications
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export const Notification = mongoose.model('Notification', notificationSchema);
```

### 5.2 Announcement Model (`backend/src/models/announcement.model.js`)
```javascript
import mongoose from 'mongoose';

const readReceiptSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    content: {
      type: String,
      required: true,
      trim: true
    },
    targetAudience: {
      type: String,
      enum: ['all', 'department'],
      default: 'all',
      index: true
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
      index: true
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal'
    },
    pinned: {
      type: Boolean,
      default: false,
      index: true
    },
    pinnedAt: {
      type: Date,
      default: null
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    readBy: [readReceiptSchema],
    attachments: [
      {
        fileName: String,
        fileUrl: String,
        fileSize: Number
      }
    ],
    isDeleted: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true
  }
);

announcementSchema.index({ targetAudience: 1, departmentId: 1, pinned: -1, createdAt: -1 });

export const Announcement = mongoose.model('Announcement', announcementSchema);
```

### 5.3 User Notification Preferences Extension (`user.model.js`)
```javascript
notificationPrefs: {
  attendance: {
    inApp: { type: Boolean, default: true },
    email: { type: Boolean, default: true },
    whatsapp: { type: Boolean, default: false }
  },
  leave: {
    inApp: { type: Boolean, default: true },
    email: { type: Boolean, default: true },
    whatsapp: { type: Boolean, default: false }
  },
  payroll: {
    inApp: { type: Boolean, default: true },
    email: { type: Boolean, default: true },
    whatsapp: { type: Boolean, default: false }
  },
  announcement: {
    inApp: { type: Boolean, default: true },
    email: { type: Boolean, default: true },
    whatsapp: { type: Boolean, default: false }
  }
}
```

---

## 6. REST API Endpoint Specifications

| Method | Endpoint | Permission | Request Body | Response Envelope | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/notifications` | `notification.view` (own) | Query: `?page=1&limit=20&unreadOnly=false` | `{ docs, total, unreadCount }` | Paginated personal notifications with unread counter |
| `PATCH` | `/api/v1/notifications/:id/read` | `notification.view` (own) | None | `{ notification }` | Mark single notification as read |
| `PATCH` | `/api/v1/notifications/read-all` | `notification.view` (own) | None | `{ modifiedCount }` | Mark all user notifications as read |
| `GET` | `/api/v1/notifications/preferences` | `notification.view` (own) | None | `{ preferences }` | Get logged-in user's channel preferences |
| `PATCH` | `/api/v1/notifications/preferences` | `notification.view` (own) | `{ attendance, leave, payroll, announcement }` | `{ preferences }` | Update user notification channels |
| `GET` | `/api/v1/announcements` | `announcement.view` | Query: `?page=1&limit=10&pinnedOnly=false` | `{ docs, total }` | Scoped announcements (Company + own Department) |
| `POST` | `/api/v1/announcements` | `announcement.create` | `{ title, content, targetAudience, departmentId?, priority?, pinned? }` | `{ announcement }` | Create announcement & dispatch push alert |
| `GET` | `/api/v1/announcements/:id` | `announcement.view` | None | `{ announcement, readReceiptsSummary }` | Get announcement details with read stats |
| `PATCH` | `/api/v1/announcements/:id` | `announcement.edit` | `{ title?, content?, priority? }` | `{ announcement }` | Update announcement details |
| `DELETE` | `/api/v1/announcements/:id` | `announcement.delete` | None | `{ success: true }` | Soft-delete announcement |
| `PATCH` | `/api/v1/announcements/:id/pin` | `announcement.pin` | `{ pinned: boolean }` | `{ announcement }` | Pin or unpin announcement on notice board |
| `PATCH` | `/api/v1/announcements/:id/read` | `announcement.view` | None | `{ readCount, readAt }` | Record reader receipt for current user |

---

## 7. Verification Strategy & Multi-Role Testing

1. **Unit & Service Tests (`backend/tests/notify.service.test.js`)**:
   - Verify `notify()` inserts documents into MongoDB.
   - Verify Socket.io emission to `user:<id>` room.
   - Verify BullMQ job dispatch honoring user `notificationPrefs`.
   - Verify channel suppression when user disables email or WhatsApp.
2. **API Integration Tests (`backend/tests/notifications.api.test.js`)**:
   - Verify pagination and unread counts in `GET /notifications`.
   - Verify `PATCH /notifications/:id/read` and `PATCH /notifications/read-all`.
   - Verify user preference updates and persistence.
3. **Announcement Scoping Tests (`backend/tests/announcements.api.test.js`)**:
   - Verify Super Admin publishes company-wide and department notices (HTTP 201).
   - Verify Department Manager publishes to own department (HTTP 201) and is blocked from company-wide (HTTP 403).
   - Verify Employee cannot access other department announcements.
   - Verify read receipts recording and pin toggling.
4. **Multi-Role End-to-End Suite (`backend/tests/m8.notifications.e2e.test.js`)**:
   - Full 4-role user journey: Super Admin publishes pinned announcement $\rightarrow$ Employee receives real-time bell increment $\rightarrow$ Employee opens drawer and reads notice $\rightarrow$ Super Admin inspects read receipt.

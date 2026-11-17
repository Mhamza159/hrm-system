# Phase 17: Internal Chat Module – Complete Audit & Research

## 1. Executive Summary & Module Overview
The **Internal Chat Module** (Module M24 / BUILD-GUIDE Section 29) is the enterprise real-time messaging backbone of the HRMS platform. It provides:
1. **Direct 1-to-1 Messaging**: High-performance peer-to-peer messaging between verified coworkers with presence telemetry and typing indicators.
2. **Custom Group Channels**: Project and task-oriented multi-user groups with member management, administrative ownership, and participant controls.
3. **Automated Department Channels**: Dynamically synchronized rooms linking employees directly to their departmental peers (`type: 'department'`).
4. **Vaulted File & Media Attachments**: 10MB memory-safe attachment handling supporting documents, PDFs, and inline image previews.
5. **Real-time Socket.IO Hub**: Centralized WebSocket connection authenticated via JWT handshake, isolated room partitions (`conversation:${id}`), and cross-session message dispatch.

---

## 2. PBAC & RBAC Security Matrix

| Action | Capability | Permitted Roles | Business Rules & Invariants |
| :--- | :--- | :--- | :--- |
| **Access Internal Chat** | `chat.access` | Super Admin, HR Manager, Dept Manager, Employee | All active employees with platform credentials can access the chat interface and participate in conversations they belong to. Inactive/terminated accounts are barred. |
| **Direct Messaging** | `chat.access` | All Roles | Users can initiate direct conversations with any active coworker. 1-to-1 conversations use a deterministic `directKey` (`[minId, maxId].join('_')`) preventing duplicate rooms. |
| **Create Group Chat** | `chat.create_group` | All Roles | Any authenticated employee can create a custom group and invite coworkers. The creator is designated as `admin`. |
| **Modify Participants** | `chat.create_group` | Group Admin, Super Admin | Group creators and Super Admins can add or remove members from custom groups. Department channel membership is governed automatically by HR departmental assignment. |
| **Archive Channel** | `chat.archive` | Super Admin | Only Super Admins can permanently archive a conversation. Once archived, the channel is frozen in read-only mode for all participants. |
| **Send Messages / Uploads** | `chat.access` | Active Participants | Users can only send messages and upload attachments to conversations where they are registered in the `participants` array. Handshake & API verify membership. |

---

## 3. Backend Architecture & Real-Time Socket Audit

### Data Models
- **`Conversation` (`conversation.model.js`)**:
  - `type`: `['direct', 'group', 'department']`
  - `name`: String (custom group name or department title)
  - `description`: String
  - `departmentId`: Ref `Department`
  - `participants`: Array of Ref `User`
  - `directKey`: String (`unique: true` for 1-to-1 deduplication)
  - `admin`: Ref `User`
  - `isArchived`: Boolean
  - `lastMessage`: `{ content, senderId, sentAt, messageType }`
  - `lastMessageAt`: Date (indexed for descending sort)
- **`Message` (`message.model.js`)**:
  - `conversationId`: Ref `Conversation` (indexed)
  - `senderId`: Ref `User` (indexed)
  - `content`: String
  - `messageType`: `['text', 'file', 'image', 'system']`
  - `attachments`: `[{ url, fileType, fileName, fileSize }]`
  - `readBy`: `[{ userId, readAt }]`
  - `isDeleted`: Boolean

### Real-Time Socket Events (`socket.service.js`)
- **Connection Handshake**: Validates JWT access token from `socket.handshake.auth.token` or headers.
- **`chat:join`**: Validates that `socket.data.user.userId` is in `conv.participants` (or Super Admin) before admitting to `conversation:${conversationId}`.
- **`chat:leave`**: Cleans up socket room subscription.
- **`chat:typing`**: Relays typing event to other members of the room with room verification.
- **`chat:presence`**: Emits `online` and `offline` status with timestamps across active sockets.
- **`chat:message`**: Dispatched via `emitToConversation` when a new message is saved.
- **`chat:read`**: Broadcasts read receipt updates.

---

## 4. Frontend Component Inventory & Audit Targets

| File | Purpose | Audit Findings & Required Enhancements |
| :--- | :--- | :--- |
| `pages/ChatPage.jsx` | Main workspace container | Currently uses generic shadcn tokens. Needs Forest & Emerald Enterprise theme (`#061A14` canvas, `#111D17` surfaces, `#1A3125` borders), clean mobile responsive toggling, and empty states. |
| `components/ConversationList.jsx` | Left sidebar & directory tabs | Needs modern segmented filter tabs (`All`, `Direct`, `Groups`, `Department`), unread counts in `#00C471` badges, live presence indicators (pulsing green dot), search input, and sync department trigger. |
| `components/ChatArea.jsx` | Message stream workspace | Needs header with participant presence, in-conversation search bar, smooth auto-scroll, typing telemetry banner ("X is typing..."), and empty conversation hero. |
| `components/MessageBubble.jsx` | Message bubbles & receipts | Needs distinct styling for sender (`#00C471` emerald bubble) vs recipient (`#111D17` surface with `#1A3125` border), formatted timestamps, double checkmarks for read status, and image/document attachment cards. |
| `components/MessageInput.jsx` | Message composer & uploader | Needs multiline auto-expanding composer, 10MB attachment uploader with file type tags, typing debouncer, and read-only archival lock banner. |
| `components/NewChatModal.jsx` | Start direct conversation | Modern modal with directory coworker search, employee avatar, department/designation tags, and instant room creation. |
| `components/NewGroupModal.jsx` | Create custom group | Modern modal with group name, description, colleague multi-select with checkmark pills, and validation. |
| `components/GroupInfoDrawer.jsx` | Channel details & participants | Slide-over drawer with participant roster, online indicators, admin star, add/remove member controls, leave group, and Super Admin archive toggle. |
| `hooks/useChatSocket.js` | WebSocket lifecycle hook | Verified Socket.IO event listener with automatic cache invalidation on `chat:message`, `chat:read`, `chat:presence`, and `chat:typing`. |

---

## 5. Visual Standards (Forest & Emerald Enterprise)
- **Background Canvas**: `#061A14` / `#0A110D`
- **Card / Panel Surfaces**: `#111D17`
- **Borders & Dividers**: `#1A3125`, hover `#2D4A3A`
- **Emerald Accent**: `#00C471`, hover `#00B064`, glow `rgba(0, 196, 113, 0.15)`
- **Sender Bubbles**: `#00C471` background with white `#FFFFFF` text
- **Recipient Bubbles**: `#111D17` background with `#1A3125` border and `#F8FAFC` text
- **Typography**: High contrast `#F8FAFC` for titles/content, `#7E9E8F` for timestamps/secondary, `#4E6E5D` for subtle hints

# Specification Contract: Module M24 — Internal Chat

**Module ID:** `M24`  
**Module Name:** `Internal Chat`  
**Phase:** `Phase 4: Engagement & Polish`  
**Specification Directory:** `.specify/specs/27-internal-chat/`  
**Source Documents:**
- `docs/FRD.md`: Section M24 (Features & Role-wise access)
- `docs/FRD.md`: Section 11 (Permission Matrix — M24 Row: Super Admin: `Full`, HR Manager: `Own`, Department Manager: `Own`, Employee: `Own`)
- `docs/BUILD-GUIDE.md`: Section 29 (Rows 24.1 to 24.7)
- `docs/TECH-SPEC.md`: Sections 3 (Architecture), 4 (Database), 5 (API Pipeline), 6 (Auth/PBAC)

---

## 1. Module Overview & Scope

Module M24 delivers a real-time, low-latency, organizational internal chat system for peer-to-peer and team collaboration across the enterprise. It provides:
1. **Direct (1-to-1) Messaging:** Confidential peer-to-peer conversations between any two company employees.
2. **Custom Group Channels:** Multi-participant collaborative discussions with customizable names and avatar badges.
3. **Automated Department Channels:** System-managed channels mapped to organizational departments, with dynamic membership synchronized upon employee assignment.
4. **Rich File & Media Sharing:** Secure attachment of images, PDFs, spreadsheets, and audio recordings using the existing upload service.
5. **Real-time Presence & Read Receipts:** Live online/offline status indicators (`socket presence`) and message read acknowledgment (`chat:read`, single/double tick tracking).
6. **Scoped Full-Text Message Search:** Quick historical conversation search with authorization filters ensuring users only search conversations they are participants of.
7. **Channel Archival & Moderation:** Super Admin capability to lock or archive inactive or policy-violating channels, rendering them read-only.

---

## 2. Role-Based Access Control (PBAC Matrix)

Per `docs/FRD.md` Section 11:
| Role | Access Level | Permissions | Scope Constraints |
|:---|:---|:---|:---|
| **Super Admin** | `Full` | `chat:access`, `chat:create_group`, `chat:message`, `chat:archive`, `chat:admin` | Unrestricted access across all channels; can archive/moderate any channel. |
| **HR Manager** | `Own` | `chat:access`, `chat:create_group`, `chat:message` | Can access 1-on-1 chats and groups where they are an active member. |
| **Department Manager** | `Own` | `chat:access`, `chat:create_group`, `chat:message` | Can access 1-on-1 chats, groups where member, and their departmental channel. |
| **Employee** | `Own` | `chat:access`, `chat:create_group`, `chat:message` | Can access 1-on-1 chats, groups where member, and their departmental channel. |

---

## 3. Official Library Documentation Patterns (Context7 Verification)

### 3.1 Socket.IO Server (`socket.service.js`)
- **Authentication Handshake:**
  ```javascript
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
    if (!token) return next(new Error('Authentication token required'));
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
    socket.data.user = { userId: decoded.userId || decoded.id, roles: decoded.roles || [] };
    next();
  });
  ```
- **Room Joining & Targeted Emission:**
  ```javascript
  // Room joining upon conversation switch or connect
  socket.join(`conversation:${conversationId}`);
  
  // Emitting message to all room participants except sender (or all in room)
  io.to(`conversation:${conversationId}`).emit('chat:message', messagePayload);
  
  // Emitting delivery/read receipts
  io.to(`conversation:${conversationId}`).emit('chat:read', { conversationId, readByUserId, readAt });
  ```

### 3.2 Socket.IO Client (`useChatSocket.js` / React)
- **Client Event Listening & Cleanup:**
  ```javascript
  socket.on('chat:message', (newMessage) => {
    // Update local conversation message store / RTK query cache
  });
  socket.on('chat:presence', ({ userId, status, lastSeen }) => {
    // Update online indicators
  });
  socket.on('chat:typing', ({ conversationId, userId, isTyping }) => {
    // Display typing indicators
  });
  ```

### 3.3 Mongoose Compound & Text Indexing
- **Conversation Model Indexing:**
  ```javascript
  conversationSchema.index({ participants: 1 });
  conversationSchema.index({ type: 1, departmentId: 1 });
  conversationSchema.index({ updatedAt: -1 });
  ```
- **Message Model Full-Text & Room Indexing:**
  ```javascript
  messageSchema.index({ conversationId: 1, createdAt: -1 });
  messageSchema.index({ content: 'text' });
  ```

---

## 4. User Stories & Acceptance Criteria (Rows 24.1 – 24.7)

### Story 24.1 (P1): One-to-One Direct Messaging
**ID:** `24.1`  
**Description:** As an employee, I want to start a 1-to-1 conversation with any coworker so that we can communicate privately and in real time.

- **Acceptance Criteria (Given $\rightarrow$ When $\rightarrow$ Then):**
  - **Employee:**
    - *Given* an authenticated employee in the Chat view,
    - *When* they click "New Chat", select a colleague from the directory, and submit a message,
    - *Then* an existing direct conversation is reused or a new one is created with `type: 'direct'`, and the message is delivered via Socket.io event `chat:message` in real time to the recipient.
  - **Department Manager / HR Manager:**
    - *Given* a Manager or HR representative,
    - *When* they initiate a direct chat with any staff member,
    - *Then* the conversation displays in their active list, preserving full message history in chronological order.
  - **Super Admin:**
    - *Given* Super Admin,
    - *When* initiating a direct chat with any staff member,
    - *Then* the recipient receives the message with sender profile metadata clearly rendered.
  - **Edge Cases & Security:**
    - A user cannot initiate a direct conversation with themselves (`400 Bad Request`).
    - Both participants must belong to the active company directory.
    - Subsequent messages in an existing 1-to-1 conversation must never spawn duplicate conversation records.

---

### Story 24.2 (P1): Custom Group Chat
**ID:** `24.2`  
**Description:** As a team member, I want to create named group chats with multiple coworkers so that project teams and committees can collaborate collectively.

- **Acceptance Criteria (Given $\rightarrow$ When $\rightarrow$ Then):**
  - **Employee / Manager / HR Manager:**
    - *Given* any authenticated user,
    - *When* they click "Create Group", enter a group name (e.g. "Sprint Planning"), and select 2 or more participants,
    - *Then* a conversation with `type: 'group'` is created with the creator as `admin`, and all participants are joined to the group room via Socket.io.
  - **Super Admin:**
    - *Given* Super Admin,
    - *When* viewing groups,
    - *Then* they can view active group conversations they belong to or oversee enterprise group communication.
  - **Group Management (Add/Remove Member):**
    - *Given* the group creator or admin,
    - *When* they add or remove a member via `PATCH /conversations/:id/participants`,
    - *Then* membership updates immediately, emitting `chat:member_updated` to the room.
  - **Edge Cases & Security:**
    - Group name cannot be empty or exceed 100 characters.
    - Groups must contain at least 2 distinct members besides the creator.

---

### Story 24.3 (P1): Automated Department Channels
**ID:** `24.3`  
**Description:** As an employee, I want to automatically be part of my department's channel so that I can stay in sync with departmental announcements and discussion without manual invite overhead.

- **Acceptance Criteria (Given $\rightarrow$ When $\rightarrow$ Then):**
  - **Employee / Department Manager:**
    - *Given* an employee assigned to a department (e.g. "Engineering"),
    - *When* they open the Chat page,
    - *Then* the auto-channel `type: 'department'` for their department appears permanently in their channels list, allowing them to read and post.
  - **Department Transfer / Assignment Synchronization:**
    - *Given* an employee who is transferred to another department or hired,
    - *When* their employee record is created or updated with a new `departmentId`,
    - *Then* the system automatically adds them to the new department's channel participants and removes them from the previous department channel.
  - **Super Admin & HR Manager:**
    - *Given* HR Manager or Super Admin,
    - *When* viewing channels,
    - *Then* they can browse and participate in all departmental channels for cross-functional support.

---

### Story 24.4 (P1): Rich File & Media Sharing
**ID:** `24.4`  
**Description:** As a chat participant, I want to send attachments (images, PDFs, documents) in conversations so that documents can be shared without leaving the platform.

- **Acceptance Criteria (Given $\rightarrow$ When $\rightarrow$ Then):**
  - **All Roles (Employee, Department Manager, HR Manager, Super Admin):**
    - *Given* a user in an active chat room,
    - *When* they click the attachment icon, select a file (up to 10MB; images, PDF, DOCX, XLSX, TXT), and send,
    - *Then* the file is uploaded securely to Cloudinary/storage, creating a message with `attachments: [{ url, fileType, fileName, fileSize }]`, and rendering inline previews or download buttons in the chat feed.
  - **Security & Validation:**
    - Executable files (`.exe`, `.sh`, `.bat`) and dangerous MIME types are rejected with HTTP 400.
    - URLs must adhere to HTTPS protocol.

---

### Story 24.5 (P1): Online Presence & Read Receipts
**ID:** `24.5`  
**Description:** As a user, I want to see which colleagues are currently online and know when my messages have been read.

- **Acceptance Criteria (Given $\rightarrow$ When $\rightarrow$ Then):**
  - **Presence Tracking:**
    - *Given* a user connecting their browser,
    - *When* their socket connection is established,
    - *Then* Socket.io broadcasts `presence:sync` marking their `status: 'online'`.
    - *When* they disconnect or close the tab,
    - *Then* the server updates their `status: 'offline'` with `lastSeen: new Date()`.
  - **Read Receipts:**
    - *Given* an unread message sent to a conversation,
    - *When* the recipient focuses or scrolls the active conversation into view,
    - *Then* client emits `chat:read` with `messageId` and `conversationId`,
    - *Then* server marks `readBy` array with `{ userId, readAt }` and notifies the sender via Socket.io, switching the message tick indicator from single tick (sent/delivered) to double blue ticks (read).

---

### Story 24.6 (P2): Full-Text Message Search
**ID:** `24.6`  
**Description:** As a user, I want to search past messages by keyword across my conversations so that I can quickly retrieve shared information.

- **Acceptance Criteria (Given $\rightarrow$ When $\rightarrow$ Then):**
  - **All Roles:**
    - *Given* a user on the Chat page,
    - *When* they type a search query in the search bar (`GET /api/v1/messages/search?q=query`),
    - *Then* only messages from conversations where the user is an active participant are returned, with the matched text highlighted and a shortcut to jump to that conversation and message context.
  - **Edge Cases & Security:**
    - Search input is escaped to prevent NoSQL injection and ReDoS.
    - Users can NEVER see or search messages from private conversations or groups they do not belong to.

---

### Story 24.7 (P2): Channel Archival & Admin Moderation
**ID:** `24.7`  
**Description:** As a Super Admin, I want to archive or disable channels so that inactive or inappropriate communication spaces can be sealed.

- **Acceptance Criteria (Given $\rightarrow$ When $\rightarrow$ Then):**
  - **Super Admin:**
    - *Given* Super Admin viewing conversation details or moderation settings,
    - *When* they trigger `PATCH /api/v1/conversations/:id/archive`,
    - *Then* `isArchived: true` is persisted, `archivedAt` and `archivedBy` are stamped, and all connected participants are notified via `chat:conversation_archived`.
  - **Read-Only Lockout:**
    - *Given* an archived conversation,
    - *When* any user attempts to send a new message (`POST /api/v1/messages`),
    - *Then* the API rejects the request with `403 Forbidden` ("This conversation has been archived and is read-only"), and the frontend disables the message input with a banner: *"This conversation is archived"*.
  - **Non-Admin Restriction:**
    - Regular Employees, Department Managers, and HR Managers cannot archive or unarchive channels (HTTP 403 Forbidden).

---

## 5. Technical Boundaries & Performance Guarantees

1. **JavaScript Only:** 100% `.js` and `.jsx`.
2. **Real-time Latency:** Socket message dispatch must execute under 50ms.
3. **Database Guardrails:**
   - Conversation list queries clamped to 50 conversations.
   - Message list queries paginated (default 30 messages per page, sorted by `createdAt: -1` and inverted on UI).
4. **Data Isolation:** Every message retrieval, search, and socket emission strictly verifies that `req.user.userId` is present in `conversation.participants`.

---

## 6. Sign-off & Verification Criteria

- [ ] All 7 BUILD-GUIDE rows (24.1 – 24.7) mapped to testable user stories.
- [ ] Given-When-Then specifications defined for all 4 standard roles.
- [ ] Real-time Socket.IO and Mongoose text indexing verified via Context7 documentation.
- [ ] Ready for architectural plan generation (`/speckit-plan`).

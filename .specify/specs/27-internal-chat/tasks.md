# Task Breakdown: Module M24 — Internal Chat

**Module ID:** `M24`  
**Module Name:** `Internal Chat`  
**Phase:** `Phase 4: Engagement & Polish`  
**Source Documents:**
- `docs/BUILD-GUIDE.md`: Section 29 (Rows 24.1 – 24.7)
- `docs/FRD.md`: Section M24 & Section 11 (Permission Matrix)
- `.specify/specs/27-internal-chat/spec.md`
- `.specify/specs/27-internal-chat/plan.md`

---

## Task Execution Order & Rules
1. **Vertical Slice Order:** For each BUILD-GUIDE row, complete Backend (model $\rightarrow$ validation $\rightarrow$ service $\rightarrow$ controller/routes) $\rightarrow$ Frontend (RTK Query hook $\rightarrow$ UI components $\rightarrow$ permission guards $\rightarrow$ route/sidebar) $\rightarrow$ Automated Tests before moving to the next row.
2. **Standard Library & Ponytail First:** Leverage native Node.js and browser APIs; zero unnecessary packages.
3. **P1 Rows First (24.1 – 24.5), followed by P2 Rows (24.6 – 24.7).**
4. **Final Cross-Role Verification:** End-to-end Playwright test across all 4 system roles (Super Admin, HR Manager, Department Manager, Employee).

---

## Vertical Slice Slices & Tasks

### [P1] Row 24.1: One-to-One Direct Messaging
- [x] **24.1-BE-1**: Define `backend/src/models/conversation.model.js` (participants, `directKey` unique sparse index, lastMessage) and `backend/src/models/message.model.js` (conversationId, senderId, content, attachments, readBy) with compound indexes.
- [x] **24.1-BE-2**: Register PBAC permissions (`chat.access`, `chat.create_group`, `chat.archive`) in `backend/src/shared/permissions.js` and role seed configurations.
- [x] **24.1-BE-3**: Implement `backend/src/modules/chat/chat.validation.js` with Zod schemas for direct conversation creation and message dispatch.
- [x] **24.1-BE-4**: Implement `backend/src/modules/chat/chat.service.js` with deterministic `directKey` deduplication, message persistence, and Socket.io room emission (`chat:message`).
- [x] **24.1-BE-5**: Implement `backend/src/modules/chat/chat.controller.js` and mount `backend/src/modules/chat/chat.routes.js` at `/api/v1/conversations` and `/api/v1/messages`.
- [x] **24.1-FE-1**: Create `frontend/src/features/chat/chatApi.js` with RTK Query endpoints (`getConversations`, `getMessages`, `createDirectConversation`, `sendMessage`).
- [x] **24.1-FE-2**: Implement `frontend/src/features/chat/hooks/useChatSocket.js` handling `chat:message` events and cache updates.
- [x] **24.1-FE-3**: Build UI components `ConversationList.jsx`, `ChatArea.jsx`, `MessageBubble.jsx`, `MessageInput.jsx`, and `NewChatModal.jsx`.
- [x] **24.1-FE-4**: Assemble `frontend/src/features/chat/pages/ChatPage.jsx`, mount `/chat` in `frontend/src/App.jsx`, and add navigation entry in `frontend/src/components/layout/Sidebar.jsx`.
- [x] **24.1-TEST**: Automated test in `backend/tests/m24.chat.test.js` verifying 1-to-1 conversation creation, directKey deduplication, message persistence, and live socket dispatch.

---

### [P1] Row 24.2: Custom Group Chat
- [x] **24.2-BE-1**: Add `createGroupConversation`, `addParticipant`, and `removeParticipant` methods to `chat.service.js` with group admin PBAC validation.
- [x] **24.2-BE-2**: Add Zod validation schemas for group creation and participant modification in `chat.validation.js`.
- [x] **24.2-BE-3**: Implement controller endpoints and routes for `POST /api/v1/conversations` (group) and `PATCH /api/v1/conversations/:id/participants`.
- [x] **24.2-FE-1**: Build `NewGroupModal.jsx` allowing users to name a group and select multiple coworkers.
- [x] **24.2-FE-2**: Build `GroupInfoDrawer.jsx` displaying group participants, admin badge, and add/remove member controls.
- [x] **24.2-TEST**: Test group creation, multi-member room messaging, and participant management.

---

### [P1] Row 24.3: Automated Department Channels
- [x] **24.3-BE-1**: Implement `syncDepartmentChannels` in `chat.service.js` to automatically instantiate department channels and sync employee memberships.
- [x] **24.3-BE-2**: Add `GET /api/v1/conversations/departments/sync` endpoint for on-demand department channel self-healing.
- [x] **24.3-FE-1**: Enhance `ConversationList.jsx` with an organized "Department Channels" section.
- [x] **24.3-TEST**: Test department channel auto-creation and membership validation.

---

### [P1] Row 24.4: Rich File & Media Sharing
- [x] **24.4-BE-1**: Implement `POST /api/v1/chat/upload` or integrate existing file upload service with strict MIME type and 10MB size limits.
- [x] **24.4-BE-2**: Support `attachments: [{ url, fileType, fileName, fileSize }]` in `message.model.js` and `sendMessage` service.
- [x] **24.4-FE-1**: Add attachment button and upload status indicator in `MessageInput.jsx`.
- [x] **24.4-FE-2**: Render image preview cards and document download widgets in `MessageBubble.jsx`.
- [x] **24.4-TEST**: Test file upload endpoint, insecure URI rejection, and attachment message persistence.

---

### [P1] Row 24.5: Online Presence & Read Receipts
- [x] **24.5-BE-1**: Track active socket connections in `socket.service.js` and broadcast `chat:presence` upon connect/disconnect.
- [x] **24.5-BE-2**: Implement `PATCH /api/v1/conversations/:id/read` endpoint and socket handler emitting `chat:read` to the conversation room.
- [x] **24.5-FE-1**: Wire live green dot online indicator in `ConversationList.jsx` and `ChatArea.jsx` header.
- [x] **24.5-FE-2**: Render single tick (sent) vs double blue ticks (read) in `MessageBubble.jsx`.
- [x] **24.5-TEST**: Test online presence broadcasting and read receipt updates.

---

### [P2] Row 24.6: Full-Text Message Search
- [x] **24.6-BE-1**: Implement `GET /api/v1/messages/search?q=` with safe regex escaping and strict filtering to conversations where caller is a participant.
- [x] **24.6-BE-2**: Add search query validation schema in `chat.validation.js`.
- [x] **24.6-FE-1**: Add search bar to `ConversationList.jsx` with debounced search query and search results drawer/view.
- [x] **24.6-FE-2**: Highlight matching text snippets and provide click-to-jump action into the conversation history.
- [x] **24.6-TEST**: Test message search functionality and cross-conversation isolation.

---

### [P2] Row 24.7: Channel Archival & Admin Moderation
- [x] **24.7-BE-1**: Implement `PATCH /api/v1/conversations/:id/archive` endpoint restricted to Super Admin (`chat.archive`).
- [x] **24.7-BE-2**: Guard `sendMessage` service to reject any message sent to an archived conversation with `HTTP 403 Forbidden`.
- [x] **24.7-FE-1**: Add "Archive Channel" option in `GroupInfoDrawer.jsx` (visible exclusively to Super Admin).
- [x] **24.7-FE-2**: Render read-only notification banner in `ChatArea.jsx` and disable `MessageInput.jsx` when viewing an archived channel.
- [x] **24.7-TEST**: Test channel archival by Super Admin, 403 rejection on subsequent messages, and 403 block for non-admin users.

---

### Final Cross-Role End-to-End Verification
- [x] **24.E2E**: Module M24 end-to-end Playwright test across all 4 system roles (Super Admin, HR Manager, Department Manager, Employee) verifying direct chat, group chat, department channels, file sharing, presence, search, and archival.

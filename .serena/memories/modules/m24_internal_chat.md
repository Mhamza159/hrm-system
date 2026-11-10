# Module M24: Internal Chat (BUILD-GUIDE Section 29)

## Overview
Module M24 delivers real-time corporate communication across 1:1 direct conversations, custom group chats, and auto-synchronized department channels with attachment sharing, online presence indicators, and message search.

## Models
- `Conversation` (`backend/src/models/conversation.model.js`):
  - `type`: `'direct' | 'group' | 'department'`
  - `directKey`: Deterministic deduplication key `[minId, maxId].join('_')` indexed with `{ unique: true, partialFilterExpression: { directKey: { $type: 'string' } } }`
  - `participants`: `[ObjectId -> User]`
  - `admin`: `ObjectId -> User` (group owner)
  - `departmentId`: `ObjectId -> Department` (auto-channel)
  - `isArchived`: Boolean moderation flag (read-only mode)
- `Message` (`backend/src/models/message.model.js`):
  - `conversationId`: `ObjectId -> Conversation`
  - `senderId`: `ObjectId -> User`
  - `content`: Text content
  - `attachments`: Array of `{ url, fileType, fileName, fileSize }` (strictly HTTPS URLs, 10MB limit)
  - `readBy`: Array of `{ userId, readAt }`
  - `messageType`: `'text' | 'file' | 'image' | 'system'`

## Permissions
Registered in `backend/src/shared/permissions.js` and seeded across roles:
- `chat.access`: Super Admin, HR Manager, Department Manager, Employee
- `chat.create_group`: Super Admin, HR Manager, Department Manager
- `chat.archive`: Super Admin only

## APIs
- `GET /api/v1/conversations`: List caller conversations with unread counts
- `POST /api/v1/conversations`: Initiate direct chat or create group
- `GET /api/v1/conversations/:id`: Retrieve single conversation details
- `PATCH /api/v1/conversations/:id/participants`: Add/remove group members
- `PATCH /api/v1/conversations/:id/archive`: Super Admin locks conversation
- `GET /api/v1/conversations/:id/messages`: Paginated message stream
- `POST /api/v1/conversations/:id/messages`: Dispatch new message
- `PATCH /api/v1/conversations/:id/read`: Mark messages as read
- `GET /api/v1/conversations/sync-department`: Self-heal department channel membership
- `GET /api/v1/messages/search?q=`: Scoped keyword search across caller's conversations
- `POST /api/v1/chat/upload`: Multer memory-capped file attachment upload

## Real-Time Socket Architecture
- `socket.service.js`:
  - `chat:join`: Verified PBAC membership check before socket room admission
  - `chat:leave`: Leave conversation room
  - `chat:typing`: Typing debouncer restricted to admitted room members
  - `chat:message`: Broadcasts to active conversation room
  - `chat:read`: Broadcasts read receipt acknowledgment
  - `chat:presence`: Online/offline status broadcasting
  - `chat:conversation_archived` & `chat:member_updated`: Real-time state updates

## Verification
- All 7 rows in Section 29 verified and checked `☑` in `docs/BUILD-GUIDE.md`.
- Automated test coverage: 27/27 vitest tests passing (`m24.chat.test.js` + `m24.security.test.js`).

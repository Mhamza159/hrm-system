# Phase 17: Internal Chat Module – Context & Execution Guardrails

## 1. Intent & Scope
The objective of Phase 17 is to perform a comprehensive audit and visual modernization of the **Internal Chat Module** (Module M24). The entire chat workspace—including direct chats, group channels, department rooms, message bubbles, file vaulting, and participant drawers—will be elevated to the Forest & Emerald Enterprise design standard while preserving the real-time Socket.IO and RTK Query architecture.

---

## 2. Scope Boundaries & Anti-Goals
- **DO NOT** rewrite or replace the existing Socket.IO backend service (`socket.service.js`). The socket service is already robust, JWT-authenticated, and supports presence, typing, and room partitioning.
- **DO NOT** create speculative abstractions or add external UI component libraries. All components must use native React, Tailwind CSS, and Lucide icons.
- **DO NOT** remove or weaken conversation membership security checks. Socket room joining (`chat:join`) and message dispatch must strictly verify participant membership.
- **DO NOT** introduce `prop-types` imports anywhere in the codebase.

---

## 3. Key Design & UX Invariants
1. **Forest & Emerald Enterprise Theme**:
   - Canvas: `#061A14` / `#0A110D`
   - Panels / Surfaces: `#111D17`
   - Borders: `#1A3125` (hover `#2D4A3A`)
   - Accent: `#00C471`
   - Sender Bubbles: Emerald `#00C471` with crisp white text
   - Recipient Bubbles: Dark surface `#111D17` with `#1A3125` border
2. **Presence & Real-Time Telemetry**:
   - Online users display an active green `#00C471` indicator with subtle animation.
   - Live typing indicators ("Sarah is typing...") display smoothly above the message input bar.
   - Read receipts display double checkmarks (`CheckCheck`) when read by recipient.
3. **Responsive Mobile Ergonomics**:
   - Desktop: Full split view with persistent conversation sidebar and active message feed.
   - Mobile (< 768px): Seamless view switcher—when a conversation is selected, the message feed fills the screen with a clean "Back to Conversations" button.

---

## 4. Work Breakdown & Plan Mapping
- **Plan 17-01**: Chat Interface Layout, Split View & Conversation List Sidebar (`ChatPage.jsx`, `ConversationList.jsx`).
- **Plan 17-02**: Active Chat Feed, Header & Message Bubbles Stream (`ChatArea.jsx`, `MessageBubble.jsx`).
- **Plan 17-03**: Message Composer, Attachment Vaulting & Real-Time Socket Telemetry (`MessageInput.jsx`, `useChatSocket.js`).
- **Plan 17-04**: Direct/Group Chat Modals, Channel Management Drawer & Verification Gate (`NewChatModal.jsx`, `NewGroupModal.jsx`, `GroupInfoDrawer.jsx`, Oxlint & Vite build).

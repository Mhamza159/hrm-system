# HRM System — Technology Stack

Strict Policy: Plain JavaScript only (ES modules). Do not use or introduce TypeScript.

### Backend Stack
- **Runtime & Framework:** Node.js (current LTS) + Express.js
- **Database & ODM:** MongoDB + Mongoose (models, schemas, validations, population, soft-delete via isDeleted)
- **Validation:** Zod (shared schemas for body, query, and params validation)
- **Authentication:** JWT (short-lived 15m access token + 7-day refresh token stored in httpOnly secure cookie) + bcrypt (password hashing)
- **Authorization / RBAC:** CASL (`@casl/ability`) with dynamic rule compilation from DB and scoping (own, team, department, all)
- **Background Jobs & Scheduling:** Redis + BullMQ (workers for payroll generation, bulk emails, notifications) + node-cron (scheduled midnight jobs)
- **Real-Time Communication:** Socket.io (internal notifications, attendance triggers, chat)
- **File Uploads & Storage:** Multer + Cloudinary (private storage for documents, photos, resumes)
- **Reporting & Generation:** PDFKit / jsPDF (salary slips, letters), ExcelJS (bank transfer sheets, attendance reports)
- **Logging & Security:** Pino structured logger, Helmet, CORS (locked to CLIENT_URL), express-rate-limit, express-mongo-sanitize, cookie-parser
- **Testing & Tooling:** Vitest, Supertest, Nodemon, ESLint, Prettier, Husky

### Frontend Stack
- **Build Tool & Framework:** React (latest stable) + Vite
- **Routing:** React Router (v6/v7) with protected routes and permission guards
- **State Management:** Redux Toolkit + RTK Query (centralized caching, automated cache invalidation, re-fetching)
- **Forms & Client Validation:** react-hook-form + Zod resolver
- **Styling & UI Kit:** Tailwind CSS + shadcn/ui (JavaScript variant)
- **Data Tables & Visuals:** `@tanstack/react-table`, Recharts (analytics dashboards), sonner (toast notifications), Lucide React (icons)
- **Permission UI:** `@casl/react` (`Can` component to show/hide actions based on user ability)
- **Specialized Integrations:** `@vladmandic/face-api` (client-side face descriptors), `html5-qrcode` & `qrcode.react`, Leaflet / `react-leaflet` (geo-fencing)

Refer to `mem:architecture` and `mem:sources_of_truth`.

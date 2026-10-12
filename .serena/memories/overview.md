# HRM System — Project Overview

- **Project Name:** HRM System (Human Resource Management System)
- **Client Profile:** Single software house based in Pakistan (covering developers, QA, designers, sales, management, and admin staff).
- **Deployment Architecture:** Single company, single database (strictly NOT multi-tenant SaaS).
- **Language / File Extensions:** Strictly plain JavaScript (`.js` and `.jsx`). Strictly **NO TypeScript** (`.ts` / `.tsx`).
- **Core Technology Stack:**
  - Backend: Node.js LTS + Express.js, MongoDB + Mongoose, Zod validation, CASL (`@casl/ability`) RBAC & scoping, JWT + refresh token cookie, bcrypt, Socket.io, BullMQ + Redis, node-cron.
  - Frontend: React + Vite, Redux Toolkit + RTK Query, Tailwind CSS + shadcn/ui (JavaScript), react-hook-form + Zod, @tanstack/react-table, Recharts, @casl/react (`Can` component).
- **Core User Roles:**
  1. `Super Admin` (System settings, policies, final approvals, audit logs, role management)
  2. `HR Manager` (Full HR lifecycle, employee management, attendance, leaves, payroll)
  3. `Department Manager` (Team supervision, leave/expense approvals, project tracking)
  4. `Employee` (Self-service, attendance check-in/out, leave applications, payslips, profile)
  5. *Custom Roles* (Created and managed dynamically via Module M26)
- **Sources of Truth:**
  - `docs/FRD.md` — Functional Requirements Document (26 modules, permissions, role matrix)
  - `docs/TECH-SPEC.md` — Technical Specification (stack, layers, schemas, endpoints, security)
  - `docs/BUILD-GUIDE.md` — Vertical Slice Build Guide (Step-by-step checklist)
  - `docs/MODULES.md` — Modular Architecture & Code organization

Refer to `mem:modules_list`, `mem:build_order`, `mem:architecture`, and `mem:tech_stack`.

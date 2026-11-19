# Module M0 / X1 / Phase 31: Audit Log Module Overhaul & Architecture

## Overview
Phase 31 transformed the Audit Log module into an enterprise-grade forensic monitoring and statutory compliance system. It features an immutable schema, deep sanitization, real-time database-driven analytics, streaming CSV exports, statutory 365-day retention enforcement, and an enterprise multi-view explorer (Table, Timeline, User Activity).

## Data Model (`AuditLog`)
- `actorId`: ObjectId (ref User)
- `actorEmail`: String
- `actorRole`: String
- `action`: String (standardized action key)
- `module`: String (functional module)
- `status`: Enum `['SUCCESS', 'FAILURE']` (indexed)
- `severity`: Enum `['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']` (indexed)
- `category`: Enum `['AUTHENTICATION', 'DATA_CHANGE', 'SECURITY', 'ADMINISTRATIVE', 'SYSTEM']` (indexed)
- `description`: String (concise human-readable activity synopsis)
- `targetId`: ObjectId
- `targetModel`: String
- `ipAddress`: String
- `userAgent`: String
- `device`: Subdocument `{ browser, os, deviceType }`
- `isArchived`: Boolean (default: false, indexed)
- `archivedAt`: Date (default: null)
- `details`: Mixed `{ before, after, ...meta }` (sensitive credentials redacted with `[REDACTED]`)
- `createdAt`: Date (immutable, `updatedAt: false`)

## Endpoints
- `GET /api/v1/audit-logs`: Paginated exploration with multi-criteria filters (`module`, `action`, `status`, `severity`, `category`, `actorRole`, `dateRange`, `search`)
- `GET /api/v1/audit-logs/:id`: Single record forensic inspection with full before/after diff
- `GET /api/v1/audit-logs/stats`: Real-time dashboard KPI metrics (total, today, week, month, success/fail, security, admin, active actors)
- `GET /api/v1/audit-logs/analytics`: Activity velocity timeline (hourly/daily), module distribution, top actions, security trends
- `GET /api/v1/audit-logs/export`: Streaming compliance CSV export (safety cap 10,000 rows, records `AUDIT_LOGS_EXPORTED` event)
- `GET /api/v1/audit-logs/retention`: Statutory 365-day compliance summary (active vs archived counts)
- `POST /api/v1/audit-logs/archive`: Soft-archival trigger for records older than X days (hard delete forbidden)

## Security & RBAC/PBAC
- Required permissions: `audit.view`, `audit.analytics`, `audit.export`
- Zero UI Leakage: Non-admin users without audit permissions cannot see navigation pills or access endpoints (HTTP 403).
- Immutability Invariant: `PUT`, `PATCH`, and `DELETE` on `/api/v1/audit-logs/:id` return HTTP 404/405.

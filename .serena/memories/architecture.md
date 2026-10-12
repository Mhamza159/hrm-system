# HRM System — Architectural Standards & Vertical Slice Pattern

### 1. Monorepo Organization
- `backend/`: Node.js Express server, modular controllers/services/routes, Mongoose models, BullMQ jobs, socket handlers.
- `frontend/`: React + Vite SPA/PWA, RTK Query API slices, feature pages/components, shadcn UI primitives.
- `shared/`: Shared Zod validation schemas, constants, permission catalogues, enums.

### 2. Backend Request-Response Pipeline
Every request must travel through a uniform middleware pipeline:
```
Request -> Helmet / CORS / RateLimit / MongoSanitize -> authenticate (JWT) -> validate (Zod) -> checkPermission (CASL) -> controller -> service -> model -> Database
```
- **Controller Rule:** Controllers ONLY parse request parameters/body, call services, and return responses. Controllers NEVER make direct database queries.
- **Service Rule:** Business logic, transactional mutations, database queries, and audit logs reside in services.
- **Scope Rule:** Services filter queries based on role scope (`own`, `team`, `department`, `all`).
- **Standard API Envelope:**
  ```json
  {
    "success": true,
    "data": { ... },
    "message": "Human-readable message",
    "meta": { "page": 1, "limit": 10, "total": 42 }
  }
  ```
- **Error Handling:** Standardized `ApiError` class caught by global `errorHandler` middleware.

### 3. Vertical Slice Rule (One Feature at a Time)
From `docs/BUILD-GUIDE.md`:
- Do not build all backend APIs first and all frontend pages later.
- Build vertically: Model -> Validation -> Service -> Controller/Route -> API verification -> RTK Query Hook -> UI Page/Component -> CASL Permissions -> Route/Sidebar Integration -> End-to-end verification.

### 4. Audit & Observability
- Every mutation (create, edit, delete, status transition) writes an immutable record to `auditLogs` collection with `userId`, `action`, `entity`, `entityId`, `before`, `after`, and client IP.

Refer to `mem:tech_stack`, `mem:sources_of_truth`, and `mem:phases_and_modules`.

# Graph Report - HRM  (2026-10-16)

## Corpus Check
- 281 files · ~384,004 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 10 file(s) not represented in the graph (top: (none) 7, .css 2, .toml 1)

## Summary
- 1765 nodes · 3704 edges · 122 communities (104 shown, 18 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 158 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7136447f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- 4. Core HR Modules
- HRM System — Full-Stack Build Guide (Backend + Frontend Saath Saath)
- HRM System — Functional Requirements Document
- Tasks: [FEATURE NAME]
- speckit-analyze/SKILL.md
- HRM System — Technical Specification & Project Flow
- Execution Steps
- common.ps1
- Feature Specification: [FEATURE NAME]
- speckit-plan/SKILL.md
- speckit-specify/SKILL.md
- speckit-tasks/SKILL.md
- Idea Assessment Pipeline Extension
- Core Principles
- Core Principles
- Intake an Idea
- Assess Bug
- Bug Triage Workflow Extension
- app.js
- Intake an Idea
- Assess Bug
- Implementation Plan: [FEATURE]
- Research an Idea
- Fix Bug
- Test Bug Fix
- speckit-checklist/SKILL.md
- HRM System — Complete Modules List (26 Modules)
- Decide: Go, Clarify, or Kill
- Define the Problem
- Shape a Concept
- speckit-clarify/SKILL.md
- speckit-implement/SKILL.md
- HRM System — Build Order & Execution Roadmap
- Research an Idea
- Fix Bug
- Test Bug Fix
- speckit-constitution/SKILL.md
- HRM System — Architectural Standards & Vertical Slice Pattern
- HRM System — 5-Phase Master Execution Plan
- Decide: Go, Clarify, or Kill
- Define the Problem
- Shape a Concept
- create-new-feature.ps1
- speckit-taskstoissues/SKILL.md
- [CHECKLIST TYPE] Checklist: [FEATURE NAME]
- HRM System — Technology Stack
- App
- pakistan_compliance.md
- sources_of_truth.md
- checkPermission
- App.jsx
- sonner
- react
- SettingsPage.jsx
- Communities (54 total, 9 thin omitted)
- department.service.js
- frontend/package.json
- 3. Detailed User Stories & Acceptance Criteria
- 2. User Scenarios & Acceptance Criteria (17 User Stories)
- 3. User Scenarios & Acceptance Criteria (11 User Stories)
- role.service.js
- employee.service.js
- 3. Prioritized User Stories & Acceptance Criteria
- setting.validation.js
- ApiError
- setting.controller.js
- employee.controller.js
- apiResponse
- Phase 1: Core Master & Personal Records (Priority P1)
- department.routes.js
- dependencies
- Phase 1: Core Authentication & Session Foundation (Priority P1)
- 3. Prioritized User Stories & Acceptance Criteria
- delegation.service.js
- HRM System — Current State & Progress Tracker
- employee.routes.js
- RoleFormPage.jsx
- Technical Architecture & Implementation Plan: Module M26 — Roles & Permissions (RBAC & CASL)
- Phase 1: Core Company Settings & Statutory Foundation (Priority P1)
- Architectural Plan: Module M3 — Employee Management
- Technical Architecture & Implementation Plan: Module M4 — Departments, Designations, Shifts & Org Chart
- checkPermission.js
- auth.routes.js
- Graph Report - HRM  (2026-10-09)
- 2. Functional Requirements by Group
- user.routes.js
- role.controller.js
- HRM System — Design System Specification (DESIGN.md)
- Official UI Reference Specification — HRM System
- baseQueryWithReauth
- Architecture Implementation Plan: M1 Authentication & Access Control
- HRM System — 5-Phase Master Implementation Roadmap
- role.routes.js
- setting.routes.js
- emailService
- Module M26: Roles & Permissions (RBAC & CASL) Architecture
- Module M2: Company Settings Architecture
- Feature Specification: M1 Authentication & Access Control
- scripts
- .oxlintrc.json
- Module M1: Authentication & Access Control Architecture
- delegation.controller.js
- HRM System — Project Context & Invariants
- Module M3 — Employee Management Architecture & Implementation Summary
- Phase 1: Core HR & Payroll — Execution Status & Roadmap Tracking
- 3. MongoDB Schema & Index Verification (via `mongodb` MCP)
- 6. Implementation Checklist & Verification Gates
- scopeFilter.js
- React + Vite
- client_parameters.md
- {
  useLoginMutation,
  useRefreshTokenMutation,
  useLogoutMutation,
  useGetMeQuery,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useChangePasswordMutation,
  useUpdateUserStatusMutation,
  useGetUsersQuery,
  useVerifyOtpMutation,
  useEnable2faMutation,
  useVerifyEnable2faMutation,
  useDisable2faMutation,
  useGetLoginHistoryQuery,
  useAdminResetPasswordMutation
}
- {
  useGetDepartmentsQuery,
  useGetDepartmentByIdQuery,
  useGetHeadCandidatesQuery,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
  useAssignDepartmentHeadMutation,
  useDeleteDepartmentMutation,
  useGetDesignationsQuery,
  useGetDesignationByIdQuery,
  useCreateDesignationMutation,
  useUpdateDesignationMutation,
  useDeleteDesignationMutation,
  useGetShiftsQuery,
  useGetShiftByIdQuery,
  useCreateShiftMutation,
  useUpdateShiftMutation,
  useDeleteShiftMutation,
  useGetOrgChartQuery,
  useGetMyTeamQuery
}
- {
  useGetEmployeesQuery,
  useGetEmployeeByIdQuery,
  useGetMyProfileQuery,
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
  useUpdateEmployeeStatusMutation,
  useDeleteEmployeeMutation,
  useUploadDocumentMutation,
  useDeleteDocumentMutation,
  useImportEmployeesMutation,
  useUpdateSkillsMutation,
  useRecordJobHistoryMutation,
  useGetJobHistoryQuery,
  useGetSalaryHistoryQuery,
  useSubmitChangeRequestMutation,
  useGetChangeRequestsQuery,
  useDecideChangeRequestMutation
}
- {
  useGetPermissionsQuery,
  useGetRolesQuery,
  useGetRoleByIdQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
  useCloneRoleMutation,
  useAssignUserRolesMutation,
  useGetDelegationsQuery,
  useCreateDelegationMutation,
  useCancelDelegationMutation,
  useGetEffectivePermissionsQuery
}
- {
  useGetSettingsQuery,
  useGetSettingByKeyQuery,
  useUpdateSettingMutation,
  useUploadLogoMutation,
  useGetBackupStatusQuery,
  useTriggerBackupMutation,
  useGetPublicPoliciesQuery
}

## God Nodes (most connected - your core abstractions)
1. `ApiError` - 78 edges
2. `apiResponse` - 66 edges
3. `react` - 65 edges
4. `mongoose` - 59 edges
5. `lucide-react` - 56 edges
6. `User` - 50 edges
7. `env` - 49 edges
8. `Communities (54 total, 9 thin omitted)` - 46 edges
9. `vitest` - 42 edges
10. `PageHeader()` - 39 edges

## Surprising Connections (you probably didn't know these)
- `5. Architectural Decisions & Fixes` --references--> `executeBackup()`  [INFERRED]
  .serena/memories/architecture/m2-company-settings.md → backend/src/jobs/backup.job.js
- `Slice 2.10: Automated Database Backup Job & Manual Trigger (BUILD-GUIDE ID 2.10)` --references--> `executeBackup()`  [INFERRED]
  .specify/specs/04-company-settings/tasks.md → backend/src/jobs/backup.job.js
- `10. Step-by-Step Development Plan` --references--> `checkPermission()`  [INFERRED]
  docs/TECH-SPEC.md → backend/src/middlewares/checkPermission.js
- `4. Functional Requirements Checklist` --references--> `checkPermission()`  [INFERRED]
  .specify/specs/03-roles-permissions/spec.md → backend/src/middlewares/checkPermission.js
- `Slice 26.3: CASL checkPermission Middleware (BUILD-GUIDE ID 26.3)` --references--> `checkPermission()`  [INFERRED]
  .specify/specs/03-roles-permissions/tasks.md → backend/src/middlewares/checkPermission.js

## Import Cycles
- None detected.

## Communities (122 total, 18 thin omitted)

### Community 0 - "4. Core HR Modules"
Cohesion: 0.05
Nodes (36): 1. Ye Document Kaise Parhein, 2. Modules Banane ki Tarteeb, 3. M0 — Project Foundation (Common Setup), 4. Core HR Modules, 5. Payroll & Finance Modules, 6. Smart Attendance Modules, 7. AI Modules, 8. Employee Experience Modules (+28 more)

### Community 1 - "HRM System — Full-Stack Build Guide (Backend + Frontend Saath Saath)"
Cohesion: 0.06
Nodes (32): 10. M5 — Attendance & Shifts, 11. M6 — Leave & Holidays, 12. M9 — Payroll (Pakistan Compliance Samait), 13. M7 — Dashboard & Reports, 14. X1 — Security, Audit & Quality (Phase 1 ka aakhri check), 15. M10 — Loans & Advances, 16. M11 — Expense Claims, 17. M14 — GPS / Geo-fencing (+24 more)

### Community 2 - "HRM System — Functional Requirements Document"
Cohesion: 0.05
Nodes (40): 10. Pakistan Compliance & Localization, 11. Role-wise Permission Matrix, 12. Non-functional Requirements, 13. Development Roadmap, 1. Introduction, 2. Technology Stack, 3. User Roles, 4. Module Overview (+32 more)

### Community 3 - "Tasks: [FEATURE NAME]"
Cohesion: 0.07
Nodes (26): Dependencies & Execution Order, Format: `[ID] [P?] [Story] Description`, Implementation for User Story 1, Implementation for User Story 2, Implementation for User Story 3, Implementation Strategy, Incremental Delivery, MVP First (User Story 1 Only) (+18 more)

### Community 4 - "speckit-analyze/SKILL.md"
Cohesion: 0.08
Nodes (25): 1. Initialize Analysis Context, 2. Load Artifacts (Progressive Disclosure), 3. Build Semantic Models, 4. Detection Passes (Token-Efficient Analysis), 5. Severity Assignment, 6. Produce Compact Analysis Report, 7. Provide Next Actions, 8. Offer Remediation (+17 more)

### Community 5 - "HRM System — Technical Specification & Project Flow"
Cohesion: 0.12
Nodes (16): 10. Step-by-Step Development Plan, 11. Git Workflow, Testing & Coding Standards, 12. Deployment & DevOps, 1. Full MERN Tech Stack, 2. System Architecture, 3. Folder Structure, 4. Database Design (MongoDB), 5. API Design (+8 more)

### Community 6 - "Execution Steps"
Cohesion: 0.12
Nodes (15): 1. Initialize Convergence Context, 2. Load Artifacts (Progressive Disclosure), 3. Build the Intent Inventory, 4. Assess the Codebase and Classify Findings, 5. Assign Severity, 6. Present the In-Session Findings Summary, 7. Append Convergence Tasks (or report converged), 8. Provide Next Actions (Handoff) (+7 more)

### Community 7 - "common.ps1"
Cohesion: 0.23
Nodes (13): Find-SpecifyRoot(), Format-SpecKitCommand(), Get-CurrentBranch(), Get-FeaturePathsEnv(), Get-InvokeSeparator(), Get-NormalizedPriority(), Get-Python3Command(), Get-RepoRoot() (+5 more)

### Community 8 - "Feature Specification: [FEATURE NAME]"
Cohesion: 0.15
Nodes (12): Assumptions, Edge Cases, Feature Specification: [FEATURE NAME], Functional Requirements, Key Entities *(include if feature involves data)*, Measurable Outcomes, Requirements *(mandatory)*, Success Criteria *(mandatory)* (+4 more)

### Community 9 - "speckit-plan/SKILL.md"
Cohesion: 0.18
Nodes (10): Completion Report, Done When, Key rules, Mandatory Post-Execution Hooks, Outline, Phase 0: Outline & Research, Phase 1: Design & Contracts, Phases (+2 more)

### Community 10 - "speckit-specify/SKILL.md"
Cohesion: 0.18
Nodes (10): Completion Report, Done When, For AI Generation, Mandatory Post-Execution Hooks, Outline, Pre-Execution Checks, Quick Guidelines, Section Requirements (+2 more)

### Community 11 - "speckit-tasks/SKILL.md"
Cohesion: 0.18
Nodes (10): Checklist Format (REQUIRED), Completion Report, Done When, Mandatory Post-Execution Hooks, Outline, Phase Structure, Pre-Execution Checks, Task Generation Rules (+2 more)

### Community 12 - "Idea Assessment Pipeline Extension"
Cohesion: 0.18
Nodes (10): Commands, Disabling, Guardrails, Handoff, Idea Assessment Pipeline Extension, Installation, Overview, Relationship to Other Extensions (+2 more)

### Community 13 - "Core Principles"
Cohesion: 0.18
Nodes (10): Core Principles, Governance, [PRINCIPLE_1_NAME], [PRINCIPLE_2_NAME], [PRINCIPLE_3_NAME], [PRINCIPLE_4_NAME], [PRINCIPLE_5_NAME], [PROJECT_NAME] Constitution (+2 more)

### Community 14 - "Core Principles"
Cohesion: 0.18
Nodes (10): Core Principles, Governance, [PRINCIPLE_1_NAME], [PRINCIPLE_2_NAME], [PRINCIPLE_3_NAME], [PRINCIPLE_4_NAME], [PRINCIPLE_5_NAME], [PROJECT_NAME] Constitution (+2 more)

### Community 15 - "Intake an Idea"
Cohesion: 0.20
Nodes (9): Assess Intake Skill, Execution, Guardrails, Intake an Idea, Prerequisites, Safety When Fetching URLs, Slug Resolution, URL Trust Policy (+1 more)

### Community 16 - "Assess Bug"
Cohesion: 0.20
Nodes (9): Assess Bug, Bug Assess Skill, Execution, Guardrails, Prerequisites, Safety When Fetching URLs, Slug Resolution, URL Trust Policy (+1 more)

### Community 17 - "Bug Triage Workflow Extension"
Cohesion: 0.20
Nodes (9): Bug Triage Workflow Extension, Commands, Disabling, Guardrails, Hooks, Installation, Overview, Slug Conventions (+1 more)

### Community 18 - "app.js"
Cohesion: 0.10
Nodes (54): description, @casl/ability, zod, main, name, type, version, app (+46 more)

### Community 19 - "Intake an Idea"
Cohesion: 0.22
Nodes (8): Execution, Guardrails, Intake an Idea, Prerequisites, Safety When Fetching URLs, Slug Resolution, URL Trust Policy, User Input

### Community 20 - "Assess Bug"
Cohesion: 0.22
Nodes (8): Assess Bug, Execution, Guardrails, Prerequisites, Safety When Fetching URLs, Slug Resolution, URL Trust Policy, User Input

### Community 21 - "Implementation Plan: [FEATURE]"
Cohesion: 0.22
Nodes (8): Complexity Tracking, Constitution Check, Documentation (this feature), Implementation Plan: [FEATURE], Project Structure, Source Code (repository root), Summary, Technical Context

### Community 22 - "Research an Idea"
Cohesion: 0.25
Nodes (7): Assess Research Skill, Execution, Guardrails, Prerequisites, Research an Idea, Safety When Fetching URLs, User Input

### Community 23 - "Fix Bug"
Cohesion: 0.25
Nodes (7): Bug Fix Skill, Execution, Fix Bug, Guardrails, Prerequisites, Slug Resolution, User Input

### Community 24 - "Test Bug Fix"
Cohesion: 0.25
Nodes (7): Bug Test Skill, Execution, Guardrails, Prerequisites, Slug Resolution, Test Bug Fix, User Input

### Community 25 - "speckit-checklist/SKILL.md"
Cohesion: 0.25
Nodes (7): Anti-Examples: What NOT To Do, Checklist Purpose: "Unit Tests for English", Example Checklist Types & Sample Items, Execution Steps, Post-Execution Checks, Pre-Execution Checks, User Input

### Community 26 - "HRM System — Complete Modules List (26 Modules)"
Cohesion: 0.25
Nodes (7): Group 1: Core HR (Launch Priority P1), Group 2: Payroll & Finance, Group 3: Smart Attendance, Group 4: AI & Machine Learning, Group 5: Employee Experience, Group 6: Office Management, HRM System — Complete Modules List (26 Modules)

### Community 27 - "Decide: Go, Clarify, or Kill"
Cohesion: 0.29
Nodes (6): Assess Decide Skill, Decide: Go, Clarify, or Kill, Execution, Guardrails, Prerequisites, User Input

### Community 28 - "Define the Problem"
Cohesion: 0.29
Nodes (6): Assess Define Skill, Define the Problem, Execution, Guardrails, Prerequisites, User Input

### Community 29 - "Shape a Concept"
Cohesion: 0.29
Nodes (6): Assess Shape Skill, Execution, Guardrails, Prerequisites, Shape a Concept, User Input

### Community 30 - "speckit-clarify/SKILL.md"
Cohesion: 0.29
Nodes (6): Completion Report, Done When, Mandatory Post-Execution Hooks, Outline, Pre-Execution Checks, User Input

### Community 31 - "speckit-implement/SKILL.md"
Cohesion: 0.29
Nodes (6): Completion Report, Done When, Mandatory Post-Execution Hooks, Outline, Pre-Execution Checks, User Input

### Community 32 - "HRM System — Build Order & Execution Roadmap"
Cohesion: 0.33
Nodes (5): HRM System — Build Order & Execution Roadmap, Phase 1: Core Foundation & MVP Launch Scope (P1), Phase 2: Finance, Smart Attendance & Office Operations (P2), Phase 3: AI Intelligence, Phase 4: Engagement & Platform Polish

### Community 33 - "Research an Idea"
Cohesion: 0.29
Nodes (6): Execution, Guardrails, Prerequisites, Research an Idea, Safety When Fetching URLs, User Input

### Community 34 - "Fix Bug"
Cohesion: 0.29
Nodes (6): Execution, Fix Bug, Guardrails, Prerequisites, Slug Resolution, User Input

### Community 35 - "Test Bug Fix"
Cohesion: 0.29
Nodes (6): Execution, Guardrails, Prerequisites, Slug Resolution, Test Bug Fix, User Input

### Community 36 - "speckit-constitution/SKILL.md"
Cohesion: 0.33
Nodes (5): Outline, Post-Execution Checks, Pre-Execution Checks, Scope Guard, User Input

### Community 37 - "HRM System — Architectural Standards & Vertical Slice Pattern"
Cohesion: 0.40
Nodes (4): 1. Monorepo Organization, 3. Vertical Slice Rule (One Feature at a Time), 4. Audit & Observability, HRM System — Architectural Standards & Vertical Slice Pattern

### Community 38 - "HRM System — 5-Phase Master Execution Plan"
Cohesion: 0.29
Nodes (6): HRM System — 5-Phase Master Execution Plan, Phase 1: Core HR & Payroll (12 modules · 148 features), Phase 2: Smart Operations (9 modules · 67 features), Phase 3: AI Features (3 modules · 27 features), Phase 4: Engagement & Polish (5 modules · 31 features), Phase 5: Release, Deployment & Handover (TECH-SPEC Section 12)

### Community 39 - "Decide: Go, Clarify, or Kill"
Cohesion: 0.33
Nodes (5): Decide: Go, Clarify, or Kill, Execution, Guardrails, Prerequisites, User Input

### Community 40 - "Define the Problem"
Cohesion: 0.33
Nodes (5): Define the Problem, Execution, Guardrails, Prerequisites, User Input

### Community 41 - "Shape a Concept"
Cohesion: 0.33
Nodes (5): Execution, Guardrails, Prerequisites, Shape a Concept, User Input

### Community 43 - "speckit-taskstoissues/SKILL.md"
Cohesion: 0.40
Nodes (4): Outline, Post-Execution Checks, Pre-Execution Checks, User Input

### Community 44 - "[CHECKLIST TYPE] Checklist: [FEATURE NAME]"
Cohesion: 0.40
Nodes (4): [Category 1], [Category 2], [CHECKLIST TYPE] Checklist: [FEATURE NAME], Notes

### Community 45 - "HRM System — Technology Stack"
Cohesion: 0.50
Nodes (3): Backend Stack, Frontend Stack, HRM System — Technology Stack

### Community 46 - "App"
Cohesion: 0.10
Nodes (20): App(), Can(), ConfirmDialog(), DataTable(), LoginHistoryPage(), DepartmentModal(), DepartmentsPage(), EmployeeListPage() (+12 more)

### Community 49 - "checkPermission"
Cohesion: 0.27
Nodes (12): checkPermission(), validate(), 1. Kaam Karne ka Usool (Vertical Slice), 10. Har Module ke Liye Kaam ki Checklist, 2. Core Architectural & Code Invariants (Non-Negotiable), 3. Non-Functional & Security Requirements, Architecture & System Invariants (Strictly Enforced), The 10-Step Vertical Slice Law (per feature) (+4 more)

### Community 54 - "App.jsx"
Cohesion: 0.08
Nodes (29): AppLayout(), Sidebar(), Topbar(), ProtectedRoute(), authApi, authSlice, initialState, selectCurrentToken() (+21 more)

### Community 55 - "sonner"
Cohesion: 0.09
Nodes (22): Card(), FileUpload(), ChangeRequestModal(), DocumentUploadModal(), ProfileDocumentsTab(), ProfileHistoryTab(), ProfileOverviewTab(), ProfileSalaryTab() (+14 more)

### Community 56 - "react"
Cohesion: 0.11
Nodes (20): PageHeader(), StatCard(), STATUS_STYLES, StatusBadge(), DashboardPage(), DesignationModal(), GRADE_TIERS, OrgChartNode() (+12 more)

### Community 57 - "SettingsPage.jsx"
Cohesion: 0.08
Nodes (29): AttendanceRulesForm(), BackupTab(), CompanyForm(), GeoFenceMapEditor(), LeavePolicyForm(), PayrollSettingsForm(), TaxSlabsForm(), AVAILABLE_PLACEHOLDERS (+21 more)

### Community 58 - "Communities (54 total, 9 thin omitted)"
Cohesion: 0.04
Nodes (46): Communities (54 total, 9 thin omitted), Community 0 - "4. Core HR Modules", Community 10 - "speckit-specify/SKILL.md", Community 11 - "speckit-tasks/SKILL.md", Community 12 - "Idea Assessment Pipeline Extension", Community 13 - "Core Principles", Community 14 - "Core Principles", Community 15 - "Intake an Idea" (+38 more)

### Community 59 - "department.service.js"
Cohesion: 0.08
Nodes (41): assignDepartmentHead(), calculateShiftTiming(), createDepartment(), createDesignation(), createShift(), deleteDepartment(), deleteDesignation(), deleteShift() (+33 more)

### Community 60 - "frontend/package.json"
Cohesion: 0.05
Nodes (42): dependencies, @casl/ability, @casl/react, clsx, @hookform/resolvers, leaflet, lucide-react, react (+34 more)

### Community 61 - "3. Detailed User Stories & Acceptance Criteria"
Cohesion: 0.05
Nodes (42): 1. Executive Summary & Architecture Integration, 2.1 AES-256-GCM Field-Level Encryption (`node:crypto`), 2.2 ExcelJS Bulk Import & Export (`/exceljs/exceljs`), 2.3 Multer Memory Storage & File Filter (`/expressjs/multer`), 2. Context7 Verified Library Syntax Patterns, 3. Detailed User Stories & Acceptance Criteria, 4. BUILD-GUIDE ID Coverage Verification Table, Acceptance Criteria: (+34 more)

### Community 62 - "2. User Scenarios & Acceptance Criteria (17 User Stories)"
Cohesion: 0.07
Nodes (26): 1. Executive Summary & Architecture Integration, 2. User Scenarios & Acceptance Criteria (17 User Stories), 3. Edge Cases & Boundary Handling, 4. Functional Requirements Checklist, 5. Success Criteria & Verification Metrics, Backend Authorization (`@casl/ability` v6.7+), Context7 Verified Library Syntax Patterns, Feature Specification: Module M26 — Roles & Permissions (RBAC & CASL) (+18 more)

### Community 63 - "3. User Scenarios & Acceptance Criteria (11 User Stories)"
Cohesion: 0.07
Nodes (26): 1. Executive Summary & Architecture Integration, 2.1 Backend Form-Data & Logo Upload (`multer` v1.4+), 2.2 Geo-Fence Map Editor (`leaflet` v1.9+), 2. Context7 Verified Library Syntax Patterns, 3. User Scenarios & Acceptance Criteria (11 User Stories), 4. Edge Cases & Failure Modes, 5. Functional Requirements (FR) Traceability, 6. Key Data Entities & Schemas (+18 more)

### Community 64 - "role.service.js"
Cohesion: 0.10
Nodes (21): assignUserRoles(), createRole(), deleteRole(), getRoleById(), updateRole(), ALL_ACTION_IDS, PERMISSIONS_CATALOGUE, Slice 1.6: Current User Hydration & Protected Route Guarding (BUILD-GUIDE ID 1.6) (+13 more)

### Community 65 - "employee.service.js"
Cohesion: 0.15
Nodes (20): createEmployee(), decideChangeRequest(), decryptEmployeeFields(), deleteDocument(), deleteEmployee(), exportEmployeesToExcel(), getEmployeeById(), getEmployees() (+12 more)

### Community 66 - "3. Prioritized User Stories & Acceptance Criteria"
Cohesion: 0.08
Nodes (25): 1. Executive Summary & Architecture Integration, 2.1 Mongoose Self-Referencing Parent-Child Tree & Deletion Guard, 2.2 Zod Cross-Midnight Shift Time Validation with Custom Refinement, 2. Context7 Verified Library Syntax Patterns, 3. Prioritized User Stories & Acceptance Criteria, 4. Multi-Role Permission & Security Matrix, 5. BUILD-GUIDE Coverage Traceability Matrix, 6. Implementation Readiness & Recommendations (+17 more)

### Community 67 - "setting.validation.js"
Cohesion: 0.09
Nodes (21): Setting, settingSchema, DEFAULT_SETTINGS, settingsCache, companyProfileSchema, eobiSchema, geoFenceItemSchema, geoFencesSchema (+13 more)

### Community 68 - "ApiError"
Cohesion: 0.16
Nodes (9): errorHandler(), AuthService, inferDeviceType(), getSalaryHistory(), submitChangeRequest(), ApiError, checkApprovalLimit(), 2. Backend Request-Response Pipeline (+1 more)

### Community 69 - "setting.controller.js"
Cohesion: 0.15
Nodes (15): BACKUP_DIR, cleanOldBackups(), ensureBackupDir(), executeBackup(), getBackupStatus(), getAllSettings, getBackupStatus, getPublicPolicies (+7 more)

### Community 70 - "employee.controller.js"
Cohesion: 0.10
Nodes (21): checkProbationExpiry(), initProbationJob(), createEmployee, decideChangeRequest, deleteDocument, deleteEmployee, exportEmployees, getChangeRequests (+13 more)

### Community 71 - "apiResponse"
Cohesion: 0.17
Nodes (20): assignDepartmentHead, createDepartment, createDesignation, createShift, deleteDepartment, deleteDesignation, deleteShift, getDepartmentById (+12 more)

### Community 72 - "Phase 1: Core Master & Personal Records (Priority P1)"
Cohesion: 0.09
Nodes (21): Phase 1: Core Master & Personal Records (Priority P1), Phase 2: Career History & Advanced Workflows (Priority P2), Phase 3: Multi-Role End-to-End Verification (`E2E-M3`), Slice 3.11: Salary Revision History (Permission Guarded) (BUILD-GUIDE ID 3.11), Slice 3.12: Skills Taxonomy & Tech Stack Tagging (BUILD-GUIDE ID 3.12), Slice 3.13: Excel Bulk Employee Ingestion with Row-Level Error Reports (BUILD-GUIDE ID 3.13), Slice 3.14: Employee Directory Excel Export (BUILD-GUIDE ID 3.14), Slice 3.15: Self-Service "My Profile" Portal (BUILD-GUIDE ID 3.15) (+13 more)

### Community 73 - "department.routes.js"
Cohesion: 0.15
Nodes (14): authenticate, router, assignHeadSchema, createDepartmentSchema, createDesignationSchema, createShiftSchema, objectIdSchema, updateDepartmentSchema (+6 more)

### Community 74 - "dependencies"
Cohesion: 0.09
Nodes (20): dependencies, bcrypt, @casl/ability, cookie-parser, cors, dotenv, exceljs, express (+12 more)

### Community 75 - "Phase 1: Core Authentication & Session Foundation (Priority P1)"
Cohesion: 0.11
Nodes (16): Module M1 Multi-Role End-to-End Verification, Phase 1: Core Authentication & Session Foundation (Priority P1), Phase 2: Enhanced Security, Auditing & Administration (Priority P2), Phase 3: Module M1 Verification & End-to-End Testing, Slice 1.10: Two-Factor Authentication (2FA OTP) (BUILD-GUIDE ID 1.10), Slice 1.11: Client-Side Inactivity Auto-Logout (BUILD-GUIDE ID 1.11), Slice 1.12: Login History Tracking & Audit Records (BUILD-GUIDE ID 1.12), Slice 1.13: User Account Activation / Deactivation (BUILD-GUIDE ID 1.13) (+8 more)

### Community 76 - "3. Prioritized User Stories & Acceptance Criteria"
Cohesion: 0.13
Nodes (16): 5. Complete API Route Contract, Permissions & Scopes, 3. Prioritized User Stories & Acceptance Criteria, User Story 10 — Two-Factor Authentication (2FA) via OTP (Priority: P2), User Story 11 — Client-Side Inactivity Auto-Logout (Priority: P2), User Story 12 — Login Audit History Tracking (Priority: P2), User Story 13 — User Account Activation & Deactivation (Priority: P1), User Story 14 — HR-Initiated Emergency Password Reset (Priority: P2), User Story 1 — User Model & Credential Security Foundation (Priority: P1) (+8 more)

### Community 77 - "delegation.service.js"
Cohesion: 0.13
Nodes (14): cancelDelegation(), createDelegation(), getDelegations(), cloneRole(), AuditService, Phase 2: Advanced Governance, Delegation & Transparency (Priority P2), Phase 3: Multi-Role End-to-End Verification (`E2E-M26`), Slice 26.10: Role Cloning Engine (BUILD-GUIDE ID 26.10) (+6 more)

### Community 78 - "HRM System — Current State & Progress Tracker"
Cohesion: 0.12
Nodes (16): HRM System — Current State & Progress Tracker, Module M1 Progress Summary (14 / 14 Slices Implemented & Passing), Module M26 Progress Summary (17 / 17 Slices Implemented & Passing), Module M2 Progress Summary (11 / 11 Slices Implemented & Passing), Phase 1: Core Authentication & Session Foundation (Priority P1) — 100% Complete, Phase 1: Core Company Settings & Statutory Foundation (Priority P1) — 100% Complete, Phase 1: Core RBAC & CASL Infrastructure (Priority P1) — 100% Complete, Phase 2: Advanced Governance, Delegation & Transparency (Priority P2) — 100% Complete (+8 more)

### Community 79 - "employee.routes.js"
Cohesion: 0.18
Nodes (14): docStorage, documentsDir, router, uploadDoc, uploadMemory, changeRequestSchema, CNIC_REGEX, createEmployeeSchema (+6 more)

### Community 80 - "RoleFormPage.jsx"
Cohesion: 0.17
Nodes (5): store, PermissionMatrix(), rolesApi, baseApi, @reduxjs/toolkit

### Community 81 - "Technical Architecture & Implementation Plan: Module M26 — Roles & Permissions (RBAC & CASL)"
Cohesion: 0.13
Nodes (14): 1. Architecture Summary, 2. Technical Context & Database Verification, 3. Visual System Architecture & Data Flow (Archify Mermaid Engine), 4. Exact File Blueprint & Deliverables, 5. Endpoints, Permissions & Scope Contract, 6. Shared Permission Catalogue Injection (`shared/permissions.js`), 7. Next Steps & Task Breakdown, Backend Architecture (`backend/src/`) (+6 more)

### Community 82 - "Phase 1: Core Company Settings & Statutory Foundation (Priority P1)"
Cohesion: 0.13
Nodes (14): Phase 1: Core Company Settings & Statutory Foundation (Priority P1), Phase 2: Advanced Spatial, Templates & Disaster Recovery (Priority P2), Phase 3: Multi-Role End-to-End Verification (`E2E-M2`), Slice 2.10: Automated Database Backup Job & Manual Trigger (BUILD-GUIDE ID 2.10), Slice 2.2: Company Profile & Logo Asset Upload (BUILD-GUIDE ID 2.2), Slice 2.3: Working Days & Standard Office Hours (BUILD-GUIDE ID 2.3), Slice 2.4: Late Arrival Rules & Penalty Deductions (BUILD-GUIDE ID 2.4), Slice 2.5: Leave Policy Definitions (BUILD-GUIDE ID 2.5) (+6 more)

### Community 83 - "Architectural Plan: Module M3 — Employee Management"
Cohesion: 0.14
Nodes (13): 1.1 Invariants & Security Guardrails, 1. Architectural Blueprint & Request Flow, 2.1 Backend Files (`backend/src/`), 2.2 Frontend Files (`frontend/src/`), 2. Exact Files Manifest, 3.1 Diagram 1: System Component Flow (Client $\rightarrow$ Middleware $\rightarrow$ Service $\rightarrow$ Storage / Infra), 3.2 Diagram 2: Entity Relationship Diagram (ERD & Indexes), 3.3 Diagram 3: Main Sequence Diagram (Employee Onboarding & Account Provisioning Flow) (+5 more)

### Community 84 - "Technical Architecture & Implementation Plan: Module M4 — Departments, Designations, Shifts & Org Chart"
Cohesion: 0.15
Nodes (12): 1. Architecture Summary, 2. Technical Context & Database Verification, 3. Visual System Architecture & Data Flow (Archify Mermaid Engine), 5.1 Endpoint Authorization Matrix, 5.2 Permission Catalogue Registration Step, 5. API Contracts, Permissions & Scopes Specification, 6. Implementation Phasing Strategy, Diagram 1: Request & Architecture Flow Architecture (+4 more)

### Community 85 - "checkPermission.js"
Cohesion: 0.26
Nodes (6): buildAbilityForUser(), getEffectiveScopeForAction(), router, sanitizeFields(), SENSITIVE_FIELDS, express

### Community 86 - "auth.routes.js"
Cohesion: 0.27
Nodes (10): forgotPasswordLimiter, loginLimiter, router, changePasswordSchema, disable2faSchema, forgotPasswordSchema, loginSchema, resetPasswordSchema (+2 more)

### Community 87 - "Graph Report - HRM  (2026-10-09)"
Cohesion: 0.18
Nodes (10): Community Hubs (Navigation), Corpus Check, God Nodes (most connected - your core abstractions), Graph Freshness, Graph Report - HRM  (2026-10-09), Import Cycles, Knowledge Gaps, Suggested Questions (+2 more)

### Community 88 - "2. Functional Requirements by Group"
Cohesion: 0.20
Nodes (9): 1. Scope Baseline, 2. Functional Requirements by Group, Group 1: Core HR (Launch Priority P1), Group 2: Payroll & Finance (P1 & P2), Group 3: Smart Attendance (P2), Group 4: AI Modules (P2 & P3), Group 5: Employee Experience (P2 & P3), Group 6: Office Management (P2 & P3) (+1 more)

### Community 89 - "user.routes.js"
Cohesion: 0.39
Nodes (5): AuthController, updateUserStatusSchema, assignRolesSchema, router, asyncHandler()

### Community 90 - "role.controller.js"
Cohesion: 0.22
Nodes (8): assignUserRoles, cloneRole, createRole, deleteRole, getPermissions, getRoleById, getRoles, updateRole

### Community 91 - "HRM System — Design System Specification (DESIGN.md)"
Cohesion: 0.22
Nodes (8): 1. Design Vision & Guiding Principles, 2. Typography System, 3. Color Palettes & UI Reference Tokens (`docs/UI-REFERENCE.md`), Dark Canvas (Dark Mode Mode), Font Stacks, HRM System — Design System Specification (DESIGN.md), Light Canvas (Primary Application Mode), Type Scale & Hierarchy

### Community 92 - "Official UI Reference Specification — HRM System"
Cohesion: 0.22
Nodes (8): 1. Overall Architectural Layout, 2. Color Palette & Semantic Tokens, 3. Sidebar Specification (`docs/ui-reference.png`), 4. Topbar Specification (`docs/ui-reference.png`), 5. Page Header & Cards Specification, 6. Shared Component Guidelines, Official UI Reference Specification — HRM System, Semantic Tinted Status Pills

### Community 93 - "baseQueryWithReauth"
Cohesion: 0.33
Nodes (5): baseQuery, baseQueryWithReauth(), Mutex, 2. Technical Architecture & Library Invariants, Slice 1.4: Automatic Token Rotation & Transparent Session Refresh (BUILD-GUIDE ID 1.4)

### Community 94 - "Architecture Implementation Plan: M1 Authentication & Access Control"
Cohesion: 0.22
Nodes (8): 1. Architectural Summary & Scope, 2. Archify Visual Architecture & Technical Diagrams, 4. Exact File Inventory & Responsibilities, 7. Next Recommended Step, Architecture Implementation Plan: M1 Authentication & Access Control, Diagram 1: High-Level Authentication & Request Pipeline Architecture, Diagram 2: Entity Relationship Diagram (ERD), Diagram 3: Sequence Diagram — Complete Auth & Auto-Refresh Flow

### Community 95 - "HRM System — 5-Phase Master Implementation Roadmap"
Cohesion: 0.25
Nodes (7): HRM System — 5-Phase Master Implementation Roadmap, Phase 1: Core HR & Payroll (Launch Scope P1), Phase 2: Smart Operations (P2 Scope), Phase 3: AI Features (Intelligence Scope), Phase 4: Engagement & Polish (P3 Scope), Phase 5: Release, Deployment & Handover, Summary of Master Roadmap Metrics

### Community 96 - "role.routes.js"
Cohesion: 0.43
Nodes (5): router, cloneRoleSchema, createRoleSchema, permissionRuleSchema, updateRoleSchema

### Community 97 - "setting.routes.js"
Cohesion: 0.29
Nodes (5): LOGO_UPLOAD_DIR, logoUpload, router, storage, multer

### Community 99 - "Module M26: Roles & Permissions (RBAC & CASL) Architecture"
Cohesion: 0.29
Nodes (6): 1. Overview & Verification Status, 2. Data Models, 3. Seeded Core Roles, 4. Endpoints & API Surface, 5. Security & Architectural Invariants, Module M26: Roles & Permissions (RBAC & CASL) Architecture

### Community 100 - "Module M2: Company Settings Architecture"
Cohesion: 0.29
Nodes (6): 1. Overview & Verification Status, 2. Data Model, 3. Configuration Domains & Zod Schemas, 4. Endpoints & API Surface, 5. Architectural Decisions & Fixes, Module M2: Company Settings Architecture

### Community 101 - "Feature Specification: M1 Authentication & Access Control"
Cohesion: 0.29
Nodes (6): 1. Executive Summary & Sources of Truth, 4. Role-Wise Access Control Summary (M1 Matrix), 5. Non-Functional & Security Requirements, 6. Traceability Matrix & Coverage Table, 7. Next Recommended Step, Feature Specification: M1 Authentication & Access Control

### Community 102 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, dev, seed:roles, start, test, test:watch

### Community 103 - ".oxlintrc.json"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 104 - "Module M1: Authentication & Access Control Architecture"
Cohesion: 0.33
Nodes (5): 1. Overview & Verification Status, 2. Models, 3. Endpoints & Security Contracts, 4. Architectural Decisions & Fixes, Module M1: Authentication & Access Control Architecture

### Community 105 - "delegation.controller.js"
Cohesion: 0.40
Nodes (3): cancelDelegation, createDelegation, getDelegations

### Community 106 - "HRM System — Project Context & Invariants"
Cohesion: 0.40
Nodes (4): 1. Project Profile & Operational Scope, 3. User Roles Hierarchy, 4. Documentation Sources of Truth, HRM System — Project Context & Invariants

### Community 107 - "Module M3 — Employee Management Architecture & Implementation Summary"
Cohesion: 0.40
Nodes (4): Data Models, Module M3 — Employee Management Architecture & Implementation Summary, Security & Authorization Boundaries, Status

### Community 108 - "Phase 1: Core HR & Payroll — Execution Status & Roadmap Tracking"
Cohesion: 0.40
Nodes (4): Completed & Verified Modules (6 / 12), Phase 1: Core HR & Payroll — Execution Status & Roadmap Tracking, Remaining Modules in Phase 1 (6 / 12), Verification Baseline

### Community 109 - "3. MongoDB Schema & Index Verification (via `mongodb` MCP)"
Cohesion: 0.40
Nodes (5): 1. `models/user.model.js` Indexes, 2. `models/loginHistory.model.js` Indexes, 3. MongoDB Schema & Index Verification (via `mongodb` MCP), Investigation Findings, Required Database Schema & Index Specifications

### Community 110 - "6. Implementation Checklist & Verification Gates"
Cohesion: 0.40
Nodes (5): 6. Implementation Checklist & Verification Gates, Step 1: Backend Foundation & Persistence, Step 2: Backend Logic & Routing, Step 3: Frontend State & Integration, Step 4: Frontend UI Pages (Linear/Stripe Craft Aesthetics)

### Community 112 - "React + Vite"
Cohesion: 0.50
Nodes (3): Expanding the Oxlint configuration, React Compiler, React + Vite

## Knowledge Gaps
- **790 isolated node(s):** `name`, `version`, `type`, `description`, `main` (+785 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 927 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **18 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ApiError` connect `ApiError` to `role.service.js`, `employee.service.js`, `setting.routes.js`, `setting.validation.js`, `HRM System — Build Order & Execution Roadmap`, `setting.controller.js`, `employee.controller.js`, `department.routes.js`, `3. Prioritized User Stories & Acceptance Criteria`, `delegation.service.js`, `App`, `employee.routes.js`, `checkPermission`, `app.js`, `checkPermission.js`, `user.routes.js`, `department.service.js`, `HRM System — 5-Phase Master Implementation Roadmap`?**
  _High betweenness centrality (0.128) - this node is a cross-community bridge._
- **Why does `Architectural Invariants & Dependencies` connect `App` to `employee.service.js`, `ApiError`, `react`, `user.routes.js`, `3. Detailed User Stories & Acceptance Criteria`?**
  _High betweenness centrality (0.103) - this node is a cross-community bridge._
- **Why does `checkPermission()` connect `checkPermission` to `role.routes.js`, `setting.routes.js`, `role.service.js`, `ApiError`, `HRM System — Technical Specification & Project Flow`, `department.routes.js`, `HRM System — Current State & Progress Tracker`, `employee.routes.js`, `App`, `app.js`, `checkPermission.js`, `user.routes.js`, `2. User Scenarios & Acceptance Criteria (17 User Stories)`, `HRM System — 5-Phase Master Implementation Roadmap`?**
  _High betweenness centrality (0.087) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `ApiError` (e.g. with `Phase 1: Core HR & Payroll (Launch Scope P1)` and `2. Backend Request-Response Pipeline`) actually correct?**
  _`ApiError` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `version`, `type` to the rest of the system?**
  _790 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `4. Core HR Modules` be split into smaller, more focused modules?**
  _Cohesion score 0.05405405405405406 - nodes in this community are weakly interconnected._
- **Should `HRM System — Full-Stack Build Guide (Backend + Frontend Saath Saath)` be split into smaller, more focused modules?**
  _Cohesion score 0.06060606060606061 - nodes in this community are weakly interconnected._
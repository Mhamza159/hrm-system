# HRM System — Sources of Truth

All development, scoping, architectural, and business decisions are anchored in four primary documentation files located in `docs/`:

1. **`docs/FRD.md` (Functional Requirements Document):**
   - High-level project scope and client profile.
   - 4 user default roles (Super Admin, HR Manager, Department Manager, Employee) + custom roles via M26.
   - Comprehensive feature breakdown for all 26 modules across 7 functional groups.
   - Role permissions matrix detailing CRUD and execution capabilities.

2. **`docs/TECH-SPEC.md` (Technical Specification & Architecture):**
   - Package-level dependency specification for backend and frontend.
   - Monorepo folder organization (`backend/`, `frontend/`, `shared/`).
   - MongoDB database schema definitions, relations, indexing, and soft-delete conventions.
   - Unified API response format: `{ success, data, message, meta }`.
   - CASL permission evaluation flow and scope resolution (own, team, department, all).
   - Real-time Socket.io events and BullMQ worker pipeline.

3. **`docs/BUILD-GUIDE.md` (Full-Stack Vertical Slice Build Guide):**
   - Vertical slice rule: one feature = backend + frontend + verification test before moving to the next.
   - 10-step lifecycle per feature.
   - Phased execution map (Phase 1 launch: Steps 0 to 11).
   - Step 0 (M0 Foundation): 14 granular checklist items needed before building domain modules.

4. **`docs/MODULES.md` (Module-wise Implementation Guide):**
   - Modular isolation: `backend/src/modules/<module>/` and `frontend/src/features/<module>/`.
   - Standard file structure: `<module>.model.js`, `<module>.validation.js`, `<module>.service.js`, `<module>.controller.js`, `<module>.routes.js`.
   - Frontend structure: `<module>Api.js`, `pages/`, `components/`.
   - Step-by-step dependency graph showing the order of module implementation.

Refer to `mem:overview`, `mem:tech_stack`, and `mem:architecture`.

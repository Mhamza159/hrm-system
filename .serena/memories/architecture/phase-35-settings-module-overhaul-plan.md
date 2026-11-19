# Phase 35: Settings Module Complete Audit, Implementation, Integration & Full UI Overhaul (Planned)

## 1. Scope & Roadmap Status
- **Phase Number**: Phase 35
- **Module**: Module M2 Company Settings & System-Wide Governance (BUILD-GUIDE Section 6 · Rows 2.1 to 2.11)
- **Status**: Planned (Research Complete, 8 Execution Plans Registered in ROADMAP.md)

## 2. 10 Target Sections & Architecture Deliverables
1. **Company Profile**: Legal entity parameters, logo upload (Cloudinary/Local), new direct removal endpoint (`DELETE /company/logo`), live brand artifact preview (Payslips, Employee Badges, Email Header).
2. **Working Hours**: Active days selector (at least 1 required), standard shift timing with auto-calculated duration & net hours, canonical `Asia/Karachi` timezone, alignment with Module M4 Shifts.
3. **Attendance Rules**:
   - Punctuality grace minutes (0-60m), late threshold minutes, half-day late count, penalty per late in PKR/paisa.
   - Dynamic QR Kiosk Attendance: `qrAttendance` Zod schema, global toggle, rotating token interval (15s-60s), anti-replay cache alignment in `attendance.service.js`.
   - Facial Recognition Attendance: `faceAttendance` Zod schema, global toggle, Euclidean match threshold slider (0.30-0.70), anti-spoofing EAR liveness detection toggle, biometric privacy compliance disclosure.
4. **Leave Policy**: Fiscal cycle ('July' vs 'January'), carry-forward limit, encashment toggle, sandwich rule enforcement, and **Interactive Visual Approval Chains Builder** (multi-tier routing: Reporting Manager -> Dept Head -> HR -> Super Admin with day thresholds and absent manager delegation).
5. **Payroll Cycle & Statutory Tax**:
   - `payrollCycle` calculation helpers integrated with `payroll.service.js` for attendance cut-off lock dates and salary disbursement dates.
   - Pakistan FBR salaried progressive tax slabs with continuity validation and FBR 2024-25 / 2025-26 presets.
   - EOBI (5% employer, 1% employee, 37k min wage), PESSI (6%), Provident Fund (8.33%).
   - Interactive Live Tax & Net Pay Simulator in frontend.
6. **Geo-fencing Multi-Office Map**:
   - Multi-branch perimeter manager (Headquarters, Lahore Branch, Karachi Office, Client Sites) with Leaflet interactive map, draggable pin, circle radius resizing, reverse geocoding, and Haversine multi-fence validation.
7. **Templates & Notifications**:
   - Email/WhatsApp mustache template builder with placeholder token injector and real-time preview.
   - Omnichannel 11-module notification routing integration.
8. **Disaster Recovery & Database Backup**:
   - Automated midnight snapshot, manual trigger (`/backup-now`), archive listing endpoint (`GET /backups`), secure authenticated download endpoint (`GET /backups/:filename/download`), non-destructive integrity validator, restore safety guide.
9. **Master Settings Command Center**:
   - Overhaul `SettingsPage.jsx` into categorized navigation hub adhering strictly to Elvara Forest (`#061A14`) & Emerald (`#00C471`).
   - Unsaved changes dirty state detection, section completion badges, and strict RBAC protection.

# Statement of Intent: Punch Correction Review & Approval Flow

## 1. Outcome
Jab Manager, HR Manager ya Super Admin **Dashboard** ke *Action Items & Approvals Queue* widget me kisi pending punch correction par click kare, ya **Team Attendance** page se kisi correction request par click kare, to ek comprehensive **Punch Correction Review & Approval Modal / Drawer** open ho jisme faisla karne ke liye tamam zaroori audit data mojood ho.

## 2. Necessary Audit Information (Kya Cheezein Nazar Aayengi)
1. **Employee Profile**:
   - Avatar (with fallback initials)
   - Full Name
   - Department Name
   - Designation Title
   - System Role Badge (e.g. Admin if Super Admin)

2. **Shift Schedule vs. Requested Punch Comparison**:
   - **Assigned Shift**: Shift Name, Shift Window (e.g. 09:00 AM – 06:00 PM), Grace Period minutes.
   - **Original Punch**: Original Check-In & Check-Out (ya Missed Punch agar punch exist na karta ho).
   - **Requested Punch**: Employee ka requested Check-In aur Check-Out time, aur total calculated duty hours.
   - **Variance Status**: On-Time vs. Late Arrival indicator.

3. **Applicant Reason**:
   - Employee ki enter ki hui detailed justification (verbatim text).

4. **Attendance History Track Record Context**:
   - Current active month ka attendance summary:
     - Total Days Present
     - Late Arrivals count
     - Absents count
     - Leaves count
   - Recent attendance status trend taake approver ko andaza ho ke ye occasional missed punch hai ya habitual pattern.

5. **Direct Decision Controls**:
   - **Approve & Correct Button**:
     - Optional review notes field.
     - On approval: Attendance collection me record create/rectify hota hai, audit log push hota hai, metrics re-calculate hoti hein, aur queue se item remove hota hai.
   - **Reject Button**:
     - Mandatory rejection reason input field.
     - On rejection: Status rejected set hoti hai, reason save hoti hai, aur applicant ko notification chala jata hai.

## 3. Access Control & PBAC/RBAC
- **Super Admin & HR Manager**: Company-wide kisi bhi employee ki request review aur approve/reject kar sakte hein.
- **Department Manager**: Sirf apne assigned department ke members ki requests dekh aur approve kar sakte hein.
- **Regular Employee**: Sirf apni requests dekh sakte hein (no approval permission).

## 4. Technical Scope
- **Backend**:
  - `backend/src/modules/dashboard/dashboard.service.js`: `pendingCorrections` query me shift info, department, designation, aur attendance summary fields populate / include karna.
  - Endpoint `/attendance/corrections/:id/audit-context`: Requested correction ke employee ka shift schedule, original punch, aur monthly attendance stats fetch karne ke liye helper/API.
- **Frontend**:
  - `frontend/src/features/dashboard/components/widgets/PendingList.jsx`: Correction item ko clickable banana taake click karne par review modal open ho sake.
  - Reusable component `PunchCorrectionReviewModal.jsx` jo Dashboard aur `TeamAttendancePage.jsx` dono jagah render ho sake.
  - Optimistic / RTK Query invalidation taake approve/reject hote hi Dashboard aur Team Attendance live update ho jayein.

## 5. Out of Scope
- Biometric hardware machine device drivers ya raw biometric logs re-syncing.

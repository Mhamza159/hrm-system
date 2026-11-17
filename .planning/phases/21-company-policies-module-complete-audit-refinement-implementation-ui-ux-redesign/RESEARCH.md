# Phase 21 Research: Company Policies Architecture & Implementation Standards

## 1. Domain Overview & Current System Analysis
- **Current State:**
  - Slice 2.11 (`PoliciesPage.jsx`) only displays system settings in a read-only fashion (office hours, company profile, late penalty, leave policy).
  - Slice 16.1 (`policyDoc.model.js` & `PolicyDocsPage.jsx`) provides basic file upload strictly to extract raw text for the AI chatbot's RAG grounding.
  - **Gap:** No formal corporate policy lifecycle exists: no draft proposals, no department scoping, no approval workflows, no semantic versioning, no employee acknowledgement/sign-off mechanism, and no compliance tracking.
- **Goal:**
  - Establish a comprehensive, unified **Company Policies Module** that integrates both structured policy content (rich text/markdown/PDF) and regulatory compliance (mandatory employee sign-offs, version binding, and audit rosters).
  - Automatically feed published policies to the AI Chatbot RAG vector/text index so the chatbot's answers are always 100% grounded in current, active corporate policy.

---

## 2. Data Model Design

### A. Policy (`policy.model.js`)
```javascript
{
  title: String (required, indexed),
  policyCode: String (required, unique, uppercase slug e.g. POL-IT-001),
  categoryId: ObjectId ref 'PolicyCategory' (required, indexed),
  description: String (concise summary),
  content: String (structured policy text / markdown),
  fileUrl: String (optional document attachment),
  fileType: String ('pdf' | 'docx' | 'doc' | 'txt'),
  fileSize: Number,
  version: String (default '1.0'),
  status: String enum ['Draft', 'Pending Approval', 'Approved', 'Published', 'Rejected', 'Archived', 'Expired'],
  effectiveDate: Date,
  reviewDate: Date,
  expiryDate: Date,
  ownerDepartmentId: ObjectId ref 'Department',
  ownerId: ObjectId ref 'User',
  scope: String enum ['All Employees', 'Department Specific', 'Role Specific', 'Management Only'],
  applicableDepartmentIds: [ObjectId ref 'Department'],
  applicableRoleNames: [String],
  requiresAcknowledgement: Boolean (default false),
  acknowledgementGracePeriodDays: Number (default 7),
  approvedBy: ObjectId ref 'User',
  approvedAt: Date,
  publishedAt: Date,
  rejectionReason: String,
  isDeleted: Boolean (default false, indexed)
}
```

### B. PolicyCategory (`policyCategory.model.js`)
```javascript
{
  name: String (required, unique, trimmed),
  code: String (required, unique, uppercase slug),
  description: String,
  icon: String (Lucide icon key e.g. 'Shield', 'FileText', 'Briefcase', 'HeartHandshake'),
  color: String (Hex / Tailwind color),
  displayOrder: Number (default 0),
  isActive: Boolean (default true),
  isDeleted: Boolean (default false)
}
```

### C. PolicyVersion (`policyVersion.model.js`)
```javascript
{
  policyId: ObjectId ref 'Policy' (required, indexed),
  version: String (required),
  title: String (required),
  content: String (required),
  fileUrl: String,
  fileType: String,
  fileSize: Number,
  changeSummary: String (required, explanation of amendments),
  effectiveDate: Date,
  publishedAt: Date,
  createdBy: ObjectId ref 'User',
  approvedBy: ObjectId ref 'User'
}
```

### D. PolicyAcknowledgement (`policyAcknowledgement.model.js`)
```javascript
{
  policyId: ObjectId ref 'Policy' (required, indexed),
  policyVersion: String (required, indexed),
  employeeId: ObjectId ref 'Employee' (required, indexed),
  userId: ObjectId ref 'User' (required),
  signatureText: String (full legal name confirmation),
  acknowledgedAt: Date (default Date.now),
  ipAddress: String,
  userAgent: String,
  isLatestVersion: Boolean (default true)
}
```
*Index*: Compound unique index `{ policyId: 1, policyVersion: 1, employeeId: 1 }` prevents double-signing.

---

## 3. RBAC & PBAC Permission Mapping

| Action | Subject | Description | Default Roles |
| :--- | :--- | :--- | :--- |
| `policy.view` | Policy | Read published policies applicable to the user's role/department | All (Super Admin, HR Manager, Dept Manager, Employee) |
| `policy.create` | Policy | Author new policy drafts and propose revisions | Super Admin, HR Manager |
| `policy.edit` | Policy | Modify existing draft policies | Super Admin, HR Manager |
| `policy.delete` | Policy | Soft-delete draft or archive outdated policies | Super Admin, HR Manager |
| `policy.manage` | Policy | Manage policy categories, global settings & review cycles | Super Admin, HR Manager |
| `policy.approve`| Policy | Review, approve, or reject policies submitted for approval | Super Admin, HR Manager |
| `policy.publish`| Policy | Publish approved policies and trigger workforce notifications | Super Admin, HR Manager |
| `policy.acknowledge` | Policy | Legally sign and submit acknowledgement receipts | All Employees |
| `policy.track` | Policy | View compliance completion rates, employee rosters, and export reports | Super Admin, HR Manager, Dept Manager (scoped) |

---

## 4. UI/UX & Design System Constraints
- **Colors:** Forest & Emerald Enterprise theme:
  - Canvas: `#061A14` (dark) / `#F8FAFC` (light)
  - Card Surfaces: `#111D17` (dark) / `#FFFFFF` (light)
  - Borders: `#1A3125` (dark) / `#E2E8F0` (light)
  - Accents: `#00C471` (Emerald), `#10B981`, `#059669`
  - Warning/Pending: `#F59E0B` (Amber)
  - Critical/Rejection: `#EF4444` (Rose)
  - Information/Review: `#3B82F6` (Blue)
- **Component Heights & Controls:**
  - Standard `h-9` inputs, select dropdowns, and button controls.
  - Data tables with explicit minimum width constraints (`min-w-[1150px]`) and `whitespace-nowrap` on all headers.
  - Zero heavy third-party chart dependencies: native SVG visual gauges and progress bars only.
  - Zero `prop-types` imports, 0 Oxlint warnings.

/**
 * @file permissions.js
 * @description Master System Permission Catalogue for HRM RBAC & CASL Authorization.
 * 
 * SPECIFICATION & SECURITY:
 * - Module: M26 Roles & Permissions (BUILD-GUIDE Section 5 · Row 26.1)
 * - Layer: Shared Constants / Authorization Domain Taxonomy
 * - Architecture: Every system operation maps to an action-subject tuple with allowed data scopes.
 * 
 * SCOPE HIERARCHY:
 * - 'own'        : Actor's own records only (e.g. self-service attendance, leave requests).
 * - 'team'       : Direct subordinates reporting to actor (department manager / team lead).
 * - 'department' : All employees belonging to actor's department.
 * - 'all'        : Company-wide access across all departments and staff members.
 */

export const PERMISSIONS_CATALOGUE = [
  {
    module: 'auth',
    label: 'Authentication & Account Management',
    subject: 'User',
    description: 'System login, credential management, security audits, and user activation.',
    actions: [
      {
        action: 'login.history',
        label: 'View Login History',
        description: 'Inspect device, IP, and timestamp logs for sessions.',
        allowedScopes: ['own', 'all'],
        defaultScope: 'own'
      },
      {
        action: 'user.manage',
        label: 'Manage User Status & Credentials',
        description: 'Activate, deactivate accounts and trigger emergency password resets.',
        allowedScopes: ['all'],
        defaultScope: 'all'
      }
    ]
  },
  {
    module: 'roles',
    label: 'Roles & Permissions (RBAC)',
    subject: 'Role',
    description: 'Custom role authoring, permission matrix assignments, and delegation.',
    actions: [
      {
        action: 'role.view',
        label: 'View Roles & Matrix',
        description: 'View custom/system roles and effective permissions catalogue.',
        allowedScopes: ['all'],
        defaultScope: 'all'
      },
      {
        action: 'role.manage',
        label: 'Create, Edit & Delete Roles',
        description: 'Author custom roles, modify matrix rules, and clone role templates.',
        allowedScopes: ['all'],
        defaultScope: 'all'
      },
      {
        action: 'role.assign',
        label: 'Assign Roles to Users',
        description: 'Assign one or more roles to employee accounts with escalation protection.',
        allowedScopes: ['all'],
        defaultScope: 'all'
      },
      {
        action: 'delegation.create',
        label: 'Create Approval Delegation',
        description: 'Delegate managerial approvals to peer for scheduled date ranges.',
        allowedScopes: ['own', 'all'],
        defaultScope: 'own'
      },
      {
        action: 'delegation.view',
        label: 'View Delegations',
        description: 'Inspect active and historical approval delegation records.',
        allowedScopes: ['own', 'all'],
        defaultScope: 'own'
      },
      {
        action: 'delegation.cancel',
        label: 'Cancel Delegation',
        description: 'Revoke active approval delegations prior to expiry.',
        allowedScopes: ['own', 'all'],
        defaultScope: 'own'
      }
    ]
  },
  {
    module: 'employees',
    label: 'Employee Management',
    subject: 'Employee',
    description: 'Workforce lifecycle, employee profiles, job history, and document vault.',
    actions: [
      {
        action: 'employee.view',
        label: 'View Employee Profiles',
        description: 'Access employee directory, contact details, and reporting lines.',
        allowedScopes: ['own', 'team', 'department', 'all'],
        defaultScope: 'own'
      },
      {
        action: 'employee.create',
        label: 'Onboard New Employee',
        description: 'Register new employee profiles, accounts, and initial employment contracts.',
        allowedScopes: ['all'],
        defaultScope: 'all'
      },
      {
        action: 'employee.edit',
        label: 'Edit Employee Details',
        description: 'Update profile information, designations, shifts, and manager assignments.',
        allowedScopes: ['own', 'team', 'all'],
        defaultScope: 'own'
      },
      {
        action: 'employee.delete',
        label: 'Archive / Deactivate Employee',
        description: 'Soft-delete employee records and trigger offboarding clearance.',
        allowedScopes: ['all'],
        defaultScope: 'all'
      },
      {
        action: 'employee.salary.view',
        label: 'View Sensitive Financials (Salary/Bank/CNIC)',
        description: 'Unmask basic salary, bank accounts, and complete CNIC identification.',
        allowedScopes: ['own', 'all'],
        defaultScope: 'own',
        sensitive: true
      }
    ]
  },
  {
    module: 'attendance',
    label: 'Attendance & Shifts',
    subject: 'Attendance',
    description: 'Daily clock-in/out, shift templates, late penalties, and missed-punch corrections.',
    actions: [
      {
        action: 'attendance.mark',
        label: 'Clock In / Clock Out',
        description: 'Punch daily attendance via web, GPS, QR, or biometric methods.',
        allowedScopes: ['own'],
        defaultScope: 'own'
      },
      {
        action: 'attendance.view',
        label: 'View Attendance Records',
        description: 'Inspect daily check-ins, monthly calendars, and tardiness summaries.',
        allowedScopes: ['own', 'team', 'department', 'all'],
        defaultScope: 'own'
      },
      {
        action: 'attendance.edit',
        label: 'Manual Attendance Override',
        description: 'Edit punch times and daily status with mandatory audit reason.',
        allowedScopes: ['all'],
        defaultScope: 'all'
      },
      {
        action: 'attendance.approve',
        label: 'Approve Punch Corrections & WFH',
        description: 'Review and decide missed-punch correction requests and remote work requests.',
        allowedScopes: ['team', 'department', 'all'],
        defaultScope: 'team'
      },
      {
        action: 'attendance.lock',
        label: 'Lock Monthly Attendance',
        description: 'Lock monthly attendance records prior to payroll generation.',
        allowedScopes: ['all'],
        defaultScope: 'all'
      },
      {
        action: 'attendance.wfh',
        label: 'Apply for Work From Home',
        description: 'Submit remote work requests for scheduled dates.',
        allowedScopes: ['own'],
        defaultScope: 'own'
      },
      {
        action: 'attendance.correction',
        label: 'Request Missed Punch Correction',
        description: 'Submit correction requests for forgotten clock-in/out.',
        allowedScopes: ['own'],
        defaultScope: 'own'
      },
      {
        action: 'attendance.export',
        label: 'Export Attendance Reports',
        description: 'Download attendance spreadsheets and monthly timesheets.',
        allowedScopes: ['team', 'department', 'all'],
        defaultScope: 'team'
      }
    ]
  },
  {
    module: 'leaves',
    label: 'Leave & Holidays',
    subject: 'Leave',
    description: 'Leave quota allocation, time-off requests, balances, and public holidays.',
    actions: [
      {
        action: 'leave.apply',
        label: 'Apply for Leave',
        description: 'Submit time-off requests against annual, casual, or medical quotas.',
        allowedScopes: ['own'],
        defaultScope: 'own'
      },
      {
        action: 'leave.view',
        label: 'View Leave Balances & History',
        description: 'Inspect leave balance summaries, upcoming leaves, and conflict calendar.',
        allowedScopes: ['own', 'team', 'department', 'all'],
        defaultScope: 'own'
      },
      {
        action: 'leave.approve',
        label: 'Approve Leave Applications',
        description: 'Approve or reject employee leave applications within approval limits.',
        allowedScopes: ['team', 'department', 'all'],
        defaultScope: 'team',
        hasLimit: true
      },
      {
        action: 'leave.settings',
        label: 'Manage Leave Types & Policies',
        description: 'Configure yearly quotas, carry-forward rules, and gazetted holiday calendars.',
        allowedScopes: ['all'],
        defaultScope: 'all'
      },
      {
        action: 'leave.encash',
        label: 'Encash Unutilized Leaves',
        description: 'Submit and approve encashment requests for unutilized annual leave quotas.',
        allowedScopes: ['own', 'all'],
        defaultScope: 'own'
      }
    ]
  },
  {
    module: 'payroll',
    label: 'Payroll & Statutory Compliance',
    subject: 'Payroll',
    description: 'Monthly payroll run, Pakistan FBR tax slabs, EOBI, and bank advice sheets.',
    actions: [
      {
        action: 'payroll.view',
        label: 'View Payslips',
        description: 'View and download branded monthly PDF salary slips and tax certificates.',
        allowedScopes: ['own', 'all'],
        defaultScope: 'own'
      },
      {
        action: 'payroll.manage',
        label: 'Configure Salary Structures',
        description: 'Maintain basic pay, allowances, deductions, and statutory tax parameters.',
        allowedScopes: ['all'],
        defaultScope: 'all'
      },
      {
        action: 'payroll.run',
        label: 'Generate Monthly Payroll Runs',
        description: 'Trigger asynchronous BullMQ payroll engine with live progress tracking.',
        allowedScopes: ['all'],
        defaultScope: 'all'
      },
      {
        action: 'payroll.approve',
        label: 'Approve & Release Payroll',
        description: 'Transition payroll runs from Review to Approved and Paid status.',
        allowedScopes: ['all'],
        defaultScope: 'all'
      },
      {
        action: 'payroll.export',
        label: 'Export Bank Transfer Sheet',
        description: 'Download standard Pakistani corporate bank transfer advice in Excel format.',
        allowedScopes: ['all'],
        defaultScope: 'all'
      }
    ]
  },
  {
    module: 'settings',
    label: 'Company Settings',
    subject: 'Setting',
    description: 'Company profile, working hours, late rules, geo-fences, and notification templates.',
    actions: [
      {
        action: 'settings.view',
        label: 'View Company Policies',
        description: 'Read public company policies, working days, and office schedules.',
        allowedScopes: ['all'],
        defaultScope: 'all'
      },
      {
        action: 'settings.manage',
        label: 'Modify Global Settings',
        description: 'Update company address, NTN, geo-fences, late penalty rules, and backups.',
        allowedScopes: ['all'],
        defaultScope: 'all'
      }
    ]
  },
  {
    module: 'organization',
    label: 'Department, Designation & Org Chart',
    subject: 'Organization',
    description: 'Organizational hierarchy, departments, job titles, shift rosters, and reporting lines.',
    actions: [
      {
        action: 'org.view',
        label: 'View Organization & Team Structure',
        description: 'Access company departments, designations, shifts, org chart, and team views.',
        allowedScopes: ['own', 'team', 'department', 'all'],
        defaultScope: 'all'
      },
      {
        action: 'org.manage',
        label: 'Manage Organization Structures',
        description: 'Create, modify, and delete departments, designations, shifts, and assign heads.',
        allowedScopes: ['all'],
        defaultScope: 'all'
      }
    ]
  },
  {
    module: 'reports',
    label: 'Executive Reports & Analytics',
    subject: 'Report',
    description: 'Headcount metrics, turnover analytics, payroll cost summaries, and audits.',
    actions: [
      {
        action: 'report.view',
        label: 'View Dashboard Analytics',
        description: 'Inspect executive widgets, KPI cards, and departmental charts.',
        allowedScopes: ['own', 'team', 'department', 'all'],
        defaultScope: 'own'
      },
      {
        action: 'report.export',
        label: 'Export Reports (Excel / PDF)',
        description: 'Export attendance, payroll, and workforce reports to spreadsheets or PDFs.',
        allowedScopes: ['team', 'department', 'all'],
        defaultScope: 'team'
      }
    ]
  },
  {
    module: 'notifications',
    label: 'Notifications & Announcements',
    subject: 'Notification',
    description: 'Real-time alert delivery, user channel preferences, and company/department announcements.',
    actions: [
      {
        action: 'notification.view',
        label: 'View Notifications & Preferences',
        description: 'View in-app notification alerts and update channel preferences.',
        allowedScopes: ['own'],
        defaultScope: 'own'
      },
      {
        action: 'notification.manage',
        label: 'Manage Notification Broadcasts',
        description: 'Dispatch organization-wide alerts and operational bulletins.',
        allowedScopes: ['all'],
        defaultScope: 'all'
      },
      {
        action: 'announcement.view',
        label: 'View Announcements',
        description: 'Read company and department announcements.',
        allowedScopes: ['own', 'department', 'all'],
        defaultScope: 'own'
      },
      {
        action: 'announcement.create',
        label: 'Create Announcements',
        description: 'Publish announcements targeted to department or company.',
        allowedScopes: ['department', 'all'],
        defaultScope: 'department'
      },
      {
        action: 'announcement.edit',
        label: 'Edit Announcements',
        description: 'Modify existing announcement content and target audience.',
        allowedScopes: ['department', 'all'],
        defaultScope: 'department'
      },
      {
        action: 'announcement.delete',
        label: 'Delete Announcements',
        description: 'Delete or archive announcements from notice boards.',
        allowedScopes: ['department', 'all'],
        defaultScope: 'department'
      },
      {
        action: 'announcement.pin',
        label: 'Pin Announcements',
        description: 'Pin high-priority announcements to the top of notice boards.',
        allowedScopes: ['department', 'all'],
        defaultScope: 'department'
      }
    ]
  },
  {
    module: 'dashboard',
    label: 'Dashboards & Analytics',
    subject: 'Dashboard',
    description: 'Role-based organizational and personal analytical workspaces.',
    actions: [
      {
        action: 'dashboard.view',
        label: 'View Dashboard',
        description: 'Access role-specific dashboard (Admin, HR, Manager, or Employee).',
        allowedScopes: ['own', 'team', 'all'],
        defaultScope: 'own'
      }
    ]
  },
  {
    module: 'reports',
    label: 'Reports & Analytics',
    subject: 'Report',
    description: 'Multi-axis organizational compliance reports and export engines.',
    actions: [
      {
        action: 'report.view',
        label: 'View Reports',
        description: 'Access attendance, leave, payroll, headcount, and turnover reports.',
        allowedScopes: ['team', 'all'],
        defaultScope: 'team'
      },
      {
        action: 'report.export',
        label: 'Export Reports (Excel/PDF)',
        description: 'Export report data to styled Microsoft Excel or PDF documents.',
        allowedScopes: ['team', 'all'],
        defaultScope: 'team'
      }
    ]
  },
  {
    module: 'audit',
    label: 'Audit & Compliance Logging',
    subject: 'AuditLog',
    description: 'Forensic inspection of immutable system audit trails and data diffs.',
    actions: [
      {
        action: 'audit.view',
        label: 'View Audit Logs',
        description: 'Access the system audit log screen and inspect state changes.',
        allowedScopes: ['all'],
        defaultScope: 'all'
      }
    ]
  },
  {
    module: 'loans',
    label: 'Loans & Salary Advances',
    subject: 'Loan',
    description: 'Employee borrowing policies, multi-tier approvals, amortization schedules, and early prepayments.',
    actions: [
      {
        action: 'loan.view',
        label: 'View Loans & Schedules',
        description: 'View loan records and installment schedules within assigned scope.',
        allowedScopes: ['own', 'team', 'department', 'all'],
        defaultScope: 'own'
      },
      {
        action: 'loan.create',
        label: 'Apply for Loan / Advance',
        description: 'Submit an emergency advance or monthly installment loan request.',
        allowedScopes: ['own'],
        defaultScope: 'own'
      },
      {
        action: 'loan.recommend',
        label: 'Recommend Loan Applications',
        description: 'Department Manager review and recommend team member requests.',
        allowedScopes: ['team', 'all'],
        defaultScope: 'team'
      },
      {
        action: 'loan.approve',
        label: 'Approve & Disburse Loans',
        description: 'HR Manager and Super Admin final authorization and disbursement trigger.',
        allowedScopes: ['all'],
        defaultScope: 'all'
      },
      {
        action: 'loan.prepay',
        label: 'Record Early Repayment & Settle',
        description: 'Record lump-sum cash/bank early prepayment to amortize loan early.',
        allowedScopes: ['all'],
        defaultScope: 'all'
      },
      {
        action: 'loan.settings',
        label: 'Configure Loan Limits & Policies',
        description: 'Configure borrowing salary multipliers, interest, and maximum tenure.',
        allowedScopes: ['all'],
        defaultScope: 'all'
      }
    ]
  }
];


/**
 * Helper to retrieve flattened list of all valid action identifiers
 */
export const ALL_ACTION_IDS = PERMISSIONS_CATALOGUE.flatMap((mod) =>
  mod.actions.map((act) => act.action)
);

/**
 * @file changeRequestTheme.js
 * @description Centralized design tokens, status palettes, and category helpers for Change Requests.
 * Strictly adheres to docs/UI-REFERENCE.md (Elvara Forest & Emerald Enterprise Craft).
 */

import {
  Clock,
  Eye,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Ban,
  User,
  Phone,
  MapPin,
  HeartHandshake,
  CreditCard,
  Building2,
  Briefcase,
  Users2
} from 'lucide-react';

export const STATUS_CONFIG = {
  pending: {
    label: 'Pending Review',
    icon: Clock,
    badgeClass:
      'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/40',
    dotClass: 'bg-amber-500',
    cardBorder: 'border-l-amber-500'
  },
  under_review: {
    label: 'Under Review',
    icon: Eye,
    badgeClass:
      'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/40',
    dotClass: 'bg-blue-500',
    cardBorder: 'border-l-blue-500'
  },
  approved: {
    label: 'Approved',
    icon: CheckCircle2,
    badgeClass:
      'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40',
    dotClass: 'bg-emerald-500',
    cardBorder: 'border-l-emerald-500'
  },
  rejected: {
    label: 'Rejected',
    icon: XCircle,
    badgeClass:
      'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/40',
    dotClass: 'bg-rose-500',
    cardBorder: 'border-l-rose-500'
  },
  returned: {
    label: 'Returned for Correction',
    icon: RotateCcw,
    badgeClass:
      'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/40',
    dotClass: 'bg-purple-500',
    cardBorder: 'border-l-purple-500'
  },
  cancelled: {
    label: 'Cancelled',
    icon: Ban,
    badgeClass:
      'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700',
    dotClass: 'bg-slate-500',
    cardBorder: 'border-l-slate-400'
  }
};

export const CATEGORY_CONFIG = {
  personal: {
    label: 'Personal Information',
    shortLabel: 'Personal',
    icon: User,
    colorClass:
      'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/40'
  },
  contact: {
    label: 'Contact Information',
    shortLabel: 'Contact',
    icon: Phone,
    colorClass:
      'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800/40'
  },
  address: {
    label: 'Residential Address',
    shortLabel: 'Address',
    icon: MapPin,
    colorClass:
      'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800/40'
  },
  emergency_contact: {
    label: 'Emergency Contact',
    shortLabel: 'Emergency',
    icon: HeartHandshake,
    colorClass:
      'bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800/40'
  },
  bank_details: {
    label: 'Bank Account & IBAN',
    shortLabel: 'Banking',
    icon: CreditCard,
    colorClass:
      'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40'
  },
  department: {
    label: 'Department Transfer',
    shortLabel: 'Department',
    icon: Building2,
    colorClass:
      'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/40'
  },
  designation: {
    label: 'Designation / Grade',
    shortLabel: 'Designation',
    icon: Briefcase,
    colorClass:
      'bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800/40'
  },
  reporting_manager: {
    label: 'Reporting Manager',
    shortLabel: 'Manager',
    icon: Users2,
    colorClass:
      'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800/40'
  }
};

export const PRIORITY_CONFIG = {
  normal: {
    label: 'Normal',
    badgeClass:
      'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
  },
  high: {
    label: 'High',
    badgeClass:
      'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800/40'
  },
  urgent: {
    label: 'Urgent',
    badgeClass:
      'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/40 font-bold animate-pulse'
  }
};

export function getStatusBadge(status) {
  return STATUS_CONFIG[status] || STATUS_CONFIG.pending;
}

export function getCategoryBadge(category) {
  return CATEGORY_CONFIG[category] || CATEGORY_CONFIG.personal;
}

export function getPriorityBadge(priority) {
  return PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.normal;
}

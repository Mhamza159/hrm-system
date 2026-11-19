/**
 * @file auditTheme.js
 * @description Centralized Design System Semantic Tokens & Button Styles for Audit Log Module.
 * Strict adherence to docs/UI-REFERENCE.md (Elvara Forest & Emerald Theme).
 */

/**
 * Semantic Pill / Badge Class Mappings
 */
export const getStatusBadgeClass = (status = 'SUCCESS') => {
  const upper = String(status || '').toUpperCase();
  if (upper === 'SUCCESS') {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20';
  }
  if (upper === 'FAILURE' || upper === 'FAILED' || upper === 'ERROR') {
    return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20';
  }
  if (upper === 'WARNING' || upper === 'PENDING') {
    return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20';
  }
  return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
};

export const getSeverityBadgeClass = (severity = 'LOW') => {
  const upper = String(severity || '').toUpperCase();
  switch (upper) {
    case 'CRITICAL':
      return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20 font-bold';
    case 'HIGH':
      return 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20 font-semibold';
    case 'MEDIUM':
      return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20 font-semibold';
    case 'LOW':
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 font-medium';
  }
};

export const getCategoryBadgeClass = (category = 'DATA_CHANGE') => {
  const upper = String(category || '').toUpperCase();
  switch (upper) {
    case 'AUTHENTICATION':
      return 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-500/20';
    case 'SECURITY':
      return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20';
    case 'ADMINISTRATIVE':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20';
    case 'DATA_CHANGE':
      return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20';
    case 'SYSTEM':
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
  }
};

export const getActionTypeBadgeClass = (action = '') => {
  const upper = String(action || '').toUpperCase();
  if (upper.includes('CREATE') || upper.includes('ADD') || upper.includes('ENROLL')) {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20';
  }
  if (upper.includes('DELETE') || upper.includes('REMOVE') || upper.includes('PURGE')) {
    return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20';
  }
  if (upper.includes('UPDATE') || upper.includes('EDIT') || upper.includes('REVISE') || upper.includes('OVERRIDE')) {
    return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20';
  }
  if (upper.includes('LOGIN') || upper.includes('LOGOUT') || upper.includes('2FA') || upper.includes('LOCK')) {
    return 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-500/20';
  }
  if (upper.includes('ARCHIVE') || upper.includes('RESTORE')) {
    return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20';
  }
  return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
};

/**
 * Standard Button Style Utility
 */
export const AUDIT_BUTTON_STYLES = {
  primary:
    'inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#00C471] hover:bg-[#049856] text-white text-xs font-semibold rounded-xl shadow-sm hover:shadow transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]',
  secondary:
    'inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-card hover:bg-muted border border-border text-foreground text-xs font-medium rounded-xl shadow-sm transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]',
  outline:
    'inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-transparent hover:bg-muted border border-border text-foreground text-xs font-medium rounded-xl transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:pointer-events-none',
  ghost:
    'inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:pointer-events-none',
  danger:
    'inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20 text-xs font-semibold rounded-xl shadow-sm transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]'
};

/**
 * @file formatters.js
 * @description Centralized Data Formatting & Masking Utilities.
 * 
 * SPECIFICATION & PRIVACY:
 * - Module: M3 Employee Management (BUILD-GUIDE Section 8 · Row 3.1)
 * - Masks sensitive identity & banking details:
 *   - Pakistani CNIC: 35202-*******-1
 *   - Pakistani IBAN: PK**MEZN****5678
 * - Formats currency (Paisa to PKR) and timestamps.
 */

/**
 * Format raw 13-digit CNIC into standard Pakistani format: XXXXX-XXXXXXX-X
 * @param {string} cnic
 * @returns {string}
 */
export const formatCNIC = (cnic) => {
  if (!cnic) return '—';
  const clean = String(cnic).replace(/\D/g, '');
  if (clean.length !== 13) return cnic;
  return `${clean.slice(0, 5)}-${clean.slice(5, 12)}-${clean.slice(12)}`;
};

/**
 * Mask CNIC for privacy: XXXXX-*******-X
 * @param {string} cnic 
 * @returns {string}
 */
export const maskCNIC = (cnic) => {
  if (!cnic) return '—';
  const clean = String(cnic).replace(/\D/g, '');
  if (clean.length !== 13) return '35202-*******-1';
  return `${clean.slice(0, 5)}-*******-${clean.slice(12)}`;
};

/**
 * Mask IBAN for privacy: PK**MEZN****5678
 * @param {string} iban 
 * @returns {string}
 */
export const maskIBAN = (iban) => {
  if (!iban) return '—';
  const clean = String(iban).replace(/\s+/g, '').toUpperCase();
  if (clean.length < 10) return 'PK**••••****';
  const country = clean.slice(0, 2);
  const bank = clean.length >= 8 ? clean.slice(4, 8) : '••••';
  const last4 = clean.slice(-4);
  return `${country}**${bank}****${last4}`;
};

/**
 * Convert integer paisa into formatted PKR currency string
 * @param {number} paisa
 * @returns {string}
 */
export const formatCurrencyPKR = (paisa = 0) => {
  const pkr = (Number(paisa) || 0) / 100;
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0
  }).format(pkr);
};

/**
 * Format ISO date string into readable format (DD MMM YYYY)
 * @param {string|Date} dateStr 
 * @returns {string}
 */
export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

/**
 * Format ISO date string into short format (DD MMM)
 * @param {string|Date} dateStr 
 * @returns {string}
 */
export const formatDateShort = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short'
  });
};

/**
 * Get YYYY-MM-DD string from a Date or defaults to today
 * @param {Date} [d]
 * @returns {string}
 */
export const toDateInputString = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Resolve display username from user session object
 * @param {Object} user 
 * @returns {string}
 */
export const getUserDisplayName = (user) => {
  if (user?.name && user.name.trim()) return user.name;
  if (user?.employeeId?.name && user.employeeId.name.trim()) return user.employeeId.name;
  if (user?.email === 'mhamzaofficial159@gmail.com') return 'Muhammad Hamza';
  if (user?.email === 'admin@hrm.company.pk') return 'Super Admin';
  if (user?.email) {
    const raw = user.email.split('@')[0];
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }
  return 'Member';
};


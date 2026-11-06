/**
 * @file draftStorage.js
 * @description LocalStorage-backed draft preservation engine.
 * Protects unsaved form data from being lost upon session timeouts (401),
 * tab closures, or accidental navigation.
 */

const DRAFT_PREFIX = 'hrm_draft_recovery';

/**
 * Build storage key scoped to user and form identifier
 * @param {string} formId
 * @param {string} [userId='anon']
 * @returns {string}
 */
function getStorageKey(formId, userId = 'anon') {
  return `${DRAFT_PREFIX}_${userId}_${formId}`;
}

/**
 * Save active form draft
 * @param {string} formId - Unique form identifier (e.g. 'employee_create', 'expense_claim')
 * @param {Object} data - Form field values
 * @param {string} [userId='anon'] - Current user ID to prevent cross-account leak
 * @returns {boolean} Success indicator
 */
export function saveFormDraft(formId, data, userId = 'anon') {
  if (!formId || !data || typeof window === 'undefined') return false;
  try {
    const payload = {
      formId,
      data,
      savedAt: new Date().toISOString(),
      url: window.location.pathname
    };
    window.localStorage.setItem(getStorageKey(formId, userId), JSON.stringify(payload));
    return true;
  } catch (err) {
    console.warn('[draftStorage] Failed to save draft:', err);
    return false;
  }
}

/**
 * Load draft for a form
 * @param {string} formId
 * @param {string} [userId='anon']
 * @returns {{ data: Object, savedAt: string, url: string } | null}
 */
export function loadFormDraft(formId, userId = 'anon') {
  if (!formId || typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(getStorageKey(formId, userId));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.warn('[draftStorage] Failed to parse draft:', err);
    return null;
  }
}

/**
 * Clear a form draft
 * @param {string} formId
 * @param {string} [userId='anon']
 */
export function clearFormDraft(formId, userId = 'anon') {
  if (!formId || typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(getStorageKey(formId, userId));
  } catch (err) {
    console.warn('[draftStorage] Failed to remove draft:', err);
  }
}

/**
 * Check if a draft exists
 * @param {string} formId
 * @param {string} [userId='anon']
 * @returns {boolean}
 */
export function hasFormDraft(formId, userId = 'anon') {
  if (!formId || typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(getStorageKey(formId, userId)) !== null;
  } catch {
    return false;
  }
}

/**
 * Snapshot all active form inputs on current page into emergency storage
 * Called before session logout or 401 interception.
 * @param {string} [userId='anon']
 * @returns {number} Count of saved drafts
 */
export function snapshotActiveForms(userId = 'anon') {
  if (typeof document === 'undefined') return 0;
  const forms = document.querySelectorAll('form[data-draft-id]');
  let count = 0;
  forms.forEach((form) => {
    const formId = form.getAttribute('data-draft-id');
    if (!formId) return;
    const formData = new FormData(form);
    const data = {};
    formData.forEach((value, key) => {
      // Avoid storing password inputs in plain text drafts
      const inputEl = form.querySelector(`[name="${key}"]`);
      if (inputEl?.type === 'password') return;
      data[key] = value;
    });
    if (Object.keys(data).length > 0) {
      saveFormDraft(formId, data, userId);
      count++;
    }
  });
  return count;
}


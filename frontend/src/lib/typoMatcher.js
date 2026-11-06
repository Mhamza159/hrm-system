/**
 * @file typoMatcher.js
 * @description Fuzzy matching and typo tolerance engine using Levenshtein distance.
 * Suggests corrections when table filters or searches return zero records.
 */

/**
 * Compute the Levenshtein distance between two strings.
 * @param {string} a
 * @param {string} b
 * @returns {number} Minimum number of single-character edits
 */
export function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const row = Array.from({ length: b.length + 1 }, (_, i) => i);

  for (let i = 1; i <= a.length; i++) {
    let prev = i;
    for (let j = 1; j <= b.length; j++) {
      const val = a[i - 1] === b[j - 1] ? row[j - 1] : Math.min(row[j - 1], prev, row[j]) + 1;
      row[j - 1] = prev;
      prev = val;
    }
    row[b.length] = prev;
  }

  return row[b.length];
}

/**
 * Find the closest matching term from a pool of candidates
 * @param {string} query - The user's search query
 * @param {string[]} candidates - Array of candidate strings (e.g., department names, roles, employee names)
 * @param {number} [maxDistance=2] - Maximum allowable edit distance
 * @returns {string|null} The closest candidate or null
 */
export function findClosestMatch(query, candidates = [], maxDistance = 2) {
  if (!query || typeof query !== 'string' || !candidates || !candidates.length) {
    return null;
  }

  const cleanQuery = query.trim().toLowerCase();
  if (cleanQuery.length < 2) return null;

  let bestMatch = null;
  let minDistance = Infinity;

  // Set max distance dynamically based on query length (avoid aggressive false matches on short strings)
  const allowedDistance = cleanQuery.length <= 4 ? 1 : cleanQuery.length <= 8 ? 2 : Math.min(3, maxDistance);

  // De-duplicate candidates and normalize
  const uniqueCandidates = Array.from(new Set(candidates.filter(Boolean)));

  for (const candidate of uniqueCandidates) {
    const cleanCand = String(candidate).trim().toLowerCase();
    
    // Ignore exact matches
    if (cleanCand === cleanQuery) return null;

    // Direct substring or contains match isn't a typo
    if (cleanCand.includes(cleanQuery) || cleanQuery.includes(cleanCand)) {
      continue;
    }

    const dist = levenshtein(cleanQuery, cleanCand);
    if (dist <= allowedDistance && dist < minDistance) {
      minDistance = dist;
      bestMatch = candidate;
    }
  }

  return bestMatch;
}

/**
 * Extract distinct string vocabulary from an array of table rows
 * @param {Object[]} rows - Array of objects
 * @param {string[]} [fields] - Fields to inspect (or all string fields if omitted)
 * @returns {string[]}
 */
export function extractVocabulary(rows = [], fields = null) {
  if (!Array.isArray(rows) || rows.length === 0) return [];
  const words = new Set();

  for (const row of rows) {
    if (!row || typeof row !== 'object') continue;
    const targetKeys = fields && fields.length ? fields : Object.keys(row);
    for (const key of targetKeys) {
      const val = row[key];
      if (typeof val === 'string' && val.trim().length > 1) {
        words.add(val.trim());
        // Also add individual tokens for multi-word fields
        val.split(/\s+/).forEach((w) => {
          if (w.length > 2) words.add(w);
        });
      }
    }
  }

  return Array.from(words);
}


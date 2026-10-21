/**
 * @file backup.restore.test.js
 * @description Automated Database Backup & Restore Pipeline Parity Test.
 * 
 * SPECIFICATION:
 * - Module: M12 (X1 Security & Quality Gate)
 * - Row: X1.7 Automated Database Backup & Validated Restore Pipeline
 */

import { describe, it, expect } from 'vitest';
import { verifyRestorePipeline } from '../src/scripts/verifyRestore.js';

describe('Module X1.7 — Automated Database Backup & Validated Restore Pipeline', { timeout: 45000 }, () => {
  it('X1.7-TEST: Restores database snapshot to verification target, confirms data parity, and tears down cleanly', async () => {
    const result = await verifyRestorePipeline();

    expect(result.passed).toBe(true);
    expect(result.dropped).toBe(true);
    expect(result.rolesRestored).toBeGreaterThan(0);
  });
});

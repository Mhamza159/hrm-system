/**
 * @file performance.test.js
 * @description High-Density 500-Employee Performance & Latency Benchmark Tests.
 * 
 * SPECIFICATION:
 * - Module: M12 (X1 Security & Quality Gate)
 * - Row: X1.8 High-Density Performance Optimization & 500-Employee Benchmark
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { runBenchmark } from '../src/scripts/benchmarkPerformance.js';
import { env } from '../src/config/env.js';

describe('Module X1.8 — High-Density 500-Employee Performance Benchmark', { timeout: 60000 }, () => {
  const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_x1_perf');

  beforeAll(async () => {
    await mongoose.connect(testDbUri);
  });

  afterAll(async () => {
    // Drop test database after benchmark verification
    try {
      await mongoose.connection.dropDatabase();
    } catch (e) {
      // ignore
    }
    await mongoose.connection.close();
  });

  it('X1.8-TEST: 500-Employee database scales with sub-second paginated query latency (< 1,000ms)', async () => {
    const results = await runBenchmark(testDbUri);

    expect(results.employeeCount).toBeGreaterThanOrEqual(500);
    expect(results.empLatency).toBeLessThan(1000);
    expect(results.attLatency).toBeLessThan(2500);
    expect(results.payLatency).toBeLessThan(2000);
    expect(results.passed).toBe(true);
  });
});

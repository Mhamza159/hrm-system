import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import '../src/config/db.js';
import { User } from '../src/models/user.model.js';
import { env } from '../src/config/env.js';

describe('User Model (Slice 1.1-TEST)', () => {
  beforeAll(async () => {
    // Connect to test database
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_m1');
    await mongoose.connect(testDbUri);
    await User.deleteMany({});
  });

  afterAll(async () => {
    await User.deleteMany({});
    await mongoose.disconnect();
  });

  it('should create user with default security flags and lowercase email', async () => {
    const passwordHash = await User.hashPassword('Secret123!');
    const user = await User.create({
      email: 'Test.Employee@Company.PK',
      passwordHash
    });

    expect(user.email).toBe('test.employee@company.pk');
    expect(user.isActive).toBe(true);
    expect(user.failedAttempts).toBe(0);
    expect(user.lockUntil).toBeNull();
    expect(user.twoFactorEnabled).toBe(false);
    expect(user.mustChangePassword).toBe(false);
    expect(user.isDeleted).toBe(false);

    const isMatch = await user.comparePassword('Secret123!');
    expect(isMatch).toBe(true);

    const isWrongMatch = await user.comparePassword('WrongPassword');
    expect(isWrongMatch).toBe(false);
  });

  it('should enforce unique email constraint', async () => {
    const passwordHash = await User.hashPassword('Secret123!');
    let duplicateError = null;

    try {
      await User.create({
        email: 'test.employee@company.pk', // duplicate
        passwordHash
      });
    } catch (err) {
      duplicateError = err;
    }

    expect(duplicateError).not.toBeNull();
    expect(duplicateError.code).toBe(11000); // MongoDB duplicate key error
  });
});

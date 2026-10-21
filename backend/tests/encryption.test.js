/**
 * @file encryption.test.js
 * @description Integration tests for Module X1.3: Multi-Tier AES-256-GCM Encryption at rest.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { encrypt, decrypt } from '../src/utils/crypto.js';
import { Employee } from '../src/models/employee.model.js';
import { Department } from '../src/models/department.model.js';
import * as employeeService from '../src/modules/employees/employee.service.js';
import { env } from '../src/config/env.js';

describe('Module X1.3 — Multi-Tier Encryption at Rest & Tamper Resistance Tests', () => {
  let testDept;

  beforeAll(async () => {
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_x1_encryption');
    await mongoose.connect(testDbUri);

    await Employee.deleteMany({});
    await Department.deleteMany({});

    testDept = await Department.create({
      name: 'Cryptographic Security',
      code: 'CRYPTO'
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('X1.3-TEST: crypto.js encrypts string into 3-part iv:authTag:ciphertext format', () => {
    const rawCnic = '35201-9876543-1';
    const cipher = encrypt(rawCnic);

    expect(typeof cipher).toBe('string');
    const parts = cipher.split(':');
    expect(parts.length).toBe(3);

    // IV is 16 bytes = 32 hex chars
    expect(parts[0].length).toBe(32);
    // Auth tag is 16 bytes = 32 hex chars
    expect(parts[1].length).toBe(32);
    // Ciphertext is non-empty
    expect(parts[2].length).toBeGreaterThan(0);

    // Decrypt matches original
    const decrypted = decrypt(cipher);
    expect(decrypted).toBe(rawCnic);
  });

  it('X1.3-TEST: Tampered ciphertext or auth tag fails decryption safely', () => {
    const cipher = encrypt('PK36MEZN00012345678901');
    const parts = cipher.split(':');

    // Corrupt the auth tag
    const tamperedAuthTag = '00'.repeat(16);
    const tamperedCipher = `${parts[0]}:${tamperedAuthTag}:${parts[2]}`;

    expect(() => decrypt(tamperedCipher)).toThrow();
  });

  it('X1.3-TEST: Raw MongoDB document stores CNIC & Bank details as ciphertext, never plaintext', async () => {
    const rawCnic = '42101-1234567-3';
    const rawIban = 'PK36MEZN00099998888777';
    const rawAccount = '1234567890';

    const createdEmp = await employeeService.createEmployee(
      {
        employeeCode: 'EMP-ENC-001',
        name: 'Encrypted Person',
        email: 'crypto.person@example.com',
        departmentId: testDept._id,
        status: 'Active',
        cnic: rawCnic,
        bankDetails: {
          bankName: 'Meezan Bank',
          accountTitle: 'Encrypted Person',
          accountNumber: rawAccount,
          iban: rawIban
        }
      },
      { email: 'admin@hrm.local', roles: ['Super Admin'] }
    );

    // 1. Inspect direct raw MongoDB collection state bypassing service layer
    const rawDoc = await mongoose.connection.collection('employees').findOne({ _id: createdEmp._id });

    expect(rawDoc.cnic).not.toBe(rawCnic);
    expect(rawDoc.cnic).toContain(':');
    expect(rawDoc.bankDetails.iban).not.toBe(rawIban);
    expect(rawDoc.bankDetails.iban).toContain(':');
    expect(rawDoc.bankDetails.accountNumber).not.toBe(rawAccount);
    expect(rawDoc.bankDetails.accountNumber).toContain(':');

    // 2. Fetch through authorized service layer: should transparently decrypt
    const fetchedEmp = await employeeService.getEmployeeById(
      createdEmp._id,
      { _id: new mongoose.Types.ObjectId(), roles: ['Super Admin'] },
      'all'
    );
    expect(fetchedEmp.cnic).toBe(rawCnic);
    expect(fetchedEmp.bankDetails.iban).toBe(rawIban);
    expect(fetchedEmp.bankDetails.accountNumber).toBe(rawAccount);
  });
});

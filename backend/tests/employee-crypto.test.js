import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { encrypt, decrypt } from '../src/utils/crypto.js';
import { Employee } from '../src/models/employee.model.js';
import { env } from '../src/config/env.js';

describe('Employee AES-256-GCM Field-Level Encryption (Slice 3.1-TEST)', () => {
  const plainCnic = '35202-1234567-1';
  const plainIban = 'PK36SCBL0000001123456701';

  beforeAll(async () => {
    const testDbUri = env.MONGO_URI.replace('hrm_development', 'hrm_test_m3_crypto');
    await mongoose.connect(testDbUri);
    await Employee.deleteMany({ employeeCode: 'TEST-CRYPTO-01' });
  });

  afterAll(async () => {
    await Employee.deleteMany({ employeeCode: 'TEST-CRYPTO-01' });
    await mongoose.disconnect();
  });

  it('should encrypt plaintext into iv:authTag:cipher format and decrypt accurately', () => {
    const cipherText = encrypt(plainCnic);
    expect(cipherText).toBeDefined();
    expect(cipherText).not.toBe(plainCnic);

    const parts = cipherText.split(':');
    expect(parts.length).toBe(3);
    expect(parts[0]).toHaveLength(32); // 16 bytes IV = 32 hex chars
    expect(parts[1]).toHaveLength(32); // 16 bytes AuthTag = 32 hex chars

    const decrypted = decrypt(cipherText);
    expect(decrypted).toBe(plainCnic);
  });

  it('should reject or throw error when authentication tag is tampered with', () => {
    const cipherText = encrypt(plainIban);
    const parts = cipherText.split(':');

    // Tamper with the authentication tag
    const tamperedTag = '00'.repeat(16);
    const tamperedCipher = `${parts[0]}:${tamperedTag}:${parts[2]}`;

    expect(() => decrypt(tamperedCipher)).toThrow();
  });

  it('should store encrypted cipher text in MongoDB without plaintext leakage', async () => {
    const encryptedCnic = encrypt(plainCnic);
    const encryptedIban = encrypt(plainIban);

    const emp = await Employee.create({
      employeeCode: 'TEST-CRYPTO-01',
      name: 'Crypto Test Employee',
      email: 'crypto.test@company.pk',
      cnic: encryptedCnic,
      bankDetails: {
        bankName: 'Standard Chartered',
        accountTitle: 'Crypto Test Employee',
        accountNumber: '1123456701',
        iban: encryptedIban
      }
    });

    // Query raw document directly from MongoDB collection
    const rawDoc = await Employee.collection.findOne({ _id: emp._id });

    expect(rawDoc.cnic).toBe(encryptedCnic);
    expect(rawDoc.cnic).not.toBe(plainCnic);
    expect(rawDoc.cnic).toContain(':');

    expect(rawDoc.bankDetails.iban).toBe(encryptedIban);
    expect(rawDoc.bankDetails.iban).not.toBe(plainIban);
    expect(rawDoc.bankDetails.iban).toContain(':');

    // Decrypt fields
    expect(decrypt(rawDoc.cnic)).toBe(plainCnic);
    expect(decrypt(rawDoc.bankDetails.iban)).toBe(plainIban);
  });

  it('should handle falsy and empty string values gracefully', () => {
    expect(encrypt(null)).toBeNull();
    expect(encrypt('')).toBe('');
    expect(decrypt(null)).toBeNull();
    expect(decrypt('')).toBe('');
    expect(decrypt('invalid-format-string')).toBe('invalid-format-string');
  });
});

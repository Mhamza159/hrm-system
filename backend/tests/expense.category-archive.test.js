/**
 * @file expense.category-archive.test.js
 * @description Expense category archive lifecycle: archive (disabled + hidden), restore,
 * permanent delete (only archived, only with no linked claims), code reuse messages.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { env } from '../src/config/env.js';
import { ExpenseCategory } from '../src/models/expenseCategory.model.js';
import { Expense } from '../src/models/expense.model.js';
import {
  createCategory,
  getAllCategories,
  getArchivedCategories,
  deleteCategory,
  restoreCategory,
  permanentDeleteCategory
} from '../src/modules/expenses/expense.service.js';

const actor = { _id: new mongoose.Types.ObjectId(), roles: [{ name: 'Super Admin' }] };

describe('Expense category archive lifecycle', () => {
  beforeAll(async () => {
    const uri = env.MONGO_URI.replace('hrm_development', 'hrm_test_expense_cat_archive');
    if (!uri.includes('hrm_test')) throw new Error('Refusing to run against a non-test database');
    await mongoose.connect(uri);
    await Promise.all([ExpenseCategory.deleteMany({}), Expense.deleteMany({})]);
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it('archiving disables the category and moves it from the active list to the archive', async () => {
    const cat = await createCategory({ name: 'Travel', code: 'TRV', maxLimitPaisa: 500000 }, actor);
    await deleteCategory(cat._id, actor);

    const active = await getAllCategories();
    expect(active.find((c) => String(c._id) === String(cat._id))).toBeUndefined();

    const archived = await getArchivedCategories();
    const row = archived.find((c) => String(c._id) === String(cat._id));
    expect(row).toBeDefined();
    expect(row.isActive).toBe(false);
    expect(row.archivedAt).toBeTruthy();
    expect(row.claimCount).toBe(0);
  });

  it('restoring brings it back as active and clears archive metadata', async () => {
    const cat = await createCategory({ name: 'Meals', code: 'MEAL' }, actor);
    await deleteCategory(cat._id, actor);
    const restored = await restoreCategory(cat._id, actor);

    expect(restored.isDeleted).toBe(false);
    expect(restored.isActive).toBe(true);
    expect(restored.archivedAt).toBeNull();
    expect((await getAllCategories()).some((c) => String(c._id) === String(cat._id))).toBe(true);
  });

  it('permanent delete refuses an active category', async () => {
    const cat = await createCategory({ name: 'Fuel', code: 'FUEL' }, actor);
    await expect(permanentDeleteCategory(cat._id, actor)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('permanent delete refuses an archived category that claims still reference', async () => {
    const cat = await createCategory({ name: 'Internet', code: 'NET' }, actor);
    await Expense.collection.insertOne({ claimNumber: 'EXP-T-1', categoryId: cat._id, amount: 100, status: 'reimbursed' });
    await deleteCategory(cat._id, actor);

    await expect(permanentDeleteCategory(cat._id, actor)).rejects.toMatchObject({ statusCode: 409 });
    const archived = await getArchivedCategories();
    expect(archived.find((c) => String(c._id) === String(cat._id)).claimCount).toBe(1);
  });

  it('permanent delete removes an unused archived category and frees its code', async () => {
    const cat = await createCategory({ name: 'Parking', code: 'PARK' }, actor);
    await deleteCategory(cat._id, actor);
    await permanentDeleteCategory(cat._id, actor);

    expect(await ExpenseCategory.findById(cat._id)).toBeNull();
    const again = await createCategory({ name: 'Parking', code: 'PARK' }, actor);
    expect(again.code).toBe('PARK');
  });

  it('creating with an archived category code explains how to resolve it', async () => {
    const cat = await createCategory({ name: 'Training', code: 'TRN' }, actor);
    await deleteCategory(cat._id, actor);
    await expect(createCategory({ name: 'Training 2', code: 'TRN' }, actor)).rejects.toMatchObject({
      statusCode: 409,
      message: expect.stringMatching(/archived/i)
    });
  });
});

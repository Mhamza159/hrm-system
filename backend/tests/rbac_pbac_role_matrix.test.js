import request from 'supertest';
import { describe, it, expect, beforeAll } from 'vitest';
import app from '../src/app.js';
import { connectDB } from '../src/config/db.js';
import { User } from '../src/models/user.model.js';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env.js';

describe('M6 Multi-Role PBAC & RBAC Enforcement Matrix', () => {
  let employeeToken;
  let managerToken;
  let hrToken;
  let adminToken;

  const makeToken = (user) => {
    return jwt.sign(
      { userId: user._id, email: user.email, roles: user.roles },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );
  };

  beforeAll(async () => {
    await connectDB();
    const [empUser, mgrUser, hrUser, adminUser] = await Promise.all([
      User.findOne({ email: 'employee@hrm.company.pk' }),
      User.findOne({ email: 'manager@hrm.company.pk' }),
      User.findOne({ email: 'hr@hrm.company.pk' }),
      User.findOne({ email: 'mhamzaofficial159@gmail.com' })
    ]);

    employeeToken = makeToken(empUser);
    managerToken = makeToken(mgrUser);
    hrToken = makeToken(hrUser);
    adminToken = makeToken(adminUser);
  }, 30000);

  it('Role 1: Employee CAN view balance and CANNOT create leave types (403)', async () => {
    // Allowed
    const resAllowed = await request(app)
      .get('/api/v1/leaves/balance')
      .set('Authorization', `Bearer ${employeeToken}`);
    expect(resAllowed.statusCode).toBe(200);

    // Forbidden: Employee cannot create leave types
    const resForbidden = await request(app)
      .post('/api/v1/leave-types')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({ name: 'Hacker Leave', code: 'HL', daysPerYear: 30 });
    expect(resForbidden.statusCode).toBe(403);
  });

  it('Role 1: Employee CANNOT create holidays or override balances (403)', async () => {
    const resHoliday = await request(app)
      .post('/api/v1/holidays')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({ name: 'Fake Holiday', date: '2026-12-31' });
    expect(resHoliday.statusCode).toBe(403);

    const resOverride = await request(app)
      .patch('/api/v1/leave-balances/6ad72f3f43b132bb9a4f1eaf')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({ balanceId: '6ad72f3f43b132bb9a4f1eaf', days: 50, reason: 'Unauthorized' });
    expect(resOverride.statusCode).toBe(403);
  });

  it('Role 2: Department Manager CAN view team leaves, CANNOT create leave types (403)', async () => {
    const resApprovals = await request(app)
      .get('/api/v1/leaves/approvals')
      .set('Authorization', `Bearer ${managerToken}`);
    expect(resApprovals.statusCode).toBe(200);

    const resTypes = await request(app)
      .post('/api/v1/leave-types')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ name: 'Manager Custom Leave', code: 'MCL' });
    expect(resTypes.statusCode).toBe(403);
  });

  it('Role 2: Department Manager CANNOT manage holidays or override balances (403)', async () => {
    const resHoliday = await request(app)
      .post('/api/v1/holidays')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ name: 'Manager Holiday', date: '2026-11-15' });
    expect(resHoliday.statusCode).toBe(403);

    const resOverride = await request(app)
      .patch('/api/v1/leave-balances/6ad72f3f43b132bb9a4f1eaf')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ balanceId: '6ad72f3f43b132bb9a4f1eaf', days: 50 });
    expect(resOverride.statusCode).toBe(403);
  });

  it('Role 3: HR Manager CAN view leave approvals and export reports', async () => {
    const resApprovals = await request(app)
      .get('/api/v1/leaves/approvals')
      .set('Authorization', `Bearer ${hrToken}`);
    expect(resApprovals.statusCode).toBe(200);

    const resReport = await request(app)
      .get('/api/v1/reports/leaves')
      .set('Authorization', `Bearer ${hrToken}`);
    expect(resReport.statusCode).toBe(200);
  });

  it('Role 4: Super Admin possesses unrestricted access', async () => {
    const resTypes = await request(app)
      .get('/api/v1/leave-types')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(resTypes.statusCode).toBe(200);

    const resReport = await request(app)
      .get('/api/v1/reports/leaves')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(resReport.statusCode).toBe(200);
  });
});

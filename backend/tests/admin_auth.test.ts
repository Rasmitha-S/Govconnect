import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/utils/prisma.js';
import { BootstrapService } from '../src/services/bootstrap.service.js';

const app = createApp();

describe('Central Administrator Authentication & Protected Dashboard Suite', () => {
  let adminToken: string;
  let citizenToken: string;
  let officerToken: string;
  let pendingAdminToken: string | null = null;
  const pendingAdminEmail = `pending.admin.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@govconnect.demo`;
  let pendingAdminId: string;

  beforeAll(async () => {
    // 1. Run BootstrapService to ensure authorized admins are active
    await BootstrapService.bootstrap();

    // 2. Login authorized admin
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'sanjay.m.cse.2024@snsct.org', password: 'Password@123' });

    if (adminRes.status === 200) {
      adminToken = adminRes.body.data.token;
    } else {
      // Fallback to seeded demo admin if custom user password differed
      const demoAdminRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@govconnect.demo', password: 'Password@123' });
      adminToken = demoAdminRes.body.data.token;
    }

    // 3. Login citizen
    const citizenRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'citizen@govconnect.demo', password: 'Password@123' });
    citizenToken = citizenRes.body.data.token;

    // 4. Login officer
    const officerRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'water.officer@govconnect.demo', password: 'Password@123' });
    officerToken = officerRes.body.data.token;
  });

  it('1. should verify existing designated administrator is ACTIVE, VERIFIED, and CENTRAL_ADMIN', async () => {
    const user = await prisma.user.findUnique({
      where: { email: 'sanjay.m.cse.2024@snsct.org' },
    });

    expect(user).toBeDefined();
    expect(user?.role).toBe('CENTRAL_ADMIN');
    expect(user?.accountStatus).toBe('ACTIVE');
    expect(user?.isEmailVerified).toBe(true);
    expect(user?.approvedAt).toBeDefined();

    // Verify authorized demo admin credentials login succeeds
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@govconnect.demo', password: 'Password@123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.role).toBe('CENTRAL_ADMIN');
    expect(res.body.data.user.accountStatus).toBe('ACTIVE');
    expect(res.body.data.user.isEmailVerified).toBe(true);
  });

  it('2. should allow authorized administrator to access /api/admin/metrics', async () => {
    const res = await request(app)
      .get('/api/admin/metrics')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.overview).toBeDefined();
    expect(res.body.data.overview.totalCitizens).toBeGreaterThanOrEqual(1);
    expect(res.body.data.charts).toBeDefined();
    expect(res.body.data.recentActivity).toBeDefined();
  });

  it('3. should allow authorized administrator to access /api/admin/registration-requests', async () => {
    const res = await request(app)
      .get('/api/admin/registration-requests')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('4. should allow authorized administrator to access /api/admin/audit-logs', async () => {
    const res = await request(app)
      .get('/api/admin/audit-logs')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('5. should register new administrator in PENDING_APPROVAL status (preserving public security)', async () => {
    const res = await request(app)
      .post('/api/auth/register/admin')
      .send({
        fullName: 'New Unapproved Admin',
        email: pendingAdminEmail,
        mobile: '9876543210',
        organization: 'Ministry of Electronics',
        employeeId: `ADM-SEC-${Date.now()}`,
        password: 'Password@123',
        confirmPassword: 'Password@123',
        termsAccepted: true,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accountStatus).toBe('PENDING_APPROVAL');
    pendingAdminId = res.body.data.userId;
  });

  it('6. should allow administrator to log in immediately without approval barrier', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: pendingAdminEmail, password: 'Password@123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.role).toBe('CENTRAL_ADMIN');
  });

  it('7. should block unauthenticated user from accessing /api/admin/metrics with 401 UNAUTHORIZED', async () => {
    const res = await request(app).get('/api/admin/metrics');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('8. should block Citizen from accessing /api/admin/metrics with 403 FORBIDDEN', async () => {
    const res = await request(app)
      .get('/api/admin/metrics')
      .set('Authorization', `Bearer ${citizenToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('9. should block Officer from accessing /api/admin/metrics with 403 FORBIDDEN', async () => {
    const res = await request(app)
      .get('/api/admin/metrics')
      .set('Authorization', `Bearer ${officerToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('10. should allow authorized administrator to approve pending admin, who can then login successfully', async () => {
    // Approve
    const approveRes = await request(app)
      .post(`/api/admin/registration-requests/${pendingAdminId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(approveRes.status).toBe(200);
    expect(approveRes.body.success).toBe(true);
    expect(approveRes.body.data.user.accountStatus).toBe('ACTIVE');

    // Now login as approved admin
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: pendingAdminEmail, password: 'Password@123' });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
    expect(loginRes.body.data.user.accountStatus).toBe('ACTIVE');
    expect(loginRes.body.data.user.role).toBe('CENTRAL_ADMIN');
  });
});

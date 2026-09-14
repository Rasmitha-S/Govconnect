import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/utils/prisma.js';
import { BootstrapService } from '../src/services/bootstrap.service.js';
import bcrypt from 'bcryptjs';

const app = createApp();

describe('GovConnect Auth & Access Control Full Verification (Tests 1 - 10)', () => {
  let activeAdminToken: string;
  let activeOfficerToken: string;
  let citizenToken: string;

  const testSuffix = Date.now();
  const pendingOfficerEmail = `pending.officer.${testSuffix}@govconnect.demo`;
  const pendingAdminEmail = `pending.admin.${testSuffix}@govconnect.demo`;
  const unverifiedEmail = `unverified.citizen.${testSuffix}@govconnect.demo`;

  beforeAll(async () => {
    // 1. Run bootstrap service to ensure authorized accounts are ready
    await BootstrapService.bootstrap();

    // 2. Create unverified citizen with ACTIVE status but isEmailVerified = false
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Password@123', salt);
    await prisma.user.create({
      data: {
        email: unverifiedEmail,
        passwordHash,
        role: 'CITIZEN',
        accountStatus: 'ACTIVE',
        isEmailVerified: false,
        citizenProfile: {
          create: {
            fullName: 'Unverified Citizen',
            mobile: '9876543210',
            address: 'Coimbatore, Tamil Nadu',
          },
        },
      },
    });

    // 3. Register pending officer
    const waterDept = await prisma.department.findFirst({ where: { code: 'WATER' } });
    await request(app)
      .post('/api/auth/register/officer')
      .send({
        fullName: 'Pending Officer',
        email: pendingOfficerEmail,
        mobile: '9876543210',
        departmentId: waterDept!.id,
        employeeCode: `OFF-PEND-${testSuffix}`,
        designation: 'Sub-Engineer',
        password: 'Password@123',
        confirmPassword: 'Password@123',
        termsAccepted: true,
      });

    // 4. Register pending admin
    await request(app)
      .post('/api/auth/register/admin')
      .send({
        fullName: 'Pending Admin',
        email: pendingAdminEmail,
        mobile: '9876543210',
        organization: 'State IT Department',
        employeeId: `ADM-PEND-${testSuffix}`,
        password: 'Password@123',
        confirmPassword: 'Password@123',
        termsAccepted: true,
      });
  });

  // TEST 1: Existing ACTIVE ADMIN -> Login -> Token/session created -> Admin Dashboard loads
  it('TEST 1: Existing ACTIVE ADMIN logs in, receives token, and can access Admin Dashboard metrics', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@govconnect.demo', password: 'Password@123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.role).toBe('CENTRAL_ADMIN');
    expect(res.body.data.user.accountStatus).toBe('ACTIVE');
    expect(res.body.data.user.isEmailVerified).toBe(true);

    activeAdminToken = res.body.data.token;

    // Verify Admin Dashboard API loads
    const metricsRes = await request(app)
      .get('/api/admin/metrics')
      .set('Authorization', `Bearer ${activeAdminToken}`);

    expect(metricsRes.status).toBe(200);
    expect(metricsRes.body.success).toBe(true);
    expect(metricsRes.body.data.overview).toBeDefined();
  });

  // TEST 2: Existing ACTIVE OFFICER -> Login -> Token/session created -> Officer Dashboard loads
  it('TEST 2: Existing ACTIVE OFFICER logs in, receives token, and can access Officer Dashboard API', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'water.officer@govconnect.demo', password: 'Password@123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.role).toBe('OFFICER');
    expect(res.body.data.user.accountStatus).toBe('ACTIVE');
    expect(res.body.data.user.isEmailVerified).toBe(true);

    activeOfficerToken = res.body.data.token;

    // Verify Officer Dashboard API loads
    const statsRes = await request(app)
      .get('/api/officer/stats')
      .set('Authorization', `Bearer ${activeOfficerToken}`);

    expect(statsRes.status).toBe(200);
    expect(statsRes.body.success).toBe(true);
    expect(statsRes.body.data.counts).toBeDefined();
  });

  // TEST 3: OFFICER LOGIN -> Signs in immediately without approval barrier
  it('TEST 3: OFFICER logs in immediately without approval barrier', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: pendingOfficerEmail, password: 'Password@123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.role).toBe('OFFICER');
  });

  // TEST 4: ADMIN LOGIN -> Signs in immediately without approval barrier
  it('TEST 4: ADMIN logs in immediately without approval barrier', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: pendingAdminEmail, password: 'Password@123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.role).toBe('CENTRAL_ADMIN');
  });

  // TEST 5: Unverified account -> Login rejected
  it('TEST 5: Unverified account is rejected with "Please verify your email before signing in."', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: unverifiedEmail, password: 'Password@123' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('EMAIL_NOT_VERIFIED');
    expect(res.body.error.message).toBe('Please verify your email before signing in.');
  });

  // TEST 6: Wrong password -> Login rejected
  it('TEST 6: Wrong password returns 401 with "Invalid email or password."', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@govconnect.demo', password: 'WrongPassword999' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    expect(res.body.error.message).toBe('Invalid email or password.');
  });

  // TEST 7: Citizen attempting Admin route -> 403 / unauthorized
  it('TEST 7: Citizen attempting Admin route gets 403 FORBIDDEN', async () => {
    const citizenLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'citizen@govconnect.demo', password: 'Password@123' });

    expect(citizenLoginRes.status).toBe(200);
    citizenToken = citizenLoginRes.body.data.token;

    const res = await request(app)
      .get('/api/admin/metrics')
      .set('Authorization', `Bearer ${citizenToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  // TEST 8: Officer attempting Admin route -> 403 / unauthorized
  it('TEST 8: Officer attempting Admin route gets 403 FORBIDDEN', async () => {
    const res = await request(app)
      .get('/api/admin/metrics')
      .set('Authorization', `Bearer ${activeOfficerToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  // TEST 9: Admin attempting unauthorized citizen/officer-only action -> backend authorization enforced
  it('TEST 9: Department isolation strictly prevents unassigned access and logs unauthorized attempt', async () => {
    // Water officer attempting to access revenue / unauthorized department
    const depts = await prisma.department.findMany();
    const revenueDept = depts.find(d => d.code === 'REVENUE');

    // Create a mock application under REVENUE
    const revApp = await prisma.application.create({
      data: {
        applicationNumber: `REV-TEST-${testSuffix}`,
        serviceId: (await prisma.service.findFirst({ where: { serviceCode: 'PROP-001' } }))!.id,
        citizenId: (await prisma.user.findUnique({ where: { email: 'citizen@govconnect.demo' } }))!.id,
        departmentId: revenueDept!.id,
        status: 'PENDING_APPROVAL',
        rawFormData: JSON.stringify({ propertyId: 'PROP-TEST-001' }),
      },
    });

    // Water officer tries to make decision on Revenue application
    const crossDeptDecisionRes = await request(app)
      .post(`/api/officer/applications/${revApp.id}/decision`)
      .set('Authorization', `Bearer ${activeOfficerToken}`)
      .send({
        decision: 'APPROVE',
        remarks: 'Attempting cross-department unauthorized approval',
      });

    expect(crossDeptDecisionRes.status).toBe(403);
    expect(crossDeptDecisionRes.body.error.code).toBe('DEPARTMENT_MISMATCH_FORBIDDEN');
  });

  // TEST 10: Refresh browser after successful login -> authentication remains valid
  it('TEST 10: Auth token validation via /api/auth/me retains authentication session on refresh', async () => {
    const adminMeRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${activeAdminToken}`);

    expect(adminMeRes.status).toBe(200);
    expect(adminMeRes.body.success).toBe(true);
    expect(adminMeRes.body.data.email).toBe('admin@govconnect.demo');
    expect(adminMeRes.body.data.role).toBe('CENTRAL_ADMIN');
    expect(adminMeRes.body.data.accountStatus).toBe('ACTIVE');

    const officerMeRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${activeOfficerToken}`);

    expect(officerMeRes.status).toBe(200);
    expect(officerMeRes.body.success).toBe(true);
    expect(officerMeRes.body.data.email).toBe('water.officer@govconnect.demo');
    expect(officerMeRes.body.data.role).toBe('OFFICER');
    expect(officerMeRes.body.data.department.code).toBe('WATER');
  });
});

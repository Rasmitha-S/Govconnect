import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/utils/prisma.js';

const app = createApp();

describe('Secure Role-Based Registration & Privilege Escalation Protection', () => {
  let waterDeptId: string;
  let adminToken: string;
  let citizenToken: string;
  let officerToken: string;

  const testSuffix = Date.now();
  const citizenEmail = `citizen.test.${testSuffix}@govconnect.demo`;
  const officerEmail = `officer.test.${testSuffix}@govconnect.demo`;
  const adminApplicantEmail = `admin.applicant.${testSuffix}@govconnect.demo`;
  const rejectOfficerEmail = `officer.reject.${testSuffix}@govconnect.demo`;

  let pendingOfficerId: string;
  let pendingAdminId: string;
  let rejectOfficerId: string;

  beforeAll(async () => {
    // Get Water Department
    const dept = await prisma.department.findFirst({ where: { code: 'WATER' } });
    if (!dept) throw new Error('Water department not found');
    waterDeptId = dept.id;

    // Login default admin
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@govconnect.demo', password: 'Password@123' });
    adminToken = adminRes.body.data.token;

    // Login default citizen
    const citizenRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'citizen@govconnect.demo', password: 'Password@123' });
    citizenToken = citizenRes.body.data.token;

    // Login default officer
    const officerRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'water.officer@govconnect.demo', password: 'Password@123' });
    officerToken = officerRes.body.data.token;
  });

  // 1. Citizen Registration Security
  describe('1. Citizen Registration Authority & Role Hardcoding', () => {
    it('should register citizen with CITIZEN role and ACTIVE status', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Ananya Citizen',
          email: citizenEmail,
          mobile: '9876543210',
          address: '42, Green Avenue, Chennai',
          password: 'Password@123',
          confirmPassword: 'Password@123',
          termsAccepted: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accountStatus).toBe('ACTIVE');

      const user = await prisma.user.findUnique({ where: { email: citizenEmail } });
      expect(user?.role).toBe('CITIZEN');
      expect(user?.accountStatus).toBe('ACTIVE');
    });

    it('should reject or ignore role tampering in citizen registration payload', async () => {
      const tamperEmail = `tamper.${testSuffix}@govconnect.demo`;
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Malicious Actor',
          email: tamperEmail,
          mobile: '9876543210',
          address: '10, Secret Alley',
          password: 'Password@123',
          confirmPassword: 'Password@123',
          termsAccepted: true,
          role: 'CENTRAL_ADMIN', // Attempted privilege escalation
        });

      expect(res.status).toBe(201);
      const user = await prisma.user.findUnique({ where: { email: tamperEmail } });
      // Strict backend enforcement: Role must remain CITIZEN
      expect(user?.role).toBe('CITIZEN');
      expect(user?.accountStatus).toBe('ACTIVE');
    });
  });

  // 2. Officer Registration Security & Approval Flow
  describe('2. Officer Registration & Approval Workflow', () => {
    it('should register officer with OFFICER role and PENDING_APPROVAL status', async () => {
      const res = await request(app)
        .post('/api/auth/register/officer')
        .send({
          fullName: 'Suresh Officer',
          email: officerEmail,
          mobile: '9876543222',
          departmentId: waterDeptId,
          employeeCode: `WTR-TEST-${testSuffix}`,
          designation: 'Assistant Municipal Engineer',
          password: 'Password@123',
          confirmPassword: 'Password@123',
          termsAccepted: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accountStatus).toBe('PENDING_APPROVAL');
      pendingOfficerId = res.body.data.userId;

      const user = await prisma.user.findUnique({
        where: { email: officerEmail },
        include: { officerProfile: true },
      });
      expect(user?.role).toBe('OFFICER');
      expect(user?.accountStatus).toBe('PENDING_APPROVAL');
      expect(user?.officerProfile?.employeeCode).toBe(`WTR-TEST-${testSuffix}`);
    });

    it('should allow officer with valid credentials to log in immediately without approval barrier', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: officerEmail,
          password: 'Password@123',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.role).toBe('OFFICER');
    });
  });

  // 3. Central Administrator Registration Security
  describe('3. Administrator Registration & Access Control', () => {
    it('should register admin with CENTRAL_ADMIN role and PENDING_APPROVAL status', async () => {
      const res = await request(app)
        .post('/api/auth/register/admin')
        .send({
          fullName: 'Dr. Vikram Admin',
          email: adminApplicantEmail,
          mobile: '9876543333',
          organization: 'State e-Governance Agency',
          employeeId: `ADM-TEST-${testSuffix}`,
          password: 'Password@123',
          confirmPassword: 'Password@123',
          termsAccepted: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accountStatus).toBe('PENDING_APPROVAL');
      pendingAdminId = res.body.data.userId;

      const user = await prisma.user.findUnique({ where: { email: adminApplicantEmail } });
      expect(user?.role).toBe('CENTRAL_ADMIN');
      expect(user?.accountStatus).toBe('PENDING_APPROVAL');
    });

    it('should allow administrator with valid credentials to log in immediately without approval barrier', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: adminApplicantEmail,
          password: 'Password@123',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.role).toBe('CENTRAL_ADMIN');
    });
  });

  // 4. Central Admin Scrutiny & Approval Endpoints
  describe('4. Central Admin Review, Approval & Rejection Endpoints', () => {
    it('should allow authorized Central Admin to list registration requests', async () => {
      const res = await request(app)
        .get('/api/admin/registration-requests?status=ALL')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      const found = res.body.data.find((r: any) => r.id === pendingOfficerId);
      expect(found).toBeDefined();
      expect(found.role).toBe('OFFICER');
    });

    it('should allow Central Admin to approve pending Officer registration', async () => {
      const res = await request(app)
        .post(`/api/admin/registration-requests/${pendingOfficerId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.accountStatus).toBe('ACTIVE');

      const user = await prisma.user.findUnique({ where: { id: pendingOfficerId } });
      expect(user?.accountStatus).toBe('ACTIVE');
      expect(user?.approvedAt).toBeDefined();
    });

    it('should allow newly approved Officer to log in and access officer dashboard API', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: officerEmail,
          password: 'Password@123',
        });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.success).toBe(true);
      const newOfficerToken = loginRes.body.data.token;

      // Access officer protected endpoint
      const appsRes = await request(app)
        .get('/api/officer/applications')
        .set('Authorization', `Bearer ${newOfficerToken}`);

      expect(appsRes.status).toBe(200);
      expect(appsRes.body.success).toBe(true);
    });

    it('should allow Central Admin to reject a registration request with reason', async () => {
      // Register another officer to reject
      const regRes = await request(app)
        .post('/api/auth/register/officer')
        .send({
          fullName: 'Reject Officer',
          email: rejectOfficerEmail,
          mobile: '9876543444',
          departmentId: waterDeptId,
          employeeCode: `REJ-${testSuffix}`,
          designation: 'Temporary Staff',
          password: 'Password@123',
          confirmPassword: 'Password@123',
          termsAccepted: true,
        });
      rejectOfficerId = regRes.body.data.userId;

      // Reject
      const rejectRes = await request(app)
        .post(`/api/admin/registration-requests/${rejectOfficerId}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Employee verification failed with state transport directory.' });

      expect(rejectRes.status).toBe(200);
      expect(rejectRes.body.success).toBe(true);
      expect(rejectRes.body.data.user.accountStatus).toBe('REJECTED');

      // Attempt login
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: rejectOfficerEmail, password: 'Password@123' });

      expect(loginRes.status).toBe(403);
      expect(loginRes.body.error.code).toBe('ACCOUNT_REJECTED');
    });
  });

  // 5. Unauthorized Privilege Escalation Resistance
  describe('5. Unauthorized Role Privilege Escalation Resistance', () => {
    it('should prevent Citizen from accessing registration requests (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/admin/registration-requests')
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('should prevent Department Officer from approving registration requests (403 Forbidden)', async () => {
      const res = await request(app)
        .post(`/api/admin/registration-requests/${pendingAdminId}/approve`)
        .set('Authorization', `Bearer ${officerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  // 6. Security Audit Trail
  describe('6. Security Audit Logging for Role Lifecycle', () => {
    it('should have logged audit records for registration, approval, and rejection', async () => {
      const logs = await prisma.auditLog.findMany({
        where: {
          action: {
            in: [
              'CITIZEN_REGISTERED',
              'OFFICER_REGISTRATION_SUBMITTED',
              'ADMIN_REGISTRATION_SUBMITTED',
              'OFFICER_REGISTRATION_APPROVED',
              'OFFICER_REGISTRATION_REJECTED',
            ],
          },
        },
      });

      expect(logs.length).toBeGreaterThanOrEqual(4);
    });
  });
});

import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app.js';
import { prisma } from '../src/utils/prisma.js';
import { config } from '../src/config/env.js';

const app = createApp();

describe('External Government Application Status Tracking Suite', () => {
  let citizenToken = '';
  let otherCitizenToken = '';
  let nativeAppId = '';
  let integratedAppId = '';
  let externalOnlyAppId = '';

  beforeAll(async () => {
    // 1. Authenticate Citizen 1 (citizen@govconnect.demo)
    const citRes = await request(app).post('/api/auth/login').send({
      email: 'citizen@govconnect.demo',
      password: 'Password@123',
    });
    citizenToken = citRes.body.data.token;

    // 2. Register / Create Citizen 2 for cross-user security isolation tests
    const otherEmail = `test_citizen_${Date.now()}@govconnect.demo`;
    const otherUser = await prisma.user.create({
      data: {
        email: otherEmail,
        passwordHash: 'dummy_hash',
        role: 'CITIZEN',
        isEmailVerified: true,
        citizenProfile: {
          create: {
            fullName: 'Vikram Mehta',
            mobile: '9876543299',
            address: '42 MG Road, Coimbatore',
            aadhaarMasked: 'XXXX-XXXX-9999',
          },
        },
      },
    });

    otherCitizenToken = jwt.sign(
      {
        userId: otherUser.id,
        email: otherUser.email,
        role: otherUser.role,
        fullName: 'Vikram Mehta',
      },
      config.jwt.secret,
      { expiresIn: '1d' }
    );

    // Fetch master services & departments
    const citizenUser = await prisma.user.findUnique({ where: { email: 'citizen@govconnect.demo' } });
    const waterService = await prisma.service.findFirst({ where: { serviceCode: 'WTR-001' } });
    const parivahanService = await prisma.service.findFirst({ where: { serviceCode: 'TRN-001' } });
    const healthService = await prisma.service.findFirst({ where: { serviceCode: 'HLT-001' } });
    const dept = await prisma.department.findFirst();

    if (!citizenUser || !dept || !waterService || !parivahanService || !healthService) {
      throw new Error('Database master seed data missing. Run prisma seed before testing.');
    }

    // Create a native application for test
    const nativeApp = await prisma.application.create({
      data: {
        applicationNumber: `APP-TEST-NAT-${Date.now()}`,
        citizenId: citizenUser.id,
        serviceId: waterService.id,
        departmentId: dept.id,
        applicationType: 'NATIVE',
        status: 'UNDER_VERIFICATION',
        rawFormData: JSON.stringify({ applicantName: 'Kavitha Sundaram' }),
      },
    });
    nativeAppId = nativeApp.id;

    // Find seeded or create integrated application
    const existingIntegrated = await prisma.application.findFirst({
      where: {
        citizenId: citizenUser.id,
        applicationType: 'INTEGRATED',
        externalReferenceId: 'PARI-MOCK-12345',
      },
    });

    if (existingIntegrated) {
      integratedAppId = existingIntegrated.id;
    } else {
      const newIntApp = await prisma.application.create({
        data: {
          applicationNumber: `APP-TEST-INT-${Date.now()}`,
          citizenId: citizenUser.id,
          serviceId: parivahanService.id,
          departmentId: dept.id,
          applicationType: 'INTEGRATED',
          externalPlatform: 'PARIVAHAN',
          externalReferenceId: 'PARI-MOCK-12345',
          externalStatus: 'DOCUMENT_VERIFICATION_PENDING',
          status: 'UNDER_VERIFICATION',
          syncStatus: 'SUCCESS',
          lastSyncedAt: new Date(),
          rawFormData: JSON.stringify({ applicantName: 'Kavitha Sundaram', licenseNo: 'DL-0420110012345' }),
        },
      });
      integratedAppId = newIntApp.id;
    }

    // Create an external-only application
    const extApp = await prisma.application.create({
      data: {
        applicationNumber: `APP-TEST-EXT-${Date.now()}`,
        citizenId: citizenUser.id,
        serviceId: healthService.id,
        departmentId: dept.id,
        applicationType: 'EXTERNAL_ONLY',
        externalReferenceId: 'ABHA-9988-1234',
        status: 'SUBMITTED',
        rawFormData: JSON.stringify({ applicantName: 'Kavitha Sundaram' }),
      },
    });
    externalOnlyAppId = extApp.id;
  });

  it('1. GET /api/applications returns tracking metadata (applicationType, externalPlatform, externalReferenceId)', async () => {
    const res = await request(app)
      .get('/api/applications')
      .set('Authorization', `Bearer ${citizenToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);

    const intApp = res.body.data.find((a: any) => a.id === integratedAppId);
    expect(intApp).toBeDefined();
    expect(intApp.applicationType).toBe('INTEGRATED');
    expect(intApp.externalPlatform).toBe('PARIVAHAN');
    expect(intApp.externalReferenceId).toBe('PARI-MOCK-12345');
  });

  it('2. POST /api/applications/:id/sync-status rejects NATIVE applications with 400', async () => {
    const res = await request(app)
      .post(`/api/applications/${nativeAppId}/sync-status`)
      .set('Authorization', `Bearer ${citizenToken}`);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error?.message).toMatch(/not applicable for native govconnect applications/i);
  });

  it('3. POST /api/applications/:id/sync-status rejects EXTERNAL_ONLY applications with 400 and directs to portal', async () => {
    const res = await request(app)
      .post(`/api/applications/${externalOnlyAppId}/sync-status`)
      .set('Authorization', `Bearer ${citizenToken}`);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error?.message).toMatch(/completed directly on the official portal/i);
  });

  it('4. POST /api/applications/:id/sync-status requires authentication (401 unauthenticated)', async () => {
    const res = await request(app)
      .post(`/api/applications/${integratedAppId}/sync-status`);

    expect(res.status).toBe(401);
  });

  it('5. POST /api/applications/:id/sync-status blocks unauthorized citizen access (403 forbidden)', async () => {
    const res = await request(app)
      .post(`/api/applications/${integratedAppId}/sync-status`)
      .set('Authorization', `Bearer ${otherCitizenToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error?.message).toMatch(/unauthorized/i);
  });

  it('6. POST /api/applications/:id/sync-status synchronizes status for INTEGRATED Parivahan application (Stage 1 -> Stage 2)', async () => {
    const res = await request(app)
      .post(`/api/applications/${integratedAppId}/sync-status`)
      .set('Authorization', `Bearer ${citizenToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.externalStatus).toBeDefined();
    expect(res.body.data.syncStatus).toBe('SUCCESS');
    expect(res.body.data.lastSyncedAt).toBeDefined();

    // Verify database record has updated
    const updated = await prisma.application.findUnique({ where: { id: integratedAppId } });
    expect(updated?.syncStatus).toBe('SUCCESS');
    expect(updated?.externalPlatform).toBe('PARIVAHAN');
    expect(updated?.externalReferenceId).toBe('PARI-MOCK-12345');
  });

  it('7. Audit logging records EXTERNAL_STATUS_SYNC event with non-sensitive metadata', async () => {
    const logs = await prisma.auditLog.findMany({
      where: {
        action: 'EXTERNAL_STATUS_SYNC',
        entity: 'Application',
        entityId: integratedAppId,
      },
      orderBy: { createdAt: 'desc' },
      take: 1,
    });

    expect(logs.length).toBeGreaterThan(0);
    const log = logs[0];
    expect(log.action).toBe('EXTERNAL_STATUS_SYNC');
    const details = JSON.parse(log.details || '{}');
    expect(details.platform).toBe('PARIVAHAN');
    expect(details.externalReferenceId).toBe('PARI-MOCK-12345');
    expect(details.password).toBeUndefined();
    expect(details.token).toBeUndefined();
  });

  it('8. Status Mapper correctly maps external statuses to canonical GovConnect statuses', async () => {
    const { mapExternalStatusToGovConnectStatus } = await import('../src/services/status_mapper.js');

    expect(mapExternalStatusToGovConnectStatus('PARIVAHAN', 'DOCUMENT_VERIFICATION_PENDING')).toBe('UNDER_VERIFICATION');
    expect(mapExternalStatusToGovConnectStatus('PARIVAHAN', 'UNDER_SCRUTINY')).toBe('UNDER_VERIFICATION');
    expect(mapExternalStatusToGovConnectStatus('PARIVAHAN', 'APPROVED')).toBe('APPROVED');
    expect(mapExternalStatusToGovConnectStatus('PARIVAHAN', 'COMPLETED')).toBe('COMPLETED');
    expect(mapExternalStatusToGovConnectStatus('PARIVAHAN', 'REJECTED')).toBe('REJECTED');
    expect(mapExternalStatusToGovConnectStatus('PARIVAHAN', 'UNKNOWN_CODE')).toBe('UNDER_VERIFICATION');
  });

  it('9. AI Assistant returns real-time status details when authenticated citizen inquires about application status', async () => {
    const res = await request(app)
      .post('/api/ai/assistant')
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({
        message: 'What is the current status of my application?',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.reply).toBeDefined();
    // Message should contain reference to the citizen's application or Parivahan reference ID
    expect(res.body.data.reply).toMatch(/application|parivahan|pari-mock-12345|water/i);
  });

  it('10. AI Assistant handles external-only service inquiries by directing to official portal without guessing status', async () => {
    const res = await request(app)
      .post('/api/ai/assistant')
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({
        message: 'How can I check status of my Ayushman Bharat ABHA health card application?',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.reply).toMatch(/ayushman|portal|official|abdm|completed through the official/i);
  });
});

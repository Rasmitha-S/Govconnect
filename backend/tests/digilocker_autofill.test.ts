import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app.js';
import { prisma } from '../src/utils/prisma.js';
import { config } from '../src/config/env.js';

const app = createApp();

describe('DigiLocker Consent & Application Auto-Fill Integration Suite', () => {
  let citizenToken = '';
  let citizenId = '';
  let otherCitizenToken = '';
  let otherCitizenId = '';
  let sessionId = '';
  let stateToken = '';

  beforeAll(async () => {
    // 1. Authenticate primary test citizen
    const citRes = await request(app).post('/api/auth/login').send({
      email: 'citizen@govconnect.demo',
      password: 'Password@123',
    });
    citizenToken = citRes.body.data.token;
    citizenId = citRes.body.data.user.id;

    // 2. Create second citizen for cross-user isolation tests
    const otherEmail = `digilocker_test_${Date.now()}@govconnect.demo`;
    const otherUser = await prisma.user.create({
      data: {
        email: otherEmail,
        passwordHash: 'dummy_hash',
        role: 'CITIZEN',
        isEmailVerified: true,
        citizenProfile: {
          create: {
            fullName: 'Ananya Sharma',
            mobile: '9876543211',
            address: '12 Gandhi Nagar, Bengaluru',
            aadhaarMasked: 'XXXX-XXXX-1111',
          },
        },
      },
    });

    otherCitizenId = otherUser.id;
    otherCitizenToken = jwt.sign(
      {
        userId: otherUser.id,
        email: otherUser.email,
        role: otherUser.role,
        fullName: 'Ananya Sharma',
      },
      config.jwt.secret,
      { expiresIn: '1d' }
    );
  });

  // 1. Integration Mode Status
  it('1. should return DigiLocker integration mode status', async () => {
    const res = await request(app)
      .get('/api/integrations/digilocker/status')
      .set('Authorization', `Bearer ${citizenToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('mode');
    expect(['REAL_AUTHORIZED', 'REPRESENTATIVE', 'NOT_CONFIGURED']).toContain(res.body.data.mode);
    expect(res.body.data).toHaveProperty('supportedServices');
    expect(res.body.data.supportedServices).toContain('WTR-001');
  });

  // 2. Consent Initiation
  it('2. should initiate DigiLocker consent and return state token & requested scope', async () => {
    const res = await request(app)
      .post('/api/integrations/digilocker/consent/initiate')
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({
        serviceCode: 'WTR-001',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('sessionId');
    expect(res.body.data).toHaveProperty('stateToken');
    expect(res.body.data).toHaveProperty('requestedData');
    expect(Array.isArray(res.body.data.requestedData)).toBe(true);
    expect(res.body.data.requestedData.length).toBeGreaterThan(0);

    sessionId = res.body.data.sessionId;
    stateToken = res.body.data.stateToken;

    // Verify session in database
    const dbSession = await prisma.digiLockerSession.findUnique({
      where: { id: sessionId },
    });
    expect(dbSession).toBeDefined();
    expect(dbSession?.status).toBe('INITIATED');
    expect(dbSession?.citizenId).toBe(citizenId);
  });

  // 3. Audit Log on Consent Initiation
  it('3. should have logged DIGILOCKER_CONSENT_INITIATED audit event', async () => {
    const audit = await prisma.auditLog.findFirst({
      where: {
        actorId: citizenId,
        action: 'DIGILOCKER_CONSENT_INITIATED',
      },
      orderBy: { createdAt: 'desc' },
    });

    expect(audit).toBeDefined();
    expect(audit?.details).toBeDefined();
    expect(audit?.details).toContain('WTR-001');
  });

  // 4. Cross-Citizen Security Isolation
  it('4. should prevent Citizen B from accessing or completing Citizen A session', async () => {
    expect(sessionId).toBeTruthy();
    const res = await request(app)
      .post('/api/integrations/digilocker/complete-representative')
      .set('Authorization', `Bearer ${otherCitizenToken}`)
      .send({ sessionId });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  // 5. Representative Mode Completion & Standardization
  it('5. should complete representative retrieval, standardize data, and create granted consent', async () => {
    expect(sessionId).toBeTruthy();
    const res = await request(app)
      .post('/api/integrations/digilocker/complete-representative')
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({ sessionId });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('AUTHORIZED');
    expect(res.body.data).toHaveProperty('standardizedData');

    const profile = res.body.data.standardizedData;
    expect(profile).toHaveProperty('fullName');
    expect(profile).toHaveProperty('address');
    expect(profile.address).toHaveProperty('doorNumber');
    expect(profile.address).toHaveProperty('wardNumber');
    expect(profile.address).toHaveProperty('pincode');
    expect(profile).toHaveProperty('documents');
    expect(profile.documents.length).toBeGreaterThan(0);

    // Verify DigiLockerSession updated in DB
    const dbSession = await prisma.digiLockerSession.findUnique({
      where: { id: sessionId },
    });
    expect(dbSession?.status).toBe('AUTHORIZED');
    expect(dbSession?.standardizedData).toBeDefined();

    // Verify Consent record created in DB
    const consent = await prisma.consent.findFirst({
      where: {
        citizenId,
        dataSource: 'DIGILOCKER',
        dataProviderDeptCode: 'DIGILOCKER',
      },
      orderBy: { createdAt: 'desc' },
    });
    expect(consent).toBeDefined();
    expect(consent?.status).toBe('GRANTED');
  });

  // 6. Audit Log on Consent Granted
  it('6. should have logged DIGILOCKER_CONSENT_GRANTED audit event', async () => {
    const audit = await prisma.auditLog.findFirst({
      where: {
        actorId: citizenId,
        action: 'DIGILOCKER_CONSENT_GRANTED',
      },
      orderBy: { createdAt: 'desc' },
    });

    expect(audit).toBeDefined();
    expect(audit?.details).toBeDefined();
    expect(audit?.details).toContain('WTR-001');
  });

  // 7. Re-fetching session data
  it('7. should allow citizen to retrieve completed standardized data by sessionId', async () => {
    const res = await request(app)
      .get(`/api/integrations/digilocker/session/${sessionId}`)
      .set('Authorization', `Bearer ${citizenToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('AUTHORIZED');
    expect(res.body.data.standardizedData).toHaveProperty('fullName');
  });

  // 8. Consent Denial Handling
  it('8. should record consent denial and write DIGILOCKER_CONSENT_DENIED audit log', async () => {
    // Initiate fresh session
    const initRes = await request(app)
      .post('/api/integrations/digilocker/consent/initiate')
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({
        serviceCode: 'WTR-001',
      });

    const deniedSessionId = initRes.body.data.sessionId;

    // Deny consent
    const denyRes = await request(app)
      .post('/api/integrations/digilocker/consent/deny')
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({
        sessionId: deniedSessionId,
      });

    expect(denyRes.status).toBe(200);
    expect(denyRes.body.success).toBe(true);

    // Verify session updated to DENIED
    const dbSession = await prisma.digiLockerSession.findUnique({
      where: { id: deniedSessionId },
    });
    expect(dbSession?.status).toBe('DENIED');

    // Verify audit log
    const audit = await prisma.auditLog.findFirst({
      where: {
        actorId: citizenId,
        action: 'DIGILOCKER_CONSENT_DENIED',
      },
      orderBy: { createdAt: 'desc' },
    });
    expect(audit).toBeDefined();
    expect(audit?.details).toContain('WTR-001');
  });

  // 9. Invalid / Expired Session Validation
  it('9. should return 400 for invalid session id format or 404 for missing', async () => {
    const res = await request(app)
      .post('/api/integrations/digilocker/complete-representative')
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({ sessionId: '00000000-0000-0000-0000-000000000000' });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  // 10. OAuth Callback State Validation & Redirect
  it('10. should validate state token in OAuth callback and redirect', async () => {
    // Valid state initiated
    const initRes = await request(app)
      .post('/api/integrations/digilocker/consent/initiate')
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({ serviceCode: 'WTR-001' });

    const validState = initRes.body.data.stateToken;

    // Callback with invalid state
    const failRes = await request(app)
      .get('/api/integrations/digilocker/callback')
      .query({ code: 'test_code_123', state: 'tampered_or_invalid_state' });

    // When state is invalid, it redirects with digilocker_error
    expect(failRes.status).toBe(302);
    expect(failRes.headers.location).toContain('digilocker_error');

    // Callback with valid state
    const passRes = await request(app)
      .get('/api/integrations/digilocker/callback')
      .query({ code: 'test_code_123', state: validState });

    expect(passRes.status).toBe(302);
    expect(passRes.headers.location).toContain('digilocker_session');
  });

  // 11. Zero Credential Exposure
  it('11. should never expose passwords, PINs or raw access tokens in responses', async () => {
    const res = await request(app)
      .get(`/api/integrations/digilocker/session/${sessionId}`)
      .set('Authorization', `Bearer ${citizenToken}`);

    const bodyString = JSON.stringify(res.body);
    expect(bodyString).not.toContain('password');
    expect(bodyString).not.toContain('mpin');
    expect(bodyString).not.toContain('accessToken');
    expect(bodyString).not.toContain('client_secret');
  });

  // 12. Revoke DigiLocker Access
  it('12. should revoke citizen DigiLocker authorization and record audit log', async () => {
    const res = await request(app)
      .post('/api/integrations/digilocker/revoke')
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({ serviceCode: 'WTR-001' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Check revoked audit log
    const audit = await prisma.auditLog.findFirst({
      where: {
        actorId: citizenId,
        action: 'DIGILOCKER_ACCESS_REVOKED',
      },
      orderBy: { createdAt: 'desc' },
    });
    expect(audit).toBeDefined();

    // Verify consents for this service are REVOKED
    const consent = await prisma.consent.findFirst({
      where: {
        citizenId,
        dataSource: 'DIGILOCKER',
        dataProviderDeptCode: 'DIGILOCKER',
      },
      orderBy: { createdAt: 'desc' },
    });
    expect(consent?.status).toBe('REVOKED');
  });

  // 13. Manual Fallback Application Submission
  it('13. should allow citizen to submit Water application manually without DigiLocker', async () => {
    const manualAppRes = await request(app)
      .post('/api/applications/water')
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({
        fullName: 'Rajesh Kumar Manual',
        mobile: '9876543210',
        email: 'citizen@govconnect.demo',
        aadhaarToken: 'XXXX-XXXX-4819',
        propertyId: 'PROP-MANUAL-999',
        propertyType: 'RESIDENTIAL',
        doorNumber: '10-A',
        streetName: 'Gandhi Road',
        wardNumber: 'Ward-12',
        zone: 'ZONE_A',
        city: 'Bengaluru',
        pincode: '560001',
        pipeSize: '0.5_INCH',
        connectionType: 'DOMESTIC',
        mockDocumentUploaded: true,
        documentFileName: 'manual_deed.pdf',
        consentGranted: true,
      });

    expect(manualAppRes.status).toBe(201);
    expect(manualAppRes.body.success).toBe(true);
    expect(manualAppRes.body.data.applicationNumber).toMatch(/^APP-/);
  });

  // 14. Document Metadata and Digital Verification Flag
  it('14. should produce valid document metadata with verified status for DigiLocker retrieved documents', async () => {
    const initRes = await request(app)
      .post('/api/integrations/digilocker/consent/initiate')
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({ serviceCode: 'WTR-001' });

    const newSessionId = initRes.body.data.sessionId;

    const compRes = await request(app)
      .post('/api/integrations/digilocker/complete-representative')
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({ sessionId: newSessionId });

    const docs = compRes.body.data.standardizedData.documents;
    expect(docs).toBeDefined();
    expect(docs.length).toBeGreaterThan(0);
    expect(docs[0]).toHaveProperty('docType', 'PROPERTY_TAX_RECEIPT');
    expect(docs[0]).toHaveProperty('verified', true);
    expect(docs[0]).toHaveProperty('issuer');
  });
});

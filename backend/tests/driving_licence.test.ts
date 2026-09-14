import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app.js';
import { prisma } from '../src/utils/prisma.js';
import { config } from '../src/config/env.js';

const app = createApp();

describe('Driving Licence Renewal + Address Change Integration Suite (TRN-001)', () => {
  let citizenToken = '';
  let citizenId = '';
  let otherCitizenToken = '';
  let otherCitizenId = '';
  let digiSessionId = '';
  let applicationId = '';
  let applicationNumber = '';

  beforeAll(async () => {
    // 1. Authenticate primary test citizen
    const citRes = await request(app).post('/api/auth/login').send({
      email: 'citizen@govconnect.demo',
      password: 'Password@123',
    });
    citizenToken = citRes.body.data.token;
    citizenId = citRes.body.data.user.id;

    // 2. Create second citizen for cross-user isolation tests
    const otherEmail = `dl_test_${Date.now()}@govconnect.demo`;
    const otherUser = await prisma.user.create({
      data: {
        email: otherEmail,
        passwordHash: 'dummy_hash',
        role: 'CITIZEN',
        isEmailVerified: true,
        citizenProfile: {
          create: {
            fullName: 'Ramesh Patel',
            mobile: '9876543212',
            address: '56 Nehru Street, Coimbatore',
            aadhaarMasked: 'XXXX-XXXX-3333',
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
        fullName: 'Ramesh Patel',
      },
      config.jwt.secret,
      { expiresIn: '1d' }
    );
  });

  // 1. Service Directory & Support Check
  it('1. should verify TRN-001 service is configured and supports DigiLocker autofill', async () => {
    const service = await prisma.service.findUnique({
      where: { serviceCode: 'TRN-001' },
      include: { department: true },
    });

    expect(service).toBeDefined();
    expect(service?.serviceCode).toBe('TRN-001');
    expect(service?.govconnectSupported).toBe(true);
    expect(service?.supportsDigiLockerAutofill).toBe(true);
    expect(service?.department.code).toBe('TRANSPORT');
  });

  // 2. DigiLocker Consent Initiation for TRN-001
  it('2. should initiate DigiLocker consent session for TRN-001 with DL scopes', async () => {
    const res = await request(app)
      .post('/api/integrations/digilocker/consent/initiate')
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({ serviceCode: 'TRN-001' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('sessionId');
    expect(res.body.data).toHaveProperty('stateToken');
    expect(res.body.data.requestedData).toContain('Driving Licence Record & Verified Address Proof');

    digiSessionId = res.body.data.sessionId;
  });

  // 3. Complete Representative DigiLocker Prefill for TRN-001
  it('3. should complete representative DigiLocker retrieval with standardized DL & Address data', async () => {
    const res = await request(app)
      .post('/api/integrations/digilocker/complete-representative')
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({ sessionId: digiSessionId });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('AUTHORIZED');

    const profile = res.body.data.standardizedData;
    expect(profile).toHaveProperty('fullName');
    expect(profile).toHaveProperty('dlNumber');
    expect(profile).toHaveProperty('address');
    expect(profile.address).toHaveProperty('doorNumber');
    expect(profile.address).toHaveProperty('pincode');
    expect(profile.documents.length).toBeGreaterThan(0);
  });

  // 4. Submit Driving Licence Renewal + Address Change Application
  it('4. should submit Driving Licence application and generate GOV-DL-2026 reference', async () => {
    const res = await request(app)
      .post('/api/applications/driving-licence')
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({
        serviceCode: 'TRN-001',
        fullName: 'Kavitha Sundaram',
        dob: '1992-07-14',
        mobile: '9876543210',
        email: 'citizen@govconnect.demo',
        aadhaarToken: 'XXXX-XXXX-4819',
        dlNumber: 'TN38 20180004819',
        existingExpiryDate: '2028-08-23',
        issuingState: 'Tamil Nadu',
        licensingAuthority: 'TN-38 (Coimbatore South RTO)',
        existingAddress: '14 Old Housing Board Colony, Ramanathapuram, Coimbatore - 641045',
        houseBuilding: '18/B',
        street: 'Avinashi Road, Anna Nagar Extension',
        city: 'Coimbatore',
        district: 'Coimbatore',
        state: 'Tamil Nadu',
        pincode: '641004',
        renewLicence: true,
        changeAddress: true,
        existingDlDocFileName: 'Driving_Licence_Original.pdf',
        addressProofDocFileName: 'DigiLocker_Verified_Address_Proof.pdf',
        isFromDigiLocker: true,
        consentGranted: true,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.applicationNumber).toMatch(/^GOV-DL-2026-/);
    expect(res.body.data.externalPlatform).toBe('PARIVAHAN');
    expect(res.body.data.externalReferenceId).toMatch(/^PARI-/);

    applicationId = res.body.data.id;
    applicationNumber = res.body.data.applicationNumber;
  });

  // 5. Verification of Consent Record
  it('5. should have created statutory Consent record for Transport & Parivahan', async () => {
    const consent = await prisma.consent.findFirst({
      where: {
        applicationId,
        citizenId,
        requestingDeptCode: 'TRANSPORT',
        dataProviderDeptCode: 'PARIVAHAN',
      },
    });

    expect(consent).toBeDefined();
    expect(consent?.status).toBe('GRANTED');
  });

  // 6. Verification of Document Records
  it('6. should have created Document records for Driving Licence and Address Proof', async () => {
    const docs = await prisma.document.findMany({
      where: { applicationId },
    });

    expect(docs.length).toBeGreaterThanOrEqual(2);
    const types = docs.map((d) => d.documentType);
    expect(types).toContain('DRIVING_LICENCE');
    expect(types).toContain('ADDRESS_PROOF');
  });

  // 7. Multi-Stage Workflow Orchestration
  it('7. should have initialized and executed 5-stage Parivahan Sarathi workflow', async () => {
    const workflow = await prisma.workflow.findUnique({
      where: { applicationId },
      include: { steps: { orderBy: { stageNumber: 'asc' } } },
    });

    expect(workflow).toBeDefined();
    expect(workflow?.totalStages).toBe(5);
    expect(workflow?.steps.length).toBe(5);

    // Stage 1: Citizen Submission
    expect(workflow?.steps[0].status).toBe('COMPLETED');
    expect(workflow?.steps[0].connectorName).toBe('GovConnect Portal');

    // Stage 2: UIDAI Identity
    expect(workflow?.steps[1].status).toBe('COMPLETED');

    // Stage 3: Parivahan Sarathi Scrutiny
    expect(workflow?.steps[2].status).toBe('COMPLETED');
    expect(workflow?.steps[2].departmentCode).toBe('PARIVAHAN');

    // Stage 4: DigiLocker Address Scrutiny
    expect(workflow?.steps[3].status).toBe('COMPLETED');

    // Application overall status should be UNDER_VERIFICATION
    const app = await prisma.application.findUnique({ where: { id: applicationId } });
    expect(app?.status).toBe('UNDER_VERIFICATION');
    expect(app?.standardizedData).toBeDefined();
  });

  // 8. Application Detail API
  it('8. should return full parsed application detail with timeline', async () => {
    const res = await request(app)
      .get(`/api/applications/${applicationId}`)
      .set('Authorization', `Bearer ${citizenToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.applicationNumber).toBe(applicationNumber);
    expect(res.body.data.service.serviceCode).toBe('TRN-001');
    expect(res.body.data.department.code).toBe('TRANSPORT');
    expect(res.body.data.standardizedData.drivingLicence.dlNumber).toBe('TN38 20180004819');
    expect(res.body.data.standardizedData.addressChange.newAddress.city).toBe('Coimbatore');
  });

  // 9. Citizen Dashboard Listing
  it('9. should list the new Driving Licence application on Citizen Dashboard', async () => {
    const res = await request(app)
      .get('/api/applications')
      .set('Authorization', `Bearer ${citizenToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const found = res.body.data.find((a: any) => a.id === applicationId);
    expect(found).toBeDefined();
    expect(found.service.serviceCode).toBe('TRN-001');
  });

  // 10. Audit Logging
  it('10. should have recorded APPLICATION_SUBMITTED and CROSS_DEPT_VERIFICATION_SUCCESS audit logs', async () => {
    const submitAudit = await prisma.auditLog.findFirst({
      where: {
        actorId: citizenId,
        action: 'APPLICATION_SUBMITTED',
        entityId: applicationId,
      },
    });
    expect(submitAudit).toBeDefined();

    const crossDeptAudit = await prisma.auditLog.findFirst({
      where: {
        actorId: citizenId,
        action: 'CROSS_DEPT_VERIFICATION_SUCCESS',
        entityId: applicationId,
      },
    });
    expect(crossDeptAudit).toBeDefined();
  });

  // 11. Cross-Citizen Security Isolation
  it('11. should prevent unauthorized citizen from viewing another citizen application', async () => {
    const res = await request(app)
      .get(`/api/applications/${applicationId}`)
      .set('Authorization', `Bearer ${otherCitizenToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});

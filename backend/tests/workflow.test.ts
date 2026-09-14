import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

const app = createApp();

describe('End-to-End Water Connection Workflow', () => {
  let citizenToken = '';
  let officerToken = '';
  let applicationId = '';

  beforeAll(async () => {
    // Login Citizen
    const citRes = await request(app).post('/api/auth/login').send({
      email: 'citizen@govconnect.demo',
      password: 'Password@123',
    });
    citizenToken = citRes.body.data.token;

    // Login Water Officer
    const offRes = await request(app).post('/api/auth/login').send({
      email: 'water.officer@govconnect.demo',
      password: 'Password@123',
    });
    officerToken = offRes.body.data.token;
  });

  it('1. Citizen submits New Water Connection with Consent & Property info', async () => {
    const res = await request(app)
      .post('/api/applications/water')
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({
        serviceCode: 'WTR-001',
        fullName: 'Kavitha Sundaram',
        mobile: '9876543210',
        email: 'citizen@govconnect.demo',
        aadhaarToken: 'XXXX-XXXX-4819',
        propertyId: 'TN-COI-2026-88192',
        propertyType: 'RESIDENTIAL',
        doorNumber: 'Plot 42, 18/B',
        streetName: 'Avinashi Road',
        wardNumber: 'Ward 22',
        zone: 'East Zone',
        city: 'Coimbatore',
        pincode: '641004',
        connectionType: 'DOMESTIC',
        estimatedDailyLiters: 450,
        consentGranted: true,
        mockDocumentUploaded: true,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.applicationNumber).toMatch(/^APP-2026-/);
    applicationId = res.body.data.id;
  });

  it('2. Citizen tracks application - automated verification steps should be completed and state in PENDING_APPROVAL', async () => {
    const res = await request(app)
      .get(`/api/applications/${applicationId}`)
      .set('Authorization', `Bearer ${citizenToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('PENDING_APPROVAL');
    expect(res.body.data.workflow.steps.length).toBe(6);
  });

  it('3. Water Officer reviews and approves the application', async () => {
    const res = await request(app)
      .post(`/api/officer/applications/${applicationId}/decision`)
      .set('Authorization', `Bearer ${officerToken}`)
      .send({
        decision: 'APPROVE',
        remarks: 'Revenue records and DigiLocker property tax clearance verified. Pipeline pressure verified.',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.application.status).toBe('APPROVED');
  });

  it('4. Citizen completes simulated fee payment (₹250) -> workflow reaches COMPLETED', async () => {
    const res = await request(app)
      .post('/api/payments/simulate')
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({
        applicationId: applicationId,
        amount: 250,
        paymentMethod: 'SIMULATED_UPI',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.payment.status).toBe('SUCCESS');

    // Verify application status is now COMPLETED
    const checkRes = await request(app)
      .get(`/api/applications/${applicationId}`)
      .set('Authorization', `Bearer ${citizenToken}`);

    expect(checkRes.body.data.status).toBe('COMPLETED');
  });
});

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/utils/prisma.js';

const app = createApp();

describe('GovConnect Auth Endpoints', () => {
  const testEmail = `test.citizen.${Date.now()}@govconnect.demo`;

  it('POST /api/auth/register - should successfully register a citizen', async () => {
    const res = await request(app).post('/api/auth/register').send({
      fullName: 'Ananya Sharma',
      email: testEmail,
      mobile: '9876543210',
      password: 'Password@123',
      confirmPassword: 'Password@123',
      address: '12 Gandhi Nagar, Coimbatore',
      termsAccepted: true,
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(testEmail);
  });

  it('POST /api/auth/login - should authenticate existing seeded citizen', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'citizen@govconnect.demo',
      password: 'Password@123',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.role).toBe('CITIZEN');
  });

  it('POST /api/auth/login - should authenticate seeded water officer with department info', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'water.officer@govconnect.demo',
      password: 'Password@123',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe('OFFICER');
    expect(res.body.data.user.department.code).toBe('WATER');
  });

  it('POST /api/auth/login - should fail with wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'citizen@govconnect.demo',
      password: 'WrongPassword123',
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

const app = createApp();

describe('AI Government Service Assistant & NLP Engine', () => {
  it('POST /api/ai/service-detect - should identify New Water Connection for "I need a new water connection"', async () => {
    const res = await request(app).post('/api/ai/service-detect').send({
      query: 'I need a new water connection for my new home',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.detectedService.serviceCode).toBe('WTR-001');
    expect(res.body.data.isSupportedOnGovConnect).toBe(true);
    expect(res.body.data.suggestedAction).toBe('START_APPLICATION');
  });

  it('POST /api/ai/service-detect - should identify Scholarship scheme for student college query', async () => {
    const res = await request(app).post('/api/ai/service-detect').send({
      query: 'how do I apply for college scholarship scheme?',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.detectedService.serviceCode).toBe('SCH-001');
  });

  it('POST /api/ai/grievance-classify - should classify water billing issue to WATER department', async () => {
    const res = await request(app).post('/api/ai/grievance-classify').send({
      text: 'My water bill this month is incorrect and meter reading is wrong',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.departmentCode).toBe('WATER');
    expect(res.body.data.category).toContain('Billing');
  });
});

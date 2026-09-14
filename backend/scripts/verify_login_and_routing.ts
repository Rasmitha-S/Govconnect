import { createApp } from '../src/app.js';
import request from 'supertest';
import { prisma } from '../src/utils/prisma.js';

async function runVerification() {
  console.log('===============================================================');
  console.log('🧪 VERIFYING ADMIN & OFFICER IMMEDIATE LOGIN AND ROUTING');
  console.log('===============================================================\n');

  const app = createApp();
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, desc: string, extra?: any) {
    if (condition) {
      console.log(`✅ [PASS] ${desc}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${desc}`, extra || '');
      failed++;
    }
  }

  // --- TEST 1: Officer Login ---
  console.log('--- TEST 1: Officer valid credentials login without approval message ---');
  const officerLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'water.officer@govconnect.demo', password: 'Password@123' });

  assert(officerLogin.status === 200, `Officer login status is 200 (Got: ${officerLogin.status})`);
  assert(officerLogin.body.success === true, 'Officer login success is true');
  assert(officerLogin.body.data?.token !== undefined, 'Officer JWT token is generated');
  assert(officerLogin.body.data?.user?.role === 'OFFICER', `Officer role is 'OFFICER' (Got: ${officerLogin.body.data?.user?.role})`);
  assert(officerLogin.body.error === undefined, 'No approval error message returned');
  const officerToken = officerLogin.body.data?.token;

  // --- TEST 2: Admin Login ---
  console.log('\n--- TEST 2: Admin valid credentials login without approval message ---');
  const adminLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@govconnect.demo', password: 'Password@123' });

  assert(adminLogin.status === 200, `Admin login status is 200 (Got: ${adminLogin.status})`);
  assert(adminLogin.body.success === true, 'Admin login success is true');
  assert(adminLogin.body.data?.token !== undefined, 'Admin JWT token is generated');
  assert(adminLogin.body.data?.user?.role === 'CENTRAL_ADMIN', `Admin role is 'CENTRAL_ADMIN' (Got: ${adminLogin.body.data?.user?.role})`);
  assert(adminLogin.body.error === undefined, 'No approval error message returned');
  const adminToken = adminLogin.body.data?.token;

  // --- TEST 3: Citizen Login ---
  console.log('\n--- TEST 3: Citizen valid credentials login ---');
  const citizenLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'citizen@govconnect.demo', password: 'Password@123' });

  assert(citizenLogin.status === 200, `Citizen login status is 200 (Got: ${citizenLogin.status})`);
  assert(citizenLogin.body.success === true, 'Citizen login success is true');
  assert(citizenLogin.body.data?.user?.role === 'CITIZEN', `Citizen role is 'CITIZEN' (Got: ${citizenLogin.body.data?.user?.role})`);
  const citizenToken = citizenLogin.body.data?.token;

  // --- TEST 4: Officer cannot access Admin-only APIs ---
  console.log('\n--- TEST 4: Officer cannot access Admin-only APIs (403 Forbidden) ---');
  const officerToAdminApi = await request(app)
    .get('/api/admin/metrics')
    .set('Authorization', `Bearer ${officerToken}`);

  assert(officerToAdminApi.status === 403, `Officer blocked from /api/admin/metrics with 403 (Got: ${officerToAdminApi.status})`);
  assert(officerToAdminApi.body.error?.code === 'FORBIDDEN', `Error code is FORBIDDEN (Got: ${officerToAdminApi.body.error?.code})`);

  // --- TEST 5: Citizen cannot access Officer or Admin APIs ---
  console.log('\n--- TEST 5: Citizen cannot access Officer or Admin APIs (403 Forbidden) ---');
  const citizenToOfficerApi = await request(app)
    .get('/api/officer/applications')
    .set('Authorization', `Bearer ${citizenToken}`);

  assert(citizenToOfficerApi.status === 403, `Citizen blocked from /api/officer/applications with 403 (Got: ${citizenToOfficerApi.status})`);
  assert(citizenToOfficerApi.body.error?.code === 'FORBIDDEN', `Error code is FORBIDDEN (Got: ${citizenToOfficerApi.body.error?.code})`);

  const citizenToAdminApi = await request(app)
    .get('/api/admin/metrics')
    .set('Authorization', `Bearer ${citizenToken}`);

  assert(citizenToAdminApi.status === 403, `Citizen blocked from /api/admin/metrics with 403 (Got: ${citizenToAdminApi.status})`);

  // --- TEST 6: Refresh Officer Dashboard (/api/auth/me session persistence) ---
  console.log('\n--- TEST 6: Refresh Officer Dashboard (Session persists via /api/auth/me) ---');
  const officerMe = await request(app)
    .get('/api/auth/me')
    .set('Authorization', `Bearer ${officerToken}`);

  assert(officerMe.status === 200, `Officer session verified on refresh (Got: ${officerMe.status})`);
  assert(officerMe.body.data?.role === 'OFFICER', `Officer role persistent (Got: ${officerMe.body.data?.role})`);

  // Officer access to officer dashboard API
  const officerDashboardData = await request(app)
    .get('/api/officer/stats')
    .set('Authorization', `Bearer ${officerToken}`);
  assert(officerDashboardData.status === 200, 'Officer dashboard stats accessible');

  // --- TEST 7: Refresh Admin Dashboard (/api/auth/me session persistence) ---
  console.log('\n--- TEST 7: Refresh Admin Dashboard (Session persists via /api/auth/me) ---');
  const adminMe = await request(app)
    .get('/api/auth/me')
    .set('Authorization', `Bearer ${adminToken}`);

  assert(adminMe.status === 200, `Admin session verified on refresh (Got: ${adminMe.status})`);
  assert(adminMe.body.data?.role === 'CENTRAL_ADMIN', `Admin role persistent (Got: ${adminMe.body.data?.role})`);

  // Admin access to admin dashboard API
  const adminDashboardData = await request(app)
    .get('/api/admin/metrics')
    .set('Authorization', `Bearer ${adminToken}`);
  assert(adminDashboardData.status === 200, 'Admin dashboard metrics accessible');

  console.log('\n===============================================================');
  console.log(`📊 VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================');

  if (failed > 0) process.exit(1);
}

runVerification()
  .catch((err) => {
    console.error('Fatal Verification Error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

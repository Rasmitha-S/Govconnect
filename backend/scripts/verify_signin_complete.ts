import { createApp } from '../src/app.js';
import request from 'supertest';
import { prisma } from '../src/utils/prisma.js';

async function runCompleteSignInVerification() {
  console.log('===============================================================');
  console.log('🚀 COMPLETE SIGN-IN RESTORATION & RBAC AUDIT (TESTS 1 - 8)');
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

  // --- TEST 1: Existing Citizen Login ---
  console.log('--- TEST 1: Existing Citizen Sign In -> Citizen Dashboard ---');
  const citizenRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'citizen@govconnect.demo', password: 'Password@123' });

  assert(citizenRes.status === 200, `Citizen login status is 200 (Got: ${citizenRes.status})`);
  assert(citizenRes.body.success === true, 'Citizen login success is true');
  assert(citizenRes.body.data?.token !== undefined, 'Citizen JWT token generated');
  assert(citizenRes.body.data?.user?.role === 'CITIZEN', `User role is CITIZEN (Got: ${citizenRes.body.data?.user?.role})`);
  const citizenToken = citizenRes.body.data?.token;

  // Citizen accesses citizen application list
  const citizenApps = await request(app)
    .get('/api/applications')
    .set('Authorization', `Bearer ${citizenToken}`);
  assert(citizenApps.status === 200, 'Citizen Dashboard applications endpoint accessible');

  // --- TEST 2: Existing Officer Login ---
  console.log('\n--- TEST 2: Existing Officer Sign In -> Officer Dashboard ---');
  const officerRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'water.officer@govconnect.demo', password: 'Password@123' });

  assert(officerRes.status === 200, `Officer login status is 200 (Got: ${officerRes.status})`);
  assert(officerRes.body.success === true, 'Officer login success is true');
  assert(officerRes.body.data?.token !== undefined, 'Officer JWT token generated');
  assert(officerRes.body.data?.user?.role === 'OFFICER', `User role is OFFICER (Got: ${officerRes.body.data?.user?.role})`);
  const officerToken = officerRes.body.data?.token;

  // Officer accesses officer stats
  const officerStats = await request(app)
    .get('/api/officer/stats')
    .set('Authorization', `Bearer ${officerToken}`);
  assert(officerStats.status === 200, 'Officer Dashboard stats endpoint accessible');

  // --- TEST 3: Existing Admin Login ---
  console.log('\n--- TEST 3: Existing Admin Sign In -> Admin Dashboard ---');
  const adminRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@govconnect.demo', password: 'Password@123' });

  assert(adminRes.status === 200, `Admin login status is 200 (Got: ${adminRes.status})`);
  assert(adminRes.body.success === true, 'Admin login success is true');
  assert(adminRes.body.data?.token !== undefined, 'Admin JWT token generated');
  assert(adminRes.body.data?.user?.role === 'CENTRAL_ADMIN', `User role is CENTRAL_ADMIN (Got: ${adminRes.body.data?.user?.role})`);
  const adminToken = adminRes.body.data?.token;

  // Admin accesses admin metrics
  const adminMetrics = await request(app)
    .get('/api/admin/metrics')
    .set('Authorization', `Bearer ${adminToken}`);
  assert(adminMetrics.status === 200, 'Admin Dashboard metrics endpoint accessible');

  // --- TEST 4: Wrong password -> 401 with proper error message ---
  console.log('\n--- TEST 4: Wrong password rejected with 401 ---');
  const wrongPassRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@govconnect.demo', password: 'IncorrectPassword999' });

  assert(wrongPassRes.status === 401, `Wrong password returned 401 (Got: ${wrongPassRes.status})`);
  assert(wrongPassRes.body.error?.code === 'INVALID_CREDENTIALS', `Error code is INVALID_CREDENTIALS (Got: ${wrongPassRes.body.error?.code})`);
  assert(wrongPassRes.body.error?.message === 'Invalid email or password.', `Error message matches standard (Got: ${wrongPassRes.body.error?.message})`);

  // --- TEST 5: Invalid email -> 401 with proper error message ---
  console.log('\n--- TEST 5: Invalid / Non-existent email rejected with 401 ---');
  const invalidEmailRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'nonexistent.user@randomdomain.local', password: 'Password@123' });

  assert(invalidEmailRes.status === 401, `Non-existent email returned 401 (Got: ${invalidEmailRes.status})`);
  assert(invalidEmailRes.body.error?.code === 'INVALID_CREDENTIALS', `Error code is INVALID_CREDENTIALS (Got: ${invalidEmailRes.body.error?.code})`);

  // --- TEST 6: Session persistence / Refresh (/api/auth/me) ---
  console.log('\n--- TEST 6: Refresh after successful login (Session persistence via /api/auth/me) ---');
  const meRes = await request(app)
    .get('/api/auth/me')
    .set('Authorization', `Bearer ${adminToken}`);

  assert(meRes.status === 200, `Session verified on refresh (Got: ${meRes.status})`);
  assert(meRes.body.data?.email === 'admin@govconnect.demo', 'User identity matches session');
  assert(meRes.body.data?.role === 'CENTRAL_ADMIN', 'User role preserved across refresh');

  // --- TEST 7: Directly opening /admin as Citizen -> 403 Access Denied ---
  console.log('\n--- TEST 7: Citizen cannot access /api/admin/metrics (403 Forbidden) ---');
  const citizenToAdmin = await request(app)
    .get('/api/admin/metrics')
    .set('Authorization', `Bearer ${citizenToken}`);

  assert(citizenToAdmin.status === 403, `Citizen blocked from admin API with 403 (Got: ${citizenToAdmin.status})`);
  assert(citizenToAdmin.body.error?.code === 'FORBIDDEN', `Error code is FORBIDDEN (Got: ${citizenToAdmin.body.error?.code})`);

  // --- TEST 8: Directly opening Officer Dashboard API as Citizen -> 403 Access Denied ---
  console.log('\n--- TEST 8: Citizen cannot access /api/officer/applications (403 Forbidden) ---');
  const citizenToOfficer = await request(app)
    .get('/api/officer/applications')
    .set('Authorization', `Bearer ${citizenToken}`);

  assert(citizenToOfficer.status === 403, `Citizen blocked from officer API with 403 (Got: ${citizenToOfficer.status})`);
  assert(citizenToOfficer.body.error?.code === 'FORBIDDEN', `Error code is FORBIDDEN (Got: ${citizenToOfficer.body.error?.code})`);

  console.log('\n===============================================================');
  console.log(`📊 AUDIT SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================');

  if (failed > 0) process.exit(1);
}

runCompleteSignInVerification()
  .catch((err) => {
    console.error('Fatal Verification Error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

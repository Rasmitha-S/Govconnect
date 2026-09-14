import { createApp } from '../src/app.js';
import request from 'supertest';
import { prisma } from '../src/utils/prisma.js';

async function verifyDashboards() {
  console.log('===============================================================');
  console.log('🧪 VERIFYING 50-RECORD DATASET & DASHBOARDS');
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

  // 1. Database Counts
  console.log('--- 1. Database Sample Counts Verification ---');
  const [citizensCount, officersCount, adminsCount, appsCount, notifsCount] = await Promise.all([
    prisma.user.count({ where: { role: 'CITIZEN' } }),
    prisma.user.count({ where: { role: 'OFFICER' } }),
    prisma.user.count({ where: { role: 'CENTRAL_ADMIN' } }),
    prisma.application.count(),
    prisma.notification.count(),
  ]);

  assert(citizensCount === 20, `Citizens Count: ${citizensCount} (Expected: 20)`);
  assert(officersCount === 10, `Officers Count: ${officersCount} (Expected: 10)`);
  assert(adminsCount === 5, `Admins Count: ${adminsCount} (Expected: 5)`);
  assert(appsCount === 10, `Applications Count: ${appsCount} (Expected: 10)`);
  assert(notifsCount === 5, `Notifications Count: ${notifsCount} (Expected: 5)`);
  const total = citizensCount + officersCount + adminsCount + appsCount + notifsCount;
  assert(total === 50, `Total Controlled Dataset: ${total} (Expected: 50)`);

  // 2. Admin Dashboard Verification
  console.log('\n--- 2. Admin Dashboard Verification ---');
  const adminLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@govconnect.demo', password: 'Password@123' });

  assert(adminLogin.status === 200, 'Admin login succeeds with 200 OK');
  const adminToken = adminLogin.body.data?.token;

  const adminMetrics = await request(app)
    .get('/api/admin/metrics')
    .set('Authorization', `Bearer ${adminToken}`);

  assert(adminMetrics.status === 200, 'Admin metrics endpoint returned 200');
  assert(adminMetrics.body.data?.overview?.totalCitizens === 20, `Admin overview citizens: ${adminMetrics.body.data?.overview?.totalCitizens} (Expected: 20)`);
  assert(adminMetrics.body.data?.overview?.totalOfficers === 10, `Admin overview officers: ${adminMetrics.body.data?.overview?.totalOfficers} (Expected: 10)`);
  assert(adminMetrics.body.data?.overview?.totalApplications === 10, `Admin overview applications: ${adminMetrics.body.data?.overview?.totalApplications} (Expected: 10)`);

  const adminUsersList = await request(app)
    .get('/api/admin/users')
    .set('Authorization', `Bearer ${adminToken}`);
  assert(adminUsersList.status === 200, 'Admin list users returned 200');
  assert(adminUsersList.body.data?.length === 35, `Total users listed: ${adminUsersList.body.data?.length} (Expected: 35)`);

  // 3. Officer Dashboard (Water Department)
  console.log('\n--- 3. Water Officer Dashboard Verification ---');
  const officerLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'water.officer@govconnect.demo', password: 'Password@123' });

  assert(officerLogin.status === 200, 'Water Officer login succeeds with 200 OK');
  const officerToken = officerLogin.body.data?.token;

  const officerStats = await request(app)
    .get('/api/officer/stats')
    .set('Authorization', `Bearer ${officerToken}`);

  assert(officerStats.status === 200, 'Officer stats returned 200');
  assert(officerStats.body.data?.department?.code === 'WATER', 'Officer stats shows WATER department');

  const officerApps = await request(app)
    .get('/api/officer/applications')
    .set('Authorization', `Bearer ${officerToken}`);

  assert(officerApps.status === 200, 'Officer applications list returned 200');
  assert(officerApps.body.data?.length === 3, `Water Officer sees 3 Water applications (Got: ${officerApps.body.data?.length})`);

  // 4. Citizen Dashboard & Application Tracking
  console.log('\n--- 4. Citizen Dashboard & Application Tracking (Kavitha Sundaram) ---');
  const citizenLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'citizen@govconnect.demo', password: 'Password@123' });

  assert(citizenLogin.status === 200, 'Citizen login succeeds with 200 OK');
  const citizenToken = citizenLogin.body.data?.token;

  const citizenApps = await request(app)
    .get('/api/applications')
    .set('Authorization', `Bearer ${citizenToken}`);

  assert(citizenApps.status === 200, 'Citizen applications list returned 200');
  assert(citizenApps.body.data?.length === 1, `Citizen sees 1 application (Got: ${citizenApps.body.data?.length})`);
  const kavithaApp = citizenApps.body.data[0];
  assert(kavithaApp.applicationNumber === 'APP-2026-00001', `Application number is APP-2026-00001`);
  assert(kavithaApp.status === 'UNDER_VERIFICATION', `Status is UNDER_VERIFICATION`);

  // Application detail with complete timeline & workflow
  const appDetail = await request(app)
    .get(`/api/applications/${kavithaApp.id}`)
    .set('Authorization', `Bearer ${citizenToken}`);

  assert(appDetail.status === 200, 'Application detail returned 200');
  assert(appDetail.body.data?.workflow?.steps?.length === 6, `Workflow has 6 stages (Got: ${appDetail.body.data?.workflow?.steps?.length})`);
  assert(appDetail.body.data?.consents?.length >= 1, `Application has linked cross-department consent`);

  // 5. Citizen Notifications
  console.log('\n--- 5. Citizen Notifications Verification ---');
  const citizenNotifs = await request(app)
    .get('/api/notifications')
    .set('Authorization', `Bearer ${citizenToken}`);

  assert(citizenNotifs.status === 200, 'Notifications endpoint returned 200');
  assert(citizenNotifs.body.data?.length >= 1, `Citizen has active notification (${citizenNotifs.body.data?.[0]?.title})`);

  console.log('\n===============================================================');
  console.log(`📊 DASHBOARD & DATASET VERIFICATION: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================');

  if (failed > 0) process.exit(1);
}

verifyDashboards()
  .catch((err) => {
    console.error('Fatal Verification Error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

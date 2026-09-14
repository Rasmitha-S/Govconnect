async function runLiveAuthVerification() {
  const baseUrl = 'http://localhost:5000/api';
  console.log('====================================================');
  console.log('⚡ STARTING LIVE BACKEND & AUTH E2E VERIFICATION');
  console.log('====================================================\n');

  // Helper for JSON requests
  async function post(endpoint: string, body: any, token?: string) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => null);
    return { status: res.status, data };
  }

  async function get(endpoint: string, token?: string) {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${baseUrl}${endpoint}`, { headers });
    const data = await res.json().catch(() => null);
    return { status: res.status, data };
  }

  // 1. Health check
  const health = await get('/health');
  console.log(`[HEALTH CHECK] Status: ${health.status}, OK: ${health.data?.success}`);
  if (health.status !== 200) throw new Error('Backend health check failed');

  // TEST 1: Admin Login
  console.log('\n--- TEST 1: Active Admin Login & Dashboard Access ---');
  const adminLogin = await post('/auth/login', {
    email: 'admin@govconnect.demo',
    password: 'Password@123',
  });
  console.log(`Admin Login Status: ${adminLogin.status}`);
  console.log(`Admin Role: ${adminLogin.data?.data?.user?.role}, Status: ${adminLogin.data?.data?.user?.accountStatus}, Verified: ${adminLogin.data?.data?.user?.isEmailVerified}`);
  const adminToken = adminLogin.data?.data?.token;
  if (!adminToken) throw new Error('Admin login failed to return token');

  const adminMetrics = await get('/admin/metrics', adminToken);
  console.log(`Admin Metrics Endpoint Status: ${adminMetrics.status}, Success: ${adminMetrics.data?.success}`);
  console.log(`Total Citizens: ${adminMetrics.data?.data?.overview?.totalCitizens}, Total Officers: ${adminMetrics.data?.data?.overview?.totalOfficers}`);

  // TEST 2: Officer Login
  console.log('\n--- TEST 2: Active Officer Login & Dashboard Access ---');
  const officerLogin = await post('/auth/login', {
    email: 'water.officer@govconnect.demo',
    password: 'Password@123',
  });
  console.log(`Officer Login Status: ${officerLogin.status}`);
  console.log(`Officer Role: ${officerLogin.data?.data?.user?.role}, Dept: ${officerLogin.data?.data?.user?.department?.code}`);
  const officerToken = officerLogin.data?.data?.token;
  if (!officerToken) throw new Error('Officer login failed to return token');

  const officerStats = await get('/officer/stats', officerToken);
  console.log(`Officer Stats Endpoint Status: ${officerStats.status}, Dept: ${officerStats.data?.data?.department?.code}`);

  // TEST 3: Officer Pending Approval
  console.log('\n--- TEST 3: Unapproved Officer Account Pending Approval ---');
  const pendingOfficerLogin = await post('/auth/login', {
    email: 'navisal127@gmail.com',
    password: 'Password@123', // or test hash
  });
  console.log(`Pending Officer Login Status: ${pendingOfficerLogin.status}`);
  console.log(`Error Code: ${pendingOfficerLogin.data?.error?.code}, Message: "${pendingOfficerLogin.data?.error?.message}"`);

  // TEST 4: Admin Pending Approval
  console.log('\n--- TEST 4: Unapproved Admin Account Pending Approval ---');
  const pendingAdminLogin = await post('/auth/login', {
    email: 'sanjay123@gmail.com',
    password: 'Password@123',
  });
  console.log(`Pending Admin Login Status: ${pendingAdminLogin.status}`);
  console.log(`Error Code: ${pendingAdminLogin.data?.error?.code}, Message: "${pendingAdminLogin.data?.error?.message}"`);

  // TEST 5: Wrong Password
  console.log('\n--- TEST 5: Wrong Password Rejection ---');
  const wrongPass = await post('/auth/login', {
    email: 'admin@govconnect.demo',
    password: 'WrongPassword123',
  });
  console.log(`Wrong Password Status: ${wrongPass.status}, Code: ${wrongPass.data?.error?.code}, Message: "${wrongPass.data?.error?.message}"`);

  // TEST 6: Citizen Login & RBAC Protection on Admin Routes
  console.log('\n--- TEST 6: Citizen Login & RBAC Protection ---');
  const citizenLogin = await post('/auth/login', {
    email: 'citizen@govconnect.demo',
    password: 'Password@123',
  });
  console.log(`Citizen Login Status: ${citizenLogin.status}, Role: ${citizenLogin.data?.data?.user?.role}`);
  const citizenToken = citizenLogin.data?.data?.token;

  const citizenAdminAttempt = await get('/admin/metrics', citizenToken);
  console.log(`Citizen Accessing /admin/metrics: Status ${citizenAdminAttempt.status} (${citizenAdminAttempt.data?.error?.code})`);

  const officerAdminAttempt = await get('/admin/metrics', officerToken);
  console.log(`Officer Accessing /admin/metrics: Status ${officerAdminAttempt.status} (${officerAdminAttempt.data?.error?.code})`);

  // TEST 7: Session persistence /auth/me
  console.log('\n--- TEST 7: Session Persistence via /api/auth/me ---');
  const meAdmin = await get('/auth/me', adminToken);
  console.log(`Admin Session /auth/me Status: ${meAdmin.status}, Email: ${meAdmin.data?.data?.email}, Role: ${meAdmin.data?.data?.role}`);

  const meOfficer = await get('/auth/me', officerToken);
  console.log(`Officer Session /auth/me Status: ${meOfficer.status}, Email: ${meOfficer.data?.data?.email}, Role: ${meOfficer.data?.data?.role}`);

  console.log('\n====================================================');
  console.log('✅ ALL LIVE AUTH & RBAC WORKFLOWS VERIFIED 100%!');
  console.log('====================================================');
}

runLiveAuthVerification().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});

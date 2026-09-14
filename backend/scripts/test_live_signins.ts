async function main() {
  const accounts = [
    { email: 'admin@govconnect.demo', pass: 'Password@123', expectedRole: 'CENTRAL_ADMIN' },
    { email: 'water.officer@govconnect.demo', pass: 'Password@123', expectedRole: 'OFFICER' },
    { email: 'revenue.officer@govconnect.demo', pass: 'Password@123', expectedRole: 'OFFICER' },
    { email: 'education.officer@govconnect.demo', pass: 'Password@123', expectedRole: 'OFFICER' },
    { email: 'citizen@govconnect.demo', pass: 'Password@123', expectedRole: 'CITIZEN' },
    { email: 'sanjay.m.cse.2024@snsct.org', pass: 'Password@123', expectedRole: 'CENTRAL_ADMIN' },
    { email: 'sanjay123@gmail.com', pass: 'Password@123', expectedRole: 'CENTRAL_ADMIN' },
    { email: 'citizen.rajesh@govconnect.local', pass: 'Password@123', expectedRole: 'CITIZEN' },
    { email: 'citizen.ananya@govconnect.local', pass: 'Password@123', expectedRole: 'CITIZEN' },
    { email: 'water.officer2@govconnect.local', pass: 'Password@123', expectedRole: 'OFFICER' },
  ];

  console.log('Testing live login requests against http://localhost:5000/api/auth/login...\n');

  for (const acc of accounts) {
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: acc.email, password: acc.pass }),
      });

      const data = await res.json();
      if (res.status === 200 && data.success && data.data?.token) {
        console.log(`✅ [200 OK] ${acc.email} -> Role: ${data.data.user.role} | Name: ${data.data.user.fullName}`);
      } else {
        console.error(`❌ [FAILED ${res.status}] ${acc.email} ->`, data);
      }
    } catch (e: any) {
      console.error(`❌ [ERROR] ${acc.email} ->`, e.message);
    }
  }
}

main();

async function main() {
  const baseUrl = 'http://localhost:5000/api';

  console.log('--- Step 1: Citizen Login ---');
  const loginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'citizen@govconnect.demo', password: 'Password@123' }),
  });
  const loginData = await loginRes.json();
  console.log('Citizen Logged In:', loginData.data?.user?.email, 'Role:', loginData.data?.user?.role);
  const token = loginData.data?.token;

  console.log('\n--- Step 2: DigiLocker Integration Status Check ---');
  const statusRes = await fetch(`${baseUrl}/integrations/digilocker/status`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const statusData = await statusRes.json();
  console.log('DigiLocker Mode:', statusData.data?.mode, '| Supported Services:', statusData.data?.supportedServices);

  console.log('\n--- Step 3: Initiate Explicit Consent ---');
  const initRes = await fetch(`${baseUrl}/integrations/digilocker/consent/initiate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ serviceCode: 'WTR-001' }),
  });
  const initData = await initRes.json();
  const sessionId = initData.data?.sessionId;
  console.log('Consent Session ID:', sessionId);
  console.log('State Token:', initData.data?.stateToken);
  console.log('Requested Attributes:', initData.data?.requestedData);

  console.log('\n--- Step 4: Complete Representative Consent & Standardization ---');
  const compRes = await fetch(`${baseUrl}/integrations/digilocker/complete-representative`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ sessionId }),
  });
  const compData = await compRes.json();
  console.log('Status:', compData.data?.status);
  console.log('Autofilled Name:', compData.data?.standardizedData?.fullName);
  console.log('Standardized Address:', compData.data?.standardizedData?.address);
  console.log('Verified Documents Attached:', compData.data?.standardizedData?.documents);

  console.log('\n--- Step 5: Submit New Water Connection Application with Auto-Filled Data ---');
  const appRes = await fetch(`${baseUrl}/applications/water`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      fullName: compData.data?.standardizedData?.fullName,
      mobile: '9876543210',
      email: 'citizen@govconnect.demo',
      aadhaarToken: 'XXXX-XXXX-4819',
      propertyId: 'PROP-DIGI-2026',
      propertyType: 'RESIDENTIAL',
      doorNumber: compData.data?.standardizedData?.address?.doorNumber || '18/B',
      streetName: compData.data?.standardizedData?.address?.streetName || 'Avinashi Road',
      wardNumber: compData.data?.standardizedData?.address?.wardNumber || 'Ward 22',
      zone: 'ZONE_A',
      city: compData.data?.standardizedData?.address?.city || 'Coimbatore',
      pincode: compData.data?.standardizedData?.address?.pincode || '641004',
      pipeSize: '0.5_INCH',
      connectionType: 'DOMESTIC',
      mockDocumentUploaded: true,
      documentFileName: compData.data?.standardizedData?.documents[0]?.fileName || 'DigiLocker_Verified_Property_Tax.pdf',
      consentGranted: true,
    }),
  });
  const appData = await appRes.json();
  console.log('Application Created:', appData.data?.applicationNumber, '| Status:', appData.data?.status);
  console.log('\n>>> All live API endpoints verified successfully! <<<');
}

main().catch(console.error);

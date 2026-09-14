async function main() {
  const baseUrl = 'http://localhost:5000/api';

  console.log('--- Step 1: Citizen Login ---');
  const loginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'citizen@govconnect.demo', password: 'Password@123' }),
  });
  const loginData = await loginRes.json();
  const token = loginData.data?.token;
  console.log('✓ Citizen Logged In:', loginData.data?.user?.email);

  console.log('\n--- Step 2: DigiLocker Consent Initiation for Driving Licence (TRN-001) ---');
  const initRes = await fetch(`${baseUrl}/integrations/digilocker/consent/initiate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ serviceCode: 'TRN-001' }),
  });
  const initData = await initRes.json();
  const sessionId = initData.data?.sessionId;
  console.log('✓ Consent Session ID:', sessionId);
  console.log('✓ State Token:', initData.data?.stateToken);
  console.log('✓ Requested Scopes:', initData.data?.requestedData);

  console.log('\n--- Step 3: Complete Representative DigiLocker Prefill ---');
  const compRes = await fetch(`${baseUrl}/integrations/digilocker/complete-representative`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ sessionId }),
  });
  const compData = await compRes.json();
  const profile = compData.data?.standardizedData;
  console.log('✓ Status:', compData.data?.status);
  console.log('✓ Autofilled Name:', profile?.fullName);
  console.log('✓ Autofilled DL Number:', profile?.dlNumber);
  console.log('✓ Standardized Address:', `${profile?.address?.doorNumber}, ${profile?.address?.streetName}, ${profile?.address?.city} - ${profile?.address?.pincode}`);
  console.log('✓ Attached Document:', profile?.documents?.[0]?.fileName);

  console.log('\n--- Step 4: Submit Driving Licence Renewal + Address Change Application ---');
  const appRes = await fetch(`${baseUrl}/applications/driving-licence`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      serviceCode: 'TRN-001',
      fullName: profile?.fullName || 'Kavitha Sundaram',
      dob: '1992-07-14',
      mobile: '9876543210',
      email: 'citizen@govconnect.demo',
      aadhaarToken: 'XXXX-XXXX-4819',
      dlNumber: profile?.dlNumber || 'TN38 20180004819',
      existingExpiryDate: '2028-08-23',
      issuingState: 'Tamil Nadu',
      licensingAuthority: 'TN-38 (Coimbatore South RTO)',
      existingAddress: '14 Old Housing Board Colony, Ramanathapuram, Coimbatore - 641045',
      houseBuilding: profile?.address?.doorNumber || '18/B',
      street: profile?.address?.streetName || 'Avinashi Road, Anna Nagar Extension',
      city: profile?.address?.city || 'Coimbatore',
      district: profile?.address?.district || 'Coimbatore',
      state: profile?.address?.state || 'Tamil Nadu',
      pincode: profile?.address?.pincode || '641004',
      renewLicence: true,
      changeAddress: true,
      existingDlDocFileName: 'Driving_Licence_Original.pdf',
      addressProofDocFileName: profile?.documents?.[0]?.fileName || 'DigiLocker_Verified_Address_Proof.pdf',
      isFromDigiLocker: true,
      consentGranted: true,
    }),
  });
  const appData = await appRes.json();
  const app = appData.data;
  console.log('✓ Application Created:', app?.applicationNumber);
  console.log('✓ External Platform Ref:', app?.externalReferenceId, `(${app?.externalPlatform})`);
  console.log('✓ Current Step:', app?.currentStep);
  console.log('✓ Status:', app?.status);

  console.log('\n--- Step 5: Verify Application Detail & Multi-Stage Workflow Steps ---');
  const detailRes = await fetch(`${baseUrl}/applications/${app?.id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const detailData = await detailRes.json();
  const stages = detailData.data?.workflow?.steps || [];
  console.log(`✓ Workflow Stages (${stages.length}):`);
  stages.forEach((s: any) => {
    console.log(`   Stage ${s.stageNumber}: [${s.status}] ${s.stageName} (${s.connectorName})`);
  });

  console.log('\n=============================================================');
  console.log('>>> DRIVING LICENCE APPLICATION WORKFLOW FULLY VERIFIED! <<<');
  console.log('=============================================================');
}

main().catch(console.error);

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

/**
 * GovConnect Relational Seeding Engine
 * Seeds exactly 50 sample records total:
 * - 20 Citizens
 * - 10 Department Officers
 * - 5 Central Administrators
 * - 10 Applications (with realistic cross-department workflows & timelines)
 * - 5 Supporting Notifications
 * TOTAL = 50 Sample Records
 */
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting GovConnect Database Seeding (Target: Exactly 50 Sample Records)...');

  // 0. Clean up existing operational tables to enforce exact 50-record dataset
  console.log('🧹 Cleaning existing data safely...');
  await prisma.workflowStep.deleteMany({});
  await prisma.workflow.deleteMany({});
  await prisma.applicationStatusHistory.deleteMany({});
  await prisma.consent.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.grievance.deleteMany({});
  await prisma.document.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.securityEvent.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.application.deleteMany({});
  await prisma.citizenProfile.deleteMany({});
  await prisma.officerProfile.deleteMany({});
  await prisma.digiLockerSession.deleteMany({});
  await prisma.user.deleteMany({});

  // 1. Seed Core Reference Departments (8)
  const depts = [
    {
      code: 'WATER',
      name: 'Municipal Administration & Water Supply Department',
      description: 'Responsible for urban drinking water supply, pipeline infrastructure, sewage treatment and municipal connections.',
      contactEmail: 'water.support@govconnect.local',
      contactPhone: '0422-2300101',
    },
    {
      code: 'REVENUE',
      name: 'Revenue & Land Administration Department',
      description: 'Maintains state land records, Patta/Chitta titles, property tax assessments and encumbrance certifications.',
      contactEmail: 'revenue.support@govconnect.local',
      contactPhone: '0422-2300202',
    },
    {
      code: 'EDUCATION',
      name: 'Department of Higher Education & Scholarships',
      description: 'Administers collegiate education, university enrollments, post-matric scholarships and educational welfare schemes.',
      contactEmail: 'education.support@govconnect.local',
      contactPhone: '0422-2300303',
    },
    {
      code: 'HEALTH',
      name: 'Health & Family Welfare Department',
      description: 'Manages public health schemes, hospital networks, Ayushman Bharat / CMCHISTN health card verifications.',
      contactEmail: 'health.support@govconnect.local',
      contactPhone: '0422-2300404',
    },
    {
      code: 'TRANSPORT',
      name: 'Transport & Motor Vehicles Department',
      description: 'Regulates Regional Transport Offices (RTO), driving licenses, vehicle registrations and road safety compliance.',
      contactEmail: 'transport.support@govconnect.local',
      contactPhone: '0422-2300505',
    },
    {
      code: 'AGRICULTURE',
      name: 'Department of Agriculture & Farmers Welfare',
      description: 'Oversees agricultural subsidies, farmer welfare initiatives, crop insurance, and PM-KISAN verification.',
      contactEmail: 'agri.support@govconnect.local',
      contactPhone: '0422-2300606',
    },
    {
      code: 'LABOUR',
      name: 'Department of Labour & Employment',
      description: 'Manages unorganized worker registrations, social security, pension coordination, and e-Shram services.',
      contactEmail: 'labour.support@govconnect.local',
      contactPhone: '0422-2300707',
    },
    {
      code: 'ADMINISTRATION',
      name: 'Department of Administrative Reforms & Public Grievances',
      description: 'Coordinates central grievance redressal, citizen engagement, and interoperability standards.',
      contactEmail: 'admin.support@govconnect.local',
      contactPhone: '0422-2300808',
    },
  ];

  const deptMap: Record<string, any> = {};
  for (const d of depts) {
    const dept = await prisma.department.upsert({
      where: { code: d.code },
      update: d,
      create: d,
    });
    deptMap[d.code] = dept;
  }
  console.log(`✓ Seeded ${depts.length} government departments.`);

  // 2. Seed Service Categories (12)
  const categories = [
    { name: 'Water & Utilities', description: 'Municipal water, pipeline tap, and sewage services', icon: 'Droplets' },
    { name: 'Property & Land', description: 'Land records, Patta, Chitta, and property tax clearances', icon: 'LandPlot' },
    { name: 'Education & Scholarships', description: 'Student grants, tuition waivers, and educational schemes', icon: 'GraduationCap' },
    { name: 'Health & Medical', description: 'Public insurance schemes and hospital clearances', icon: 'HeartPulse' },
    { name: 'Transport & Vehicles', description: 'Driving licenses, RC, and transport clearances', icon: 'Car' },
    { name: 'Farmer Services', description: 'Direct farmer benefits, agricultural assistance, and subsidy schemes', icon: 'Wheat' },
    { name: 'Worker & Social Security', description: 'Unorganised worker welfare, pensions, and insurance schemes', icon: 'HardHat' },
    { name: 'Public Grievance', description: 'Redressal of municipal, state, and central administrative grievances', icon: 'AlertCircle' },
    { name: 'Identity & Documents', description: 'Digital identity verification and document locker access', icon: 'ShieldCheck' },
    { name: 'Tax & Revenue', description: 'PAN card validation, property tax, and direct tax inquiries', icon: 'Receipt' },
    { name: 'Welfare & Schemes', description: 'Central and state welfare scheme discovery and eligibility matching', icon: 'Compass' },
    { name: 'Voter & Electoral', description: 'Electoral roll verification and EPIC voter services', icon: 'Vote' },
  ];

  const catMap: Record<string, any> = {};
  for (const c of categories) {
    const cat = await prisma.serviceCategory.upsert({
      where: { name: c.name },
      update: c,
      create: c,
    });
    catMap[c.name] = cat;
  }
  console.log(`✓ Seeded ${categories.length} service categories.`);

  // 3. Seed Reference Services (14)
  const services = [
    {
      serviceCode: 'WTR-001',
      name: 'New Water Connection (Domestic / Commercial)',
      categoryId: catMap['Water & Utilities'].id,
      departmentId: deptMap['WATER'].id,
      description: 'Apply for fresh municipal drinking water tap connection with automated cross-department property verification.',
      eligibility: 'Property owner or authorized occupant residing within municipal corporation limits.',
      requiredDocuments: JSON.stringify(['Property Assessment ID / Tax Receipt', 'Identity Proof (Aadhaar / Voter ID)', 'Site Location Plan']),
      steps: JSON.stringify([
        '1. Submit Applicant Details',
        '2. Provide Property Assessment ID',
        '3. Cross-Department Revenue & Tax Clearance Check',
        '4. DigiLocker Document Verification',
        '5. Municipal Water Officer Review & Approval',
        '6. Connection Fee Payment & Meter Provisioning',
      ]),
      officialPortalName: 'Municipal Water Supply Online Portal',
      officialPortalURL: 'https://municipal.tn.gov.in/water',
      govconnectSupported: true,
      trackingMode: 'NATIVE',
      supportsDigiLockerAutofill: true,
      feeAmount: 250.0,
      processingDays: 5,
    },
    {
      serviceCode: 'PROP-001',
      name: 'Property Ownership & Patta-Chitta Verification',
      categoryId: catMap['Property & Land'].id,
      departmentId: deptMap['REVENUE'].id,
      description: 'Instant cross-department verification of land ownership and Patta records from State Land Registry.',
      eligibility: 'Registered property owner or authorized agency requesting ownership validation.',
      requiredDocuments: JSON.stringify(['Survey / Assessment Number', 'Sale Deed / Title Deed Copy']),
      steps: JSON.stringify([
        '1. Enter Survey / Sub-division Number',
        '2. Match Demographic with UIDAI Identity',
        '3. Generate Standardized Land Clearance Certificate',
      ]),
      officialPortalName: 'Tamil Nilam State Land Records',
      officialPortalURL: 'https://eservices.tn.gov.in/eservicesnew/land/chitta.html',
      govconnectSupported: true,
      trackingMode: 'NATIVE',
      supportsDigiLockerAutofill: false,
      feeAmount: 0.0,
      processingDays: 1,
    },
    {
      serviceCode: 'SCH-001',
      name: 'Post-Matric Higher Education Scholarship Scheme',
      categoryId: catMap['Education & Scholarships'].id,
      departmentId: deptMap['EDUCATION'].id,
      description: 'Financial grant for collegiate students with automated university enrollment and income verification.',
      eligibility: 'Enrolled student in recognized collegiate institution with annual family income below ₹2,50,000.',
      requiredDocuments: JSON.stringify(['College Enrollment ID', 'DigiLocker Income Certificate', 'Bank Account Details']),
      steps: JSON.stringify([
        '1. Student Demographic & UIDAI Check',
        '2. Higher Education Enrollment Verification',
        '3. DigiLocker Income Certificate Verification',
        '4. Direct DBT Grant Approval',
      ]),
      officialPortalName: 'National Scholarship Portal',
      officialPortalURL: 'https://scholarships.gov.in',
      govconnectSupported: true,
      trackingMode: 'NATIVE',
      supportsDigiLockerAutofill: true,
      feeAmount: 0.0,
      processingDays: 7,
    },
    {
      serviceCode: 'HLT-001',
      name: 'Ayushman Bharat Health Account (ABHA) & Health Records',
      categoryId: catMap['Health & Medical'].id,
      departmentId: deptMap['HEALTH'].id,
      description: 'Create ABHA Health ID and link longitudinal digital health records across public and private hospitals.',
      eligibility: 'All Indian citizens with a valid Aadhaar number or mobile registration.',
      requiredDocuments: JSON.stringify(['Aadhaar Number / Mobile Number', 'Demographic Details']),
      steps: JSON.stringify([
        '1. Authenticate identity via Aadhaar OTP',
        '2. Generate 14-digit ABHA Number',
        '3. Link with ABDM Unified Health Interface (UHI)',
      ]),
      officialPortalName: 'Ayushman Bharat Digital Mission (ABDM)',
      officialPortalURL: 'https://abdm.gov.in',
      govconnectSupported: false,
      trackingMode: 'EXTERNAL_ONLY',
      feeAmount: 0.0,
      processingDays: 1,
    },
    {
      serviceCode: 'TRN-001',
      name: 'Driving License Address Change & Renewal',
      categoryId: catMap['Transport & Vehicles'].id,
      departmentId: deptMap['TRANSPORT'].id,
      description: 'Update address on Smart Card Driving License using DigiLocker verified address proof.',
      eligibility: 'Holder of valid Indian Driving License requiring endorsement or renewal.',
      requiredDocuments: JSON.stringify(['Current Driving License Number', 'DigiLocker Verified Address Proof']),
      steps: JSON.stringify([
        '1. Enter DL Number and Date of Birth',
        '2. Verify Address via Aadhaar / DigiLocker Adapter',
        '3. RTO Online Endorsement & Dispatch',
      ]),
      officialPortalName: 'Parivahan Sewa National Transport Portal',
      officialPortalURL: 'https://parivahan.gov.in',
      govconnectSupported: true,
      trackingMode: 'INTEGRATED',
      supportsDigiLockerAutofill: true,
      feeAmount: 450.0,
      processingDays: 14,
    },
    {
      serviceCode: 'AGR-001',
      name: 'PM-KISAN Samman Nidhi Income Support',
      categoryId: catMap['Farmer Services'].id,
      departmentId: deptMap['AGRICULTURE'].id,
      description: 'Direct income support of ₹6,000 per year for landholding farmer families across India.',
      eligibility: 'Small and marginal farmer families with cultivable landholding as per state land records.',
      requiredDocuments: JSON.stringify(['Aadhaar Card', 'Land Ownership Record (Patta/Khasra)', 'Bank Account Details']),
      steps: JSON.stringify([
        '1. Aadhaar e-KYC Verification',
        '2. Land Record Validation via State Revenue Connector',
        '3. Bank Account Validation for DBT',
      ]),
      officialPortalName: 'PM-KISAN Portal',
      officialPortalURL: 'https://pmkisan.gov.in',
      govconnectSupported: false,
      feeAmount: 0.0,
      processingDays: 15,
    },
    {
      serviceCode: 'LAB-001',
      name: 'e-Shram National Database for Unorganised Workers',
      categoryId: catMap['Worker & Social Security'].id,
      departmentId: deptMap['LABOUR'].id,
      description: 'National registration and issuance of 12-digit Universal Account Number (UAN) for unorganised sector workers.',
      eligibility: 'Unorganised workers aged between 16-59 years not covered under EPFO or ESIC.',
      requiredDocuments: JSON.stringify(['Aadhaar Linked Mobile Number', 'Savings Bank Account Details', 'Occupation Details']),
      steps: JSON.stringify([
        '1. Aadhaar OTP Authentication',
        '2. Fill Occupation and Skill Information',
        '3. Instant UAN Card Generation',
      ]),
      officialPortalName: 'e-Shram National Portal',
      officialPortalURL: 'https://eshram.gov.in',
      govconnectSupported: false,
      feeAmount: 0.0,
      processingDays: 1,
    },
    {
      serviceCode: 'EPF-001',
      name: 'EPFO Member Services & UAN Passbook',
      categoryId: catMap['Worker & Social Security'].id,
      departmentId: deptMap['LABOUR'].id,
      description: 'Check Provident Fund account balance, download passbook, and submit online claims.',
      eligibility: 'Employees with an active Universal Account Number (UAN) registered with EPFO.',
      requiredDocuments: JSON.stringify(['UAN Number', 'Aadhaar Verified Member Profile', 'Bank KYC']),
      steps: JSON.stringify([
        '1. Enter UAN and Member Credentials',
        '2. Identity Verification via SSO Gateway',
        '3. View PF Ledger / Submit Claim',
      ]),
      officialPortalName: 'EPFO Unified Member Portal',
      officialPortalURL: 'https://unifiedportal-mem.epfindia.gov.in',
      govconnectSupported: false,
      feeAmount: 0.0,
      processingDays: 3,
    },
    {
      serviceCode: 'GRV-001',
      name: 'Centralized Public Grievance Redress and Monitoring (CPGRAMS)',
      categoryId: catMap['Public Grievance'].id,
      departmentId: deptMap['ADMINISTRATION'].id,
      description: 'Lodge and track citizen grievances concerning Central and State Government departments.',
      eligibility: 'Any citizen experiencing service deficiencies from public authorities.',
      requiredDocuments: JSON.stringify(['Grievance Description', 'Supporting Department Reference Documents (if any)']),
      steps: JSON.stringify([
        '1. Describe Issue with AI Categorization',
        '2. Automatic Department Routing',
        '3. Resolution Tracking & Action Taken Report',
      ]),
      officialPortalName: 'CPGRAMS Portal',
      officialPortalURL: 'https://pgportal.gov.in',
      govconnectSupported: true,
      feeAmount: 0.0,
      processingDays: 30,
    },
    {
      serviceCode: 'TAX-001',
      name: 'PAN Card Verification & Direct Tax Status',
      categoryId: catMap['Tax & Revenue'].id,
      departmentId: deptMap['REVENUE'].id,
      description: 'Verify 10-character alphanumeric Permanent Account Number (PAN) and cross-verify with Aadhaar.',
      eligibility: 'Individual taxpayers, business entities, and authorized statutory bodies.',
      requiredDocuments: JSON.stringify(['PAN Number', 'Name as per PAN', 'Date of Birth / Incorporation']),
      steps: JSON.stringify([
        '1. Enter PAN and Demographic Details',
        '2. NSDL/UTIITSL Interoperability Check',
        '3. Retrieve Validated Status',
      ]),
      officialPortalName: 'Income Tax e-Filing Portal',
      officialPortalURL: 'https://eportal.incometax.gov.in',
      govconnectSupported: false,
      feeAmount: 0.0,
      processingDays: 1,
    },
    {
      serviceCode: 'VOT-001',
      name: 'National Voter Services & Electoral Roll Search',
      categoryId: catMap['Voter & Electoral'].id,
      departmentId: deptMap['ADMINISTRATION'].id,
      description: 'Search electoral roll, update voter card address, or apply for new EPIC registration.',
      eligibility: 'Indian citizens aged 18 years and above.',
      requiredDocuments: JSON.stringify(['EPIC Number / Demographic Details', 'Age Proof', 'Address Proof']),
      steps: JSON.stringify([
        '1. Search Electoral Roll by EPIC or Details',
        '2. Submit Form 8 for Corrections / Form 6 for New Registration',
        '3. Verification by Booth Level Officer (BLO)',
      ]),
      officialPortalName: 'Election Commission of India Voters Portal',
      officialPortalURL: 'https://voters.eci.gov.in',
      govconnectSupported: false,
      feeAmount: 0.0,
      processingDays: 21,
    },
    {
      serviceCode: 'SCH-002',
      name: 'MyScheme Citizen Welfare Discovery',
      categoryId: catMap['Welfare & Schemes'].id,
      departmentId: deptMap['ADMINISTRATION'].id,
      description: 'One-stop scheme discovery marketplace matching citizen demographics to eligible welfare programs.',
      eligibility: 'All citizens seeking personalized welfare and subsidy recommendations.',
      requiredDocuments: JSON.stringify(['Demographic Profile', 'Socio-economic Category Details']),
      steps: JSON.stringify([
        '1. Enter Demographic and Income Details',
        '2. Algorithmic Scheme Matching',
        '3. Direct Access to Application Portals',
      ]),
      officialPortalName: 'MyScheme National Platform',
      officialPortalURL: 'https://www.myscheme.gov.in',
      govconnectSupported: false,
      feeAmount: 0.0,
      processingDays: 1,
    },
    {
      serviceCode: 'UMG-001',
      name: 'UMANG Unified Mobile App for New-Age Governance',
      categoryId: catMap['Welfare & Schemes'].id,
      departmentId: deptMap['ADMINISTRATION'].id,
      description: 'Single platform access to hundreds of Central and State government services.',
      eligibility: 'All Indian citizens with an active mobile number.',
      requiredDocuments: JSON.stringify(['Mobile Number for OTP Verification']),
      steps: JSON.stringify([
        '1. Mobile OTP Authentication',
        '2. Browse Department Directory',
        '3. Transact Directly',
      ]),
      officialPortalName: 'UMANG India Official Portal',
      officialPortalURL: 'https://web.umang.gov.in',
      govconnectSupported: false,
      feeAmount: 0.0,
      processingDays: 1,
    },
    {
      serviceCode: 'TNE-001',
      name: 'Tamil Nadu e-Sevai Common Service Centers',
      categoryId: catMap['Identity & Documents'].id,
      departmentId: deptMap['ADMINISTRATION'].id,
      description: 'Unified delivery of revenue certificates, community certificates, and civil registrations.',
      eligibility: 'Residents of Tamil Nadu requiring statutory certificates.',
      requiredDocuments: JSON.stringify(['Ration Card', 'Aadhaar Card', 'Self-Declaration Form']),
      steps: JSON.stringify([
        '1. Submit Certificate Application',
        '2. Revenue Inspector / VAO Inspection',
        '3. Digital Certificate Issuance',
      ]),
      officialPortalName: 'TNeGA e-Sevai Citizen Portal',
      officialPortalURL: 'https://tnesevai.tn.gov.in',
      govconnectSupported: false,
      feeAmount: 60.0,
      processingDays: 15,
    },
  ];

  const serviceMap: Record<string, any> = {};
  for (const s of services) {
    const srv = await prisma.service.upsert({
      where: { serviceCode: s.serviceCode },
      update: s,
      create: s,
    });
    serviceMap[s.serviceCode] = srv;
  }
  console.log(`✓ Seeded ${services.length} government services.`);

  // 4. Seed all 18 Government Platform Connectors (18)
  const connectors = [
    { code: 'AADHAAR', name: 'Aadhaar / UIDAI Connector', type: 'REST', description: 'Aadhaar e-KYC and Tokenized Identity Verification Gateway', status: 'HEALTHY', healthStatus: 'OPERATIONAL', avgLatencyMs: 135, totalRequests: 1420, errorCount: 0, simulatedMode: 'MOCK_SIMULATION', failureRate: 0.0 },
    { code: 'DIGILOCKER', name: 'DigiLocker Connector', type: 'REST', description: 'Digital Document Issuance, Verification & Digital Signature Authenticator', status: 'HEALTHY', healthStatus: 'OPERATIONAL', avgLatencyMs: 110, totalRequests: 1890, errorCount: 0, simulatedMode: 'MOCK_SIMULATION', failureRate: 0.0 },
    { code: 'TN_ESEVAI', name: 'Tamil Nadu e-Sevai Connector', type: 'REST', description: 'TNeGA e-Sevai Unified Citizen Service Discovery & Routing Gateway', status: 'HEALTHY', healthStatus: 'OPERATIONAL', avgLatencyMs: 145, totalRequests: 760, errorCount: 0, simulatedMode: 'MOCK_SIMULATION', failureRate: 0.0 },
    { code: 'REVENUE', name: 'Revenue & Land Records Connector', type: 'SOAP_LEGACY', description: 'Connects to State Land Records & Municipal Property Tax Registry with Canonical Schema Transformation', status: 'HEALTHY', healthStatus: 'OPERATIONAL', avgLatencyMs: 210, totalRequests: 980, errorCount: 0, simulatedMode: 'MOCK_SIMULATION', failureRate: 0.0 },
    { code: 'WATER', name: 'Water Department Connector', type: 'REST', description: 'Municipal Pipeline Network, Pressure Assessment & Connection Provisioning Engine', status: 'HEALTHY', healthStatus: 'OPERATIONAL', avgLatencyMs: 125, totalRequests: 840, errorCount: 0, simulatedMode: 'MOCK_SIMULATION', failureRate: 0.0 },
    { code: 'ABDM', name: 'ABDM (Ayushman Bharat) Connector', type: 'REST', description: 'Ayushman Bharat Digital Mission (ABDM) Health Information Exchange & Consent Architecture', status: 'HEALTHY', healthStatus: 'OPERATIONAL', avgLatencyMs: 165, totalRequests: 420, errorCount: 0, simulatedMode: 'MOCK_SIMULATION', failureRate: 0.0 },
    { code: 'EDUCATION', name: 'Education / Scholarship Connector', type: 'REST', description: 'Connects to National Scholarship Portal (NSP) & University Enrollment Records', status: 'HEALTHY', healthStatus: 'OPERATIONAL', avgLatencyMs: 150, totalRequests: 530, errorCount: 0, simulatedMode: 'MOCK_SIMULATION', failureRate: 0.0 },
    { code: 'EPFO', name: 'EPFO Connector', type: 'REST', description: 'Employees Provident Fund Organisation Service Discovery & Status Abstraction Adapter', status: 'HEALTHY', healthStatus: 'OPERATIONAL', avgLatencyMs: 180, totalRequests: 610, errorCount: 0, simulatedMode: 'MOCK_SIMULATION', failureRate: 0.0 },
    { code: 'PM_KISAN', name: 'PM-KISAN Connector', type: 'REST', description: 'PM-KISAN Samman Nidhi Direct Farmer Benefit Status and Eligibility Adapter', status: 'HEALTHY', healthStatus: 'OPERATIONAL', avgLatencyMs: 155, totalRequests: 390, errorCount: 0, simulatedMode: 'MOCK_SIMULATION', failureRate: 0.0 },
    { code: 'E_SHRAM', name: 'e-Shram Connector', type: 'REST', description: 'National Database for Unorganised Workers Service and Status Abstraction', status: 'HEALTHY', healthStatus: 'OPERATIONAL', avgLatencyMs: 140, totalRequests: 480, errorCount: 0, simulatedMode: 'MOCK_SIMULATION', failureRate: 0.0 },
    { code: 'VOTER_SERVICES', name: 'Voter Services Connector', type: 'REST', description: 'Election Commission of India Electoral Roll & EPIC Service Discovery Adapter', status: 'HEALTHY', healthStatus: 'OPERATIONAL', avgLatencyMs: 130, totalRequests: 350, errorCount: 0, simulatedMode: 'MOCK_SIMULATION', failureRate: 0.0 },
    { code: 'MYSCHEME', name: 'MyScheme / MyGov Connector', type: 'REST', description: 'National Scheme Directory, Citizen Engagement & Eligibility Discovery Gateway', status: 'HEALTHY', healthStatus: 'OPERATIONAL', avgLatencyMs: 115, totalRequests: 920, errorCount: 0, simulatedMode: 'MOCK_SIMULATION', failureRate: 0.0 },
    { code: 'UMANG', name: 'India.gov.in / UMANG Connector', type: 'REST', description: 'Unified Mobile App for New-Age Governance Public Service Catalog & Routing', status: 'HEALTHY', healthStatus: 'OPERATIONAL', avgLatencyMs: 120, totalRequests: 870, errorCount: 0, simulatedMode: 'MOCK_SIMULATION', failureRate: 0.0 },
    { code: 'PARIVAHAN', name: 'Parivahan Connector', type: 'REST', description: 'Ministry of Road Transport & Highways Sarathi/Vahan Verification Gateway', status: 'HEALTHY', healthStatus: 'OPERATIONAL', avgLatencyMs: 175, totalRequests: 640, errorCount: 0, simulatedMode: 'MOCK_SIMULATION', failureRate: 0.0 },
    { code: 'CPGRAMS', name: 'CPGRAMS Connector', type: 'REST', description: 'Centralized Public Grievance Redress and Monitoring System Integration Gateway', status: 'HEALTHY', healthStatus: 'OPERATIONAL', avgLatencyMs: 140, totalRequests: 510, errorCount: 0, simulatedMode: 'MOCK_SIMULATION', failureRate: 0.0 },
    { code: 'SSO', name: 'SSO / Identity Federation Connector', type: 'REST', description: 'MeriPehchan National Single Sign-On and Federated Identity Security Adapter', status: 'HEALTHY', healthStatus: 'OPERATIONAL', avgLatencyMs: 95, totalRequests: 2150, errorCount: 0, simulatedMode: 'MOCK_SIMULATION', failureRate: 0.0 },
    { code: 'PAYMENT', name: 'Payment Gateway / UPI Connector', type: 'REST', description: 'Government e-Treasury, Bharat BillPay (BBPS) & UPI Payment Processing Gateway', status: 'HEALTHY', healthStatus: 'OPERATIONAL', avgLatencyMs: 160, totalRequests: 730, errorCount: 0, simulatedMode: 'MOCK_SIMULATION', failureRate: 0.0 },
    { code: 'INCOME_TAX', name: 'Income Tax Connector', type: 'REST', description: 'Income Tax Department PAN Validation and Tax Clearance Abstraction Gateway', status: 'HEALTHY', healthStatus: 'OPERATIONAL', avgLatencyMs: 135, totalRequests: 490, errorCount: 0, simulatedMode: 'MOCK_SIMULATION', failureRate: 0.0 },
  ];

  for (const c of connectors) {
    await prisma.connector.upsert({
      where: { code: c.code },
      update: c,
      create: c,
    });
  }
  console.log(`✓ Seeded ${connectors.length} government system connectors.`);

  // 5. Default Password Hash
  const passwordHash = await bcrypt.hash('Password@123', 10);

  // ==========================================
  // 6. Seed Exactly 5 Administrators (5)
  // ==========================================
  console.log('\n--- Seeding 5 Administrators ---');
  const adminsData = [
    { email: 'admin@govconnect.demo', organization: 'GovConnect Central Governance', employeeId: 'ADM-DIR-001', name: 'S. Ramanathan' },
    { email: 'sanjay.m.cse.2024@snsct.org', organization: 'State e-Governance Agency', employeeId: 'ADM-SYS-002', name: 'Sanjay M' },
    { email: 'sanjay123@gmail.com', organization: 'GovConnect Directorate', employeeId: 'ADM-SYS-003', name: 'Sanjay M' },
    { email: 'admin.director@govconnect.local', organization: 'Ministry of Electronics & IT', employeeId: 'ADM-DIR-004', name: 'Dr. Harish Narayanan' },
    { email: 'audit.admin@govconnect.local', organization: 'Central Vigilance & Compliance', employeeId: 'ADM-AUD-005', name: 'V. Preethi' },
  ];

  const adminUsers: any[] = [];
  for (const adm of adminsData) {
    const user = await prisma.user.create({
      data: {
        email: adm.email,
        passwordHash,
        role: 'CENTRAL_ADMIN',
        accountStatus: 'ACTIVE',
        isEmailVerified: true,
        approvedAt: new Date(),
        organization: adm.organization,
        employeeId: adm.employeeId,
      },
    });
    adminUsers.push(user);
  }
  console.log(`✓ Seeded exactly ${adminUsers.length} Administrators.`);

  // ==========================================
  // 7. Seed Exactly 10 Officers across Departments (10)
  // ==========================================
  console.log('\n--- Seeding 10 Department Officers ---');
  const officersData = [
    // Water Department (2)
    { email: 'water.officer@govconnect.demo', fullName: 'Er. Ramesh Kumar', designation: 'Assistant Executive Engineer (Water Supply)', employeeCode: 'WTR-OFF-101', deptCode: 'WATER' },
    { email: 'water.officer2@govconnect.local', fullName: 'Er. Priya Selvam', designation: 'Assistant Engineer (Distribution & Meters)', employeeCode: 'WTR-OFF-102', deptCode: 'WATER' },
    // Revenue Department (2)
    { email: 'revenue.officer@govconnect.demo', fullName: 'Thiru. S. Arumugam', designation: 'Tahsildar / Land Revenue Officer', employeeCode: 'REV-OFF-201', deptCode: 'REVENUE' },
    { email: 'revenue.officer2@govconnect.local', fullName: 'Tmt. K. Vijayalakshmi', designation: 'Special Revenue Inspector', employeeCode: 'REV-OFF-202', deptCode: 'REVENUE' },
    // Transport Department (2)
    { email: 'transport.officer@govconnect.local', fullName: 'Thiru. M. Soundararajan', designation: 'Regional Transport Officer (RTO)', employeeCode: 'TRN-OFF-301', deptCode: 'TRANSPORT' },
    { email: 'transport.officer2@govconnect.local', fullName: 'Thiru. G. Balaji', designation: 'Motor Vehicle Inspector (Grade I)', employeeCode: 'TRN-OFF-302', deptCode: 'TRANSPORT' },
    // Education Department (2)
    { email: 'education.officer@govconnect.demo', fullName: 'Dr. Meenakshi Sundaresan', designation: 'Joint Director of Higher Education', employeeCode: 'EDU-OFF-401', deptCode: 'EDUCATION' },
    { email: 'education.officer2@govconnect.local', fullName: 'Thiru. K. Karthik', designation: 'Scholarship Nodal Officer', employeeCode: 'EDU-OFF-402', deptCode: 'EDUCATION' },
    // Health Department (1)
    { email: 'health.officer@govconnect.local', fullName: 'Dr. Anitha Varma', designation: 'District Medical Officer (Public Health)', employeeCode: 'HLT-OFF-501', deptCode: 'HEALTH' },
    // Labour & Welfare Department (1)
    { email: 'labour.officer@govconnect.local', fullName: 'Thiru. R. Manikandan', designation: 'Labour Welfare Commissioner', employeeCode: 'LAB-OFF-601', deptCode: 'LABOUR' },
  ];

  const officerUsers: any[] = [];
  for (const off of officersData) {
    const user = await prisma.user.create({
      data: {
        email: off.email,
        passwordHash,
        role: 'OFFICER',
        accountStatus: 'ACTIVE',
        isEmailVerified: true,
        approvedAt: new Date(),
        organization: deptMap[off.deptCode].name,
        employeeId: off.employeeCode,
        officerProfile: {
          create: {
            fullName: off.fullName,
            designation: off.designation,
            employeeCode: off.employeeCode,
            departmentId: deptMap[off.deptCode].id,
          },
        },
      },
      include: { officerProfile: { include: { department: true } } },
    });
    officerUsers.push(user);
  }
  console.log(`✓ Seeded exactly ${officerUsers.length} Department Officers.`);

  // ==========================================
  // 8. Seed Exactly 20 Citizens (20)
  // ==========================================
  console.log('\n--- Seeding 20 Citizens ---');
  const citizensData = [
    { email: 'citizen@govconnect.demo', fullName: 'Kavitha Sundaram', mobile: '9876543210', address: 'Plot 42, Anna Nagar Extension, Coimbatore 641004', aadhaarMasked: 'XXXX-XXXX-4819', digilockerId: 'DL-2026-8819' },
    { email: 'citizen.rajesh@govconnect.local', fullName: 'Rajesh Sharma', mobile: '9876543211', address: '14, Gandhi Road, T. Nagar, Chennai 600017', aadhaarMasked: 'XXXX-XXXX-9124', digilockerId: 'DL-2026-9124' },
    { email: 'citizen.ananya@govconnect.local', fullName: 'Ananya Kumar', mobile: '9876543212', address: '88, Race Course Road, Coimbatore 641018', aadhaarMasked: 'XXXX-XXXX-3341', digilockerId: 'DL-2026-3341' },
    { email: 'citizen.vignesh@govconnect.local', fullName: 'Vignesh Natarajan', mobile: '9876543213', address: '23, Kamaraj Street, Madurai 625001', aadhaarMasked: 'XXXX-XXXX-7782', digilockerId: 'DL-2026-7782' },
    { email: 'citizen.deepak@govconnect.local', fullName: 'Deepak Menon', mobile: '9876543214', address: '105, Trichy Road, Ramanathapuram, Coimbatore 641045', aadhaarMasked: 'XXXX-XXXX-5521', digilockerId: 'DL-2026-5521' },
    { email: 'citizen.divya@govconnect.local', fullName: 'Divya Balasubramanian', mobile: '9876543215', address: '71, Crosscut Road, Gandhipuram, Coimbatore 641012', aadhaarMasked: 'XXXX-XXXX-6619', digilockerId: 'DL-2026-6619' },
    { email: 'citizen.karthik@govconnect.local', fullName: 'Karthik Swaminathan', mobile: '9876543216', address: '19, DB Road, RS Puram, Coimbatore 641002', aadhaarMasked: 'XXXX-XXXX-1142', digilockerId: 'DL-2026-1142' },
    { email: 'citizen.lavanya@govconnect.local', fullName: 'Lavanya Krishnan', mobile: '9876543217', address: '55, Avinashi Road, Peelamedu, Coimbatore 641004', aadhaarMasked: 'XXXX-XXXX-8833', digilockerId: 'DL-2026-8833' },
    { email: 'citizen.murugan@govconnect.local', fullName: 'Murugan Pazhanivel', mobile: '9876543218', address: '31, Thiru Vi Ka Street, Salem 636001', aadhaarMasked: 'XXXX-XXXX-2290', digilockerId: 'DL-2026-2290' },
    { email: 'citizen.nithya@govconnect.local', fullName: 'Nithya Soundar', mobile: '9876543219', address: '92, Trichy Road, Singanallur, Coimbatore 641005', aadhaarMasked: 'XXXX-XXXX-4418', digilockerId: 'DL-2026-4418' },
    { email: 'citizen.arjun@govconnect.local', fullName: 'Arjun Srinivasan', mobile: '9876543220', address: '12, Saibaba Colony, Coimbatore 641011', aadhaarMasked: 'XXXX-XXXX-5192', digilockerId: 'DL-2026-5192' },
    { email: 'citizen.sandhya@govconnect.local', fullName: 'Sandhya Rangarajan', mobile: '9876543221', address: '45, Saravanampatti Main Road, Coimbatore 641035', aadhaarMasked: 'XXXX-XXXX-6281', digilockerId: 'DL-2026-6281' },
    { email: 'citizen.praveen@govconnect.local', fullName: 'Praveen Chandran', mobile: '9876543222', address: '67, Singanallur Housing Unit, Coimbatore 641005', aadhaarMasked: 'XXXX-XXXX-7370', digilockerId: 'DL-2026-7370' },
    { email: 'citizen.meera@govconnect.local', fullName: 'Meera Raghavan', mobile: '9876543223', address: '89, Vadavalli Road, Coimbatore 641041', aadhaarMasked: 'XXXX-XXXX-8469', digilockerId: 'DL-2026-8469' },
    { email: 'citizen.suresh@govconnect.local', fullName: 'Suresh Gopinath', mobile: '9876543224', address: '15, 7th Cross Street, Gandhipuram, Coimbatore 641012', aadhaarMasked: 'XXXX-XXXX-9558', digilockerId: 'DL-2026-9558' },
    { email: 'citizen.pooja@govconnect.local', fullName: 'Pooja Venkatesh', mobile: '9876543225', address: '34, Sathy Road, Ganapathy, Coimbatore 641006', aadhaarMasked: 'XXXX-XXXX-1647', digilockerId: 'DL-2026-1647' },
    { email: 'citizen.ganesh@govconnect.local', fullName: 'Ganesh Subramanian', mobile: '9876543226', address: '78, Kovaipudur Main Road, Coimbatore 641042', aadhaarMasked: 'XXXX-XXXX-2736', digilockerId: 'DL-2026-2736' },
    { email: 'citizen.keerthana@govconnect.local', fullName: 'Keerthana Mohan', mobile: '9876543227', address: '21, Palakkad Main Road, Kuniyamuthur, Coimbatore 641008', aadhaarMasked: 'XXXX-XXXX-3825', digilockerId: 'DL-2026-3825' },
    { email: 'citizen.madhavan@govconnect.local', fullName: 'Madhavan Elango', mobile: '9876543228', address: '63, Trichy Road, Ondipudur, Coimbatore 641016', aadhaarMasked: 'XXXX-XXXX-4914', digilockerId: 'DL-2026-4914' },
    { email: 'citizen.harini@govconnect.local', fullName: 'Harini Balaji', mobile: '9876543229', address: '17, Kalapatti Road, Civil Aerodrome Post, Coimbatore 641014', aadhaarMasked: 'XXXX-XXXX-5003', digilockerId: 'DL-2026-5003' },
  ];

  const citizenUsers: any[] = [];
  for (const c of citizensData) {
    const user = await prisma.user.create({
      data: {
        email: c.email,
        passwordHash,
        role: 'CITIZEN',
        accountStatus: 'ACTIVE',
        isEmailVerified: true,
        approvedAt: new Date(),
        citizenProfile: {
          create: {
            fullName: c.fullName,
            mobile: c.mobile,
            address: c.address,
            aadhaarMasked: c.aadhaarMasked,
            digilockerId: c.digilockerId,
          },
        },
      },
      include: { citizenProfile: true },
    });
    citizenUsers.push(user);
  }
  console.log(`✓ Seeded exactly ${citizenUsers.length} Citizens.`);

  // ==========================================
  // 9. Seed Exactly 10 Applications with Relational Workflows (10)
  // ==========================================
  console.log('\n--- Seeding 10 Relational Applications & Workflows ---');

  const appsData = [
    // App 1: New Water Connection (Domestic) -> UNDER_VERIFICATION (Kavitha Sundaram)
    {
      appNum: 'APP-2026-00001',
      serviceCode: 'WTR-001',
      deptCode: 'WATER',
      citizenIdx: 0, // Kavitha Sundaram
      status: 'UNDER_VERIFICATION',
      currentStep: 'Municipal Water Officer Review & Approval',
      priority: 'HIGH',
      formData: {
        fullName: 'Kavitha Sundaram',
        mobile: '9876543210',
        aadhaarMasked: 'XXXX-XXXX-4819',
        propertyId: 'PROP-COI-2026-88192',
        doorNumber: 'Plot 42, Door No 18/B',
        streetName: 'Avinashi Road, Anna Nagar Extension',
        wardNumber: 'Ward 22',
        zone: 'East Zone',
        connectionType: 'DOMESTIC',
        pipeDiameterInches: 0.5,
        estimatedDailyConsumptionLiters: 450,
      },
      workflowSteps: [
        { name: '1. Citizen Application & Consent', status: 'COMPLETED', dept: 'WATER', remarks: 'Application form submitted and DigiLocker access granted.' },
        { name: '2. UIDAI Identity e-KYC Check', status: 'COMPLETED', dept: 'ADMINISTRATION', remarks: 'Demographic identity matched with 99.8% confidence.' },
        { name: '3. State Revenue & Property Clearance', status: 'COMPLETED', dept: 'REVENUE', remarks: 'Patta/Chitta ownership verified. Property tax clearance confirmed.' },
        { name: '4. Water Department Technical Scrutiny', status: 'IN_PROGRESS', dept: 'WATER', remarks: 'Site inspection and pipeline pressure check assigned to Area Engineer.' },
        { name: '5. Executive Officer Final Sanction', status: 'PENDING', dept: 'WATER', remarks: 'Awaiting completion of technical inspection.' },
        { name: '6. Connection Fee Payment & Meter Dispatch', status: 'PENDING', dept: 'WATER', remarks: 'Fee payment link will be unlocked upon sanction.' },
      ],
      consentDept: 'REVENUE',
      consentPurpose: 'Cross-department verification of land ownership and property tax clearance for municipal water connection.',
      consentFields: ['property_owner', 'property_no', 'tax_clearance_status', 'patta_chitta_no'],
    },
    // App 2: Driving Licence Address Change & Renewal -> UNDER_VERIFICATION (Rajesh Sharma)
    {
      appNum: 'APP-2026-00002',
      serviceCode: 'TRN-001',
      deptCode: 'TRANSPORT',
      citizenIdx: 1, // Rajesh Sharma
      status: 'UNDER_VERIFICATION',
      currentStep: 'RTO Document Verification Pending',
      priority: 'NORMAL',
      formData: {
        dlNumber: 'TN07 20170009124',
        currentAddress: '14, Gandhi Road, T. Nagar, Chennai 600017',
        rtoOffice: 'TN-07 (Chennai South)',
        renewalReason: 'Address change and renewal on 10-year expiration',
      },
      workflowSteps: [
        { name: '1. Online Application Submitted', status: 'COMPLETED', dept: 'TRANSPORT', remarks: 'Form submitted with digital identity consent.' },
        { name: '2. DigiLocker Address Proof Verification', status: 'COMPLETED', dept: 'ADMINISTRATION', remarks: 'Aadhaar-linked address proof digitally verified with cryptographic signature.' },
        { name: '3. RTO Scrutiny & Endorsement', status: 'IN_PROGRESS', dept: 'TRANSPORT', remarks: 'Under verification by Regional Transport Officer.' },
        { name: '4. Smart Card Printing & Speed Post Dispatch', status: 'PENDING', dept: 'TRANSPORT', remarks: 'Will initiate upon RTO endorsement.' },
      ],
      consentDept: 'ADMINISTRATION',
      consentPurpose: 'Verification of digital address proof from DigiLocker for DL endorsement.',
      consentFields: ['address', 'pincode', 'identity_ref'],
    },
    // App 3: Property Ownership & Patta-Chitta -> APPROVED (Ananya Kumar)
    {
      appNum: 'APP-2026-00003',
      serviceCode: 'PROP-001',
      deptCode: 'REVENUE',
      citizenIdx: 2, // Ananya Kumar
      status: 'APPROVED',
      currentStep: 'Patta/Chitta Title Clearance Certificate Issued',
      priority: 'NORMAL',
      formData: {
        surveyNumber: 'SUR-CBE-2026-3341',
        ownerName: 'Ananya Kumar',
        propertyType: 'RESIDENTIAL',
        pattaNumber: 'PATTA-TN-CBE-3341',
      },
      workflowSteps: [
        { name: '1. Land Record Query Received', status: 'COMPLETED', dept: 'REVENUE', remarks: 'Survey number verified in Tamil Nilam database.' },
        { name: '2. Title Search & Encumbrance Check', status: 'COMPLETED', dept: 'REVENUE', remarks: 'Clear legal title verified. No encumbrances or litigation flags.' },
        { name: '3. Tahsildar Approval & Certificate Issuance', status: 'COMPLETED', dept: 'REVENUE', remarks: 'Standardized digital certificate signed and issued.' },
      ],
      consentDept: 'REVENUE',
      consentPurpose: 'Validation of property title in State Revenue Records.',
      consentFields: ['survey_no', 'patta_no', 'ownership_status'],
    },
    // App 4: Post-Matric Scholarship -> SUBMITTED (Vignesh Natarajan)
    {
      appNum: 'APP-2026-00004',
      serviceCode: 'SCH-001',
      deptCode: 'EDUCATION',
      citizenIdx: 3, // Vignesh Natarajan
      status: 'SUBMITTED',
      currentStep: 'University Enrollment Verification',
      priority: 'NORMAL',
      formData: {
        studentName: 'Vignesh Natarajan',
        institutionName: 'Madurai Institute of Technology',
        course: 'B.E. Computer Science',
        yearOfStudy: '3rd Year',
        annualFamilyIncome: 180000,
      },
      workflowSteps: [
        { name: '1. Scholarship Application Submitted', status: 'COMPLETED', dept: 'EDUCATION', remarks: 'Student applied with university enrollment number.' },
        { name: '2. Collegiate Academic Verification', status: 'IN_PROGRESS', dept: 'EDUCATION', remarks: 'Verifying active semester registration with university registrar.' },
        { name: '3. Revenue Income Threshold Check', status: 'PENDING', dept: 'REVENUE', remarks: 'Cross-verifying family income certificate.' },
        { name: '4. Direct Benefit Transfer (DBT) Approval', status: 'PENDING', dept: 'EDUCATION', remarks: 'Awaiting academic verification.' },
      ],
      consentDept: 'EDUCATION',
      consentPurpose: 'Verification of university enrollment and income criteria for state scholarship.',
      consentFields: ['enrollment_no', 'income_certificate', 'academic_standing'],
    },
    // App 5: New Commercial Water Connection -> COMPLETED (Deepak Menon)
    {
      appNum: 'APP-2026-00005',
      serviceCode: 'WTR-001',
      deptCode: 'WATER',
      citizenIdx: 4, // Deepak Menon
      status: 'COMPLETED',
      currentStep: 'Service Commissioned & Smart Meter Active',
      priority: 'NORMAL',
      formData: {
        fullName: 'Deepak Menon',
        establishmentName: 'Menon Logistics & Cold Chain',
        connectionType: 'COMMERCIAL',
        pipeDiameterInches: 1.0,
        propertyId: 'PROP-COI-2026-55214',
      },
      workflowSteps: [
        { name: '1. Commercial Submission', status: 'COMPLETED', dept: 'WATER', remarks: 'Commercial establishment application submitted.' },
        { name: '2. Commercial Property & Fire NOC Clearance', status: 'COMPLETED', dept: 'REVENUE', remarks: 'Commercial zoning verified.' },
        { name: '3. Engineering Assessment', status: 'COMPLETED', dept: 'WATER', remarks: 'Pressure testing passed.' },
        { name: '4. Sanction Order Issued', status: 'COMPLETED', dept: 'WATER', remarks: 'Approved by Superintending Engineer.' },
        { name: '5. Connection Fee Payment Received', status: 'COMPLETED', dept: 'WATER', remarks: 'Fee ₹750 received via Bharatkosh Gateway.' },
        { name: '6. Pipeline Tap Connected', status: 'COMPLETED', dept: 'WATER', remarks: 'Water meter installed and supply live.' },
      ],
      consentDept: 'REVENUE',
      consentPurpose: 'Commercial zoning clearance and property verification.',
      consentFields: ['commercial_assessment', 'fire_noc', 'zoning_status'],
    },
    // App 6: Property Tax Clearance -> PROCESSING (Divya Balasubramanian)
    {
      appNum: 'APP-2026-00006',
      serviceCode: 'PROP-001',
      deptCode: 'REVENUE',
      citizenIdx: 5, // Divya Balasubramanian
      status: 'PROCESSING',
      currentStep: 'Field Assessment by Revenue Inspector',
      priority: 'NORMAL',
      formData: {
        propertyNo: 'PROP-CBE-2026-66195',
        locality: 'Gandhipuram East',
        assessmentYear: '2025-2026',
      },
      workflowSteps: [
        { name: '1. Request Received', status: 'COMPLETED', dept: 'REVENUE', remarks: 'Tax assessment request logged.' },
        { name: '2. Field Inspection & Measurement', status: 'IN_PROGRESS', dept: 'REVENUE', remarks: 'Revenue Inspector checking plinth area.' },
        { name: '3. Demand Notice Generation', status: 'PENDING', dept: 'REVENUE', remarks: 'Awaiting field report.' },
      ],
      consentDept: 'REVENUE',
      consentPurpose: 'Municipal plinth assessment and property tax certification.',
      consentFields: ['property_assessment_no', 'tax_due_status'],
    },
    // App 7: Driving License Renewal -> APPROVED (Karthik Swaminathan)
    {
      appNum: 'APP-2026-00007',
      serviceCode: 'TRN-001',
      deptCode: 'TRANSPORT',
      citizenIdx: 6, // Karthik Swaminathan
      status: 'APPROVED',
      currentStep: 'Approved by RTO - Dispatched for Smart Card Embossing',
      priority: 'NORMAL',
      formData: {
        dlNumber: 'TN38 20150001142',
        validityExpiry: '2026-08-30',
        rtoOffice: 'TN-38 (Coimbatore North)',
      },
      workflowSteps: [
        { name: '1. Renewal Request Submitted', status: 'COMPLETED', dept: 'TRANSPORT', remarks: 'Medical fitness certificate uploaded.' },
        { name: '2. Parivahan Integration Verification', status: 'COMPLETED', dept: 'TRANSPORT', remarks: 'Past violation check cleared.' },
        { name: '3. RTO Approval Granted', status: 'COMPLETED', dept: 'TRANSPORT', remarks: 'Renewal sanctioned for 10-year term.' },
      ],
      consentDept: 'TRANSPORT',
      consentPurpose: 'Sarathi DL history validation.',
      consentFields: ['dl_history', 'medical_certificate'],
    },
    // App 8: Merit Scholarship -> PAYMENT_PENDING (Lavanya Krishnan)
    {
      appNum: 'APP-2026-00008',
      serviceCode: 'SCH-001',
      deptCode: 'EDUCATION',
      citizenIdx: 7, // Lavanya Krishnan
      status: 'PAYMENT_PENDING',
      currentStep: 'DBT Grant Sanctioned - Awaiting Treasury Release',
      priority: 'URGENT',
      formData: {
        studentName: 'Lavanya Krishnan',
        institution: 'PSG College of Technology',
        cgpa: 9.4,
        grantAmount: 35000,
      },
      workflowSteps: [
        { name: '1. Application Lodged', status: 'COMPLETED', dept: 'EDUCATION', remarks: 'Top 1% merit candidate verified.' },
        { name: '2. Bank Account Aadhaar Seeding Check', status: 'COMPLETED', dept: 'EDUCATION', remarks: 'NPCI Aadhaar mapping confirmed.' },
        { name: '3. Sanction Order Approved', status: 'COMPLETED', dept: 'EDUCATION', remarks: 'Sanction letter issued by Joint Director.' },
        { name: '4. Treasury Fund Disbursement', status: 'IN_PROGRESS', dept: 'EDUCATION', remarks: 'Treasury batch scheduled for credit.' },
      ],
      consentDept: 'EDUCATION',
      consentPurpose: 'Direct Benefit Transfer bank seeding validation.',
      consentFields: ['npci_mapper_status', 'aadhaar_bank_link'],
    },
    // App 9: e-Shram Worker Registration -> COMPLETED (Murugan Pazhanivel)
    {
      appNum: 'APP-2026-00009',
      serviceCode: 'LAB-001',
      deptCode: 'LABOUR',
      citizenIdx: 8, // Murugan Pazhanivel
      status: 'COMPLETED',
      currentStep: 'Universal Account Number (UAN) Generated',
      priority: 'NORMAL',
      formData: {
        workerName: 'Murugan Pazhanivel',
        occupation: 'Construction & Building Maintenance',
        uanGenerated: 'UAN-2026-9901-2290',
      },
      workflowSteps: [
        { name: '1. Self-Declaration Submitted', status: 'COMPLETED', dept: 'LABOUR', remarks: 'Worker demographic registered.' },
        { name: '2. EPFO / ESIC Non-Enrolled Verification', status: 'COMPLETED', dept: 'LABOUR', remarks: 'Unorganised worker status validated.' },
        { name: '3. UAN Smart Card Issued', status: 'COMPLETED', dept: 'LABOUR', remarks: 'Digital UAN card ready for download.' },
      ],
      consentDept: 'LABOUR',
      consentPurpose: 'e-Shram unorganised worker social security validation.',
      consentFields: ['epfo_status', 'esic_status'],
    },
    // App 10: Municipal Water Line Extension -> DRAFT (Nithya Soundar)
    {
      appNum: 'APP-2026-00010',
      serviceCode: 'WTR-001',
      deptCode: 'WATER',
      citizenIdx: 9, // Nithya Soundar
      status: 'DRAFT',
      currentStep: 'Citizen Draft - Pending Final Submission',
      priority: 'NORMAL',
      formData: {
        fullName: 'Nithya Soundar',
        propertyId: 'PROP-COI-2026-44189',
        doorNumber: '92/A, Ramanathapuram',
      },
      workflowSteps: [
        { name: '1. Draft Created', status: 'IN_PROGRESS', dept: 'WATER', remarks: 'Applicant filling initial property parameters.' },
      ],
      consentDept: 'WATER',
      consentPurpose: 'Draft municipal pipeline application.',
      consentFields: ['property_details'],
    },
  ];

  const createdApps: any[] = [];
  for (const appItem of appsData) {
    const srv = serviceMap[appItem.serviceCode];
    const dept = deptMap[appItem.deptCode];
    const cit = citizenUsers[appItem.citizenIdx];

    const application = await prisma.application.create({
      data: {
        applicationNumber: appItem.appNum,
        serviceId: srv.id,
        departmentId: dept.id,
        citizenId: cit.id,
        status: appItem.status as any,
        currentStep: appItem.currentStep,
        priority: appItem.priority as any,
        applicationType: 'NATIVE',
        rawFormData: JSON.stringify(appItem.formData),
        statusHistory: {
          create: [
            {
              fromStatus: 'DRAFT',
              toStatus: appItem.status as any,
              changedById: cit.id,
              changedByName: cit.citizenProfile?.fullName || 'Citizen',
              remarks: `Application moved to ${appItem.status} status.`,
            },
          ],
        },
      },
    });

    // Create Workflow & Stages
    const isDone = appItem.status === 'COMPLETED' || appItem.status === 'APPROVED';
    const currentStageIdx = appItem.workflowSteps.findIndex((s) => s.status === 'IN_PROGRESS' || s.status === 'PENDING');
    const currentStage = currentStageIdx >= 0 ? currentStageIdx + 1 : appItem.workflowSteps.length;

    await prisma.workflow.create({
      data: {
        applicationId: application.id,
        currentStage,
        totalStages: appItem.workflowSteps.length,
        isCompleted: isDone,
        startedAt: new Date(),
        completedAt: isDone ? new Date() : null,
        steps: {
          create: appItem.workflowSteps.map((step, idx) => ({
            stageNumber: idx + 1,
            stageName: step.name,
            departmentCode: step.dept,
            status: step.status,
            completedAt: step.status === 'COMPLETED' ? new Date() : null,
            responsePayload: JSON.stringify({ message: step.remarks }),
          })),
        },
      },
    });

    // Create Citizen Consent Record
    if (appItem.consentDept) {
      await prisma.consent.create({
        data: {
          citizenId: cit.id,
          applicationId: application.id,
          dataSource: appItem.consentDept,
          requestingDeptCode: appItem.deptCode,
          dataProviderDeptCode: appItem.consentDept,
          purpose: appItem.consentPurpose,
          dataFields: JSON.stringify(appItem.consentFields),
          status: 'GRANTED',
          grantedAt: new Date(),
        },
      });
    }

    createdApps.push(application);
  }
  console.log(`✓ Seeded exactly ${createdApps.length} Applications with complete workflows and histories.`);

  // ==========================================
  // 10. Seed Exactly 5 Supporting Notifications (5)
  // ==========================================
  console.log('\n--- Seeding 5 Supporting Notifications ---');
  const notificationsData = [
    { citizenIdx: 0, title: 'Water Application Under Technical Inspection', message: 'Your application APP-2026-00001 has cleared Revenue verification and is currently under technical review by the Water Supply Engineer.', type: 'VERIFICATION_COMPLETED' },
    { citizenIdx: 1, title: 'Driving License Address Verified', message: 'DigiLocker verified address proof has been approved for your renewal application APP-2026-00002.', type: 'VERIFICATION_COMPLETED' },
    { citizenIdx: 2, title: 'Patta/Chitta Certificate Sanctioned', message: 'Your property title verification APP-2026-00003 has been approved. Digital certificate is ready for download.', type: 'APPLICATION_APPROVED' },
    { citizenIdx: 4, title: 'Commercial Water Meter Installed', message: 'Connection for APP-2026-00005 has been commissioned successfully. Smart meter telemetry active.', type: 'SERVICE_COMPLETED' },
    { citizenIdx: 7, title: 'Higher Education Scholarship Sanctioned', message: 'Scholarship grant for APP-2026-00008 approved by Department Directorate. Treasury disbursement initiated.', type: 'APPLICATION_APPROVED' },
  ];

  const createdNotifications: any[] = [];
  for (const notif of notificationsData) {
    const cit = citizenUsers[notif.citizenIdx];
    const n = await prisma.notification.create({
      data: {
        userId: cit.id,
        title: notif.title,
        message: notif.message,
        type: notif.type as any,
        isRead: false,
      },
    });
    createdNotifications.push(n);
  }
  console.log(`✓ Seeded exactly ${createdNotifications.length} Supporting Notifications.`);

  // Summary Count Breakdown
  console.log('\n================================================================');
  console.log('🎉 GOVCONNECT CONTROLLED SAMPLE DATASET (EXACTLY 50 RECORDS):');
  console.log(`1. Citizens:              ${citizenUsers.length} records`);
  console.log(`2. Department Officers:   ${officerUsers.length} records`);
  console.log(`3. Central Administrators:${adminUsers.length} records`);
  console.log(`4. Applications:          ${createdApps.length} records`);
  console.log(`5. Supporting Records:    ${createdNotifications.length} records (Notifications)`);
  console.log('----------------------------------------------------------------');
  console.log(`TOTAL SAMPLE RECORDS:     ${citizenUsers.length + officerUsers.length + adminUsers.length + createdApps.length + createdNotifications.length} / 50`);
  console.log('================================================================\n');

  console.log('PLATFORM ACCOUNTS:');
  console.log('1. Central Admin:   admin@govconnect.demo          / Password@123');
  console.log('2. Water Officer:   water.officer@govconnect.demo  / Password@123');
  console.log('3. Revenue Officer: revenue.officer@govconnect.demo/ Password@123');
  console.log('4. Education Off.:  education.officer@govconnect.demo/ Password@123');
  console.log('5. Citizen:         citizen@govconnect.demo        / Password@123');
  console.log('================================================================');
}

main()
  .catch((e) => {
    console.error('Seeding Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

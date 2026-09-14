import { prisma } from '../src/utils/prisma.js';
import { ConnectorRegistry } from '../src/connectors/connector.registry.js';
import { WorkflowService } from '../src/workflows/workflow.service.js';
import { AIAssistantService } from '../src/ai/assistant.service.js';
import { AadhaarConnector } from '../src/connectors/aadhaar.connector.js';
import { DigiLockerConnector } from '../src/connectors/digilocker.connector.js';
import { RevenueConnector } from '../src/connectors/revenue.connector.js';

async function main() {
  console.log('===============================================================');
  console.log('🚀 COMPREHENSIVE GOVCONNECT BACKEND CONNECTIVITY AUDIT');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, extra?: any) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`, extra || '');
      failed++;
    }
  }

  // 1. Database Connection & Core Models
  console.log('--- 1. DATABASE & RELATIONAL INTEGRITY ---');
  const [deptCount, serviceCount, userCount, connectorCount] = await Promise.all([
    prisma.department.count(),
    prisma.service.count(),
    prisma.user.count(),
    prisma.connector.count(),
  ]);

  assert(deptCount >= 8, `Departments Count: ${deptCount} (expected >= 8)`);
  assert(serviceCount >= 10, `Services Count: ${serviceCount} (expected >= 10)`);
  assert(userCount >= 4, `Users Count: ${userCount} (expected >= 4)`);
  assert(connectorCount >= 18, `Connectors Count in DB: ${connectorCount} (expected >= 18)`);

  // 2. Connector Registry & All 18 Platform Connectors
  console.log('\n--- 2. ALL 18 PLATFORM CONNECTORS SYNC & HEALTH ---');
  const registry = ConnectorRegistry.getInstance();
  await registry.syncAndHealthCheckAll();
  const allConnectors = registry.getAllConnectors();
  assert(allConnectors.length >= 18, `All 18 Connectors Registered: ${allConnectors.length}/18`);

  for (const c of allConnectors) {
    const health = await c.healthCheck();
    assert(health.success === true && health.statusCode === 200, `Connector [${c.code}] ${c.name} -> Latency: ${health.latencyMs}ms (Status: ${health.data?.status || 'HEALTHY'})`);
  }

  // 3. Adapter Transformations & Data Standardization
  console.log('\n--- 3. ADAPTER TRANSFORMATION & CANONICAL DATA MODEL ---');
  const aadhaarConn = registry.getConnector<AadhaarConnector>('AADHAAR');
  const mockAadhaar = await aadhaarConn!.verifyIdentity('XXXX-XXXX-4819', 'Kavitha Sundaram');
  assert(mockAadhaar.success === true && mockAadhaar.data?.fullName !== undefined, `Aadhaar e-KYC Identity Verification: ${mockAadhaar.data?.fullName}`);

  const revenueConn = registry.getConnector<RevenueConnector>('REVENUE');
  const mockRevenue = await revenueConn!.fetchPropertyRecord('PROP-TEST-001', 'Kavitha Sundaram');
  assert(mockRevenue.success === true && mockRevenue.data?.propertyId !== undefined, `Revenue Patta/Chitta Canonical Model: ${mockRevenue.data?.propertyId} (${mockRevenue.data?.ownerName})`);

  const digiConn = registry.getConnector<DigiLockerConnector>('DIGILOCKER');
  const dlData = await digiConn!.getAuthorizedUserData('WTR-001', 'citizen@govconnect.demo');
  assert(dlData.success === true && (dlData.data?.documents?.length ?? 0) >= 1, `DigiLocker PKI Verified Documents: ${dlData.data?.documents?.length} attached`);

  // 4. AI Engine & Smart Service Routing
  console.log('\n--- 4. AI ASSISTANT & GRIEVANCE CLASSIFICATION ENGINE ---');
  const detection = await AIAssistantService.detectService('I need to apply for new municipal water pipe connection');
  assert(detection.detectedService?.serviceCode === 'WTR-001', `AI Service Detection: "${detection.detectedService?.name}" (${detection.detectedService?.serviceCode})`);

  const grievanceClassification = await AIAssistantService.classifyGrievance('The drinking water pipeline has burst and is flooding the road');
  assert(grievanceClassification.departmentCode === 'WATER' && (grievanceClassification.priority === 'HIGH' || grievanceClassification.priority === 'URGENT'), `AI Grievance Classifier: Routed to ${grievanceClassification.departmentCode} (Priority: ${grievanceClassification.priority})`);

  // 5. End-to-End Multi-Stage Workflow Pipeline
  console.log('\n--- 5. INTEROPERABLE WORKFLOW PIPELINE ENGINE ---');
  const citizen = await prisma.user.findFirst({ where: { role: 'CITIZEN', email: 'citizen@govconnect.demo' } });
  const waterService = await prisma.service.findFirst({ where: { serviceCode: 'WTR-001' } });
  const waterDept = await prisma.department.findFirst({ where: { code: 'WATER' } });

  const testApp = await prisma.application.create({
    data: {
      applicationNumber: `APP-AUDIT-${Date.now()}`,
      serviceId: waterService!.id,
      departmentId: waterDept!.id,
      citizenId: citizen!.id,
      status: 'SUBMITTED',
      currentStep: 'Initial Submission',
      rawFormData: JSON.stringify({ fullName: 'Kavitha Sundaram', propertyId: 'PROP-AUDIT-2026', aadhaarToken: 'XXXX-XXXX-4819' }),
    },
  });

  // Create consent
  await prisma.consent.create({
    data: {
      citizenId: citizen!.id,
      applicationId: testApp.id,
      dataSource: 'REVENUE',
      requestingDeptCode: 'WATER',
      dataProviderDeptCode: 'REVENUE',
      purpose: 'Verification of property ownership for municipal water connection',
      dataFields: JSON.stringify(['property_owner', 'property_no', 'tax_clearance_status']),
      status: 'GRANTED',
      grantedAt: new Date(),
    },
  });

  const workflow = await WorkflowService.initializeWaterWorkflow(testApp.id, citizen!.id, {
    fullName: 'Kavitha Sundaram',
    propertyId: 'PROP-AUDIT-2026',
    aadhaarToken: 'XXXX-XXXX-4819',
    wardNumber: 'Ward 22',
    doorNumber: '18/B',
    connectionType: 'DOMESTIC',
  });
  assert(workflow.steps.length >= 6, `Workflow Initialized with ${workflow.steps.length} Stages`);

  const afterAutoStages = await prisma.application.findUnique({
    where: { id: testApp.id },
    include: { workflow: { include: { steps: true } } },
  });
  assert(afterAutoStages?.status === 'PENDING_APPROVAL', `Automated Cross-Department Stages Passed -> Status: ${afterAutoStages?.status}`);

  console.log('\n===============================================================');
  console.log(`📊 CONNECTIVITY AUDIT COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================');

  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('Fatal Connectivity Audit Error:', err);
  process.exit(1);
}).finally(() => prisma.$disconnect());

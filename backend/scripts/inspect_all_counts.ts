import { prisma } from '../src/utils/prisma.js';

async function main() {
  const [
    users,
    citizenProfiles,
    officerProfiles,
    applications,
    workflows,
    workflowSteps,
    consents,
    notifications,
    grievances,
    auditLogs,
    securityEvents,
    documents,
    payments,
    departments,
    services,
    connectors
  ] = await Promise.all([
    prisma.user.count(),
    prisma.citizenProfile.count(),
    prisma.officerProfile.count(),
    prisma.application.count(),
    prisma.workflow.count(),
    prisma.workflowStep.count(),
    prisma.consent.count(),
    prisma.notification.count(),
    prisma.grievance.count(),
    prisma.auditLog.count(),
    prisma.securityEvent.count(),
    prisma.document.count(),
    prisma.payment.count(),
    prisma.department.count(),
    prisma.service.count(),
    prisma.connector.count(),
  ]);

  console.log('--- Current Database Table Counts ---');
  console.log('Users:', users);
  console.log('  Citizen Profiles:', citizenProfiles);
  console.log('  Officer Profiles:', officerProfiles);
  console.log('Applications:', applications);
  console.log('Workflows:', workflows);
  console.log('Workflow Steps:', workflowSteps);
  console.log('Consents:', consents);
  console.log('Notifications:', notifications);
  console.log('Grievances:', grievances);
  console.log('Audit Logs:', auditLogs);
  console.log('Security Events:', securityEvents);
  console.log('Documents:', documents);
  console.log('Payments:', payments);
  console.log('Departments:', departments);
  console.log('Services:', services);
  console.log('Connectors:', connectors);

  // Group users by role
  const citizens = await prisma.user.count({ where: { role: 'CITIZEN' } });
  const officers = await prisma.user.count({ where: { role: 'OFFICER' } });
  const admins = await prisma.user.count({ where: { role: 'CENTRAL_ADMIN' } });
  console.log('\nUsers breakdown:');
  console.log('  Citizens:', citizens);
  console.log('  Officers:', officers);
  console.log('  Admins:', admins);
}

main().finally(() => prisma.$disconnect());

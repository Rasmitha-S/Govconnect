import { prisma } from '../src/utils/prisma.js';

async function main() {
  console.log('--- Inspecting and Updating Existing Admin & Officer Accounts ---');

  // Update all existing CENTRAL_ADMIN accounts
  const adminUpdate = await prisma.user.updateMany({
    where: {
      role: 'CENTRAL_ADMIN',
    },
    data: {
      accountStatus: 'ACTIVE',
      isEmailVerified: true,
      rejectionReason: null,
    },
  });
  console.log(`Updated ${adminUpdate.count} CENTRAL_ADMIN accounts to ACTIVE and emailVerified=true.`);

  // Update all existing OFFICER accounts
  const officerUpdate = await prisma.user.updateMany({
    where: {
      role: 'OFFICER',
    },
    data: {
      accountStatus: 'ACTIVE',
      isEmailVerified: true,
      rejectionReason: null,
    },
  });
  console.log(`Updated ${officerUpdate.count} OFFICER accounts to ACTIVE and emailVerified=true.`);

  // List all admin and officer accounts now
  const updatedStaff = await prisma.user.findMany({
    where: {
      role: { in: ['CENTRAL_ADMIN', 'OFFICER'] },
    },
    select: {
      id: true,
      email: true,
      role: true,
      accountStatus: true,
      isEmailVerified: true,
    },
  });

  console.log(`\nVerified ${updatedStaff.length} Staff Accounts:`);
  updatedStaff.forEach((u) => {
    console.log(`- [${u.role}] ${u.email} -> status: ${u.accountStatus}, emailVerified: ${u.isEmailVerified}`);
  });
}

main()
  .catch((e) => console.error('Error updating accounts:', e))
  .finally(() => prisma.$disconnect());

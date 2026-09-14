import { prisma } from '../src/utils/prisma.js';

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, role: true, accountStatus: true, isEmailVerified: true }
  });
  console.log('Total users in DB:', users.length);
  const byRole: Record<string, typeof users> = {};
  users.forEach(u => {
    byRole[u.role] = byRole[u.role] || [];
    byRole[u.role].push(u);
  });
  for (const role in byRole) {
    console.log(`--- Role: ${role} (Total: ${byRole[role].length}) ---`);
    byRole[role].forEach(u => console.log(`  ${u.email} | status: ${u.accountStatus} | isEmailVerified: ${u.isEmailVerified}`));
  }
}

main().finally(() => prisma.$disconnect());

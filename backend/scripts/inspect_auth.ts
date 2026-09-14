import { prisma } from '../src/utils/prisma.js';

async function main() {
  const users = await prisma.user.findMany({
    where: {
      email: {
        in: [
          'admin@govconnect.demo',
          'sanjay.m.cse.2024@snsct.org',
          'sanjay123@gmail.com',
          'water.officer@govconnect.demo',
          'revenue.officer@govconnect.demo',
          'education.officer@govconnect.demo',
          'citizen@govconnect.demo'
        ]
      }
    },
    select: {
      id: true,
      email: true,
      role: true,
      accountStatus: true,
      isEmailVerified: true,
      passwordHash: true,
    }
  });

  console.log('--- TARGET USERS ---');
  console.log(users);
}

main().catch(console.error).finally(() => prisma.$disconnect());

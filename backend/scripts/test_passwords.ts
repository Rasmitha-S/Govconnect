import bcrypt from 'bcryptjs';
import { prisma } from '../src/utils/prisma.js';

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, role: true, accountStatus: true, isEmailVerified: true, passwordHash: true }
  });

  const testPasswords = ['Password@123', 'admin123', 'Admin@123', 'sanjay123', 'Sanjay@123', 'password', '12345678'];

  console.log('Testing passwords against existing DB hashes:');
  for (const u of users) {
    if (u.role === 'CENTRAL_ADMIN' || u.role === 'OFFICER' || u.email.includes('sanjay') || u.email.includes('admin') || u.email.includes('officer')) {
      let matchedPass = null;
      for (const p of testPasswords) {
        if (await bcrypt.compare(p, u.passwordHash)) {
          matchedPass = p;
          break;
        }
      }
      console.log(`User: ${u.email} | Role: ${u.role} | Status: ${u.accountStatus} | Verified: ${u.isEmailVerified} | Matched Password: ${matchedPass || 'UNKNOWN'}`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());

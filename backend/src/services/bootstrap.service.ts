import bcrypt from 'bcryptjs';
import { prisma } from '../utils/prisma.js';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

/**
 * BootstrapService handles secure, server-side activation of initial authorized
 * administrators and officers on startup without modifying public registration flow.
 */
export class BootstrapService {
  public static async bootstrap(): Promise<void> {
    try {
      // List of initial designated platform administrators
      const designatedAdminEmails = new Set<string>([
        'sanjay.m.cse.2024@snsct.org',
        'admin@govconnect.demo',
      ]);

      if (config.initialAdmin.email) {
        designatedAdminEmails.add(config.initialAdmin.email.toLowerCase());
      }

      // 1. Ensure existing designated administrators have ACTIVE and VERIFIED status
      for (const email of designatedAdminEmails) {
        const adminUser = await prisma.user.findUnique({
          where: { email },
        });

        if (adminUser) {
          if (adminUser.accountStatus !== 'ACTIVE' || !adminUser.isEmailVerified || adminUser.role !== 'CENTRAL_ADMIN') {
            await prisma.user.update({
              where: { id: adminUser.id },
              data: {
                role: 'CENTRAL_ADMIN',
                accountStatus: 'ACTIVE',
                isEmailVerified: true,
                approvedAt: adminUser.approvedAt || new Date(),
                rejectionReason: null,
              },
            });
            logger.info({ email: adminUser.email }, 'Bootstrap: Authorized Central Administrator activated and verified.');
          }
        } else if (email === 'admin@govconnect.demo') {
          const salt = await bcrypt.genSalt(10);
          const passwordHash = await bcrypt.hash('Password@123', salt);

          await prisma.user.create({
            data: {
              email,
              passwordHash,
              role: 'CENTRAL_ADMIN',
              accountStatus: 'ACTIVE',
              isEmailVerified: true,
              approvedAt: new Date(),
              organization: 'GovConnect Central Governance',
              employeeId: 'SYS-ADMIN-001',
            },
          });
          logger.info({ email }, 'Bootstrap: Created initial system administrator.');
        } else if (config.initialAdmin.email && email === config.initialAdmin.email.toLowerCase() && config.initialAdmin.password) {
          // Create initial admin securely from environment credentials if non-existent
          const salt = await bcrypt.genSalt(10);
          const passwordHash = await bcrypt.hash(config.initialAdmin.password, salt);

          await prisma.user.create({
            data: {
              email,
              passwordHash,
              role: 'CENTRAL_ADMIN',
              accountStatus: 'ACTIVE',
              isEmailVerified: true,
              approvedAt: new Date(),
              organization: 'GovConnect Central Governance',
              employeeId: 'SYS-ADMIN-001',
            },
          });
          logger.info({ email }, 'Bootstrap: Created initial system administrator from secure environment configuration.');
        }
      }

      // 2. Ensure all existing officers and admins in DB remain ACTIVE and verified for login
      await prisma.user.updateMany({
        where: {
          role: { in: ['CENTRAL_ADMIN', 'OFFICER'] },
          OR: [
            { accountStatus: { not: 'ACTIVE' } },
            { isEmailVerified: false },
          ],
        },
        data: {
          accountStatus: 'ACTIVE',
          isEmailVerified: true,
          rejectionReason: null,
        },
      });

      logger.info('Bootstrap: Initial security authorizations verified.');
    } catch (err) {
      logger.error({ err }, 'Bootstrap: Failed to execute security authorization check');
    }
  }
}

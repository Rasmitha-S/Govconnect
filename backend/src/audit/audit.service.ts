import { prisma } from '../utils/prisma.js';
import { logger } from '../utils/logger.js';

export interface AuditLogParams {
  actorId?: string;
  actorEmail?: string;
  actorRole?: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
}

export interface SecurityEventParams {
  eventType: string;
  userId?: string;
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  severity?: 'INFO' | 'WARNING' | 'CRITICAL';
  details?: Record<string, any>;
}

export class AuditService {
  /**
   * Records an audit entry with sanitized metadata
   */
  public static async log(params: AuditLogParams): Promise<void> {
    try {
      // Sanitize details to ensure no tokens/passwords ever persist
      const sanitizedDetails = params.details ? { ...params.details } : {};
      delete sanitizedDetails.password;
      delete sanitizedDetails.passwordHash;
      delete sanitizedDetails.token;
      delete sanitizedDetails.refreshToken;
      delete sanitizedDetails.resetToken;

      await prisma.auditLog.create({
        data: {
          actorId: params.actorId || null,
          actorEmail: params.actorEmail || null,
          actorRole: params.actorRole || null,
          action: params.action,
          entity: params.entity,
          entityId: params.entityId || null,
          details: JSON.stringify(sanitizedDetails),
          ipAddress: params.ipAddress || '127.0.0.1',
        },
      });

      logger.info({ action: params.action, entity: params.entity, actor: params.actorEmail }, 'Audit log recorded');
    } catch (err) {
      logger.error({ err, action: params.action }, 'Failed to record audit log');
    }
  }

  /**
   * Records a security event
   */
  public static async logSecurityEvent(params: SecurityEventParams): Promise<void> {
    try {
      await prisma.securityEvent.create({
        data: {
          eventType: params.eventType,
          userId: params.userId || null,
          userEmail: params.userEmail || null,
          ipAddress: params.ipAddress || '127.0.0.1',
          userAgent: params.userAgent || 'GovConnect-Agent',
          severity: params.severity || 'INFO',
          details: params.details ? JSON.stringify(params.details) : null,
        },
      });
    } catch (err) {
      logger.error({ err, eventType: params.eventType }, 'Failed to record security event');
    }
  }
}

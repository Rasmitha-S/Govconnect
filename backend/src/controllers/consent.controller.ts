import { Response } from 'express';
import { prisma } from '../utils/prisma.js';
import { AuthenticatedRequest } from '../types/index.js';
import { AuditService } from '../audit/audit.service.js';

export class ConsentController {
  public static async listCitizenConsents(req: AuthenticatedRequest, res: Response): Promise<void> {
    const citizenId = req.user!.userId;

    const consents = await prisma.consent.findMany({
      where: { citizenId },
      include: {
        application: {
          include: { service: true, department: true },
        },
        history: { orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const parsedConsents = consents.map((c) => ({
      ...c,
      dataFields: JSON.parse(c.dataFields || '[]'),
    }));

    res.status(200).json({
      success: true,
      data: parsedConsents,
    });
  }

  public static async revokeConsent(req: AuthenticatedRequest, res: Response): Promise<void> {
    const citizenId = req.user!.userId;
    const { id } = req.params;
    const { reason } = req.body;

    const consent = await prisma.consent.findFirst({
      where: { id, citizenId },
      include: { application: true },
    });

    if (!consent) {
      res.status(404).json({
        success: false,
        error: { code: 'CONSENT_NOT_FOUND', message: 'Consent record not found.' },
      });
      return;
    }

    if (consent.status === 'REVOKED') {
      res.status(400).json({
        success: false,
        error: { code: 'ALREADY_REVOKED', message: 'This consent has already been revoked.' },
      });
      return;
    }

    const updated = await prisma.consent.update({
      where: { id: consent.id },
      data: {
        status: 'REVOKED',
        revokedAt: new Date(),
        history: {
          create: {
            action: 'REVOKED',
            actorId: citizenId,
            ipAddress: req.ip,
            remarks: reason || 'Revoked by citizen via Privacy & Consent portal.',
          },
        },
      },
    });

    await AuditService.log({
      actorId: citizenId,
      actorEmail: req.user!.email,
      actorRole: 'CITIZEN',
      action: 'CONSENT_REVOKED',
      entity: 'Consent',
      entityId: consent.id,
      details: { applicationId: consent.applicationId, reason },
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      data: {
        message: 'Consent revoked successfully. Inter-department data access halted.',
        consent: updated,
      },
    });
  }

  public static async getConsentAuditHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
    const citizenId = req.user!.userId;
    const { id } = req.params;

    const consent = await prisma.consent.findFirst({
      where: { id, citizenId },
      include: {
        history: { orderBy: { createdAt: 'desc' } },
        application: { include: { service: true } },
      },
    });

    if (!consent) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Consent not found.' } });
      return;
    }

    res.status(200).json({
      success: true,
      data: consent,
    });
  }
}

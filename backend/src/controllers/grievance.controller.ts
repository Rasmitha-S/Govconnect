import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { AuthenticatedRequest } from '../types/index.js';
import { AIAssistantService } from '../ai/assistant.service.js';
import { AuditService } from '../audit/audit.service.js';
import { NotificationService } from '../services/notification.service.js';

export const submitGrievanceSchema = z.object({
  description: z.string().min(10, 'Please describe your grievance in at least 10 characters'),
  category: z.string().optional(),
  departmentCode: z.string().optional(),
});

export class GrievanceController {
  public static async submitGrievance(req: AuthenticatedRequest, res: Response): Promise<void> {
    const citizenId = req.user!.userId;
    const { description, category, departmentCode } = req.body;

    // Run AI classification
    const aiClassification = await AIAssistantService.classifyGrievance(description);

    const targetDeptCode = departmentCode || aiClassification.departmentCode;
    const department = await prisma.department.findUnique({
      where: { code: targetDeptCode.toUpperCase() },
    });

    if (!department) {
      res.status(400).json({ success: false, error: { code: 'INVALID_DEPT', message: 'Target department not found' } });
      return;
    }

    const count = await prisma.grievance.count();
    const grvNumber = `GRV-2026-${String(count + 1001).padStart(5, '0')}`;

    const grievance = await prisma.grievance.create({
      data: {
        grievanceNumber: grvNumber,
        citizenId,
        departmentId: department.id,
        category: category || aiClassification.category,
        description,
        status: 'SUBMITTED',
        priority: aiClassification.priority,
      },
      include: { department: true },
    });

    await NotificationService.notifyUser(
      citizenId,
      'Grievance Registered',
      `Your grievance ${grvNumber} has been registered and routed to ${department.name}.`,
      'GRIEVANCE_UPDATED'
    );

    await AuditService.log({
      actorId: citizenId,
      actorRole: 'CITIZEN',
      action: 'GRIEVANCE_SUBMITTED',
      entity: 'Grievance',
      entityId: grievance.id,
      details: { grvNumber, category: grievance.category, dept: department.code },
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      data: {
        grievance,
        aiRouting: {
          confidenceScore: aiClassification.confidenceScore,
          extractedSummary: aiClassification.extractedSummary,
          estimatedDays: aiClassification.estimatedResolutionDays,
        },
      },
    });
  }

  public static async listCitizenGrievances(req: AuthenticatedRequest, res: Response): Promise<void> {
    const citizenId = req.user!.userId;

    const grievances = await prisma.grievance.findMany({
      where: { citizenId },
      include: { department: true },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      data: grievances,
    });
  }

  public static async listDepartmentGrievances(req: AuthenticatedRequest, res: Response): Promise<void> {
    const officerDeptId = req.user!.departmentId;

    const where: any = {};
    if (req.user!.role === 'OFFICER') {
      where.departmentId = officerDeptId;
    }

    const grievances = await prisma.grievance.findMany({
      where,
      include: {
        department: true,
        citizen: { include: { citizenProfile: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      data: grievances,
    });
  }

  public static async resolveGrievance(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const { resolutionRemarks, status } = req.body;
    const officer = req.user!;

    const grievance = await prisma.grievance.findUnique({
      where: { id },
      include: { department: true },
    });

    if (!grievance) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Grievance not found' } });
      return;
    }

    if (officer.role === 'OFFICER' && officer.departmentId !== grievance.departmentId) {
      res.status(403).json({
        success: false,
        error: { code: 'DEPARTMENT_MISMATCH', message: 'Cannot action grievance for other departments.' },
      });
      return;
    }

    const updated = await prisma.grievance.update({
      where: { id },
      data: {
        status: status || 'RESOLVED',
        resolutionRemarks,
        resolvedAt: new Date(),
        assignedOfficerId: officer.userId,
      },
    });

    await NotificationService.notifyUser(
      grievance.citizenId,
      'Grievance Resolved',
      `Your grievance ${grievance.grievanceNumber} has been resolved: ${resolutionRemarks}`,
      'GRIEVANCE_UPDATED'
    );

    await AuditService.log({
      actorId: officer.userId,
      actorRole: 'OFFICER',
      action: 'GRIEVANCE_RESOLVED',
      entity: 'Grievance',
      entityId: id,
      details: { resolutionRemarks },
    });

    res.status(200).json({
      success: true,
      data: updated,
    });
  }
}

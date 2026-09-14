import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { AuthenticatedRequest } from '../types/index.js';
import { WorkflowService } from '../workflows/workflow.service.js';
import { AuditService } from '../audit/audit.service.js';

export const officerDecisionSchema = z.object({
  decision: z.enum(['APPROVE', 'REJECT', 'REQUEST_CLARIFICATION']),
  remarks: z.string().min(2, 'Remarks are required for audit trail'),
});

export class OfficerController {
  /**
   * List applications strictly isolated to the Officer's assigned department
   */
  public static async listDepartmentApplications(req: AuthenticatedRequest, res: Response): Promise<void> {
    const officerDeptId = req.user!.departmentId;
    const { status, search } = req.query;

    if (!officerDeptId && req.user!.role !== 'CENTRAL_ADMIN') {
      res.status(403).json({
        success: false,
        error: { code: 'NO_DEPARTMENT', message: 'Officer has no assigned department.' },
      });
      return;
    }

    const where: any = {};

    // Department Isolation
    if (req.user!.role === 'OFFICER') {
      where.departmentId = officerDeptId;
    }

    if (status) {
      where.status = String(status);
    }

    if (search) {
      const q = String(search).toLowerCase();
      where.OR = [
        { applicationNumber: { contains: q } },
        { service: { name: { contains: q } } },
        { citizen: { citizenProfile: { fullName: { contains: q } } } },
      ];
    }

    const applications = await prisma.application.findMany({
      where,
      include: {
        service: true,
        department: true,
        citizen: { include: { citizenProfile: true } },
        workflow: { include: { steps: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const parsed = applications.map((a) => ({
      ...a,
      rawFormData: JSON.parse(a.rawFormData || '{}'),
      standardizedData: a.standardizedData ? JSON.parse(a.standardizedData) : null,
    }));

    res.status(200).json({
      success: true,
      data: parsed,
    });
  }

  /**
   * Process Officer Decision (Approve / Reject / Clarify)
   */
  public static async processDecision(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const { decision, remarks } = req.body;
    const officer = req.user!;

    const application = await prisma.application.findFirst({
      where: { OR: [{ id }, { applicationNumber: id }] },
      include: { department: true },
    });

    if (!application) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Application not found' } });
      return;
    }

    // Strict Department Boundary Enforcement
    if (officer.role === 'OFFICER' && officer.departmentId !== application.departmentId) {
      await AuditService.logSecurityEvent({
        eventType: 'UNAUTHORIZED_DEPT_ACCESS',
        userId: officer.userId,
        userEmail: officer.email,
        severity: 'WARNING',
        details: {
          attemptedAppDept: application.department.code,
          officerDept: officer.departmentCode,
        },
      });

      res.status(403).json({
        success: false,
        error: {
          code: 'DEPARTMENT_MISMATCH_FORBIDDEN',
          message: `Department Isolation: You belong to ${officer.departmentCode}, but this application belongs to ${application.department.code}.`,
        },
      });
      return;
    }

    if (decision === 'APPROVE') {
      await WorkflowService.officerApprove(application.id, officer.userId, officer.fullName, remarks);
    } else if (decision === 'REJECT') {
      await WorkflowService.officerReject(application.id, officer.userId, officer.fullName, remarks);
    } else {
      // Clarification requested
      await prisma.application.update({
        where: { id: application.id },
        data: {
          currentStep: `Clarification Requested: ${remarks}`,
          officerRemarks: remarks,
        },
      });

      await prisma.applicationStatusHistory.create({
        data: {
          applicationId: application.id,
          fromStatus: application.status,
          toStatus: application.status,
          changedById: officer.userId,
          changedByName: officer.fullName,
          remarks: `Clarification requested: ${remarks}`,
        },
      });
    }

    const updatedApp = await prisma.application.findUnique({
      where: { id: application.id },
      include: { workflow: { include: { steps: true } }, statusHistory: true },
    });

    res.status(200).json({
      success: true,
      data: {
        message: `Application ${decision.toLowerCase()}d successfully.`,
        application: updatedApp,
      },
    });
  }

  /**
   * Officer Department Dashboard summary stats
   */
  public static async getDepartmentStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    const officerDeptId = req.user!.departmentId;

    if (!officerDeptId) {
      res.status(403).json({ success: false, error: { code: 'NO_DEPARTMENT', message: 'No department assigned.' } });
      return;
    }

    const [total, pending, approved, rejected, completed, grievances] = await Promise.all([
      prisma.application.count({ where: { departmentId: officerDeptId } }),
      prisma.application.count({ where: { departmentId: officerDeptId, status: 'PENDING_APPROVAL' } }),
      prisma.application.count({ where: { departmentId: officerDeptId, status: 'APPROVED' } }),
      prisma.application.count({ where: { departmentId: officerDeptId, status: 'REJECTED' } }),
      prisma.application.count({ where: { departmentId: officerDeptId, status: 'COMPLETED' } }),
      prisma.grievance.count({ where: { departmentId: officerDeptId, status: { in: ['SUBMITTED', 'IN_PROGRESS'] } } }),
    ]);

    const department = await prisma.department.findUnique({ where: { id: officerDeptId } });

    res.status(200).json({
      success: true,
      data: {
        department,
        counts: {
          total,
          pending,
          approved,
          rejected,
          completed,
          openGrievances: grievances,
        },
      },
    });
  }
}

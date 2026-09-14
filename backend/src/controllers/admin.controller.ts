import { Response } from 'express';
import { prisma } from '../utils/prisma.js';
import { AuthenticatedRequest } from '../types/index.js';

/**
 * GovConnect Platform Governance & Admin Controller
 */

export class AdminController {
  /**
   * Returns live platform KPI metrics and analytics for Central Admin dashboard
   */
  public static async getMetrics(req: AuthenticatedRequest, res: Response): Promise<void> {
    const [
      totalCitizens,
      totalOfficers,
      totalDepartments,
      totalApplications,
      activeWorkflows,
      completedApplications,
      rejectedApplications,
      connectors,
      recentAuditLogs,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'CITIZEN' } }),
      prisma.user.count({ where: { role: 'OFFICER' } }),
      prisma.department.count({ where: { active: true } }),
      prisma.application.count(),
      prisma.application.count({ where: { status: { in: ['SUBMITTED', 'UNDER_VERIFICATION', 'CROSS_DEPARTMENT_CHECK', 'PENDING_APPROVAL', 'APPROVED'] } } }),
      prisma.application.count({ where: { status: 'COMPLETED' } }),
      prisma.application.count({ where: { status: 'REJECTED' } }),
      prisma.connector.findMany(),
      prisma.auditLog.findMany({ take: 10, orderBy: { createdAt: 'desc' } }),
    ]);

    // Group applications by Department
    const appsByDept = await prisma.application.groupBy({
      by: ['departmentId'],
      _count: { id: true },
    });

    const depts = await prisma.department.findMany();
    const departmentChartData = depts.map((d) => {
      const match = appsByDept.find((a) => a.departmentId === d.id);
      return {
        department: d.name,
        code: d.code,
        count: match ? match._count.id : 0,
      };
    });

    // Group applications by Status
    const appsByStatus = await prisma.application.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    const statusChartData = appsByStatus.map((s) => ({
      status: s.status,
      count: s._count.id,
    }));

    // Connector health summaries
    const connectorStats = connectors.map((c) => ({
      code: c.code,
      name: c.name,
      type: c.type,
      status: c.status,
      healthStatus: c.healthStatus,
      avgLatencyMs: c.avgLatencyMs,
      totalRequests: c.totalRequests,
      errorCount: c.errorCount,
      failureRate: c.failureRate,
      lastHealthCheck: c.lastHealthCheck,
    }));

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalCitizens,
          totalOfficers,
          totalDepartments,
          totalApplications,
          activeWorkflows,
          completedApplications,
          rejectedApplications,
          successRatePercentage:
            totalApplications > 0
              ? Math.round((completedApplications / totalApplications) * 100)
              : 100,
        },
        charts: {
          departmentDistribution: departmentChartData,
          statusDistribution: statusChartData,
          connectorPerformance: connectorStats,
        },
        recentActivity: recentAuditLogs.map((l) => ({
          ...l,
          details: l.details ? JSON.parse(l.details) : {},
        })),
      },
    });
  }

  /**
   * Searchable & filterable Audit Logs
   */
  public static async getAuditLogs(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { action, entity, search, limit = '50', page = '1' } = req.query;

    const take = parseInt(String(limit), 10);
    const skip = (parseInt(String(page), 10) - 1) * take;

    const where: any = {};
    if (action) where.action = { contains: String(action) };
    if (entity) where.entity = { contains: String(entity) };
    if (search) {
      where.OR = [
        { actorEmail: { contains: String(search) } },
        { action: { contains: String(search) } },
        { entity: { contains: String(search) } },
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        take,
        skip,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditLog.count({ where }),
    ]);

    const parsedLogs = logs.map((l) => ({
      ...l,
      details: l.details ? JSON.parse(l.details) : {},
    }));

    res.status(200).json({
      success: true,
      data: parsedLogs,
      meta: {
        total,
        page: parseInt(String(page), 10),
        limit: take,
      },
    });
  }

  /**
   * List all system users with roles and profiles
   */
  public static async listUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    const users = await prisma.user.findMany({
      include: {
        citizenProfile: true,
        officerProfile: { include: { department: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      data: users.map((u) => ({
        id: u.id,
        email: u.email,
        role: u.role,
        accountStatus: u.accountStatus,
        organization: u.organization,
        employeeId: u.employeeId,
        isEmailVerified: u.isEmailVerified,
        fullName: u.officerProfile?.fullName || u.citizenProfile?.fullName || 'User',
        department: u.officerProfile?.department,
        createdAt: u.createdAt,
      })),
    });
  }

  /**
   * Retrieve Officer and Central Administrator registration requests
   */
  public static async getRegistrationRequests(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { status } = req.query;

    const where: any = {
      role: { in: ['OFFICER', 'CENTRAL_ADMIN'] },
    };

    if (status && status !== 'ALL') {
      where.accountStatus = String(status);
    }

    const requests = await prisma.user.findMany({
      where,
      include: {
        officerProfile: { include: { department: true } },
        citizenProfile: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      data: requests.map((u) => ({
        id: u.id,
        fullName: u.officerProfile?.fullName || u.citizenProfile?.fullName || 'Administrator Applicant',
        email: u.email,
        role: u.role,
        accountStatus: u.accountStatus,
        organization: u.organization || u.officerProfile?.department.name,
        department: u.officerProfile?.department,
        employeeId: u.employeeId || u.officerProfile?.employeeCode,
        designation: u.officerProfile?.designation,
        isEmailVerified: u.isEmailVerified,
        approvedAt: u.approvedAt,
        rejectionReason: u.rejectionReason,
        createdAt: u.createdAt,
      })),
    });
  }

  /**
   * Approve a pending Officer or Administrator registration request
   */
  public static async approveRegistrationRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { userId } = req.params;

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { officerProfile: { include: { department: true } } },
    });

    if (!targetUser) {
      res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'Registration request user not found.' },
      });
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        accountStatus: 'ACTIVE',
        isEmailVerified: true,
        approvedAt: new Date(),
        approvedById: req.user!.userId,
        rejectionReason: null,
      },
      include: { officerProfile: { include: { department: true } }, citizenProfile: true },
    });

    // Create Notification
    await prisma.notification.create({
      data: {
        userId: updatedUser.id,
        title: 'Registration Approved',
        message: `Your ${updatedUser.role === 'OFFICER' ? 'Department Officer' : 'Central Administrator'} account has been verified and activated.`,
        type: 'APPROVAL_REQUIRED',
      },
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        actorId: req.user!.userId,
        actorEmail: req.user!.email,
        actorRole: req.user!.role,
        action: updatedUser.role === 'OFFICER' ? 'OFFICER_REGISTRATION_APPROVED' : 'ADMIN_REGISTRATION_APPROVED',
        entity: 'User',
        entityId: updatedUser.id,
        details: JSON.stringify({
          approvedUserEmail: updatedUser.email,
          role: updatedUser.role,
          department: updatedUser.officerProfile?.department.name || updatedUser.organization,
        }),
        ipAddress: req.ip,
      },
    });

    res.status(200).json({
      success: true,
      data: {
        message: 'Account registration approved successfully.',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          role: updatedUser.role,
          accountStatus: updatedUser.accountStatus,
          approvedAt: updatedUser.approvedAt,
        },
      },
    });
  }

  /**
   * Reject a pending Officer or Administrator registration request
   */
  public static async rejectRegistrationRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { userId } = req.params;
    const { reason } = req.body;

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { officerProfile: true },
    });

    if (!targetUser) {
      res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'Registration request user not found.' },
      });
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        accountStatus: 'REJECTED',
        rejectionReason: reason || 'Application rejected by platform administrator.',
      },
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        actorId: req.user!.userId,
        actorEmail: req.user!.email,
        actorRole: req.user!.role,
        action: targetUser.role === 'OFFICER' ? 'OFFICER_REGISTRATION_REJECTED' : 'ADMIN_REGISTRATION_REJECTED',
        entity: 'User',
        entityId: updatedUser.id,
        details: JSON.stringify({
          rejectedUserEmail: targetUser.email,
          role: targetUser.role,
          reason: updatedUser.rejectionReason,
        }),
        ipAddress: req.ip,
      },
    });

    res.status(200).json({
      success: true,
      data: {
        message: 'Account registration rejected.',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          role: updatedUser.role,
          accountStatus: updatedUser.accountStatus,
          rejectionReason: updatedUser.rejectionReason,
        },
      },
    });
  }
}

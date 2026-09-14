import { Request, Response } from 'express';
import { prisma } from '../utils/prisma.js';

export class ServiceController {
  public static async listServices(req: Request, res: Response): Promise<void> {
    const { category, department, search, supportedOnly } = req.query;

    const where: any = {};

    if (category) {
      where.category = { name: { contains: String(category) } };
    }

    if (department) {
      where.department = { code: String(department).toUpperCase() };
    }

    if (supportedOnly === 'true') {
      where.govconnectSupported = true;
    }

    if (search) {
      const q = String(search).toLowerCase();
      where.OR = [
        { name: { contains: q } },
        { description: { contains: q } },
        { eligibility: { contains: q } },
      ];
    }

    const services = await prisma.service.findMany({
      where,
      include: {
        category: true,
        department: true,
      },
      orderBy: { name: 'asc' },
    });

    const parsedServices = services.map((s) => ({
      ...s,
      requiredDocuments: JSON.parse(s.requiredDocuments || '[]'),
      steps: JSON.parse(s.steps || '[]'),
    }));

    res.status(200).json({
      success: true,
      data: parsedServices,
    });
  }

  public static async getServiceById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    const service = await prisma.service.findFirst({
      where: {
        OR: [{ id }, { serviceCode: id.toUpperCase() }],
      },
      include: {
        category: true,
        department: true,
      },
    });

    if (!service) {
      res.status(404).json({
        success: false,
        error: { code: 'SERVICE_NOT_FOUND', message: 'Requested service does not exist.' },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        ...service,
        requiredDocuments: JSON.parse(service.requiredDocuments || '[]'),
        steps: JSON.parse(service.steps || '[]'),
      },
    });
  }

  public static async listCategories(req: Request, res: Response): Promise<void> {
    const categories = await prisma.serviceCategory.findMany({
      include: { _count: { select: { services: true } } },
      orderBy: { name: 'asc' },
    });

    res.status(200).json({
      success: true,
      data: categories,
    });
  }

  public static async listDepartments(req: Request, res: Response): Promise<void> {
    const departments = await prisma.department.findMany({
      where: { active: true },
      include: { _count: { select: { services: true } } },
      orderBy: { name: 'asc' },
    });

    res.status(200).json({
      success: true,
      data: departments,
    });
  }
}

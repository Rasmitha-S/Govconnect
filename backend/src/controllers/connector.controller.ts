import { Request, Response } from 'express';
import { prisma } from '../utils/prisma.js';
import { ConnectorRegistry } from '../connectors/connector.registry.js';
import { AuditService } from '../audit/audit.service.js';
import { AuthenticatedRequest } from '../types/index.js';

export class ConnectorController {
  public static async listConnectors(req: Request, res: Response): Promise<void> {
    const connectors = await prisma.connector.findMany({
      include: {
        _count: { select: { requests: true } },
      },
      orderBy: { code: 'asc' },
    });

    const registry = ConnectorRegistry.getInstance();
    const digilocker = registry.getConnector('DIGILOCKER') as any;
    const digilockerMode = digilocker?.getIntegrationMode?.() || 'REPRESENTATIVE';

    const enriched = connectors.map((c) => {
      if (c.code === 'DIGILOCKER') {
        return {
          ...c,
          integrationMode: digilockerMode,
          isRepresentative: digilockerMode === 'REPRESENTATIVE',
        };
      }
      return c;
    });

    res.status(200).json({
      success: true,
      data: enriched,
    });
  }

  public static async getConnectorHealth(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    const connector = await prisma.connector.findFirst({
      where: { OR: [{ id }, { code: id.toUpperCase() }] },
      include: {
        requests: {
          take: 20,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!connector) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Connector not found' } });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        ...connector,
        requests: connector.requests.map((r) => ({
          ...r,
          requestPayload: r.requestPayload ? JSON.parse(r.requestPayload) : null,
          responsePayload: r.responsePayload ? JSON.parse(r.responsePayload) : null,
        })),
      },
    });
  }

  public static async triggerHealthCheck(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const registry = ConnectorRegistry.getInstance();
    const connInstance = registry.getConnector(id);

    if (!connInstance) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Connector not registered in runtime' } });
      return;
    }

    const healthResult = await connInstance.healthCheck();

    await prisma.connector.update({
      where: { code: connInstance.code },
      data: {
        healthStatus: healthResult.success ? 'OPERATIONAL' : 'DEGRADED_OR_OFFLINE',
        lastHealthCheck: new Date(),
      },
    });

    res.status(200).json({
      success: true,
      data: healthResult,
    });
  }

  public static async setFailureSimulation(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const { status, failureRate } = req.body; // 'HEALTHY' | 'DEGRADED' | 'OFFLINE'

    const registry = ConnectorRegistry.getInstance();
    const updated = await registry.setConnectorSimulationStatus(id, status, failureRate);

    await AuditService.log({
      actorId: req.user?.userId,
      actorRole: req.user?.role,
      action: 'CONNECTOR_SIMULATION_CHANGED',
      entity: 'Connector',
      entityId: updated.id,
      details: { code: updated.code, newStatus: status, failureRate },
    });

    res.status(200).json({
      success: true,
      data: {
        message: `Connector ${updated.name} simulation state updated to ${status}.`,
        connector: updated,
      },
    });
  }
}

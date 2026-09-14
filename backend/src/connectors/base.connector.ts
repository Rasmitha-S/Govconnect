import { prisma } from '../utils/prisma.js';
import { logger } from '../utils/logger.js';

export interface ExternalApplicationStatus {
  externalReferenceId: string;
  externalStatus: string;
  externalPlatform: string;
  platformName: string;
  statusDescription?: string;
  lastUpdated?: string;
  metadata?: Record<string, any>;
  isRepresentative: boolean;
}

export interface ConnectorResult<T = any> {
  success: boolean;
  statusCode: number;
  data?: T;
  rawResponse?: any;
  error?: string;
  latencyMs: number;
  connectorCode?: string;
  connectorName: string;
  platformName: string;
  timestamp: string;
}

export abstract class BaseGovernmentConnector {
  public abstract readonly code: string;
  public abstract readonly name: string;
  public abstract readonly platformName: string;
  public abstract readonly type: 'REST' | 'SOAP_LEGACY' | 'DATABASE_DIRECT' | 'FEDERATED_GATEWAY';
  public abstract readonly description: string;
  public abstract readonly purpose: string;
  public abstract readonly capabilities: string[];

  protected baseLatencyMs: number = 120;

  /**
   * Simulates realistic network transmission and platform processing latency
   */
  protected async simulateLatency(jitterRange = 50): Promise<number> {
    const jitter = Math.floor(Math.random() * jitterRange) - jitterRange / 2;
    const duration = Math.max(30, this.baseLatencyMs + jitter);
    await new Promise((resolve) => setTimeout(resolve, duration));
    return duration;
  }

  /**
   * Evaluates if connector is configured as degraded or offline for reliability testing
   */
  protected async checkHealthAndReliability(): Promise<{ isHealthy: boolean; status: string; failureRate: number }> {
    try {
      const record = await prisma.connector.findUnique({
        where: { code: this.code },
      });

      if (!record) {
        return { isHealthy: true, status: 'HEALTHY', failureRate: 0.0 };
      }

      if (record.status === 'OFFLINE') {
        return { isHealthy: false, status: 'OFFLINE', failureRate: 1.0 };
      }

      if (record.failureRate > 0 && Math.random() < record.failureRate) {
        return { isHealthy: false, status: 'DEGRADED', failureRate: record.failureRate };
      }

      return { isHealthy: true, status: record.status, failureRate: record.failureRate };
    } catch {
      return { isHealthy: true, status: 'HEALTHY', failureRate: 0.0 };
    }
  }

  /**
   * Records transaction metric into database audit trail
   */
  protected async recordTransaction(
    applicationId: string | undefined,
    operation: string,
    requestPayload: any,
    responsePayload: any,
    statusCode: number,
    latencyMs: number,
    success: boolean,
    errorMessage?: string
  ): Promise<void> {
    try {
      const connector = await prisma.connector.findUnique({
        where: { code: this.code },
      });

      if (!connector) return;

      const newTotal = connector.totalRequests + 1;
      const newErrors = success ? connector.errorCount : connector.errorCount + 1;
      const newAvgLatency = Math.round((connector.avgLatencyMs * connector.totalRequests + latencyMs) / newTotal);

      await prisma.connector.update({
        where: { id: connector.id },
        data: {
          totalRequests: newTotal,
          errorCount: newErrors,
          avgLatencyMs: newAvgLatency,
          lastHealthCheck: new Date(),
        },
      });

      await prisma.connectorRequest.create({
        data: {
          connectorId: connector.id,
          applicationId: applicationId || null,
          operation,
          requestPayload: JSON.stringify(requestPayload),
          responsePayload: JSON.stringify(responsePayload),
          statusCode,
          latencyMs,
          success,
          errorMessage: errorMessage || null,
        },
      });
    } catch (err: any) {
      logger.error({ err, connector: this.code }, 'Failed to record connector transaction metric');
    }
  }

  public abstract healthCheck(): Promise<ConnectorResult>;

  /**
   * Retrieves application tracking status from the configured external government system.
   * Representative adapters return mock status models for demonstration.
   */
  public async getApplicationStatus(
    externalReferenceId: string,
    applicationId?: string
  ): Promise<ConnectorResult<ExternalApplicationStatus>> {
    const latency = await this.simulateLatency(40);
    const { isHealthy, status } = await this.checkHealthAndReliability();

    const requestPayload = { operation: 'GET_APPLICATION_STATUS', externalReferenceId };

    if (!isHealthy) {
      await this.recordTransaction(
        applicationId,
        'GET_APPLICATION_STATUS',
        requestPayload,
        { error: status },
        503,
        latency,
        false,
        status
      );
      return {
        success: false,
        statusCode: 503,
        error: `${this.platformName} is temporarily unavailable (${status})`,
        latencyMs: latency,
        connectorCode: this.code,
        connectorName: this.name,
        platformName: this.platformName,
        timestamp: new Date().toISOString(),
      };
    }

    const statusData: ExternalApplicationStatus = {
      externalReferenceId,
      externalStatus: 'UNDER_VERIFICATION',
      externalPlatform: this.code,
      platformName: this.platformName,
      statusDescription: `Application is currently in processing queue at ${this.platformName}.`,
      lastUpdated: new Date().toISOString(),
      isRepresentative: true,
    };

    await this.recordTransaction(
      applicationId,
      'GET_APPLICATION_STATUS',
      requestPayload,
      statusData,
      200,
      latency,
      true
    );

    return {
      success: true,
      statusCode: 200,
      latencyMs: latency,
      connectorCode: this.code,
      connectorName: this.name,
      platformName: this.platformName,
      timestamp: new Date().toISOString(),
      data: statusData,
    };
  }
}

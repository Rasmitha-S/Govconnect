import { BaseGovernmentConnector, ConnectorResult } from './base.connector.js';

export class UmangConnector extends BaseGovernmentConnector {
  public readonly code = 'UMANG';
  public readonly name = 'India.gov.in / UMANG Connector';
  public readonly platformName = 'National Single Access Portal (India.gov.in / UMANG - MeitY)';
  public readonly type = 'REST' as const;
  public readonly description = 'National Centralized Multi-Agency Government Service Directory & Routing Bridge';
  public readonly purpose = 'Government service discovery and access';
  public readonly capabilities = ['service discovery', 'service categorization', 'service routing', 'application access information'];

  protected baseLatencyMs = 125;

  public async healthCheck(): Promise<ConnectorResult> {
    const latency = await this.simulateLatency();
    const { isHealthy, status } = await this.checkHealthAndReliability();

    return {
      success: isHealthy,
      statusCode: isHealthy ? 200 : 503,
      latencyMs: latency,
      connectorName: this.name,
      platformName: this.platformName,
      timestamp: new Date().toISOString(),
      data: {
        platform: this.platformName,
        status,
        integratedServicesCount: 2200,
        participatingMinistriesCount: 140,
      },
    };
  }

  public async queryCentralCatalog(category: string, applicationId?: string): Promise<ConnectorResult> {
    const latency = await this.simulateLatency(60);
    const { isHealthy, status } = await this.checkHealthAndReliability();

    const requestPayload = { operation: 'QUERY_CENTRAL_CATALOG', category };

    if (!isHealthy) {
      await this.recordTransaction(applicationId, 'QUERY_CENTRAL_CATALOG', requestPayload, { error: status }, 503, latency, false, status);
      return {
        success: false,
        statusCode: 503,
        error: `UMANG gateway unavailable (${status})`,
        latencyMs: latency,
        connectorName: this.name,
        platformName: this.platformName,
        timestamp: new Date().toISOString(),
      };
    }

    const catalogData = {
      source: 'National Unified Service Index',
      category: category || 'ALL',
      routing_available: true,
      last_sync: new Date().toISOString(),
    };

    await this.recordTransaction(applicationId, 'QUERY_CENTRAL_CATALOG', requestPayload, catalogData, 200, latency, true);

    return {
      success: true,
      statusCode: 200,
      data: catalogData,
      latencyMs: latency,
      connectorName: this.name,
      platformName: this.platformName,
      timestamp: new Date().toISOString(),
    };
  }
}

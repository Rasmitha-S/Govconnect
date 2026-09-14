import { BaseGovernmentConnector, ConnectorResult } from './base.connector.js';

export class AbdmConnector extends BaseGovernmentConnector {
  public readonly code = 'ABDM';
  public readonly name = 'ABDM Connector';
  public readonly platformName = 'Ayushman Bharat Digital Mission (ABDM)';
  public readonly type = 'REST' as const;
  public readonly description = 'National Health Authority Health ID (ABHA) & Consent-Aware Health Information Exchange Gateway';
  public readonly purpose = 'Health records and health services';
  public readonly capabilities = ['health-service discovery', 'health record-related workflow abstraction', 'consent-aware health information exchange', 'service routing'];

  protected baseLatencyMs = 150;

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
        abhaGatewayStatus: isHealthy ? 'OPERATIONAL' : 'OFFLINE',
        hiuHipNodesActive: 38400,
      },
    };
  }

  public async verifyAbhaEligibility(abhaId: string, citizenId: string, applicationId?: string): Promise<ConnectorResult> {
    const latency = await this.simulateLatency(80);
    const { isHealthy, status } = await this.checkHealthAndReliability();

    const requestPayload = { operation: 'VERIFY_ABHA_ELIGIBILITY', abha_id: abhaId, citizen_id: citizenId };

    if (!isHealthy) {
      await this.recordTransaction(applicationId, 'VERIFY_ABHA_ELIGIBILITY', requestPayload, { error: status }, 503, latency, false, status);
      return {
        success: false,
        statusCode: 503,
        error: `ABDM Gateway unavailable (${status})`,
        latencyMs: latency,
        connectorName: this.name,
        platformName: this.platformName,
        timestamp: new Date().toISOString(),
      };
    }

    const representativeHealthData = {
      abha_reference: abhaId || '91-8420-1920-4819',
      scheme_enrolled: 'PM-JAY / Chief Minister Comprehensive Health Insurance Scheme (CMCHIS)',
      coverage_status: 'ACTIVE_ELIGIBLE',
      annual_family_limit_inr: 500000,
      empaneled_hospitals_count: 2450,
      verified_at: new Date().toISOString(),
    };

    await this.recordTransaction(applicationId, 'VERIFY_ABHA_ELIGIBILITY', requestPayload, representativeHealthData, 200, latency, true);

    return {
      success: true,
      statusCode: 200,
      data: representativeHealthData,
      latencyMs: latency,
      connectorName: this.name,
      platformName: this.platformName,
      timestamp: new Date().toISOString(),
    };
  }
}

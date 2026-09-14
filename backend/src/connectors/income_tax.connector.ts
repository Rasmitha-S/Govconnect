import { BaseGovernmentConnector, ConnectorResult } from './base.connector.js';

export class IncomeTaxConnector extends BaseGovernmentConnector {
  public readonly code = 'INCOME_TAX';
  public readonly name = 'Income Tax Connector';
  public readonly platformName = 'Income Tax Department e-Filing & PAN Verification System (CBDT)';
  public readonly type = 'REST' as const;
  public readonly description = 'Permanent Account Number (PAN) Validation, Tax Exemption & Form 26AS Bridge';
  public readonly purpose = 'PAN and tax-related services';
  public readonly capabilities = ['tax-service discovery', 'PAN-related service routing', 'tax-service application/status abstraction'];

  protected baseLatencyMs = 130;

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
        tinNsdlBridgeStatus: isHealthy ? 'OPERATIONAL' : 'OFFLINE',
        activePanRecordsVerified: 680000000,
      },
    };
  }

  public async verifyPanStatus(panNumber: string, fullName: string, applicationId?: string): Promise<ConnectorResult> {
    const latency = await this.simulateLatency(60);
    const { isHealthy, status } = await this.checkHealthAndReliability();

    const requestPayload = { operation: 'VERIFY_PAN_STATUS', pan_masked: panNumber ? `${panNumber.slice(0, 2)}XXXXX${panNumber.slice(-1)}` : 'ABCXXXXX1F' };

    if (!isHealthy) {
      await this.recordTransaction(applicationId, 'VERIFY_PAN_STATUS', requestPayload, { error: status }, 503, latency, false, status);
      return {
        success: false,
        statusCode: 503,
        error: `Income Tax Department e-Filing system unavailable (${status})`,
        latencyMs: latency,
        connectorName: this.name,
        platformName: this.platformName,
        timestamp: new Date().toISOString(),
      };
    }

    const panData = {
      pan_masked: 'ABCXXXXX1F',
      name_match: true,
      pan_status: 'EXISTING_AND_OPERATIVE',
      aadhaar_seeding_status: 'LINKED_VERIFIED',
      taxpayer_category: 'INDIVIDUAL',
      verified_at: new Date().toISOString(),
    };

    await this.recordTransaction(applicationId, 'VERIFY_PAN_STATUS', requestPayload, panData, 200, latency, true);

    return {
      success: true,
      statusCode: 200,
      data: panData,
      latencyMs: latency,
      connectorName: this.name,
      platformName: this.platformName,
      timestamp: new Date().toISOString(),
    };
  }
}

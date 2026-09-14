import { BaseGovernmentConnector, ConnectorResult } from './base.connector.js';

export class EShramConnector extends BaseGovernmentConnector {
  public readonly code = 'E_SHRAM';
  public readonly name = 'e-Shram Connector';
  public readonly platformName = 'National Database of Unorganised Workers (e-Shram / MoLE)';
  public readonly type = 'REST' as const;
  public readonly description = 'National Unorganised Workers Database & Universal Account (UAN) Registration Gateway';
  public readonly purpose = 'Worker registration and services';
  public readonly capabilities = ['worker service discovery', 'registration workflow abstraction', 'service routing', 'status lookup abstraction'];

  protected baseLatencyMs = 135;

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
        registeredWorkersEstimate: 290000000,
        socialSecuritySchemesIntegrated: 14,
      },
    };
  }

  public async checkWorkerRegistration(aadhaarRef: string, applicationId?: string): Promise<ConnectorResult> {
    const latency = await this.simulateLatency(70);
    const { isHealthy, status } = await this.checkHealthAndReliability();

    const requestPayload = { operation: 'LOOKUP_WORKER_UAN', uid_ref: aadhaarRef };

    if (!isHealthy) {
      await this.recordTransaction(applicationId, 'LOOKUP_WORKER_UAN', requestPayload, { error: status }, 503, latency, false, status);
      return {
        success: false,
        statusCode: 503,
        error: `e-Shram service unavailable (${status})`,
        latencyMs: latency,
        connectorName: this.name,
        platformName: this.platformName,
        timestamp: new Date().toISOString(),
      };
    }

    const workerData = {
      uan_card_number: '12-9840-2019-4819',
      primary_occupation: 'Construction / Municipal Services',
      accident_insurance_status: 'PMSBY_ACTIVE_2_LAKHS',
      registration_date: '2024-03-12',
      verification_status: 'AADHAAR_AUTHENTICATED',
    };

    await this.recordTransaction(applicationId, 'LOOKUP_WORKER_UAN', requestPayload, workerData, 200, latency, true);

    return {
      success: true,
      statusCode: 200,
      data: workerData,
      latencyMs: latency,
      connectorName: this.name,
      platformName: this.platformName,
      timestamp: new Date().toISOString(),
    };
  }
}

import { BaseGovernmentConnector, ConnectorResult } from './base.connector.js';

export class TnESevaiConnector extends BaseGovernmentConnector {
  public readonly code = 'TN_ESEVAI';
  public readonly name = 'Tamil Nadu e-Sevai Connector';
  public readonly platformName = 'Tamil Nadu e-Governance Agency (TNeGA) e-Sevai';
  public readonly type = 'REST' as const;
  public readonly description = 'Citizen Service Gateway for Tamil Nadu e-Sevai State Services';
  public readonly purpose = 'Multiple citizen services';
  public readonly capabilities = ['service discovery', 'service routing', 'application reference', 'status lookup'];

  protected baseLatencyMs = 140;

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
        eSevaiCentersActive: 12450,
        integratedDepartmentServices: 180,
      },
    };
  }

  public async lookupServiceReference(appRefNo: string, applicationId?: string): Promise<ConnectorResult> {
    const latency = await this.simulateLatency(70);
    const { isHealthy, status } = await this.checkHealthAndReliability();

    const requestPayload = { operation: 'LOOKUP_ESEVAI_REF', app_ref_no: appRefNo };

    if (!isHealthy) {
      await this.recordTransaction(applicationId, 'LOOKUP_ESEVAI_REF', requestPayload, { error: status }, 503, latency, false, status);
      return {
        success: false,
        statusCode: 503,
        error: `e-Sevai gateway unavailable (${status})`,
        latencyMs: latency,
        connectorName: this.name,
        platformName: this.platformName,
        timestamp: new Date().toISOString(),
      };
    }

    const resData = {
      esevai_reference: appRefNo,
      issuing_agency: 'Revenue & Disaster Management Department (TNeGA)',
      service_name: 'Community / Income / Nativity Certificate',
      current_status: 'DISPATCHED_TO_TAHSILDAR',
      updated_at: new Date().toISOString(),
    };

    await this.recordTransaction(applicationId, 'LOOKUP_ESEVAI_REF', requestPayload, resData, 200, latency, true);

    return {
      success: true,
      statusCode: 200,
      data: resData,
      latencyMs: latency,
      connectorName: this.name,
      platformName: this.platformName,
      timestamp: new Date().toISOString(),
    };
  }
}

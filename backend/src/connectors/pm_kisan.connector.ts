import { BaseGovernmentConnector, ConnectorResult } from './base.connector.js';

export class PmKisanConnector extends BaseGovernmentConnector {
  public readonly code = 'PM_KISAN';
  public readonly name = 'PM-KISAN Connector';
  public readonly platformName = 'Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)';
  public readonly type = 'REST' as const;
  public readonly description = 'Farmer Beneficiary Verification, Land Seeding & Direct Benefit Transfer Gateway';
  public readonly purpose = 'Farmer benefits';
  public readonly capabilities = ['beneficiary-service discovery', 'eligibility workflow abstraction', 'benefit status abstraction', 'service routing'];

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
        dbtPortalsActive: 36,
        beneficiariesAssessedCount: 110000000,
      },
    };
  }

  public async checkFarmerEligibility(aadhaarToken: string, surveyNumber: string, applicationId?: string): Promise<ConnectorResult> {
    const latency = await this.simulateLatency(80);
    const { isHealthy, status } = await this.checkHealthAndReliability();

    const requestPayload = { operation: 'CHECK_FARMER_BENEFIT', uid_ref: aadhaarToken, survey_no: surveyNumber };

    if (!isHealthy) {
      await this.recordTransaction(applicationId, 'CHECK_FARMER_BENEFIT', requestPayload, { error: status }, 503, latency, false, status);
      return {
        success: false,
        statusCode: 503,
        error: `PM-KISAN portal unavailable (${status})`,
        latencyMs: latency,
        connectorName: this.name,
        platformName: this.platformName,
        timestamp: new Date().toISOString(),
      };
    }

    const resData = {
      farmer_status: 'REGISTERED_ELIGIBLE',
      land_seeding_status: 'YES_VERIFIED',
      e_kyc_done: true,
      bank_aadhaar_dbt_seeded: true,
      installment_amount_per_period: 2000,
      last_installment_status: 'PROCESSED_SUCCESSFULLY',
      verified_at: new Date().toISOString(),
    };

    await this.recordTransaction(applicationId, 'CHECK_FARMER_BENEFIT', requestPayload, resData, 200, latency, true);

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

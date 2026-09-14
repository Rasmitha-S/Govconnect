import { BaseGovernmentConnector, ConnectorResult } from './base.connector.js';
import { DataStandardizerService } from '../services/standardizer.service.js';
import { CanonicalIdentity } from '../types/canonical.js';

export class AadhaarConnector extends BaseGovernmentConnector {
  public readonly code = 'AADHAAR';
  public readonly name = 'Aadhaar / UIDAI Connector';
  public readonly platformName = 'Unique Identification Authority of India (UIDAI)';
  public readonly type = 'REST' as const;
  public readonly description = 'Secure Tokenized Identity Verification and Demographic Authentication Gateway';
  public readonly purpose = 'Identity verification';
  public readonly capabilities = ['identity verification', 'identity validation response', 'basic identity attributes where legally permitted'];

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
        gatewayStatus: isHealthy ? 'OPERATIONAL' : 'UNAVAILABLE',
        authProtocol: 'e-KYC 2.5 Tokenized Gateway',
      },
    };
  }

  public async verifyIdentity(
    aadhaarToken: string,
    citizenName: string,
    applicationId?: string
  ): Promise<ConnectorResult<CanonicalIdentity>> {
    const latency = await this.simulateLatency(70);
    const { isHealthy, status } = await this.checkHealthAndReliability();

    const requestPayload = {
      operation: 'AUTH_EKYC_TOKEN',
      uid_token: aadhaarToken || 'XXXX-XXXX-4819',
      demographic_name: citizenName,
      consent_ref: 'CONSENT-UIDAI-EXPLICIT',
    };

    if (!isHealthy) {
      const errResponse = { error: `UIDAI Gateway is currently ${status}` };
      await this.recordTransaction(applicationId, 'VERIFY_IDENTITY', requestPayload, errResponse, 503, latency, false, errResponse.error);
      return {
        success: false,
        statusCode: 503,
        error: `UIDAI Gateway Service Unavailable (${status})`,
        latencyMs: latency,
        connectorName: this.name,
        platformName: this.platformName,
        timestamp: new Date().toISOString(),
      };
    }

    const rawUidaiResponse = {
      uid_token: aadhaarToken || 'XXXX-XXXX-4819',
      name: citizenName || 'Kavitha Sundaram',
      gender: 'F',
      dob: '1992-08-24',
      mobile: '9876543210',
      email: 'citizen@govconnect.demo',
      co: 'D/O Sundaram',
      house: 'Plot 42, Anna Nagar Extension',
      street: 'Avinashi Road',
      loc: 'Peelamedu',
      vtc: 'Coimbatore',
      dist: 'Coimbatore',
      state: 'Tamil Nadu',
      pc: '641004',
      auth_code: `AUTH-${Date.now().toString().slice(-6)}`,
      status: 'AUTHENTICATED_MATCH_CONFIRMED',
    };

    const standardized = DataStandardizerService.standardizeAadhaarIdentity(rawUidaiResponse);

    await this.recordTransaction(applicationId, 'VERIFY_IDENTITY', requestPayload, rawUidaiResponse, 200, latency, true);

    return {
      success: true,
      statusCode: 200,
      data: standardized,
      rawResponse: rawUidaiResponse,
      latencyMs: latency,
      connectorName: this.name,
      platformName: this.platformName,
      timestamp: new Date().toISOString(),
    };
  }
}

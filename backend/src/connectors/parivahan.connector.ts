import { BaseGovernmentConnector, ConnectorResult } from './base.connector.js';

export class ParivahanConnector extends BaseGovernmentConnector {
  public readonly code = 'PARIVAHAN';
  public readonly name = 'Parivahan Connector';
  public readonly platformName = 'Ministry of Road Transport & Highways (MoRTH) Parivahan Sewa';
  public readonly type = 'REST' as const;
  public readonly description = 'Sarathi (Driving Licence) and Vahan (Vehicle Registration) Gateway';
  public readonly purpose = 'Driving licence and vehicle registration';
  public readonly capabilities = ['transport service discovery', 'driving licence service routing', 'vehicle registration service routing', 'application/status abstraction'];

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
        sarathiVahanSwitch: isHealthy ? 'OPERATIONAL' : 'OFFLINE',
        connectedRTOs: 1380,
      },
    };
  }

  public async verifyDrivingLicense(dlNumber: string, dob: string, applicationId?: string): Promise<ConnectorResult> {
    const latency = await this.simulateLatency(70);
    const { isHealthy, status } = await this.checkHealthAndReliability();

    const requestPayload = { operation: 'VERIFY_DL', dl_no: dlNumber, dob };

    if (!isHealthy) {
      await this.recordTransaction(applicationId, 'VERIFY_DL', requestPayload, { error: status }, 503, latency, false, status);
      return {
        success: false,
        statusCode: 503,
        error: `Parivahan Sewa unavailable (${status})`,
        latencyMs: latency,
        connectorName: this.name,
        platformName: this.platformName,
        timestamp: new Date().toISOString(),
      };
    }

    const dlData = {
      dl_number: dlNumber || 'TN38 20180004819',
      holder_name: 'Kavitha Sundaram',
      rto_office: 'TN-38 (Coimbatore South)',
      class_of_vehicles: ['LMV (Light Motor Vehicle)', 'MCWG (Motorcycle with Gear)'],
      validity_non_transport: '2038-08-23',
      status: 'ACTIVE_VALID',
      verified_at: new Date().toISOString(),
    };

    await this.recordTransaction(applicationId, 'VERIFY_DL', requestPayload, dlData, 200, latency, true);

    return {
      success: true,
      statusCode: 200,
      data: dlData,
      latencyMs: latency,
      connectorCode: this.code,
      connectorName: this.name,
      platformName: this.platformName,
      timestamp: new Date().toISOString(),
    };
  }

  // Progression tracker for representative demonstration
  private static demoStateMap: Map<string, number> = new Map();

  /**
   * Representative implementation of Parivahan Sarathi/Vahan application status lookup.
   */
  public async getApplicationStatus(
    externalReferenceId: string,
    applicationId?: string
  ): Promise<ConnectorResult<any>> {
    const latency = await this.simulateLatency(60);
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
        error: `Parivahan Sewa unavailable (${status})`,
        latencyMs: latency,
        connectorCode: this.code,
        connectorName: this.name,
        platformName: this.platformName,
        timestamp: new Date().toISOString(),
      };
    }

    // Determine representative status progression for demo
    const currentStep = ParivahanConnector.demoStateMap.get(externalReferenceId) || 0;
    let externalStatus = 'DOCUMENT_VERIFICATION_PENDING';
    let statusDescription = 'Application received at RTO. Scrutiny of uploaded address proofs in progress.';

    if (externalReferenceId === 'PARI-MOCK-12345') {
      if (currentStep === 0) {
        externalStatus = 'APPROVED';
        statusDescription = 'RTO Verification Officer approved DL endorsement. Card printing scheduled.';
        ParivahanConnector.demoStateMap.set(externalReferenceId, 1);
      } else if (currentStep === 1) {
        externalStatus = 'COMPLETED';
        statusDescription = 'Smart Card Driving License updated and dispatched via speed post.';
        ParivahanConnector.demoStateMap.set(externalReferenceId, 2);
      } else {
        externalStatus = 'COMPLETED';
        statusDescription = 'Smart Card Driving License updated and dispatched via speed post.';
      }
    } else {
      externalStatus = 'UNDER_VERIFICATION';
      statusDescription = 'Representative application record in process.';
    }

    const statusData = {
      externalReferenceId,
      externalStatus,
      externalPlatform: 'PARIVAHAN',
      platformName: this.platformName,
      statusDescription,
      lastUpdated: new Date().toISOString(),
      isRepresentative: true,
      metadata: {
        rtoOffice: 'TN-38 (Coimbatore South)',
        serviceName: 'Driving License Address Change & Renewal',
        dispatchTrackingNumber: externalStatus === 'COMPLETED' ? 'TNSP202688192IN' : undefined,
      },
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

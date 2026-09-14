import { BaseGovernmentConnector, ConnectorResult } from './base.connector.js';
import { DataStandardizerService } from '../services/standardizer.service.js';
import { CanonicalProperty } from '../types/canonical.js';

export class RevenueConnector extends BaseGovernmentConnector {
  public readonly code = 'REVENUE';
  public readonly name = 'Revenue / Land Records Connector';
  public readonly platformName = 'State Land Records & Property Tax Registry (Tamil Nilam / Revenue Administration)';
  public readonly type = 'SOAP_LEGACY' as const;
  public readonly description = 'Connects to State Land Administration, Patta/Chitta titles, and Property Tax Records';
  public readonly purpose = 'Property and land details';
  public readonly capabilities = ['property verification', 'ownership verification', 'property information retrieval', 'land record validation'];

  protected baseLatencyMs = 190;

  public async healthCheck(): Promise<ConnectorResult> {
    const latency = await this.simulateLatency(80);
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
        protocol: 'WSDL/SOAP 1.2 XML Adapter',
        databaseBridge: isHealthy ? 'CONNECTED' : 'DISCONNECTED',
      },
    };
  }

  public async fetchPropertyRecord(
    propertyId: string,
    ownerName: string,
    applicationId?: string
  ): Promise<ConnectorResult<CanonicalProperty>> {
    const latency = await this.simulateLatency(110);
    const { isHealthy, status } = await this.checkHealthAndReliability();

    const requestPayload = {
      action: 'QUERY_PATTA_CHITTA_PROPERTY',
      survey_assessment_no: propertyId,
      queried_owner: ownerName,
      dept_caller: 'GOVCONNECT_ORCHESTRATOR',
    };

    if (!isHealthy) {
      const errResponse = { error: `Revenue Department System is ${status}` };
      await this.recordTransaction(applicationId, 'FETCH_PROPERTY_RECORD', requestPayload, errResponse, 503, latency, false, errResponse.error);
      return {
        success: false,
        statusCode: 503,
        error: `Revenue Department records service unavailable (${status})`,
        latencyMs: latency,
        connectorName: this.name,
        platformName: this.platformName,
        timestamp: new Date().toISOString(),
      };
    }

    // Realistic legacy response from Land Administration database (snake_case)
    const rawLegacyRevenueData = {
      property_no: propertyId || 'TN-COI-2026-88192',
      property_owner: ownerName || 'Kavitha Sundaram',
      patta_holder_name: ownerName || 'Kavitha Sundaram',
      co_owners: ['S. Muthuvel'],
      property_type: 'RESIDENTIAL',
      door_no: 'Plot 42, Door No 18/B',
      street_name: 'Avinashi Road, Anna Nagar Extension',
      ward_no: 'Ward 22',
      zone: 'East Zone',
      locality: 'Peelamedu',
      district: 'Coimbatore',
      state: 'Tamil Nadu',
      pincode: '641004',
      tax_clearance_status: 'CLEARED',
      property_tax_paid: true,
      last_paid_year: '2025-2026',
      receipt_no: `TAX-REC-${Date.now().toString().slice(-6)}`,
      patta_chitta_no: `PATTA-TN-CBE-${propertyId.replace(/[^0-9]/g, '') || '88192'}`,
      building_plan_approval_no: `BPA-CBE-2024-9182`,
      existing_water_connection: false,
      litigation_flag: false,
      status_code: 'VERIFIED_LEGAL_OWNERSHIP',
    };

    // Standardize via backend canonical transformation
    const standardized = DataStandardizerService.standardizeRevenueProperty(rawLegacyRevenueData);

    await this.recordTransaction(applicationId, 'FETCH_PROPERTY_RECORD', requestPayload, rawLegacyRevenueData, 200, latency, true);

    return {
      success: true,
      statusCode: 200,
      data: standardized,
      rawResponse: rawLegacyRevenueData,
      latencyMs: latency,
      connectorName: this.name,
      platformName: this.platformName,
      timestamp: new Date().toISOString(),
    };
  }
}

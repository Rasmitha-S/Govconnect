import { BaseGovernmentConnector, ConnectorResult } from './base.connector.js';
import { DataStandardizerService } from '../services/standardizer.service.js';
import { CanonicalEducationRecord } from '../types/canonical.js';

export class EducationConnector extends BaseGovernmentConnector {
  public readonly code = 'EDUCATION';
  public readonly name = 'Education / Scholarship Connector';
  public readonly platformName = 'National Scholarship Portal (NSP) & Higher Education System';
  public readonly type = 'REST' as const;
  public readonly description = 'Connects to National Scholarship Portal (NSP) & State Collegiate University Records';
  public readonly purpose = 'Scholarships and certificates';
  public readonly capabilities = ['student verification', 'certificate verification', 'scholarship eligibility', 'scholarship application workflow'];

  protected baseLatencyMs = 145;

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
        connectedInstitutions: 520,
      },
    };
  }

  public async verifyStudentEligibility(
    studentRegNo: string,
    institutionCode: string,
    applicationId?: string
  ): Promise<ConnectorResult<CanonicalEducationRecord>> {
    const latency = await this.simulateLatency(70);
    const { isHealthy, status } = await this.checkHealthAndReliability();

    const requestPayload = {
      action: 'VERIFY_STUDENT_ENROLLMENT',
      reg_no: studentRegNo,
      college_code: institutionCode,
    };

    if (!isHealthy) {
      const errResponse = { error: `Education Department Portal is ${status}` };
      await this.recordTransaction(applicationId, 'VERIFY_STUDENT_ENROLLMENT', requestPayload, errResponse, 503, latency, false, errResponse.error);
      return {
        success: false,
        statusCode: 503,
        error: `Education portal unavailable (${status})`,
        latencyMs: latency,
        connectorName: this.name,
        platformName: this.platformName,
        timestamp: new Date().toISOString(),
      };
    }

    const rawEducationResponse = {
      reg_no: studentRegNo || 'STU-2026-9901',
      college_name: 'Government College of Technology, Coimbatore',
      university: 'Anna University',
      degree_course: 'B.E. Computer Science & Engineering',
      academic_year: 'Final Year (Semester 8)',
      cgpa: '8.85',
      attendance_percentage: 94.2,
      annual_income: '180000',
      income_bracket: 'EWS_ELIGIBLE',
      scholarship_eligible: true,
      max_grant_amount_inr: 45000,
    };

    const standardized = DataStandardizerService.standardizeEducationRecord(rawEducationResponse);

    await this.recordTransaction(applicationId, 'VERIFY_STUDENT_ENROLLMENT', requestPayload, rawEducationResponse, 200, latency, true);

    return {
      success: true,
      statusCode: 200,
      data: standardized,
      rawResponse: rawEducationResponse,
      latencyMs: latency,
      connectorName: this.name,
      platformName: this.platformName,
      timestamp: new Date().toISOString(),
    };
  }
}

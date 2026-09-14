import crypto from 'crypto';
import { prisma } from '../utils/prisma.js';
import { ConnectorRegistry } from '../connectors/connector.registry.js';
import { DigiLockerConnector } from '../connectors/digilocker.connector.js';
import { AuditService } from '../audit/audit.service.js';

export class DigiLockerService {
  private static getDigiLockerConnector(): DigiLockerConnector {
    const registry = ConnectorRegistry.getInstance();
    let connector = registry.getConnector('DIGILOCKER') as DigiLockerConnector;
    if (!connector) {
      connector = new DigiLockerConnector();
      registry.registerConnector(connector);
    }
    return connector;
  }

  /**
   * Returns current integration mode & status
   */
  public static getStatus() {
    const connector = this.getDigiLockerConnector();
    const mode = connector.getIntegrationMode();
    return {
      code: 'DIGILOCKER',
      name: connector.name,
      platformName: connector.platformName,
      mode,
      isConfigured: mode !== 'NOT_CONFIGURED',
      isRepresentative: mode === 'REPRESENTATIVE',
      capabilities: connector.capabilities,
      supportedServices: ['WTR-001', 'SCH-001', 'TRN-001'],
    };
  }

  /**
   * Initiates DigiLocker consent session with CSRF state token
   */
  public static async initiateConsentSession(
    citizenId: string,
    serviceCode: string,
    returnUrl?: string,
    ipAddress?: string
  ) {
    const service = await prisma.service.findUnique({
      where: { serviceCode },
      include: { department: true },
    });

    if (!service) {
      throw { statusCode: 404, code: 'SERVICE_NOT_FOUND', message: `Service with code ${serviceCode} not found.` };
    }

    const connector = this.getDigiLockerConnector();
    const mode = connector.getIntegrationMode();

    if (mode === 'NOT_CONFIGURED') {
      throw {
        statusCode: 503,
        code: 'DIGILOCKER_NOT_CONFIGURED',
        message: 'DigiLocker integration is currently not configured on this server. You may proceed by filling details manually.',
      };
    }

    const stateToken = crypto.randomBytes(32).toString('hex');
    const requestedData = [
      'Full Legal Name',
      'Date of Birth',
      'Gender',
      'Residential Address (Door No, Street, Ward, Pincode)',
      serviceCode.startsWith('WTR')
        ? 'Property Tax Receipt (2025-2026)'
        : serviceCode.startsWith('TRN')
        ? 'Driving Licence Record & Verified Address Proof'
        : 'Income / Academic Certificate',
    ];

    const purpose = `To reduce manual data entry and verify information required for your ${service.name} application.`;
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes validity

    const resolvedReturnPath =
      returnUrl || (serviceCode.startsWith('TRN') ? '/apply/driving-licence' : '/apply/water');

    const session = await prisma.digiLockerSession.create({
      data: {
        citizenId,
        serviceCode,
        stateToken,
        requestedData: JSON.stringify(requestedData),
        purpose,
        status: 'INITIATED',
        integrationMode: mode,
        returnUrl: resolvedReturnPath,
        expiresAt,
      },
    });

    await AuditService.log({
      actorId: citizenId,
      actorRole: 'CITIZEN',
      action: 'DIGILOCKER_CONSENT_INITIATED',
      entity: 'DigiLockerSession',
      entityId: session.id,
      details: {
        serviceCode,
        integrationMode: mode,
        purpose,
        expiresAt,
      },
      ipAddress,
    });

    const { url: authorizationUrl } = connector.getAuthorizationUrl(
      stateToken,
      serviceCode,
      undefined,
      resolvedReturnPath
    );

    return {
      sessionId: session.id,
      stateToken,
      serviceCode: service.serviceCode,
      serviceName: service.name,
      departmentName: service.department.name,
      requestedData,
      purpose,
      dataSource: 'DigiLocker',
      integrationMode: mode,
      isRepresentative: mode === 'REPRESENTATIVE',
      authorizationUrl,
      returnUrl: resolvedReturnPath,
      expiresAt,
    };
  }

  /**
   * Completes representative DigiLocker consent and data retrieval in-app
   */
  public static async completeRepresentativeConsent(
    sessionId: string,
    citizenId: string,
    ipAddress?: string
  ) {
    const session = await prisma.digiLockerSession.findUnique({
      where: { id: sessionId },
      include: { citizen: true },
    });

    if (!session) {
      throw { statusCode: 404, code: 'SESSION_NOT_FOUND', message: 'DigiLocker session not found.' };
    }

    // Citizen isolation check
    if (session.citizenId !== citizenId) {
      throw { statusCode: 403, code: 'FORBIDDEN', message: 'Unauthorized: Session belongs to another citizen.' };
    }

    if (new Date() > session.expiresAt) {
      await prisma.digiLockerSession.update({
        where: { id: session.id },
        data: { status: 'EXPIRED' },
      });
      throw { statusCode: 400, code: 'SESSION_EXPIRED', message: 'DigiLocker session has expired. Please initiate consent again.' };
    }

    const connector = this.getDigiLockerConnector();
    const dataResult = await connector.getAuthorizedUserData(session.serviceCode, session.citizen.email);

    if (!dataResult.success || !dataResult.data) {
      throw {
        statusCode: 503,
        code: 'RETRIEVAL_FAILED',
        message: dataResult.error || 'Failed to retrieve permitted data from DigiLocker platform.',
      };
    }

    const standardized = dataResult.data;

    // Update Session
    const updatedSession = await prisma.digiLockerSession.update({
      where: { id: session.id },
      data: {
        status: 'AUTHORIZED',
        standardizedData: JSON.stringify(standardized),
        retrievedDocuments: JSON.stringify(standardized.documents || []),
      },
    });

    // Create or update Consent record with dataSource = "DIGILOCKER"
    const consent = await prisma.consent.create({
      data: {
        citizenId,
        dataSource: 'DIGILOCKER',
        requestingDeptCode: session.serviceCode.startsWith('WTR') ? 'WATER' : session.serviceCode.startsWith('TRN') ? 'TRANSPORT' : 'EDUCATION',
        dataProviderDeptCode: 'DIGILOCKER',
        purpose: session.purpose,
        dataFields: session.requestedData,
        status: 'GRANTED',
        grantedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        history: {
          create: {
            action: 'GRANTED',
            actorId: citizenId,
            ipAddress,
            remarks: 'Authorized via DigiLocker application autofill consent.',
          },
        },
      },
    });

    await AuditService.log({
      actorId: citizenId,
      actorEmail: session.citizen.email,
      actorRole: 'CITIZEN',
      action: 'DIGILOCKER_CONSENT_GRANTED',
      entity: 'Consent',
      entityId: consent.id,
      details: {
        sessionId: session.id,
        serviceCode: session.serviceCode,
        dataSource: 'DIGILOCKER',
        documentCount: standardized.documents?.length || 0,
        isRepresentative: true,
      },
      ipAddress,
    });

    return {
      sessionId: updatedSession.id,
      status: 'AUTHORIZED',
      standardizedData: standardized,
      documents: standardized.documents,
      consentId: consent.id,
      isRepresentative: true,
    };
  }

  /**
   * Handles official OAuth authorization callback with state token validation
   */
  public static async processOAuthCallback(
    code: string,
    state: string,
    citizenId?: string,
    ipAddress?: string
  ) {
    if (!state) {
      throw { statusCode: 400, code: 'INVALID_STATE', message: 'OAuth state token is missing.' };
    }

    const session = await prisma.digiLockerSession.findUnique({
      where: { stateToken: state },
      include: { citizen: true },
    });

    if (!session) {
      throw { statusCode: 404, code: 'SESSION_NOT_FOUND', message: 'Invalid or expired state token.' };
    }

    if (citizenId && session.citizenId !== citizenId) {
      throw { statusCode: 403, code: 'FORBIDDEN', message: 'Unauthorized: Session belongs to another citizen.' };
    }

    if (new Date() > session.expiresAt) {
      await prisma.digiLockerSession.update({
        where: { id: session.id },
        data: { status: 'EXPIRED' },
      });
      throw { statusCode: 400, code: 'SESSION_EXPIRED', message: 'DigiLocker session has expired.' };
    }

    const connector = this.getDigiLockerConnector();
    const tokenResult = await connector.handleAuthorizationCallback(code, state);

    if (!tokenResult.success) {
      await AuditService.log({
        actorId: session.citizenId,
        actorRole: 'CITIZEN',
        action: 'DIGILOCKER_ACCESS_FAILED',
        entity: 'DigiLockerSession',
        entityId: session.id,
        details: {
          serviceCode: session.serviceCode,
          error: tokenResult.error,
        },
        ipAddress,
      });

      throw { statusCode: 502, code: 'TOKEN_EXCHANGE_FAILED', message: tokenResult.error || 'Token exchange failed.' };
    }

    await AuditService.log({
      actorId: session.citizenId,
      actorRole: 'CITIZEN',
      action: 'DIGILOCKER_AUTHORIZATION_COMPLETED',
      entity: 'DigiLockerSession',
      entityId: session.id,
      details: {
        serviceCode: session.serviceCode,
        isRepresentative: tokenResult.data?.isRepresentative || false,
      },
      ipAddress,
    });

    const dataResult = await connector.getAuthorizedUserData(
      session.serviceCode,
      session.citizen.email,
      tokenResult.data?.accessToken
    );

    if (!dataResult.success || !dataResult.data) {
      throw { statusCode: 502, code: 'DATA_FETCH_FAILED', message: dataResult.error || 'Failed to fetch user data.' };
    }

    const standardized = dataResult.data;

    await prisma.digiLockerSession.update({
      where: { id: session.id },
      data: {
        status: 'AUTHORIZED',
        standardizedData: JSON.stringify(standardized),
        retrievedDocuments: JSON.stringify(standardized.documents || []),
        externalReference: tokenResult.data?.digilockerId || null,
      },
    });

    const consent = await prisma.consent.create({
      data: {
        citizenId: session.citizenId,
        dataSource: 'DIGILOCKER',
        requestingDeptCode: session.serviceCode.startsWith('WTR') ? 'WATER' : session.serviceCode.startsWith('TRN') ? 'TRANSPORT' : 'EDUCATION',
        dataProviderDeptCode: 'DIGILOCKER',
        purpose: session.purpose,
        dataFields: session.requestedData,
        status: 'GRANTED',
        grantedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        history: {
          create: {
            action: 'GRANTED',
            actorId: session.citizenId,
            ipAddress,
            remarks: 'Authorized via DigiLocker OAuth integration.',
          },
        },
      },
    });

    await AuditService.log({
      actorId: session.citizenId,
      actorEmail: session.citizen.email,
      actorRole: 'CITIZEN',
      action: 'DIGILOCKER_DATA_RETRIEVED',
      entity: 'Consent',
      entityId: consent.id,
      details: {
        sessionId: session.id,
        serviceCode: session.serviceCode,
        documentsRetrieved: standardized.documents?.length || 0,
        isRepresentative: tokenResult.data?.isRepresentative || false,
      },
      ipAddress,
    });

    return {
      sessionId: session.id,
      serviceCode: session.serviceCode,
      returnUrl: session.returnUrl || (session.serviceCode.startsWith('TRN') ? '/apply/driving-licence' : '/apply/water'),
      status: 'AUTHORIZED',
      standardizedData: standardized,
    };
  }

  /**
   * Retrieves standardized autofill data for application form with strict citizen ownership validation
   */
  public static async getSessionAutofillData(sessionId: string, citizenId: string) {
    const session = await prisma.digiLockerSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw { statusCode: 404, code: 'SESSION_NOT_FOUND', message: 'DigiLocker session not found.' };
    }

    if (session.citizenId !== citizenId) {
      throw { statusCode: 403, code: 'FORBIDDEN', message: 'Unauthorized: You cannot access another citizen\'s session.' };
    }

    if (session.status !== 'AUTHORIZED' || !session.standardizedData) {
      throw { statusCode: 400, code: 'NOT_AUTHORIZED', message: 'DigiLocker session has not been authorized or data is pending.' };
    }

    return {
      sessionId: session.id,
      serviceCode: session.serviceCode,
      status: session.status,
      integrationMode: session.integrationMode,
      isRepresentative: session.integrationMode === 'REPRESENTATIVE',
      standardizedData: JSON.parse(session.standardizedData),
      retrievedDocuments: session.retrievedDocuments ? JSON.parse(session.retrievedDocuments) : [],
    };
  }

  /**
   * Handles citizen consent denial
   */
  public static async denyConsent(sessionId: string, citizenId: string, ipAddress?: string) {
    const session = await prisma.digiLockerSession.findUnique({
      where: { id: sessionId },
      include: { citizen: true },
    });

    if (!session) {
      throw { statusCode: 404, code: 'SESSION_NOT_FOUND', message: 'DigiLocker session not found.' };
    }

    if (session.citizenId !== citizenId) {
      throw { statusCode: 403, code: 'FORBIDDEN', message: 'Unauthorized access.' };
    }

    await prisma.digiLockerSession.update({
      where: { id: session.id },
      data: { status: 'DENIED' },
    });

    await AuditService.log({
      actorId: citizenId,
      actorEmail: session.citizen.email,
      actorRole: 'CITIZEN',
      action: 'DIGILOCKER_CONSENT_DENIED',
      entity: 'DigiLockerSession',
      entityId: session.id,
      details: {
        serviceCode: session.serviceCode,
        reason: 'Citizen declined DigiLocker consent modal.',
      },
      ipAddress,
    });

    return {
      success: true,
      message: 'DigiLocker consent declined. You can continue by entering details manually.',
    };
  }

  /**
   * Revokes DigiLocker access for a consent
   */
  public static async revokeAccess(identifier: string, citizenId: string, ipAddress?: string) {
    const consent = await prisma.consent.findFirst({
      where: {
        citizenId,
        dataSource: 'DIGILOCKER',
        OR: [
          { id: identifier },
          { requestingDeptCode: identifier.startsWith('WTR') ? 'WATER' : identifier.startsWith('TRN') ? 'TRANSPORT' : identifier },
          { dataProviderDeptCode: 'DIGILOCKER' },
        ],
        status: 'GRANTED',
      },
      orderBy: { createdAt: 'desc' },
    }) || await prisma.consent.findFirst({
      where: {
        citizenId,
        id: identifier,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!consent) {
      throw { statusCode: 404, code: 'CONSENT_NOT_FOUND', message: 'Active DigiLocker consent record not found.' };
    }

    // Revoke all matching active granted consents for this citizen & service
    await prisma.consent.updateMany({
      where: {
        citizenId,
        dataSource: 'DIGILOCKER',
        status: 'GRANTED',
        OR: [
          { id: consent.id },
          { requestingDeptCode: consent.requestingDeptCode },
        ],
      },
      data: {
        status: 'REVOKED',
        revokedAt: new Date(),
      },
    });

    const updated = await prisma.consent.findUnique({
      where: { id: consent.id },
    });

    await prisma.consentHistory.create({
      data: {
        consentId: consent.id,
        action: 'REVOKED',
        actorId: citizenId,
        ipAddress,
        remarks: 'DigiLocker data access authorization revoked by citizen.',
      },
    });

    const connector = this.getDigiLockerConnector();
    await connector.revokeAuthorization(citizenId, consent.id);

    await AuditService.log({
      actorId: citizenId,
      actorRole: 'CITIZEN',
      action: 'DIGILOCKER_ACCESS_REVOKED',
      entity: 'Consent',
      entityId: consent.id,
      details: {
        consentId: consent.id,
        requestingDeptCode: consent.requestingDeptCode,
        dataSource: 'DIGILOCKER',
      },
      ipAddress,
    });

    return updated;
  }
}

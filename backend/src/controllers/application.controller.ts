import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { AuthenticatedRequest, ApplicationStatus } from '../types/index.js';
import { WorkflowService } from '../workflows/workflow.service.js';
import { AuditService } from '../audit/audit.service.js';
import { NotificationService } from '../services/notification.service.js';
/**
 * GovConnect Citizen Application & Workflow Controller
 */
import { ConnectorRegistry } from '../connectors/connector.registry.js';
import { mapExternalStatusToGovConnectStatus } from '../services/status_mapper.js';

export const waterApplicationSchema = z.object({
  serviceCode: z.string().default('WTR-001'),
  fullName: z.string().min(2, 'Full Name is required'),
  mobile: z.string().min(10, 'Valid 10-digit mobile required'),
  email: z.string().email(),
  aadhaarToken: z.string().optional(),
  propertyId: z.string().min(3, 'Property Assessment / Survey Number is required'),
  propertyType: z.enum(['RESIDENTIAL', 'COMMERCIAL', 'AGRICULTURAL', 'INDUSTRIAL']).default('RESIDENTIAL'),
  doorNumber: z.string().min(1, 'Door Number is required'),
  streetName: z.string().min(2, 'Street Name is required'),
  wardNumber: z.string().min(1, 'Ward Number is required'),
  zone: z.string().default('East Zone'),
  city: z.string().default('Coimbatore'),
  pincode: z.string().min(6, 'Valid 6-digit Pincode required'),
  connectionType: z.enum(['DOMESTIC', 'COMMERCIAL', 'INDUSTRIAL']).default('DOMESTIC'),
  estimatedDailyLiters: z.number().default(500),
  consentGranted: z.boolean().refine((v) => v === true, 'Consent is required for Revenue verification'),
  mockDocumentUploaded: z.boolean().default(true),
  documentFileName: z.string().default('Tax_Receipt_2025_2026.pdf'),
});

export const drivingLicenceApplicationSchema = z.object({
  serviceCode: z.string().default('TRN-001'),
  fullName: z.string().min(2, 'Full Name is required'),
  dob: z.string().min(4, 'Valid Date of Birth is required'),
  mobile: z.string().min(10, 'Valid 10-digit mobile required'),
  email: z.string().email(),
  aadhaarToken: z.string().optional(),
  dlNumber: z.string().min(5, 'Driving Licence Number is required'),
  existingExpiryDate: z.string().optional(),
  issuingState: z.string().default('Tamil Nadu'),
  licensingAuthority: z.string().default('TN-38 (Coimbatore South RTO)'),
  existingAddress: z.string().optional(),
  houseBuilding: z.string().min(1, 'House / Door / Building Number is required'),
  street: z.string().min(2, 'Street Name is required'),
  city: z.string().min(2, 'City is required'),
  district: z.string().min(2, 'District is required'),
  state: z.string().default('Tamil Nadu'),
  pincode: z.string().min(6, 'Valid 6-digit PIN code required'),
  renewLicence: z.boolean().default(true),
  changeAddress: z.boolean().default(true),
  existingDlDocFileName: z.string().default('Driving_Licence_Original.pdf'),
  addressProofDocFileName: z.string().default('DigiLocker_Verified_Address_Proof.pdf'),
  isFromDigiLocker: z.boolean().default(false),
  consentGranted: z.boolean().refine((v) => v === true, 'Consent is required for Parivahan Sarathi verification'),
});

export class ApplicationController {
  /**
   * Submit Driving Licence Renewal + Address Change Application
   */
  public static async createDrivingLicenceApplication(req: AuthenticatedRequest, res: Response): Promise<void> {
    const citizenId = req.user!.userId;
    const body = req.body;

    const transportDept = await prisma.department.findUnique({ where: { code: 'TRANSPORT' } });
    const transportService = await prisma.service.findUnique({ where: { serviceCode: 'TRN-001' } });

    if (!transportDept || !transportService) {
      res.status(500).json({ success: false, error: { code: 'SERVICE_UNCONFIGURED', message: 'Transport service is not configured.' } });
      return;
    }

    // Generate unique sequential application ID e.g. GOV-DL-2026-001045
    const count = await prisma.application.count();
    const appNumber = `GOV-DL-2026-${String(count + 1001).padStart(5, '0')}`;
    const externalRef = `PARI-${Date.now().toString().slice(-6)}`;

    // 1. Create Application
    const application = await prisma.application.create({
      data: {
        applicationNumber: appNumber,
        serviceId: transportService.id,
        citizenId: citizenId,
        departmentId: transportDept.id,
        status: ApplicationStatus.SUBMITTED,
        currentStep: 'Under Parivahan Sarathi & RTO Scrutiny',
        priority: 'NORMAL',
        applicationType: 'INTEGRATED',
        externalPlatform: 'PARIVAHAN',
        externalReferenceId: externalRef,
        externalStatus: 'DOCUMENT_VERIFICATION_PENDING',
        lastSyncedAt: new Date(),
        syncStatus: 'SUCCESS',
        rawFormData: JSON.stringify(body),
        statusHistory: {
          create: {
            fromStatus: 'DRAFT',
            toStatus: ApplicationStatus.SUBMITTED,
            changedByName: req.user!.fullName,
            remarks: 'Citizen submitted Driving Licence Renewal + Address Change application.',
          },
        },
      },
    });

    // 2. Create Consent Record
    const consent = await prisma.consent.create({
      data: {
        citizenId,
        applicationId: application.id,
        requestingDeptCode: 'TRANSPORT',
        dataProviderDeptCode: 'PARIVAHAN',
        dataSource: body.isFromDigiLocker ? 'DIGILOCKER' : 'CROSS_DEPARTMENT',
        purpose: 'Cross-department verification of Driving Licence validity and Address Endorsement via MoRTH Sarathi',
        dataFields: JSON.stringify(['dl_number', 'holder_name', 'validity_non_transport', 'rto_office', 'address_proof']),
        status: body.consentGranted ? 'GRANTED' : 'DENIED',
        grantedAt: body.consentGranted ? new Date() : null,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        history: {
          create: {
            action: body.consentGranted ? 'GRANTED' : 'DENIED',
            actorId: citizenId,
            ipAddress: req.ip,
            remarks: 'Citizen granted digital consent for Parivahan Sarathi verification.',
          },
        },
      },
    });

    // 3. Create Documents Records
    await prisma.document.create({
      data: {
        applicationId: application.id,
        citizenId,
        documentType: 'DRIVING_LICENCE',
        fileName: body.existingDlDocFileName || 'Driving_Licence_Original.pdf',
        fileUrl: `/uploads/mock_dl_${application.id}.pdf`,
        fileSize: 1024 * 280,
        mimeType: 'application/pdf',
        isVerified: true,
        verifiedByConnector: body.isFromDigiLocker ? 'DigiLocker Platform' : 'MoRTH Sarathi Gateway',
        verificationNotes: 'Verified against national transport database.',
      },
    });

    await prisma.document.create({
      data: {
        applicationId: application.id,
        citizenId,
        documentType: 'ADDRESS_PROOF',
        fileName: body.addressProofDocFileName || 'DigiLocker_Verified_Address_Proof.pdf',
        fileUrl: `/uploads/mock_addr_${application.id}.pdf`,
        fileSize: 1024 * 320,
        mimeType: 'application/pdf',
        isVerified: true,
        verifiedByConnector: body.isFromDigiLocker ? 'DigiLocker Platform' : 'Revenue Department',
        verificationNotes: 'Verified cryptographic seal on residential address proof.',
      },
    });

    // 4. Trigger the Interoperability Workflow Orchestrator
    const workflow = await WorkflowService.initializeDrivingLicenceWorkflow(application.id, citizenId, body);

    await NotificationService.notifyUser(
      citizenId,
      'Driving Licence Application Received',
      `Your application ${appNumber} has been received. Automated Parivahan Sarathi checks are underway.`,
      'APPLICATION_SUBMITTED',
      application.id
    );

    await AuditService.log({
      actorId: citizenId,
      actorEmail: req.user!.email,
      actorRole: 'CITIZEN',
      action: 'APPLICATION_SUBMITTED',
      entity: 'Application',
      entityId: application.id,
      details: { applicationNumber: appNumber, serviceCode: 'TRN-001', externalRef },
      ipAddress: req.ip,
    });

    // Return fresh state
    const refreshedApp = await prisma.application.findUnique({
      where: { id: application.id },
      include: {
        service: true,
        department: true,
        workflow: { include: { steps: true } },
        consents: true,
        documents: true,
        statusHistory: true,
      },
    });

    res.status(201).json({
      success: true,
      data: refreshedApp,
    });
  }

  /**
   * Submit Water Connection Application
   */
  public static async createWaterApplication(req: AuthenticatedRequest, res: Response): Promise<void> {
    const citizenId = req.user!.userId;
    const body = req.body;

    const waterDept = await prisma.department.findUnique({ where: { code: 'WATER' } });
    const waterService = await prisma.service.findUnique({ where: { serviceCode: 'WTR-001' } });

    if (!waterDept || !waterService) {
      res.status(500).json({ success: false, error: { code: 'SERVICE_UNCONFIGURED', message: 'Water service is not configured.' } });
      return;
    }

    // Generate unique sequential application ID e.g. APP-2026-00001
    const count = await prisma.application.count();
    const appNumber = `APP-2026-${String(count + 1001).padStart(5, '0')}`;

    // 1. Create Application
    const application = await prisma.application.create({
      data: {
        applicationNumber: appNumber,
        serviceId: waterService.id,
        citizenId: citizenId,
        departmentId: waterDept.id,
        status: ApplicationStatus.SUBMITTED,
        currentStep: 'Under Automated Cross-Department Checks',
        priority: 'NORMAL',
        rawFormData: JSON.stringify(body),
        statusHistory: {
          create: {
            fromStatus: 'DRAFT',
            toStatus: ApplicationStatus.SUBMITTED,
            changedByName: req.user!.fullName,
            remarks: 'Citizen submitted New Water Connection application.',
          },
        },
      },
    });

    // 2. Create Consent Record
    const consent = await prisma.consent.create({
      data: {
        citizenId,
        applicationId: application.id,
        requestingDeptCode: 'WATER',
        dataProviderDeptCode: 'REVENUE',
        purpose: 'Cross-department verification of property tax clearance and land ownership for water connection',
        dataFields: JSON.stringify(['property_owner', 'property_no', 'tax_clearance_status', 'patta_chitta_no']),
        status: body.consentGranted ? 'GRANTED' : 'DENIED',
        grantedAt: body.consentGranted ? new Date() : null,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days validity
        history: {
          create: {
            action: body.consentGranted ? 'GRANTED' : 'DENIED',
            actorId: citizenId,
            ipAddress: req.ip,
            remarks: 'Citizen accepted digital consent terms in application step 4.',
          },
        },
      },
    });

    // 3. Create Document Record
    await prisma.document.create({
      data: {
        applicationId: application.id,
        citizenId,
        documentType: 'PROPERTY_TAX_RECEIPT',
        fileName: body.documentFileName || 'Tax_Receipt_2025_2026.pdf',
        fileUrl: `/uploads/mock_${application.id}.pdf`,
        fileSize: 1024 * 340, // 340 KB
        mimeType: 'application/pdf',
        isVerified: true,
        verifiedByConnector: 'DigiLocker Mock Connector',
        verificationNotes: 'Verified genuine cryptographic seal against municipal tax registry.',
      },
    });

    // 4. Trigger the Interoperability Workflow Orchestrator
    const workflow = await WorkflowService.initializeWaterWorkflow(application.id, citizenId, body);

    await NotificationService.notifyUser(
      citizenId,
      'Application Submitted Successfully',
      `Your application ${appNumber} has been received. Interoperability checks are in progress.`,
      'APPLICATION_SUBMITTED',
      application.id
    );

    await AuditService.log({
      actorId: citizenId,
      actorEmail: req.user!.email,
      actorRole: 'CITIZEN',
      action: 'APPLICATION_SUBMITTED',
      entity: 'Application',
      entityId: application.id,
      details: { applicationNumber: appNumber, consentId: consent.id },
      ipAddress: req.ip,
    });

    // Return fresh state
    const refreshedApp = await prisma.application.findUnique({
      where: { id: application.id },
      include: {
        service: true,
        department: true,
        workflow: { include: { steps: true } },
        consents: true,
        documents: true,
        statusHistory: true,
      },
    });

    res.status(201).json({
      success: true,
      data: refreshedApp,
    });
  }

  /**
   * Get Citizen's Applications
   */
  public static async listCitizenApplications(req: AuthenticatedRequest, res: Response): Promise<void> {
    const citizenId = req.user!.userId;

    const applications = await prisma.application.findMany({
      where: { citizenId },
      include: {
        service: true,
        department: true,
        workflow: { include: { steps: true } },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      data: applications,
    });
  }

  /**
   * Get Application Details with full timeline & connector logs
   */
  public static async getApplicationDetail(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const user = req.user!;

    const application = await prisma.application.findFirst({
      where: {
        OR: [{ id }, { applicationNumber: id }],
      },
      include: {
        service: { include: { category: true, department: true } },
        department: true,
        citizen: {
          include: { citizenProfile: true },
        },
        workflow: {
          include: {
            steps: { orderBy: { stageNumber: 'asc' } },
          },
        },
        consents: {
          include: { history: true },
        },
        documents: true,
        payments: true,
        statusHistory: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!application) {
      res.status(404).json({
        success: false,
        error: { code: 'APPLICATION_NOT_FOUND', message: 'Application not found.' },
      });
      return;
    }

    // Role check: Citizen can only view own applications
    if (user.role === 'CITIZEN' && application.citizenId !== user.userId) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You are not authorized to view this application.' },
      });
      return;
    }

    // Officer department check
    if (user.role === 'OFFICER' && user.departmentId !== application.departmentId) {
      res.status(403).json({
        success: false,
        error: { code: 'DEPARTMENT_MISMATCH', message: 'This application belongs to another department.' },
      });
      return;
    }

    // Parse JSON strings
    const parsed = {
      ...application,
      rawFormData: JSON.parse(application.rawFormData || '{}'),
      standardizedData: application.standardizedData ? JSON.parse(application.standardizedData) : null,
      workflow: application.workflow
        ? {
            ...application.workflow,
            steps: application.workflow.steps.map((s) => ({
              ...s,
              requestPayload: s.requestPayload ? JSON.parse(s.requestPayload) : null,
              responsePayload: s.responsePayload ? JSON.parse(s.responsePayload) : null,
            })),
          }
        : null,
    };

    res.status(200).json({
      success: true,
      data: parsed,
    });
  }

  /**
   * Get Application Timeline
   */
  public static async getApplicationTimeline(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;

    const app = await prisma.application.findFirst({
      where: { OR: [{ id }, { applicationNumber: id }] },
      include: {
        workflow: { include: { steps: { orderBy: { stageNumber: 'asc' } } } },
        statusHistory: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!app) {
      res.status(404).json({ success: false, error: { code: 'APPLICATION_NOT_FOUND', message: 'Application not found' } });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        applicationNumber: app.applicationNumber,
        status: app.status,
        currentStep: app.currentStep,
        workflowSteps: app.workflow?.steps || [],
        history: app.statusHistory,
      },
    });
  }

  /**
   * Synchronize status with external government platform connector
   */
  public static async syncExternalStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    const application = await prisma.application.findFirst({
      where: { OR: [{ id }, { applicationNumber: id }] },
      include: {
        service: true,
        department: true,
      },
    });

    if (!application) {
      res.status(404).json({ success: false, error: { code: 'APPLICATION_NOT_FOUND', message: 'Application not found' } });
      return;
    }

    // Authorization check: Citizen must own application, or user is OFFICER / ADMIN
    if (userRole === 'CITIZEN' && application.citizenId !== userId) {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Unauthorized to access this application' } });
      return;
    }

    if (application.applicationType === 'NATIVE') {
      res.status(400).json({
        success: false,
        error: {
          code: 'NATIVE_APPLICATION',
          message: 'Status synchronization is not applicable for Native GovConnect applications.',
        },
      });
      return;
    }

    if (application.applicationType === 'EXTERNAL_ONLY') {
      res.status(400).json({
        success: false,
        error: {
          code: 'EXTERNAL_ONLY_SERVICE',
          message: 'This service is completed directly on the official portal. Live status synchronization is not configured.',
          officialPortalURL: application.service.officialPortalURL,
        },
      });
      return;
    }

    if (!application.externalPlatform || !application.externalReferenceId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_EXTERNAL_REFERENCE',
          message: 'Application is missing external platform or reference ID configuration.',
        },
      });
      return;
    }

    const registry = ConnectorRegistry.getInstance();
    const connector = registry.getConnector(application.externalPlatform);

    if (!connector) {
      await prisma.application.update({
        where: { id: application.id },
        data: { syncStatus: 'NOT_CONFIGURED' },
      });

      await AuditService.log({
        actorId: userId,
        actorEmail: req.user?.email,
        actorRole: userRole,
        action: 'EXTERNAL_STATUS_SYNC',
        entity: 'Application',
        entityId: application.id,
        details: {
          applicationNumber: application.applicationNumber,
          platform: application.externalPlatform,
          result: 'FAILED',
          reason: 'Connector not configured in registry',
        },
        ipAddress: req.ip,
      });

      res.status(502).json({
        success: false,
        error: {
          code: 'CONNECTOR_UNAVAILABLE',
          message: `Connector for platform ${application.externalPlatform} is not configured in the runtime registry.`,
        },
      });
      return;
    }

    const statusResult = await connector.getApplicationStatus(
      application.externalReferenceId,
      application.id
    );

    if (!statusResult.success || !statusResult.data) {
      await prisma.application.update({
        where: { id: application.id },
        data: {
          syncStatus: 'FAILED',
          lastSyncedAt: new Date(),
        },
      });

      await AuditService.log({
        actorId: userId,
        actorEmail: req.user?.email,
        actorRole: userRole,
        action: 'EXTERNAL_STATUS_SYNC',
        entity: 'Application',
        entityId: application.id,
        details: {
          applicationNumber: application.applicationNumber,
          platform: application.externalPlatform,
          result: 'FAILED',
          error: statusResult.error,
        },
        ipAddress: req.ip,
      });

      res.status(502).json({
        success: false,
        error: {
          code: 'SYNC_FAILED',
          message: statusResult.error || 'Failed to retrieve external status from platform adapter.',
        },
      });
      return;
    }

    const externalData = statusResult.data;
    const newExternalStatus = externalData.externalStatus;
    const normalizedStatus = mapExternalStatusToGovConnectStatus(
      application.externalPlatform,
      newExternalStatus
    );

    const prevStatus = application.status;
    const prevExternalStatus = application.externalStatus;

    // Update application record
    const updatedApplication = await prisma.application.update({
      where: { id: application.id },
      data: {
        externalStatus: newExternalStatus,
        status: normalizedStatus,
        currentStep: externalData.statusDescription || `External status updated to ${newExternalStatus}`,
        lastSyncedAt: new Date(),
        syncStatus: 'SUCCESS',
      },
      include: {
        service: true,
        department: true,
        statusHistory: { orderBy: { createdAt: 'desc' } },
      },
    });

    // If status changed, record timeline history
    if (prevStatus !== normalizedStatus || prevExternalStatus !== newExternalStatus) {
      await prisma.applicationStatusHistory.create({
        data: {
          applicationId: application.id,
          fromStatus: prevStatus,
          toStatus: normalizedStatus,
          changedById: userId || null,
          changedByName: `${connector.name} (Synchronized)`,
          remarks: `External status updated to ${newExternalStatus}: ${externalData.statusDescription || 'Synchronized via connector.'}`,
        },
      });
    }

    // Audit log
    await AuditService.log({
      actorId: userId,
      actorEmail: req.user?.email,
      actorRole: userRole,
      action: 'EXTERNAL_STATUS_SYNC',
      entity: 'Application',
      entityId: application.id,
      details: {
        applicationNumber: application.applicationNumber,
        platform: application.externalPlatform,
        externalReferenceId: application.externalReferenceId,
        previousExternalStatus: prevExternalStatus,
        newExternalStatus,
        normalizedStatus,
        result: 'SUCCESS',
      },
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      data: {
        message: 'Application status synchronized successfully with external platform.',
        application: updatedApplication,
        externalStatus: newExternalStatus,
        normalizedStatus,
        lastSyncedAt: updatedApplication.lastSyncedAt,
        syncStatus: 'SUCCESS',
        isRepresentative: externalData.isRepresentative,
      },
    });
  }
}

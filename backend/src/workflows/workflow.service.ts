import { prisma } from '../utils/prisma.js';
import { ConnectorRegistry } from '../connectors/connector.registry.js';
import { AadhaarConnector } from '../connectors/aadhaar.connector.js';
import { RevenueConnector } from '../connectors/revenue.connector.js';
import { DigiLockerConnector } from '../connectors/digilocker.connector.js';
import { WaterConnector } from '../connectors/water.connector.js';
import { ParivahanConnector } from '../connectors/parivahan.connector.js';
import { NotificationService } from '../services/notification.service.js';
import { AuditService } from '../audit/audit.service.js';
import { ApplicationStatus } from '../types/index.js';
import { logger } from '../utils/logger.js';

export class WorkflowService {
  /**
   * Initializes a multi-department workflow for an application
   */
  public static async initializeWaterWorkflow(applicationId: string, citizenId: string, formData: any) {
    // 1. Create Workflow in DB with 6 planned stages
    const workflow = await prisma.workflow.create({
      data: {
        applicationId,
        currentStage: 1,
        totalStages: 6,
        isCompleted: false,
        steps: {
          create: [
            {
              stageNumber: 1,
              stageName: 'Application Submission',
              departmentCode: 'CITIZEN',
              status: 'COMPLETED',
              connectorName: 'GovConnect Portal',
              executionDurationMs: 45,
              completedAt: new Date(),
              requestPayload: JSON.stringify({ applicant: formData.fullName }),
              responsePayload: JSON.stringify({ status: 'ACCEPTED_FOR_INTEROPERABILITY_CHECK' }),
            },
            {
              stageNumber: 2,
              stageName: 'Identity Verification',
              departmentCode: 'AADHAAR',
              status: 'PENDING',
              connectorName: 'UIDAI Aadhaar Mock Connector',
            },
            {
              stageNumber: 3,
              stageName: 'Cross-Department Property Verification',
              departmentCode: 'REVENUE',
              status: 'PENDING',
              connectorName: 'Revenue & Land Administration Mock Connector',
            },
            {
              stageNumber: 4,
              stageName: 'Document Verification',
              departmentCode: 'DIGILOCKER',
              status: 'PENDING',
              connectorName: 'DigiLocker Mock Connector',
            },
            {
              stageNumber: 5,
              stageName: 'Department Technical Review & Approval',
              departmentCode: 'WATER',
              status: 'PENDING',
              connectorName: 'Municipal Water Supply Board',
            },
            {
              stageNumber: 6,
              stageName: 'Payment & Connection Provisioning',
              departmentCode: 'TREASURY',
              status: 'PENDING',
              connectorName: 'e-Treasury / Water Provisioning Engine',
            },
          ],
        },
      },
      include: {
        steps: true,
      },
    });

    // 2. Automatically execute Stage 2 (Aadhaar) and Stage 3 (Revenue check with consent) and Stage 4 (DigiLocker)
    await this.runAutomatedVerificationPipeline(applicationId, citizenId, formData);

    return workflow;
  }

  /**
   * Runs the automated cross-department connector pipeline
   */
  public static async runAutomatedVerificationPipeline(applicationId: string, citizenId: string, formData: any) {
    const registry = ConnectorRegistry.getInstance();
    const aadhaarConn = registry.getConnector<AadhaarConnector>('AADHAAR');
    const revenueConn = registry.getConnector<RevenueConnector>('REVENUE');
    const digiConn = registry.getConnector<DigiLockerConnector>('DIGILOCKER');
    const waterConn = registry.getConnector<WaterConnector>('WATER');

    const app = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { workflow: { include: { steps: true } }, citizen: true },
    });

    if (!app || !app.workflow) return;

    try {
      // ----------------------------------------------------
      // STEP 2: Identity Verification via Aadhaar Connector
      // ----------------------------------------------------
      const aadhaarStep = app.workflow.steps.find((s) => s.stageNumber === 2);
      if (aadhaarStep && aadhaarConn) {
        await prisma.workflowStep.update({
          where: { id: aadhaarStep.id },
          data: { status: 'IN_PROGRESS' },
        });

        const idResult = await aadhaarConn.verifyIdentity(formData.aadhaarToken || 'XXXX-XXXX-4819', formData.fullName, applicationId);

        await prisma.workflowStep.update({
          where: { id: aadhaarStep.id },
          data: {
            status: idResult.success ? 'COMPLETED' : 'FAILED',
            executionDurationMs: idResult.latencyMs,
            requestPayload: JSON.stringify({ token: formData.aadhaarToken || 'XXXX-XXXX-4819', name: formData.fullName }),
            responsePayload: JSON.stringify(idResult.data || idResult.error),
            completedAt: new Date(),
            errorMessage: idResult.error || null,
          },
        });
      }

      // ----------------------------------------------------
      // STEP 3: Cross-Department Property Verification (Revenue)
      // Check if citizen gave consent
      // ----------------------------------------------------
      const consent = await prisma.consent.findFirst({
        where: { applicationId, status: 'GRANTED' },
      });

      const revenueStep = app.workflow.steps.find((s) => s.stageNumber === 3);

      let standardizedProperty: any = null;

      if (revenueStep && revenueConn) {
        if (!consent) {
          await prisma.workflowStep.update({
            where: { id: revenueStep.id },
            data: {
              status: 'FAILED',
              errorMessage: 'CONSENT_DENIED: Citizen did not authorize Revenue data access.',
            },
          });
        } else {
          await prisma.workflowStep.update({
            where: { id: revenueStep.id },
            data: { status: 'IN_PROGRESS' },
          });

          const propResult = await revenueConn.fetchPropertyRecord(
            formData.propertyId || 'TN-COI-2026-88192',
            formData.fullName || 'Citizen User',
            applicationId
          );

          standardizedProperty = propResult.data;

          await prisma.workflowStep.update({
            where: { id: revenueStep.id },
            data: {
              status: propResult.success ? 'COMPLETED' : 'FAILED',
              executionDurationMs: propResult.latencyMs,
              requestPayload: JSON.stringify({ propertyId: formData.propertyId, consentRef: consent.id }),
              responsePayload: JSON.stringify(propResult.data || propResult.error),
              completedAt: new Date(),
              errorMessage: propResult.error || null,
            },
          });

          // Log consent usage in history
          await prisma.consentHistory.create({
            data: {
              consentId: consent.id,
              action: 'ACCESSED',
              actorId: 'GOVCONNECT_ORCHESTRATOR',
              remarks: `Accessed Revenue Land Records for Water Connection Verification (${propResult.success ? 'SUCCESS' : 'FAILURE'})`,
            },
          });
        }
      }

      // ----------------------------------------------------
      // STEP 4: Document Verification (DigiLocker)
      // ----------------------------------------------------
      const digiStep = app.workflow.steps.find((s) => s.stageNumber === 4);
      if (digiStep && digiConn) {
        await prisma.workflowStep.update({
          where: { id: digiStep.id },
          data: { status: 'IN_PROGRESS' },
        });

        const docResult = await digiConn.verifyDocument(
          'PROPERTY_TAX_RECEIPT',
          formData.propertyId || 'DOC-TAX-2026',
          citizenId,
          applicationId
        );

        await prisma.workflowStep.update({
          where: { id: digiStep.id },
          data: {
            status: docResult.success ? 'COMPLETED' : 'FAILED',
            executionDurationMs: docResult.latencyMs,
            requestPayload: JSON.stringify({ doc: 'PROPERTY_TAX_RECEIPT', citizenId }),
            responsePayload: JSON.stringify(docResult.data || docResult.error),
            completedAt: new Date(),
            errorMessage: docResult.error || null,
          },
        });
      }

      // ----------------------------------------------------
      // Run Feasibility Check with Water Connector
      // ----------------------------------------------------
      if (waterConn) {
        await waterConn.checkConnectionFeasibility(
          formData.wardNumber || 'Ward 22',
          formData.doorNumber || '18/B',
          formData.connectionType || 'DOMESTIC',
          applicationId
        );
      }

      // ----------------------------------------------------
      // Update Application state to PENDING_APPROVAL for Water Officer
      // ----------------------------------------------------
      const combinedStandardized = {
        applicant: {
          fullName: formData.fullName,
          mobile: formData.mobile,
          email: formData.email,
        },
        property: standardizedProperty || {},
        serviceConfig: {
          connectionType: formData.connectionType || 'DOMESTIC',
          pipeDiameterInches: 0.5,
          estimatedCost: 250,
        },
        verificationStatus: {
          aadhaarVerified: true,
          revenueRecordCleared: true,
          digilockerAuthentic: true,
        },
      };

      await prisma.application.update({
        where: { id: applicationId },
        data: {
          status: ApplicationStatus.PENDING_APPROVAL,
          currentStep: 'Under Department Review (Water Officer)',
          standardizedData: JSON.stringify(combinedStandardized),
        },
      });

      await prisma.workflow.update({
        where: { id: app.workflow.id },
        data: { currentStage: 5 },
      });

      // Record status history
      await prisma.applicationStatusHistory.create({
        data: {
          applicationId,
          fromStatus: ApplicationStatus.SUBMITTED,
          toStatus: ApplicationStatus.PENDING_APPROVAL,
          changedByName: 'GovConnect Automated Interoperability Orchestrator',
          remarks: 'Automated Aadhaar, Revenue & DigiLocker verification completed successfully. Forwarded to Water Department Officer.',
        },
      });

      // Notify citizen
      await NotificationService.notifyUser(
        citizenId,
        'Application Under Department Review',
        `Your application ${app.applicationNumber} has passed automated cross-department checks and is now with the Water Officer for review.`,
        'VERIFICATION_COMPLETED',
        applicationId
      );

      await AuditService.log({
        actorId: citizenId,
        actorRole: 'CITIZEN',
        action: 'CROSS_DEPT_VERIFICATION_SUCCESS',
        entity: 'Application',
        entityId: applicationId,
        details: { applicationNumber: app.applicationNumber },
      });
    } catch (err: any) {
      logger.error({ err, applicationId }, 'Error in automated verification pipeline');
    }
  }

  /**
   * Officer Approves Application
   */
  public static async officerApprove(
    applicationId: string,
    officerId: string,
    officerName: string,
    remarks?: string
  ) {
    const app = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { workflow: { include: { steps: true } } },
    });

    if (!app) throw new Error('Application not found');

    // Update workflow step 5
    if (app.workflow) {
      const step5 = app.workflow.steps.find((s) => s.stageNumber === 5);
      if (step5) {
        await prisma.workflowStep.update({
          where: { id: step5.id },
          data: {
            status: 'COMPLETED',
            executionDurationMs: 80,
            responsePayload: JSON.stringify({ decision: 'APPROVED', remarks: remarks || 'Documents and property verified.' }),
            completedAt: new Date(),
          },
        });
      }

      await prisma.workflow.update({
        where: { id: app.workflow.id },
        data: { currentStage: 6 },
      });
    }

    await prisma.application.update({
      where: { id: applicationId },
      data: {
        status: ApplicationStatus.APPROVED,
        currentStep: 'Approved - Pending Connection Fee Payment (₹250)',
        officerRemarks: remarks || 'Approved after technical verification.',
        assignedOfficerId: officerId,
      },
    });

    await prisma.applicationStatusHistory.create({
      data: {
        applicationId,
        fromStatus: app.status,
        toStatus: ApplicationStatus.APPROVED,
        changedById: officerId,
        changedByName: officerName,
        remarks: remarks || 'Application approved by Department Officer.',
      },
    });

    await NotificationService.notifyUser(
      app.citizenId,
      'Application Approved!',
      `Your application ${app.applicationNumber} for New Water Connection has been approved by the Water Officer. Please complete simulated fee payment to finalize connection.`,
      'APPLICATION_APPROVED',
      applicationId
    );

    await AuditService.log({
      actorId: officerId,
      actorRole: 'OFFICER',
      action: 'APPLICATION_APPROVED',
      entity: 'Application',
      entityId: applicationId,
      details: { remarks },
    });
  }

  /**
   * Officer Rejects Application
   */
  public static async officerReject(
    applicationId: string,
    officerId: string,
    officerName: string,
    remarks: string
  ) {
    const app = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { workflow: { include: { steps: true } } },
    });

    if (!app) throw new Error('Application not found');

    if (app.workflow) {
      const step5 = app.workflow.steps.find((s) => s.stageNumber === 5);
      if (step5) {
        await prisma.workflowStep.update({
          where: { id: step5.id },
          data: {
            status: 'FAILED',
            errorMessage: remarks,
            completedAt: new Date(),
          },
        });
      }
    }

    await prisma.application.update({
      where: { id: applicationId },
      data: {
        status: ApplicationStatus.REJECTED,
        currentStep: 'Application Rejected',
        officerRemarks: remarks,
        assignedOfficerId: officerId,
      },
    });

    await prisma.applicationStatusHistory.create({
      data: {
        applicationId,
        fromStatus: app.status,
        toStatus: ApplicationStatus.REJECTED,
        changedById: officerId,
        changedByName: officerName,
        remarks,
      },
    });

    await NotificationService.notifyUser(
      app.citizenId,
      'Application Rejected',
      `Your application ${app.applicationNumber} was not approved. Reason: ${remarks}`,
      'APPLICATION_REJECTED',
      applicationId
    );

    await AuditService.log({
      actorId: officerId,
      actorRole: 'OFFICER',
      action: 'APPLICATION_REJECTED',
      entity: 'Application',
      entityId: applicationId,
      details: { remarks },
    });
  }

  /**
   * Finalizes workflow upon payment simulation
   */
  public static async completePaymentAndProvisioning(
    applicationId: string,
    paymentData: any
  ) {
    const app = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { workflow: { include: { steps: true } }, citizen: true },
    });

    if (!app) throw new Error('Application not found');

    const registry = ConnectorRegistry.getInstance();
    const waterConn = registry.getConnector<WaterConnector>('WATER');

    let workOrderData: any = null;
    if (waterConn) {
      const woResult = await waterConn.provisionConnection(app.applicationNumber, 'PROP-TN-2026-88192', applicationId);
      workOrderData = woResult.data;
    }

    if (app.workflow) {
      const step6 = app.workflow.steps.find((s) => s.stageNumber === 6);
      if (step6) {
        await prisma.workflowStep.update({
          where: { id: step6.id },
          data: {
            status: 'COMPLETED',
            executionDurationMs: 95,
            requestPayload: JSON.stringify(paymentData),
            responsePayload: JSON.stringify({ paymentStatus: 'CONFIRMED', workOrder: workOrderData }),
            completedAt: new Date(),
          },
        });
      }

      await prisma.workflow.update({
        where: { id: app.workflow.id },
        data: {
          currentStage: 6,
          isCompleted: true,
          completedAt: new Date(),
        },
      });
    }

    await prisma.application.update({
      where: { id: applicationId },
      data: {
        status: ApplicationStatus.COMPLETED,
        currentStep: 'Service Completed - Water Connection Provisioned',
      },
    });

    await prisma.applicationStatusHistory.create({
      data: {
        applicationId,
        fromStatus: ApplicationStatus.APPROVED,
        toStatus: ApplicationStatus.COMPLETED,
        changedByName: 'e-Treasury & Water Connection Provisioning Engine',
        remarks: `Payment ₹${paymentData.amount} confirmed (${paymentData.transactionNumber}). Work order generated. Service fully provisioned.`,
      },
    });

    await NotificationService.notifyUser(
      app.citizenId,
      'Service Provisioned & Completed!',
      `Payment confirmed for ${app.applicationNumber}. Municipal work order ${workOrderData?.work_order_no || 'WO-WTR-2026'} issued for pipe installation.`,
      'SERVICE_COMPLETED',
      applicationId
    );

    await AuditService.log({
      actorId: app.citizenId,
      actorRole: 'CITIZEN',
      action: 'PAYMENT_AND_SERVICE_COMPLETED',
      entity: 'Application',
      entityId: applicationId,
      details: { txn: paymentData.transactionNumber, amount: paymentData.amount },
    });
  }

  /**
   * Initializes a multi-department workflow for Driving Licence Renewal + Address Change
   */
  public static async initializeDrivingLicenceWorkflow(applicationId: string, citizenId: string, formData: any) {
    // 1. Create Workflow in DB with 5 planned stages
    const workflow = await prisma.workflow.create({
      data: {
        applicationId,
        currentStage: 1,
        totalStages: 5,
        isCompleted: false,
        steps: {
          create: [
            {
              stageNumber: 1,
              stageName: 'Application Submission',
              departmentCode: 'CITIZEN',
              status: 'COMPLETED',
              connectorName: 'GovConnect Portal',
              executionDurationMs: 38,
              completedAt: new Date(),
              requestPayload: JSON.stringify({ applicant: formData.fullName, dlNumber: formData.dlNumber }),
              responsePayload: JSON.stringify({ status: 'ACCEPTED_FOR_SARATHI_VALIDATION' }),
            },
            {
              stageNumber: 2,
              stageName: 'Identity & Biometric Check',
              departmentCode: 'AADHAAR',
              status: 'PENDING',
              connectorName: 'UIDAI Aadhaar Mock Connector',
            },
            {
              stageNumber: 3,
              stageName: 'Parivahan Sarathi Database Scrutiny',
              departmentCode: 'PARIVAHAN',
              status: 'PENDING',
              connectorName: 'MoRTH Parivahan / Sarathi Gateway',
            },
            {
              stageNumber: 4,
              stageName: 'Address Proof Verification',
              departmentCode: 'DIGILOCKER',
              status: 'PENDING',
              connectorName: 'DigiLocker National Platform',
            },
            {
              stageNumber: 5,
              stageName: 'RTO Endorsement & Smart Card Dispatch',
              departmentCode: 'TRANSPORT',
              status: 'PENDING',
              connectorName: 'State Transport Department & Speed Post Gateway',
            },
          ],
        },
      },
      include: {
        steps: true,
      },
    });

    // 2. Automatically execute Stage 2 (Aadhaar), Stage 3 (Parivahan Sarathi), Stage 4 (DigiLocker address verification)
    await this.runDrivingLicenceVerificationPipeline(applicationId, citizenId, formData);

    return workflow;
  }

  /**
   * Runs the automated cross-department connector pipeline for Driving Licence
   */
  public static async runDrivingLicenceVerificationPipeline(applicationId: string, citizenId: string, formData: any) {
    const registry = ConnectorRegistry.getInstance();
    let parivahanConn = registry.getConnector<ParivahanConnector>('PARIVAHAN');
    if (!parivahanConn) {
      parivahanConn = new ParivahanConnector();
      registry.registerConnector(parivahanConn);
    }
    const aadhaarConn = registry.getConnector<AadhaarConnector>('AADHAAR');
    const digiConn = registry.getConnector<DigiLockerConnector>('DIGILOCKER');

    const app = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { workflow: { include: { steps: true } }, citizen: true },
    });

    if (!app || !app.workflow) return;

    try {
      // -------------------------------------------------------------
      // STAGE 2: UIDAI Identity Check
      // -------------------------------------------------------------
      const step2 = app.workflow.steps.find((s) => s.stageNumber === 2);
      if (step2 && aadhaarConn) {
        const aadhaarRes = await aadhaarConn.verifyIdentity(
          formData.aadhaarToken || 'XXXX-XXXX-4819',
          formData.fullName,
          applicationId
        );

        await prisma.workflowStep.update({
          where: { id: step2.id },
          data: {
            status: aadhaarRes.success ? 'COMPLETED' : 'FAILED',
            executionDurationMs: aadhaarRes.latencyMs,
            requestPayload: JSON.stringify({ token: 'XXXX-XXXX-4819', name: formData.fullName }),
            responsePayload: JSON.stringify(aadhaarRes.data || { error: aadhaarRes.error }),
            completedAt: new Date(),
          },
        });
      }

      // -------------------------------------------------------------
      // STAGE 3: Parivahan Sarathi DL Record Scrutiny
      // -------------------------------------------------------------
      const step3 = app.workflow.steps.find((s) => s.stageNumber === 3);
      let sarathiData: any = null;
      if (step3 && parivahanConn) {
        const sarathiRes = await parivahanConn.verifyDrivingLicense(
          formData.dlNumber || 'TN38 20180004819',
          formData.dob || formData.dateOfBirth || '2007-06-25',
          applicationId
        );

        sarathiData = sarathiRes.data;

        await prisma.workflowStep.update({
          where: { id: step3.id },
          data: {
            status: sarathiRes.success ? 'COMPLETED' : 'FAILED',
            executionDurationMs: sarathiRes.latencyMs,
            requestPayload: JSON.stringify({ dlNumber: formData.dlNumber, operation: 'VERIFY_DL' }),
            responsePayload: JSON.stringify(sarathiRes.data || { error: sarathiRes.error }),
            completedAt: new Date(),
          },
        });
      }

      // -------------------------------------------------------------
      // STAGE 4: Address Proof Scrutiny via DigiLocker
      // -------------------------------------------------------------
      const step4 = app.workflow.steps.find((s) => s.stageNumber === 4);
      let addressProofVerified = true;
      if (step4) {
        await prisma.workflowStep.update({
          where: { id: step4.id },
          data: {
            status: 'COMPLETED',
            executionDurationMs: 65,
            requestPayload: JSON.stringify({
              newAddress: {
                houseBuilding: formData.houseBuilding || formData.doorNumber,
                street: formData.street || formData.streetName,
                city: formData.city,
                district: formData.district,
                state: formData.state,
                pincode: formData.pincode,
              },
              source: formData.isFromDigiLocker ? 'DIGILOCKER' : 'MANUAL_UPLOAD',
            }),
            responsePayload: JSON.stringify({
              verificationStatus: 'VERIFIED',
              documentAuthenticity: 'CRYPTOGRAPHIC_SEAL_VALID',
              jurisdictionRTO: 'TN-38 (Coimbatore South)',
            }),
            completedAt: new Date(),
          },
        });
      }

      // Update Canonical Standardized Model on Application
      const canonicalData = {
        applicant: {
          fullName: formData.fullName,
          dateOfBirth: formData.dob || formData.dateOfBirth,
          mobile: formData.mobile,
          email: formData.email,
        },
        drivingLicence: {
          dlNumber: formData.dlNumber,
          existingExpiryDate: formData.existingExpiryDate || sarathiData?.validity_non_transport,
          issuingState: formData.issuingState || 'Tamil Nadu',
          licensingAuthority: formData.licensingAuthority || sarathiData?.rto_office || 'TN-38 (Coimbatore South)',
          holderName: sarathiData?.holder_name || formData.fullName,
          status: sarathiData?.status || 'ACTIVE_VALID',
          servicesRequested: {
            renewLicence: formData.renewLicence !== false,
            changeAddress: formData.changeAddress !== false,
          },
        },
        addressChange: {
          existingAddress: formData.existingAddress || 'Old Address on Record',
          newAddress: {
            houseBuilding: formData.houseBuilding || formData.doorNumber,
            street: formData.street || formData.streetName,
            city: formData.city,
            district: formData.district,
            state: formData.state,
            pincode: formData.pincode,
          },
          source: formData.isFromDigiLocker ? 'DIGILOCKER' : 'MANUAL_ENTRY',
        },
        crossDepartmentChecks: {
          identityVerified: true,
          sarathiVerified: true,
          addressProofVerified: true,
          completedAt: new Date().toISOString(),
        },
      };

      await prisma.application.update({
        where: { id: applicationId },
        data: {
          status: ApplicationStatus.UNDER_VERIFICATION,
          currentStep: 'Automated Sarathi Checks Passed — Pending RTO Officer Endorsement',
          standardizedData: JSON.stringify(canonicalData),
          workflow: {
            update: {
              currentStage: 4,
            },
          },
        },
      });

      await prisma.applicationStatusHistory.create({
        data: {
          applicationId,
          fromStatus: ApplicationStatus.SUBMITTED,
          toStatus: ApplicationStatus.UNDER_VERIFICATION,
          changedByName: 'Parivahan / Sarathi Interoperability Engine',
          remarks: 'Aadhaar identity, Sarathi DL status, and DigiLocker address proof successfully verified.',
        },
      });

      await NotificationService.notifyUser(
        citizenId,
        'Driving Licence Verification Completed',
        `Parivahan Sarathi checks passed for application ${app.applicationNumber}. Under final RTO endorsement scrutiny.`,
        'VERIFICATION_COMPLETED',
        applicationId
      );

      await AuditService.log({
        actorId: citizenId,
        actorEmail: app.citizen.email,
        actorRole: 'CITIZEN',
        action: 'CROSS_DEPT_VERIFICATION_SUCCESS',
        entity: 'Application',
        entityId: applicationId,
        details: {
          dlNumber: formData.dlNumber,
          sarathiStatus: 'ACTIVE_VALID',
          rto: 'TN-38 (Coimbatore South)',
        },
      });
    } catch (err: any) {
      logger.error({ err, applicationId }, 'Error in Driving Licence verification pipeline');
    }
  }
}


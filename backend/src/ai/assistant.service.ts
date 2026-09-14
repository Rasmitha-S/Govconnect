import { prisma } from '../utils/prisma.js';
import { logger } from '../utils/logger.js';
import { ConnectorRegistry } from '../connectors/connector.registry.js';

export interface AIDetectionResult {
  detectedService: any | null;
  confidenceScore: number;
  extractedIntent: string;
  department: string | null;
  platform?: string;
  isSupportedOnGovConnect: boolean;
  officialPortalName?: string;
  officialPortalURL?: string;
  eligibilitySummary?: string;
  requiredDocuments?: string[];
  steps?: string[];
  aiExplanation: string;
  suggestedAction?: 'START_APPLICATION' | 'EXTERNAL_PORTAL' | 'FILE_GRIEVANCE' | 'MORE_INFO';
}

export interface AIGrievanceClassification {
  category: string;
  departmentCode: string;
  departmentName: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  extractedSummary: string;
  estimatedResolutionDays: number;
  confidenceScore: number;
}

export class AIAssistantService {
  /**
   * Conversational Assistant with Follow-up and Context Awareness
   */
  public static async processConversation(
    message: string,
    conversationHistory: Array<{ sender: string; text: string; serviceCode?: string }> = [],
    userId?: string
  ): Promise<{
    reply: string;
    serviceDetection?: AIDetectionResult;
    suggestedActions?: any[];
    contextServiceCode?: string;
  }> {
    const q = message.toLowerCase().trim();

    // 1. Status Inquiry Check
    const isStatusInquiry =
      q.includes('status') ||
      q.includes('track') ||
      q.includes('check my application') ||
      q.includes('where is my application') ||
      q.includes('progress of my') ||
      q.includes('application update');

    if (isStatusInquiry) {
      if (!userId) {
        return {
          reply: 'To track your application status, please sign in to your GovConnect account or view your Citizen Dashboard.',
          suggestedActions: [
            { label: 'Sign In to GovConnect', action: 'SIGN_IN' },
            { label: 'Explore Services Directory', action: 'VIEW_SERVICES' },
          ],
        };
      }

      // Fetch user applications from database
      const userApps = await prisma.application.findMany({
        where: { citizenId: userId },
        include: { service: true, department: true },
        orderBy: { createdAt: 'desc' },
      });

      if (userApps.length === 0) {
        return {
          reply: 'You currently have no submitted applications in your GovConnect account. You can discover services and apply directly from our Service Directory.',
          suggestedActions: [
            { label: 'Explore Services', action: 'VIEW_SERVICES' },
          ],
        };
      }

      // Try matching service keywords or pick latest
      const matchedApp =
        userApps.find(
          (a) =>
            q.includes(a.service.name.toLowerCase()) ||
            q.includes(a.service.serviceCode.toLowerCase()) ||
            (q.includes('water') && a.service.serviceCode.startsWith('WTR')) ||
            ((q.includes('license') || q.includes('transport') || q.includes('driving') || q.includes('parivahan')) && a.service.serviceCode.startsWith('TRN')) ||
            (q.includes('scholarship') && a.service.serviceCode.startsWith('SCH')) ||
            ((q.includes('health') || q.includes('ayushman') || q.includes('abha')) && a.service.serviceCode.startsWith('HLT')) ||
            ((q.includes('farmer') || q.includes('kisan')) && a.service.serviceCode.startsWith('AGR')) ||
            ((q.includes('worker') || q.includes('shram')) && a.service.serviceCode.startsWith('LAB')) ||
            ((q.includes('epfo') || q.includes('pf') || q.includes('uan')) && a.service.serviceCode.startsWith('EPF'))
        ) || userApps[0];

      if (matchedApp.applicationType === 'INTEGRATED') {
        return {
          reply:
            `Here is the current status of your integrated application:\n\n` +
            `• **Application ID:** ${matchedApp.applicationNumber}\n` +
            `• **Service:** ${matchedApp.service.name}\n` +
            `• **GovConnect Status:** ${matchedApp.status.replace(/_/g, ' ')}\n` +
            `• **External Platform:** ${matchedApp.externalPlatform || 'Government Portal'}\n` +
            `• **External Reference:** ${matchedApp.externalReferenceId || 'N/A'}\n` +
            `• **External Status:** ${matchedApp.externalStatus || 'N/A'}\n` +
            `• **Last Synchronized:** ${matchedApp.lastSyncedAt ? new Date(matchedApp.lastSyncedAt).toLocaleString() : 'Not yet synced'}\n\n` +
            `You can refresh live status or view complete details on the tracking page.`,
          contextServiceCode: matchedApp.service.serviceCode,
          suggestedActions: [
            { label: 'View Application', action: 'VIEW_APPLICATION', applicationId: matchedApp.id },
            { label: 'Refresh Status', action: 'REFRESH_STATUS', applicationId: matchedApp.id },
          ],
        };
      }

      if (matchedApp.applicationType === 'EXTERNAL_ONLY') {
        return {
          reply:
            `Your application for **${matchedApp.service.name}** is completed through the official government portal (${matchedApp.service.officialPortalName}).\n\n` +
            `Live status synchronization is available only where an authorized integration is supported. You can continue tracking directly on the official portal.`,
          contextServiceCode: matchedApp.service.serviceCode,
          suggestedActions: [
            { label: `Track on ${matchedApp.service.officialPortalName}`, action: 'OPEN_EXTERNAL', url: matchedApp.service.officialPortalURL },
          ],
        };
      }

      // NATIVE application
      return {
        reply:
          `Here is the status of your GovConnect application:\n\n` +
          `• **Application ID:** ${matchedApp.applicationNumber}\n` +
          `• **Service:** ${matchedApp.service.name}\n` +
          `• **Department:** ${matchedApp.department.name}\n` +
          `• **Current Status:** ${matchedApp.status.replace(/_/g, ' ')}\n` +
          `• **Current Stage:** ${matchedApp.currentStep}\n` +
          `• **Submitted Date:** ${new Date(matchedApp.createdAt).toLocaleDateString()}`,
        contextServiceCode: matchedApp.service.serviceCode,
        suggestedActions: [
          { label: 'View Application Tracker', action: 'VIEW_APPLICATION', applicationId: matchedApp.id },
        ],
      };
    }

    // 2. Identify previous context from conversation history if available
    let lastServiceCode: string | undefined;
    for (let i = conversationHistory.length - 1; i >= 0; i--) {
      if (conversationHistory[i].serviceCode) {
        lastServiceCode = conversationHistory[i].serviceCode;
        break;
      }
    }

    // 3. Check if current message is a follow-up inquiry
    const isDocInquiry = q.includes('document') || q.includes('proof') || q.includes('upload') || q.includes('what do i need');
    const isStepsInquiry = q.includes('how do i apply') || q.includes('how to apply') || q.includes('step') || q.includes('procedure') || q.includes('process');
    const isGovConnectCheck = q.includes('can i apply') || q.includes('apply through') || q.includes('is it supported') || q.includes('online');
    const isEligibilityInquiry = q.includes('eligib') || q.includes('who can apply') || q.includes('criteria');

    if (lastServiceCode && (isDocInquiry || isStepsInquiry || isGovConnectCheck || isEligibilityInquiry)) {
      const targetService = await prisma.service.findUnique({
        where: { serviceCode: lastServiceCode },
        include: { department: true, category: true },
      });

      if (targetService) {
        const docs = JSON.parse(targetService.requiredDocuments || '[]');
        const steps = JSON.parse(targetService.steps || '[]');

        if (isDocInquiry) {
          return {
            reply: `Here are the required documents for **${targetService.name}**:\n\n` +
              docs.map((d: string) => `• ${d}`).join('\n') +
              `\n\nWhen applying through GovConnect, documents can be automatically verified via DigiLocker with your digital consent.`,
            contextServiceCode: targetService.serviceCode,
            suggestedActions: [
              ...(targetService.govconnectSupported
                ? [{ label: `Start Application for ${targetService.name}`, action: 'START_APPLICATION', serviceCode: targetService.serviceCode }]
                : [{ label: `Apply on ${targetService.officialPortalName}`, action: 'OPEN_EXTERNAL', url: targetService.officialPortalURL }]),
            ],
          };
        }

        if (isStepsInquiry) {
          return {
            reply: `Here are the application steps for **${targetService.name}**:\n\n` +
              steps.map((s: string, idx: number) => `${idx + 1}. ${s.replace(/^\d+\.\s*/, '')}`).join('\n') +
              `\n\nOnce submitted, you will receive a unified tracking ID.`,
            contextServiceCode: targetService.serviceCode,
            suggestedActions: [
              ...(targetService.govconnectSupported
                ? [{ label: `Start Application for ${targetService.name}`, action: 'START_APPLICATION', serviceCode: targetService.serviceCode }]
                : [{ label: `Apply on ${targetService.officialPortalName}`, action: 'OPEN_EXTERNAL', url: targetService.officialPortalURL }]),
            ],
          };
        }

        if (isGovConnectCheck) {
          if (targetService.govconnectSupported) {
            return {
              reply: `Yes, **${targetService.name}** is fully supported for online application directly through GovConnect with automated cross-department verification.`,
              contextServiceCode: targetService.serviceCode,
              suggestedActions: [
                { label: `Start Application for ${targetService.name}`, action: 'START_APPLICATION', serviceCode: targetService.serviceCode },
              ],
            };
          } else {
            return {
              reply: `This service is currently not available for application directly through GovConnect. You can continue through the official service portal: ${targetService.officialPortalName}.`,
              contextServiceCode: targetService.serviceCode,
              suggestedActions: [
                { label: `Apply on ${targetService.officialPortalName}`, action: 'OPEN_EXTERNAL', url: targetService.officialPortalURL },
              ],
            };
          }
        }

        if (isEligibilityInquiry) {
          return {
            reply: `**Eligibility Criteria for ${targetService.name}:**\n\n${targetService.eligibility}`,
            contextServiceCode: targetService.serviceCode,
            suggestedActions: [
              ...(targetService.govconnectSupported
                ? [{ label: `Start Application for ${targetService.name}`, action: 'START_APPLICATION', serviceCode: targetService.serviceCode }]
                : [{ label: `Apply on ${targetService.officialPortalName}`, action: 'OPEN_EXTERNAL', url: targetService.officialPortalURL }]),
            ],
          };
        }
      }
    }

    // 3. Detect Service Intent directly
    const detection = await this.detectService(message);

    if (detection.detectedService && detection.confidenceScore >= 0.35) {
      const s = detection.detectedService;
      const docs = detection.requiredDocuments || [];
      const steps = detection.steps || [];

      let formattedReply = `Sure. I can help you apply for a **${s.name}**.\n\n` +
        `**Department:** ${detection.department}\n\n` +
        `**Eligibility:**\n` +
        `• ${detection.eligibilitySummary || 'Applicant must meet service criteria.'}\n` +
        `• Valid identity information is required.\n` +
        `• Property/address information is required where applicable.\n\n` +
        `**Required documents:**\n` +
        docs.map((d: string) => `• ${d}`).join('\n') +
        `\n\n**Application steps:**\n` +
        steps.map((st: string, i: number) => `${i + 1}. ${st.replace(/^\d+\.\s*/, '')}`).join('\n');

      if (s.supportsDigiLockerAutofill) {
        formattedReply += `\n\n💡 **Fast-Track with DigiLocker:** You can choose *"Fill using DigiLocker"* when starting this application to automatically retrieve permitted demographic details and verified documents with zero manual typing.`;
      }

      if (!detection.isSupportedOnGovConnect) {
        formattedReply += `\n\n*Note: This service is currently completed through the official government portal: ${detection.officialPortalName}.*`;
      }

      return {
        reply: formattedReply,
        serviceDetection: detection,
        contextServiceCode: s.serviceCode,
        suggestedActions: [
          ...(detection.isSupportedOnGovConnect
            ? [{ label: `Start Application`, action: 'START_APPLICATION', serviceCode: s.serviceCode }]
            : [{ label: `Apply on Official Portal`, action: 'OPEN_EXTERNAL', url: detection.officialPortalURL }]),
          { label: 'View Required Documents', action: 'VIEW_DOCS', docs: detection.requiredDocuments },
          { label: 'Check Eligibility Criteria', action: 'VIEW_ELIGIBILITY', eligibility: detection.eligibilitySummary },
        ],
      };
    }

    // 4. General Q&A Knowledge
    const qa = await this.answerQuestion(message);
    return {
      reply: qa.answer,
      suggestedActions: qa.relatedServices.map((r) => ({ label: r, action: 'INQUIRE', query: r })),
    };
  }

  /**
   * Deterministic NLP & Keyword Semantic Matcher for detecting citizen intent across all 18 domains
   */
  public static async detectService(query: string): Promise<AIDetectionResult> {
    const cleanQuery = query.toLowerCase().trim();

    const services = await prisma.service.findMany({
      include: {
        department: true,
        category: true,
      },
    });

    const keywordMap: Record<string, string[]> = {
      'WTR-001': ['water', 'tap', 'drinking water', 'pipeline', 'connection', 'meter', 'water supply', 'water board', 'kudineer', 'sewerage'],
      'PROP-001': ['property', 'land', 'patta', 'chitta', 'survey', 'deed', 'revenue', 'tax clearance', 'ownership', 'encumbrance', 'land records'],
      'SCH-001': ['scholarship', 'student', 'college', 'tuition', 'fee waiver', 'higher education', 'nsp', 'post-matric', 'fellowship', 'university'],
      'HLT-001': ['health', 'hospital', 'insurance', 'ayushman', 'cmchistn', 'medical', 'treatment', 'health card', 'abdm', 'abha', 'pm-jay'],
      'TRN-001': ['transport', 'driving licence', 'driving license', 'vehicle', 'rc', 'rto', 'fitness certificate', 'road tax', 'parivahan', 'sarathi'],
      'VOT-001': ['voter', 'epic', 'electoral', 'election', 'voter id', 'polling', 'eci'],
      'KIS-001': ['farmer', 'kisan', 'agriculture', 'pm-kisan', 'pmkisan', 'crop', 'land seeding', 'dbt'],
      'SHR-001': ['worker', 'unorganised', 'e-shram', 'eshram', 'labour', 'labor', 'pmsby', 'social security'],
      'EPF-001': ['epfo', 'pf', 'provident fund', 'pension', 'uan', 'passbook', 'claim', 'pf balance'],
      'TAX-001': ['tax', 'pan', 'income tax', 'itr', 'pan card', 'cbdt', 'tin', '26as'],
      'ESV-001': ['e-sevai', 'esevai', 'tnega', 'community certificate', 'nativity', 'income certificate'],
    };

    let bestMatch: any = null;
    let highestScore = 0;

    for (const service of services) {
      let score = 0;
      const keywords = keywordMap[service.serviceCode] || [];

      if (cleanQuery.includes(service.name.toLowerCase())) score += 70;
      if (cleanQuery.includes(service.category.name.toLowerCase())) score += 35;
      if (cleanQuery.includes(service.department.name.toLowerCase())) score += 30;

      for (const kw of keywords) {
        if (cleanQuery.includes(kw)) score += 20;
      }

      if (score > highestScore) {
        highestScore = score;
        bestMatch = service;
      }
    }

    if ((!bestMatch || highestScore < 15) && (cleanQuery.includes('water') || cleanQuery.includes('tap') || cleanQuery.includes('pipeline'))) {
      bestMatch = services.find((s) => s.serviceCode === 'WTR-001') || services[0];
      highestScore = 60;
    }

    if (!bestMatch || highestScore === 0) {
      return {
        detectedService: null,
        confidenceScore: 0.2,
        extractedIntent: 'Unclassified Service Request',
        department: null,
        isSupportedOnGovConnect: false,
        aiExplanation:
          "I couldn't identify a specific government service matching your query with high confidence. Please browse our Government Service Directory or describe what department or document you need assistance with.",
        suggestedAction: 'MORE_INFO',
      };
    }

    const docs = JSON.parse(bestMatch.requiredDocuments || '[]');
    const steps = JSON.parse(bestMatch.steps || '[]');

    return {
      detectedService: {
        id: bestMatch.id,
        serviceCode: bestMatch.serviceCode,
        name: bestMatch.name,
        description: bestMatch.description,
        feeAmount: bestMatch.feeAmount,
        processingDays: bestMatch.processingDays,
        department: bestMatch.department.name,
        category: bestMatch.category.name,
      },
      confidenceScore: Math.min(0.98, 0.4 + highestScore / 100),
      extractedIntent: `Apply for ${bestMatch.name}`,
      department: bestMatch.department.name,
      isSupportedOnGovConnect: bestMatch.govconnectSupported,
      officialPortalName: bestMatch.officialPortalName,
      officialPortalURL: bestMatch.officialPortalURL,
      eligibilitySummary: bestMatch.eligibility,
      requiredDocuments: docs,
      steps,
      aiExplanation: bestMatch.govconnectSupported
        ? `GovConnect has identified your request for "${bestMatch.name}". This service is integrated with our secure interoperability layer.`
        : `This service is currently completed through the official service portal: ${bestMatch.officialPortalName}.`,
      suggestedAction: bestMatch.govconnectSupported ? 'START_APPLICATION' : 'EXTERNAL_PORTAL',
    };
  }

  /**
   * Classifies citizen grievances into department, category, and urgency (with CPGRAMS mapping)
   */
  public static async classifyGrievance(text: string): Promise<AIGrievanceClassification> {
    const q = text.toLowerCase();

    const departments = await prisma.department.findMany();
    const waterDept = departments.find((d) => d.code === 'WATER') || departments[0];
    const revenueDept = departments.find((d) => d.code === 'REVENUE') || departments[0];
    const eduDept = departments.find((d) => d.code === 'EDUCATION') || departments[0];
    const transportDept = departments.find((d) => d.code === 'TRANSPORT') || departments[0];

    if (q.includes('bill') || q.includes('billing') || q.includes('charge') || q.includes('meter')) {
      return {
        category: 'Water Billing & Meter Dispute',
        departmentCode: waterDept.code,
        departmentName: waterDept.name,
        priority: q.includes('urgent') || q.includes('immediately') ? 'HIGH' : 'MEDIUM',
        extractedSummary: 'Discrepancy in municipal utility water billing or meter recording.',
        estimatedResolutionDays: 5,
        confidenceScore: 0.94,
      };
    }

    if (q.includes('leak') || q.includes('burst') || q.includes('drain') || q.includes('overflow') || q.includes('dirty water')) {
      return {
        category: 'Pipeline Leakage & Water Supply Disruption',
        departmentCode: waterDept.code,
        departmentName: waterDept.name,
        priority: 'URGENT',
        extractedSummary: 'Physical infrastructure leakage or contaminated water supply reported.',
        estimatedResolutionDays: 2,
        confidenceScore: 0.96,
      };
    }

    if (q.includes('patta') || q.includes('land') || q.includes('tax') || q.includes('boundary') || q.includes('survey')) {
      return {
        category: 'Land Records & Patta Discrepancy',
        departmentCode: revenueDept.code,
        departmentName: revenueDept.name,
        priority: 'MEDIUM',
        extractedSummary: 'Issue regarding property assessment or Patta mutation record.',
        estimatedResolutionDays: 14,
        confidenceScore: 0.91,
      };
    }

    if (q.includes('scholarship') || q.includes('tuition') || q.includes('disbursement') || q.includes('college')) {
      return {
        category: 'Scholarship Disbursement Delay',
        departmentCode: eduDept.code,
        departmentName: eduDept.name,
        priority: 'HIGH',
        extractedSummary: 'Delay in student scholarship grant processing.',
        estimatedResolutionDays: 7,
        confidenceScore: 0.92,
      };
    }

    if (q.includes('license') || q.includes('rc') || q.includes('rto') || q.includes('vehicle')) {
      return {
        category: 'Transport & RTO Service Delay',
        departmentCode: transportDept.code,
        departmentName: transportDept.name,
        priority: 'MEDIUM',
        extractedSummary: 'Delay or issue with driving licence or vehicle registration.',
        estimatedResolutionDays: 10,
        confidenceScore: 0.90,
      };
    }

    return {
      category: 'General Public Service Grievance',
      departmentCode: waterDept.code,
      departmentName: waterDept.name,
      priority: 'LOW',
      extractedSummary: 'General service grievance registered for departmental review.',
      estimatedResolutionDays: 10,
      confidenceScore: 0.75,
    };
  }

  /**
   * Conversational Q&A on government processes, interoperability, and documentation
   */
  public static async answerQuestion(query: string): Promise<{ answer: string; relatedServices: string[]; source: string }> {
    const q = query.toLowerCase();

    if (q.includes('water connection') || q.includes('new water')) {
      return {
        answer:
          'To apply for a New Water Connection on GovConnect, you need proof of property ownership (or assessment number). With your consent, GovConnect automatically verifies your property tax clearance with the Revenue Department and fetches verified certificates via DigiLocker, eliminating manual departmental visits.',
        relatedServices: ['New Water Connection (WTR-001)', 'Property Ownership & Patta-Chitta Verification (PROP-001)'],
        source: 'Municipal Administration & Water Supply Manual',
      };
    }

    if (q.includes('consent') || q.includes('privacy') || q.includes('data share')) {
      return {
        answer:
          'GovConnect follows a strict consent-first architecture. No government department can access your data from another department without your explicit, auditable permission. You can review, grant, or revoke consent at any time from your Data Consents dashboard.',
        relatedServices: ['Citizen Consent Framework', 'Audit Trail'],
        source: 'GovConnect Data Governance Architecture',
      };
    }

    if (q.includes('scholarship') || q.includes('education')) {
      return {
        answer:
          'GovConnect Post-Matric Scholarship workflow connects the Higher Education Department with DigiLocker to auto-verify academic transcripts and income certificates, enabling instant eligibility checks and direct benefit transfer (DBT).',
        relatedServices: ['Post-Matric Higher Education Scholarship (SCH-001)'],
        source: 'Department of Higher Education Guidelines',
      };
    }

    if (q.includes('epfo') || q.includes('pf') || q.includes('pension')) {
      return {
        answer:
          'EPFO services allow members to check their Universal Account Number (UAN) status, view EPF passbook balances, and submit online claims through the unified EPFO member portal.',
        relatedServices: ['EPFO Member Services (EPF-001)'],
        source: 'Employees’ Provident Fund Organisation Guidelines',
      };
    }

    if (q.includes('kisan') || q.includes('farmer')) {
      return {
        answer:
          'PM-KISAN provides eligible landholding farmer families with income support of ₹6,000 per year in three equal installments directly into their Aadhaar-seeded bank accounts.',
        relatedServices: ['PM-KISAN Farmer Scheme (KIS-001)'],
        source: 'Ministry of Agriculture & Farmers Welfare',
      };
    }

    if (q.includes('voter') || q.includes('epic')) {
      return {
        answer:
          'Voter Services allow citizens to search their name on the electoral roll, download digital e-EPIC cards, and apply for voter registration or address correction across assembly constituencies.',
        relatedServices: ['Voter Services & EPIC Verification (VOT-001)'],
        source: 'Election Commission of India Guidelines',
      };
    }

    return {
      answer:
        'GovConnect is a Unified Government Service Interoperability Platform that connects fragmented government systems through a secure interoperability layer. You can discover services, grant data consents, track unified application IDs (APP-2026-XXXXX), and file public grievances in one unified portal.',
      relatedServices: ['New Water Connection', 'Property Ownership Check', 'Post-Matric Scholarship', 'Voter Services'],
      source: 'GovConnect Service Architecture',
    };
  }
}

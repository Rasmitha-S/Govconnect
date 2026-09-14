export type Role = 'CITIZEN' | 'OFFICER' | 'CENTRAL_ADMIN';
export type AccountStatus = 'ACTIVE' | 'PENDING_APPROVAL' | 'PENDING_VERIFICATION' | 'SUSPENDED' | 'REJECTED';

export interface User {
  id: string;
  email: string;
  role: Role;
  accountStatus?: AccountStatus;
  organization?: string;
  employeeId?: string;
  approvedAt?: string;
  rejectionReason?: string;
  fullName: string;
  isEmailVerified: boolean;
  department?: {
    id: string;
    code: string;
    name: string;
    description: string;
  };
  profile?: {
    id: string;
    fullName: string;
    mobile?: string;
    address?: string;
    designation?: string;
    employeeCode?: string;
  };
}

export interface RegistrationRequest {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  accountStatus: AccountStatus;
  organization?: string;
  department?: {
    id: string;
    code: string;
    name: string;
  };
  employeeId?: string;
  designation?: string;
  isEmailVerified: boolean;
  approvedAt?: string;
  rejectionReason?: string;
  createdAt: string;
}

export interface Department {
  id: string;
  code: string;
  name: string;
  description: string;
  contactEmail: string;
  contactPhone: string;
  active: boolean;
  _count?: { services: number };
}

export interface ServiceCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  _count?: { services: number };
}

export interface Service {
  id: string;
  serviceCode: string;
  name: string;
  categoryId: string;
  category: ServiceCategory;
  departmentId: string;
  department: Department;
  description: string;
  eligibility: string;
  requiredDocuments: string[];
  steps: string[];
  officialPortalName: string;
  officialPortalURL: string;
  govconnectSupported: boolean;
  trackingMode?: 'NATIVE' | 'INTEGRATED' | 'EXTERNAL_ONLY';
  supportsDigiLockerAutofill?: boolean;
  feeAmount: number;
  processingDays: number;
  lastVerifiedDate: string;
}

export interface DigiLockerAutofillProfile {
  source: 'DIGILOCKER';
  fullName: string;
  dateOfBirth: string;
  gender: string;
  mobile: string;
  email?: string;
  address: {
    doorNumber: string;
    streetName: string;
    wardNumber: string;
    zone: string;
    city: string;
    district: string;
    state: string;
    pincode: string;
    country: string;
  };
  documents: Array<{
    documentType: string;
    fileName: string;
    issuer: string;
    uri: string;
    isVerified: boolean;
    verificationStatus: string;
  }>;
  retrievedAt: string;
}

export interface DigiLockerConsentInitiateResponse {
  sessionId: string;
  stateToken: string;
  serviceCode: string;
  serviceName: string;
  departmentName: string;
  requestedData: string[];
  purpose: string;
  dataSource: string;
  integrationMode: 'REAL_AUTHORIZED' | 'REPRESENTATIVE' | 'NOT_CONFIGURED';
  isRepresentative: boolean;
  authorizationUrl: string;
  expiresAt: string;
}

export interface WorkflowStep {
  id: string;
  stageNumber: number;
  stageName: string;
  departmentCode: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
  connectorName?: string;
  executionDurationMs?: number;
  requestPayload?: any;
  responsePayload?: any;
  errorMessage?: string;
  completedAt?: string;
}

export interface Workflow {
  id: string;
  currentStage: number;
  totalStages: number;
  isCompleted: boolean;
  steps: WorkflowStep[];
  startedAt: string;
  completedAt?: string;
}

export interface ConsentHistory {
  id: string;
  action: string;
  actorId: string;
  ipAddress?: string;
  remarks?: string;
  createdAt: string;
}

export interface Consent {
  id: string;
  citizenId: string;
  applicationId: string;
  requestingDeptCode: string;
  dataProviderDeptCode: string;
  purpose: string;
  dataFields: string[];
  status: 'PENDING' | 'GRANTED' | 'DENIED' | 'REVOKED' | 'EXPIRED';
  grantedAt?: string;
  revokedAt?: string;
  expiresAt?: string;
  history?: ConsentHistory[];
  application?: Application;
  createdAt: string;
}

export interface DocumentRecord {
  id: string;
  documentType: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  isVerified: boolean;
  verifiedByConnector?: string;
  verificationNotes?: string;
  createdAt: string;
}

export interface Application {
  id: string;
  applicationNumber: string;
  serviceId: string;
  service: Service;
  citizenId: string;
  citizen?: {
    email: string;
    citizenProfile?: {
      fullName: string;
      mobile: string;
      address: string;
    };
  };
  departmentId: string;
  department: Department;
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_VERIFICATION' | 'CROSS_DEPARTMENT_CHECK' | 'PENDING_APPROVAL' | 'APPROVED' | 'PAYMENT_PENDING' | 'PROCESSING' | 'COMPLETED' | 'REJECTED';
  currentStep: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  applicationType?: 'NATIVE' | 'INTEGRATED' | 'EXTERNAL_ONLY';
  externalPlatform?: string;
  externalReferenceId?: string;
  externalStatus?: string;
  lastSyncedAt?: string;
  syncStatus?: 'NOT_APPLICABLE' | 'NOT_CONFIGURED' | 'SUCCESS' | 'FAILED';
  rawFormData: any;
  standardizedData?: any;
  officerRemarks?: string;
  assignedOfficerId?: string;
  workflow?: Workflow;
  consents?: Consent[];
  documents?: DocumentRecord[];
  payments?: any[];
  statusHistory?: Array<{
    id: string;
    fromStatus: string;
    toStatus: string;
    changedByName?: string;
    remarks?: string;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface Connector {
  id: string;
  code: string;
  name: string;
  type: string;
  description: string;
  status: 'HEALTHY' | 'DEGRADED' | 'OFFLINE';
  healthStatus: string;
  avgLatencyMs: number;
  totalRequests: number;
  errorCount: number;
  failureRate: number;
  lastHealthCheck: string;
  simulatedMode: string;
  integrationMode?: 'REAL_AUTHORIZED' | 'REPRESENTATIVE' | 'NOT_CONFIGURED';
  isRepresentative?: boolean;
}

export interface Grievance {
  id: string;
  grievanceNumber: string;
  category: string;
  departmentId: string;
  department: Department;
  citizenId: string;
  citizen?: {
    citizenProfile?: { fullName: string };
  };
  description: string;
  status: 'SUBMITTED' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  resolutionRemarks?: string;
  resolvedAt?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  relatedApplicationId?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorId?: string;
  actorEmail?: string;
  actorRole?: string;
  action: string;
  entity: string;
  entityId?: string;
  details: any;
  ipAddress?: string;
  createdAt: string;
}

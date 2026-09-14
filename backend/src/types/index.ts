import { Request } from 'express';

export type Role = 'CITIZEN' | 'OFFICER' | 'CENTRAL_ADMIN';
export type AccountStatus = 'ACTIVE' | 'PENDING_APPROVAL' | 'PENDING_VERIFICATION' | 'SUSPENDED' | 'REJECTED';

export interface JwtPayload {
  userId: string;
  email: string;
  role: Role;
  departmentCode?: string; // Present for OFFICER role
  departmentId?: string;
  fullName: string;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

export enum ApplicationStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  UNDER_VERIFICATION = 'UNDER_VERIFICATION',
  CROSS_DEPARTMENT_CHECK = 'CROSS_DEPARTMENT_CHECK',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  PAYMENT_PENDING = 'PAYMENT_PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
}

export enum ConnectorHealth {
  HEALTHY = 'HEALTHY',
  DEGRADED = 'DEGRADED',
  OFFLINE = 'OFFLINE',
}

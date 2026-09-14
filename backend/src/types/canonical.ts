// GovConnect Canonical Data Models
// Standardized schema used across all GovConnect workflows

export interface CanonicalAddress {
  line1: string;
  line2?: string;
  landmark?: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  country: string;
}

export interface CanonicalIdentity {
  uidaiRef: string; // Tokenized reference
  fullName: string;
  gender: string;
  dob: string;
  mobile: string;
  email?: string;
  address: CanonicalAddress;
  isVerified: boolean;
  verifiedAt: string;
}

export interface CanonicalProperty {
  propertyId: string; // Unique survey or assessment number e.g. "TN-COI-2026-0812"
  ownerName: string;
  ownerCoOwners?: string[];
  propertyType: 'RESIDENTIAL' | 'COMMERCIAL' | 'AGRICULTURAL' | 'INDUSTRIAL';
  doorNumber: string;
  streetName: string;
  wardNumber: string;
  zone: string;
  address: CanonicalAddress;
  taxClearanceStatus: 'CLEARED' | 'PENDING' | 'OVERDUE';
  lastTaxPaidYear: string;
  waterSupplyStatus: 'NOT_CONNECTED' | 'CONNECTED' | 'DISCONNECTED';
  buildingApprovalRef: string;
  revenueRecordRef: string; // Patta / Chitta reference
  isVerified: boolean;
  verifiedAt: string;
}

export interface CanonicalEducationRecord {
  studentEnrollmentNo: string;
  institutionName: string;
  boardOrUniversity: string;
  courseName: string;
  currentYearOrSem: string;
  cgpaOrPercentage: number;
  incomeCategory: string;
  annualFamilyIncome: number;
  isEnrolled: boolean;
  isVerified: boolean;
  verifiedAt: string;
}

export interface CanonicalWaterConnectionApplication {
  applicantIdentity: CanonicalIdentity;
  propertyDetails: CanonicalProperty;
  connectionType: 'DOMESTIC' | 'COMMERCIAL' | 'INDUSTRIAL';
  pipeDiameterInches: number;
  estimatedDailyConsumptionLiters: number;
  nearestDistributionPoint: string;
  digilockerDocumentsVerified: boolean;
  revenueDepartmentCleared: boolean;
}

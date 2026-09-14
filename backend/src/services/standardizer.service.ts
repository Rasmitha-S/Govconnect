import { CanonicalAddress, CanonicalIdentity, CanonicalProperty, CanonicalEducationRecord } from '../types/canonical.js';

export class DataStandardizerService {
  /**
   * Transforms heterogeneous Revenue Department raw data into GovConnect CanonicalProperty model
   */
  public static standardizeRevenueProperty(rawRevenueData: any): CanonicalProperty {
    // Legacy revenue databases often use regional field names or snake_case conventions
    const owner = rawRevenueData.property_owner || rawRevenueData.owner_name || rawRevenueData.patta_holder_name || 'Unknown Owner';
    const propId = rawRevenueData.property_no || rawRevenueData.survey_assessment_no || rawRevenueData.propertyId || 'TN-MOCK-0000';
    const city = rawRevenueData.city || rawRevenueData.district || 'Coimbatore';
    const state = rawRevenueData.state || 'Tamil Nadu';
    const pincode = rawRevenueData.pincode || rawRevenueData.postal_code || '641001';

    const standardAddress: CanonicalAddress = {
      line1: rawRevenueData.address_line || rawRevenueData.door_no_street || rawRevenueData.street || 'Main Road',
      line2: rawRevenueData.locality || rawRevenueData.area || undefined,
      landmark: rawRevenueData.landmark || undefined,
      city: city,
      district: rawRevenueData.district || city,
      state: state,
      pincode: pincode,
      country: 'India',
    };

    return {
      propertyId: propId,
      ownerName: owner,
      ownerCoOwners: Array.isArray(rawRevenueData.co_owners) ? rawRevenueData.co_owners : [],
      propertyType: (rawRevenueData.property_type || 'RESIDENTIAL').toUpperCase() as any,
      doorNumber: rawRevenueData.door_no || rawRevenueData.door_number || '12/A',
      streetName: rawRevenueData.street_name || rawRevenueData.street || 'Gandhipuram 5th Street',
      wardNumber: String(rawRevenueData.ward_no || rawRevenueData.ward || 'Ward 14'),
      zone: rawRevenueData.zone || 'Central Zone',
      address: standardAddress,
      taxClearanceStatus: rawRevenueData.tax_clearance_status === 'CLEARED' || rawRevenueData.property_tax_paid === true ? 'CLEARED' : 'PENDING',
      lastTaxPaidYear: String(rawRevenueData.last_paid_year || rawRevenueData.tax_assessment_year || '2025-2026'),
      waterSupplyStatus: rawRevenueData.existing_water_connection ? 'CONNECTED' : 'NOT_CONNECTED',
      buildingApprovalRef: rawRevenueData.building_plan_approval_no || `BLD-APPR-${propId}`,
      revenueRecordRef: rawRevenueData.patta_chitta_no || `PATTA-${propId}`,
      isVerified: true,
      verifiedAt: new Date().toISOString(),
    };
  }

  /**
   * Transforms raw Aadhaar e-KYC response into CanonicalIdentity
   */
  public static standardizeAadhaarIdentity(rawAadhaarData: any): CanonicalIdentity {
    const address: CanonicalAddress = {
      line1: rawAadhaarData.co || rawAadhaarData.house || 'Door No 45',
      line2: rawAadhaarData.street || rawAadhaarData.loc || 'Anna Salai',
      landmark: rawAadhaarData.lm || undefined,
      city: rawAadhaarData.vtc || rawAadhaarData.subdist || 'Coimbatore',
      district: rawAadhaarData.dist || 'Coimbatore',
      state: rawAadhaarData.state || 'Tamil Nadu',
      pincode: rawAadhaarData.pc || '641001',
      country: 'India',
    };

    return {
      uidaiRef: rawAadhaarData.masked_aadhaar || rawAadhaarData.uid_token || 'XXXX-XXXX-4819',
      fullName: rawAadhaarData.name || 'Citizen User',
      gender: rawAadhaarData.gender === 'M' ? 'MALE' : rawAadhaarData.gender === 'F' ? 'FEMALE' : 'OTHER',
      dob: rawAadhaarData.dob || '1995-05-15',
      mobile: rawAadhaarData.mobile || '9876543210',
      email: rawAadhaarData.email || undefined,
      address,
      isVerified: true,
      verifiedAt: new Date().toISOString(),
    };
  }

  /**
   * Standardizes DigiLocker document metadata
   */
  public static standardizeDigiLockerDocument(rawDocData: any) {
    return {
      docId: rawDocData.doc_id || rawDocData.uri || `URI-DL-${Date.now()}`,
      docType: rawDocData.doc_type || rawDocData.type || 'GOV_CERTIFICATE',
      issuerName: rawDocData.issuer || 'Government of Tamil Nadu - Revenue / Municipal Administration',
      issueDate: rawDocData.issue_date || new Date().toISOString().split('T')[0],
      status: 'VERIFIED_AUTHENTIC',
      digitalSignatureStatus: 'VALID_GOV_ROOT_CA',
      extractedData: rawDocData.extracted_data || {},
      verifiedAt: new Date().toISOString(),
    };
  }

  /**
   * Standardizes Education Department enrollment response
   */
  public static standardizeEducationRecord(rawEduData: any): CanonicalEducationRecord {
    return {
      studentEnrollmentNo: rawEduData.reg_no || rawEduData.enrollment_id || 'STU-2026-9901',
      institutionName: rawEduData.college_name || rawEduData.institution || 'Government College of Technology, Coimbatore',
      boardOrUniversity: rawEduData.university || 'Anna University',
      courseName: rawEduData.degree_course || 'B.E. Computer Science & Engineering',
      currentYearOrSem: rawEduData.academic_year || 'Final Year (Semester 8)',
      cgpaOrPercentage: parseFloat(rawEduData.cgpa || rawEduData.percentage || '8.85'),
      incomeCategory: rawEduData.income_bracket || 'EWS_ELIGIBLE',
      annualFamilyIncome: parseFloat(rawEduData.annual_income || '180000'),
      isEnrolled: true,
      isVerified: true,
      verifiedAt: new Date().toISOString(),
    };
  }

  /**
   * Standardizes DigiLocker retrieved citizen profile and permitted documents into GovConnect form autofill model
   */
  public static standardizeDigiLockerProfile(rawProfileData: any) {
    const fullName = rawProfileData.full_name || rawProfileData.name || rawProfileData.fullName || 'Citizen User';
    const dob = rawProfileData.dob || rawProfileData.date_of_birth || rawProfileData.dateOfBirth || '2007-06-25';
    const gender = (rawProfileData.gender || 'FEMALE').toUpperCase();
    const mobile = rawProfileData.mobile || rawProfileData.phone || '9876543210';
    const email = rawProfileData.email || 'citizen@govconnect.demo';

    const rawAddr = rawProfileData.address || rawProfileData;
    const doorNumber = rawAddr.door_number || rawAddr.door_no || rawAddr.doorNumber || rawAddr.house_no || '18/B';
    const streetName = rawAddr.street_name || rawAddr.street || rawAddr.streetName || rawAddr.address_line || 'Avinashi Road, Anna Nagar Extension';
    const wardNumber = rawAddr.ward_number || rawAddr.ward_no || rawAddr.wardNumber || rawAddr.ward || 'Ward 22';
    const zone = rawAddr.zone || 'East Zone';
    const city = rawAddr.city || rawAddr.district || 'Coimbatore';
    const district = rawAddr.district || city;
    const state = rawAddr.state || 'Tamil Nadu';
    const pincode = String(rawAddr.pincode || rawAddr.postal_code || rawAddr.postalCode || '641004');

    const documents = Array.isArray(rawProfileData.documents)
      ? rawProfileData.documents.map((d: any) => ({
          documentType: d.doc_type || d.documentType || 'PROPERTY_TAX_RECEIPT',
          docType: d.doc_type || d.documentType || 'PROPERTY_TAX_RECEIPT',
          fileName: d.file_name || d.fileName || 'Property_Tax_Receipt_2025_2026.pdf',
          issuer: d.issuer || 'Government of Tamil Nadu - Municipal / Revenue Authority',
          uri: d.uri || `in.gov.digilocker.doc.${Date.now()}`,
          isVerified: d.is_verified ?? true,
          verified: d.is_verified ?? true,
          verificationStatus: 'VERIFIED',
        }))
      : [
          {
            documentType: 'PROPERTY_TAX_RECEIPT',
            docType: 'PROPERTY_TAX_RECEIPT',
            fileName: 'DigiLocker_Verified_Property_Tax_2025_2026.pdf',
            issuer: 'Government of Tamil Nadu - Municipal Administration',
            uri: `in.gov.digilocker.doc.${Date.now()}`,
            isVerified: true,
            verified: true,
            verificationStatus: 'VERIFIED',
          },
        ];

    return {
      source: 'DIGILOCKER',
      fullName,
      dateOfBirth: dob,
      gender,
      mobile,
      email,
      dlNumber: rawProfileData.dl_number || rawProfileData.dlNumber || 'TN38 20180004819',
      licenceExpiry: rawProfileData.validity_non_transport || rawProfileData.licenceExpiry || '2028-08-23',
      issuingState: rawProfileData.issuingState || 'Tamil Nadu',
      licensingAuthority: rawProfileData.licensingAuthority || 'TN-38 (Coimbatore South RTO)',
      address: {
        doorNumber,
        streetName,
        wardNumber,
        zone,
        city,
        district,
        state,
        pincode,
        country: 'India',
      },
      documents,
      retrievedAt: new Date().toISOString(),
    };
  }
}

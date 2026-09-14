/**
 * Maps raw heterogeneous external government platform statuses into 
 * standardized GovConnect canonical application lifecycle statuses.
 */
export function mapExternalStatusToGovConnectStatus(
  externalPlatform: string,
  externalStatus: string
): string {
  const norm = (externalStatus || '').toUpperCase().trim();

  // Common external status mappings
  switch (norm) {
    case 'DOCUMENT_VERIFICATION_PENDING':
    case 'UNDER_SCRUTINY':
    case 'IN_PROGRESS':
    case 'UNDER_REVIEW':
    case 'PENDING':
    case 'PROCESSING':
    case 'SUBMITTED':
      return 'UNDER_VERIFICATION';

    case 'APPROVED':
    case 'VERIFIED':
    case 'RECOMMENDED':
    case 'SANCTIONED':
    case 'GRANTED':
      return 'APPROVED';

    case 'PAYMENT_PENDING':
    case 'CHALLAN_GENERATED':
    case 'FEE_AWAITING':
      return 'PAYMENT_PENDING';

    case 'COMPLETED':
    case 'ISSUED':
    case 'DISPATCHED':
    case 'DELIVERED':
    case 'CLOSED_RESOLVED':
    case 'SETTLED':
      return 'COMPLETED';

    case 'REJECTED':
    case 'DISMISSED':
    case 'CANCELLED':
    case 'CLOSED_REJECTED':
      return 'REJECTED';

    default:
      return 'UNDER_VERIFICATION';
  }
}

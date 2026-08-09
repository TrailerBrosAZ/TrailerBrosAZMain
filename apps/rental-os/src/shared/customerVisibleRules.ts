export const CUSTOMER_RULES_VERSION = '2026-08-agreement-v1';

export const customerVisibleRules = {
  payload: {
    publishedPayloadLbs: 5200,
    gvwrLbs: 7000,
    dryWeightLbs: 1800,
    plateVerificationPending: true,
  },
  delivery: {
    basis: 'ONE_WAY_ROAD_MILES',
    rounding: 'ROUND_UP_TO_NEXT_WHOLE_MILE',
    rateCentsPerMile: 250,
    routingFailureOutcome: 'OWNER_REVIEW_NO_FABRICATED_FEE',
  },
  cancellation: {
    fullRefundNoticeHours: 48,
    lateMaximumChargeCents: 10000,
    lateChargeBasis: 'LESSER_OF_100_OR_BASE_RENT',
    legalWordingStatus: 'OWNER_DRAFT_ATTORNEY_REVIEW_PENDING',
  },
  travel: {
    interstate: 'PRIOR_WRITTEN_OWNER_APPROVAL_REQUIRED',
    international: 'PROHIBITED',
    explicitlyProhibitedDestinations: ['Mexico', 'Canada'],
  },
  payments: {
    sameDay: ['CASH'],
    advanceDirect: ['SQUARE', 'STRIPE', 'OTHER_OWNER_APPROVED_PROCESSOR'],
    marketplace: 'MARKETPLACE_PROCESSOR',
    operationalDecisionStatus: 'OWNER_CONFIRMED_POLICY_NOT_YET_FULLY_IMPLEMENTED',
  },
  licenseRecords: {
    standaloneImages: 'DELETE_AFTER_COMPLETION',
    completedAgreementPdf: 'MAY_REMAIN_SUBJECT_TO_PRIVACY_AND_RETENTION_ADVICE',
    legalWordingStatus: 'COUNSEL_WORDING_REQUIRED',
  },
  agreement: {
    currentAgreementOperative: true,
    replacementStatus: 'OWNER_DRAFT_PROTECTED_STAGING_ONLY',
    futureTermsSupersedeCurrent: false,
  },
} as const;

export const CUSTOMER_RULES_VERSION = '2026-07-22';

export const customerVisibleRules = {
  payload: {
    publishedPayloadLbs: 5200,
    gvwrLbs: 7000,
    dryWeightLbs: 1800,
    plateVerificationPending: true,
  },
  delivery: {
    zones: [
      { minimumExclusiveMiles: null, maximumInclusiveMiles: 10, feeCents: 2000 },
      { minimumExclusiveMiles: 10, maximumInclusiveMiles: 20, feeCents: 4000 },
      { minimumExclusiveMiles: 20, maximumInclusiveMiles: 35, feeCents: 6000 },
    ],
    beyondOnlineMiles: 35,
    beyondOnlineOutcome: 'OWNER_REVIEW_OR_UNAVAILABLE_ONLINE',
  },
  cancellation: {
    fullRefundNoticeHours: 48,
    lateRetainedCents: 10000,
    lateRefundBasis: 'UNEARNED_RENTAL_RATE_SUBTOTAL',
    legalWordingStatus: 'COUNSEL_WORDING_REQUIRED',
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
    replacementStatus: 'COUNSEL_APPROVED_REPLACEMENT_REQUIRED',
    futureTermsSupersedeCurrent: false,
  },
} as const;

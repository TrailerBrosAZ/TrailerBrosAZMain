import { AGREEMENT_SOURCE_VERSION, agreementTemplateHash, internalAgreementSource } from './agreement.js';

export const ATTORNEY_APPROVAL_CONFIRMATION = 'RECORD_ATTORNEY_APPROVAL_FOR_CURRENT_AGREEMENT';

export async function currentAgreementApprovalIdentity() {
  return { agreementVersion: AGREEMENT_SOURCE_VERSION, agreementSourceHash: await agreementTemplateHash(internalAgreementSource) };
}

export type AttorneyApprovalRecord = {
  id: number;
  agreement_version: string;
  agreement_source_hash: string;
  attorney_review_date: string;
  approval_reference: string;
  recorded_at: string;
  recorded_by: string;
};

export async function attorneyApprovalReadiness(record?: AttorneyApprovalRecord) {
  const current = await currentAgreementApprovalIdentity();
  const approved = Boolean(record && record.agreement_version === current.agreementVersion && record.agreement_source_hash === current.agreementSourceHash);
  return {
    status: approved ? 'APPROVED' as const : 'ATTORNEY_APPROVAL_REQUIRED' as const,
    approved,
    publicAgreementSigningAllowed: approved,
    liveCheckoutAllowed: approved,
    currentAgreementVersion: current.agreementVersion,
    approval: approved && record ? { attorneyReviewDate: record.attorney_review_date, approvalReference: record.approval_reference, recordedAt: record.recorded_at } : null,
    reason: approved ? 'The current agreement source has a matching recorded attorney approval.' : 'No matching attorney approval is recorded for the current agreement version and source hash.',
  };
}

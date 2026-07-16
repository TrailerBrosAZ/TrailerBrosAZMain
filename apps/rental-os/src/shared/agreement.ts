export const AGREEMENT_SOURCE_VERSION = 'public-rental-agreement-2026-07';
export const agreementStatuses = ['NOT_SENT','OPENED','SIGNED','EXPIRED'] as const;
export const pickupConditionStatuses = ['PENDING','COMPLETED','DECLINED'] as const;

export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.entries(value as Record<string, unknown>).sort(([a],[b])=>a.localeCompare(b)).map(([key,item])=>`${JSON.stringify(key)}:${canonicalJson(item)}`).join(',')}}`;
  return JSON.stringify(value);
}

export async function sha256Hex(value: string): Promise<string> {
  const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)));
  return Array.from(bytes, byte => byte.toString(16).padStart(2,'0')).join('');
}

export async function agreementTemplateHash(content: unknown): Promise<string> {
  return sha256Hex(canonicalJson(content));
}

export const internalAgreementSource = {
  sourceVersion: AGREEMENT_SOURCE_VERSION,
  sourceFile: 'rental-agreement.html',
  legalStatus: 'ATTORNEY_REVIEW_REQUIRED',
  sections: ['renter-and-contact','rental-details','charges-and-deposit','towing-and-insurance','use-restrictions','condition-and-damage','indemnity-and-liability','default-and-remedies','arizona-law-and-venue','electronic-signature'],
};

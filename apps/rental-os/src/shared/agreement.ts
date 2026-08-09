import { canonicalAgreementMarkdown } from '../legal/canonicalAgreement.generated.js';

export const AGREEMENT_SOURCE_VERSION = 'TB-RA-2026-08-v1';
export const AGREEMENT_LEGAL_STATUS = 'OWNER_DRAFT_ATTORNEY_REVIEW_PENDING';
export const agreementStatuses = ['NOT_SENT','OPENED','SIGNED','EXPIRED'] as const;
export const pickupConditionStatuses = ['PENDING','COMPLETED','DECLINED'] as const;
export const pickupInspectionChoices=['SEND_FORM','DECLINE_FORM'] as const;
export const pickupInspectionChoiceSource={section:'Pickup-Condition Inspection',legalStatus:'ARIZONA_ATTORNEY_REVIEW_REQUIRED',choices:{SEND_FORM:'Send me the pickup-condition inspection form. I understand I should complete it before using the trailer.',DECLINE_FORM:'I decline the pickup-condition inspection form. I understand that I am choosing not to document pre-existing condition concerns before using the trailer.'}} as const;

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

export function renderCanonicalAgreementVariables(markdown:string,values:{renterName:unknown;renterEmail:unknown;renterPhone:unknown;agreementVersion:unknown;bookingId:unknown;signature:unknown;signedAt:unknown}){
  const replacements:Record<string,string>={renter_name:String(values.renterName??'Not recorded'),renter_email:String(values.renterEmail??'Not recorded'),renter_phone:String(values.renterPhone??'Not recorded'),agreement_version:String(values.agreementVersion??'Not recorded'),booking_id:String(values.bookingId??'Not recorded'),signature:String(values.signature??'Drawn signature recorded below'),signed_at_timezone:String(values.signedAt??'Not recorded')};
  return markdown.replace(/\{\{([a-z_]+)\}\}/g,(_match,key:string)=>replacements[key]??'Not recorded');
}

export type AgreementClause={heading:string;paragraphs:string[];bullets:string[]};
export function agreementClausesFromMarkdown(markdown=canonicalAgreementMarkdown):AgreementClause[]{
  const clauses:AgreementClause[]=[];let current:AgreementClause|null=null;let paragraph:string[]=[];
  const flush=()=>{if(current&&paragraph.length){current.paragraphs.push(paragraph.join(' ').trim());paragraph=[]}};
  for(const raw of markdown.split(/\r?\n/)){
    const line=raw.trim();
    if(/^###\s+/.test(line)){flush();current={heading:line.replace(/^###\s+/,''),paragraphs:[],bullets:[]};clauses.push(current);continue}
    if(!current||!line){flush();continue}
    if(/^[-*]\s+/.test(line)){flush();current.bullets.push(line.replace(/^[-*]\s+/,''));continue}
    if(/^\d+\.\s+/.test(line)){flush();current.bullets.push(line.replace(/^\d+\.\s+/,''));continue}
    if(line==='---'||line.startsWith('**Agreement Version:**'))continue;
    paragraph.push(line);
  }
  flush();return clauses;
}
export const operativeAgreementClauses=agreementClausesFromMarkdown();

export const internalAgreementSource = {
  sourceVersion: AGREEMENT_SOURCE_VERSION,
  sourceFile: 'src/legal/TB-RA-2026-08-v1.md',
  sourceFormat: 'MARKDOWN',
  legalStatus: AGREEMENT_LEGAL_STATUS,
  canonicalMarkdown: canonicalAgreementMarkdown,
  sections: ['renter-and-contact','rental-details','charges-and-deposit','towing-and-insurance','use-restrictions','condition-and-damage','pickup-condition-inspection','indemnity-and-liability','default-and-remedies','arizona-law-and-venue','electronic-signature'],
  operativeAgreementClauses,
  excludedLegacyInterfaceMechanics: ['standalone-condition-photo-upload','driver-license-photo-upload','legacy-apps-script-submission','legacy-signature-controls'],
  pickupInspectionChoice:pickupInspectionChoiceSource,
};

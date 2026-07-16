export const COMMUNICATION_TEMPLATE_VERSION = 'owner-preview-v1';
export const communicationTemplateKeys = ['BOOKING_REQUEST_RECEIVED','AGREEMENT_ACTION_NEEDED','PICKUP_INSPECTION_REMINDER','PICKUP_INSTRUCTIONS','RETURN_REMINDER','DEPOSIT_OUTCOME'] as const;
export type CommunicationTemplateKey = typeof communicationTemplateKeys[number];
export type CommunicationContext = { customerName?:string|null; confirmationCode:string; pickupAt:string; returnAt:string; trailerName:string; depositOutcome?:string|null };
const fallback=(value:string|null|undefined,replacement:string)=>value?.trim()||replacement;
const az=(value:string)=>new Intl.DateTimeFormat('en-US',{timeZone:'America/Phoenix',dateStyle:'medium',timeStyle:'short'}).format(new Date(value));
export function renderCommunication(key:CommunicationTemplateKey,context:CommunicationContext){const name=fallback(context.customerName,'Trailer Bros customer');const common=`Reservation ${context.confirmationCode} for ${context.trailerName}`;const templates:Record<CommunicationTemplateKey,{subject:string;body:string}>={
  BOOKING_REQUEST_RECEIVED:{subject:'Trailer Bros booking request received',body:`Hi ${name}, we received your booking request. ${common}. This is not a confirmed reservation. We will review availability and qualifications before any next step.`},
  AGREEMENT_ACTION_NEEDED:{subject:'Trailer Bros rental agreement action needed',body:`Hi ${name}, your rental agreement needs attention for ${common}. Please use only the secure reservation-specific link provided by Trailer Bros. Contact us if the link is unavailable.`},
  PICKUP_INSPECTION_REMINDER:{subject:'Trailer Bros pickup inspection reminder',body:`Hi ${name}, your pickup is scheduled for ${az(context.pickupAt)} Arizona time. Please review the trailer condition with us before taking possession.`},
  PICKUP_INSTRUCTIONS:{subject:'Trailer Bros pickup instructions',body:`Hi ${name}, pickup for ${common} is scheduled for ${az(context.pickupAt)} Arizona time. Bring the named renter, tow vehicle, 2-5/16-inch hitch ball, and working electric brake controller.`},
  RETURN_REMINDER:{subject:'Trailer Bros return reminder',body:`Hi ${name}, return for ${common} is scheduled for ${az(context.returnAt)} Arizona time. The owner inspection and deposit decision occur after return.`},
  DEPOSIT_OUTCOME:{subject:'Trailer Bros deposit outcome recorded',body:`Hi ${name}, the owner recorded this deposit outcome for ${common}: ${fallback(context.depositOutcome,'decision pending')}. This preview does not execute a payment action.`},
};return {...templates[key],templateKey:key,templateVersion:COMMUNICATION_TEMPLATE_VERSION}}

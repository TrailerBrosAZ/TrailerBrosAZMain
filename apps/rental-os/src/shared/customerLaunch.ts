export type LaunchStageStatus='AVAILABLE_NOW'|'CURRENT'|'BLOCKED'|'COMPLETE';
export type LaunchStage={key:'availability'|'quote'|'qualification'|'delivery'|'agreement'|'payment'|'outcome';label:string;status:LaunchStageStatus;detail:string};
export function customerLaunchStages(input:{hasWindow:boolean;hasQuote:boolean;deliveryRequested:boolean;deliveryQuoted:boolean;submitted:boolean}):LaunchStage[]{return[
 {key:'availability',label:'Availability',status:input.submitted||input.hasWindow?'COMPLETE':'CURRENT',detail:'Authoritative Rental OS calendar check'},
 {key:'quote',label:'Quote',status:input.submitted||input.hasQuote?'COMPLETE':input.hasWindow?'CURRENT':'AVAILABLE_NOW',detail:'Server-authoritative rental estimate'},
 {key:'qualification',label:'Qualification',status:input.submitted?'COMPLETE':input.hasQuote?'CURRENT':'AVAILABLE_NOW',detail:'Age, towing, insurance acknowledgment, and intended use'},
 {key:'delivery',label:'Delivery',status:input.deliveryRequested?(input.deliveryQuoted?'COMPLETE':'CURRENT'):'AVAILABLE_NOW',detail:input.deliveryRequested?'Routes quote plus owner approval':'Customer pickup selected'},
 {key:'agreement',label:'Agreement',status:input.submitted?'CURRENT':'BLOCKED',detail:input.submitted?'Protected synthetic agreement step available for eligible pickup requests':'Available only after an eligible synthetic request is recorded'},
 {key:'payment',label:'Payment readiness',status:input.submitted?'AVAILABLE_NOW':'BLOCKED',detail:input.submitted?'Stripe test mode only after agreement and server readiness checks':'Available only in the protected synthetic checkout'},
 {key:'outcome',label:'Booking outcome',status:input.submitted?'AVAILABLE_NOW':'BLOCKED',detail:input.submitted?'Not confirmed; final server reconciliation and availability checks remain required':'No confirmation until all authoritative gates pass'},
 ]}

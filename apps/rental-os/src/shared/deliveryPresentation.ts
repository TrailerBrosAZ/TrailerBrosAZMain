import { formatArizona } from './arizonaTime.js';

export type OwnerDeliveryIntent={fulfillment_type:string;delivery_quote_status?:unknown;delivery_charge_cents?:unknown;delivery_distance_meters?:unknown;delivery_quoted_at?:unknown};
const money=(cents:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(cents/100);
export function ownerDeliveryPresentation(intent:OwnerDeliveryIntent){
 const status=String(intent.delivery_quote_status||'NOT_REQUESTED');
 if(intent.fulfillment_type!=='DELIVERY')return{status:'Customer pickup',zone:'Not applicable',fee:'Not applicable',timestamp:'Not applicable',calculation:'No delivery quote required'};
 if(status==='AVAILABLE'){const miles=Math.ceil(Number(intent.delivery_distance_meters||0)/1609.344);return{status:'Automatically calculated - owner approval required',zone:'Per-mile delivery',fee:intent.delivery_charge_cents==null?'Unavailable':money(Number(intent.delivery_charge_cents)),timestamp:intent.delivery_quoted_at?formatArizona(String(intent.delivery_quoted_at)):'Unavailable',calculation:`${miles} billable one-way road mile${miles===1?'':'s'} (rounded up) at $2.50/mile`};}
 if(status==='OUT_OF_AREA')return{status:'Requires owner review',zone:'Not quoted',fee:'Unavailable',timestamp:intent.delivery_quoted_at?formatArizona(String(intent.delivery_quoted_at)):'Unavailable',calculation:'No reliable route quote; no fee was invented'};
 return{status:'Owner review required',zone:'Unavailable',fee:'Not calculated',timestamp:intent.delivery_quoted_at?formatArizona(String(intent.delivery_quoted_at)):'Unavailable',calculation:'Routing unavailable; no fee was invented'};
}

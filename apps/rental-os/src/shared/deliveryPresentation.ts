import { formatArizona } from './arizonaTime.js';

export type OwnerDeliveryIntent={fulfillment_type:string;delivery_quote_status?:unknown;delivery_zone?:unknown;delivery_charge_cents?:unknown;delivery_quoted_at?:unknown};
const money=(cents:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(cents/100);
const label=(value:string)=>value.toLowerCase().replaceAll('_',' ').replace(/\b\w/g,character=>character.toUpperCase());

export function ownerDeliveryPresentation(intent:OwnerDeliveryIntent){
 const status=String(intent.delivery_quote_status||'NOT_REQUESTED');
 if(intent.fulfillment_type!=='DELIVERY')return{status:'Customer pickup',zone:'Not applicable',fee:'Not applicable',timestamp:'Not applicable',calculation:'No delivery quote required'};
 if(status==='AVAILABLE')return{status:'Automatically calculated — owner approval required',zone:label(String(intent.delivery_zone||'')),fee:intent.delivery_charge_cents==null?'Unavailable':money(Number(intent.delivery_charge_cents)),timestamp:intent.delivery_quoted_at?formatArizona(String(intent.delivery_quoted_at)):'Unavailable',calculation:'Automatic Routes quote snapshot'};
 if(status==='OUT_OF_AREA')return{status:'Unavailable for online delivery',zone:'Outside online service area',fee:'Unavailable',timestamp:intent.delivery_quoted_at?formatArizona(String(intent.delivery_quoted_at)):'Unavailable',calculation:'Automatically calculated; customer pickup may still be reviewed'};
 return{status:'Owner review required',zone:'Unavailable',fee:'Not calculated',timestamp:intent.delivery_quoted_at?formatArizona(String(intent.delivery_quoted_at)):'Unavailable',calculation:'Routing unavailable; no fee was invented'};
}

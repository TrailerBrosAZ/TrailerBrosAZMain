import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { AlertTriangle, CheckCircle2, ChevronRight, Clock3, ShieldCheck, Truck } from 'lucide-react';
import { formatArizona, parseArizonaDateTime } from '../shared/arizonaTime';
import { BOOKING_TIME_OPTIONS, calculateBookingQuote, type BookingQuote } from '../shared/booking';
import { ownerDeliveryPresentation } from '../shared/deliveryPresentation';
import { customerLaunchStages } from '../shared/customerLaunch';
import { customerDeliveryQuoteSummary } from '../shared/customerDeliveryPresentation';
import DirectCheckoutPreview from './DirectCheckoutPreview';

type Trailer={id:number;name:string;published_payload_lbs:number};
export type BookingIntent=Record<string,unknown>&{id:number;status:'SUBMITTED'|'REVIEW_REQUIRED'|'EXPIRED';legal_name:string;email:string;phone:string;trailer_name:string;operational_status:string;pickup_at:string;return_at:string;expires_at:string;rental_charge_cents:number;dolly_charge_cents:number;security_deposit_cents:number;estimated_due_before_delivery_cents:number;trip_type:string;fulfillment_type:string;exceptions:string[];audit_events?:Record<string,unknown>[];checkout_session?:Record<string,unknown>|null};
type DeliveryQuote={status:'AVAILABLE'|'OUT_OF_AREA'|'ROUTING_UNAVAILABLE';available:boolean;pricingMethod:'ONE_WAY_ROAD_MILES_ROUNDED_UP'|null;billableMiles:number|null;rateCentsPerMile:number|null;feeCents:number|null;quotedAt:string};
const money=(cents:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(cents/100);
const label=(value:string)=>value.toLowerCase().replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());
const combine=(date:string,time:string)=>date&&time?`${date}T${time}`:'';
const safeMessage=(value:unknown,fallback='The request could not be completed. Please review the form and try again.')=>{
 const message=typeof value==='string'?value:'';
 if(message.includes('15-minute'))return 'Choose a time in 15-minute increments between 6:00 AM and 10:00 PM Arizona time.';
 if(message.includes('between 6:00 AM'))return 'Choose pickup and return times between 6:00 AM and 10:00 PM Arizona time.';
 if(message.includes('Return must be after'))return 'Return must be after pickup.';
 if(message.includes('already reserved')||message.includes('no longer available'))return 'Those dates are no longer available. Choose another pickup or return time.';
 if(message.includes('at least 25')||message.includes('named renter')||message.includes('hitch ball')||message.includes('brake controller')||message.includes('Insurance')||message.includes('International')||message.includes('Interstate')||message.includes('delivery address'))return message;
 if(message.includes('duplicate'))return 'This request was already received. Refresh Booking Intents before submitting again.';
 return fallback;
};

export function CustomerBookingPreview({trailers,onSubmitted}:{trailers:Trailer[];onSubmitted:()=>void}){
 const [tripType,setTripType]=useState('IN_STATE');
 const [fulfillment,setFulfillment]=useState('PICKUP');
 const [pickupDate,setPickupDate]=useState('');const [pickupTime,setPickupTime]=useState('');
 const [returnDate,setReturnDate]=useState('');const [returnTime,setReturnTime]=useState('');
 const [dollyRequested,setDollyRequested]=useState(false);
 const [deliveryAddress,setDeliveryAddress]=useState('');const [deliveryQuote,setDeliveryQuote]=useState<DeliveryQuote|null>(null);const [deliveryQuoteBusy,setDeliveryQuoteBusy]=useState(false);
 const [available,setAvailable]=useState<boolean|null>(null);const [error,setError]=useState('');
 const [submitted,setSubmitted]=useState<BookingIntent|null>(null);const [idempotencyKey,setIdempotencyKey]=useState(()=>crypto.randomUUID());
 const pickupAt=combine(pickupDate,pickupTime),returnAt=combine(returnDate,returnTime);
 const quoteState=useMemo<{quote:BookingQuote|null;error:string}>(()=>{
  if(!pickupAt||!returnAt)return{quote:null,error:''};
  try{return{quote:calculateBookingQuote(parseArizonaDateTime(pickupAt),parseArizonaDateTime(returnAt),dollyRequested),error:''}}
  catch(cause){return{quote:null,error:safeMessage(cause instanceof Error?cause.message:'')}}
 },[pickupAt,returnAt,dollyRequested]);
 useEffect(()=>{setAvailable(null);setSubmitted(null)},[pickupAt,returnAt,dollyRequested,fulfillment,tripType]);

 async function requestDeliveryQuote(){setError('');setDeliveryQuote(null);if(deliveryAddress.trim().length<8){setError('Enter a complete delivery address.');return}setDeliveryQuoteBusy(true);try{const response=await fetch('/api/customer-preview/delivery-quote',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({deliveryAddress})});const result=await responseJson(response);if(!response.ok){setError(safeMessage(result.error,'Delivery could not be calculated right now. It can still be submitted for owner review.'));return}setDeliveryQuote(result.deliveryQuote)}catch{setError('Delivery could not be calculated right now. It can still be submitted for owner review.')}finally{setDeliveryQuoteBusy(false)}}

 async function responseJson(response:Response){try{return await response.json()}catch{return{error:'The service returned an unexpected response.'}}}
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();setError('');setSubmitted(null);
  if(!pickupAt||!returnAt){setError('Choose pickup and return dates and times.');return}
  if(!quoteState.quote){setError(quoteState.error||'Choose a valid pickup and return period.');return}
  const values=Object.fromEntries(new FormData(event.currentTarget));
  const requiredText=['legalName','email','phone','towVehicleDetails','intendedUse'] as const;
  if(requiredText.some(field=>!String(values[field]||'').trim())){setError('Complete all renter information before submitting.');return}
  if(!/^\S+@\S+\.\S+$/.test(String(values.email))){setError('Enter a valid email address.');return}
  if(!values.age25Confirmed){setError('Confirm that the renter is at least 25.');return}
  if(!values.namedRenterOnlyTowing){setError('Confirm that only the named renter will tow.');return}
  if(!values.hitchBallAcknowledged||!values.brakeControllerAcknowledged){setError('Confirm the required 2-5/16-inch hitch ball and electric brake controller.');return}
  if(!values.insuranceAcknowledged){setError('Acknowledge the insurance requirement before submitting.');return}
  if(tripType==='INTERSTATE'&&!String(values.interstateDetails||'').trim()){setError('Enter the interstate destination and trip details.');return}
  if(fulfillment==='DELIVERY'&&!deliveryAddress.trim()){setError('Enter the requested delivery address.');return}
  const payload={...values,deliveryAddress,pickupAt,returnAt,idempotencyKey,trailerId:Number(values.trailerId),age25Confirmed:values.age25Confirmed==='on',namedRenterOnlyTowing:values.namedRenterOnlyTowing==='on',hitchBallAcknowledged:values.hitchBallAcknowledged==='on',brakeControllerAcknowledged:values.brakeControllerAcknowledged==='on',insuranceAcknowledged:values.insuranceAcknowledged==='on',dollyRequested};
  try{
   const params=new URLSearchParams({trailerId:String(payload.trailerId),pickupAt,returnAt,dollyRequested:String(dollyRequested)});
   const availabilityResponse=await fetch(`/api/customer-preview/availability?${params}`);const availabilityResult=await responseJson(availabilityResponse);
   if(!availabilityResponse.ok){setError(safeMessage(availabilityResult.error));return}
   setAvailable(Boolean(availabilityResult.available));
   if(!availabilityResult.available){setError('Those dates are already reserved or blocked. Choose another pickup or return time.');return}
   const response=await fetch('/api/customer-preview/intents',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});const result=await responseJson(response);
   if(!response.ok){setError(safeMessage(result.error,response.status>=500?'The booking service is temporarily unavailable. Please try again.':'Please review the highlighted information and try again.'));return}
   setSubmitted(result.intent);if(result.intent.deliveryQuote)setDeliveryQuote(result.intent.deliveryQuote);setIdempotencyKey(crypto.randomUUID());onSubmitted();
  }catch{setError('The booking service could not be reached. Check your connection and try again.')}
 }

 return <div className="customer-preview">
  <section className="customer-hero"><div className="customer-brand-lockup"><img src="/tb-logo-circle.png" alt="Trailer Bros"/><div><span>PROTECTED STAGING PREVIEW</span><h2>Reserve the Trailer Bros utility trailer</h2><p>Preview availability and submit a synthetic request for owner review. This does not confirm a reservation.</p></div></div><ShieldCheck/></section>
  <LaunchJourney hasWindow={Boolean(pickupAt&&returnAt)} hasQuote={Boolean(quoteState.quote)} deliveryRequested={fulfillment==='DELIVERY'} deliveryQuoted={Boolean(deliveryQuote)} submitted={Boolean(submitted)}/>
  <div className="preview-grid"><form className="panel customer-form" onSubmit={event=>void submit(event)} noValidate>
   <fieldset><legend>Requested schedule</legend><label>Trailer<select name="trailerId" required>{trailers.map(trailer=><option key={trailer.id} value={trailer.id}>{trailer.name} · {trailer.published_payload_lbs.toLocaleString()} lb capacity</option>)}</select></label>
    <div className="two booking-date-time"><DateTimeChoice prefix="Pickup" date={pickupDate} time={pickupTime} onDate={setPickupDate} onTime={setPickupTime}/><DateTimeChoice prefix="Return" date={returnDate} time={returnTime} onDate={setReturnDate} onTime={setReturnTime}/></div>
    <small>Arizona time only · 6:00 AM–10:00 PM · 15-minute choices</small>{quoteState.error&&<div role="alert" className="inline-validation">{quoteState.error}</div>}
   </fieldset>
   <fieldset><legend>Renter information</legend><label>Full legal name<input name="legalName" autoComplete="name" maxLength={120} required/></label><div className="two"><label>Email<input name="email" type="email" autoComplete="email" required/></label><label>Phone<input name="phone" type="tel" autoComplete="tel" required/></label></div><label>Tow vehicle year, make, model, and relevant towing details<textarea name="towVehicleDetails" required maxLength={300}/></label><label>Intended use<textarea name="intendedUse" required maxLength={500}/></label></fieldset>
   <fieldset><legend>Trip and fulfillment</legend><div className="two"><label>Travel area<select name="tripType" value={tripType} onChange={event=>setTripType(event.target.value)}><option value="IN_STATE">Arizona only</option><option value="INTERSTATE">Interstate — owner approval required</option><option value="INTERNATIONAL">International — prohibited</option></select></label><label>Pickup or delivery<select name="fulfillmentType" value={fulfillment} onChange={event=>{setFulfillment(event.target.value);setDeliveryQuote(null)}}><option value="PICKUP">Customer pickup</option><option value="DELIVERY">Delivery — owner approval required</option></select></label></div>{tripType==='INTERSTATE'&&<label>Interstate destination and trip details<textarea name="interstateDetails" required maxLength={500}/></label>}{tripType==='INTERNATIONAL'&&<div className="form-error"><AlertTriangle/>International use is prohibited and cannot be submitted.</div>}{fulfillment==='DELIVERY'&&<div className="delivery-address"><label>Delivery address<textarea name="deliveryAddress" value={deliveryAddress} onChange={event=>{setDeliveryAddress(event.target.value);setDeliveryQuote(null)}} required maxLength={500}/></label><button type="button" className="secondary" disabled={deliveryQuoteBusy} onClick={()=>void requestDeliveryQuote()}>{deliveryQuoteBusy?'Calculating…':'Calculate delivery quote'}</button>{deliveryQuote?.status==='AVAILABLE'&&<div role="status" className="delivery-result available">Delivery available · {customerDeliveryQuoteSummary(deliveryQuote)}</div>}{deliveryQuote?.status==='OUT_OF_AREA'&&<div role="status" className="delivery-result unavailable">Delivery needs owner review; no fee was estimated.</div>}{deliveryQuote?.status==='ROUTING_UNAVAILABLE'&&<div role="status" className="delivery-result review">Delivery needs owner review; no fee was estimated.</div>}</div>}</fieldset>
   <fieldset><legend>Required confirmations</legend><label className="check"><input name="age25Confirmed" type="checkbox" required/>I confirm the renter is at least 25.</label><label className="check"><input name="namedRenterOnlyTowing" type="checkbox" required/>I understand only the named renter may tow.</label><label className="check"><input name="hitchBallAcknowledged" type="checkbox" required/>I have a 2-5/16-inch hitch ball.</label><label className="check"><input name="brakeControllerAcknowledged" type="checkbox" required/>I have a working electric brake controller.</label><label className="check"><input name="insuranceAcknowledged" type="checkbox" required/>I acknowledge that required insurance must be verified in the future approved workflow.</label><label className="check option"><input name="dollyRequested" type="checkbox" checked={dollyRequested} onChange={event=>setDollyRequested(event.target.checked)}/>Add dolly at $10 per rental day.</label><p className="included">Tow straps are included.</p></fieldset>
   {error&&<div role="alert" className="form-error"><AlertTriangle/>{error}</div>}{submitted&&<div role="status" className="intent-success"><CheckCircle2/><div><strong>{submitted.status==='REVIEW_REQUIRED'?'Request queued for owner approval':'Request recorded'}</strong><p>Intent #{submitted.id}: {submitted.status==='REVIEW_REQUIRED'?'owner-review window':'quote and checkout window'} ends {formatArizona(submitted.expires_at)}. The record is retained after expiration, no dates were held, and availability must be rechecked before any future next step.</p></div></div>}
   <button className="primary customer-submit" disabled={tripType==='INTERNATIONAL'}>Check availability and submit request</button>{submitted&&<DirectCheckoutPreview intent={submitted}/>}
  </form><QuoteCard quote={quoteState.quote} available={available} fulfillment={fulfillment} deliveryQuote={deliveryQuote}/></div>
  <section className="preview-disclaimer"><AlertTriangle/><div><strong>Staging preview only</strong><p>No live payment is collected. Eligible synthetic pickup requests receive a 15-minute authoritative date hold while completing protected Stripe test-mode checkout. Delivery or interstate requests remain nonblocking in owner review for 24 hours.</p></div></section>
  <section className="panel launch-readiness"><div><p>PROTECTED CHECKOUT AND FUTURE LAUNCH GATES</p><h3>What happens after a request</h3></div><div className="launch-gate-grid"><article><strong>Agreement action</strong><span>Synthetic staging only</span><p>Eligible pickup requests may record synthetic agreement evidence here. Public signing still requires attorney-reviewed text, public secure links, and acceptance approval.</p></article><article><strong>Payment readiness</strong><span>Stripe test mode only</span><p>Live Stripe is disconnected. Browser success alone can never confirm a reservation; signed server reconciliation and all readiness checks remain required.</p></article><article><strong>Booking outcome</strong><span>Server controlled</span><p>The intent remains nonblocking. Only the protected synthetic checkout can create a synthetic reservation after fresh transactional checks; no customer message is sent automatically.</p></article></div></section>
 </div>
}

function LaunchJourney(props:{hasWindow:boolean;hasQuote:boolean;deliveryRequested:boolean;deliveryQuoted:boolean;submitted:boolean}){const stages=customerLaunchStages(props);return <section className="launch-journey" aria-label="Customer booking journey">{stages.map((stage,index)=><article className={stage.status.toLowerCase()} key={stage.key}><span>{index+1}</span><div><strong>{stage.label}</strong><small>{stage.status.replaceAll('_',' ')}</small><p>{stage.detail}</p></div></article>)}</section>}

function DateTimeChoice({prefix,date,time,onDate,onTime}:{prefix:string;date:string;time:string;onDate:(value:string)=>void;onTime:(value:string)=>void}){
 return <div className="date-time-choice"><label>{prefix} date<input className="calendar-input" type="date" value={date} onChange={event=>onDate(event.target.value)} required/></label><label>{prefix} time<select value={time} onChange={event=>onTime(event.target.value)} required><option value="">Select time</option>{BOOKING_TIME_OPTIONS.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}</select></label></div>
}

function QuoteCard({quote,available,fulfillment,deliveryQuote}:{quote:BookingQuote|null;available:boolean|null;fulfillment:string;deliveryQuote:DeliveryQuote|null}){
 const deliveryFee=fulfillment==='DELIVERY'&&deliveryQuote?.status==='AVAILABLE'?(deliveryQuote.feeCents||0):0;const total=quote?quote.estimatedDueBeforeDeliveryCents+deliveryFee:0;
 return <aside className="panel quote-card" aria-live="polite"><p>ESTIMATED QUOTE</p><h3>{quote?money(total):'Select a valid rental period'}</h3>{available!==null&&<span className={available?'availability-yes':'availability-no'}>{available?'Available when checked':'Not available'}</span>}
  <div className="quote-lines"><span>Rental charge <b>{quote?money(quote.rentalChargeCents):'—'}</b></span>{quote&&<small>{quote.fullDays} complete rental day(s) · {quote.extraHours} additional hour(s){quote.extraHourCapped?' · additional hours capped at daily rate':''}</small>}<span>Dolly <b>{quote?(quote.dollyChargeCents?money(quote.dollyChargeCents):'Not selected'):'—'}</b></span><span>Refundable security-deposit requirement <b>{quote?money(quote.securityDepositCents):'$100.00'}</b></span><span>Delivery <b>{fulfillment!=='DELIVERY'?'Customer pickup':deliveryQuote?.status==='AVAILABLE'?customerDeliveryQuoteSummary(deliveryQuote):deliveryQuote?.status==='OUT_OF_AREA'?'Owner review — fee unavailable':deliveryQuote?.status==='ROUTING_UNAVAILABLE'?'Owner review — fee unavailable':'Request a quote'}</b></span><span>Tow straps <b>Included</b></span>{quote&&<span className="quote-total">Currently calculable estimate <b>{money(total)}</b></span>}</div>
  <p className="quote-note">Server pricing is authoritative. Delivery remains subject to owner approval. This estimate does not hold availability, guarantee delivery, confirm a reservation, or authorize payment.</p>
 </aside>
}

export function BookingIntentReview({selected,onSelect}:{selected:number|null;onSelect:(id:number|null)=>void}){const [intents,setIntents]=useState<BookingIntent[]>([]);const [detail,setDetail]=useState<BookingIntent|null>(null);const load=()=>fetch('/api/booking-intents').then(response=>response.json()).then(setIntents);useEffect(()=>{void load()},[]);useEffect(()=>{if(selected)void fetch(`/api/booking-intents/${selected}`).then(response=>response.json()).then(setDetail);else setDetail(null)},[selected]);if(detail)return <IntentDetail intent={detail} back={()=>onSelect(null)}/>;return <section className="panel intent-list"><div className="panel-head"><div><p>CUSTOMER PREVIEW REQUESTS</p><h3>Booking intents</h3></div><span className="count">{intents.length}</span></div>{intents.map(intent=><button key={intent.id} onClick={()=>onSelect(intent.id)}><div><strong>{intent.legal_name}</strong><span>{formatArizona(intent.pickup_at)} → {formatArizona(intent.return_at)}</span><small>{label(intent.trip_type)} · {label(intent.fulfillment_type)}</small></div><span className={`status ${intent.operational_status.toLowerCase()}`}>{label(intent.operational_status)}</span><ChevronRight/></button>)}{!intents.length&&<div className="empty">No customer booking intents have been submitted.</div>}</section>}

function IntentDetail({intent,back}:{intent:BookingIntent;back:()=>void}){
 const field=(name:string,value:unknown)=><div className="detail-field"><span>{name}</span><strong>{String(value||'—')}</strong></div>;
 const expiryLabel=intent.status==='REVIEW_REQUIRED'?'Owner-review window ends':'Quote/checkout-validity window ends';
 const delivery=ownerDeliveryPresentation(intent);
 return <div className="intent-detail"><button className="back" onClick={back}>← Back to booking intents</button><section className="panel detail-main">
  <div className="detail-hero"><div><span className={`status ${intent.operational_status.toLowerCase()}`}>{label(intent.operational_status)}</span><h3>{intent.legal_name}</h3><p>{intent.email} · {intent.phone}</p></div><strong>{money(Number(intent.estimated_total_cents||intent.estimated_due_before_delivery_cents))}</strong></div>
  <div className="detail-dates"><div><span>Pickup</span><strong>{formatArizona(intent.pickup_at)}</strong></div><Clock3/><div><span>Return</span><strong>{formatArizona(intent.return_at)}</strong></div></div>
  <section className="detail-section"><h4>Qualification and towing</h4><div>{field('Age 25 confirmed',intent.age_25_confirmed?'Yes':'No')}{field('Named renter only towing',intent.named_renter_only_towing?'Yes':'No')}{field('Tow vehicle',intent.tow_vehicle_details)}{field('2-5/16-inch ball',intent.hitch_ball_acknowledged?'Acknowledged':'No')}{field('Electric brake controller',intent.brake_controller_acknowledged?'Acknowledged':'No')}{field('Insurance requirement',intent.insurance_acknowledged?'Acknowledged':'No')}{field('Intended use',intent.intended_use)}</div></section>
  <section className="detail-section"><h4>Trip, fulfillment, and exceptions</h4><div>{field('Travel area',label(intent.trip_type))}{field('Interstate details',intent.interstate_details)}{field('Interstate approval',intent.interstate_approval_required?'Required':'Not required')}{field('Fulfillment',label(intent.fulfillment_type))}{field('Delivery address',intent.delivery_address)}{field('Exceptions',intent.exceptions.length?intent.exceptions.map(label).join('; '):'None')}</div></section>
  <section className="detail-section delivery-owner-snapshot"><h4>Delivery quote snapshot</h4><div>{field('Delivery status',delivery.status)}{field('Delivery zone',delivery.zone)}{field('Quoted fee',delivery.fee)}{field('Quote timestamp',delivery.timestamp)}{field('Quote source',delivery.calculation)}{field('Owner approval','Required for every delivery request')}</div><p className="owner-future-action">Future manual override or recalculation is not enabled. When added, it must require an owner reason, create an audit event, and revalidate pricing and availability without reserving dates.</p></section>
 <section className="detail-section"><h4>Quote snapshot</h4><div>{field('Rental',money(intent.rental_charge_cents))}{field('Dolly',money(intent.dolly_charge_cents))}{field('Security-deposit requirement',money(intent.security_deposit_cents))}{field('Tax treatment','No separate Arizona tax line')}{field('Delivery fee',delivery.fee)}{field(expiryLabel,formatArizona(intent.expires_at))}{field('Expired-record handling','Retained for audit; pricing, qualifications, and availability must be revalidated')}</div></section>
 {intent.checkout_session&&<section className="detail-section"><h4>Direct checkout orchestration</h4><div>{field('Current state',label(String(intent.checkout_session.state)))}{field('Checkout expires',formatArizona(String(intent.checkout_session.expires_at)))}{field('Payment reference',intent.checkout_session.provider_payment_id)}{field('Reservation',intent.checkout_session.reservation_id?`Reservation #${intent.checkout_session.reservation_id}`:'Not created')}{field('Last transition',formatArizona(String(intent.checkout_session.last_transition_at)))}</div><p className="owner-future-action">The owner may inspect blockers and audit history, but cannot bypass qualification, agreement, reconciled payment, approvals, or final transactional availability.</p></section>}
 {intent.operational_status==='SUBMITTED'&&!intent.checkout_session&&<DirectCheckoutPreview intent={{...intent,status:'SUBMITTED'}}/>}
 </section><section className="preview-disclaimer"><Truck/><div><strong>Review only — no availability hold</strong><p>Owner review or future approval does not reserve dates or guarantee availability. This retained synthetic record cannot be converted or paid here; any future conversion or payment attempt requires a new transactional availability check.</p></div></section></div>
}

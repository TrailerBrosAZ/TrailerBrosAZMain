import { useState, type FormEvent } from 'react';
import { AlertTriangle, CheckCircle2, ClipboardCheck, Edit3, LogOut, RotateCcw, ShieldCheck, XCircle } from 'lucide-react';

type RecordLike = Record<string, unknown>;
export type OperationalReservation = RecordLike & { id:number;status:string;operational_status?:string;pickup_at:string;return_at:string;rental_charge_cents:number;dolly_days:number;notes?:string;external_reference?:string;version:number;inspections?:RecordLike[];cancellation_outcome?:RecordLike|null;deposit_decision?:RecordLike|null;audit_events?:RecordLike[] };
const label = (status:string) => status.toLowerCase().replaceAll('_',' ').replace(/\b\w/g,character=>character.toUpperCase());
const localInput = (iso:string) => { const date=new Date(iso);const local=new Date(date.getTime()-date.getTimezoneOffset()*60000);return local.toISOString().slice(0,16); };

export default function ReservationOperations({reservation,onChanged}:{reservation:OperationalReservation;onChanged:()=>Promise<void>}) {
  const [mode,setMode]=useState<string|null>(null);const [error,setError]=useState('');const [busy,setBusy]=useState(false);const operationalStatus=reservation.operational_status||reservation.status;
  async function send(path:string,method:string,body:unknown) { setBusy(true);setError('');try { const response=await fetch(path,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const result=response.status===204?{}:await response.json();if(!response.ok)throw new Error(result.error||'Action failed.');setMode(null);await onChanged(); } catch(caught) { setError((caught as Error).message); } finally { setBusy(false); } }
  const transition=(to:string,notes='Owner action')=>send(`/api/reservations/${reservation.id}/transition`,'POST',{to,notes});
  return <section className="operations-card">
    <div className="operations-head"><div><p>OWNER ACTIONS</p><h3>{label(operationalStatus)}</h3></div><span>All actions are recorded</span></div>
    <div className="operation-buttons">
      {!['COMPLETED','CANCELLED','NO_SHOW'].includes(reservation.status)&&<button onClick={()=>setMode('edit')}><Edit3/>Edit / reschedule</button>}
      {reservation.status==='PENDING_REVIEW'&&<button className="positive" onClick={()=>void transition('CONFIRMED','Owner approved reservation')}><CheckCircle2/>Confirm</button>}
      {reservation.status==='CONFIRMED'&&<button className="positive" onClick={()=>setMode('pickup')}><LogOut/>Pickup inspection</button>}
      {reservation.status==='CHECKED_OUT'&&<button className="positive" onClick={()=>setMode('return')}><RotateCcw/>Return inspection</button>}
      {reservation.status==='INSPECTION_PENDING'&&!reservation.deposit_decision&&<><button className="positive" onClick={()=>setMode('release')}><ShieldCheck/>Record release</button><button onClick={()=>setMode('retain')}><AlertTriangle/>Record damage retain</button></>}
      {reservation.status==='INSPECTION_PENDING'&&reservation.deposit_decision&&<button className="positive" onClick={()=>void transition('COMPLETED','Inspection and deposit decision complete')}><ClipboardCheck/>Complete rental</button>}
      {['PENDING_REVIEW','CONFIRMED'].includes(reservation.status)&&<button className="danger" onClick={()=>setMode('cancel')}><XCircle/>Cancel</button>}
      {reservation.status==='CONFIRMED'&&<button className="danger" onClick={()=>setMode('no_show')}><XCircle/>No show</button>}
    </div>
    {error&&<div className="form-error"><AlertTriangle/>{error}</div>}
    {mode&&<OperationForm mode={mode} reservation={reservation} busy={busy} close={()=>{setMode(null);setError('');}} submit={(path,method,body)=>void send(path,method,body)}/>}
  </section>;
}

function OperationForm({mode,reservation,busy,close,submit}:{mode:string;reservation:OperationalReservation;busy:boolean;close:()=>void;submit:(path:string,method:string,body:unknown)=>void}) {
  function handle(event:FormEvent<HTMLFormElement>) { event.preventDefault();const form=new FormData(event.currentTarget);
    if(mode==='edit')return submit(`/api/reservations/${reservation.id}`,'PATCH',{version:reservation.version,pickupAt:form.get('pickupAt'),returnAt:form.get('returnAt'),rentalChargeCents:Number(form.get('rentalChargeDollars'))*100,dollyDays:Number(form.get('dollyDays')),notes:form.get('notes'),externalReference:reservation.external_reference||'',reason:form.get('reason')});
    if(['cancel','no_show'].includes(mode))return submit(`/api/reservations/${reservation.id}/outcome`,'POST',{type:mode==='no_show'?'NO_SHOW':'CANCELLATION',notes:form.get('notes')});
    if(['pickup','return'].includes(mode))return submit(`/api/reservations/${reservation.id}/inspections/${mode}`,'POST',{conditionNotes:form.get('conditionNotes'),usageTripNotes:form.get('usageTripNotes'),damageFound:form.get('damageFound')==='on',damageNotes:form.get('damageNotes'),photoReferences:String(form.get('photoReferences')||'').split(/\r?\n/).map(value=>value.trim()).filter(Boolean)});
    return submit(`/api/reservations/${reservation.id}/deposit-decision`,'POST',{decision:mode==='retain'?'RETAIN_RECORDED':'RELEASE_RECORDED',amountCents:mode==='retain'?Number(form.get('amountDollars'))*100:0,reason:form.get('reason'),damageNotes:form.get('damageNotes')||undefined});
  }
  const title={edit:'Edit / reschedule',cancel:'Record cancellation',no_show:'Record no show',pickup:'Pickup inspection',return:'Return inspection',release:'Record deposit release decision',retain:'Record damage retain decision'}[mode]||'Owner action';
  return <form className="operation-form" onSubmit={handle}>
    <h4>{title}</h4>
    {mode==='edit'&&<><div className="two"><label>Pickup<input name="pickupAt" type="datetime-local" step="1800" defaultValue={localInput(reservation.pickup_at)} required/></label><label>Return<input name="returnAt" type="datetime-local" step="1800" defaultValue={localInput(reservation.return_at)} required/></label></div><div className="two"><label>Rental charge<input name="rentalChargeDollars" type="number" min="0" defaultValue={reservation.rental_charge_cents/100}/></label><label>Dolly days<input name="dollyDays" type="number" min="0" defaultValue={reservation.dolly_days}/></label></div><label>Owner notes<textarea name="notes" defaultValue={reservation.notes||''}/></label><label>Reason for change<input name="reason" required/></label></>}
    {['cancel','no_show'].includes(mode)&&<><p className="operation-note">No payment is processed. This records the approved refund and retention outcome only.</p><label>Owner decision notes<textarea name="notes" required/></label></>}
    {['pickup','return'].includes(mode)&&<><label>Condition notes<textarea name="conditionNotes" required/></label><label>Usage / trip notes<textarea name="usageTripNotes"/></label><label className="check"><input type="checkbox" name="damageFound"/> Damage found</label><label>Damage notes<textarea name="damageNotes"/></label><label>Photo metadata labels, one per line<textarea name="photoReferences" placeholder="Short labels only; no paths, URLs, or files"/></label><p className="operation-note">Hosted photo attachments are disabled. Secure photo storage is planned for a later phase.</p></>}
    {mode==='release'&&<><p className="operation-note">Owner-recorded placeholder only. No payment authorization or release occurs.</p><label>Release reason<input name="reason" required defaultValue="Return inspection complete; release recorded"/></label></>}
    {mode==='retain'&&<><p className="operation-note">Requires a completed return inspection. No payment action occurs.</p><label>Amount to retain<input name="amountDollars" type="number" min="1" required/></label><label>Reason<input name="reason" required/></label><label>Damage notes<textarea name="damageNotes" required/></label></>}
    <div className="form-actions"><button type="button" className="secondary" onClick={close}>Close</button><button className="primary" disabled={busy}>{busy?'Saving...':'Record action'}</button></div>
  </form>;
}

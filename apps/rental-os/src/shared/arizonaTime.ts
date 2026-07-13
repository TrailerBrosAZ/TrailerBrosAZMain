export const ARIZONA_TIME_ZONE = 'America/Phoenix';

const wallClockPattern = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;
const sqliteUtcPattern = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
const formatter = new Intl.DateTimeFormat('en-US', { timeZone: ARIZONA_TIME_ZONE, year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23' });

export function parseArizonaDateTime(value: unknown): Date {
  if (value instanceof Date) return new Date(value.getTime());
  if (typeof value !== 'string') throw new Error('A valid Arizona date and time is required.');
  const trimmed=value.trim();const wallClock=wallClockPattern.exec(trimmed);
  const normalized=wallClock?`${trimmed}${wallClock[6]?'':':00'}-07:00`:sqliteUtcPattern.test(trimmed)?`${trimmed.replace(' ','T')}Z`:trimmed;
  const date=new Date(normalized);
  if(Number.isNaN(date.getTime()))throw new Error('A valid Arizona date and time is required.');
  return date;
}
export function arizonaParts(value:string|Date){const date=value instanceof Date?value:parseArizonaDateTime(value);const parts=Object.fromEntries(formatter.formatToParts(date).filter(part=>part.type!=='literal').map(part=>[part.type,part.value]));return{year:Number(parts.year),month:Number(parts.month),day:Number(parts.day),hour:Number(parts.hour),minute:Number(parts.minute),second:Number(parts.second)}}
export function toArizonaInput(value:string|Date){const p=arizonaParts(value);return`${p.year}-${String(p.month).padStart(2,'0')}-${String(p.day).padStart(2,'0')}T${String(p.hour).padStart(2,'0')}:${String(p.minute).padStart(2,'0')}`}
export function arizonaDayKey(value:string|Date){return toArizonaInput(value).slice(0,10)}
export function formatArizona(value:string|Date,time=true){return new Intl.DateTimeFormat('en-US',{timeZone:ARIZONA_TIME_ZONE,month:'short',day:'numeric',year:'numeric',...(time?{hour:'numeric',minute:'2-digit'}:{})}).format(value instanceof Date?value:parseArizonaDateTime(value))}

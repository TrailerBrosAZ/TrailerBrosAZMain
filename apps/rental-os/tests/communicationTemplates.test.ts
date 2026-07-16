import { describe, expect, it } from 'vitest';
import { communicationTemplateKeys, renderCommunication } from '../src/shared/communicationTemplates.js';

const context={customerName:'Synthetic Owner Test',confirmationCode:'SYN-100',pickupAt:'2026-07-16T13:00:00.000Z',returnAt:'2026-07-17T13:00:00.000Z',trailerName:'Synthetic Trailer'};
describe('deterministic communication templates',()=>{
  it('renders every approved template without a delivery action',()=>{for(const key of communicationTemplateKeys){const first=renderCommunication(key,context);expect(renderCommunication(key,context)).toEqual(first);expect(first.subject).toBeTruthy();expect(first.body).toBeTruthy();expect(first.body).not.toMatch(/send|sent via|emailed/i)}});
  it('uses safe fallbacks and Arizona time',()=>{const result=renderCommunication('PICKUP_INSPECTION_REMINDER',{...context,customerName:''});expect(result.body).toContain('Trailer Bros customer');expect(result.body).toContain('6:00 AM')});
  it('labels deposit outcomes as records, not payment execution',()=>{const result=renderCommunication('DEPOSIT_OUTCOME',{...context,depositOutcome:'RELEASE_RECORDED'});expect(result.body).toContain('RELEASE_RECORDED');expect(result.body).toContain('does not execute a payment action')});
});

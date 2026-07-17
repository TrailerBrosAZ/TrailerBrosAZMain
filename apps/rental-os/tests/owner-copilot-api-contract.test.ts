import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';

const source=readFileSync(new URL('../src/client/OwnerCopilot.tsx',import.meta.url),'utf8');

describe('Owner Copilot authoritative API contract',()=>{
  it('loads review-required booking intents through the owner API',()=>{
    expect(source).toContain("fetch('/api/booking-intents')");
  });

  it('creates an external booking only through the authoritative reservation API',()=>{
    expect(source).toContain("'/api/reservations/external'");
    expect(source).toContain("method:'POST'");
    expect(source).toContain('Confirm owner action');
  });

  it('creates a blackout only through the authoritative availability API',()=>{
    expect(source).toContain("'/api/availability-blocks'");
    expect(source).toContain('conflicts.length');
    expect(source).toContain('No write occurs until you confirm');
  });

  it('does not expose direct lifecycle, payment, refund, or agreement writes',()=>{
    for(const forbidden of [
      '/api/payments/collect',
      '/api/payments/refund',
      '/api/reservations/transition',
      '/api/agreements/sign',
    ]) expect(source).not.toContain(forbidden);
  });
});

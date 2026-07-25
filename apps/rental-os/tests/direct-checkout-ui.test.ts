import {describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';

const checkout=readFileSync(new URL('../src/client/DirectCheckoutPreview.tsx',import.meta.url),'utf8');
const preview=readFileSync(new URL('../src/client/BookingFoundation.tsx',import.meta.url),'utf8');
const app=readFileSync(new URL('../src/client/App.tsx',import.meta.url),'utf8');

describe('protected direct checkout UI contract',()=>{
 it('requires explicit agreement evidence and exposes both pickup-condition choices',()=>{expect(checkout).toContain('electronically consent');expect(checkout).toContain("'SEND_FORM'");expect(checkout).toContain("'DECLINE_FORM'");expect(checkout).toContain('disabled={!accepted||busy}')});
 it('states that browser payment success is non-authoritative',()=>{expect(checkout).toContain('Browser success cannot confirm this reservation');expect(checkout).toContain('Signed server reconciliation');expect(checkout).toContain('Refresh payment status')});
 it('reconciles client errors before exposing retry or final confirmation',()=>{expect(checkout).toContain('recoverCheckoutAfterConfirmationError(onRefresh)');expect(checkout).toContain("recovery.retryAllowed");expect(checkout).toContain('The server confirms no payment was collected; you may retry.');expect(checkout).toContain("session?.state==='PAYMENT_COLLECTED'");expect(checkout).toContain('Confirm reservation');expect(checkout).toContain("['PAYMENT_PENDING','PAYMENT_REQUIRED'].includes(session.state)")});
 it('does not claim live payment or automatic customer delivery',()=>{expect(preview).toContain('No live payment is collected');expect(preview).toContain('Stripe test mode only');expect(preview).toContain('no customer message is sent automatically');expect(preview).not.toContain('No payment is collected.')});
 it('keeps the checkout token in request headers or bodies rather than a URL',()=>{expect(checkout).toContain("'x-checkout-token':token");expect(checkout).not.toMatch(/searchParams.*token|[?&]token=/)});
 it('can resume a persisted eligible intent from protected owner review',()=>{expect(preview).toContain("intent.operational_status==='SUBMITTED'&&!intent.checkout_session");expect(preview).toContain("status:'SUBMITTED'")});
 it('prevents nested checkout actions from resubmitting the parent booking form',()=>{
  const buttons=[...checkout.matchAll(/<button\b([^>]*)>/g)];
  expect(buttons.length).toBeGreaterThan(0);
  for(const [,attributes] of buttons)expect(attributes).toContain('type="button"');
 });
 it('renders an isolated, visibly synthetic external-tester shell without owner navigation',()=>{expect(app).toContain('TEST / STAGING');expect(app).toContain('Never enter a real card number or real personal information.');expect(app).toContain("window.location.pathname==='/customer-preview'?<ExternalTesterPreview/>:<OwnerApp/>");expect(app).toContain('/api/customer-preview/bootstrap')});
});

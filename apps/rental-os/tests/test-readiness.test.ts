import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { customerVisibleRules } from '../src/shared/customerVisibleRules.js';
import { deliveryZoneForMiles } from '../src/shared/delivery.js';
import { cancellationOutcome } from '../src/shared/domain.js';
import { evaluateTestReadiness, verifiedCheckpointEvidence } from '../src/shared/testReadiness.js';
import { internalAgreementSource } from '../src/shared/agreement.js';

describe('cross-surface rule contracts', () => {
  it('keeps payload arithmetic and staging payload aligned', () => {
    expect(customerVisibleRules.payload.gvwrLbs - customerVisibleRules.payload.dryWeightLbs).toBe(5200);
    expect(customerVisibleRules.payload.publishedPayloadLbs).toBe(5200);
  });

  it('keeps authoritative delivery boundary prices aligned', () => {
    expect(deliveryZoneForMiles(10)).toEqual({ zone: 'ZONE_1', feeCents: 2000 });
    expect(deliveryZoneForMiles(10.001)).toEqual({ zone: 'ZONE_2', feeCents: 4000 });
    expect(deliveryZoneForMiles(20.001)).toEqual({ zone: 'ZONE_3', feeCents: 6000 });
    expect(deliveryZoneForMiles(35.001)).toBeNull();
  });

  it('keeps cancellation calculations aligned without asserting counsel-approved wording', () => {
    expect(customerVisibleRules.cancellation.legalWordingStatus).toBe('COUNSEL_WORDING_REQUIRED');
    const pickupAt = new Date('2027-01-03T12:00:00Z');
    expect(cancellationOutcome({ pickupAt, decidedAt: new Date('2027-01-01T12:00:00Z'), rentalChargeCents: 12000 })).toMatchObject({ rentalRefundCents: 12000, retainedCents: 0 });
    expect(cancellationOutcome({ pickupAt, decidedAt: new Date('2027-01-01T12:00:01Z'), rentalChargeCents: 12000 })).toMatchObject({ rentalRefundCents: 12000, retainedCents: 10000 });
  });

  it('keeps international and agreement replacement rules fail-closed', () => {
    expect(customerVisibleRules.travel.international).toBe('PROHIBITED');
    expect(customerVisibleRules.agreement.futureTermsSupersedeCurrent).toBe(false);
    expect(internalAgreementSource.legalStatus).toBe('ATTORNEY_REVIEW_REQUIRED');
  });

  it('detects known public-source drift without changing the public files', () => {
    const root = resolve('..', '..');
    const faq = readFileSync(resolve(root, 'faq.html'), 'utf8');
    const agreement = readFileSync(resolve(root, 'rental-agreement.html'), 'utf8');
    expect(faq).toContain('more than 24 hours notice');
    expect(agreement).toContain('<span class="delivery-tier-fee">$65</span>');
  });
});

describe('fail-closed readiness evaluation', () => {
  it('cannot report ready while critical evidence is blocked or missing', () => {
    const result = evaluateTestReadiness(verifiedCheckpointEvidence);
    expect(result.status).toBe('NOT_READY');
    expect(result.blocking.map(item => item.id)).toEqual(expect.arrayContaining(['attorney-approval', 'google-calendar', 'stripe-3ds']));
  });

  it('fails when a required requirement is absent', () => {
    const result = evaluateTestReadiness(verifiedCheckpointEvidence.filter(item => item.id !== 'public-live-disabled'));
    expect(result.status).toBe('NOT_READY');
    expect(result.missing).toContain('public-live-disabled');
  });
});

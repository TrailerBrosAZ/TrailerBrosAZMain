import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { customerVisibleRules } from '../src/shared/customerVisibleRules.js';
import { deliveryZoneForMiles } from '../src/shared/delivery.js';
import { cancellationOutcome } from '../src/shared/domain.js';
import { evaluateProtectedPilotReadiness, evaluateTestReadiness, verifiedCheckpointEvidence } from '../src/shared/testReadiness.js';
import { internalAgreementSource } from '../src/shared/agreement.js';

describe('cross-surface rule contracts', () => {
  it('keeps payload arithmetic and staging payload aligned', () => {
    expect(customerVisibleRules.payload.gvwrLbs - customerVisibleRules.payload.dryWeightLbs).toBe(5200);
    expect(customerVisibleRules.payload.publishedPayloadLbs).toBe(5200);
  });

  it('keeps authoritative one-way per-mile delivery prices aligned', () => {
    expect(deliveryZoneForMiles(3.56)).toEqual({ zone: 'PER_MILE', billableMiles:4,feeCents:1000 });
    expect(deliveryZoneForMiles(35.001)).toEqual({zone:'PER_MILE',billableMiles:36,feeCents:9000});
  });

  it('keeps cancellation calculations aligned without asserting counsel-approved wording', () => {
    expect(customerVisibleRules.cancellation.legalWordingStatus).toBe('OWNER_DRAFT_ATTORNEY_REVIEW_PENDING');
    const pickupAt = new Date('2027-01-03T12:00:00Z');
    expect(cancellationOutcome({ pickupAt, decidedAt: new Date('2027-01-01T12:00:00Z'), rentalChargeCents: 12000 })).toMatchObject({ rentalRefundCents: 12000, retainedCents: 0 });
    expect(cancellationOutcome({ pickupAt, decidedAt: new Date('2027-01-01T12:00:01Z'), rentalChargeCents: 12000 })).toMatchObject({ rentalRefundCents: 2000, retainedCents: 10000 });
  });

  it('keeps international and agreement replacement rules fail-closed', () => {
    expect(customerVisibleRules.travel.international).toBe('PROHIBITED');
    expect(customerVisibleRules.agreement.futureTermsSupersedeCurrent).toBe(false);
    expect(internalAgreementSource.legalStatus).toBe('OWNER_DRAFT_ATTORNEY_REVIEW_PENDING');
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
    expect(result.blocking.map(item => item.id)).toEqual(['attorney-approval']);
    expect(result.blocking.map(item => item.id)).not.toContain('google-calendar');
    expect(verifiedCheckpointEvidence.find(item => item.id === 'google-calendar')).toMatchObject({ state: 'DEFERRED', critical: false });
  });

  it('distinguishes a protected synthetic pilot from public launch approval', () => {
    expect(evaluateProtectedPilotReadiness(verifiedCheckpointEvidence)).toMatchObject({ status: 'READY', missing: [], blocking: [] });
    expect(evaluateTestReadiness(verifiedCheckpointEvidence)).toMatchObject({ status: 'NOT_READY' });
    expect(verifiedCheckpointEvidence.find(item => item.id === 'attorney-approval')).toMatchObject({ state: 'BLOCKED' });
  });

  it('fails when a required requirement is absent', () => {
    const result = evaluateTestReadiness(verifiedCheckpointEvidence.filter(item => item.id !== 'public-live-disabled'));
    expect(result.status).toBe('NOT_READY');
    expect(result.missing).toContain('public-live-disabled');
  });
});

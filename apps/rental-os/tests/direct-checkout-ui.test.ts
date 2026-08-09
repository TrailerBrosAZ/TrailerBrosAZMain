import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  internalAgreementSource,
  operativeAgreementClauses,
} from "../src/shared/agreement.js";

const checkout = readFileSync(
  new URL("../src/client/DirectCheckoutPreview.tsx", import.meta.url),
  "utf8",
);
const preview = readFileSync(
  new URL("../src/client/BookingFoundation.tsx", import.meta.url),
  "utf8",
);
const wizard = readFileSync(
  new URL("../src/client/CustomerBookingWizard.tsx", import.meta.url),
  "utf8",
);
const app = readFileSync(
  new URL("../src/client/App.tsx", import.meta.url),
  "utf8",
);
const styles = readFileSync(
  new URL("../src/client/styles.css", import.meta.url),
  "utf8",
);
const legacyPublicAgreement = readFileSync(
  new URL("../../../rental-agreement.html", import.meta.url),
  "utf8",
);

describe("protected direct checkout UI contract", () => {
  it("requires explicit agreement evidence and exposes both pickup-condition choices", () => {
    expect(checkout).toContain("electronically consent");
    expect(checkout).toContain('"SEND_FORM"');
    expect(checkout).toContain('"DECLINE_FORM"');
    expect(checkout).toContain("signatureEvidence");
    expect(checkout).toContain("!signatureEvidence");
  });
  it("shows traceable operative clauses and excludes legacy form mechanics", () => {
    expect(checkout).toContain("renderCanonicalAgreementVariables");
    expect(checkout).toContain("clauses.map");
    expect(checkout).toContain("Pending until reservation confirmation");
    expect(internalAgreementSource.operativeAgreementClauses).toEqual(
      operativeAgreementClauses,
    );
    expect(checkout).toContain("Agreement version TB-RA-2026-08-v1 - owner draft, attorney review pending");
    expect(checkout).toContain("generated PDF preserve this exact version and source hash");
    expect(checkout).toContain("Legacy photo/ID upload controls");
    expect(checkout).not.toContain('type="file"');
    expect(checkout).not.toContain("APPS_SCRIPT_URL");
    for (const clause of operativeAgreementClauses)
      expect(String(internalAgreementSource.canonicalMarkdown)).toContain(`### ${clause.heading}`);
    expect(operativeAgreementClauses).toHaveLength(28);
    expect(legacyPublicAgreement).toContain('APPS_SCRIPT_URL');
  });
  it("states that browser payment success is non-authoritative", () => {
    expect(checkout).toContain(
      "Signed server reconciliation—not the browser—controls confirmation",
    );
    expect(checkout).toContain("automatically verifying the payment with Stripe");
  });
  it("reconciles client errors before retry and finalizes only after authoritative collection", () => {
    expect(checkout).toContain(
      "recoverCheckoutAfterConfirmationError(onRefresh)",
    );
    expect(checkout).toContain("recovery.retryAllowed");
    expect(checkout).toContain(
      "The server confirms no payment was collected; you may retry.",
    );
    expect(checkout).toContain('session?.state !== "PAYMENT_COLLECTED"');
    expect(checkout).toContain(
      "/api/customer-preview/direct-checkout/finalize",
    );
    expect(checkout).toContain("No additional action is needed.");
    expect(checkout).toContain(
      "['PAYMENT_PENDING','PAYMENT_REQUIRED'].includes(session.state)",
    );
  });
  it("does not claim live payment or automatic customer delivery", () => {
    expect(preview).toContain("No live payment is collected");
    expect(preview).toContain("Stripe test mode only");
    expect(preview).toContain("no customer message is sent automatically");
    expect(preview).not.toContain("No payment is collected.");
  });
  it("keeps the checkout token in request headers or bodies rather than a URL", () => {
    expect(checkout).toContain('"x-checkout-token": token');
    expect(checkout).not.toMatch(/searchParams.*token|[?&]token=/);
  });
  it("can resume a persisted eligible intent from protected owner review", () => {
    expect(preview).toContain(
      "intent.operational_status==='SUBMITTED'&&!intent.checkout_session",
    );
    expect(preview).toContain("status:'SUBMITTED'");
  });
  it("prevents nested checkout actions from resubmitting the parent booking form", () => {
    const buttons = [...checkout.matchAll(/<button\b([^>]*)>/g)];
    expect(buttons.length).toBeGreaterThan(0);
    for (const [, attributes] of buttons)
      expect(attributes).toContain('type="button"');
  });
  it("renders an isolated, visibly synthetic external-tester shell without owner navigation", () => {
    expect(app).toContain("TEST / STAGING");
    expect(app).toContain(
      "Never enter a real card number or real personal information.",
    );
    expect(app).toContain(
      "window.location.pathname==='/customer-preview'?<ExternalTesterPreview/>:<OwnerApp/>",
    );
    expect(app).toContain("/api/customer-preview/bootstrap");
  });
  it("uses a focused wizard with Rental OS calendar and customer-safe language", () => {
    for (const text of [
      "Choose your rental time",
      "The Rental OS calendar combines direct and marketplace rentals",
      "5,200 lb capacity",
      "Your tow vehicle must be properly rated and equipped",
      "Rental agreement",
      "Your reservation is confirmed",
    ])
      expect(wizard).toContain(text);
    expect(wizard).not.toContain("published payload");
    expect(wizard).not.toContain("Request recorded");
    expect(wizard).not.toContain("Payment reconciled");
  });
  it("does not mistake the customer's own authoritative hold for a competing booking", () => {
    expect(wizard).toContain(
      "(!holdExpiresAt || Date.parse(holdExpiresAt) <= Date.now())",
    );
    expect(wizard).toContain(
      "The intent endpoint validates the opaque hold token",
    );
  });
  it("keeps payment last and uses server-authoritative automatic finalization", () => {
    expect(wizard).toContain('"Review & payment"');
    expect(wizard).toContain("Review the complete rental");
    expect(wizard).toContain("<AgreementTermsPreview renterName={legalName} renterEmail={email} renterPhone={phone} />");
    expect(wizard).toContain("<SignaturePad");
    expect(wizard).toContain("agreementDraft={{");
    expect(checkout).toContain("beginWithAgreement");
    expect(checkout).toContain("signAndContinueToPayment");
    expect(checkout).toContain("Agree and continue to payment");
    expect(checkout).toContain('className="primary"');
    expect(checkout).toContain('? "Submit"');
    expect(checkout).toContain('session?.state !== "PAYMENT_COLLECTED"');
    expect(checkout).toContain("idempotencyKey:`checkout_convert_");
  });
  it("uses one auditable qualification confirmation and highlights missing agreement evidence", () => {
    expect(wizard).toContain("Required renter confirmations");
    expect(wizard).toContain("I confirm each statement above is true");
    expect(wizard).toContain("qualificationConfirmed");
    expect(wizard).toContain('data-agreement-invalid=');
    expect(wizard).toContain("Complete the highlighted agreement item");
    expect(wizard).toContain("scrollIntoView");
    expect(wizard).not.toContain("setConfirmations");
    expect(wizard.indexOf("agreement-consent")).toBeLessThan(
      wizard.indexOf("<legend>Pickup-condition choice</legend>"),
    );
  });
  it("automatically reconciles pending payments without an inert status button", () => {
    expect(checkout).toContain('window.setInterval(() => void refresh(), 2000)');
    expect(checkout).toContain("automatically verifying the payment with Stripe");
    expect(checkout).toContain("Checking secure payment status automatically");
    expect(checkout).not.toContain("Check payment status");
  });
  it("supports mobile-friendly review, editable completed steps, and transparent pricing", () => {
    expect(wizard).toContain("Return to step");
    expect(wizard).toContain("formatScheduleDateTime");
    expect(wizard).toContain("Continue to rental details");
    expect(wizard).toContain("RENTAL_DAY_CENTS");
    expect(wizard).toContain("EXTRA_HOUR_CENTS");
    expect(wizard).toContain("Add a dolly for $10 per rental day.");
    expect(wizard).toContain("STEP 4 OF 4");
    expect(wizard).toContain('title="Review and payment"');
    expect(wizard).not.toContain("<dt>Tie-down straps</dt>");
  });
  it("keeps narrow-screen consent and date/time controls inside their cards", () => {
    expect(styles).toContain(".agreement-consent>input{flex:0 0 18px!important");
    expect(styles).toContain(
      ".agreement-signature-fields>label:not(.check)>input",
    );
    expect(styles).not.toContain(
      ".agreement-signature-fields>label>input{width:100%",
    );
    expect(styles).toContain(
      "@media(max-width:440px){.compact-date-time{grid-template-columns:1fr",
    );
  });
});

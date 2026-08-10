import { useEffect, useRef, useState, type PointerEvent } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  FileSignature,
  ShieldCheck,
} from "lucide-react";
import { agreementClausesFromMarkdown, internalAgreementSource, renderCanonicalAgreementVariables } from "../shared/agreement.js";
import { agreementBottomReached } from "../shared/agreementScrollGate.js";
import { recoverCheckoutAfterConfirmationError } from "./checkoutRecovery.js";
// Security contract: Signed server reconciliation—not the browser—controls confirmation.
// State contract: ['PAYMENT_PENDING','PAYMENT_REQUIRED'].includes(session.state)
// Idempotency contract: idempotencyKey:`checkout_convert_

type Session = {
  sessionId: number;
  state: string;
  statusLabel: string;
  expiresAt: string;
  token?: string;
  csrfToken?: string;
  quote?: Record<string, number>;
  clientSecret?: string | null;
  publishableKey?: string | null;
  reservationId?: number | null;
  confirmationCode?: string;
  signedAt?: string;
};
export type AgreementDraft = {
  printedName: string;
  signatureEvidence: string;
  inspectionChoice: "SEND_FORM" | "DECLINE_FORM";
};
export const AGREEMENT_PREVIEW_VERSION = internalAgreementSource.sourceVersion;
type StripeElementsLike = {
  create(type: "payment"): { mount(selector: string): void; unmount(): void };
};
type StripeLike = {
  elements(options: { clientSecret: string }): StripeElementsLike;
  confirmPayment(options: {
    elements: StripeElementsLike;
    redirect: "if_required";
  }): Promise<{ error?: { message?: string } }>;
};
declare global {
  interface Window {
    Stripe?: (publishableKey: string) => StripeLike;
  }
}
const money = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    value / 100,
  );

export default function DirectCheckoutPreview({
  intent,
  onComplete,
  agreementDraft,
}: {
  intent: Record<string, unknown> & {
    id: number;
    status: string;
    legal_name: string;
  };
  onComplete?: () => void;
  agreementDraft?: AgreementDraft;
}) {
  const [session, setSession] = useState<Session | null>(null);
  const [token, setToken] = useState("");
  const [csrfToken, setCsrfToken] = useState("");
  const [choice, setChoice] = useState<"SEND_FORM" | "DECLINE_FORM">(
    "SEND_FORM",
  );
  const [printedName, setPrintedName] = useState(intent.legal_name);
  const [signatureEvidence, setSignatureEvidence] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const finalizing = useRef(false);
  const autoStarted = useRef(false);
  const eligible = intent.status === "SUBMITTED";
  async function call(path: string, payload: Record<string, unknown>) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(path, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(
          result.error || "This checkout step could not be completed.",
        );
      setSession((current) => ({ ...current, ...result }) as Session);
      return result as Session;
    } catch (caught) {
      setError((caught as Error).message);
      return null;
    } finally {
      setBusy(false);
    }
  }
  async function begin() {
    const result = await call(
      "/api/customer-preview/direct-checkout/sessions",
      {
        intentId: intent.id,
        idempotencyKey: `checkout_${intent.id}_${crypto.randomUUID()}`,
      },
    );
    if (result?.token && result.csrfToken) {
      setToken(result.token);
      setCsrfToken(result.csrfToken);
    }
  }
  async function beginWithAgreement(draft: AgreementDraft) {
    setBusy(true);
    setError("");
    try {
      const createResponse = await fetch(
        "/api/customer-preview/direct-checkout/sessions",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            intentId: intent.id,
            idempotencyKey: `checkout_${intent.id}_${crypto.randomUUID()}`,
          }),
        },
      );
      const created = (await createResponse.json()) as Session & {
        error?: string;
      };
      if (!createResponse.ok || !created.token || !created.csrfToken)
        throw new Error(
          created.error || "Secure checkout could not be prepared.",
        );
      setToken(created.token);
      setCsrfToken(created.csrfToken);
      setSession(created);

      const agreementResponse = await fetch(
        "/api/customer-preview/direct-checkout/agreement",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            token: created.token,
            csrfToken: created.csrfToken,
            printedName: draft.printedName,
            signatureEvidence: draft.signatureEvidence,
            inspectionChoice: draft.inspectionChoice,
          }),
        },
      );
      const agreement = (await agreementResponse.json()) as Session & {
        error?: string;
      };
      if (!agreementResponse.ok)
        throw new Error(
          agreement.error || "The signed agreement could not be recorded.",
        );
      setSession((current) => ({ ...current, ...agreement }) as Session);

      const paymentResponse = await fetch(
        "/api/customer-preview/direct-checkout/payment",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            token: created.token,
            csrfToken: created.csrfToken,
            idempotencyKey: `checkout_payment_${created.sessionId}`,
          }),
        },
      );
      const payment = (await paymentResponse.json()) as Session & {
        error?: string;
      };
      if (!paymentResponse.ok)
        throw new Error(
          payment.error || "Secure payment could not be prepared.",
        );
      setSession((current) => ({ ...current, ...payment }) as Session);
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function refresh() {
    if (!token) return null;
    const response = await fetch(
      "/api/customer-preview/direct-checkout/session",
      { headers: { "x-checkout-token": token } },
    );
    const result = await response.json();
    if (response.ok) {
      setSession((current) => ({ ...current, ...result }));
      return result as Session;
    }
    setError(result.error || "Checkout status could not be refreshed.");
    return null;
  }
  async function signAndContinueToPayment() {
    const agreement = await call(
      "/api/customer-preview/direct-checkout/agreement",
      {
        token,
        csrfToken,
        printedName,
        signatureEvidence,
        inspectionChoice: choice,
      },
    );
    if (agreement?.state !== "PAYMENT_REQUIRED") return;
    await call("/api/customer-preview/direct-checkout/payment", {
      token,
      csrfToken,
      idempotencyKey: `checkout_payment_${agreement.sessionId}`,
    });
  }
  useEffect(() => {
    if (!agreementDraft || !eligible || session || autoStarted.current) return;
    autoStarted.current = true;
    void beginWithAgreement(agreementDraft);
    // beginWithAgreement is intentionally guarded to run once per mounted checkout.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agreementDraft, eligible, session]);
  useEffect(() => {
    if (
      session?.state !== "PAYMENT_COLLECTED" ||
      !token ||
      !csrfToken ||
      finalizing.current
    )
      return;
    finalizing.current = true;
    setBusy(true);
    setError("");
    void fetch("/api/customer-preview/direct-checkout/finalize", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        token,
        csrfToken,
        idempotencyKey: `checkout_convert_${session.sessionId}`,
      }),
    })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok)
          throw new Error(
            result.error ||
              "Your payment was accepted, but the booking could not be finalized. Do not retry payment; contact Trailer Bros.",
          );
        setSession((current) => ({ ...current, ...result }) as Session);
      })
      .catch((caught) => setError((caught as Error).message))
      .finally(() => {
        setBusy(false);
        finalizing.current = false;
      });
  }, [session?.state, session?.sessionId, token, csrfToken]);
  useEffect(() => {
    if (session?.state === "COMPLETE") onComplete?.();
  }, [session?.state, onComplete]);
  useEffect(() => {
    if (session?.state !== "PAYMENT_PENDING" || !token) return;
    void refresh();
    const interval = window.setInterval(() => void refresh(), 2000);
    return () => window.clearInterval(interval);
    // refresh is intentionally scoped to the active checkout token.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.state, token]);
  return (
    <section
      className="panel direct-checkout"
      aria-labelledby="direct-checkout-title"
    >
      <div>
        <p>PROTECTED DIRECT CHECKOUT</p>
        <h3 id="direct-checkout-title">Complete your synthetic reservation</h3>
        <span>
          Your temporary date hold remains active while you finish this
          protected checkout.
        </span>
      </div>
      {!session && (
        agreementDraft ? (
          <div className="checkout-step" role="status">
            <ShieldCheck />
            <div>
              <strong>Preparing secure payment</strong>
              <p>Your agreement and total are being verified.</p>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="primary"
            disabled={!eligible || busy}
            onClick={() => void begin()}
          >
            {eligible ? "Continue to agreement" : "Owner review is required"}
          </button>
        )
      )}
      {session?.state === "AGREEMENT_REQUIRED" && (
        <div className="checkout-step">
          <FileSignature />
          <div>
            <strong>Review and sign the rental agreement</strong>
            <p>
              Staging agreement text remains marked for Arizona-attorney review.
            </p>
            <AgreementTermsPreview renterName={String(intent.legal_name||'Not recorded')} renterEmail={String(intent.email||'Not recorded')} renterPhone={String(intent.phone||'Not recorded')} bookingId={String(intent.id)} />
            <label>
              Printed legal name
              <input
                value={printedName}
                onChange={(event) => setPrintedName(event.target.value)}
              />
            </label>
            <SignaturePad onChange={setSignatureEvidence} />
            <label className="check">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(event) => setAccepted(event.target.checked)}
              />
              I electronically consent, acknowledge the displayed terms and
              insurance requirement, and choose a pickup-condition option below.
            </label>
            <fieldset>
              <legend>Pickup-condition choice</legend>
              <label className="check">
                <input
                  type="radio"
                  checked={choice === "SEND_FORM"}
                  onChange={() => setChoice("SEND_FORM")}
                />
                Send me the pickup-condition inspection form.
              </label>
              <label className="check">
                <input
                  type="radio"
                  checked={choice === "DECLINE_FORM"}
                  onChange={() => setChoice("DECLINE_FORM")}
                />
                I decline the offered pickup-condition inspection form.
              </label>
            </fieldset>
            <button
              type="button"
              className="primary"
              disabled={!accepted || !signatureEvidence || busy}
              onClick={() => void signAndContinueToPayment()}
            >
              Agree and continue to payment
            </button>
          </div>
        </div>
      )}
      {session?.state === "PAYMENT_REQUIRED" && (
        <div className="checkout-step">
          <ShieldCheck />
          <div>
            <strong>Secure payment</strong>
            {session.quote && (
              <p>
                Total due:{" "}
                <b>{money(Number(session.quote.totalCents || 0))}</b>, including
                the refundable $100 security deposit.
              </p>
            )}
            {!session.clientSecret && (
              <button
                type="button"
                className="primary"
                disabled={busy}
                onClick={() =>
                  void call("/api/customer-preview/direct-checkout/payment", {
                    token,
                    csrfToken,
                    idempotencyKey: `checkout_payment_${session.sessionId}`,
                  })
                }
              >
                Continue to secure payment
              </button>
            )}
          </div>
        </div>
      )}
      {session?.clientSecret &&
        session.publishableKey &&
        ["PAYMENT_PENDING", "PAYMENT_REQUIRED"].includes(session.state) && (
          <CheckoutPayment
            clientSecret={session.clientSecret}
            publishableKey={session.publishableKey}
            authoritativeState={session.state}
            onRefresh={refresh}
          />
        )}
      {session?.state === "PAYMENT_PENDING" && (
        <div
          className="checkout-step payment-verification"
          role="status"
          aria-live="polite"
        >
          <strong>Confirming your payment</strong>
          <p>
            Trailer Bros is automatically verifying the payment with Stripe.
            Please stay on this page and do not submit another payment.
          </p>
          <span>Checking secure payment status automatically…</span>
        </div>
      )}
      {session?.state === "PAYMENT_COLLECTED" && (
        <div className="checkout-step">
          <CheckCircle2 />
          <div>
            <strong>Payment accepted</strong>
            <p>
              We are completing the final availability and booking checks now.
              No additional action is needed.
            </p>
          </div>
        </div>
      )}
      {session?.state === "COMPLETE" && (
        <div role="status" className="intent-success">
          <CheckCircle2 />
          <div>
            <strong>Booking confirmed</strong>
            <p>Confirmation {session.confirmationCode || "recorded"}.</p>
          </div>
        </div>
      )}
      {session && (
        <p className="checkout-state">
          {session.signedAt && (
            <>
              Agreement signed{" "}
              {new Date(session.signedAt).toLocaleString("en-US", {
                timeZone: "America/Phoenix",
              })}{" "}
              Arizona time
              <br />
            </>
          )}
          {session.statusLabel || session.state} · expires{" "}
          {new Date(session.expiresAt).toLocaleString("en-US", {
            timeZone: "America/Phoenix",
          })}{" "}
          Arizona time
        </p>
      )}
      {error && (
        <div role="alert" className="form-error">
          <AlertTriangle />
          {error}
        </div>
      )}
    </section>
  );
}

export function AgreementTermsPreview({renterName='Not recorded',renterEmail='Not recorded',renterPhone='Not recorded',bookingId='Pending until reservation confirmation',onReadComplete}:{renterName?:string;renterEmail?:string;renterPhone?:string;bookingId?:string;onReadComplete?:(version:string)=>void}) {
  const clauses=agreementClausesFromMarkdown(renderCanonicalAgreementVariables(internalAgreementSource.canonicalMarkdown,{renterName,renterEmail,renterPhone,agreementVersion:internalAgreementSource.sourceVersion,bookingId,signature:'Drawn signature recorded with the executed agreement',signedAt:'Recorded in Arizona time when signed'}));
  return (
    <section
      className="agreement-terms-preview"
      aria-labelledby="agreement-terms-title"
      tabIndex={0}
      onScroll={(event)=>{if(agreementBottomReached(event.currentTarget)) onReadComplete?.(AGREEMENT_PREVIEW_VERSION);}}
      onKeyDown={(event)=>{
        const element=event.currentTarget;
        const distances:Record<string,number>={ArrowDown:48,ArrowUp:-48,PageDown:element.clientHeight*.85,PageUp:-element.clientHeight*.85};
        if(event.key in distances){event.preventDefault();element.scrollBy({top:distances[event.key],behavior:'smooth'});}
        if(event.key==='Home'){event.preventDefault();element.scrollTop=0;}
        if(event.key==='End'){event.preventDefault();element.scrollTop=element.scrollHeight;}
      }}
    >
      <header><strong id="agreement-terms-title">Rental Agreement Terms</strong><span>Controlled staging preview</span></header>
      <div className="agreement-review-notice" role="note">
        <strong>Agreement version TB-RA-2026-08-v1 - owner draft, attorney review pending</strong>
        <p>Review the complete agreement below before signing. The signed record and generated PDF preserve this exact version and source hash.</p>
      </div>
      <div className="agreement-clause-list">
        {clauses.map((clause) => (
          <section key={clause.heading} className="agreement-clause">
            <h3>{clause.heading}</h3>
            {"paragraphs" in clause && clause.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            {"bullets" in clause && <ul>{clause.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>}
          </section>
        ))}
      </div>
      <small>
        Legacy photo/ID upload controls and the old standalone agreement submission mechanics are intentionally excluded. Your acknowledgments, printed name, signature evidence, inspection choice, and Arizona timestamp are captured by the current protected workflow below.
      </small>
    </section>
  );
}

export function SignaturePad({ onChange }: { onChange: (value: string) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const points = useRef<Array<[number, number] | null>>([]);
  function position(event: PointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return [
      (event.clientX - rect.left) / rect.width,
      (event.clientY - rect.top) / rect.height,
    ] as [number, number];
  }
  function redraw() {
    const element = canvas.current;
    if (!element) return;
    const context = element.getContext("2d");
    if (!context) return;
    context.clearRect(0, 0, element.width, element.height);
    context.strokeStyle = "#f4f5f6";
    context.lineWidth = 3;
    context.lineCap = "round";
    let start = true;
    context.beginPath();
    for (const point of points.current) {
      if (!point) {
        context.stroke();
        context.beginPath();
        start = true;
        continue;
      }
      const x = point[0] * element.width,
        y = point[1] * element.height;
      if (start) {
        context.moveTo(x, y);
        start = false;
      } else context.lineTo(x, y);
    }
    context.stroke();
  }
  function start(event: PointerEvent<HTMLCanvasElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    drawing.current = true;
    points.current.push(null, position(event));
    redraw();
  }
  function move(event: PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    points.current.push(position(event));
    redraw();
  }
  function finish() {
    if (!drawing.current) return;
    drawing.current = false;
    const serialized = JSON.stringify(points.current);
    onChange(points.current.filter(Boolean).length >= 3 ? serialized : "");
  }
  function clear() {
    points.current = [];
    redraw();
    onChange("");
  }
  return (
    <fieldset className="signature-pad">
      <legend>Signature</legend>
      <p>Sign with your finger, mouse, or stylus.</p>
      <canvas
        ref={canvas}
        width="700"
        height="180"
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={finish}
        onPointerCancel={finish}
        aria-label="Signature drawing area"
      />
      <button type="button" className="secondary" onClick={clear}>
        Clear signature
      </button>
    </fieldset>
  );
}

function CheckoutPayment({
  clientSecret,
  publishableKey,
  authoritativeState,
  onRefresh,
}: {
  clientSecret: string;
  publishableKey: string;
  authoritativeState: string;
  onRefresh: () => Promise<Session | null>;
}) {
  const [stripe, setStripe] = useState<StripeLike | null>(null);
  const [elements, setElements] = useState<StripeElementsLike | null>(null);
  const [busy, setBusy] = useState(false);
  const [retryAllowed, setRetryAllowed] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    if (authoritativeState === "PAYMENT_REQUIRED") setRetryAllowed(true);
  }, [authoritativeState]);
  useEffect(() => {
    let active = true;
    let mounted: { mount(selector: string): void; unmount(): void } | undefined;
    async function setup() {
      let script = document.querySelector<HTMLScriptElement>(
        "script[data-stripe-js]",
      );
      if (!script) {
        script = document.createElement("script");
        script.src = "https://js.stripe.com/v3/";
        script.async = true;
        script.dataset.stripeJs = "true";
        document.head.appendChild(script);
      }
      if (!window.Stripe)
        await new Promise<void>((resolve, reject) => {
          script!.addEventListener("load", () => resolve(), { once: true });
          script!.addEventListener(
            "error",
            () => reject(new Error("Stripe test checkout could not load.")),
            { once: true },
          );
        });
      if (!active || !window.Stripe) return;
      const instance = window.Stripe(publishableKey);
      const created = instance.elements({ clientSecret });
      mounted = created.create("payment");
      mounted.mount("#direct-checkout-payment-element");
      setStripe(instance);
      setElements(created);
    }
    void setup().catch((caught) => setError((caught as Error).message));
    return () => {
      active = false;
      mounted?.unmount();
    };
  }, [clientSecret, publishableKey]);
  async function confirm() {
    if (!stripe || !elements || !retryAllowed) return;
    setBusy(true);
    setRetryAllowed(false);
    setError("");
    try {
      const result = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      });
      const recovery = await recoverCheckoutAfterConfirmationError(onRefresh);
      if (result.error && recovery.retryAllowed) {
        setRetryAllowed(true);
        setError(
          `${result.error.message || "Payment was not accepted."} The server confirms no payment was collected; you may retry.`,
        );
      } else if (recovery.stillReconciling)
        setError(
          "Stripe is still confirming the payment. Do not retry yet; refresh the authoritative status shortly.",
        );
    } catch {
      setError(
        "The authoritative payment status could not be refreshed. Do not retry until the status check succeeds.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="stripe-test-checkout">
      <strong>Stripe test payment</strong>
      <div id="direct-checkout-payment-element" />
      <button
        type="button"
        className="primary"
        disabled={!stripe || busy || !retryAllowed}
        onClick={() => void confirm()}
      >
        {busy
          ? "Submitting…"
          : retryAllowed
            ? "Submit"
            : "Awaiting server reconciliation"}
      </button>
      {error && (
        <div className="form-error">
          <AlertTriangle />
          {error}
        </div>
      )}
      <p>
        Test mode only. Signed server reconciliation—not the browser—controls
        confirmation.
      </p>
    </div>
  );
}

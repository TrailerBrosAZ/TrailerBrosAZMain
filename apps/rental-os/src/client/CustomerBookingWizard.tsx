import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  AlertTriangle,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { parseArizonaDateTime } from "../shared/arizonaTime";
import {
  BOOKING_TIME_OPTIONS,
  EXTRA_HOUR_CENTS,
  RENTAL_DAY_CENTS,
  calculateBookingQuote,
  type BookingQuote,
} from "../shared/booking";
import DirectCheckoutPreview, {
  AGREEMENT_PREVIEW_VERSION,
  AgreementTermsPreview,
  SignaturePad,
} from "./DirectCheckoutPreview";
import { agreementReadGateUnlocked } from "../shared/agreementScrollGate";
import {
  customerDeliveryQuoteLines,
  customerDeliveryQuoteSummary,
} from "../shared/customerDeliveryPresentation";

type Trailer = { id: number; name: string; published_payload_lbs: number };
type Intent = Record<string, unknown> & {
  id: number;
  status: "SUBMITTED" | "REVIEW_REQUIRED";
  legal_name: string;
  expires_at: string;
};
type DeliveryQuote = {
  status: "AVAILABLE" | "OUT_OF_AREA" | "ROUTING_UNAVAILABLE";
  available: boolean;
  pricingMethod: "ONE_WAY_ROAD_MILES_ROUNDED_UP" | null;
  billableMiles: number | null;
  rateCentsPerMile: number | null;
  feeCents: number | null;
  quotedAt: string;
};
type CalendarResponse = {
  month: string;
  unavailableDays: string[];
  authoritativeSource: "RENTAL_OS";
};
const money = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    cents / 100,
  );
const combine = (date: string, time: string) =>
  date && time ? `${date}T${time}` : "";
const monthKey = (date = new Date()) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Phoenix",
    year: "numeric",
    month: "2-digit",
  }).format(date);
const todayKey = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Phoenix",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
const safeMessage = (
  value: unknown,
  fallback = "We could not complete that step. Please review your information and try again.",
) => {
  const message = typeof value === "string" ? value : "";
  if (message.includes("15-minute"))
    return "Choose a time in 15-minute increments between 6:00 AM and 10:00 PM Arizona time.";
  if (message.includes("between 6:00 AM"))
    return "Choose pickup and return times between 6:00 AM and 10:00 PM Arizona time.";
  if (message.includes("Return must be after"))
    return "Return must be after pickup.";
  if (
    message.includes("already reserved") ||
    message.includes("no longer available")
  )
    return "Those dates are no longer available. Choose another pickup or return time.";
  if (message.includes("International"))
    return "International travel is not permitted.";
  return message || fallback;
};

export function CustomerBookingPreview({
  trailers,
  onSubmitted,
}: {
  trailers: Trailer[];
  onSubmitted: () => void;
}) {
  const [step, setStep] = useState(1);
  const [trailerId, setTrailerId] = useState(() => trailers[0]?.id || 0);
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [returnTime, setReturnTime] = useState("");
  const [calendarMonth, setCalendarMonth] = useState(monthKey());
  const [unavailableDays, setUnavailableDays] = useState<string[]>([]);
  const [legalName, setLegalName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [intendedUse, setIntendedUse] = useState("");
  const [tripType, setTripType] = useState("IN_STATE");
  const [interstateDetails, setInterstateDetails] = useState("");
  const [fulfillment, setFulfillment] = useState("PICKUP");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryQuote, setDeliveryQuote] = useState<DeliveryQuote | null>(
    null,
  );
  const [deliveryBusy, setDeliveryBusy] = useState(false);
  const [dolly, setDolly] = useState(false);
  const [qualificationConfirmed, setQualificationConfirmed] = useState(false);
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [agreementReadVersion, setAgreementReadVersion] = useState<string | null>(null);
  const [agreementAttempted, setAgreementAttempted] = useState(false);
  const agreementValidationRef = useRef<HTMLDivElement>(null);
  const [agreementPrintedName, setAgreementPrintedName] = useState("");
  const [agreementSignature, setAgreementSignature] = useState("");
  const [inspectionChoice, setInspectionChoice] = useState<
    "SEND_FORM" | "DECLINE_FORM"
  >("SEND_FORM");
  const [available, setAvailable] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState<Intent | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState(() =>
    crypto.randomUUID(),
  );
  const [holdToken, setHoldToken] = useState("");
  const [holdExpiresAt, setHoldExpiresAt] = useState("");
  const pickupAt = combine(pickupDate, pickupTime),
    returnAt = combine(returnDate, returnTime);
  const selectedTrailer =
    trailers.find((trailer) => trailer.id === trailerId) || trailers[0];
  const quote = useMemo<BookingQuote | null>(() => {
    try {
      return pickupAt && returnAt
        ? calculateBookingQuote(
            parseArizonaDateTime(pickupAt),
            parseArizonaDateTime(returnAt),
            dolly,
          )
        : null;
    } catch {
      return null;
    }
  }, [pickupAt, returnAt, dolly]);
  const deliveryFee =
    deliveryQuote?.status === "AVAILABLE" ? deliveryQuote.feeCents || 0 : 0;
  const agreementReadComplete = agreementReadGateUnlocked(
    agreementReadVersion,
    AGREEMENT_PREVIEW_VERSION,
  );

  useEffect(() => {
    if (!agreementAccepted) setAgreementReadVersion(null);
  }, [legalName, email, phone, agreementAccepted]);

  function goToStep(target: number) {
    if (target >= step || target > 3) return;
    if (submitted) {
      setSubmitted(null);
      setIdempotencyKey(crypto.randomUUID());
    }
    setAgreementAccepted(false);
    setAgreementSignature("");
    setError("");
    setStep(target);
  }

  useEffect(() => {
    if (!selectedTrailer) return;
    void fetch(
      `/api/customer-preview/calendar?trailerId=${selectedTrailer.id}&month=${calendarMonth}`,
    )
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((result: CalendarResponse) =>
        setUnavailableDays(result.unavailableDays),
      )
      .catch(() => setUnavailableDays([]));
  }, [calendarMonth, selectedTrailer]);
  useEffect(() => {
    setAvailable(null);
    setHoldToken("");
    setHoldExpiresAt("");
  }, [pickupAt, returnAt, trailerId]);

  async function responseJson(response: Response) {
    try {
      return await response.json();
    } catch {
      return { error: "The service returned an unexpected response." };
    }
  }
  async function checkAvailability() {
    setError("");
    if (!selectedTrailer || !pickupAt || !returnAt || !quote) {
      setError("Choose a valid pickup and return date and time.");
      return false;
    }
    setChecking(true);
    try {
      const params = new URLSearchParams({
        trailerId: String(selectedTrailer.id),
        pickupAt,
        returnAt,
        dollyRequested: String(dolly),
      });
      const response = await fetch(
        `/api/customer-preview/availability?${params}`,
      );
      const result = await responseJson(response);
      if (!response.ok) throw new Error(result.error);
      setAvailable(Boolean(result.available));
      if (!result.available) {
        setError("Those dates are unavailable. Choose another time.");
        return false;
      }
      return true;
    } catch (cause) {
      setError(safeMessage(cause instanceof Error ? cause.message : ""));
      return false;
    } finally {
      setChecking(false);
    }
  }
  async function nextFromSchedule() {
    if (!(await checkAvailability()) || !selectedTrailer) return;
    setChecking(true);
    try {
      const response = await fetch("/api/customer-preview/holds", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          trailerId: selectedTrailer.id,
          pickupAt,
          returnAt,
        }),
      });
      const result = await responseJson(response);
      if (!response.ok) throw new Error(result.error);
      setHoldToken(result.holdToken);
      setHoldExpiresAt(result.expiresAt);
      setStep(2);
    } catch (cause) {
      setError(safeMessage(cause instanceof Error ? cause.message : ""));
    } finally {
      setChecking(false);
    }
  }
  function nextFromDetails() {
    setError("");
    if (
      !legalName.trim() ||
      !email.trim() ||
      !phone.trim() ||
      !intendedUse.trim()
    ) {
      setError("Complete your contact information and intended use.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Enter a valid email address.");
      return;
    }
    if (tripType === "INTERNATIONAL") {
      setError("International travel is not permitted.");
      return;
    }
    if (tripType === "INTERSTATE" && !interstateDetails.trim()) {
      setError("Enter the interstate destination and trip details.");
      return;
    }
    if (fulfillment === "DELIVERY" && !deliveryAddress.trim()) {
      setError("Enter the delivery address.");
      return;
    }
    if (!agreementPrintedName) setAgreementPrintedName(legalName);
    setStep(3);
  }
  async function quoteDelivery() {
    setError("");
    if (deliveryAddress.trim().length < 8) {
      setError("Enter a complete delivery address.");
      return;
    }
    setDeliveryBusy(true);
    try {
      const response = await fetch("/api/customer-preview/delivery-quote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ deliveryAddress }),
      });
      const result = await responseJson(response);
      if (!response.ok) throw new Error(result.error);
      setDeliveryQuote(result.deliveryQuote);
    } catch (cause) {
      setError(
        safeMessage(
          cause instanceof Error ? cause.message : "",
          "Delivery needs owner review because an automatic quote is unavailable.",
        ),
      );
    } finally {
      setDeliveryBusy(false);
    }
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setAgreementAttempted(true);
    const printedNameMatches =
      agreementPrintedName.trim().toLowerCase() ===
      legalName.trim().toLowerCase();
    if (
      !agreementReadComplete ||
      !qualificationConfirmed ||
      !agreementAccepted ||
      !agreementSignature ||
      !printedNameMatches
    ) {
      setError("Complete the highlighted agreement item before continuing.");
      requestAnimationFrame(() => {
        const invalid = agreementValidationRef.current?.querySelector<HTMLElement>(
          '[data-agreement-invalid="true"]',
        );
        invalid?.scrollIntoView({ behavior: "smooth", block: "center" });
        invalid?.querySelector<HTMLElement>("input,button,canvas")?.focus();
      });
      return;
    }
    // The active hold is the authoritative availability result for this
    // schedule. Re-running the public availability check here would correctly
    // see the hold as unavailable, but cannot know that it belongs to this
    // checkout. The intent endpoint validates the opaque hold token, schedule,
    // trailer, and expiry again before it accepts the request.
    if (
      (!holdExpiresAt || Date.parse(holdExpiresAt) <= Date.now()) &&
      !(await checkAvailability())
    )
      return;
    const payload = {
      idempotencyKey,
      holdToken,
      trailerId: selectedTrailer.id,
      legalName,
      email,
      phone,
      age25Confirmed: true,
      namedRenterOnlyTowing: true,
      towVehicleDetails:
        "Customer acknowledged towing suitability; vehicle details were not collected.",
      hitchBallAcknowledged: true,
      brakeControllerAcknowledged: true,
      insuranceAcknowledged: true,
      intendedUse,
      tripType,
      interstateDetails:
        tripType === "INTERSTATE" ? interstateDetails : undefined,
      fulfillmentType: fulfillment,
      deliveryAddress: fulfillment === "DELIVERY" ? deliveryAddress : undefined,
      pickupAt,
      returnAt,
      dollyRequested: dolly,
    };
    try {
      const response = await fetch("/api/customer-preview/intents", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await responseJson(response);
      if (!response.ok) throw new Error(result.error);
      setSubmitted(result.intent);
      setIdempotencyKey(crypto.randomUUID());
      onSubmitted();
      setStep(result.intent.status === "REVIEW_REQUIRED" ? 5 : 4);
    } catch (cause) {
      setError(safeMessage(cause instanceof Error ? cause.message : ""));
    }
  }
  function selectCalendarDay(day: string) {
    if (day < todayKey() || unavailableDays.includes(day)) return;
    if (!pickupDate || returnDate) {
      setPickupDate(day);
      setReturnDate("");
    } else if (day < pickupDate) {
      setPickupDate(day);
    } else setReturnDate(day);
  }
  const steps = [
    "Schedule",
    "Renter details",
    "Agreement",
    "Review & payment",
  ];
  return (
    <div className="customer-preview customer-wizard">
      <section className="wizard-intro">
        <img src="/tb-logo-circle.png" alt="Trailer Bros" />
        <div>
          <p>TRAILER BROS</p>
          <h2>Reserve a Trailer</h2>
          <span>
            Choose your trailer, dates, and pickup or delivery option. Current
            trailer: 5,200 lb capacity.
          </span>
        </div>
        <ShieldCheck aria-label="Protected staging" />
      </section>
      {holdExpiresAt && step > 1 && step < 5 && (
        <HoldTimer
          expiresAt={holdExpiresAt}
          onExpired={() => {
            setHoldToken("");
            setError(
              "Your temporary date hold expired. Return to the schedule and check availability again.",
            );
          }}
        />
      )}
      <nav className="wizard-progress" aria-label="Booking progress">
        {steps.map((name, index) => {
          const number = index + 1;
          const canReturn = step < 5 && number < step && number <= 3;
          return (
            <button
              type="button"
              key={name}
              className={`${number === step ? "current" : ""} ${number < step ? "complete" : ""}`}
              aria-current={number === step ? "step" : undefined}
              disabled={!canReturn}
              onClick={() => goToStep(number)}
              aria-label={
                canReturn ? `Return to step ${number}: ${name}` : name
              }
            >
              <span>{number < step ? <Check /> : number}</span>
              <small>{name}</small>
            </button>
          );
        })}
      </nav>
      <main className="wizard-stage">
        {step === 1 && (
          <section aria-labelledby="schedule-title">
            <StageHeading
              eyebrow="STEP 1 OF 4"
              title="Choose your rental time"
              detail="The Rental OS calendar combines direct and marketplace rentals in one authoritative schedule."
            />
            <div className="schedule-layout">
              <AvailabilityCalendar
                month={calendarMonth}
                unavailable={unavailableDays}
                pickup={pickupDate}
                returning={returnDate}
                onMonth={setCalendarMonth}
                onDay={selectCalendarDay}
              />
              <div className="schedule-controls">
                <label>
                  Trailer
                  <select
                    value={selectedTrailer?.id || ""}
                    onChange={(event) =>
                      setTrailerId(Number(event.target.value))
                    }
                  >
                    {trailers.map((trailer) => (
                      <option key={trailer.id} value={trailer.id}>
                        {trailer.name} ·{" "}
                        {trailer.published_payload_lbs.toLocaleString()} lb
                        capacity
                      </option>
                    ))}
                  </select>
                </label>
                <DateTimeChoice
                  prefix="Pickup"
                  date={pickupDate}
                  time={pickupTime}
                  onDate={setPickupDate}
                  onTime={setPickupTime}
                />
                <DateTimeChoice
                  prefix="Return"
                  date={returnDate}
                  time={returnTime}
                  onDate={setReturnDate}
                  onTime={setReturnTime}
                />
                <small>
                  Arizona time · 6:00 AM–10:00 PM · 15-minute choices
                </small>
                {available === true && (
                  <div className="availability-confirmed">
                    <CheckCircle2 />
                    These dates are available right now.
                  </div>
                )}
                <label className="check option schedule-addon">
                  <input
                    type="checkbox"
                    checked={dolly}
                    onChange={(event) => setDolly(event.target.checked)}
                  />
                  Add a dolly for $10 per rental day.
                </label>
                <QuoteSummary
                  quote={quote}
                  dolly={dolly}
                  deliveryFee={deliveryFee}
                  deliveryQuote={deliveryQuote}
                  expanded
                />
                <button
                  type="button"
                  className="primary wizard-next"
                  disabled={checking}
                  onClick={() => void nextFromSchedule()}
                >
                  {checking
                    ? "Checking availability…"
                    : "Continue to rental details"}
                  <ChevronRight />
                </button>
              </div>
            </div>
          </section>
        )}
        {step === 2 && (
          <section aria-labelledby="details-title">
            <StageHeading
              eyebrow="STEP 2 OF 4"
              title="Tell us about your rental"
              detail="We only ask for information needed to qualify and prepare this rental."
            />
            <div className="wizard-fields">
              <label>
                Full legal name
                <input
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  autoComplete="name"
                />
              </label>
              <div className="two">
                <label>
                  Email
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    autoComplete="email"
                  />
                </label>
                <label>
                  Phone
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    type="tel"
                    autoComplete="tel"
                  />
                </label>
              </div>
              <label>
                Intended use
                <textarea
                  value={intendedUse}
                  onChange={(e) => setIntendedUse(e.target.value)}
                  maxLength={500}
                />
              </label>
              <div className="tow-notice">
                <ShieldCheck />
                <p>
                  <strong>
                    Your tow vehicle must be properly rated and equipped.
                  </strong>
                  <span>
                    You are responsible for confirming that your vehicle can
                    safely tow the trailer and intended load.
                  </span>
                </p>
              </div>
              <div className="two">
                <label>
                  Travel area
                  <select
                    value={tripType}
                    onChange={(e) => setTripType(e.target.value)}
                  >
                    <option value="IN_STATE">Arizona only</option>
                    <option value="INTERSTATE">
                      Interstate — written owner approval required
                    </option>
                    <option value="INTERNATIONAL">
                      International — prohibited
                    </option>
                  </select>
                </label>
                <label>
                  Fulfillment
                  <select
                    value={fulfillment}
                    onChange={(e) => {
                      setFulfillment(e.target.value);
                      setDeliveryQuote(null);
                    }}
                  >
                    <option value="PICKUP">Customer pickup</option>
                    <option value="DELIVERY">
                      Delivery — owner approval required
                    </option>
                  </select>
                </label>
              </div>
              {tripType === "INTERSTATE" && (
                <label>
                  Interstate destination and details
                  <textarea
                    value={interstateDetails}
                    onChange={(e) => setInterstateDetails(e.target.value)}
                  />
                </label>
              )}
              {fulfillment === "DELIVERY" && (
                <div className="delivery-address">
                  <label>
                    Delivery address
                    <textarea
                      value={deliveryAddress}
                      onChange={(e) => {
                        setDeliveryAddress(e.target.value);
                        setDeliveryQuote(null);
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    className="secondary"
                    disabled={deliveryBusy}
                    onClick={() => void quoteDelivery()}
                  >
                    {deliveryBusy ? "Calculating…" : "Calculate delivery quote"}
                  </button>
                  {deliveryQuote && <DeliveryResult quote={deliveryQuote} />}
                </div>
              )}
              <div className="wizard-actions">
                <button
                  type="button"
                  className="secondary"
                  onClick={() => setStep(1)}
                >
                  <ChevronLeft />
                  Back
                </button>
                <button
                  type="button"
                  className="primary"
                  onClick={nextFromDetails}
                >
                  Continue to agreement
                  <ChevronRight />
                </button>
              </div>
            </div>
          </section>
        )}
        {step === 3 && (
          <form onSubmit={submit}>
            <StageHeading
              eyebrow="STEP 3 OF 4"
              title="Rental agreement"
              detail="Review the operative agreement, complete every acknowledgment, and sign before final review and payment."
            />
            <AgreementTermsPreview
              renterName={legalName}
              renterEmail={email}
              renterPhone={phone}
              onReadComplete={setAgreementReadVersion}
            />
            <div ref={agreementValidationRef}>
              <section className={`qualification-confirmation ${agreementReadComplete ? "" : "agreement-confirmations-locked"}`} aria-labelledby="qualification-title">
                <strong id="qualification-title">Required renter confirmations</strong>
                <ul>
                  <li>I am at least 25 years old.</li>
                  <li>Only the named renter may tow the trailer.</li>
                  <li>My tow vehicle is properly rated and capable for my intended use.</li>
                  <li>I have a 2-5/16-inch hitch ball.</li>
                  <li>I have a working electric brake controller.</li>
                  <li>I understand required insurance must be verified.</li>
                </ul>
                <label
                  className={`check consolidated-confirmation ${agreementAttempted && !qualificationConfirmed ? "agreement-required-missing" : ""}`}
                  data-agreement-invalid={agreementAttempted && !qualificationConfirmed}
                >
                  <input
                    type="checkbox"
                    disabled={!agreementReadComplete}
                    checked={qualificationConfirmed}
                    aria-invalid={agreementAttempted && !qualificationConfirmed}
                    onChange={(event) => setQualificationConfirmed(event.target.checked)}
                  />
                  I confirm each statement above is true and agree to follow these requirements.
                </label>
              </section>
              <div className="agreement-signature-fields">
              <label
                className={agreementAttempted && agreementPrintedName.trim().toLowerCase() !== legalName.trim().toLowerCase() ? "agreement-required-missing" : ""}
                data-agreement-invalid={agreementAttempted && agreementPrintedName.trim().toLowerCase() !== legalName.trim().toLowerCase()}
              >
                Printed legal name
                <input
                  value={agreementPrintedName}
                  aria-invalid={agreementAttempted && agreementPrintedName.trim().toLowerCase() !== legalName.trim().toLowerCase()}
                  onChange={(event) =>
                    setAgreementPrintedName(event.target.value)
                  }
                  autoComplete="name"
                />
              </label>
              <div
                className={agreementAttempted && !agreementSignature ? "agreement-required-missing" : ""}
                data-agreement-invalid={agreementAttempted && !agreementSignature}
              >
                <SignaturePad onChange={setAgreementSignature} />
              </div>
              <label
                className={`check agreement-consent ${agreementAttempted && !agreementAccepted ? "agreement-required-missing" : ""}`}
                data-agreement-invalid={agreementAttempted && !agreementAccepted}
              >
                <input
                  type="checkbox"
                  disabled={!agreementReadComplete}
                  checked={agreementAccepted}
                  aria-invalid={agreementAttempted && !agreementAccepted}
                  onChange={(event) =>
                    setAgreementAccepted(event.target.checked)
                  }
                />
                I electronically consent and acknowledge the displayed rental
                agreement and required confirmations.
              </label>
              <fieldset>
                <legend>Pickup-condition choice</legend>
                <label className="check">
                  <input
                    type="radio"
                    checked={inspectionChoice === "SEND_FORM"}
                    onChange={() => setInspectionChoice("SEND_FORM")}
                  />
                  Send me the pickup-condition inspection form.
                </label>
                <label className="check">
                  <input
                    type="radio"
                    checked={inspectionChoice === "DECLINE_FORM"}
                    onChange={() => setInspectionChoice("DECLINE_FORM")}
                  />
                  I decline the offered pickup-condition inspection form.
                </label>
              </fieldset>
              <p className="server-stamp-note">
                Your signature and acknowledgments are timestamped by the
                Rental OS in Arizona time when you continue.
              </p>
              </div>
            </div>
            <div className="wizard-actions">
              <button
                type="button"
                className="secondary"
                onClick={() => setStep(2)}
              >
                <ChevronLeft />
                Back
              </button>
              <button className="primary">
                Sign and review booking
                <ChevronRight />
              </button>
            </div>
          </form>
        )}
        {step === 4 && submitted && (
          <section>
            <StageHeading
              eyebrow="STEP 4 OF 4"
              title="Review and payment"
              detail="Review the complete rental, then submit secure payment to confirm your booking."
            />
            <div className="review-grid final-review">
              <ReviewCard title="Schedule">
                <div className="review-schedule-range">
                  <b>{formatScheduleDateTime(pickupDate, pickupTime)}</b>
                  <span aria-hidden="true">{"\u2014"}</span>
                  <b>{formatScheduleDateTime(returnDate, returnTime)}</b>
                </div>
                <button type="button" onClick={() => goToStep(1)}>
                  Edit schedule
                </button>
              </ReviewCard>
              <ReviewCard title="Renter">
                <b>{legalName}</b>
                <span>
                  {email} {"\u00b7"} {phone}
                </span>
                <button type="button" onClick={() => goToStep(2)}>
                  Edit details
                </button>
              </ReviewCard>
              <ReviewCard title="Agreement">
                <b>Signed for protected staging</b>
                <span>
                  {inspectionChoice === "SEND_FORM"
                    ? "Pickup inspection form selected"
                    : "Pickup inspection form declined"}
                </span>
                <button type="button" onClick={() => goToStep(3)}>
                  Review agreement
                </button>
              </ReviewCard>
            </div>
            <QuoteSummary
              quote={quote}
              dolly={dolly}
              deliveryFee={deliveryFee}
              deliveryQuote={deliveryQuote}
              expanded
            />
            <DirectCheckoutPreview
              intent={submitted}
              onComplete={() => setStep(5)}
              agreementDraft={{
                printedName: agreementPrintedName,
                signatureEvidence: agreementSignature,
                inspectionChoice,
              }}
            />
          </section>
        )}
        {step === 5 && <ConfirmationScreen intent={submitted} />}
        {error && (
          <div role="alert" className="form-error wizard-error">
            <AlertTriangle />
            {error}
          </div>
        )}
      </main>
      <p className="staging-footnote">
        <b>Protected test environment.</b> Use synthetic information and Stripe
        test cards only. No live payment or customer communication occurs.
      </p>
    </div>
  );
}

function StageHeading({
  eyebrow,
  title,
  detail,
}: {
  eyebrow: string;
  title: string;
  detail: string;
}) {
  return (
    <div className="stage-heading">
      <p>{eyebrow}</p>
      <h3 id={title.toLowerCase().replaceAll(" ", "-")}>{title}</h3>
      <span>{detail}</span>
    </div>
  );
}
function DateTimeChoice({
  prefix,
  date,
  time,
  onDate,
  onTime,
}: {
  prefix: string;
  date: string;
  time: string;
  onDate: (value: string) => void;
  onTime: (value: string) => void;
}) {
  return (
    <fieldset className="compact-date-time">
      <legend>{prefix}</legend>
      <label>
        Date
        <input
          type="date"
          value={date}
          min={todayKey()}
          onChange={(e) => onDate(e.target.value)}
        />
      </label>
      <label>
        Time
        <select value={time} onChange={(e) => onTime(e.target.value)}>
          <option value="">Select</option>
          {BOOKING_TIME_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </fieldset>
  );
}
function timeLabel(value: string) {
  return (
    BOOKING_TIME_OPTIONS.find((option) => option.value === value)?.label || "—"
  );
}
function formatScheduleDateTime(date: string, time: string) {
  if (!date) return "—";
  const formatted = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));
  return `${formatted} at ${timeLabel(time)}`;
}
function HoldTimer({
  expiresAt,
  onExpired,
}: {
  expiresAt: string;
  onExpired: () => void;
}) {
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, Date.parse(expiresAt) - Date.now()),
  );
  useEffect(() => {
    const tick = () => {
      const next = Math.max(0, Date.parse(expiresAt) - Date.now());
      setRemaining(next);
      if (next === 0) onExpired();
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [expiresAt, onExpired]);
  const minutes = Math.floor(remaining / 60_000),
    seconds = Math.floor((remaining % 60_000) / 1000);
  return (
    <div
      className={`checkout-hold-timer ${remaining < 120_000 ? "ending" : ""}`}
      role="status"
    >
      <ShieldCheck />
      <span>
        <b>Your dates are temporarily held</b>
        <small>Finish checkout to confirm your reservation.</small>
      </span>
      <strong>
        {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
      </strong>
    </div>
  );
}
function ReviewCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <article>
      <small>{title}</small>
      {children}
    </article>
  );
}
function QuoteSummary({
  quote,
  dolly,
  deliveryFee,
  deliveryQuote,
  expanded = false,
}: {
  quote: BookingQuote | null;
  dolly: boolean;
  deliveryFee: number;
  deliveryQuote: DeliveryQuote | null;
  expanded?: boolean;
}) {
  if (!quote)
    return (
      <div className="wizard-quote empty-quote">
        Select valid pickup and return times to see your estimate.
      </div>
    );
  const total = quote.estimatedDueBeforeDeliveryCents + deliveryFee;
  return (
    <aside
      className={`wizard-quote ${expanded ? "expanded" : ""}`}
      aria-live="polite"
    >
      <div>
        <span>Estimated total</span>
        <strong>{money(total)}</strong>
      </div>
      {expanded && (
        <dl>
          <div>
            <dt>
              {quote.fullDays} rental {quote.fullDays === 1 ? "day" : "days"} ×{" "}
              {money(RENTAL_DAY_CENTS)}
            </dt>
            <dd>{money(quote.fullDays * RENTAL_DAY_CENTS)}</dd>
          </div>
          {quote.extraHours > 0 && (
            <div>
              <dt>
                {quote.extraHours} additional{" "}
                {quote.extraHours === 1 ? "hour" : "hours"} ×{" "}
                {money(EXTRA_HOUR_CENTS)}
                {quote.extraHourCapped ? " (daily cap applied)" : ""}
              </dt>
              <dd>{money(quote.extraHourChargeCents)}</dd>
            </div>
          )}
          <div>
            <dt>Dolly</dt>
            <dd>{dolly ? money(quote.dollyChargeCents) : "Not selected"}</dd>
          </div>
          {deliveryFee > 0 && (
            <div>
              <dt>
                Delivery: {customerDeliveryQuoteLines(deliveryQuote!).distance} ×{" "}
                {customerDeliveryQuoteLines(deliveryQuote!).rate}
              </dt>
              <dd>{money(deliveryFee)}</dd>
            </div>
          )}
          <div>
            <dt>Refundable security deposit</dt>
            <dd>{money(quote.securityDepositCents)}</dd>
          </div>
        </dl>
      )}
      <p>
        Estimate only. Availability is rechecked before payment and final
        confirmation.
      </p>
    </aside>
  );
}
function DeliveryResult({ quote }: { quote: DeliveryQuote }) {
  if (quote.status === "AVAILABLE")
    return (
      <div className="delivery-result available">
        Delivery available · {customerDeliveryQuoteSummary(quote)}
      </div>
    );
  if (quote.status === "OUT_OF_AREA")
    return (
      <div className="delivery-result unavailable">
        Online delivery is unavailable for this address.
      </div>
    );
  return (
    <div className="delivery-result review">
      Delivery needs owner review; no fee is shown.
    </div>
  );
}
function AvailabilityCalendar({
  month,
  unavailable,
  pickup,
  returning,
  onMonth,
  onDay,
}: {
  month: string;
  unavailable: string[];
  pickup: string;
  returning: string;
  onMonth: (value: string) => void;
  onDay: (value: string) => void;
}) {
  const [year, monthNumber] = month.split("-").map(Number);
  const first = new Date(Date.UTC(year, monthNumber - 1, 1));
  const daysInMonth = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const cells = [
    ...Array(first.getUTCDay()).fill(null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];
  const move = (delta: number) => {
    const date = new Date(Date.UTC(year, monthNumber - 1 + delta, 1));
    onMonth(
      `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`,
    );
  };
  return (
    <section
      className="availability-calendar"
      aria-label="Rental OS availability calendar"
    >
      <header>
        <button
          type="button"
          aria-label="Previous month"
          onClick={() => move(-1)}
        >
          <ChevronLeft />
        </button>
        <div>
          <CalendarDays />
          <strong>
            {new Intl.DateTimeFormat("en-US", {
              month: "long",
              year: "numeric",
              timeZone: "UTC",
            }).format(first)}
          </strong>
        </div>
        <button type="button" aria-label="Next month" onClick={() => move(1)}>
          <ChevronRight />
        </button>
      </header>
      <div className="calendar-weekdays">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="customer-calendar-grid">
        {cells.map((day, index) => {
          if (!day) return <span key={`blank-${index}`} />;
          const key = `${month}-${String(day).padStart(2, "0")}`;
          const blocked = unavailable.includes(key),
            past = key < todayKey(),
            selected = key === pickup || key === returning,
            inRange = Boolean(pickup && returning && key > pickup && key < returning);
          const state = past ? "past" : blocked ? "unavailable" : "available";
          return (
            <button
              type="button"
              key={key}
              disabled={blocked || past}
              className={`${state} ${selected ? "selected" : ""} ${inRange ? "in-range" : ""}`}
              onClick={() => onDay(key)}
              aria-label={`${key}: ${state}`}
            >
              <b>{day}</b>
              <small>
                {past ? "Past" : blocked ? "Unavailable" : "Available"}
              </small>
            </button>
          );
        })}
      </div>
      <footer>
        <span>
          <i />
          Available
        </span>
        <span>
          <i className="unavailable" />
          Unavailable
        </span>
        <span>
          <i className="selected-range" />
          Selected rental
        </span>
        <small>No customer or booking details are shown.</small>
      </footer>
    </section>
  );
}
function ConfirmationScreen({ intent }: { intent: Intent | null }) {
  if (intent?.status === "REVIEW_REQUIRED")
    return (
      <section className="booking-confirmation review">
        <CheckCircle2 />
        <p>REQUEST RECEIVED</p>
        <h2>Owner review is required</h2>
        <span>
          Delivery or interstate approval is still needed. Your request does not
          hold dates or guarantee availability, and no payment was collected.
        </span>
      </section>
    );
  return (
    <section className="booking-confirmation">
      <CheckCircle2 />
      <p>BOOKING SUCCESSFUL</p>
      <h2>Your reservation is confirmed</h2>
      <span>
        Your payment was accepted and the Rental OS completed its final
        availability and evidence checks. A confirmation message is prepared for
        the protected staging workflow.
      </span>
    </section>
  );
}

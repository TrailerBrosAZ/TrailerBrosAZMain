import { beforeEach, describe, expect, it } from "vitest";
import type Database from "better-sqlite3";
import { handleApiRequest } from "../src/server/api.js";
import {
  createLocalDatabasePort,
  migrate,
  openDatabase,
} from "../src/server/db/database.js";

let raw: Database.Database;
const env = () => ({
  ENVIRONMENT: "development" as const,
  AUTH_MODE: "mock" as const,
  ALLOWED_OWNER_EMAIL: "owner@example.test",
  DB: createLocalDatabasePort(raw),
});
const now = () => new Date("2027-01-01T12:00:00Z");
const request = (path: string, init: RequestInit = {}) =>
  handleApiRequest(
    new Request(`http://local${path}`, {
      ...init,
      headers: {
        "content-type": "application/json",
        "x-dev-owner-email": "owner@example.test",
        ...init.headers,
      },
    }),
    env(),
    { now },
  );
const intent = (overrides: Record<string, unknown> = {}) => ({
  idempotencyKey: `intent_${crypto.randomUUID()}`,
  trailerId: 1,
  legalName: "Synthetic Direct Customer",
  email: "synthetic@example.test",
  phone: "480-555-0100",
  age25Confirmed: true,
  namedRenterOnlyTowing: true,
  towVehicleDetails: "Synthetic tow vehicle",
  hitchBallAcknowledged: true,
  brakeControllerAcknowledged: true,
  insuranceAcknowledged: true,
  intendedUse: "Synthetic local move",
  tripType: "IN_STATE",
  fulfillmentType: "PICKUP",
  pickupAt: "2027-02-01T08:00",
  returnAt: "2027-02-02T08:00",
  dollyRequested: true,
  ...overrides,
});
beforeEach(() => {
  raw?.close();
  raw = openDatabase(":memory:");
  migrate(raw);
  raw
    .prepare(
      "INSERT INTO trailers(name,unit_code,published_payload_lbs) VALUES ('Synthetic Trailer','SYN-1',5200)",
    )
    .run();
});
describe("direct checkout API boundary", () => {
  it("runs the protected synthetic API happy path and creates exactly one confirmed reservation", async () => {
    expect(
      (
        await request("/api/customer-preview/intents", {
          method: "POST",
          body: JSON.stringify(intent()),
        })
      ).status,
    ).toBe(201);
    const sessionResponse = await request(
      "/api/customer-preview/direct-checkout/sessions",
      {
        method: "POST",
        body: JSON.stringify({
          intentId: 1,
          idempotencyKey: "checkout_session_api_001",
        }),
      },
    );
    expect(sessionResponse.status).toBe(201);
    const session = (await sessionResponse.json()) as {
      token: string;
      csrfToken: string;
      state: string;
    };
    expect(session.state).toBe("AGREEMENT_REQUIRED");
    expect(
      (
        await request("/api/customer-preview/direct-checkout/agreement", {
          method: "POST",
          body: JSON.stringify({
          ...session,
          printedName: "Synthetic Direct Customer",
          signatureEvidence: "[[0.1,0.1],[0.2,0.2],[0.3,0.1]]",
          inspectionChoice: "SEND_FORM",
          }),
        })
      ).status,
    ).toBe(201);
    expect(
      (
        await request("/api/customer-preview/direct-checkout/payment", {
          method: "POST",
          body: JSON.stringify({
            ...session,
            idempotencyKey: "checkout_payment_api_001",
          }),
        })
      ).status,
    ).toBe(201);
    const finalized = await request(
      "/api/customer-preview/direct-checkout/finalize",
      {
        method: "POST",
        body: JSON.stringify({
          ...session,
          idempotencyKey: "checkout_convert_api_001",
        }),
      },
    );
    expect(finalized.status).toBe(201);
    expect(await finalized.json()).toMatchObject({
      state: "COMPLETE",
      reservationId: 1,
    });
    expect(
      raw
        .prepare(
          "SELECT count(1) total FROM reservations WHERE status='CONFIRMED'",
        )
        .get(),
    ).toEqual({ total: 1 });
    expect(
      (
        await request("/api/customer-preview/direct-checkout/finalize", {
          method: "POST",
          body: JSON.stringify({
            ...session,
            idempotencyKey: "checkout_convert_api_001",
          }),
        })
      ).status,
    ).toBe(201);
    expect(
      raw.prepare("SELECT count(1) total FROM reservations").get(),
    ).toEqual({ total: 1 });
  });
  it("fails safe for owner-review requests and never creates a checkout session", async () => {
    expect(
      (
        await request("/api/customer-preview/intents", {
          method: "POST",
          body: JSON.stringify(
            intent({
              tripType: "INTERSTATE",
              interstateDetails: "Synthetic Nevada trip",
            }),
          ),
        })
      ).status,
    ).toBe(201);
    const response = await request(
      "/api/customer-preview/direct-checkout/sessions",
      {
        method: "POST",
        body: JSON.stringify({
          intentId: 1,
          idempotencyKey: "checkout_review_api_001",
        }),
      },
    );
    expect(await response.json()).toMatchObject({
      state: "OWNER_REVIEW_REQUIRED",
      created: false,
    });
    expect(
      raw.prepare("SELECT count(1) total FROM direct_checkout_sessions").get(),
    ).toEqual({ total: 0 });
  });
  it("rejects cross-origin mutations, oversized payloads, and invalid session tokens without internal details", async () => {
    const cross = await request(
      "/api/customer-preview/direct-checkout/sessions",
      {
        method: "POST",
        headers: { origin: "https://other.example" },
        body: JSON.stringify({
          intentId: 1,
          idempotencyKey: "checkout_cross_origin",
        }),
      },
    );
    expect(cross.status).toBe(500);
    expect(await cross.json()).toEqual({
      error: "The request could not be completed.",
    });
    const oversized = await request(
      "/api/customer-preview/direct-checkout/agreement",
      { method: "POST", headers: { "content-length": "64001" }, body: "{}" },
    );
    expect(oversized.status).toBe(500);
    expect(await oversized.json()).toEqual({
      error: "The request could not be completed.",
    });
    const missing = await request(
      "/api/customer-preview/direct-checkout/session",
      { headers: { "x-checkout-token": "x".repeat(48) } },
    );
    expect(missing.status).toBe(500);
    expect(await missing.json()).toEqual({
      error: "The request could not be completed.",
    });
  });
});

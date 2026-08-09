import { describe, expect, it } from "vitest";
import {
  BOOKING_TIME_OPTIONS,
  bookingIntentExpiration,
  bookingIntentPolicy,
  calculateBookingQuote,
} from "../src/shared/booking.js";
import { parseArizonaDateTime } from "../src/shared/arizonaTime.js";

describe("customer booking quote contract", () => {
  it("offers only 15-minute choices from 6:00 AM through 10:00 PM", () => {
    expect(BOOKING_TIME_OPTIONS).toHaveLength(65);
    expect(BOOKING_TIME_OPTIONS[0]).toEqual({
      value: "06:00",
      label: "6:00 AM",
    });
    expect(BOOKING_TIME_OPTIONS.at(-1)).toEqual({
      value: "22:00",
      label: "10:00 PM",
    });
    expect(
      BOOKING_TIME_OPTIONS.every(
        (option, index) => Number(option.value.slice(3)) === (index % 4) * 15,
      ),
    ).toBe(true);
    expect(
      BOOKING_TIME_OPTIONS.some((option) => option.value.endsWith(":22")),
    ).toBe(false);
  });
  it("uses $60 full days and $10 extra hours", () => {
    const quote = calculateBookingQuote(
      parseArizonaDateTime("2027-01-15T08:00"),
      parseArizonaDateTime("2027-01-16T10:00"),
      false,
    );
    expect(quote).toMatchObject({
      fullDays: 1,
      extraHours: 2,
      extraHourChargeCents: 2000,
      rentalDays: 2,
      rentalChargeCents: 8000,
      dollyChargeCents: 0,
      securityDepositCents: 10000,
      taxCents: 0,
      estimatedDueBeforeDeliveryCents: 18000,
    });
  });
  it("caps extra hours at the $60 daily rate", () => {
    const quote = calculateBookingQuote(
      parseArizonaDateTime("2027-07-15T08:00"),
      parseArizonaDateTime("2027-07-15T18:00"),
      true,
    );
    expect(quote).toMatchObject({
      fullDays: 0,
      extraHours: 10,
      extraHourChargeCents: 6000,
      extraHourCapped: true,
      rentalDays: 1,
      rentalChargeCents: 6000,
      dollyChargeCents: 1000,
      estimatedDueBeforeDeliveryCents: 17000,
      deliveryChargeCents: null,
    });
  });
  it("rounds partial extra hours upward and prices dolly per rental day", () => {
    const quote = calculateBookingQuote(
      parseArizonaDateTime("2027-07-15T08:00"),
      parseArizonaDateTime("2027-07-17T08:30"),
      true,
    );
    expect(quote).toMatchObject({
      fullDays: 2,
      extraHours: 1,
      rentalDays: 3,
      rentalChargeCents: 13000,
      dollyChargeCents: 3000,
    });
  });
  it("uses the same Arizona wall-time rule in winter and summer", () => {
    const winter = calculateBookingQuote(
      parseArizonaDateTime("2027-01-15T08:00"),
      parseArizonaDateTime("2027-01-15T14:00"),
      false,
    );
    const summer = calculateBookingQuote(
      parseArizonaDateTime("2027-07-15T08:00"),
      parseArizonaDateTime("2027-07-15T14:00"),
      false,
    );
    expect(winter.rentalChargeCents).toBe(6000);
    expect(summer.rentalChargeCents).toBe(6000);
  });
  it("prices valid 15-minute selections using the same authoritative hour rounding", () => {
    const quote = calculateBookingQuote(
      parseArizonaDateTime("2027-07-15T08:15"),
      parseArizonaDateTime("2027-07-16T09:45"),
      true,
    );
    expect(quote).toMatchObject({
      fullDays: 1,
      extraHours: 2,
      rentalChargeCents: 8000,
      rentalDays: 2,
      dollyChargeCents: 2000,
      estimatedDueBeforeDeliveryCents: 20000,
    });
  });
  it("uses a 15-minute checkout window for standard qualified intents", () =>
    expect(
      bookingIntentPolicy(new Date("2027-01-01T12:00:00Z"), false),
    ).toEqual({
      status: "SUBMITTED",
      expiresAt: new Date("2027-01-01T12:15:00.000Z"),
    }));
  it("uses a 24-hour review window for owner-approval exceptions", () =>
    expect(bookingIntentPolicy(new Date("2027-01-01T12:00:00Z"), true)).toEqual(
      {
        status: "REVIEW_REQUIRED",
        expiresAt: new Date("2027-01-02T12:00:00.000Z"),
      },
    ));
  it("uses the same 15-minute expiration helper for standard intents", () =>
    expect(
      bookingIntentExpiration(new Date("2027-01-01T12:00:00Z")).toISOString(),
    ).toBe("2027-01-01T12:15:00.000Z"));
});

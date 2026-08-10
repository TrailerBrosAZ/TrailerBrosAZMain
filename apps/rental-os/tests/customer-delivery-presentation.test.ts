import { describe, expect, it } from "vitest";
import {
  customerDeliveryQuoteLines,
  customerDeliveryQuoteSummary,
} from "../src/shared/customerDeliveryPresentation.js";

describe("customer delivery presentation", () => {
  it("shows billable miles, rate, and total without internal calculation wording", () => {
    const quote = {
      billableMiles: 12,
      rateCentsPerMile: 250,
      feeCents: 3000,
    };
    expect(customerDeliveryQuoteLines(quote)).toEqual({
      distance: "12 billable miles",
      rate: "$2.50 per mile",
      total: "$30.00",
    });
    const summary = customerDeliveryQuoteSummary(quote);
    expect(summary).toBe("12 billable miles · $2.50 per mile · $30.00");
    expect(summary).not.toMatch(/one-way|rounded|origin/i);
  });

  it("uses a singular billable-mile label", () => {
    expect(
      customerDeliveryQuoteSummary({
        billableMiles: 1,
        rateCentsPerMile: 250,
        feeCents: 250,
      }),
    ).toBe("1 billable mile · $2.50 per mile · $2.50");
  });
});

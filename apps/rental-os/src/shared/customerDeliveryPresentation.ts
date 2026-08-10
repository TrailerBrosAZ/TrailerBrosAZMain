const money = (cents: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);

export type CustomerDeliveryQuote = {
  billableMiles: number | null;
  feeCents: number | null;
  rateCentsPerMile: number | null;
};

export function customerDeliveryQuoteLines(quote: CustomerDeliveryQuote) {
  const miles = Number(quote.billableMiles || 0);
  const rate = Number(quote.rateCentsPerMile || 250);
  const total = Number(quote.feeCents || 0);
  return {
    distance: `${miles} billable ${miles === 1 ? "mile" : "miles"}`,
    rate: `${money(rate)} per mile`,
    total: money(total),
  };
}

export function customerDeliveryQuoteSummary(quote: CustomerDeliveryQuote) {
  const lines = customerDeliveryQuoteLines(quote);
  return `${lines.distance} · ${lines.rate} · ${lines.total}`;
}

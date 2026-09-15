import type { Institution } from "../types.ts";

/**
 * Paying institutions on the placement board. Seeded into SQLite by the API and
 * bundled with the client so the static Pages build can fall back to the same
 * catalog when `/api` is unreachable.
 */
export const INSTITUTION_SEEDS: Institution[] = [
  {
    id: "first-atlantic",
    name: "First Atlantic Private Bank",
    kind: "bank",
    kindLabel: "Bank",
    desk: "Securities-based lending",
    targeting: {
      minInvestable: 50_000_000,
      liquidityMin: 10_000_000,
      privateMarketsMinPct: 0,
      geography: "Northeast U.S. households",
      states: ["CT", "NY", "NJ", "MA"],
      consentRequired: true,
    },
    offer: {
      id: "offer-sbl",
      institutionId: "first-atlantic",
      title: "Securities-based credit line",
      strategy: "Securities-based credit line",
      bps: 185,
      feeDiscountPct: 10,
      rank: 2,
      fitReason:
        "Verified taxable collateral can support a line without selling the public-equity sleeve.",
      summary:
        "Up to 55% advance on the verified taxable book, interest-only for 24 months. Indicative spread, subject to credit approval.",
      placementKind: "bps",
      placementLabel: "Paid placement",
      placementFeeBps: 12,
      paidPlacement:
        "Institution paid 12 bps (annualized on committed line) to appear against this consented passport.",
      terms: "SOFR + 1.85%. No prepayment penalty. Recourse limited to pledged securities.",
      expires: "2026-10-31",
      audience: "Households with ≥ $50M verified brokerage collateral",
    },
  },
  {
    id: "meridian",
    name: "Meridian Global Asset Management",
    kind: "asset-manager",
    kindLabel: "Asset manager",
    desk: "Municipal SMA",
    targeting: {
      minInvestable: 25_000_000,
      liquidityMin: 5_000_000,
      privateMarketsMinPct: 0,
      geography: "High-tax states (CT, NY, CA)",
      states: ["CT", "NY", "CA"],
      consentRequired: true,
    },
    offer: {
      id: "offer-muni",
      institutionId: "meridian",
      title: "Tax-aware municipal SMA",
      strategy: "Tax-aware municipal SMA",
      bps: 38,
      feeDiscountPct: 10,
      rank: 1,
      fitReason:
        "A high-tax domicile plus a taxable fixed-income sleeve is a tighter municipal-SMA fit than credit or secondaries.",
      summary:
        "Separately managed national + state-preference book. Target duration 6.4 years. Fee follows the standard SMA schedule.",
      placementKind: "strategy",
      placementLabel: "Paid placement",
      placementFeeBps: 9,
      paidPlacement:
        "Institution paid 9 bps (annualized on matched assets) for strategy placement against passports with a taxable fixed-income sleeve.",
      terms: "38 bps all-in SMA. No wrap. Quarterly tax-loss harvest.",
      expires: "2026-11-15",
      audience: "Taxable accounts ≥ $20M in high-tax domiciles",
    },
  },
  {
    id: "oakridge",
    name: "Oakridge Partners",
    kind: "private-markets",
    kindLabel: "Private markets",
    desk: "Secondaries access",
    targeting: {
      minInvestable: 40_000_000,
      liquidityMin: 8_000_000,
      privateMarketsMinPct: 0.1,
      geography: "U.S. accredited / QP",
      states: [],
      consentRequired: true,
    },
    offer: {
      id: "offer-secondaries",
      institutionId: "oakridge",
      title: "2026 secondaries sleeve",
      strategy: "2026 secondaries sleeve",
      bps: 150,
      feeDiscountPct: 10,
      rank: 3,
      fitReason:
        "A secondaries feeder is a satellite allocation next to an existing private-markets sleeve, not the core public book.",
      summary:
        "Closed-end secondaries sleeve with 15% carry. Capital calls staged over 18 months. Not a solicitation.",
      placementKind: "special",
      placementLabel: "Paid placement",
      placementFeeBps: 15,
      paidPlacement:
        "Institution paid 15 bps (annualized on matched assets) for a special-offer slot against consented passports.",
      terms: "1.5 / 15. Capital calls staged over 18 months. Not a solicitation.",
      expires: "2026-12-01",
      audience: "Households with an existing private-markets sleeve ≥ 10%",
    },
  },
];

{
  const ids = INSTITUTION_SEEDS.map((firm) => firm.id);
  if (new Set(ids).size !== ids.length) {
    throw new Error("INSTITUTION DATA FAILURE: institution ids must be unique.");
  }
  const offerIds = INSTITUTION_SEEDS.map((firm) => firm.offer.id);
  if (new Set(offerIds).size !== offerIds.length) {
    throw new Error("INSTITUTION DATA FAILURE: offer ids must be unique.");
  }
}

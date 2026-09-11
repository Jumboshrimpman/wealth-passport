export const PRODUCT_NAME = "WealthPass";

export const DEMO_NOTICE =
  "MOCK DEMO — WealthPass walkthrough. Client passports load from a local SQLite API when you run the full stack. Institution offers remain fixtures. Access is Clerk-gated. No live custody, KYC, payments, or manager feeds.";

export const TAGLINE =
  "Standardized and comprehensive investment potential across firms.";

export type AppMode = "client" | "institution" | "admin";

export type VerificationKind = "custodian" | "advisor" | "document";

export type PlacementKind = "bps" | "strategy" | "special";

export type InstitutionKind = "bank" | "asset-manager" | "private-markets";

export interface Offer {
  id: string;
  institutionId: string;
  title: string;
  strategy: string;
  bps: number;
  feeDiscountPct: number;
  rank: number;
  fitReason: string;
  summary: string;
  placementKind: PlacementKind;
  placementLabel: string;
  paidPlacement: string;
  terms: string;
  expires: string;
  audience: string;
}

export interface Institution {
  id: string;
  name: string;
  kind: InstitutionKind;
  kindLabel: string;
  desk: string;
  targeting: {
    minInvestable: number;
    liquidityMin: number;
    privateMarketsMinPct: number;
    geography: string;
    consentRequired: boolean;
  };
  offer: Offer;
}

export const institutions: Institution[] = [
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
        "Ranked #2 for this book: verified taxable collateral can support a line without selling the public-equity sleeve.",
      summary:
        "Up to 55% advance on the verified taxable book, interest-only for 24 months. Spread is illustrated, not a live quote.",
      placementKind: "bps",
      placementLabel: "Paid placement",
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
        "Ranked #1 for this book: a high-tax domicile plus a taxable fixed-income sleeve is a tighter municipal-SMA fit than credit or secondaries.",
      summary:
        "Separately managed national + state-preference book. Illustrated duration 6.4 years. Fee is a fixture, not a live SMA schedule.",
      placementKind: "strategy",
      placementLabel: "Paid placement",
      paidPlacement:
        "Institution paid for strategy placement against passports with a taxable fixed-income sleeve.",
      terms: "38 bps all-in SMA. No wrap. Quarterly tax-loss harvest illustrated, not live.",
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
      geography: "U.S. accredited / QP illustrated",
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
        "Ranked #3 for this book: a secondaries feeder is a satellite allocation, not the core public book.",
      summary:
        "Closed-end secondaries sleeve with illustrated 15% carry. Capital calls staged over 18 months. Not a solicitation.",
      placementKind: "special",
      placementLabel: "Paid placement",
      paidPlacement: "Institution paid for a special-offer slot against consented passports.",
      terms: "Illustrative 1.5 / 15. Capital calls staged over 18 months. Not a solicitation.",
      expires: "2026-12-01",
      audience: "Households with an existing private-markets sleeve ≥ 10%",
    },
  },
];

export function formatUsd(n: number, compact = false): string {
  if (compact) {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function institutionById(id: string): Institution | undefined {
  return institutions.find((item) => item.id === id);
}

export function offerHeadline(offer: Offer): string {
  return `${offer.strategy} for ${offer.bps} bps (discounted ${offer.feeDiscountPct}% max fee)`;
}

export function rankedInstitutions(): Institution[] {
  return [...institutions].sort((a, b) => a.offer.rank - b.offer.rank);
}

export const MODE_HOMES: Record<AppMode, string> = {
  client: "/chat",
  institution: "/institution",
  admin: "/admin",
};

export const MODE_NAV: Record<AppMode, { to: string; label: string }[]> = {
  client: [
    { to: "/chat", label: "Chat" },
    { to: "/passport", label: "Passport" },
    { to: "/verification", label: "Verification" },
    { to: "/offers", label: "Offers" },
    { to: "/ops", label: "Ops" },
  ],
  institution: [{ to: "/institution", label: "Offer console" }],
  admin: [{ to: "/admin", label: "Overview" }],
};

export function modesAllowedForPath(pathname: string): AppMode[] {
  if (pathname === "/institution") return ["institution", "admin"];
  if (pathname === "/admin") return ["admin"];
  if (
    pathname === "/chat" ||
    pathname === "/passport" ||
    pathname === "/verification" ||
    pathname === "/offers" ||
    pathname === "/ops"
  ) {
    return ["client", "admin"];
  }
  return ["client", "institution", "admin"];
}

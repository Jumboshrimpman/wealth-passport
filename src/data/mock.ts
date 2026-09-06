import { buildAllocationTree, holdings } from "./holdings";

export const PRODUCT_NAME = "WealthPass";

export const DEMO_NOTICE =
  "MOCK DEMO — WealthPass walkthrough. Holdings, institutions, and offers are fixtures. Access is Clerk-gated. No live custody, KYC, payments, or manager feeds.";

export const TAGLINE =
  "Standardized and comprehensive investment potential across firms.";

export type AppMode = "client" | "institution" | "admin";

export type VerificationKind = "custodian" | "advisor" | "document";

export type PlacementKind = "bps" | "strategy" | "special";

export type InstitutionKind = "bank" | "asset-manager" | "private-markets";

export interface Account {
  id: string;
  name: string;
  type: string;
  custodian: string;
  balance: number;
  verifiedCustodian: boolean;
  sleeve: "taxable" | "qualified" | "private" | "cash";
}

export interface Allocation {
  label: string;
  pct: number;
  tone: "camel" | "sage" | "ink" | "clay" | "stone";
}

export interface PassportConsent {
  shared: boolean;
  lastChanged: string;
  scopes: string[];
}

export interface Advisor {
  name: string;
  title: string;
  firm: string;
  brokerCheckId: string;
  crdFirm: string;
  verified: boolean;
  since: string;
}

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

export const household = {
  name: "Whitmore Household",
  clientFirstName: "Elena",
  principals: "Elena & Marcus Whitmore",
  domicile: "Greenwich, CT",
  entity: "Whitmore Family Revocable Trust",
  /** Listed custodied accounts on the passport table. */
  accountValue: 186_400_000,
  /** Assets that could be allocated — listed accounts plus additional investable not on the table. */
  investable: 228_000_000,
  additionalInvestable: 41_600_000,
  realEstate: 48_000_000,
  otherHousehold: 24_000_000,
  /** Household AUM / net worth: investable + residence + other personal assets. */
  householdValue: 300_000_000,
  liquidity: 18_200_000,
  risk: {
    label: "Moderate growth",
    horizon: "7-year planning window",
    capacity: "Can absorb a 15–20% drawdown without forced sale",
    privateMarketsSleeve: 0.127,
  },
  dataAsOf: "2026-09-04",
  sourceNote:
    "Holdings and style boxes illustrated as if first provided by Morningstar and Informa. Not live manager feeds.",
};

export const advisor: Advisor = {
  name: "Linda McDonald",
  title: "Managing Director, Private Client",
  firm: "McDonald Advisory Group",
  brokerCheckId: "111111",
  crdFirm: "CRD 888888 (illustrative)",
  verified: true,
  since: "2019-03-12",
};

export const accounts: Account[] = [
  {
    id: "ml-pw",
    name: "Private Wealth brokerage",
    type: "Taxable joint",
    custodian: "Merrill Lynch",
    balance: 84_200_000,
    verifiedCustodian: true,
    sleeve: "taxable",
  },
  {
    id: "fid-tax",
    name: "Taxable brokerage",
    type: "Individual",
    custodian: "Fidelity",
    balance: 31_400_000,
    verifiedCustodian: false,
    sleeve: "taxable",
  },
  {
    id: "schwab-ira",
    name: "Traditional IRA (rollover candidate)",
    type: "IRA",
    custodian: "Charles Schwab",
    balance: 29_100_000,
    verifiedCustodian: false,
    sleeve: "qualified",
  },
  {
    id: "oak-pe",
    name: "PE feeder / secondaries sleeve",
    type: "Private fund interest",
    custodian: "Oakridge Partners (admin)",
    balance: 21_800_000,
    verifiedCustodian: false,
    sleeve: "private",
  },
  {
    id: "cash",
    name: "Treasury & municipal reserve",
    type: "Cash / short duration",
    custodian: "First Atlantic Private Bank",
    balance: 19_900_000,
    verifiedCustodian: false,
    sleeve: "cash",
  },
];

export const accountValue = accounts.reduce((sum, account) => sum + account.balance, 0);

if (accountValue !== household.accountValue) {
  throw new Error(
    `MOCK DATA FAILURE: accountValue sum ${accountValue} does not match household.accountValue ${household.accountValue}.`,
  );
}

if (household.investable !== household.accountValue + household.additionalInvestable) {
  throw new Error("MOCK DATA FAILURE: investable must equal listed accounts plus additional investable.");
}

if (household.householdValue !== household.investable + household.realEstate + household.otherHousehold) {
  throw new Error("MOCK DATA FAILURE: household value must equal investable + real estate + other household assets.");
}

if (household.householdValue !== 300_000_000) {
  throw new Error("MOCK DATA FAILURE: household AUM must be $300,000,000 for this walkthrough.");
}

export const allocationTree = buildAllocationTree(accounts, accountValue);

export const allocations: Allocation[] = allocationTree.map((node) => ({
  label: node.label,
  pct: Math.round(node.pct * 10) / 10,
  tone: node.tone,
}));

if (holdings.reduce((sum, row) => sum + row.value, 0) !== accountValue) {
  throw new Error("MOCK DATA FAILURE: holdings do not sum to account value.");
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
        "Ranked #2 for this book: $84.2M verified Merrill taxable collateral can support a line without selling the public-equity sleeve.",
      summary:
        "Up to 55% advance on the verified Merrill taxable book ($84.2M illustrated), interest-only for 24 months. Spread is illustrated, not a live quote.",
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
        "Ranked #1 for this book: Greenwich, CT domicile plus a large taxable fixed-income sleeve inside a $300M household is a tighter municipal-SMA fit than credit or secondaries.",
      summary:
        "Separately managed national + CT preference book. Illustrated duration 6.4 years. Fee is a fixture, not a live SMA schedule.",
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
        "Ranked #3 for this book: a private-markets sleeve is already on the $300M passport, so a secondaries feeder is a satellite, not the core.",
      summary:
        "Closed-end secondaries sleeve with illustrated 15% carry. Capital calls staged over 18 months. Not a solicitation.",
      placementKind: "special",
      placementLabel: "Paid placement",
      paidPlacement:
        "Institution paid for a special-offer slot against passports that already show a private-markets sleeve.",
      terms: "Illustrative 1.5 / 15. Capital calls staged over 18 months. Not a solicitation.",
      expires: "2026-12-01",
      audience: "Households with an existing private-markets sleeve ≥ 10%",
    },
  },
];

export const defaultPassportConsent: PassportConsent = {
  shared: true,
  lastChanged: "2026-08-12",
  scopes: [
    "Holdings and sleeves",
    "Risk posture and liquidity",
    "Verification badges",
    "Domicile",
  ],
};

export const attestations = [
  {
    date: "2026-09-01",
    kind: "custodian" as VerificationKind,
    title: "Merrill Lynch custodian match",
    detail:
      "Account ending 4481 illustrated as custodian-verified. Badge is static mock data — no DTCC or firm API was called.",
  },
  {
    date: "2026-08-20",
    kind: "advisor" as VerificationKind,
    title: "Linda McDonald · BrokerCheck 111111",
    detail:
      "Advisor identity illustrated as FINRA BrokerCheck–style verification. ID 111111 is a placeholder, not a live CRD lookup.",
  },
  {
    date: "2026-08-02",
    kind: "document" as VerificationKind,
    title: "Accredited / QP letter reused",
    detail:
      "Ops packet reuses the household’s illustrated investor letter. Document is a fixture, not a signed original.",
  },
];

export const opsPacket = {
  title: "IRA rollover enrollment packet",
  from: "Charles Schwab Traditional IRA",
  to: "First Atlantic Qualified Rollover IRA",
  reused: 14,
  total: 18,
  fields: [
    { label: "Household legal name", value: "Elena Whitmore & Marcus Whitmore", source: "Passport", reused: true },
    { label: "Legal entity", value: "Whitmore Family Revocable Trust", source: "Passport", reused: true },
    { label: "Domicile", value: "Greenwich, CT", source: "Passport", reused: true },
    { label: "Advisor of record", value: "Linda McDonald · BrokerCheck 111111", source: "Verification", reused: true },
    { label: "Delivering account", value: "Schwab IRA · •••• 9021", source: "Passport", reused: true },
    { label: "Receiving account", value: "First Atlantic QRP · pending", source: "Ops clerk", reused: false },
    { label: "Cost basis method", value: "Specific ID (illustrated)", source: "Passport", reused: true },
    { label: "Beneficiaries", value: "Primary: spouse · Contingent: Whitmore 2008 GST", source: "Passport", reused: true },
    { label: "W-9 / TIN attestation", value: "On file · last4 4418", source: "Reusable docs", reused: true },
    { label: "ACH instructions", value: "First Atlantic operating · •••• 2209", source: "Reusable docs", reused: true },
    { label: "Risk questionnaire", value: "Moderate growth · 2026-04 refresh", source: "Passport", reused: true },
    { label: "Accredited investor letter", value: "Illustrated QP letter · 2026-01", source: "Reusable docs", reused: true },
    { label: "Passport share consent", value: "On · any paying institution may offer", source: "Consent", reused: true },
    { label: "Morningstar-style holdings extract", value: "Taxable + IRA sleeves (fixture)", source: "Illustrated feed", reused: true },
    { label: "Informa-style product mapping", value: "Muni SMA + SBL eligibility (fixture)", source: "Illustrated feed", reused: true },
    { label: "Medallion / wet signature", value: "Required at funding", source: "Still needed", reused: false },
    { label: "Receiving plan acceptance", value: "Institution ops queue", source: "Still needed", reused: false },
    { label: "State rollover notice", value: "CT notice to be generated", source: "Still needed", reused: false },
  ],
};

export const adminMetrics = [
  { label: "Illustrated passports", value: "128", note: "Fixture count" },
  { label: "Paying institutions on the board", value: "14", note: "3 shown in this walkthrough" },
  { label: "Illustrative AUM on file", value: "$2.4B", note: "Not audited" },
  { label: "Paid placements (open)", value: "41", note: "Ranked strategy / bps slots" },
  { label: "Ops fields reused (this packet)", value: "14 / 18", note: "Whitmore rollover" },
  { label: "Mock mode coverage", value: "3", note: "Client · Institution · Admin" },
  { label: "Inbox rank depth", value: "3", note: "Portfolio-fit order, not an optimizer" },
  { label: "Whitmore household AUM", value: "$300M", note: "Fixture · this passport" },
  { label: "Clerk gate", value: "Wired", note: "VITE_CLERK_PUBLISHABLE_KEY at build" },
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

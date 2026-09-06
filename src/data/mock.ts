export const DEMO_NOTICE =
  "MOCK DEMO — Illustrative household, institutions, and offers. No live APIs, custody, KYC, payments, or manager feeds.";

export const TAGLINE =
  "Standardized and comprehensive investment potential across firms.";

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

export interface Consent {
  institutionId: string;
  shared: boolean;
  scopes: string[];
  lastChanged: string;
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
  principals: "Elena & Marcus Whitmore",
  domicile: "Greenwich, CT",
  entity: "Whitmore Family Revocable Trust",
  investable: 18_640_000,
  realEstate: 4_200_000,
  netWorth: 22_840_000,
  liquidity: 1_820_000,
  risk: {
    label: "Moderate growth",
    horizon: "7-year planning window",
    capacity: "Can absorb a 15–20% drawdown without forced sale",
    privateMarketsSleeve: 0.18,
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
    balance: 8_420_000,
    verifiedCustodian: true,
    sleeve: "taxable",
  },
  {
    id: "fid-tax",
    name: "Taxable brokerage",
    type: "Individual",
    custodian: "Fidelity",
    balance: 3_140_000,
    verifiedCustodian: false,
    sleeve: "taxable",
  },
  {
    id: "schwab-ira",
    name: "Traditional IRA (rollover candidate)",
    type: "IRA",
    custodian: "Charles Schwab",
    balance: 2_910_000,
    verifiedCustodian: false,
    sleeve: "qualified",
  },
  {
    id: "oak-pe",
    name: "PE feeder / secondaries sleeve",
    type: "Private fund interest",
    custodian: "Oakridge Partners (admin)",
    balance: 2_180_000,
    verifiedCustodian: false,
    sleeve: "private",
  },
  {
    id: "cash",
    name: "Treasury & municipal reserve",
    type: "Cash / short duration",
    custodian: "First Atlantic Private Bank",
    balance: 1_990_000,
    verifiedCustodian: false,
    sleeve: "cash",
  },
];

export const allocations: Allocation[] = [
  { label: "Public equity", pct: 42, tone: "camel" },
  { label: "Fixed income", pct: 22, tone: "sage" },
  { label: "Private markets", pct: 18, tone: "ink" },
  { label: "Real assets", pct: 10, tone: "clay" },
  { label: "Cash & equivalents", pct: 8, tone: "stone" },
];

export const institutions: Institution[] = [
  {
    id: "first-atlantic",
    name: "First Atlantic Private Bank",
    kind: "bank",
    kindLabel: "Bank",
    desk: "Securities-based lending",
    targeting: {
      minInvestable: 10_000_000,
      liquidityMin: 1_000_000,
      privateMarketsMinPct: 0,
      geography: "Northeast U.S. households",
      consentRequired: true,
    },
    offer: {
      id: "offer-sbl",
      institutionId: "first-atlantic",
      title: "Securities-based credit line",
      summary:
        "Up to 55% advance on the verified Merrill taxable book, SOFR + 185 bps, interest-only for 24 months.",
      placementKind: "bps",
      placementLabel: "Paid placement · 12 bps",
      paidPlacement:
        "Institution paid 12 bps (annualized on committed line) to appear in this household’s inbox.",
      terms: "SOFR + 1.85%. No prepayment penalty. Recourse limited to pledged securities.",
      expires: "2026-10-31",
      audience: "Households with ≥ $8M verified brokerage collateral",
    },
  },
  {
    id: "meridian",
    name: "Meridian Global Asset Management",
    kind: "asset-manager",
    kindLabel: "Asset manager",
    desk: "Municipal SMA",
    targeting: {
      minInvestable: 5_000_000,
      liquidityMin: 500_000,
      privateMarketsMinPct: 0,
      geography: "High-tax states (CT, NY, CA)",
      consentRequired: true,
    },
    offer: {
      id: "offer-muni",
      institutionId: "meridian",
      title: "Tax-aware municipal SMA",
      summary:
        "Separately managed national + CT preference book, 38 bps strategy fee, illustrated duration 6.4 years.",
      placementKind: "strategy",
      placementLabel: "Paid placement · strategy",
      paidPlacement:
        "Institution paid for strategy placement against households with a taxable fixed-income sleeve.",
      terms: "38 bps all-in SMA. No wrap. Quarterly tax-loss harvest illustrated, not live.",
      expires: "2026-11-15",
      audience: "Taxable accounts ≥ $2M in high-tax domiciles",
    },
  },
  {
    id: "oakridge",
    name: "Oakridge Partners",
    kind: "private-markets",
    kindLabel: "Private markets",
    desk: "Secondaries access",
    targeting: {
      minInvestable: 8_000_000,
      liquidityMin: 750_000,
      privateMarketsMinPct: 0.1,
      geography: "U.S. accredited / QP illustrated",
      consentRequired: true,
    },
    offer: {
      id: "offer-secondaries",
      institutionId: "oakridge",
      title: "2026 secondaries sleeve",
      summary:
        "Closed-end secondaries sleeve, 1.5% management and 15% carry, with a first-$500k management-fee waiver.",
      placementKind: "special",
      placementLabel: "Paid placement · special offer",
      paidPlacement:
        "Institution paid for a special-offer slot: fee waiver on the first $500k committed.",
      terms: "Illustrative 1.5 / 15. Capital calls staged over 18 months. Not a solicitation.",
      expires: "2026-12-01",
      audience: "Households with an existing private-markets sleeve ≥ 10%",
    },
  },
];

export const defaultConsents: Consent[] = [
  {
    institutionId: "first-atlantic",
    shared: true,
    scopes: ["Net worth band", "Verified Merrill balances", "Liquidity"],
    lastChanged: "2026-08-12",
  },
  {
    institutionId: "meridian",
    shared: true,
    scopes: ["Taxable allocation", "Domicile", "Risk label"],
    lastChanged: "2026-07-29",
  },
  {
    institutionId: "oakridge",
    shared: true,
    scopes: ["Private markets sleeve", "Accreditation (illustrated)", "Advisor attestation"],
    lastChanged: "2026-06-18",
  },
];

export const revokedFirm = {
  id: "harbor-street",
  name: "Harbor Street Securities",
  note: "Consent withdrawn. Profile is not shared. No paid placement may target this household.",
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
    { label: "Trust / entity", value: "Whitmore Family Revocable Trust", source: "Passport", reused: true },
    { label: "Domicile", value: "Greenwich, CT", source: "Passport", reused: true },
    { label: "Advisor of record", value: "Linda McDonald · BrokerCheck 111111", source: "Trust", reused: true },
    { label: "Delivering account", value: "Schwab IRA · •••• 9021", source: "Passport", reused: true },
    { label: "Receiving account", value: "First Atlantic QRP · pending", source: "Ops clerk", reused: false },
    { label: "Cost basis method", value: "Specific ID (illustrated)", source: "Passport", reused: true },
    { label: "Beneficiaries", value: "Primary: spouse · Contingent: Whitmore 2008 GST", source: "Passport", reused: true },
    { label: "W-9 / TIN attestation", value: "On file · last4 4418", source: "Reusable docs", reused: true },
    { label: "ACH instructions", value: "First Atlantic operating · •••• 2209", source: "Reusable docs", reused: true },
    { label: "Risk questionnaire", value: "Moderate growth · 2026-04 refresh", source: "Passport", reused: true },
    { label: "Accredited investor letter", value: "Illustrated QP letter · 2026-01", source: "Reusable docs", reused: true },
    { label: "Consent to First Atlantic", value: "Active · lending + rollover ops", source: "Consent", reused: true },
    { label: "Morningstar-style holdings extract", value: "Taxable + IRA sleeves (fixture)", source: "Illustrated feed", reused: true },
    { label: "Informa-style product mapping", value: "Muni SMA + SBL eligibility (fixture)", source: "Illustrated feed", reused: true },
    { label: "Medallion / wet signature", value: "Required at funding", source: "Still needed", reused: false },
    { label: "Receiving plan acceptance", value: "Institution ops queue", source: "Still needed", reused: false },
    { label: "State rollover notice", value: "CT notice to be generated", source: "Still needed", reused: false },
  ],
};

export const adminMetrics = [
  { label: "Illustrated passports", value: "128", note: "Fixture count" },
  { label: "Institutions on the mock board", value: "14", note: "3 shown in this walkthrough" },
  { label: "Illustrative AUM on file", value: "$2.4B", note: "Not audited" },
  { label: "Paid placements (open)", value: "41", note: "bps / strategy / special" },
  { label: "Ops fields reused (this packet)", value: "14 / 18", note: "Whitmore rollover" },
  { label: "Consent grants (this household)", value: "3", note: "1 firm revoked" },
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

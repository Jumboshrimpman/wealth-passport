import { formatUsd } from "../../shared/format.ts";
import { STRATEGY_UNIVERSE, type StrategyProfile } from "../../shared/strategies.ts";
import type { ClientPassport } from "../../shared/types.ts";

/**
 * Institutional desk model. Demo only.
 * Client names stay off every public field. The internal id is for routing a
 * pitch back to a record and must not be rendered.
 */

export const FIRM = {
  name: "Goldman Sachs Asset Management",
  desk: "Institutional desk",
  email: "institutional.desk@gsam.example",
  billing: "Goldman Sachs Asset Management · Treasury · New York",
} as const;

export const PITCH_SEND_USD = 1800;

export const LISTING_NOTE =
  "Listing a strategy is free. Sending a pitch is a separate charge. Order on this page is alphabetical.";

export const CANNED_STRATEGY_FILE = "GSAM Tax-Aware Equity.pdf";
export const SAMPLE_CLEAN_FILE = "Tax-aware equity.pdf";
export const SAMPLE_RECONCILE_FILE = "Unreconciled credit book.xlsx";

export const ASSET_CLASSES = ["Equity", "Fixed income", "Multi-asset", "Private markets", "Real assets", "Cash"] as const;
export const RISK_LEVELS = ["Conservative", "Moderate", "Growth", "Aggressive"] as const;

const FIRM_CUSTODIAN = /goldman/i;

const DEMO_AGE: Record<string, number> = {
  "elena-whitmore": 62,
  "priya-shah": 44,
  "chen-family": 51,
  "delgado-family": 68,
  "okafor-trust": 56,
  "lindqvist-estate": 39,
  "nakamura-family": 53,
  "beaumont-family": 71,
  "fernandez-family": 48,
  "ashworth-family": 59,
};

const DEMO_REF: Record<string, string> = {
  "elena-whitmore": "Household 14",
  "priya-shah": "Household 07",
  "chen-family": "Household 22",
  "delgado-family": "Household 31",
  "okafor-trust": "Household 03",
  "lindqvist-estate": "Household 18",
  "nakamura-family": "Household 11",
  "beaumont-family": "Household 02",
  "fernandez-family": "Household 27",
  "ashworth-family": "Household 09",
};

export interface FirmAccount {
  type: string;
  balance: number;
}

export interface AnonClient {
  /** Internal only. Never render — seed ids contain names. */
  id: string;
  ref: string;
  age: number;
  state: string;
  country: string;
  householdAum: number;
  withFirm: number | null;
  elsewhere: number | null;
  firmAccounts: FirmAccount[];
}

/** One sleeve in a strategy pack. Weights across the book should add to 100. */
export interface AllocationSleeve {
  id: string;
  label: string;
  weightPct: number;
  vehicle: string;
  range: string;
  holdingsNote: string;
}

/**
 * Standardized strategy profile. Field groups follow a finished strategy pack:
 * identity, objective and process, allocation, characteristics, risk, fees.
 */
export interface StrategyProfileDraft {
  id: string;
  name: string;
  vehicle: string;
  style: string;
  investorProfile: string;
  taxPosture: string;
  benchmarkAdherence: string;
  asOf: string;
  objective: string;
  process: string;
  horizon: string;
  sleeves: AllocationSleeve[];
  holdingsCount: string;
  turnover: string;
  investsWithin: string;
  benchmark: string;
  trackingNote: string;
  risk: string;
  volatilityNote: string;
  suitability: string;
  feeBps: number;
  feeNote: string;
  minAum: number;
  esgFlags: string;
  holdingsSummary: string;
  assetClass: string;
  sourceFile: string | null;
}

export interface DeskRecommendation {
  id: string;
  title: string;
  detail: string;
  patch: Partial<Pick<StrategyProfileDraft, "objective" | "feeBps" | "esgFlags" | "holdingsSummary" | "sleeves">>;
}

export type ListingStatus = "editing" | "recommendations" | "under-review" | "posted" | "human-review";

export interface OwnedStrategy {
  id: string;
  draft: StrategyProfileDraft;
  status: ListingStatus;
  recommendations: DeskRecommendation[];
  decisions: Record<string, "accept" | "decline">;
  /** When set, Save restores this status instead of starting a new review. */
  resumeStatus?: ListingStatus;
}

export interface PitchDelivery {
  clientId: string;
  when: string;
}

export interface DeskPitch {
  id: string;
  name: string;
  solution: string;
  pricing: string;
  targetClientId: string | null;
  audienceNote: string;
  sent: PitchDelivery[];
}

export interface DeskCharge {
  id: string;
  when: string;
  label: string;
  amount: number;
}

export interface MarketStrategy {
  id: string;
  name: string;
  assetClass: string;
  style: string;
  manager: string;
  minimum: number | null;
  feeLabel: string;
  summary: string;
  yours: boolean;
}

export const DESK_PROMPTS = [
  { id: "fit", label: "Which clients fit this desk?" },
  { id: "recent", label: "What pitches went out recently?" },
  { id: "upload", label: "Upload this strategy PDF and submit for review" },
  { id: "ny", label: "Prepare a pitch for a client with ≥$10M in New York" },
] as const;

export type DeskEffect = "upload-strategy" | "draft-ny-pitch" | null;

const US_STATE: Record<string, string> = {
  AL: "Alabama",
  AK: "Alaska",
  AZ: "Arizona",
  AR: "Arkansas",
  CA: "California",
  CO: "Colorado",
  CT: "Connecticut",
  DC: "District of Columbia",
  DE: "Delaware",
  FL: "Florida",
  GA: "Georgia",
  HI: "Hawaii",
  IA: "Iowa",
  IL: "Illinois",
  IN: "Indiana",
  KS: "Kansas",
  KY: "Kentucky",
  LA: "Louisiana",
  MA: "Massachusetts",
  MD: "Maryland",
  ME: "Maine",
  MI: "Michigan",
  MN: "Minnesota",
  MO: "Missouri",
  MS: "Mississippi",
  MT: "Montana",
  NC: "North Carolina",
  ND: "North Dakota",
  NE: "Nebraska",
  NH: "New Hampshire",
  NJ: "New Jersey",
  NM: "New Mexico",
  NV: "Nevada",
  NY: "New York",
  OH: "Ohio",
  OK: "Oklahoma",
  OR: "Oregon",
  PA: "Pennsylvania",
  RI: "Rhode Island",
  SC: "South Carolina",
  SD: "South Dakota",
  TN: "Tennessee",
  TX: "Texas",
  UT: "Utah",
  VA: "Virginia",
  VT: "Vermont",
  WA: "Washington",
  WI: "Wisconsin",
  WV: "West Virginia",
  WY: "Wyoming",
};

export function locationOf(domicile: string): { state: string; country: string } {
  const parts = domicile.split(",").map((part) => part.trim());
  const region = parts[1] ?? "";
  if (region === "UK" || /united kingdom/i.test(domicile)) {
    return { state: "England", country: "United Kingdom" };
  }
  if (US_STATE[region] || /^[A-Z]{2}$/.test(region)) {
    return { state: region, country: "United States" };
  }
  return { state: region || "—", country: "United States" };
}

export function formatLocation(row: Pick<AnonClient, "state" | "country">): string {
  return `${row.state}, ${row.country}`;
}

function hashIndex(id: string, span: number): number {
  let n = 0;
  for (const char of id) n = (n * 33 + char.charCodeAt(0)) % span;
  return n;
}

export function anonymizeBook(passports: readonly ClientPassport[]): AnonClient[] {
  return passports.map((passport) => {
    const place = locationOf(passport.household.domicile);
    const firmAccounts = passport.accounts
      .filter((account) => FIRM_CUSTODIAN.test(account.custodian))
      .map((account) => ({ type: account.type, balance: account.balance }));
    const withFirm = firmAccounts.reduce((sum, account) => sum + account.balance, 0);
    const overlap = firmAccounts.length > 0;
    return {
      id: passport.id,
      ref: DEMO_REF[passport.id] ?? `Household ${String(10 + hashIndex(passport.id, 80)).padStart(2, "0")}`,
      age: DEMO_AGE[passport.id] ?? 35 + hashIndex(passport.id, 40),
      state: place.state,
      country: place.country,
      householdAum: passport.household.householdValue,
      withFirm: overlap ? withFirm : null,
      elsewhere: overlap ? Math.max(0, passport.household.householdValue - withFirm) : null,
      firmAccounts: overlap ? firmAccounts : [],
    };
  });
}

/** Fields the institutional UI is allowed to show for a household. */
export function anonPublicText(row: AnonClient): string {
  return [
    row.ref,
    String(row.age),
    row.state,
    row.country,
    String(row.householdAum),
    row.withFirm == null ? "" : String(row.withFirm),
    row.elsewhere == null ? "" : String(row.elsewhere),
    ...row.firmAccounts.map((account) => `${account.type} ${account.balance}`),
  ].join("\n");
}

export function filterAnon(
  rows: readonly AnonClient[],
  options: { query?: string; state?: string; minAum?: number; firmOnly?: boolean },
): AnonClient[] {
  const query = options.query?.trim().toLowerCase() ?? "";
  return rows
    .filter((row) => {
      if (options.state && row.state !== options.state) return false;
      if (options.minAum && row.householdAum < options.minAum) return false;
      if (options.firmOnly && row.withFirm == null) return false;
      if (!query) return true;
      const haystack = [
        row.ref,
        String(row.age),
        formatLocation(row),
        row.state,
        US_STATE[row.state] ?? "",
        row.country,
        formatUsd(row.householdAum),
        formatUsd(row.householdAum, true),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    })
    .sort((a, b) => b.householdAum - a.householdAum || a.ref.localeCompare(b.ref));
}

/** Households at or above this AUM are the ones this desk is built for. */
export const FIT_HOUSEHOLD_AUM = 25_000_000;

export function fittingClients(rows: readonly AnonClient[]): AnonClient[] {
  return rows.filter((row) => row.withFirm != null || row.householdAum >= FIT_HOUSEHOLD_AUM);
}

export function matchesNewYorkPitch(row: AnonClient): boolean {
  return row.state === "NY" && row.householdAum >= 10_000_000;
}

function slug(filename: string): string {
  return filename
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

function titleFromFile(filename: string): string {
  const stem = filename.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " ").trim();
  if (!stem) return "Uploaded strategy";
  return stem.replace(/\b\w/g, (char) => char.toUpperCase());
}

function sleeve(
  id: string,
  label: string,
  weightPct: number,
  vehicle: string,
  range: string,
  holdingsNote: string,
): AllocationSleeve {
  return { id, label, weightPct, vehicle, range, holdingsNote };
}

/** Sum of sleeve weights, rounded to a tenth of a percent. */
export function sleeveTotal(sleeves: readonly AllocationSleeve[]): number {
  const raw = sleeves.reduce((sum, row) => sum + (Number.isFinite(row.weightPct) ? row.weightPct : 0), 0);
  return Math.round(raw * 10) / 10;
}

/** Scale sleeve weights so they add to 100. An empty book becomes one unassigned sleeve. */
export function footSleeves(sleeves: readonly AllocationSleeve[]): AllocationSleeve[] {
  if (sleeves.length === 0) {
    return [sleeve("unassigned", "Unassigned", 100, "SMA", "", "")];
  }
  const total = sleeveTotal(sleeves);
  if (Math.abs(total - 100) <= 0.15) return sleeves.map((row) => ({ ...row }));
  const scaled = sleeves.map((row) => {
    const raw = total > 0 ? (row.weightPct / total) * 100 : 100 / sleeves.length;
    return { ...row, weightPct: Math.round(raw * 10) / 10 };
  });
  const drift = Math.round((100 - sleeveTotal(scaled)) * 10) / 10;
  const last = scaled[scaled.length - 1];
  if (last) last.weightPct = Math.round((last.weightPct + drift) * 10) / 10;
  return scaled;
}

const CLEAN_PROFILE: Omit<StrategyProfileDraft, "id" | "sourceFile"> = {
  name: "Northline Tax-Aware Allocation",
  vehicle: "Hybrid SMA and ETF",
  style: "Tax-aware core allocation",
  investorProfile: "Moderately growth",
  taxPosture: "Tax-aware",
  benchmarkAdherence: "High",
  asOf: "Q2 2026",
  objective:
    "Keep a taxable household close to a balanced policy while harvesting losses inside the equity and municipal sleeves.",
  process:
    "Choose each sleeve for a role, rebalance when a weight leaves its range, and harvest a loss when a substitute holding is available.",
  horizon: "Strategic allocation, reviewed each quarter. Tilts stay inside the published ranges.",
  sleeves: [
    sleeve("us-equity", "US equity core", 46, "SMA", "40–52%", "About 80 names, single-name cap 2%"),
    sleeve("intl-equity", "International developed equity", 18, "ETF", "12–24%", "Broad developed markets"),
    sleeve("munis", "Municipal bonds", 28, "SMA", "22–34%", "Intermediate ladder"),
    sleeve("cash", "Cash", 8, "Cash", "2–12%", "Settlement and tax reserves"),
  ],
  holdingsCount: "120–160 across the separate accounts",
  turnover: "About 25%",
  investsWithin: "About 3 business days",
  benchmark: "US 60/40 blend",
  trackingNote: "Expected to stay near the policy blend. Tracking is a guide, not a promise.",
  risk: "Moderate",
  volatilityNote: "Equity is the larger share, so the path follows equity, with a cushion from municipals and cash.",
  suitability:
    "Taxable households that can leave the allocation in place through a full cycle. Not a fit when principal is needed on a set date.",
  feeBps: 32,
  feeNote: "Covers management of the sleeves. Custody, and expenses inside an ETF, sit outside this fee.",
  minAum: 10_000_000,
  esgFlags: "No dedicated sustainability screen.",
  holdingsSummary:
    "Four sleeves. US equity is the core separate account. International equity is an ETF. Municipals are their own account. Cash is a reserve, not a return engine.",
  assetClass: "Multi-asset",
};

const RECONCILE_PROFILE: Omit<StrategyProfileDraft, "id" | "sourceFile"> = {
  name: "Cedar Opportunistic Credit",
  vehicle: "Separate account",
  style: "Opportunistic credit",
  investorProfile: "Aggressive income",
  taxPosture: "Taxable",
  benchmarkAdherence: "Moderate",
  asOf: "Q2 2026",
  objective: "Seek extra yield from a mix of investment-grade credit and high yield.",
  process: "Pair an investment-grade book with a high-yield sleeve, and rebalance when either leaves its stated range.",
  horizon: "Tactical, reviewed inside a year.",
  sleeves: [
    sleeve("ig-credit", "Investment-grade credit", 48, "SMA", "40–60%", "Intermediate corporates"),
    sleeve("high-yield", "High yield", 31, "ETF", "20–40%", "Broad high-yield market"),
    sleeve("cash", "Cash", 9, "Cash", "0–15%", "Dry powder"),
  ],
  holdingsCount: "Not fully read from the file",
  turnover: "Not stated",
  investsWithin: "Not stated",
  benchmark: "US investment-grade credit",
  trackingNote: "The sleeve weights in the file do not add to the whole book.",
  risk: "Aggressive",
  volatilityNote: "Credit spreads drive the result. The cash sleeve is small.",
  suitability: "Households that can accept a credit drawdown. Not a fit when a stable coupon is the point.",
  feeBps: 93,
  feeNote: "Read as a management fee. Confirm what it covers before this lists.",
  minAum: 5_000_000,
  esgFlags: "None stated",
  holdingsSummary:
    "Three sleeves were read from the workbook. Their weights do not add to the whole portfolio. Confirm the missing share before this lists.",
  assetClass: "Fixed income",
};

function genericProfile(base: string): Omit<StrategyProfileDraft, "id" | "sourceFile"> {
  return {
    name: titleFromFile(base),
    vehicle: "Separate account",
    style: "Core",
    investorProfile: "Moderate",
    taxPosture: "Not stated",
    benchmarkAdherence: "To be confirmed",
    asOf: "Q2 2026",
    objective: `Pursue the mandate described in ${base}.`,
    process: "The file named a mandate. Confirm how names are selected, when the book rebalances, and whether losses are harvested.",
    horizon: "Strategic.",
    sleeves: [
      sleeve("growth", "Global equity", 60, "SMA", "50–70%", "Core equity book"),
      sleeve("bonds", "Bonds", 35, "SMA", "25–45%", "Investment-grade bonds"),
      sleeve("cash", "Cash", 5, "Cash", "0–10%", "Reserve"),
    ],
    holdingsCount: "80–120",
    turnover: "About 20%",
    investsWithin: "About 5 business days",
    benchmark: "To be confirmed",
    trackingNote: "To be confirmed.",
    risk: "Moderate",
    volatilityNote: "Split between growth assets and bonds.",
    suitability: "Households seeking one balanced allocation.",
    feeBps: 45,
    feeNote: "Management fee only.",
    minAum: 5_000_000,
    esgFlags: "Not stated",
    holdingsSummary: `Holdings were read from ${base}. Weights are summarized here for a manager to confirm.`,
    assetClass: "Multi-asset",
  };
}

/** Demo parse: filename selects a fixture. No document model runs. */
export function parseStrategyFile(filename: string): StrategyProfileDraft {
  const base = filename.split(/[/\\]/).pop() ?? filename;
  const lower = base.toLowerCase();
  const id = `parsed-${slug(base) || "upload"}`;
  if (lower.includes("unreconciled") || lower.includes("reconcile")) {
    return { ...RECONCILE_PROFILE, sleeves: RECONCILE_PROFILE.sleeves.map((row) => ({ ...row })), id, sourceFile: base };
  }
  if (lower.includes("tax-aware") || lower.includes("tax aware") || lower.includes("gsam")) {
    return { ...CLEAN_PROFILE, sleeves: CLEAN_PROFILE.sleeves.map((row) => ({ ...row })), id, sourceFile: base };
  }
  const generic = genericProfile(base);
  return { ...generic, id, sourceFile: base };
}

function sleeveMixLine(sleeves: readonly AllocationSleeve[]): string {
  if (sleeves.length === 0) return "No sleeves yet.";
  return sleeves.map((row) => `${row.label || "Untitled"} ${row.weightPct}%`).join(" · ");
}

export function recommendationsFor(draft: StrategyProfileDraft): DeskRecommendation[] {
  const objective = draft.objective.trim().replace(/\s+/g, " ");
  const clipped = objective.length > 160 ? `${objective.slice(0, 157).trim()}…` : objective;
  const namesBenchmark =
    draft.benchmark &&
    draft.benchmark !== "To be confirmed" &&
    !clipped.toLowerCase().includes(draft.benchmark.toLowerCase());
  const tightened = namesBenchmark ? `${clipped.replace(/\.$/, "")}. Benchmark ${draft.benchmark}.` : clipped;
  const total = sleeveTotal(draft.sleeves);
  const footed = Math.abs(total - 100) <= 1;
  return [
    {
      id: "objective",
      title: "Tighten the objective",
      detail: "One sentence a client can scan, with the benchmark if the file named one.",
      patch: { objective: tightened || "State the objective in one sentence." },
    },
    {
      id: "fee",
      title: "Quote the fee in clean basis points",
      detail: "Households compare whole steps of five.",
      patch: { feeBps: Math.max(5, Math.round((draft.feeBps || 0) / 5) * 5) },
    },
    {
      id: "allocation",
      title: footed ? "Confirm the sleeve mix" : "Foot the allocation",
      detail: footed
        ? "The sleeves already add to 100. This line records the mix."
        : `These weights add to ${total}%. Scale them so the book reads 100.`,
      patch: { sleeves: footSleeves(draft.sleeves) },
    },
  ];
}

export function recommendationPreview(rec: DeskRecommendation): string {
  if (rec.patch.objective) return rec.patch.objective;
  if (rec.patch.sleeves) return sleeveMixLine(rec.patch.sleeves);
  if (rec.patch.esgFlags) return rec.patch.esgFlags;
  if (rec.patch.holdingsSummary) return rec.patch.holdingsSummary;
  if (rec.patch.feeBps != null) return `${rec.patch.feeBps} bps`;
  return "";
}

export function applyDecisions(
  draft: StrategyProfileDraft,
  recs: readonly DeskRecommendation[],
  decisions: Readonly<Record<string, "accept" | "decline">>,
): StrategyProfileDraft {
  return recs.reduce((current, rec) => {
    if (decisions[rec.id] !== "accept") return current;
    return { ...current, ...rec.patch };
  }, draft);
}

/**
 * Internal checker. The manager never sees this reason — only Posted or Human review.
 * Books whose sleeves do not add to 100, and thin or implausible profiles, go to a person.
 */
export function listingDecision(draft: StrategyProfileDraft): "posted" | "human-review" {
  if (draft.sleeves.length === 0 || Math.abs(sleeveTotal(draft.sleeves) - 100) > 1) return "human-review";
  if (!draft.name.trim() || !draft.objective.trim()) return "human-review";
  if (!Number.isFinite(draft.feeBps) || draft.feeBps <= 0 || draft.feeBps > 200) return "human-review";
  if (draft.holdingsSummary.trim().length < 40) return "human-review";
  if (!draft.assetClass.trim() || draft.minAum <= 0) return "human-review";
  return "posted";
}

export function strategyFromUpload(filename: string, id: string): OwnedStrategy {
  const draft = { ...parseStrategyFile(filename), id };
  return {
    id,
    draft,
    status: "editing",
    recommendations: recommendationsFor(draft),
    decisions: {},
  };
}

export function blankStrategy(id: string): OwnedStrategy {
  const draft: StrategyProfileDraft = {
    id,
    name: "",
    vehicle: "Separate account",
    style: "Core",
    investorProfile: "Moderate",
    taxPosture: "Not stated",
    benchmarkAdherence: "To be confirmed",
    asOf: "Q2 2026",
    objective: "",
    process: "",
    horizon: "Strategic.",
    sleeves: [sleeve("core", "Core sleeve", 100, "SMA", "", "")],
    holdingsCount: "",
    turnover: "",
    investsWithin: "",
    benchmark: "To be confirmed",
    trackingNote: "",
    risk: "Moderate",
    volatilityNote: "",
    suitability: "",
    feeBps: 35,
    feeNote: "",
    minAum: 10_000_000,
    esgFlags: "Not stated",
    holdingsSummary: "",
    assetClass: "Equity",
    sourceFile: null,
  };
  return { id, draft, status: "editing", recommendations: [], decisions: {} };
}

export function statusLabel(status: ListingStatus): string {
  switch (status) {
    case "editing":
      return "Draft";
    case "recommendations":
      return "Recommendations";
    case "under-review":
      return "Under review";
    case "posted":
      return "Posted";
    case "human-review":
      return "Human review";
  }
}

export function statusNote(status: ListingStatus): string {
  if (status === "under-review") return "The listing is in review.";
  if (status === "posted") return "Posted. Listing is free.";
  if (status === "human-review") return "A person will review this before it is posted.";
  return "";
}

export function newYorkPitch(id: string): DeskPitch {
  return {
    id,
    name: "New York household sleeve",
    solution:
      "A state-preference municipal ladder beside a tax-aware US equity SMA, sized for a household that already has at least $10 million.",
    pricing: "36 bps all-in on the equity sleeve. Municipal ladder at 22 bps. No performance fee.",
    targetClientId: null,
    audienceNote: "New York · household AUM at least $10M · not confirmed",
    sent: [],
  };
}

export function blankPitch(id: string): DeskPitch {
  return {
    id,
    name: "",
    solution: "",
    pricing: "",
    targetClientId: null,
    audienceNote: "",
    sent: [],
  };
}

export function refFor(book: readonly AnonClient[], clientId: string): string | null {
  return book.find((row) => row.id === clientId)?.ref ?? null;
}

function draftIsEsg(flags: string): boolean {
  const text = flags.trim();
  if (!text) return false;
  return !/not stated|none stated|no dedicated|no esg/i.test(text);
}

/** A posted listing joins the shared catalog. Drafts stay on the desk only. */
export function postedCatalogProfile(strategy: OwnedStrategy): StrategyProfile | null {
  if (strategy.status !== "posted" || !strategy.draft.name.trim()) return null;
  return {
    id: strategy.id,
    name: strategy.draft.name,
    category: strategy.draft.assetClass || "Multi-asset",
    style: strategy.draft.style || "Core",
    manager: FIRM.name,
    minimum: strategy.draft.minAum,
    allInBps: strategy.draft.feeBps,
    feeLabel: null,
    summary: strategy.draft.objective,
    risk: strategy.draft.risk || "Moderate",
    esg: draftIsEsg(strategy.draft.esgFlags),
    inception: strategy.draft.asOf || null,
    productCode: null,
  };
}

export function marketplaceRows(owned: readonly OwnedStrategy[]): MarketStrategy[] {
  const yours: MarketStrategy[] = owned
    .filter((strategy) => strategy.status === "posted" && strategy.draft.name.trim())
    .map((strategy) => ({
      id: strategy.id,
      name: strategy.draft.name,
      assetClass: strategy.draft.assetClass,
      style: strategy.draft.style,
      manager: FIRM.name,
      minimum: strategy.draft.minAum,
      feeLabel: `${strategy.draft.feeBps} bps`,
      summary: strategy.draft.objective,
      yours: true,
    }));
  const others: MarketStrategy[] = STRATEGY_UNIVERSE.map((strategy) => ({
    id: strategy.id,
    name: strategy.name,
    assetClass: strategy.category,
    style: strategy.style,
    manager: strategy.manager,
    minimum: strategy.minimum,
    feeLabel: strategy.allInBps != null ? `${strategy.allInBps} bps` : (strategy.feeLabel ?? ""),
    summary: strategy.summary,
    yours: false,
  }));
  return [...yours, ...others].sort((a, b) => a.name.localeCompare(b.name) || a.manager.localeCompare(b.manager));
}

export function filterMarket(
  rows: readonly MarketStrategy[],
  options: { query?: string; assetClass?: string },
): MarketStrategy[] {
  const query = options.query?.trim().toLowerCase() ?? "";
  return rows.filter((row) => {
    if (options.assetClass && row.assetClass !== options.assetClass) return false;
    if (!query) return true;
    return [row.name, row.manager, row.style, row.assetClass, row.summary].join(" ").toLowerCase().includes(query);
  });
}

const POSTED_SEED: OwnedStrategy = {
  id: "own-tax-aware",
  status: "posted",
  recommendations: [],
  decisions: {},
  draft: {
    id: "own-tax-aware",
    name: "US Equity Tax-Aware SMA",
    vehicle: "Separate account",
    style: "Tax-aware core",
    investorProfile: "Growth",
    taxPosture: "Tax-aware",
    benchmarkAdherence: "High",
    asOf: "Q2 2026",
    objective: "Harvest losses around a large-cap US equity book without leaving the S&P 500 band.",
    process: "Own the large-cap book, harvest losses against a substitute, and rebalance when a name leaves its cap.",
    horizon: "Strategic. The book is reviewed each quarter.",
    sleeves: [
      sleeve("equity", "US large-cap equity", 98, "SMA", "96–100%", "Broad large-cap book, 2% single-name cap"),
      sleeve("cash", "Cash", 2, "Cash", "0–4%", "Frictions and tax reserves"),
    ],
    holdingsCount: "150–175",
    turnover: "About 20%",
    investsWithin: "About 3 business days",
    benchmark: "S&P 500",
    trackingNote: "Stays close to the large-cap index. Tracking is a guide, not a promise.",
    risk: "Moderate",
    volatilityNote: "Moves with large-cap US equity. Cash is a residual, not a buffer.",
    suitability: "Taxable households that want equity exposure and can use harvested losses.",
    feeBps: 30,
    feeNote: "Management fee. Custody is separate.",
    minAum: 10_000_000,
    esgFlags: "Excludes thermal coal and civilian firearms.",
    holdingsSummary: "A large-cap US equity separate account with a 2% single-name cap, and cash under 4%. No municipal bonds in this book.",
    assetClass: "Equity",
    sourceFile: null,
  },
};

function draftSeed(id: string, name: string, assetClass: string): OwnedStrategy {
  const strategy = blankStrategy(id);
  return {
    ...strategy,
    draft: {
      ...strategy.draft,
      name,
      assetClass,
      objective: `${name} for households that already keep a taxable account.`,
      holdingsSummary: `${name}. Weights, the fee, and the household minimum are ready to edit before this lists.`,
    },
  };
}

export function seedStrategies(): OwnedStrategy[] {
  return [
    POSTED_SEED,
    draftSeed("own-muni", "Municipal ladder", "Fixed income"),
    draftSeed("own-intl", "International equity sleeve", "Equity"),
    draftSeed("own-bond", "Core bond sleeve", "Fixed income"),
  ];
}

export function seedPitches(): DeskPitch[] {
  return [
    {
      id: "pitch-muni",
      name: "State-preference municipal sleeve",
      solution: "A New York municipal ladder with duration set to the household's income window.",
      pricing: "22 bps. No performance fee.",
      targetClientId: "okafor-trust",
      audienceNote: "",
      sent: [{ clientId: "okafor-trust", when: "Sep 12" }],
    },
    {
      id: "pitch-equity",
      name: "Tax-aware equity on an existing account",
      solution: "Run the tax-aware SMA on the account already held at your firm, and leave the rest of the household untouched.",
      pricing: "30 bps all-in.",
      targetClientId: "priya-shah",
      audienceNote: "",
      sent: [{ clientId: "priya-shah", when: "Sep 4" }],
    },
  ];
}

export function seedCharges(): DeskCharge[] {
  return [
    { id: "chg-sep12", when: "Sep 12", label: "Pitch sent · Household 03", amount: PITCH_SEND_USD },
    { id: "chg-sep4", when: "Sep 4", label: "Pitch sent · Household 07", amount: PITCH_SEND_USD },
  ];
}

export function deskGreeting(book: readonly AnonClient[], pitches: readonly DeskPitch[]): string {
  const band = book.filter((row) => row.householdAum >= FIT_HOUSEHOLD_AUM).length;
  const here = book.filter((row) => row.withFirm != null).length;
  const sent = pitches.reduce((sum, pitch) => sum + pitch.sent.length, 0);
  const household = band === 1 ? "household has" : "households have";
  const account = here === 1 ? "already has an account at your firm" : "already have an account at your firm";
  const pitchWord = sent === 1 ? "pitch has" : "pitches have";
  return `${band} ${household} household AUM of ${formatUsd(FIT_HOUSEHOLD_AUM, true)} or more. ${here} ${account}. ${sent} ${pitchWord} gone out.`;
}

export function deskReply(
  input: string,
  ctx: { book: readonly AnonClient[]; pitches: readonly DeskPitch[] },
): { text: string; effect: DeskEffect } {
  const text = input.toLowerCase();
  if (/(upload|pdf|excel|submit for review)/.test(text)) {
    return {
      effect: "upload-strategy",
      text: `I read ${CANNED_STRATEGY_FILE} into the standard profile and opened one round of recommendations. Accept or decline each line, then submit. Listing is free.`,
    };
  }
  if (/(pitch|prepare)/.test(text) && /(new york|10\s*m|10m|\$10)/.test(text)) {
    return {
      effect: "draft-ny-pitch",
      text: `I drafted a pitch for New York households with at least ${formatUsd(10_000_000, true)}. Targeting is not confirmed — choose the household before it sends. Sending a pitch is ${formatUsd(PITCH_SEND_USD)}. Listing a strategy is free.`,
    };
  }
  if (/(fit|which client|anonym)/.test(text)) {
    const rows = fittingClients(ctx.book);
    const lines = rows.map((row) => {
      const overlap = row.withFirm != null ? " Part of this household is already with your firm." : "";
      return `${row.ref} · age ${row.age} · ${formatLocation(row)} · ${formatUsd(row.householdAum, true)}.${overlap}`;
    });
    return {
      effect: null,
      text: [
        `${rows.length} households have household AUM of ${formatUsd(FIT_HOUSEHOLD_AUM, true)} or more, or already have an account at your firm. Names stay off this desk.`,
        ...lines,
        "You can upload a strategy for a free listing, or draft a pitch and confirm who receives it.",
      ].join("\n\n"),
    };
  }
  if (/(recent|went out|activity|pitch)/.test(text)) {
    const lines = ctx.pitches.flatMap((pitch) =>
      pitch.sent.map((delivery) => {
        const ref = refFor(ctx.book, delivery.clientId);
        return ref ? `${pitch.name} went to ${ref} on ${delivery.when}.` : null;
      }),
    ).filter((line): line is string => Boolean(line));
    return {
      effect: null,
      text: [
        lines.length ? lines.join(" ") : "No pitches have gone out yet.",
        `Each send is ${formatUsd(PITCH_SEND_USD)}. Listing a strategy is free.`,
        "Upload a strategy if you want another listing, or draft the next pitch and confirm the household.",
      ].join("\n\n"),
    };
  }
  return {
    effect: null,
    text: "I can show which anonymized households fit, what pitches went out, upload a strategy PDF into review, or draft a New York pitch for you to confirm. Listing is free. Sending a pitch is a separate charge.",
  };
}

import { formatUsd } from "../../shared/format.ts";
import { STRATEGY_UNIVERSE } from "../../shared/strategies.ts";
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

export type QualityFlag = "pass" | "reconcile-fail";

export interface StrategyProfileDraft {
  id: string;
  name: string;
  objective: string;
  assetClass: string;
  risk: string;
  minAum: number;
  feeBps: number;
  holdingsSummary: string;
  esgFlags: string;
  style: string;
  benchmark: string;
  liquidity: string;
  sourceFile: string | null;
  qualityFlag: QualityFlag;
}

export interface DeskRecommendation {
  id: string;
  title: string;
  detail: string;
  patch: Partial<Pick<StrategyProfileDraft, "objective" | "minAum" | "feeBps" | "esgFlags" | "holdingsSummary">>;
}

export type ListingStatus = "editing" | "recommendations" | "under-review" | "posted" | "human-review";

export interface OwnedStrategy {
  id: string;
  draft: StrategyProfileDraft;
  status: ListingStatus;
  recommendations: DeskRecommendation[];
  decisions: Record<string, "accept" | "decline">;
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
  minimum: number;
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

export function fittingClients(rows: readonly AnonClient[]): AnonClient[] {
  return rows.filter((row) => row.withFirm != null || row.householdAum >= 25_000_000);
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

const CLEAN_PROFILE: Omit<StrategyProfileDraft, "id" | "sourceFile"> = {
  name: "Tax-Aware US Equity",
  objective: "Harvest losses in a large-cap US equity sleeve without drifting from the household benchmark.",
  assetClass: "Equity",
  risk: "Moderate",
  minAum: 10_000_000,
  feeBps: 32,
  holdingsSummary:
    "S&P 500 names with a 2% single-name cap. Cash stays under 3%. No individual municipal bonds in this sleeve.",
  esgFlags: "Excludes thermal coal and civilian firearms.",
  style: "Tax-aware core",
  benchmark: "S&P 500",
  liquidity: "Daily",
  qualityFlag: "pass",
};

const RECONCILE_PROFILE: Omit<StrategyProfileDraft, "id" | "sourceFile"> = {
  name: "Opportunistic Credit",
  objective: "Reach for yield in a mixed credit book.",
  assetClass: "Fixed income",
  risk: "Aggressive",
  minAum: 5_000_000,
  feeBps: 95,
  holdingsSummary: "See spreadsheet.",
  esgFlags: "None stated",
  style: "Credit",
  benchmark: "Bloomberg US Aggregate",
  liquidity: "Monthly",
  qualityFlag: "reconcile-fail",
};

/** Demo parse: filename selects a fixture. No document model runs. */
export function parseStrategyFile(filename: string): StrategyProfileDraft {
  const base = filename.split(/[/\\]/).pop() ?? filename;
  const lower = base.toLowerCase();
  const id = `parsed-${slug(base) || "upload"}`;
  if (lower.includes("unreconciled") || lower.includes("reconcile")) {
    return { ...RECONCILE_PROFILE, id, sourceFile: base };
  }
  if (lower.includes("tax-aware") || lower.includes("tax aware") || lower.includes("gsam")) {
    return { ...CLEAN_PROFILE, id, sourceFile: base };
  }
  return {
    id,
    name: titleFromFile(base),
    objective: `Pursue the mandate described in ${base}.`,
    assetClass: "Multi-asset",
    risk: "Moderate",
    minAum: 5_000_000,
    feeBps: 45,
    holdingsSummary: `Holdings were read from ${base}. Weights and names are summarized here for a manager to confirm.`,
    esgFlags: "Not stated",
    style: "Core",
    benchmark: "To be confirmed",
    liquidity: "Daily",
    sourceFile: base,
    qualityFlag: "pass",
  };
}

export function recommendationsFor(draft: StrategyProfileDraft): DeskRecommendation[] {
  const objective = draft.objective.trim().replace(/\s+/g, " ");
  const clipped = objective.length > 160 ? `${objective.slice(0, 157).trim()}…` : objective;
  const namesBenchmark =
    draft.benchmark &&
    draft.benchmark !== "To be confirmed" &&
    !clipped.toLowerCase().includes(draft.benchmark.toLowerCase());
  const tightened = namesBenchmark ? `${clipped.replace(/\.$/, "")}. Benchmark ${draft.benchmark}.` : clipped;
  const esg = /not stated|^none\b/i.test(draft.esgFlags) ? "No ESG screen on this listing." : draft.esgFlags.trim();
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
      id: "esg",
      title: "State the ESG position",
      detail: "Say what is screened, or say that nothing is.",
      patch: { esgFlags: esg },
    },
  ];
}

export function recommendationPreview(rec: DeskRecommendation): string {
  if (rec.patch.objective) return rec.patch.objective;
  if (rec.patch.esgFlags) return rec.patch.esgFlags;
  if (rec.patch.holdingsSummary) return rec.patch.holdingsSummary;
  if (rec.patch.feeBps != null) return `${rec.patch.feeBps} bps`;
  if (rec.patch.minAum != null) return formatUsd(rec.patch.minAum, true);
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
 * Reconcile failures and thin or implausible profiles go to a person.
 */
export function listingDecision(draft: StrategyProfileDraft): "posted" | "human-review" {
  if (draft.qualityFlag === "reconcile-fail") return "human-review";
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
    objective: "",
    assetClass: "Equity",
    risk: "Moderate",
    minAum: 10_000_000,
    feeBps: 35,
    holdingsSummary: "",
    esgFlags: "Not stated",
    style: "Core",
    benchmark: "S&P 500",
    liquidity: "Daily",
    sourceFile: null,
    qualityFlag: "pass",
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
    objective: "Harvest losses around a large-cap US equity book without leaving the S&P 500 band.",
    assetClass: "Equity",
    risk: "Moderate",
    minAum: 10_000_000,
    feeBps: 30,
    holdingsSummary: "S&P 500 constituents, a 2% single-name cap, and cash under 3%. No municipal bonds in this sleeve.",
    esgFlags: "Excludes thermal coal and civilian firearms.",
    style: "Tax-aware core",
    benchmark: "S&P 500",
    liquidity: "Daily",
    sourceFile: null,
    qualityFlag: "pass",
  },
};

export function seedStrategies(): OwnedStrategy[] {
  return [POSTED_SEED];
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
      solution: "Run the tax-aware SMA on the account already held at this firm, and leave the rest of the household untouched.",
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
  const near = fittingClients(book).length;
  const here = book.filter((row) => row.withFirm != null).length;
  const sent = pitches.reduce((sum, pitch) => sum + pitch.sent.length, 0);
  const household = near === 1 ? "household sits" : "households sit";
  const pitchWord = sent === 1 ? "pitch has" : "pitches have";
  return `${near} ${household} near this book, and ${here} already keep an account here. ${sent} ${pitchWord} gone out.`;
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
      const overlap = row.withFirm != null ? " Part of this household is already with this firm." : "";
      return `${row.ref} · age ${row.age} · ${formatLocation(row)} · ${formatUsd(row.householdAum, true)}.${overlap}`;
    });
    return {
      effect: null,
      text: [
        `${rows.length} anonymized households sit near this book. Names stay off this desk.`,
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

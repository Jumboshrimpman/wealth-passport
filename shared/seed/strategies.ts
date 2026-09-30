import { UMA_LISTINGS, type UmaListing } from "./umaListings.ts";

/**
 * Client and institutional strategy catalog.
 * Names, managers, styles, minimums, and inception dates come from the public
 * Select UMA manager-profile index. Summaries, risk bands, and ESG flags are
 * demo copy inferred from those fields.
 */
export type BenchmarkKind = "single" | "blended";

export type TaxPostureFlag = "tax-sensitive" | "tax-aware" | "direct-indexing";

/** Illustrative fixed-income characteristics. Null fields were not set for this demo row. */
export interface FixedIncomeStats {
  avgMaturityYears: number | null;
  avgDurationYears: number | null;
  avgCouponPct: number | null;
  avgYieldPct: number | null;
}

export interface StrategyProfile {
  id: string;
  name: string;
  category: string;
  style: string;
  manager: string;
  /**
   * Strategy minimum in dollars, from the public profile header.
   * Null when that header did not list one.
   */
  minimum: number | null;
  /** Household minimum when the demo treats it as distinct from the strategy minimum. */
  householdMinimum: number | null;
  /** Account minimum when the demo treats it as distinct from the strategy minimum. */
  accountMinimum: number | null;
  /** All-in management fee in bps when the strategy is priced that way. */
  allInBps: number | null;
  /** Price line when the strategy is not an all-in bps fee. */
  feeLabel: string | null;
  summary: string;
  risk: string;
  /** Tagged for an environmental, social, or values screen. */
  esg: boolean;
  inception: string | null;
  productCode: string | null;
  /** Illustrative. True when the mandate can hold American depositary receipts. */
  usesAdrs: boolean;
  /** Present for fixed income. Other sleeves leave this null. */
  fixedIncome: FixedIncomeStats | null;
  /** Annual turnover, percent. Illustrative. */
  turnoverPct: number | null;
  /** Low end of the number of securities. Illustrative. */
  securitiesMin: number | null;
  /** High end of the number of securities. Illustrative. */
  securitiesMax: number | null;
  /** Benchmark name. Illustrative demo copy, not a published factsheet line. */
  benchmark: string | null;
  benchmarkKind: BenchmarkKind | null;
  /**
   * True when fund-level expenses can sit on top of the wrap or management fee.
   * Demo flag, not a fee schedule.
   */
  additionalFundFees: boolean;
  /** Optional manager sentence shown with the standard fund-fee note. */
  additionalFeesNote: string | null;
  taxPosture: TaxPostureFlag[];
}

function inferStyle(name: string): string {
  const text = name.toLowerCase();
  if (/muni|tax[- ]exempt|tax[- ]free/.test(text)) return "US Tax Free Core";
  if (/bond|fixed|credit|aggregate|duration/.test(text)) return "US Taxable Core";
  if (/small/.test(text)) return "US Small Cap";
  if (/mid/.test(text)) return "US Mid Cap";
  if (/international|global|emerging|adr/.test(text)) return "Global Equities";
  if (/value/.test(text)) return "US Large Cap Value";
  if (/growth/.test(text)) return "US Large Cap Growth";
  if (/equity|dividend|stock/.test(text)) return "US Large Cap";
  return "Global Multi Asset";
}

export function categoryFor(style: string, name: string): string {
  const blob = `${style} ${name}`.toLowerCase();
  if (/real estate|reit|commodit|infrastructure|mlp/.test(blob)) return "Real assets";
  if (/multi asset|multi-strategy|event driven/.test(blob)) return "Multi-asset";
  if (/fixed|muni|tax free|taxable|yield|govt|preferred|inflation|bond|credit/.test(blob)) return "Fixed income";
  if (/equit|cap|stock|dividend/.test(blob)) return "Equity";
  return "Multi-asset";
}

export function riskBand(style: string, name: string): string {
  const blob = `${style} ${name}`.toLowerCase();
  if (/ultra-short|short term|wealth conservation|high quality/.test(blob)) return "Conservative";
  if (/small cap|emerging|high yield|event driven|mlp|concentrated|disrupt/.test(blob)) return "Aggressive";
  if (/growth|equit|reit|infrastructure|commodit/.test(blob)) return "Growth";
  return "Moderate";
}

function esgListed(style: string, name: string): boolean {
  return /esg|sustain|responsible|gender lens|impact|catholic|climate|fossil|socially|environmental/.test(
    `${style} ${name}`.toLowerCase(),
  );
}

function summaryFor(name: string, style: string, category: string, esg: boolean): string {
  const role =
    category === "Fixed income"
      ? "bond sleeve"
      : category === "Real assets"
        ? "real-asset sleeve"
        : category === "Multi-asset"
          ? "multi-asset sleeve"
          : "equity sleeve";
  const screen = esg ? " Sustainability is part of the mandate." : "";
  return `${name} is a ${style.toLowerCase()} ${role}. A household can set exclusions, tax treatment, and how tightly the account follows its benchmark.${screen}`;
}

/**
 * Stable demo all-in fee. The public profile index does not publish bps, and
 * search still needs a fee range. This is not a manager's schedule.
 */
export function illustrativeFeeBps(id: string, category: string): number {
  let hash = 2166136261;
  for (let index = 0; index < id.length; index += 1) {
    hash ^= id.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  const span =
    category === "Fixed income"
      ? [10, 40]
      : category === "Equity"
        ? [15, 70]
        : category === "Real assets"
          ? [35, 90]
          : [20, 75];
  const [min, max] = span;
  const steps = Math.floor((max - min) / 5);
  return min + (Math.abs(hash) % (steps + 1)) * 5;
}

function demoHash(id: string, salt: string): number {
  let hash = 2166136261;
  const text = `${salt}:${id}`;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}

function decodeEntities(value: string): string {
  return value.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

function roundMoney(value: number): number {
  if (value >= 1_000_000) return Math.round(value / 250_000) * 250_000;
  if (value >= 100_000) return Math.round(value / 25_000) * 25_000;
  return Math.round(value / 5_000) * 5_000;
}

function distinctMinimums(
  id: string,
  minimum: number | null,
): { householdMinimum: number | null; accountMinimum: number | null } {
  if (minimum == null) return { householdMinimum: null, accountMinimum: null };
  const hash = demoHash(id, "min");
  let householdMinimum: number | null = null;
  let accountMinimum: number | null = null;
  if (hash % 3 === 0) {
    const steps = [250_000, 500_000, 1_000_000, 5_000_000, 10_000_000, 25_000_000];
    const above = steps.find((step) => step > minimum) ?? null;
    if (above != null && above !== minimum) householdMinimum = above;
  }
  if (hash % 5 === 1 && minimum >= 25_000) {
    const steps = [10_000, 25_000, 50_000, 100_000, 250_000, 500_000, 1_000_000];
    const below = [...steps].reverse().find((step) => step < minimum) ?? null;
    if (below != null) accountMinimum = roundMoney(below);
  }
  return { householdMinimum, accountMinimum };
}

function usesAdrs(name: string, style: string, category: string): boolean {
  const blob = `${name} ${style}`.toLowerCase();
  if (/\badr\b/.test(blob)) return true;
  if (category === "Fixed income") return false;
  return /international|global|emerging|eafe|world|ex-us|ex u\.s|foreign|developed/.test(blob);
}

function maturityYears(name: string, hash: number): number {
  const text = name.toLowerCase();
  if (/1-3|ultra-short|short term|short-term/.test(text)) return 2.2;
  if (/1-5|2-8/.test(text)) return 4;
  if (/1-10|5-10|intermediate/.test(text)) return 6.4;
  if (/1-15|5-15/.test(text)) return 8.8;
  if (/1-20|long/.test(text)) return 12.5;
  const choices = [2.4, 3.6, 5.1, 7.2, 9.4, 14];
  return choices[hash % choices.length];
}

function fixedIncomeStats(name: string, category: string, id: string): FixedIncomeStats | null {
  if (category !== "Fixed income") return null;
  const hash = demoHash(id, "fi");
  const avgMaturityYears = maturityYears(name, hash);
  const avgDurationYears = Math.round(avgMaturityYears * 0.78 * 10) / 10;
  const coupons = [2.4, 3.1, 3.8, 4.5, 5.2, 5.8];
  const avgCouponPct = coupons[hash % coupons.length];
  const yields = [2.2, 3.4, 4.1, 4.8, 5.6, 6.1];
  return {
    avgMaturityYears,
    avgDurationYears,
    avgCouponPct,
    avgYieldPct: yields[(hash + 2) % yields.length],
  };
}

function turnoverPctFor(id: string): number {
  const choices = [8, 15, 22, 35, 48, 65, 80];
  return choices[demoHash(id, "turn") % choices.length];
}

function securitiesRange(id: string): { securitiesMin: number; securitiesMax: number } {
  const bands: Array<[number, number]> = [
    [15, 30],
    [25, 40],
    [40, 80],
    [50, 100],
    [80, 150],
    [120, 200],
  ];
  const [securitiesMin, securitiesMax] = bands[demoHash(id, "count") % bands.length];
  return { securitiesMin, securitiesMax };
}

function benchmarkFor(
  name: string,
  style: string,
  category: string,
  id: string,
): { benchmark: string; benchmarkKind: BenchmarkKind } {
  const blob = `${name} ${style}`.toLowerCase();
  const hash = demoHash(id, "bench");
  if (category === "Multi-asset" || /balanced|60\/40|allocation/.test(blob)) {
    return { benchmark: "60/40 S&P 500 / Bloomberg US Aggregate", benchmarkKind: "blended" };
  }
  if (/muni|tax free|tax-free|tax exempt|tax-exempt/.test(blob)) {
    if (hash % 5 === 0) return { benchmark: "Bloomberg Municipal / 1-10 Year Blend", benchmarkKind: "blended" };
    return { benchmark: "Bloomberg Municipal Index", benchmarkKind: "single" };
  }
  if (category === "Fixed income") return { benchmark: "Bloomberg US Aggregate", benchmarkKind: "single" };
  if (/small/.test(blob)) return { benchmark: "Russell 2000", benchmarkKind: "single" };
  if (/mid/.test(blob)) return { benchmark: "Russell Midcap", benchmarkKind: "single" };
  if (/growth/.test(blob) && /u\.s|us /.test(` ${blob} `)) {
    return { benchmark: "Russell 1000 Growth", benchmarkKind: "single" };
  }
  if (/value/.test(blob)) return { benchmark: "Russell 1000 Value", benchmarkKind: "single" };
  if (/international|eafe|adr|ex-us|ex u/.test(blob)) return { benchmark: "MSCI EAFE", benchmarkKind: "single" };
  if (/global|emerging|world/.test(blob)) {
    if (hash % 3 === 0) return { benchmark: "MSCI ACWI / Bloomberg Global Aggregate", benchmarkKind: "blended" };
    return { benchmark: "MSCI ACWI", benchmarkKind: "single" };
  }
  if (hash % 8 === 0) return { benchmark: "70/30 Russell 1000 / Bloomberg US Aggregate", benchmarkKind: "blended" };
  return { benchmark: "S&P 500", benchmarkKind: "single" };
}

function taxPostureFor(name: string, style: string): TaxPostureFlag[] {
  const blob = `${name} ${style}`.toLowerCase();
  const flags: TaxPostureFlag[] = [];
  if (/direct index|indexing|aperio|parametric/.test(blob)) flags.push("direct-indexing");
  if (/tax[- ]aware|active tax/.test(blob)) flags.push("tax-aware");
  if (/tax[- ]sensitive|tax[- ]exempt|tax[- ]free|muni/.test(blob)) flags.push("tax-sensitive");
  return flags;
}

function additionalFundFeesFor(name: string, style: string, id: string): boolean {
  if (/mutual fund|\bfunds\b|\betf\b|\bmaps\b|american funds|vanguard/.test(`${name} ${style}`.toLowerCase())) {
    return true;
  }
  return demoHash(id, "fee") % 8 === 0;
}

function profileFromListing(row: UmaListing): StrategyProfile {
  const name = decodeEntities(row.name);
  const style = row.style ?? inferStyle(name);
  const category = categoryFor(style, name);
  const esg = esgListed(style, name);
  const { householdMinimum, accountMinimum } = distinctMinimums(row.id, row.minimum);
  const range = securitiesRange(row.id);
  const benchmark = benchmarkFor(name, style, category, row.id);
  return {
    id: row.id,
    name,
    category,
    style,
    manager: decodeEntities(row.manager),
    minimum: row.minimum,
    householdMinimum,
    accountMinimum,
    allInBps: illustrativeFeeBps(row.id, category),
    feeLabel: null,
    summary: summaryFor(name, style, category, esg),
    risk: riskBand(style, name),
    esg,
    inception: row.inception,
    productCode: row.code,
    usesAdrs: usesAdrs(name, style, category),
    fixedIncome: fixedIncomeStats(name, category, row.id),
    turnoverPct: turnoverPctFor(row.id),
    securitiesMin: range.securitiesMin,
    securitiesMax: range.securitiesMax,
    benchmark: benchmark.benchmark,
    benchmarkKind: benchmark.benchmarkKind,
    additionalFundFees: additionalFundFeesFor(name, style, row.id),
    additionalFeesNote: null,
    taxPosture: taxPostureFor(name, style),
  };
}

export const STRATEGY_UNIVERSE: StrategyProfile[] = UMA_LISTINGS.map(profileFromListing);

{
  const ids = STRATEGY_UNIVERSE.map((row) => row.id);
  if (new Set(ids).size !== ids.length) {
    throw new Error("STRATEGY DATA FAILURE: strategy ids must be unique.");
  }
}

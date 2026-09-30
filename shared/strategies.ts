import type { BenchmarkKind, StrategyProfile, TaxPostureFlag } from "./seed/strategies.ts";
import { illustrativeFeeBps, STRATEGY_UNIVERSE } from "./seed/strategies.ts";

export type { BenchmarkKind, StrategyProfile, TaxPostureFlag };
export { illustrativeFeeBps, STRATEGY_UNIVERSE };

export const CATALOG_SOURCE_NOTE =
  "Manager, style, strategy minimum, and figures taken from a public profile header follow the Morgan Stanley Select UMA manager-profile index. Fees, household minimums, and any figure not on that header are illustrative demo copy. This is not an official Morgan Stanley product.";

export const ADDITIONAL_FUND_FEE_NOTE =
  "Strategies that hold mutual funds can incur fund-level expenses in addition to the wrap or management fee, including inside a wrap-fee program. This is demo copy, not a fee schedule or legal advice.";

export const TAX_POSTURE_OPTIONS: { id: TaxPostureFlag; label: string }[] = [
  { id: "tax-sensitive", label: "Tax sensitive" },
  { id: "tax-aware", label: "Tax aware" },
  { id: "direct-indexing", label: "Direct indexing" },
];

export const ELIGIBLE_FILTER_LABEL = "Eligible for me";
export const ESG_FILTER_LABEL = "ESG";

export const FEE_RANGE_OPTIONS = [
  { id: "", label: "Any fee" },
  { id: "under-25", label: "Under 25 bps" },
  { id: "25-40", label: "25–40 bps" },
  { id: "40-75", label: "41–75 bps" },
  { id: "over-75", label: "Over 75 bps" },
  { id: "unlisted", label: "Fee not listed" },
] as const;

export type FeeRangeId = (typeof FEE_RANGE_OPTIONS)[number]["id"];

export const MINIMUM_BAND_OPTIONS = [
  { id: "", label: "Any minimum" },
  { id: "under-100k", label: "Minimum under $100k" },
  { id: "100k-1m", label: "Minimum $100k–$1M" },
  { id: "1m-plus", label: "Minimum $1M and over" },
  { id: "unlisted", label: "Minimum not listed" },
] as const;

export type MinimumBandId = (typeof MINIMUM_BAND_OPTIONS)[number]["id"];

export const HOUSEHOLD_MINIMUM_BAND_OPTIONS = [
  { id: "", label: "Any household minimum" },
  { id: "under-100k", label: "Household minimum under $100k" },
  { id: "100k-1m", label: "Household minimum $100k–$1M" },
  { id: "1m-plus", label: "Household minimum $1M and over" },
  { id: "unlisted", label: "Household minimum not distinct" },
] as const;

export type HouseholdMinimumBandId = (typeof HOUSEHOLD_MINIMUM_BAND_OPTIONS)[number]["id"];

export const ADR_OPTIONS = [
  { id: "", label: "Any ADR use" },
  { id: "yes", label: "Uses ADRs" },
  { id: "no", label: "No ADRs" },
] as const;

export type AdrFilterId = (typeof ADR_OPTIONS)[number]["id"];

export const MATURITY_BAND_OPTIONS = [
  { id: "", label: "Any avg maturity" },
  { id: "under-3", label: "Avg maturity under 3 years" },
  { id: "3-7", label: "Avg maturity 3–7 years" },
  { id: "over-7", label: "Avg maturity over 7 years" },
] as const;

export const DURATION_BAND_OPTIONS = [
  { id: "", label: "Any avg duration" },
  { id: "under-3", label: "Avg duration under 3 years" },
  { id: "3-7", label: "Avg duration 3–7 years" },
  { id: "over-7", label: "Avg duration over 7 years" },
] as const;

export const COUPON_BAND_OPTIONS = [
  { id: "", label: "Any avg coupon" },
  { id: "under-3", label: "Avg coupon under 3%" },
  { id: "3-5", label: "Avg coupon 3–5%" },
  { id: "over-5", label: "Avg coupon over 5%" },
] as const;

export const YIELD_BAND_OPTIONS = [
  { id: "", label: "Any avg yield" },
  { id: "under-3", label: "Avg yield under 3%" },
  { id: "3-5", label: "Avg yield 3–5%" },
  { id: "over-5", label: "Avg yield over 5%" },
] as const;

export const TURNOVER_BAND_OPTIONS = [
  { id: "", label: "Any turnover" },
  { id: "under-20", label: "Turnover under 20%" },
  { id: "20-50", label: "Turnover 20–50%" },
  { id: "over-50", label: "Turnover over 50%" },
] as const;

export const SECURITIES_BAND_OPTIONS = [
  { id: "", label: "Any securities range" },
  { id: "under-40", label: "Under 40 securities" },
  { id: "40-100", label: "40–100 securities" },
  { id: "over-100", label: "Over 100 securities" },
] as const;

export type StatBandId = "" | "under-3" | "3-7" | "over-7" | "3-5" | "over-5" | "under-20" | "20-50" | "over-50" | "under-40" | "40-100" | "over-100";

export const BENCHMARK_KIND_OPTIONS = [
  { id: "", label: "Any benchmark" },
  { id: "single", label: "Single benchmark" },
  { id: "blended", label: "Blended benchmark" },
] as const;

export type BenchmarkKindFilterId = (typeof BENCHMARK_KIND_OPTIONS)[number]["id"];

export const FUND_FEE_OPTIONS = [
  { id: "", label: "Any underlying fees" },
  { id: "yes", label: "Underlying fund fees" },
  { id: "no", label: "No underlying fund fees" },
] as const;

export type FundFeeFilterId = (typeof FUND_FEE_OPTIONS)[number]["id"];

export const TAX_FILTER_OPTIONS = [
  { id: "", label: "Any tax posture" },
  ...TAX_POSTURE_OPTIONS.map((option) => ({ id: option.id, label: option.label })),
] as const;

export type TaxFilterId = "" | TaxPostureFlag;

export function strategyFeeLine(strategy: StrategyProfile): string {
  if (strategy.allInBps != null) return `all-in ${strategy.allInBps} bps`;
  return strategy.feeLabel ?? "";
}

/** A household qualifies when investable assets already meet the strategy minimum. */
export function meetsStrategyMinimum(strategy: StrategyProfile, investable: number): boolean {
  return strategy.minimum != null && Number.isFinite(investable) && investable >= strategy.minimum;
}

export function taxPostureLabel(flag: TaxPostureFlag): string {
  return TAX_POSTURE_OPTIONS.find((option) => option.id === flag)?.label ?? flag;
}

export function securitiesLine(strategy: { securitiesMin: number | null; securitiesMax: number | null }): string | null {
  if (strategy.securitiesMin == null || strategy.securitiesMax == null) return null;
  if (strategy.securitiesMin === strategy.securitiesMax) return `${strategy.securitiesMin}`;
  return `${strategy.securitiesMin}–${strategy.securitiesMax}`;
}

function strategySearchText(strategy: StrategyProfile): string {
  const parts = [
    strategy.name,
    strategy.category,
    strategy.style,
    strategy.manager,
    strategy.summary,
    strategy.risk,
    strategy.productCode ?? "",
    strategy.benchmark ?? "",
    strategy.benchmarkKind ?? "",
    ...strategy.taxPosture,
  ];
  if (strategy.esg) parts.push("ESG");
  if (strategy.usesAdrs) parts.push("ADR");
  if (strategy.additionalFundFees) parts.push("fund fee");
  return parts.join(" ");
}

export function searchStrategies(strategies: readonly StrategyProfile[], query: string): StrategyProfile[] {
  const needle = query.trim().toLowerCase();
  const rows = needle
    ? strategies.filter((strategy) => strategySearchText(strategy).toLowerCase().includes(needle))
    : [...strategies];
  return rows.sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
}

export function feeRangeBounds(range: FeeRangeId): { min: number | null; max: number | null; unlisted: boolean } {
  switch (range) {
    case "under-25":
      return { min: null, max: 24, unlisted: false };
    case "25-40":
      return { min: 25, max: 40, unlisted: false };
    case "40-75":
      return { min: 41, max: 75, unlisted: false };
    case "over-75":
      return { min: 76, max: null, unlisted: false };
    case "unlisted":
      return { min: null, max: null, unlisted: true };
    default:
      return { min: null, max: null, unlisted: false };
  }
}

function matchesFeeRange(strategy: StrategyProfile, range: FeeRangeId): boolean {
  if (!range) return true;
  const bounds = feeRangeBounds(range);
  if (bounds.unlisted) return strategy.allInBps == null && !strategy.feeLabel;
  if (strategy.allInBps == null) return false;
  if (bounds.min != null && strategy.allInBps < bounds.min) return false;
  if (bounds.max != null && strategy.allInBps > bounds.max) return false;
  return true;
}

function matchesDollarBand(value: number | null, band: MinimumBandId | HouseholdMinimumBandId): boolean {
  if (!band) return true;
  if (band === "unlisted") return value == null;
  if (value == null) return false;
  if (band === "under-100k") return value < 100_000;
  if (band === "100k-1m") return value >= 100_000 && value < 1_000_000;
  return value >= 1_000_000;
}

function matchesMinimumBand(strategy: StrategyProfile, band: MinimumBandId): boolean {
  return matchesDollarBand(strategy.minimum, band);
}

function inSpan(value: number | null, min: number | null, max: number | null): boolean {
  if (value == null) return false;
  if (min != null && value < min) return false;
  if (max != null && value > max) return false;
  return true;
}

function matchesMaturity(strategy: StrategyProfile, band: string): boolean {
  if (!band) return true;
  const value = strategy.fixedIncome?.avgMaturityYears ?? null;
  if (band === "under-3") return inSpan(value, null, 2.99);
  if (band === "3-7") return inSpan(value, 3, 7);
  return inSpan(value, 7.01, null);
}

function matchesDuration(strategy: StrategyProfile, band: string): boolean {
  if (!band) return true;
  const value = strategy.fixedIncome?.avgDurationYears ?? null;
  if (band === "under-3") return inSpan(value, null, 2.99);
  if (band === "3-7") return inSpan(value, 3, 7);
  return inSpan(value, 7.01, null);
}

function matchesCoupon(strategy: StrategyProfile, band: string): boolean {
  if (!band) return true;
  const value = strategy.fixedIncome?.avgCouponPct ?? null;
  if (band === "under-3") return inSpan(value, null, 2.99);
  if (band === "3-5") return inSpan(value, 3, 5);
  return inSpan(value, 5.01, null);
}

function matchesYield(strategy: StrategyProfile, band: string): boolean {
  if (!band) return true;
  const value = strategy.fixedIncome?.avgYieldPct ?? null;
  if (band === "under-3") return inSpan(value, null, 2.99);
  if (band === "3-5") return inSpan(value, 3, 5);
  return inSpan(value, 5.01, null);
}

function matchesTurnover(strategy: StrategyProfile, band: string): boolean {
  if (!band) return true;
  const value = strategy.turnoverPct;
  if (band === "under-20") return inSpan(value, null, 19.99);
  if (band === "20-50") return inSpan(value, 20, 50);
  return inSpan(value, 50.01, null);
}

function matchesSecurities(strategy: StrategyProfile, band: string): boolean {
  if (!band) return true;
  const value = strategy.securitiesMin;
  if (band === "under-40") return inSpan(value, null, 39);
  if (band === "40-100") return inSpan(value, 40, 100);
  return inSpan(value, 101, null);
}

export interface StrategyBrowseOptions {
  query?: string;
  eligibleOnly?: boolean;
  esgOnly?: boolean;
  category?: string;
  risk?: string;
  feeRange?: FeeRangeId;
  minimumBand?: MinimumBandId;
  householdMinimumBand?: HouseholdMinimumBandId;
  manager?: string;
  adr?: AdrFilterId;
  maturityBand?: string;
  durationBand?: string;
  couponBand?: string;
  yieldBand?: string;
  turnoverBand?: string;
  securitiesBand?: string;
  benchmarkKind?: BenchmarkKindFilterId;
  benchmark?: string;
  fundFees?: FundFeeFilterId;
  taxPosture?: TaxFilterId;
}

export function browseStrategies(
  strategies: readonly StrategyProfile[],
  investable: number,
  options: StrategyBrowseOptions = {},
): StrategyProfile[] {
  let rows = searchStrategies(strategies, options.query ?? "");
  if (options.category) rows = rows.filter((strategy) => strategy.category === options.category);
  if (options.risk) rows = rows.filter((strategy) => strategy.risk === options.risk);
  if (options.feeRange) rows = rows.filter((strategy) => matchesFeeRange(strategy, options.feeRange ?? ""));
  if (options.minimumBand) rows = rows.filter((strategy) => matchesMinimumBand(strategy, options.minimumBand ?? ""));
  if (options.householdMinimumBand) {
    rows = rows.filter((strategy) => matchesDollarBand(strategy.householdMinimum, options.householdMinimumBand ?? ""));
  }
  if (options.manager) rows = rows.filter((strategy) => strategy.manager === options.manager);
  if (options.adr === "yes") rows = rows.filter((strategy) => strategy.usesAdrs);
  if (options.adr === "no") rows = rows.filter((strategy) => !strategy.usesAdrs);
  if (options.maturityBand) rows = rows.filter((strategy) => matchesMaturity(strategy, options.maturityBand ?? ""));
  if (options.durationBand) rows = rows.filter((strategy) => matchesDuration(strategy, options.durationBand ?? ""));
  if (options.couponBand) rows = rows.filter((strategy) => matchesCoupon(strategy, options.couponBand ?? ""));
  if (options.yieldBand) rows = rows.filter((strategy) => matchesYield(strategy, options.yieldBand ?? ""));
  if (options.turnoverBand) rows = rows.filter((strategy) => matchesTurnover(strategy, options.turnoverBand ?? ""));
  if (options.securitiesBand) rows = rows.filter((strategy) => matchesSecurities(strategy, options.securitiesBand ?? ""));
  if (options.benchmarkKind) rows = rows.filter((strategy) => strategy.benchmarkKind === options.benchmarkKind);
  if (options.benchmark) rows = rows.filter((strategy) => strategy.benchmark === options.benchmark);
  if (options.fundFees === "yes") rows = rows.filter((strategy) => strategy.additionalFundFees);
  if (options.fundFees === "no") rows = rows.filter((strategy) => !strategy.additionalFundFees);
  if (options.taxPosture) rows = rows.filter((strategy) => strategy.taxPosture.includes(options.taxPosture as TaxPostureFlag));
  if (options.esgOnly) rows = rows.filter((strategy) => strategy.esg === true);
  if (!options.eligibleOnly) return rows;
  return rows.filter((strategy) => meetsStrategyMinimum(strategy, investable));
}

export function strategyCategories(strategies: readonly StrategyProfile[]): string[] {
  return [...new Set(strategies.map((strategy) => strategy.category))].sort((a, b) => a.localeCompare(b));
}

export function strategyRisks(strategies: readonly StrategyProfile[]): string[] {
  return [...new Set(strategies.map((strategy) => strategy.risk))].sort((a, b) => a.localeCompare(b));
}

export function strategyManagers(strategies: readonly StrategyProfile[]): string[] {
  return [...new Set(strategies.map((strategy) => strategy.manager))].sort((a, b) => a.localeCompare(b));
}

export function strategyBenchmarks(strategies: readonly StrategyProfile[]): string[] {
  return [...new Set(strategies.map((strategy) => strategy.benchmark).filter((name): name is string => Boolean(name)))].sort(
    (a, b) => a.localeCompare(b),
  );
}

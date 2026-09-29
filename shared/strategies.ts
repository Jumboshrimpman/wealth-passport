import type { StrategyProfile } from "./seed/strategies.ts";
import { illustrativeFeeBps, STRATEGY_UNIVERSE } from "./seed/strategies.ts";

export type { StrategyProfile };
export { illustrativeFeeBps, STRATEGY_UNIVERSE };

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

export function strategyFeeLine(strategy: StrategyProfile): string {
  if (strategy.allInBps != null) return `all-in ${strategy.allInBps} bps`;
  return strategy.feeLabel ?? "";
}

/** A household qualifies when investable assets already meet the strategy minimum. */
export function meetsStrategyMinimum(strategy: StrategyProfile, investable: number): boolean {
  return strategy.minimum != null && Number.isFinite(investable) && investable >= strategy.minimum;
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
  ];
  if (strategy.esg) parts.push("ESG");
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

function matchesMinimumBand(strategy: StrategyProfile, band: MinimumBandId): boolean {
  if (!band) return true;
  if (band === "unlisted") return strategy.minimum == null;
  if (strategy.minimum == null) return false;
  if (band === "under-100k") return strategy.minimum < 100_000;
  if (band === "100k-1m") return strategy.minimum >= 100_000 && strategy.minimum < 1_000_000;
  return strategy.minimum >= 1_000_000;
}

export function browseStrategies(
  strategies: readonly StrategyProfile[],
  investable: number,
  options: {
    query?: string;
    eligibleOnly?: boolean;
    esgOnly?: boolean;
    category?: string;
    risk?: string;
    feeRange?: FeeRangeId;
    minimumBand?: MinimumBandId;
  } = {},
): StrategyProfile[] {
  let rows = searchStrategies(strategies, options.query ?? "");
  if (options.category) rows = rows.filter((strategy) => strategy.category === options.category);
  if (options.risk) rows = rows.filter((strategy) => strategy.risk === options.risk);
  if (options.feeRange) rows = rows.filter((strategy) => matchesFeeRange(strategy, options.feeRange ?? ""));
  if (options.minimumBand) rows = rows.filter((strategy) => matchesMinimumBand(strategy, options.minimumBand ?? ""));
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

import type { StrategyProfile } from "./seed/strategies.ts";
import { STRATEGY_UNIVERSE } from "./seed/strategies.ts";

export type { StrategyProfile };
export { STRATEGY_UNIVERSE };

export const ELIGIBLE_FILTER_LABEL = "Eligible for me";
export const ESG_FILTER_LABEL = "ESG";

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

export function browseStrategies(
  strategies: readonly StrategyProfile[],
  investable: number,
  options: { query?: string; eligibleOnly?: boolean; esgOnly?: boolean; category?: string } = {},
): StrategyProfile[] {
  let rows = searchStrategies(strategies, options.query ?? "");
  if (options.category) rows = rows.filter((strategy) => strategy.category === options.category);
  if (options.esgOnly) rows = rows.filter((strategy) => strategy.esg === true);
  if (!options.eligibleOnly) return rows;
  return rows.filter((strategy) => meetsStrategyMinimum(strategy, investable));
}

export function strategyCategories(strategies: readonly StrategyProfile[]): string[] {
  return [...new Set(strategies.map((strategy) => strategy.category))].sort((a, b) => a.localeCompare(b));
}

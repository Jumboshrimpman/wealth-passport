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
  return Number.isFinite(investable) && investable >= strategy.minimum;
}

function strategySearchText(strategy: StrategyProfile): string {
  const parts = [strategy.name, strategy.category, strategy.style, strategy.manager, strategy.summary];
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
  options: { query?: string; eligibleOnly?: boolean; esgOnly?: boolean } = {},
): StrategyProfile[] {
  const searched = searchStrategies(strategies, options.query ?? "");
  return searched.filter((strategy) => {
    if (options.eligibleOnly && !meetsStrategyMinimum(strategy, investable)) return false;
    if (options.esgOnly && strategy.esg !== true) return false;
    return true;
  });
}

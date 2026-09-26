import type { StrategyProfile } from "./seed/strategies.ts";
import { STRATEGY_UNIVERSE } from "./seed/strategies.ts";

export type { StrategyProfile };
export { STRATEGY_UNIVERSE };

export const ELIGIBLE_FILTER_LABEL = "Eligible for me";

export function strategyFeeLine(strategy: StrategyProfile): string {
  if (strategy.allInBps != null) return `all-in ${strategy.allInBps} bps`;
  return strategy.feeLabel ?? "";
}

/** A household qualifies when investable assets already meet the strategy minimum. */
export function meetsStrategyMinimum(strategy: StrategyProfile, investable: number): boolean {
  return Number.isFinite(investable) && investable >= strategy.minimum;
}

export function searchStrategies(strategies: readonly StrategyProfile[], query: string): StrategyProfile[] {
  const needle = query.trim().toLowerCase();
  const rows = needle
    ? strategies.filter((strategy) =>
        [strategy.name, strategy.category, strategy.style, strategy.manager, strategy.summary]
          .join(" ")
          .toLowerCase()
          .includes(needle),
      )
    : [...strategies];
  return rows.sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
}

export function browseStrategies(
  strategies: readonly StrategyProfile[],
  investable: number,
  options: { query?: string; eligibleOnly?: boolean } = {},
): StrategyProfile[] {
  const searched = searchStrategies(strategies, options.query ?? "");
  if (!options.eligibleOnly) return searched;
  return searched.filter((strategy) => meetsStrategyMinimum(strategy, investable));
}

import { formatPct, formatUsd } from "./format.ts";
import type { ClientRecord } from "./types.ts";

export type InsightKind = "concentration" | "liquidity" | "rollover";
export type InsightSeverity = "info" | "watch";

export interface HouseholdInsight {
  kind: InsightKind;
  severity: InsightSeverity;
  title: string;
  detail: string;
}

/** Flag a single name once it is 5% or more of the custodied book. */
export const CONCENTRATION_THRESHOLD = 0.05;

/** Annual spending assumed when converting liquidity into a runway (4% rule). */
export const SPENDING_RATE = 0.04;

/**
 * Intelligence computed from the stored record — concentration, cash runway,
 * and rollover candidates. None of this is advice; it is a reading of the book.
 */
export function householdInsights(record: ClientRecord): HouseholdInsight[] {
  const insights: HouseholdInsight[] = [];
  const book = record.household.accountValue;

  if (book > 0) {
    const ranked = [...record.holdings].sort((a, b) => b.value - a.value);
    for (const holding of ranked) {
      const weight = holding.value / book;
      if (weight < CONCENTRATION_THRESHOLD) continue;
      const account = record.accounts.find((item) => item.id === holding.accountId);
      insights.push({
        kind: "concentration",
        severity: weight >= 0.1 ? "watch" : "info",
        title: `${holding.ticker} is ${formatPct(weight)} of the custodied book`,
        detail: `${holding.name} (${formatUsd(holding.value, true)}) sits in ${
          account ? `${account.name} · ${account.custodian}` : "an unnamed sleeve"
        }. Names above ${formatPct(CONCENTRATION_THRESHOLD)} of the book are flagged.`,
      });
    }
  }

  const monthlySpend = (record.household.investable * SPENDING_RATE) / 12;
  if (monthlySpend > 0) {
    const months = Math.round(record.household.liquidity / monthlySpend);
    insights.push({
      kind: "liquidity",
      severity: months < 18 ? "watch" : "info",
      title: `Liquidity covers ${months} month${months === 1 ? "" : "s"} of a 4% spending rate`,
      detail: `${formatUsd(record.household.liquidity, true)} cash and short duration versus ${formatUsd(
        record.household.investable,
        true,
      )} investable — a 4% annual spending rate is ${formatUsd(monthlySpend, true)} per month.`,
    });
  }

  for (const account of record.accounts) {
    if (!/rollover/i.test(account.name) && !/rollover/i.test(account.type)) continue;
    insights.push({
      kind: "rollover",
      severity: "info",
      title: `${account.name} is a rollover candidate`,
      detail: `${formatUsd(account.balance, true)} at ${account.custodian}. The ops packet “${
        record.opsPacket.title
      }” reuses ${record.opsPacket.reused} of ${record.opsPacket.total} enrollment fields.`,
    });
  }

  return insights;
}

export interface CampaignCounters {
  institutionId: string;
  views: number;
  matches: number;
  impressions: number;
}

export interface CampaignRow extends CampaignCounters {
  name: string;
  kindLabel: string;
  accepts: number;
  declines: number;
  bookedRevenue: number;
  /** Annualized revenue per accepted placement; 0 when none accepted. */
  costPerAccept: number;
  /** Accepts / impressions; 0 when the desk has not been shown. */
  conversionRate: number;
}

export function emptyCounters(institutionId: string): CampaignCounters {
  return { institutionId, views: 0, matches: 0, impressions: 0 };
}

export function withFunnel(
  counters: CampaignCounters,
  meta: { name: string; kindLabel: string; accepts: number; declines: number; bookedRevenue: number },
): CampaignRow {
  return {
    ...counters,
    name: meta.name,
    kindLabel: meta.kindLabel,
    accepts: meta.accepts,
    declines: meta.declines,
    bookedRevenue: meta.bookedRevenue,
    costPerAccept: meta.accepts > 0 ? Math.round(meta.bookedRevenue / meta.accepts) : 0,
    conversionRate: counters.impressions > 0 ? meta.accepts / counters.impressions : 0,
  };
}

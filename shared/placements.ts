import type { ClientRecord, Institution } from "./types.ts";

export type PlacementStatus = "accepted" | "declined";

/**
 * A client's decision on a paid placement. Accepting books annualized revenue:
 * the institution's placement fee (bps) against the household's investable
 * assets at decision time.
 */
export interface Placement {
  /** Stable id: `${clientId}:${offerId}` — one row per client per offer. */
  id: string;
  clientId: string;
  clientName: string;
  offerId: string;
  institutionId: string;
  institutionName: string;
  strategy: string;
  status: PlacementStatus;
  placementFeeBps: number;
  matchedAssets: number;
  annualRevenue: number;
  decidedAt: string;
}

export function placementRevenue(matchedAssets: number, placementFeeBps: number): number {
  return Math.round((matchedAssets * placementFeeBps) / 10_000);
}

export function buildPlacement(
  record: ClientRecord,
  institution: Institution,
  status: PlacementStatus,
  now = new Date(),
): Placement {
  const matchedAssets = record.household.investable;
  return {
    id: `${record.id}:${institution.offer.id}`,
    clientId: record.id,
    clientName: record.household.name,
    offerId: institution.offer.id,
    institutionId: institution.id,
    institutionName: institution.name,
    strategy: institution.offer.strategy,
    status,
    placementFeeBps: institution.offer.placementFeeBps,
    matchedAssets,
    annualRevenue: placementRevenue(matchedAssets, institution.offer.placementFeeBps),
    decidedAt: now.toISOString(),
  };
}

export function acceptedPlacements(placements: Placement[]): Placement[] {
  return placements.filter((placement) => placement.status === "accepted");
}

export function placementRevenueTotal(placements: Placement[]): number {
  return acceptedPlacements(placements).reduce((sum, placement) => sum + placement.annualRevenue, 0);
}

/** Blended placement fee across accepted placements, in bps. */
export function blendedFeeBps(placements: Placement[]): number {
  const accepted = acceptedPlacements(placements);
  const assets = accepted.reduce((sum, placement) => sum + placement.matchedAssets, 0);
  if (assets === 0) return 0;
  const revenue = accepted.reduce((sum, placement) => sum + placement.annualRevenue, 0);
  return Math.round((revenue / assets) * 10_000 * 10) / 10;
}

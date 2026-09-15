import {
  buildPlacement,
  type Placement,
  type PlacementStatus,
} from "../../shared/placements.ts";
import { SEEDED_PASSPORTS, seedById } from "../../shared/seed/index.ts";
import { INSTITUTION_SEEDS } from "../../shared/seed/institutions.ts";
import type { ClientDataSource } from "./clients";

const DECISION_KEY_PREFIX = "wealthpass-offer-decisions";

function decisionKey(clientId: string): string {
  return `${DECISION_KEY_PREFIX}-${clientId}`;
}

/** Browser copy of offer decisions — offline fallback for the placement ledger. */
export function readLocalDecisions(clientId: string): Record<string, PlacementStatus> {
  try {
    const raw = sessionStorage.getItem(decisionKey(clientId)) ?? localStorage.getItem(decisionKey(clientId));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const next: Record<string, PlacementStatus> = {};
    for (const [offerId, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (!INSTITUTION_SEEDS.some((firm) => firm.offer.id === offerId)) continue;
      if (value === "accepted" || value === "declined") next[offerId] = value;
    }
    return next;
  } catch {
    return {};
  }
}

export function persistLocalDecisions(clientId: string, decisions: Record<string, PlacementStatus>) {
  try {
    const value = JSON.stringify(decisions);
    sessionStorage.setItem(decisionKey(clientId), value);
    localStorage.setItem(decisionKey(clientId), value);
  } catch {
    // In-memory decisions still apply.
  }
}

/** Rebuild placement rows from browser decisions when the API is unreachable. */
function localPlacementsFor(clientId: string): Placement[] {
  const record = seedById(clientId);
  if (!record) return [];
  const decisions = readLocalDecisions(clientId);
  return Object.entries(decisions).flatMap(([offerId, status]) => {
    const institution = INSTITUTION_SEEDS.find((firm) => firm.offer.id === offerId);
    return institution ? [buildPlacement(record, institution, status)] : [];
  });
}

export async function fetchPlacements(
  clientId: string,
): Promise<{ placements: Placement[]; source: ClientDataSource }> {
  try {
    const response = await fetch(`/api/clients/${clientId}/placements`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const body = (await response.json()) as { placements: Placement[] };
    if (!Array.isArray(body.placements)) throw new Error("Malformed placements payload");
    return { placements: body.placements, source: "api" };
  } catch {
    return { placements: localPlacementsFor(clientId), source: "seed" };
  }
}

export async function fetchAllPlacements(): Promise<{
  placements: Placement[];
  source: ClientDataSource;
}> {
  try {
    const response = await fetch("/api/placements");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const body = (await response.json()) as { placements: Placement[] };
    if (!Array.isArray(body.placements)) throw new Error("Malformed placements payload");
    return { placements: body.placements, source: "api" };
  } catch {
    return {
      placements: SEEDED_PASSPORTS.flatMap((passport) => localPlacementsFor(passport.id)),
      source: "seed",
    };
  }
}

/** Returns the client's placements on success, null when the API is unreachable or rejects. */
export async function postPlacementDecision(
  clientId: string,
  offerId: string,
  status: PlacementStatus,
): Promise<Placement[] | null> {
  try {
    const response = await fetch("/api/placements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, offerId, status }),
    });
    if (!response.ok) return null;
    const body = (await response.json()) as { placements: Placement[] };
    return Array.isArray(body.placements) ? body.placements : null;
  } catch {
    return null;
  }
}

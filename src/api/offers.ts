import { matchInstitutions, type OfferMatch } from "../../shared/match.ts";
import { seedById } from "../../shared/seed/index.ts";
import { INSTITUTION_SEEDS } from "../../shared/seed/institutions.ts";
import type { Institution } from "../../shared/types.ts";
import type { ClientDataSource } from "./clients";

export async function fetchInstitutions(): Promise<{
  institutions: Institution[];
  source: ClientDataSource;
}> {
  try {
    const response = await fetch("/api/institutions");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const body = (await response.json()) as { institutions: Institution[] };
    if (!Array.isArray(body.institutions) || body.institutions.length === 0) {
      throw new Error("Empty institution list");
    }
    return { institutions: body.institutions, source: "api" };
  } catch {
    return { institutions: INSTITUTION_SEEDS, source: "seed" };
  }
}

/**
 * Ranked placements for a client. The API matches against the stored record; the
 * seed fallback matches locally with the effective consent applied on top of the
 * bundled record so the inbox still reflects the toggle when the API is down.
 */
export async function fetchOfferMatches(
  clientId: string,
  consentShared: boolean,
): Promise<{ matches: OfferMatch[]; source: ClientDataSource }> {
  try {
    const response = await fetch(`/api/clients/${clientId}/offers`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const body = (await response.json()) as { matches: OfferMatch[] };
    if (!Array.isArray(body.matches)) throw new Error("Malformed offers payload");
    return { matches: body.matches, source: "api" };
  } catch {
    const seeded = seedById(clientId);
    if (!seeded) throw new Error(`No seed fallback for client "${clientId}".`);
    const record = { ...seeded, consent: { ...seeded.consent, shared: consentShared } };
    return { matches: matchInstitutions(record, INSTITUTION_SEEDS), source: "seed" };
  }
}

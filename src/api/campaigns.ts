import type { CampaignRow } from "../../shared/campaign.ts";
import { emptyCounters, withFunnel } from "../../shared/campaign.ts";
import { INSTITUTION_SEEDS } from "../../shared/seed/institutions.ts";
import type { ClientDataSource } from "./clients";
import { fetchAllPlacements } from "./placements";

export async function fetchCampaigns(): Promise<{
  campaigns: CampaignRow[];
  source: ClientDataSource;
}> {
  try {
    const response = await fetch("/api/campaigns");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const body = (await response.json()) as { campaigns: CampaignRow[] };
    if (!Array.isArray(body.campaigns)) throw new Error("Malformed campaigns payload");
    return { campaigns: body.campaigns, source: "api" };
  } catch {
    const { placements } = await fetchAllPlacements();
    return {
      source: "seed",
      campaigns: INSTITUTION_SEEDS.map((firm) => {
        const desk = placements.filter((row) => row.institutionId === firm.id);
        const accepts = desk.filter((row) => row.status === "accepted");
        return withFunnel(emptyCounters(firm.id), {
          name: firm.name,
          kindLabel: firm.kindLabel,
          accepts: accepts.length,
          declines: desk.filter((row) => row.status === "declined").length,
          bookedRevenue: accepts.reduce((sum, row) => sum + row.annualRevenue, 0),
        });
      }),
    };
  }
}

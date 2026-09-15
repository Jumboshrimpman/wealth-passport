import { formatPct, formatUsd } from "./format.ts";
import type { ClientRecord, Institution } from "./types.ts";

export interface OfferMatch {
  institution: Institution;
  eligible: boolean;
  /** Per-criterion outcomes, in plain language, in evaluation order. */
  reasons: string[];
  /** Client-specific fit line when eligible; the first blocking reason otherwise. */
  fitReason: string;
}

function clientState(domicile: string): string | null {
  const tail = domicile.split(",").pop()?.trim().toUpperCase();
  return tail && /^[A-Z]{2}$/.test(tail) ? tail : null;
}

function taxableCollateral(client: ClientRecord): number {
  return client.accounts
    .filter((account) => account.sleeve === "taxable")
    .reduce((sum, account) => sum + account.balance, 0);
}

function taxableFixedIncome(client: ClientRecord): number {
  const taxableIds = new Set(
    client.accounts.filter((account) => account.sleeve === "taxable").map((account) => account.id),
  );
  return client.holdings
    .filter((holding) => taxableIds.has(holding.accountId) && holding.assetClass === "fixed-income")
    .reduce((sum, holding) => sum + holding.value, 0);
}

function fitReasonFor(client: ClientRecord, institution: Institution): string {
  const { household } = client;
  switch (institution.id) {
    case "first-atlantic":
      return `Verified taxable collateral of ${formatUsd(taxableCollateral(client), true)} can support a line without selling the public-equity sleeve; liquidity ${formatUsd(household.liquidity, true)} clears the ${formatUsd(institution.targeting.liquidityMin, true)} floor.`;
    case "meridian":
      return `${household.domicile} plus ${formatUsd(taxableFixedIncome(client), true)} in taxable fixed income is a direct municipal-SMA fit at ${formatUsd(household.investable, true)} investable.`;
    case "oakridge":
      return `An existing private-markets sleeve at ${formatPct(household.risk.privateMarketsSleeve)} of the book clears the ${formatPct(institution.targeting.privateMarketsMinPct)} floor; a secondaries feeder stays a satellite allocation.`;
    default:
      return institution.offer.fitReason;
  }
}

export function matchInstitution(client: ClientRecord, institution: Institution): OfferMatch {
  const { household, consent } = client;
  const targeting = institution.targeting;
  const reasons: string[] = [];
  let eligible = true;

  if (targeting.consentRequired) {
    if (consent.shared) {
      reasons.push("Passport share consent is on.");
    } else {
      eligible = false;
      reasons.push("Passport share consent is off.");
    }
  }

  if (household.investable >= targeting.minInvestable) {
    reasons.push(
      `Investable ${formatUsd(household.investable, true)} clears the ${formatUsd(targeting.minInvestable, true)} floor.`,
    );
  } else {
    eligible = false;
    reasons.push(
      `Investable ${formatUsd(household.investable, true)} is below the ${formatUsd(targeting.minInvestable, true)} floor.`,
    );
  }

  if (household.liquidity >= targeting.liquidityMin) {
    reasons.push(
      `Liquidity ${formatUsd(household.liquidity, true)} clears the ${formatUsd(targeting.liquidityMin, true)} floor.`,
    );
  } else {
    eligible = false;
    reasons.push(
      `Liquidity ${formatUsd(household.liquidity, true)} is below the ${formatUsd(targeting.liquidityMin, true)} floor.`,
    );
  }

  if (targeting.privateMarketsMinPct > 0) {
    const sleeve = household.risk.privateMarketsSleeve;
    if (sleeve >= targeting.privateMarketsMinPct) {
      reasons.push(
        `Private-markets sleeve ${formatPct(sleeve)} clears the ${formatPct(targeting.privateMarketsMinPct)} floor.`,
      );
    } else {
      eligible = false;
      reasons.push(
        `Private-markets sleeve ${formatPct(sleeve)} is below the ${formatPct(targeting.privateMarketsMinPct)} floor.`,
      );
    }
  }

  if (targeting.states.length > 0) {
    const state = clientState(household.domicile);
    if (state && targeting.states.includes(state)) {
      reasons.push(`Domicile ${household.domicile} sits inside the ${targeting.geography} target.`);
    } else {
      eligible = false;
      reasons.push(`Domicile ${household.domicile} is outside the ${targeting.geography} target.`);
    }
  }

  return {
    institution,
    eligible,
    reasons,
    fitReason: eligible ? fitReasonFor(client, institution) : reasons[reasons.length - 1],
  };
}

/** Every desk evaluated against the client record, eligible placements first in paid-rank order. */
export function matchInstitutions(client: ClientRecord, institutions: Institution[]): OfferMatch[] {
  return institutions
    .map((institution) => matchInstitution(client, institution))
    .sort(
      (a, b) =>
        Number(b.eligible) - Number(a.eligible) ||
        a.institution.offer.rank - b.institution.offer.rank,
    );
}

export function eligibleMatches(matches: OfferMatch[]): OfferMatch[] {
  return matches.filter((match) => match.eligible);
}

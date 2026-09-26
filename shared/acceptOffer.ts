import { allInFeeLabel, revealedItems, type BiddingOffer, type OfferBoardRow, type Recommendation } from "./marketplace.ts";

/** Algorithmic matches are WealthPass’s ranking, not a company bid. */
export const ALGORITHMIC_PARTY = "WealthPass";

export interface AcceptableChoice {
  id: string;
  kind: "algorithmic" | "offer";
  party: string;
  strategy: string;
  accountName: string;
  /** Set when the choice is priced all-in in basis points. */
  allInBps: number | null;
  /** Rate text when the choice is not an all-in bps fee. */
  rateLabel: string | null;
}

export interface RowAcceptance {
  choiceId: string;
  party: string;
  strategy: string;
  accountName: string;
  allInBps: number | null;
  rateLabel: string | null;
  confirmation: string;
}

/** Pull an all-in bps figure from a bid line such as "all-in 38 bps". */
export function allInBpsFromTerms(terms: string): number | null {
  const match = /^all-in (\d+) bps$/.exec(terms.trim());
  if (!match) return null;
  const bps = Number(match[1]);
  return Number.isInteger(bps) ? bps : null;
}

export function choicePrice(choice: Pick<AcceptableChoice, "allInBps" | "rateLabel">): string | null {
  if (choice.allInBps != null) return allInFeeLabel(choice.allInBps);
  const rate = choice.rateLabel?.trim();
  return rate ? rate : null;
}

export function acceptanceConfirmation(
  choice: Pick<AcceptableChoice, "party" | "strategy" | "accountName" | "allInBps" | "rateLabel">,
): string {
  const price = choicePrice(choice);
  const setup = `${choice.party} will be in touch shortly to set up ${choice.strategy} for ${choice.accountName}`;
  return price ? `${setup} at ${price}.` : `${setup}.`;
}

function fromMatch(row: OfferBoardRow, recommendation: Recommendation): AcceptableChoice {
  return {
    id: `match:${recommendation.id}`,
    kind: "algorithmic",
    party: ALGORITHMIC_PARTY,
    strategy: recommendation.nextStrategy,
    accountName: row.accountName,
    allInBps: recommendation.allInBps,
    rateLabel: null,
  };
}

function fromBid(row: OfferBoardRow, offer: BiddingOffer): AcceptableChoice {
  const allInBps = allInBpsFromTerms(offer.terms);
  return {
    id: `bid:${offer.id}`,
    kind: "offer",
    party: offer.bidder,
    strategy: offer.title,
    accountName: row.accountName,
    allInBps,
    rateLabel: allInBps == null ? offer.terms : null,
  };
}

/** A row can be accepted when it already lists a strategy or a bid. Household rows qualify. */
export function rowCanAccept(row: OfferBoardRow): boolean {
  return row.algorithmic.length > 0 || row.offers.length > 0;
}

/** Choices the client can pick: revealed algorithmic matches, then revealed bids. */
export function acceptChoicesFor(row: OfferBoardRow, matchesOpen: boolean, offersOpen: boolean): AcceptableChoice[] {
  if (!rowCanAccept(row)) return [];
  return [
    ...revealedItems(row.algorithmic, matchesOpen).map((recommendation) => fromMatch(row, recommendation)),
    ...revealedItems(row.offers, offersOpen).map((offer) => fromBid(row, offer)),
  ];
}

/** One acceptance per row. A second choice on the same row is ignored. */
export function acceptOnRow(
  current: Readonly<Record<string, RowAcceptance>>,
  rowKey: string,
  choice: AcceptableChoice,
): Record<string, RowAcceptance> {
  if (current[rowKey]) return { ...current };
  return {
    ...current,
    [rowKey]: {
      choiceId: choice.id,
      party: choice.party,
      strategy: choice.strategy,
      accountName: choice.accountName,
      allInBps: choice.allInBps,
      rateLabel: choice.rateLabel,
      confirmation: acceptanceConfirmation(choice),
    },
  };
}

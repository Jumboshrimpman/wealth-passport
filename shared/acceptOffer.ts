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
  /** Algorithmic list was already expanded when this row was accepted. */
  matchesOpen: boolean;
  /** Top-offers list was already expanded when this row was accepted. */
  offersOpen: boolean;
}

export interface AcceptVisibility {
  matchesOpen: boolean;
  offersOpen: boolean;
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

/** Demo client agreement. Signing it in the product does not create a legal contract. */
export function clientAgreementLines(
  choice: Pick<AcceptableChoice, "party" | "strategy" | "accountName">,
): string[] {
  return [
    `Client agreement with ${choice.party}.`,
    `${choice.party} will manage ${choice.strategy} for ${choice.accountName}.`,
    "This is a demo signature. It is not a legal contract.",
  ];
}

/** Demo LPOA. The selected Manager sets up a Schwab brokerage to manage the assets. */
export function schwabLpoaLines(
  choice: Pick<AcceptableChoice, "party" | "strategy" | "accountName">,
): string[] {
  return [
    "Limited power of attorney. Your selected Manager will set up a brokerage with Schwab to manage the assets.",
    `The brokerage is for ${choice.strategy} on ${choice.accountName}.`,
    "This demo LPOA is not a real authorization.",
  ];
}

/** Demo revocation. Confirming it in the product does not liquidate an account. */
export function revokeConsentLines(
  acceptance: Pick<RowAcceptance, "strategy" | "party" | "allInBps" | "rateLabel">,
): string[] {
  const price = choicePrice(acceptance);
  return [
    `You are revoking consent for ${acceptance.strategy}.`,
    price ? `The price is ${price}.` : "No price was shown on accept.",
    `The manager is ${acceptance.party}.`,
    "This is a demo signature. It is not a legal instruction.",
  ];
}

export function revokeConsentAcknowledgment(
  acceptance: Pick<RowAcceptance, "strategy" | "party" | "allInBps" | "rateLabel">,
): string {
  const price = choicePrice(acceptance);
  const priced = price ? ` at ${price}` : "";
  return `I revoke consent for ${acceptance.strategy}${priced} with ${acceptance.party}`;
}

export function revokeLiquidationLines(): string[] {
  return [
    "Your brokerage will be liquidated.",
    "The assets will be sent back to your custodian.",
    "This demo acknowledgment is not an instruction to a custodian.",
  ];
}

export const REVOKE_LIQUIDATION_ACKNOWLEDGMENT =
  "I understand my brokerage will be liquidated and the assets sent back to my custodian";

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
  visibility: AcceptVisibility = { matchesOpen: false, offersOpen: false },
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
      matchesOpen: visibility.matchesOpen,
      offersOpen: visibility.offersOpen,
    },
  };
}

/** Drop one row’s acceptance. Other rows stay. */
export function revokeOnRow(
  current: Readonly<Record<string, RowAcceptance>>,
  rowKey: string,
): Record<string, RowAcceptance> {
  if (!current[rowKey]) return { ...current };
  const next = { ...current };
  delete next[rowKey];
  return next;
}

/**
 * After accept, keep whatever was already on screen. Expanded ranks stay.
 * A collapsed list stays on rank 1.
 */
export function listsAfterAccept(row: OfferBoardRow, visibility: AcceptVisibility): {
  algorithmic: Recommendation[];
  offers: BiddingOffer[];
} {
  return {
    algorithmic: [...revealedItems(row.algorithmic, visibility.matchesOpen)],
    offers: [...revealedItems(row.offers, visibility.offersOpen)],
  };
}

export function withVisibility(row: RowAcceptance): RowAcceptance {
  return {
    ...row,
    matchesOpen: row.matchesOpen === true,
    offersOpen: row.offersOpen === true,
  };
}

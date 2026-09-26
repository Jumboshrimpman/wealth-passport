import { useEffect, useMemo, useState } from "react";
import {
  acceptChoicesFor,
  acceptOnRow,
  choicePrice,
  listsAfterAccept,
  rowCanAccept,
  type AcceptableChoice,
  type RowAcceptance,
} from "../../shared/acceptOffer.ts";
import {
  allInFeeLabel,
  buildOfferBoard,
  defaultFit,
  revealedItems,
  revealLabel,
  type BiddingOffer,
  type OfferBoardRow,
  type Recommendation,
} from "../../shared/marketplace.ts";
import { useClient } from "../context/ClientContext";
import { useDemo } from "../context/DemoContext";
import { useOffers } from "../context/OfferContext";
import { readAcceptedOffers, writeAcceptedOffers } from "../offers/acceptedOffers";

/** Darker green is a higher match. Every step stays readable on white. */
function matchColor(pct: number): string {
  if (pct >= 95) return "#0b4f2a";
  if (pct >= 92) return "#115c34";
  if (pct >= 88) return "#17683d";
  if (pct >= 84) return "#1e7546";
  if (pct >= 78) return "#26824f";
  return "#34864e";
}

export function Offers() {
  const { passport } = useClient();
  const { profile } = useDemo();
  const { eligible } = useOffers();
  const fit = profile && profile.clientId === passport.id ? profile.fit : defaultFit(passport);
  const board = useMemo(
    () =>
      buildOfferBoard(
        passport,
        fit,
        eligible.map((match) => match.institution),
      ),
    [eligible, fit, passport],
  );
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [picking, setPicking] = useState<string | null>(null);
  const [accepted, setAccepted] = useState<Record<string, RowAcceptance>>(() => readAcceptedOffers(passport.id));

  useEffect(() => {
    setOpen({});
    setPicking(null);
    setAccepted(readAcceptedOffers(passport.id));
  }, [passport.id]);

  function toggle(key: string) {
    setOpen((current) => ({ ...current, [key]: !current[key] }));
  }

  function accept(rowKey: string, choice: AcceptableChoice) {
    const matchesOpen = Boolean(open[`${rowKey}:matches`]);
    const offersOpen = Boolean(open[`${rowKey}:offers`]);
    setAccepted((current) => {
      const next = acceptOnRow(current, rowKey, choice, { matchesOpen, offersOpen });
      writeAcceptedOffers(passport.id, next);
      return next;
    });
    setPicking(null);
  }

  return (
    <div className="offer-page">
      <h1>Pitches</h1>
      <p className="lede-quiet offer-lede">
        Algorithmic match is WealthPass’s ranking of basic managed strategies. Pitches are customized
        strategy pitches: a manager’s customizable solution at a unique price. Each list opens on the
        top result.
      </p>
      <div className="offers-scroll">
        <table className="offers-table">
          <thead>
            <tr>
              <th scope="col">Account</th>
              <th scope="col">
                <span className="col-title">Algorithmic match</span>
                <span className="col-note">Basic managed strategies</span>
              </th>
              <th scope="col">
                <span className="col-title">Pitches</span>
                <span className="col-note">Customized strategy pitches</span>
              </th>
              <th scope="col">
                <span className="col-title">Accept</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {board.rows.map((row) => (
              <OfferRow
                key={row.key}
                row={row}
                matchesOpen={Boolean(open[`${row.key}:matches`])}
                offersOpen={Boolean(open[`${row.key}:offers`])}
                onToggle={toggle}
                accepted={accepted[row.key] ?? null}
                picking={picking === row.key}
                onStartPick={() => setPicking(row.key)}
                onCancelPick={() => setPicking(null)}
                onAccept={(choice) => accept(row.key, choice)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OfferRow({
  row,
  matchesOpen,
  offersOpen,
  onToggle,
  accepted,
  picking,
  onStartPick,
  onCancelPick,
  onAccept,
}: {
  row: OfferBoardRow;
  matchesOpen: boolean;
  offersOpen: boolean;
  onToggle: (key: string) => void;
  accepted: RowAcceptance | null;
  picking: boolean;
  onStartPick: () => void;
  onCancelPick: () => void;
  onAccept: (choice: AcceptableChoice) => void;
}) {
  const shown = accepted ? listsAfterAccept(row, accepted) : null;
  const matches = shown ? shown.algorithmic : revealedItems(row.algorithmic, matchesOpen);
  const offers = shown ? shown.offers : revealedItems(row.offers, offersOpen);
  const matchLabel = accepted ? null : revealLabel("matches", row.algorithmic.length, matchesOpen);
  const offerLabel = accepted ? null : revealLabel("offers", row.offers.length, offersOpen);
  const choices = acceptChoicesFor(row, matchesOpen, offersOpen);
  return (
    <tr className={accepted ? "is-accepted" : undefined}>
      <th scope="row">
        <span className="offer-account">{row.accountName}</span>
        <span className="offer-meta">{row.meta}</span>
      </th>
      <td>
        {matches.map((recommendation, index) => (
          <AlgorithmicMatch
            key={recommendation.id}
            recommendation={recommendation}
            rank={index + 1}
            compact={Boolean(accepted)}
            chosen={accepted?.choiceId === `match:${recommendation.id}`}
          />
        ))}
        {matchLabel ? (
          <button
            type="button"
            className="reveal-next"
            aria-expanded={matchesOpen}
            onClick={() => onToggle(`${row.key}:matches`)}
          >
            {matchLabel}
          </button>
        ) : null}
      </td>
      <td className="offer-lane">
        {offers.map((offer, index) => (
          <BidBlock
            key={offer.id}
            offer={offer}
            rank={index + 1}
            compact={Boolean(accepted)}
            chosen={accepted?.choiceId === `bid:${offer.id}`}
          />
        ))}
        {offerLabel ? (
          <button
            type="button"
            className="reveal-next"
            aria-expanded={offersOpen}
            onClick={() => onToggle(`${row.key}:offers`)}
          >
            {offerLabel}
          </button>
        ) : null}
      </td>
      <td className="accept-lane">
        <AcceptCell
          canAccept={rowCanAccept(row)}
          accepted={accepted}
          picking={picking}
          choices={choices}
          onStartPick={onStartPick}
          onCancelPick={onCancelPick}
          onAccept={onAccept}
        />
      </td>
    </tr>
  );
}

function AcceptCell({
  canAccept,
  accepted,
  picking,
  choices,
  onStartPick,
  onCancelPick,
  onAccept,
}: {
  canAccept: boolean;
  accepted: RowAcceptance | null;
  picking: boolean;
  choices: AcceptableChoice[];
  onStartPick: () => void;
  onCancelPick: () => void;
  onAccept: (choice: AcceptableChoice) => void;
}) {
  if (!canAccept) return null;
  if (accepted) {
    return (
      <div className="accepted-offer" role="status">
        <p className="accepted-kicker">Accepted</p>
        <p className="accepted-copy">{accepted.confirmation}</p>
      </div>
    );
  }
  if (!picking) {
    return (
      <button type="button" className="text-button" aria-expanded={false} onClick={onStartPick}>
        Accept customized pitch
      </button>
    );
  }
  return (
    <div className="accept-picker">
      <p className="accept-picker-label">Choose one</p>
      <div role="listbox" aria-label="Choose one customized pitch">
        {choices.map((choice) => {
          const price = choicePrice(choice);
          return (
            <button key={choice.id} type="button" className="accept-choice" onClick={() => onAccept(choice)}>
              <span className="accept-choice-strategy">{choice.strategy}</span>
              <span className="accept-choice-meta">
                {choice.party}
                {price ? ` · ${price}` : ""}
              </span>
            </button>
          );
        })}
      </div>
      <button type="button" className="reveal-next" onClick={onCancelPick}>
        Cancel
      </button>
    </div>
  );
}

function AlgorithmicMatch({
  recommendation,
  rank,
  compact = false,
  chosen = false,
}: {
  recommendation: Recommendation;
  rank: number;
  compact?: boolean;
  chosen?: boolean;
}) {
  return (
    <div className={`lane-block${compact ? " is-compact" : ""}${chosen ? " is-chosen" : ""}`}>
      {rank > 1 ? <p className="rank-num">{rank}</p> : null}
      {chosen ? <p className="accepted-mark">Accepted</p> : null}
      <p className="proposed-name">{recommendation.nextStrategy}</p>
      <p className="all-in-fee">{allInFeeLabel(recommendation.allInBps)}</p>
      {compact ? null : (
        <p className="strategy-from">
          <span className="from-label">Currently</span> {recommendation.currentStrategy}
        </p>
      )}
      {compact ? null : (
        <p className="match-line">
          <span className="match-pct" style={{ color: matchColor(recommendation.matchPct) }}>
            {recommendation.matchPct}% match
          </span>
        </p>
      )}
      {compact || rank > 1 ? null : <p className="strategy-reason">{recommendation.reason}</p>}
    </div>
  );
}

function BidBlock({
  offer,
  rank,
  compact = false,
  chosen = false,
}: {
  offer: BiddingOffer;
  rank: number;
  compact?: boolean;
  chosen?: boolean;
}) {
  return (
    <div className={`lane-block${compact ? " is-compact" : ""}${chosen ? " is-chosen" : ""}`}>
      {rank > 1 ? <p className="rank-num">{rank}</p> : null}
      {chosen ? <p className="accepted-mark">Accepted</p> : null}
      <p className="bid-name">{offer.bidder}</p>
      <p className="bid-title">{offer.title}</p>
      <p className="pitch-fact">
        <span className="pitch-label">Customizable solution</span>
        <span className="pitch-value">{offer.customization}</span>
      </p>
      <p className="pitch-fact pitch-price">
        <span className="pitch-label">Unique pricing</span>
        <span className="pitch-value">{offer.terms}</span>
      </p>
      {compact ? null : (
        <p className="match-line">
          <span className="match-pct" style={{ color: matchColor(offer.matchPct) }}>
            {offer.matchPct}% match
          </span>
        </p>
      )}
    </div>
  );
}

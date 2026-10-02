import { useEffect, useMemo, useState } from "react";
import {
  acceptChoicesFor,
  choicePrice,
  listsAfterAccept,
  REVOKE_LIQUIDATION_ACKNOWLEDGMENT,
  revokeConsentAcknowledgment,
  revokeConsentLines,
  revokeLiquidationLines,
  rowCanAccept,
  type AcceptableChoice,
  type RowAcceptance,
} from "../../shared/acceptOffer.ts";
import { formatUsd } from "../../shared/format.ts";
import {
  allInFeeLabel,
  buildOfferBoard,
  defaultFit,
  matchTone,
  revealedItems,
  revealLabel,
  type BiddingOffer,
  type OfferBoardRow,
  type Recommendation,
} from "../../shared/marketplace.ts";
import { detailFromBid, detailFromRecommendation, type StrategyDetail } from "../../shared/strategyDetail.ts";
import { ServiceWaitingNote } from "../components/ServiceWaitingNote";
import { StrategyDetailModal } from "../components/StrategyDetailModal";
import { useAssistant } from "../context/AssistantContext";
import { useAcceptedOffers } from "../context/AcceptedOffersContext";
import { useClient } from "../context/ClientContext";
import { useDemo } from "../context/DemoContext";
import { useOffers } from "../context/OfferContext";

export function Offers() {
  const { passport } = useClient();
  const { profile } = useDemo();
  const { eligible } = useOffers();
  const { accepted, beginSign, revoke } = useAcceptedOffers();
  const { spotlight } = useAssistant();
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
  const [revoking, setRevoking] = useState<string | null>(null);
  const [strategy, setStrategy] = useState<StrategyDetail | null>(null);
  const investable = passport.household.investable;

  useEffect(() => {
    setOpen({});
    setPicking(null);
    setRevoking(null);
    setStrategy(null);
  }, [passport.id]);

  function toggle(key: string) {
    setOpen((current) => ({ ...current, [key]: !current[key] }));
  }

  function revokeRow(rowKey: string) {
    revoke(rowKey);
    setRevoking(null);
  }

  return (
    <div className="offer-page">
      <h1>Pitches</h1>
      <p className="lede-quiet offer-lede">Each account opens on its top basic strategy and top pitch.</p>
      <ServiceWaitingNote />
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
                recommendedId={spotlight?.rowKey === row.key ? spotlight.choiceId : null}
                picking={picking === row.key}
                onStartPick={() => setPicking(row.key)}
                onCancelPick={() => setPicking(null)}
                onChoose={(choice) => {
                  setPicking(null);
                  beginSign(row.key, choice, {
                    matchesOpen: Boolean(open[`${row.key}:matches`]),
                    offersOpen: Boolean(open[`${row.key}:offers`]),
                  });
                }}
                onRevoke={() => setRevoking(row.key)}
                onOpenMatch={(recommendation) => setStrategy(detailFromRecommendation(recommendation, investable))}
                onOpenBid={(offer) => setStrategy(detailFromBid(offer, investable))}
              />
            ))}
          </tbody>
        </table>
      </div>
      {revoking && accepted[revoking] ? (
        <RevokeModal
          acceptance={accepted[revoking]}
          onCancel={() => setRevoking(null)}
          onRevoke={() => revokeRow(revoking)}
        />
      ) : null}
      {strategy ? <StrategyDetailModal detail={strategy} onClose={() => setStrategy(null)} /> : null}
    </div>
  );
}

function OfferRow({
  row,
  matchesOpen,
  offersOpen,
  onToggle,
  accepted,
  recommendedId,
  picking,
  onStartPick,
  onCancelPick,
  onChoose,
  onRevoke,
  onOpenMatch,
  onOpenBid,
}: {
  row: OfferBoardRow;
  matchesOpen: boolean;
  offersOpen: boolean;
  onToggle: (key: string) => void;
  accepted: RowAcceptance | null;
  recommendedId: string | null;
  picking: boolean;
  onStartPick: () => void;
  onCancelPick: () => void;
  onChoose: (choice: AcceptableChoice) => void;
  onRevoke: () => void;
  onOpenMatch: (recommendation: Recommendation) => void;
  onOpenBid: (offer: BiddingOffer) => void;
}) {
  const shown = accepted ? listsAfterAccept(row, accepted) : null;
  const matches = shown ? shown.algorithmic : revealedItems(row.algorithmic, matchesOpen);
  const offers = shown ? shown.offers : revealedItems(row.offers, offersOpen);
  const matchLabel = accepted ? null : revealLabel("matches", row.algorithmic.length, matchesOpen);
  const offerLabel = accepted ? null : revealLabel("offers", row.offers.length, offersOpen);
  const choices = acceptChoicesFor(row, matchesOpen, offersOpen);
  return (
    <tr className={[accepted ? "is-accepted is-enrolled" : "", recommendedId ? "is-recommended" : ""].filter(Boolean).join(" ") || undefined}>
      <th scope="row">
        {accepted ? <span className="enrolled-flag">Enrolled</span> : recommendedId ? <span className="recommended-flag">Recommended</span> : null}
        {accepted ? <span className="enrolled-account-line">Enrolled in {accepted.strategy}</span> : null}
        <span className="offer-account">{row.accountName}</span>
        <span className="offer-meta">{row.meta}</span>
        {row.householdMinimum != null ? (
          <span className="offer-min">
            Household minimum {formatUsd(row.householdMinimum, true)}
            {row.householdMinimumMet ? "" : " · not cleared"}
          </span>
        ) : null}
      </th>
      <td>
        {matches.map((recommendation, index) => (
          <AlgorithmicMatch
            key={recommendation.id}
            recommendation={recommendation}
            rank={index + 1}
            compact={Boolean(accepted)}
            chosen={accepted?.choiceId === `match:${recommendation.id}`}
            recommended={recommendedId === `match:${recommendation.id}`}
            onOpen={() => onOpenMatch(recommendation)}
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
            recommended={recommendedId === `bid:${offer.id}`}
            onOpen={() => onOpenBid(offer)}
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
          onChoose={onChoose}
          onRevoke={onRevoke}
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
  onChoose,
  onRevoke,
}: {
  canAccept: boolean;
  accepted: RowAcceptance | null;
  picking: boolean;
  choices: AcceptableChoice[];
  onStartPick: () => void;
  onCancelPick: () => void;
  onChoose: (choice: AcceptableChoice) => void;
  onRevoke: () => void;
}) {
  if (!canAccept) return null;
  if (accepted) {
    return (
      <div className="accepted-offer">
        <div role="status">
          <p className="accepted-kicker">Enrolled</p>
          <p className="accepted-copy">{accepted.confirmation}</p>
        </div>
        <button type="button" className="text-button revoke-consent" onClick={onRevoke}>
          Revoke
        </button>
      </div>
    );
  }
  if (!picking) {
    return (
      <button type="button" className="text-button" aria-expanded={false} onClick={onStartPick}>
        Accept
      </button>
    );
  }
  return (
    <div className="accept-picker">
      <p className="accept-picker-label">Choose one</p>
      <div role="listbox" aria-label="Choose one">
        {choices.map((choice) => {
          const price = choicePrice(choice);
          return (
            <button key={choice.id} type="button" className="accept-choice" onClick={() => onChoose(choice)}>
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

function RevokeModal({
  acceptance,
  onCancel,
  onRevoke,
}: {
  acceptance: RowAcceptance;
  onCancel: () => void;
  onRevoke: () => void;
}) {
  const [consent, setConsent] = useState(false);
  const [liquidation, setLiquidation] = useState(false);
  const ready = consent && liquidation;
  return (
    <div className="accept-modal-backdrop" role="presentation" onClick={onCancel}>
      <div
        className="accept-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="revoke-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="revoke-modal-title">Revoke consent</h2>
        <p className="accept-modal-kicker">Consent</p>
        {revokeConsentLines(acceptance).map((line) => (
          <p key={line}>{line}</p>
        ))}
        <label className="accept-modal-check">
          <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />
          <span>{revokeConsentAcknowledgment(acceptance)}</span>
        </label>
        <p className="accept-modal-kicker">Liquidation</p>
        {revokeLiquidationLines().map((line) => (
          <p key={line}>{line}</p>
        ))}
        <label className="accept-modal-check">
          <input type="checkbox" checked={liquidation} onChange={(event) => setLiquidation(event.target.checked)} />
          <span>{REVOKE_LIQUIDATION_ACKNOWLEDGMENT}</span>
        </label>
        <div className="accept-modal-actions">
          <button type="button" className="text-button" disabled={!ready} onClick={onRevoke}>
            Revoke
          </button>
          <button type="button" className="reveal-next" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function AlgorithmicMatch({
  recommendation,
  rank,
  compact = false,
  chosen = false,
  recommended = false,
  onOpen,
}: {
  recommendation: Recommendation;
  rank: number;
  compact?: boolean;
  chosen?: boolean;
  recommended?: boolean;
  onOpen: () => void;
}) {
  const [details, setDetails] = useState(false);
  const lead = rank === 1;
  return (
    <div className={`lane-block strategy-open${compact ? " is-compact" : ""}${chosen ? " is-chosen" : ""}`} onClick={onOpen}>
      {rank > 1 ? <p className="rank-num">{rank}</p> : null}
      {chosen ? <p className="accepted-mark">Enrolled</p> : recommended ? <p className="recommended-flag">Recommended</p> : null}
      <button type="button" className="proposed-name" aria-haspopup="dialog" onClick={onOpen}>
        {recommendation.nextStrategy}
      </button>
      <p className="all-in-fee">{allInFeeLabel(recommendation.allInBps)}</p>
      {compact || recommendation.strategyMinimum == null ? null : (
        <p className="min-line">Strategy minimum {formatUsd(recommendation.strategyMinimum, true)}</p>
      )}
      {!compact && !lead ? (
        <p className="strategy-from">
          <span className="from-label">Currently</span> {recommendation.currentStrategy}
        </p>
      ) : null}
      {compact || !lead || !details ? null : (
        <>
          <p className="strategy-from">
            <span className="from-label">Currently</span> {recommendation.currentStrategy}
          </p>
          <p className="match-line">
            <span className={`match-pct ${matchTone(recommendation.matchPct)}`}>
              {recommendation.matchPct}% match
            </span>
          </p>
          <p className="strategy-reason">{recommendation.reason}</p>
        </>
      )}
      {compact || !lead ? null : (
        <button
          type="button"
          className="reveal-next details-toggle"
          aria-expanded={details}
          onClick={(event) => {
            event.stopPropagation();
            setDetails((open) => !open);
          }}
        >
          {details ? "Hide" : "Details"}
        </button>
      )}
    </div>
  );
}

function BidBlock({
  offer,
  rank,
  compact = false,
  chosen = false,
  recommended = false,
  onOpen,
}: {
  offer: BiddingOffer;
  rank: number;
  compact?: boolean;
  chosen?: boolean;
  recommended?: boolean;
  onOpen: () => void;
}) {
  const [details, setDetails] = useState(false);
  const lead = rank === 1;
  return (
    <div className={`lane-block strategy-open${compact ? " is-compact" : ""}${chosen ? " is-chosen" : ""}`} onClick={onOpen}>
      {rank > 1 ? <p className="rank-num">{rank}</p> : null}
      {chosen ? <p className="accepted-mark">Enrolled</p> : recommended ? <p className="recommended-flag">Recommended</p> : null}
      <button type="button" className="proposed-name" aria-haspopup="dialog" onClick={onOpen}>
        {offer.title}
      </button>
      {compact ? null : <p className="bid-name">{offer.bidder}</p>}
      <p className="all-in-fee">{offer.terms}</p>
      {compact || offer.minimum == null ? null : (
        <p className="min-line">Strategy minimum {formatUsd(offer.minimum, true)}</p>
      )}
      {!compact && !lead ? <p className="pitch-note">{offer.customization}</p> : null}
      {compact || !lead || !details ? null : (
        <>
          <p className="pitch-note">{offer.customization}</p>
          <p className="match-line">
            <span className={`match-pct ${matchTone(offer.matchPct)}`}>
              {offer.matchPct}% match
            </span>
          </p>
        </>
      )}
      {compact || !lead ? null : (
        <button
          type="button"
          className="reveal-next details-toggle"
          aria-expanded={details}
          onClick={(event) => {
            event.stopPropagation();
            setDetails((open) => !open);
          }}
        >
          {details ? "Hide" : "Details"}
        </button>
      )}
    </div>
  );
}

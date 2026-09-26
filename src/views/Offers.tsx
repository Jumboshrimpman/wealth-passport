import { useEffect, useMemo, useState } from "react";
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

  useEffect(() => {
    setOpen({});
  }, [passport.id]);

  function expand(key: string) {
    setOpen((current) => ({ ...current, [key]: true }));
  }

  return (
    <div className="offer-page">
      <h1>Offers</h1>
      <p className="lede-quiet">
        Each account, and the household on its own, has two lists. Algorithmic match names the
        proposed strategy and its all-in fee. Top offers are companies bidding their best rates on
        this profile. Both lists open on the top result.
      </p>
      <div className="offers-scroll">
        <table className="offers-table">
          <thead>
            <tr>
              <th scope="col">Account</th>
              <th scope="col">
                <span className="col-title">Algorithmic match</span>
                <span className="col-note">Our ranking</span>
              </th>
              <th scope="col">
                <span className="col-title">Top offers</span>
                <span className="col-note">Companies bidding</span>
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
                onExpand={expand}
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
  onExpand,
}: {
  row: OfferBoardRow;
  matchesOpen: boolean;
  offersOpen: boolean;
  onExpand: (key: string) => void;
}) {
  const matches = revealedItems(row.algorithmic, matchesOpen);
  const offers = revealedItems(row.offers, offersOpen);
  const matchLabel = revealLabel("matches", row.algorithmic.length, matchesOpen);
  const offerLabel = revealLabel("offers", row.offers.length, offersOpen);
  return (
    <tr>
      <th scope="row">
        <span className="offer-account">{row.accountName}</span>
        <span className="offer-meta">{row.meta}</span>
      </th>
      <td>
        {matches.map((recommendation, index) => (
          <AlgorithmicMatch key={recommendation.id} recommendation={recommendation} rank={index + 1} />
        ))}
        {matchLabel ? (
          <button type="button" className="reveal-next" aria-expanded={false} onClick={() => onExpand(`${row.key}:matches`)}>
            {matchLabel}
          </button>
        ) : null}
      </td>
      <td className="offer-lane">
        {offers.map((offer, index) => (
          <BidBlock key={offer.id} offer={offer} rank={index + 1} />
        ))}
        {offerLabel ? (
          <button type="button" className="reveal-next" aria-expanded={false} onClick={() => onExpand(`${row.key}:offers`)}>
            {offerLabel}
          </button>
        ) : null}
      </td>
    </tr>
  );
}

function AlgorithmicMatch({ recommendation, rank }: { recommendation: Recommendation; rank: number }) {
  return (
    <div className="lane-block">
      {rank > 1 ? <p className="rank-num">{rank}</p> : null}
      <p className="proposed-kicker">Proposed</p>
      <p className="proposed-name">{recommendation.nextStrategy}</p>
      <p className="all-in-fee">{allInFeeLabel(recommendation.allInBps)}</p>
      <p className="strategy-from">
        <span className="from-label">Currently</span> {recommendation.currentStrategy}
      </p>
      <p className="match-line">
        <span className="match-pct" style={{ color: matchColor(recommendation.matchPct) }}>
          {recommendation.matchPct}% match
        </span>
      </p>
      <p className="strategy-reason">{recommendation.reason}</p>
    </div>
  );
}

function BidBlock({ offer, rank }: { offer: BiddingOffer; rank: number }) {
  return (
    <div className="lane-block">
      {rank > 1 ? <p className="rank-num">{rank}</p> : null}
      <p className="bid-name">{offer.bidder}</p>
      <p className="bid-title">{offer.title}</p>
      <p className="bid-rate">{offer.terms}</p>
      <p className="match-line">
        <span className="match-pct" style={{ color: matchColor(offer.matchPct) }}>
          {offer.matchPct}% match
        </span>
      </p>
    </div>
  );
}

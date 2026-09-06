import { offerHeadline, type Institution } from "../data/mock";
import { Badge } from "./ui";

export function OfferCard({
  firm,
  compact = false,
}: {
  firm: Institution;
  compact?: boolean;
}) {
  const offer = firm.offer;
  const Heading = compact ? "h3" : "h2";

  return (
    <article className="panel offer-card">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <p className="kicker" style={{ margin: 0 }}>
          Rank {offer.rank} · tailored to this passport
        </p>
        <Badge tone="paid" compact>
          {offer.placementLabel}
        </Badge>
      </div>
      <Heading className="offer-terms">{offerHeadline(offer)}</Heading>
      <p className="offer-firm">
        {firm.name}
        <span className="muted"> · {firm.kindLabel}</span>
      </p>
      <p className="offer-fit">{offer.fitReason}</p>
      {!compact ? <p className="muted">{offer.summary}</p> : null}
      <p className="tiny muted">
        Illustrative terms: {offer.terms} Expires {offer.expires}.
      </p>
    </article>
  );
}

import { useState } from "react";
import { useConsent } from "../context/ConsentContext";
import { useOfferDecisions } from "../context/OfferDecisionContext";
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
  const consent = useConsent();
  const { statusOf, accept, decline } = useOfferDecisions();
  const status = statusOf(offer.id);
  const [actionError, setActionError] = useState<string | null>(null);

  function onAccept() {
    const result = accept(offer.id);
    setActionError(result.ok ? null : result.error);
  }

  function onDecline() {
    const result = decline(offer.id);
    setActionError(result.ok ? null : result.error);
  }

  return (
    <article className="panel offer-card">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <p className="kicker" style={{ margin: 0 }}>
          Rank {offer.rank} · tailored to this passport
        </p>
        <div className="row" style={{ gap: "0.4rem" }}>
          {status === "accepted" ? (
            <Badge tone="verified" compact>
              Accepted
            </Badge>
          ) : null}
          {status === "declined" ? (
            <Badge tone="warn" compact>
              Declined
            </Badge>
          ) : null}
          <Badge tone="paid" compact>
            {offer.placementLabel}
          </Badge>
        </div>
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
      <div className="offer-actions">
        {status ? (
          <p className="tiny muted" style={{ margin: 0 }}>
            Decision stored for this demo session ({status === "accepted" ? "Accepted" : "Declined"}
            ). Browser storage only — not an institution API.
          </p>
        ) : (
          <>
            <button type="button" className="gate-submit" onClick={onAccept}>
              Accept
            </button>
            <button type="button" className="offer-decline" onClick={onDecline}>
              Decline
            </button>
          </>
        )}
      </div>
      {!consent.shared ? (
        <aside className="gate-error" role="alert">
          MOCK FAILURE: consent is off. Accept and Decline are blocked until passport share is on.
        </aside>
      ) : null}
      {actionError ? (
        <aside className="gate-error" role="alert">
          {actionError}
        </aside>
      ) : null}
    </article>
  );
}

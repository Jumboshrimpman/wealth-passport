import { Link } from "react-router-dom";
import { defaultConsents, institutions } from "../data/mock";
import { Badge, Disclaimer, SectionHead } from "../components/ui";

const placementCopy = {
  bps: "The institution paid in basis points for this inbox slot.",
  strategy: "The institution paid to place a named strategy against this profile.",
  special: "The institution paid for a special-offer slot (fee waiver / concession).",
} as const;

export function Offers() {
  const visible = institutions.filter((firm) =>
    defaultConsents.some((consent) => consent.institutionId === firm.id && consent.shared),
  );

  return (
    <div className="stack">
      <SectionHead
        kicker="Client view · paid inbox"
        title="Personalized offers"
        lede="Each card is a paid placement. The household did not request a quote, and no optimizer selected a winner. Institutions bought the right to appear against a consented profile."
      />

      <Disclaimer>
        Illustrative offers only — not advice, not a solicitation, and not a commitment to lend,
        allocate, or waive fees. Product facts are drawn as if Morningstar / Informa were the first
        data layer. No live manager feed is connected.
      </Disclaimer>

      <div className="stack">
        {visible.map((firm) => {
          const offer = firm.offer;
          return (
            <article className="panel" key={offer.id}>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <p className="kicker" style={{ margin: 0 }}>
                  {firm.kindLabel}
                </p>
                <div className="row">
                  <Badge tone="paid">{offer.placementLabel}</Badge>
                  <Badge>Institution paid</Badge>
                </div>
              </div>
              <h2>{offer.title}</h2>
              <p className="muted">{firm.name}</p>
              <p>{offer.summary}</p>
              <p>
                <strong>Paid placement.</strong> {offer.paidPlacement} {placementCopy[offer.placementKind]}
              </p>
              <p className="tiny muted">
                Terms (illustrative): {offer.terms} Expires {offer.expires}. Audience: {offer.audience}.
              </p>
            </article>
          );
        })}
      </div>

      <p className="tiny muted">
        Institutions compose these cards on the{" "}
        <Link to="/institution">institutional offer console</Link>. Consent that hides a firm is
        edited on the <Link to="/passport">passport</Link>. Harbor Street Securities has no card
        because consent was withdrawn.
      </p>
    </div>
  );
}

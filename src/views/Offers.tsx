import { OfferCard } from "../components/OfferCard";
import { Disclaimer, SectionHead } from "../components/ui";
import { useClient } from "../context/ClientContext";
import { useConsent } from "../context/ConsentContext";
import { useOffers } from "../context/OfferContext";

export function Offers() {
  const consent = useConsent();
  const { passport } = useClient();
  const { eligible } = useOffers();

  return (
    <div className="stack">
      <SectionHead
        kicker="Client view · ranked inbox"
        title="Personalized offers"
        lede={`Each card is a paid placement matched against the ${passport.household.name} passport — targeting floors are checked against the stored household record. The household did not request a quote, and no optimizer selected a winner.`}
      />

      <Disclaimer>
        Offers are not advice, not a solicitation, and not a commitment to lend, allocate, or waive
        fees. Product facts are drawn from the Morningstar / Informa reference layer.
      </Disclaimer>

      {consent.shared ? (
        eligible.length > 0 ? (
          <div className="stack">
            {eligible.map((match) => (
              <OfferCard key={match.institution.id} firm={match.institution} fitReason={match.fitReason} />
            ))}
          </div>
        ) : (
          <section className="panel">
            <p className="kicker">No eligible placements</p>
            <h1>No offers.</h1>
            <p className="lede">
              No paying institution’s targeting floors match the {passport.household.name} record
              right now.
            </p>
          </section>
        )
      ) : (
        <section className="panel">
          <p className="kicker">Consent is off</p>
          <h1>No offers.</h1>
          <p className="lede">
            Passport share consent is off for {passport.household.clientFirstName}. No paying
            institution may send an offer. Accept is blocked until consent is on. Turn consent on
            from Passport if you want this inbox populated.
          </p>
        </section>
      )}

      <p className="tiny muted">
        Institutions compose these cards in Institution mode. Client mode cannot open that
        console. Harbor Street and any other non-paying desk are not in this ranked list.
      </p>
    </div>
  );
}

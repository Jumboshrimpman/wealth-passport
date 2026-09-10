import { OfferCard } from "../components/OfferCard";
import { Disclaimer, SectionHead } from "../components/ui";
import { useClient } from "../context/ClientContext";
import { useConsent } from "../context/ConsentContext";
import { rankedInstitutions } from "../data/mock";

export function Offers() {
  const consent = useConsent();
  const { passport } = useClient();
  const ranked = rankedInstitutions();

  return (
    <div className="stack">
      <SectionHead
        kicker="Client view · ranked inbox"
        title="Personalized offers"
        lede={`Each card is a paid placement shown against the ${passport.household.name} passport. The household did not request a quote, and no optimizer selected a winner. Institution matching is still fixture data.`}
      />

      <Disclaimer>
        Illustrative offers only — not advice, not a solicitation, and not a commitment to lend,
        allocate, or waive fees. Product facts are drawn as if Morningstar / Informa were the first
        data layer. No live manager feed is connected.
      </Disclaimer>

      {consent.shared ? (
        <div className="stack">
          {ranked.map((firm) => (
            <OfferCard key={firm.id} firm={firm} />
          ))}
        </div>
      ) : (
        <section className="panel">
          <p className="kicker">Consent is off</p>
          <h1>No offers.</h1>
          <p className="lede">
              Passport share consent is off for {passport.household.clientFirstName}. No paying
              institution may send an offer. Accept is blocked — this mock will not complete an
              accept without consent. Turn consent on from Passport if you want this inbox populated.
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

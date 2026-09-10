import { Link } from "react-router-dom";
import {
  adminMetrics,
  formatUsd,
  offerHeadline,
  rankedInstitutions,
} from "../data/mock";
import { Badge, Disclaimer, SectionHead, Stat } from "../components/ui";
import { useClient } from "../context/ClientContext";
import { useConsent } from "../context/ConsentContext";

export function Admin() {
  const consent = useConsent();
  const { passport, clients, source } = useClient();
  const ranked = rankedInstitutions();
  const household = passport.household;

  return (
    <div className="stack">
      <SectionHead
        kicker="Admin · both sides + extra mock metrics"
        title="Walkthrough control room"
        lede="Admin sees the client identity and the institutional board at once, plus aggregate mock metrics. Client and Institution modes stay separate; this mode is the only place that stacks both."
      />

      <div className="grid grid-3">
        {adminMetrics.map((metric) => (
          <Stat key={metric.label} label={metric.label} value={metric.value} note={metric.note} />
        ))}
      </div>

      <Disclaimer>
        Aggregate figures are constants for investor conversation. They are not computed from a
        warehouse. Client household figures load from SQLite when the API is running ({source}).
        Institution offers remain fixtures. Access is Clerk-gated.
      </Disclaimer>

      <div className="split">
        <section className="panel">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div>
              <p className="kicker">Client side</p>
              <h2>{household.name}</h2>
            </div>
            <Link to="/passport" className="badge">
              Open passport
            </Link>
          </div>
          <p>
            {household.principals} · Account {formatUsd(household.accountValue)} · Household{" "}
            {formatUsd(household.householdValue)} · Investable {formatUsd(household.investable)} ·{" "}
            {household.risk.label}. {clients.length} client records available.
          </p>
          <div className="row">
            <Badge tone={consent.shared ? "verified" : "warn"}>
              {consent.shared
                ? "Passport share on — any paying institution may offer"
                : "Passport share off — no offers"}
            </Badge>
          </div>
          <p className="tiny muted">
            <Link to="/chat">Open chat</Link>
            {" · "}
            <Link to="/ops">Open ops reuse</Link>
            {" · "}
            <Link to="/verification">Open verification</Link>
            {" · "}
            <Link to="/offers">Open inbox</Link>
          </p>
        </section>

        <section className="panel">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div>
              <p className="kicker">Institution side</p>
              <h2>Ranked paid placements</h2>
            </div>
            <Link to="/institution" className="badge">
              Open console
            </Link>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Firm</th>
                <th>Terms</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((firm) => (
                <tr key={firm.id}>
                  <td>{firm.offer.rank}</td>
                  <td>
                    <strong>{firm.name}</strong>
                    <div className="tiny muted">{firm.kindLabel}</div>
                  </td>
                  <td>
                    {offerHeadline(firm.offer)}
                    <div>
                      <Badge tone="paid" compact>
                        {firm.offer.placementLabel}
                      </Badge>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}

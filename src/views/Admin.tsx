import { Link } from "react-router-dom";
import { AdminDashboard } from "../components/admin/AdminDashboard";
import { Badge, Disclaimer, SectionHead } from "../components/ui";
import { useClient } from "../context/ClientContext";
import { useConsent } from "../context/ConsentContext";
import { useMode } from "../context/ModeContext";
import { formatUsd, offerHeadline, rankedInstitutions } from "../data/mock";

export function Admin() {
  const consent = useConsent();
  const { mode } = useMode();
  const { passport, clients, source, selectClient } = useClient();
  const ranked = rankedInstitutions();
  const household = passport.household;

  return (
    <div className="stack">
      <SectionHead
        kicker="Admin · customizable control room"
        title="Walkthrough dashboard"
        lede="Each former metric tile is now a widget: live client/ops slices where the API exists, illustrated board counts where it does not, plus charts you can reorder, resize, hide, and switch. Client and Institution modes stay separate; this mode is the only place that stacks both."
      />

      <AdminDashboard
        clients={clients}
        passport={passport}
        source={source}
        mode={mode}
        selectClient={selectClient}
      />

      <Disclaimer>
        Paying-institution headcount, open placements, and weekly sparkline are illustrated board
        fixtures. Client AUM, record counts, ops reuse, API health, and Clerk wiring are read from
        the current store and build. This is not a warehouse.
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

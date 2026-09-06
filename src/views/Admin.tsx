import { Link } from "react-router-dom";
import {
  adminMetrics,
  defaultConsents,
  formatUsd,
  household,
  institutions,
  opsPacket,
} from "../data/mock";
import { Badge, Disclaimer, SectionHead, Stat } from "../components/ui";

export function Admin() {
  return (
    <div className="stack">
      <SectionHead
        kicker="Admin · both sides"
        title="Walkthrough control room"
        lede="Admin sees the client identity and the institutional board at once, plus aggregate mock metrics. Nothing here is a live control plane."
      />

      <div className="grid grid-3">
        {adminMetrics.map((metric) => (
          <Stat key={metric.label} label={metric.label} value={metric.value} note={metric.note} />
        ))}
      </div>

      <Disclaimer>
        Aggregate figures are constants for investor conversation. They are not computed from a
        warehouse. Illustrated vendor layer: Morningstar and Informa first — not live manager
        feeds. Quant matching and instant quotes are future copy only.
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
            {household.principals} · {formatUsd(household.netWorth)} illustrated net worth ·{" "}
            {household.risk.label}.
          </p>
          <div className="stack">
            {defaultConsents.map((consent) => {
              const firm = institutions.find((item) => item.id === consent.institutionId);
              return (
                <div className="row" key={consent.institutionId} style={{ justifyContent: "space-between" }}>
                  <span>{firm?.name}</span>
                  <Badge tone={consent.shared ? "verified" : "warn"}>
                    {consent.shared ? "Shared" : "Hidden"}
                  </Badge>
                </div>
              );
            })}
          </div>
          <p className="tiny muted">
            Ops packet {opsPacket.reused}/{opsPacket.total} fields reused.{" "}
            <Link to="/ops">Open ops reuse</Link>
            {" · "}
            <Link to="/trust">Open trust</Link>
            {" · "}
            <Link to="/offers">Open inbox</Link>
          </p>
        </section>

        <section className="panel">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div>
              <p className="kicker">Institution side</p>
              <h2>Paid placement board</h2>
            </div>
            <Link to="/institution" className="badge">
              Open console
            </Link>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Firm</th>
                <th>Channel</th>
                <th>Offer</th>
              </tr>
            </thead>
            <tbody>
              {institutions.map((firm) => (
                <tr key={firm.id}>
                  <td>
                    <strong>{firm.name}</strong>
                    <div className="tiny muted">{firm.kindLabel}</div>
                  </td>
                  <td>
                    <Badge tone="paid">{firm.offer.placementLabel}</Badge>
                  </td>
                  <td>{firm.offer.title}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}

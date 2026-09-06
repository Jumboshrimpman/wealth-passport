import { advisor, attestations, household } from "../data/mock";
import { Badge, Disclaimer, SectionHead } from "../components/ui";

export function Trust() {
  return (
    <div className="stack">
      <SectionHead
        kicker="Trust & verification"
        title="Who attests to this identity"
        lede="Banks and managers pay against a profile only when the household, the advisor, and at least one custodian are illustrated as verified. Every badge below is a static fixture."
      />

      <div className="grid grid-2">
        <article className="panel">
          <p className="kicker">Verified advisor</p>
          <div className="row">
            <Badge tone="verified">BrokerCheck ID {advisor.brokerCheckId}</Badge>
            <Badge>Illustrative · not a live CRD call</Badge>
          </div>
          <h2 style={{ marginTop: "0.7rem" }}>{advisor.name}</h2>
          <p>
            {advisor.title}, {advisor.firm}. Illustrated as advisor of record for the{" "}
            {household.name} since {advisor.since}.
          </p>
          <dl className="tiny">
            <div className="row">
              <dt className="meta-label">BrokerCheck ID</dt>
              <dd style={{ margin: 0 }}>{advisor.brokerCheckId}</dd>
            </div>
            <div className="row">
              <dt className="meta-label">Firm CRD</dt>
              <dd style={{ margin: 0 }}>{advisor.crdFirm}</dd>
            </div>
          </dl>
          <Disclaimer>
            Linda McDonald and BrokerCheck ID 111111 are demo placeholders. This screen does not
            query FINRA BrokerCheck, IAPD, or any licensing registry.
          </Disclaimer>
        </article>

        <article className="panel">
          <p className="kicker">Verified custodian</p>
          <div className="row">
            <Badge tone="verified">Merrill Lynch</Badge>
            <Badge>Account ending 4481</Badge>
          </div>
          <h2 style={{ marginTop: "0.7rem" }}>Private Wealth brokerage</h2>
          <p>
            The taxable joint account is illustrated as custodian-matched to Merrill Lynch. Other
            sleeves (Fidelity, Schwab, Oakridge admin, First Atlantic cash) remain unverified in
            this walkthrough so the badge is meaningful.
          </p>
          <Disclaimer>
            No custodian SSO, DTCC, or statement scrape is wired. If a real verification service
            were missing, this UI would keep the unverified label — it would not invent a pass.
          </Disclaimer>
        </article>
      </div>

      <section className="panel">
        <p className="kicker">Attestation trail</p>
        <h2>What the badge is claiming</h2>
        <ul className="timeline">
          {attestations.map((item) => (
            <li key={item.title}>
              <p className="tiny muted" style={{ marginBottom: 0 }}>
                {item.date} · {item.kind}
              </p>
              <h3>{item.title}</h3>
              <p>{item.detail}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

import { Badge, Disclaimer, SectionHead } from "../components/ui";
import { useClient } from "../context/ClientContext";

export function Verification() {
  const { passport } = useClient();
  const { advisor, household, attestations, verifiedCustodian } = passport;

  return (
    <div className="stack">
      <SectionHead
        kicker="Verification"
        title="Who attests to this identity"
        lede="Banks and managers pay against a profile only when the household, the advisor, and at least one custodian are illustrated as verified. Badges below are stored on this client record."
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
            {advisor.name} and BrokerCheck ID {advisor.brokerCheckId} are demo placeholders. This
            screen does not query FINRA BrokerCheck, IAPD, or any licensing registry.
          </Disclaimer>
        </article>

        <article className="panel">
          <p className="kicker">Verified custodian</p>
          <div className="row">
            <Badge tone="verified">{verifiedCustodian.badge}</Badge>
            <Badge>{verifiedCustodian.accountMask}</Badge>
          </div>
          <h2 style={{ marginTop: "0.7rem" }}>{verifiedCustodian.title}</h2>
          <p>{verifiedCustodian.body}</p>
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

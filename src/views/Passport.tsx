import { useState } from "react";
import { Link } from "react-router-dom";
import {
  accounts,
  allocations,
  defaultConsents,
  formatUsd,
  household,
  institutionById,
  revokedFirm,
} from "../data/mock";
import { Badge, Disclaimer, SectionHead, Stat } from "../components/ui";

export function Passport() {
  const [consents, setConsents] = useState(defaultConsents);

  return (
    <div className="stack">
      <SectionHead
        kicker="Client view · holistic profile"
        title={`${household.name}`}
        lede={`${household.principals} · ${household.entity}. A single financial identity assembled from multi-custodian accounts, a private-markets sleeve, and consented disclosure to firms that pay to present a fit.`}
      />

      <div className="row">
        <Badge tone="verified">Advisor Linda McDonald verified</Badge>
        <Badge tone="verified">Merrill Lynch custodian verified</Badge>
        <Badge>Illustrative Morningstar / Informa first</Badge>
      </div>

      <div className="grid grid-3">
        <Stat label="Illustrated net worth" value={formatUsd(household.netWorth, true)} note={`${formatUsd(household.investable, true)} investable · ${formatUsd(household.realEstate, true)} real estate`} />
        <Stat label="Liquidity reserve" value={formatUsd(household.liquidity, true)} note="Cash, T-bills, short municipals" />
        <Stat label="Risk posture" value={household.risk.label} note={household.risk.horizon} />
      </div>

      <section className="panel">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <div>
            <p className="kicker">Allocation</p>
            <h2>Where the household sits today</h2>
          </div>
          <Badge>Static fixture · {household.dataAsOf}</Badge>
        </div>
        <p className="muted tiny">{household.risk.capacity}</p>
        <div className="allocation" aria-hidden="true">
          {allocations.map((sleeve) => (
            <span key={sleeve.label} className={`tone-${sleeve.tone}`} style={{ width: `${sleeve.pct}%` }} />
          ))}
        </div>
        <div className="legend">
          {allocations.map((sleeve) => (
            <div className="legend-item" key={sleeve.label}>
              <span>
                <i className={`swatch tone-${sleeve.tone}`} />
                {sleeve.label}
              </span>
              <strong>{sleeve.pct}%</strong>
            </div>
          ))}
        </div>
        <Disclaimer>{household.sourceNote}</Disclaimer>
      </section>

      <section className="panel">
        <p className="kicker">Multi-custodian book</p>
        <h2>Accounts on the passport</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Account</th>
              <th>Custodian</th>
              <th>Type</th>
              <th>Illustrated value</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((account) => (
              <tr key={account.id}>
                <td>
                  <strong>{account.name}</strong>
                  <div className="tiny muted">{account.sleeve}</div>
                </td>
                <td>
                  {account.custodian}
                  {account.verifiedCustodian ? (
                    <div>
                      <Badge tone="verified">Verified custodian</Badge>
                    </div>
                  ) : (
                    <div className="tiny muted">Unverified in this mock</div>
                  )}
                </td>
                <td>{account.type}</td>
                <td>{formatUsd(account.balance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="tiny muted">
          Verification detail lives on the <Link to="/trust">Trust</Link> view. Balances are constants in{" "}
          <code>src/data/mock.ts</code> — nothing was loaded from a custodian.
        </p>
      </section>

      <section className="panel">
        <p className="kicker">Consent controls</p>
        <h2>Which firms may see this profile</h2>
        <p className="muted">
          Toggles update local React state only. They are not written to a server, consent ledger, or
          institution API.
        </p>
        <div className="stack">
          {consents.map((consent) => {
            const firm = institutionById(consent.institutionId);
            if (!firm) return null;
            return (
              <div className="card" key={consent.institutionId}>
                <button
                  type="button"
                  className="toggle"
                  onClick={() =>
                    setConsents((current) =>
                      current.map((row) =>
                        row.institutionId === consent.institutionId
                          ? { ...row, shared: !row.shared }
                          : row,
                      ),
                    )
                  }
                  aria-pressed={consent.shared}
                >
                  <div>
                    <h3>{firm.name}</h3>
                    <p className="tiny muted" style={{ margin: 0 }}>
                      {firm.kindLabel} · last changed {consent.lastChanged} (fixture)
                    </p>
                    <p className="tiny" style={{ margin: "0.35rem 0 0" }}>
                      {consent.scopes.join(" · ")}
                    </p>
                  </div>
                  <span className={`switch ${consent.shared ? "on" : ""}`} aria-hidden="true">
                    <i />
                  </span>
                </button>
                <div className="row" style={{ marginTop: "0.7rem" }}>
                  <Badge tone={consent.shared ? "verified" : "warn"}>
                    {consent.shared ? "Shared for paid placement" : "Hidden from this firm"}
                  </Badge>
                </div>
              </div>
            );
          })}
          <div className="card">
            <h3>{revokedFirm.name}</h3>
            <p className="tiny muted">{revokedFirm.note}</p>
            <Badge tone="warn">Consent withdrawn</Badge>
          </div>
        </div>
      </section>
    </div>
  );
}

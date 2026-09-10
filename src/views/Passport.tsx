import { Link } from "react-router-dom";
import { AllocationDrilldown } from "../components/AllocationDrilldown";
import { OfferCard } from "../components/OfferCard";
import { Badge, Disclaimer, SectionHead, Stat } from "../components/ui";
import { useClient } from "../context/ClientContext";
import { useConsent } from "../context/ConsentContext";
import { formatUsd, rankedInstitutions } from "../data/mock";

export function Passport() {
  const consent = useConsent();
  const { passport, source } = useClient();
  const { household, accounts, allocations, advisor } = passport;
  const ranked = rankedInstitutions();

  return (
    <div className="stack">
      <SectionHead
        kicker="Client view · holistic profile"
        title={household.name}
        lede={`${household.principals} · ${household.entity}. A single financial identity assembled from multi-custodian accounts and one broad consent so paying institutions can send offers.`}
      />

      <div className="row">
        <Badge tone="verified">Advisor {advisor.name} verified</Badge>
        <Badge tone="verified">{passport.verifiedCustodian.badge} custodian verified</Badge>
        <Badge>{source === "api" ? "Loaded from SQLite" : "Bundled seed fallback"}</Badge>
      </div>

      <div className="grid grid-3">
        <Stat
          label="Account value"
          value={formatUsd(household.accountValue, true)}
          note={`${formatUsd(household.accountValue)} — sum of listed custodied accounts on this passport.`}
        />
        <Stat
          label="Household value"
          value={formatUsd(household.householdValue, true)}
          note={`${formatUsd(household.householdValue)} AUM — investable + ${formatUsd(household.realEstate, true)} residence + ${formatUsd(household.otherHousehold, true)} other personal assets.`}
        />
        <Stat
          label="Total investable assets"
          value={formatUsd(household.investable, true)}
          note={`${formatUsd(household.investable)} — listed accounts plus ${formatUsd(household.additionalInvestable, true)} additional investable not on the table.`}
        />
      </div>

      <div className="grid grid-2">
        <Stat label="Liquidity reserve" value={formatUsd(household.liquidity, true)} note="Cash, T-bills, short municipals" />
        <Stat label="Risk posture" value={household.risk.label} note={household.risk.horizon} />
      </div>

      <section className="panel">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <div>
            <p className="kicker">Allocation</p>
            <h2>Where the household sits today</h2>
          </div>
          <Badge>As of {household.dataAsOf}</Badge>
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
        <p className="muted tiny" style={{ marginTop: "1rem" }}>
          Open an asset class, then a sleeve/account, to see individual securities with weights and
          values. Switch the client record in the header to load Elena or Priya.
        </p>
        <AllocationDrilldown tree={passport.allocationTree} />
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
          Verification detail lives on the <Link to="/verification">Verification</Link> view.
          Balances are stored on the client record (SQLite when the API is running).
        </p>
      </section>

      <section className="panel">
        <p className="kicker">Consent</p>
        <h2>Share this passport with paying institutions</h2>
        <p className="muted">
          One broad consent, stored per client. If it is on, any paying institution may send an
          offer. If it is off, no offers appear. With the API running, the toggle writes to SQLite.
        </p>
        <div className="card">
          <button
            type="button"
            className="toggle"
            onClick={consent.toggle}
            aria-pressed={consent.shared}
          >
            <div>
              <h3>Allow paying institutions to send offers</h3>
              <p className="tiny muted" style={{ margin: 0 }}>
                Last changed {consent.lastChanged}
                {consent.persisted ? " · saved to client database" : " · in-memory only"}
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
              {consent.shared
                ? "On — any paying institution may offer"
                : "Off — no institution may offer"}
            </Badge>
          </div>
        </div>
      </section>

      <section className="stack">
        <SectionHead
          kicker="Last section · client inbox"
          title="Offers from banks and asset managers"
          lede="Ranked paid placements. Terms are the primary line. Paid placement is a small label only. Institution matching is still fixture data."
        />
        {consent.shared ? (
          ranked.map((firm) => <OfferCard key={firm.id} firm={firm} compact />)
        ) : (
          <section className="panel">
            <p className="kicker">Consent is off</p>
            <h2>No offers.</h2>
            <p className="lede">
              Passport share consent is off for {household.clientFirstName}, so no paying institution
              may send an offer. Accept is blocked.
            </p>
          </section>
        )}
      </section>
    </div>
  );
}

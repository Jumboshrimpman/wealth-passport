import { Link } from "react-router-dom";
import { CONSENT_SCOPE_IDS, CONSENT_SCOPE_META } from "../../shared/consent.ts";
import { householdInsights } from "../../shared/insights.ts";
import { AllocationDrilldown } from "../components/AllocationDrilldown";
import { OfferCard } from "../components/OfferCard";
import { Badge, Disclaimer, SectionHead, Stat } from "../components/ui";
import { useClient } from "../context/ClientContext";
import { useConsent } from "../context/ConsentContext";
import { useOffers } from "../context/OfferContext";
import { formatUsd } from "../data/catalog";

export function Passport() {
  const consent = useConsent();
  const { passport, source } = useClient();
  const { eligible } = useOffers();
  const { household, accounts, allocations, advisor } = passport;

  return (
    <div className="stack">
      <SectionHead
        kicker="Client view · holistic profile"
        title={household.name}
        lede={`${household.principals} · ${household.entity}. A single financial identity assembled from multi-custodian accounts. Scope-level consent decides which slices paying institutions can see.`}
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

      <HouseholdInsightsPanel record={passport} />

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
              <th>Value</th>
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
                    <div className="tiny muted">Unverified</div>
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
          Master share turns the inbox on. Each scope is independently revocable — withheld
          slices drop out of matching and the institution-side preview. With the API running,
          toggles write to the client database.
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
            </div>
            <span className={`switch ${consent.shared ? "on" : ""}`} aria-hidden="true">
              <i />
            </span>
          </button>
          <div className="row" style={{ marginTop: "0.7rem" }}>
            <Badge tone={consent.shared ? "verified" : "warn"}>
              {consent.shared
                ? "On — paying institutions may offer against shared scopes"
                : "Off — no institution may offer"}
            </Badge>
          </div>
          <div className="scope-list">
            {CONSENT_SCOPE_IDS.map((id) => {
              const on = consent.scopes.includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  className="toggle scope-toggle"
                  onClick={() => consent.toggleScope(id)}
                  aria-pressed={on}
                >
                  <div>
                    <h3>{CONSENT_SCOPE_META[id].label}</h3>
                    <p className="tiny muted" style={{ margin: 0 }}>
                      {CONSENT_SCOPE_META[id].blurb}
                    </p>
                  </div>
                  <span className={`switch ${on ? "on" : ""}`} aria-hidden="true">
                    <i />
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="stack">
        <SectionHead
          kicker="Last section · client inbox"
          title="Offers from banks and asset managers"
          lede="Ranked paid placements matched to this passport from the client store. Terms are the primary line. Paid placement is a small label only."
        />
        {consent.shared ? (
          eligible.map((match) => (
            <OfferCard key={match.institution.id} firm={match.institution} fitReason={match.fitReason} compact />
          ))
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

function HouseholdInsightsPanel({ record }: { record: Parameters<typeof householdInsights>[0] }) {
  const insights = householdInsights(record);
  if (insights.length === 0) return null;
  return (
    <section className="panel">
      <p className="kicker">Household insights</p>
      <h2>What the stored book is saying</h2>
      <p className="tiny muted" style={{ marginTop: 0 }}>
        Computed from this client record — concentration, cash runway, and rollover candidates.
        Not advice and not a recommendation.
      </p>
      <ul className="insight-list">
        {insights.map((insight) => (
          <li key={`${insight.kind}-${insight.title}`}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <strong>{insight.title}</strong>
              <Badge tone={insight.severity === "watch" ? "warn" : "default"} compact>
                {insight.kind === "concentration"
                  ? "Concentration"
                  : insight.kind === "liquidity"
                    ? "Liquidity"
                    : "Rollover"}
              </Badge>
            </div>
            <p className="tiny muted" style={{ margin: "0.25rem 0 0" }}>
              {insight.detail}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

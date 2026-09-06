import { Link } from "react-router-dom";
import { AllocationDrilldown } from "../components/AllocationDrilldown";
import { OfferCard } from "../components/OfferCard";
import { Badge, Disclaimer, SectionHead, Stat } from "../components/ui";
import { useConsent } from "../context/ConsentContext";
import {
  accountValue,
  accounts,
  allocations,
  formatUsd,
  household,
  rankedInstitutions,
} from "../data/mock";

export function Passport() {
  const consent = useConsent();
  const ranked = rankedInstitutions();

  return (
    <div className="stack">
      <SectionHead
        kicker="Client view · holistic profile"
        title={household.name}
        lede={`${household.principals} · ${household.entity}. A single financial identity assembled from multi-custodian accounts, a private-markets sleeve, and one broad consent so paying institutions can send offers.`}
      />

      <div className="row">
        <Badge tone="verified">Advisor Linda McDonald verified</Badge>
        <Badge tone="verified">Merrill Lynch custodian verified</Badge>
        <Badge>Illustrative Morningstar / Informa first</Badge>
      </div>

      <div className="grid grid-3">
        <Stat
          label="Account value"
          value={formatUsd(accountValue, true)}
          note={`${formatUsd(accountValue)} — sum of listed custodied accounts on this passport.`}
        />
        <Stat
          label="Household value"
          value={formatUsd(household.householdValue, true)}
          note={`${formatUsd(household.householdValue)} AUM — investable + ${formatUsd(household.realEstate, true)} Greenwich residence + ${formatUsd(household.otherHousehold, true)} other personal assets.`}
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
        <p className="muted tiny" style={{ marginTop: "1rem" }}>
          Open an asset class, then a sleeve/account, to see individual securities with weights and
          values. All rows are MOCK fixtures.
        </p>
        <AllocationDrilldown />
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
          Balances are constants in <code>src/data/mock.ts</code> — nothing was loaded from a
          custodian.
        </p>
      </section>

      <section className="panel">
        <p className="kicker">Consent</p>
        <h2>Share this passport with paying institutions</h2>
        <p className="muted">
          One broad consent. If it is on, any paying institution may send an offer. If it is off,
          no offers appear. The toggle updates local React state and browser storage only — not a
          consent ledger or institution API.
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
                Last changed {consent.lastChanged} (fixture)
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
          lede="Ranked to this passport’s allocation, domicile, and verified collateral. Terms are the primary line. Paid placement is a small label only."
        />
        {consent.shared ? (
          ranked.map((firm) => <OfferCard key={firm.id} firm={firm} compact />)
        ) : (
          <section className="panel">
            <p className="kicker">Consent is off</p>
            <h2>No offers.</h2>
            <p className="lede">
              Passport share consent is off, so no paying institution may send an offer. This is
              not an empty API response — the mock inbox is closed on purpose.
            </p>
          </section>
        )}
      </section>
    </div>
  );
}

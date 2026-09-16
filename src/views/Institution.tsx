import { useEffect, useMemo, useState } from "react";
import type { CampaignRow } from "../../shared/campaign.ts";
import { CONSENT_SCOPE_META, redactPassport, withheldScopes } from "../../shared/consent.ts";
import { matchInstitution } from "../../shared/match";
import { fetchCampaigns } from "../api/campaigns";
import { formatUsd, offerHeadline, type Institution as InstitutionRecord } from "../data/catalog";
import { Badge, Disclaimer, SectionHead } from "../components/ui";
import { useClient } from "../context/ClientContext";
import { useConsent } from "../context/ConsentContext";
import { useOffers } from "../context/OfferContext";

export function Institution() {
  const { passport } = useClient();
  const consent = useConsent();
  const { institutions, source, matches } = useOffers();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, InstitutionRecord>>({});
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [campaignSource, setCampaignSource] = useState<"api" | "seed">("seed");

  const baseline = institutions.find((item) => item.id === activeId) ?? institutions[0];
  const draft = baseline ? (drafts[baseline.id] ?? baseline) : undefined;

  function selectFirm(id: string) {
    if (!institutions.some((item) => item.id === id)) {
      throw new Error(`Unknown institution id "${id}".`);
    }
    setActiveId(id);
  }

  function patchDraft(next: InstitutionRecord) {
    setDrafts((current) => ({ ...current, [next.id]: next }));
  }

  const preview = draft?.offer;
  const scopedPassport = useMemo(
    () =>
      redactPassport({
        ...passport,
        consent: { ...passport.consent, shared: consent.shared, scopes: consent.scopes },
      }),
    [passport, consent.shared, consent.scopes],
  );
  const withheld = withheldScopes(consent.scopes);
  const match = useMemo(
    () =>
      draft
        ? matchInstitution(
            { ...passport, consent: { ...passport.consent, shared: consent.shared, scopes: consent.scopes } },
            draft,
          )
        : null,
    [passport, consent.shared, consent.scopes, draft],
  );

  useEffect(() => {
    let live = true;
    void fetchCampaigns().then((result) => {
      if (!live) return;
      setCampaigns(result.campaigns);
      setCampaignSource(result.source);
    });
    return () => {
      live = false;
    };
  }, [matches]);

  if (!draft || !preview || !match) {
    return (
      <section className="panel">
        <p className="kicker">Offer console</p>
        <h1>Loading institutions…</h1>
      </section>
    );
  }

  return (
    <div className="stack">
      <SectionHead
        kicker="Institution view · offer console only"
        title="Offer console"
        lede="A bank, an asset manager, and a private-markets provider each buy a channel into consented passports. Targeting edits stay in this console. The match check and client-card preview follow live scope revocation on the selected household."
      />

      <div className="row">
        {institutions.map((firm) => (
          <button
            key={firm.id}
            type="button"
            className="badge"
            onClick={() => selectFirm(firm.id)}
            aria-pressed={firm.id === draft.id}
            style={{
              cursor: "pointer",
              background: firm.id === draft.id ? "var(--camel-100)" : undefined,
            }}
          >
            {firm.name}
          </button>
        ))}
      </div>

      <Disclaimer>
        Targeting controls update this console only. Changing sliders does not reserve inventory or
        charge bps until a placement system is connected. The match check runs the draft targeting
        against the selected client record{source === "api" ? " in SQLite" : " from the bundled seed"}.
        Client screens are a different mode — they are not in this nav.
      </Disclaimer>

      <div className="split">
        <section className="panel stack">
          <div>
            <p className="kicker">{draft.kindLabel} · {draft.desk}</p>
            <h2>{draft.name}</h2>
          </div>
          <div className="form-grid">
            <label className="field-label">
              <span>Minimum investable</span>
              <input
                type="number"
                value={draft.targeting.minInvestable}
                onChange={(event) =>
                  patchDraft({
                    ...draft,
                    targeting: { ...draft.targeting, minInvestable: Number(event.target.value) },
                  })
                }
              />
            </label>
            <label className="field-label">
              <span>Minimum liquidity</span>
              <input
                type="number"
                value={draft.targeting.liquidityMin}
                onChange={(event) =>
                  patchDraft({
                    ...draft,
                    targeting: { ...draft.targeting, liquidityMin: Number(event.target.value) },
                  })
                }
              />
            </label>
            <label className="field-label">
              <span>Private markets sleeve (min %)</span>
              <input
                type="number"
                step="1"
                value={Math.round(draft.targeting.privateMarketsMinPct * 100)}
                onChange={(event) =>
                  patchDraft({
                    ...draft,
                    targeting: {
                      ...draft.targeting,
                      privateMarketsMinPct: Number(event.target.value) / 100,
                    },
                  })
                }
              />
            </label>
            <label className="field-label">
              <span>Geography</span>
              <input
                value={draft.targeting.geography}
                onChange={(event) =>
                  patchDraft({
                    ...draft,
                    targeting: { ...draft.targeting, geography: event.target.value },
                  })
                }
              />
            </label>
            <label className="field-label">
              <span>Strategy name</span>
              <input
                value={draft.offer.strategy}
                onChange={(event) =>
                  patchDraft({
                    ...draft,
                    offer: { ...draft.offer, strategy: event.target.value, title: event.target.value },
                  })
                }
              />
            </label>
            <label className="field-label">
              <span>Fee (bps)</span>
              <input
                type="number"
                value={draft.offer.bps}
                onChange={(event) =>
                  patchDraft({
                    ...draft,
                    offer: { ...draft.offer, bps: Number(event.target.value) },
                  })
                }
              />
            </label>
            <label className="field-label">
              <span>Max-fee discount (%)</span>
              <input
                type="number"
                value={draft.offer.feeDiscountPct}
                onChange={(event) =>
                  patchDraft({
                    ...draft,
                    offer: { ...draft.offer, feeDiscountPct: Number(event.target.value) },
                  })
                }
              />
            </label>
            <label className="field-label">
              <span>Offer terms</span>
              <textarea
                rows={3}
                value={draft.offer.terms}
                onChange={(event) =>
                  patchDraft({
                    ...draft,
                    offer: { ...draft.offer, terms: event.target.value },
                  })
                }
              />
            </label>
          </div>
        </section>

        <aside className="stack">
          <section className="panel">
            <p className="kicker">Match check · {passport.household.name}</p>
            <Badge tone={match.eligible ? "verified" : "warn"} compact>
              {match.eligible ? "Matches this passport" : "Not a match"}
            </Badge>
            {withheld.length > 0 ? (
              <div className="row" style={{ marginTop: "0.55rem" }}>
                {withheld.map((id) => (
                  <Badge key={id} tone="warn" compact>
                    {CONSENT_SCOPE_META[id].label} withheld
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="tiny muted" style={{ marginTop: "0.55rem" }}>
                All four scopes are shared.
              </p>
            )}
            <ul className="tiny" style={{ margin: "0.7rem 0 0", paddingLeft: "1.1rem" }}>
              {match.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
            {match.eligible ? (
              <p className="tiny muted" style={{ marginTop: "0.7rem" }}>
                {match.fitReason}
              </p>
            ) : null}
          </section>
          <section className="panel">
            <p className="kicker">Paid placement channel</p>
            <Badge tone="paid" compact>
              {preview.placementLabel}
            </Badge>
            <h3 className="offer-terms" style={{ fontSize: "1.55rem", marginTop: "0.55rem" }}>
              {offerHeadline(preview)}
            </h3>
            <p>{preview.paidPlacement}</p>
            <p className="tiny muted">
              Audience: {preview.audience}. Broad passport consent required:{" "}
              {draft.targeting.consentRequired ? "yes" : "no"}. Floor{" "}
              {formatUsd(draft.targeting.minInvestable, true)} investable /{" "}
              {formatUsd(draft.targeting.liquidityMin, true)} liquidity.
            </p>
          </section>
          <section className="panel">
            <p className="kicker">Client card preview</p>
            <p className="tiny muted">
              Rank {preview.rank} · {scopedPassport.household.name}
              {withheld.length > 0 ? " · redacted to shared scopes" : " · full passport"}
            </p>
            <h3 className="offer-terms" style={{ fontSize: "1.55rem" }}>
              {offerHeadline(preview)}
            </h3>
            <p className="offer-fit">{match.eligible ? match.fitReason : preview.fitReason}</p>
            <p className="tiny">
              Domicile {scopedPassport.household.domicile} · Investable{" "}
              {withheld.includes("holdings")
                ? "not shared"
                : formatUsd(scopedPassport.household.investable, true)}{" "}
              · Liquidity{" "}
              {withheld.includes("risk")
                ? "not shared"
                : formatUsd(scopedPassport.household.liquidity, true)}{" "}
              · Risk {scopedPassport.household.risk.label} · Verified custodian{" "}
              {scopedPassport.verifiedCustodian.badge}
            </p>
            <p className="tiny">{preview.terms}</p>
          </section>
        </aside>
      </div>

      <section className="panel">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <div>
            <p className="kicker">Campaign analytics</p>
            <h2>Why a desk pays</h2>
          </div>
          <Badge>{campaignSource === "api" ? "From client database" : "Accepts from this browser"}</Badge>
        </div>
        <p className="tiny muted" style={{ marginTop: 0 }}>
          Funnel per paying desk: inbox views → targeting matches → impressions (shown while
          consent is on) → accepts. Cost per accept is booked annualized placement revenue
          divided by accepts.
        </p>
        <table className="table">
          <thead>
            <tr>
              <th>Desk</th>
              <th>Views</th>
              <th>Matches</th>
              <th>Impressions</th>
              <th>Accepts</th>
              <th>Revenue</th>
              <th>Cost / accept</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((row) => (
              <tr key={row.institutionId} className={row.institutionId === draft.id ? "is-selected" : undefined}>
                <td>
                  <strong>{row.name}</strong>
                  <div className="tiny muted">{row.kindLabel}</div>
                </td>
                <td>{row.views}</td>
                <td>{row.matches}</td>
                <td>{row.impressions}</td>
                <td>
                  {row.accepts}
                  {row.declines > 0 ? <div className="tiny muted">{row.declines} declined</div> : null}
                </td>
                <td>{formatUsd(row.bookedRevenue)}</td>
                <td>{row.accepts > 0 ? formatUsd(row.costPerAccept) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

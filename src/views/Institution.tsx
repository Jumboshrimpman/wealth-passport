import { useMemo, useState } from "react";
import { matchInstitution } from "../../shared/match";
import { formatUsd, offerHeadline, type Institution as InstitutionRecord } from "../data/catalog";
import { Badge, Disclaimer, SectionHead } from "../components/ui";
import { useClient } from "../context/ClientContext";
import { useOffers } from "../context/OfferContext";

export function Institution() {
  const { passport } = useClient();
  const { institutions, source } = useOffers();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, InstitutionRecord>>({});

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
  const match = useMemo(
    () => (draft ? matchInstitution(passport, draft) : null),
    [passport, draft],
  );

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
        lede="A bank, an asset manager, and a private-markets provider each buy a channel into consented passports. Desks load from the client store; targeting edits stay in this console — there is no bidding engine."
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
            <p className="tiny muted">Rank {preview.rank} · tailored to this passport</p>
            <h3 className="offer-terms" style={{ fontSize: "1.55rem" }}>
              {offerHeadline(preview)}
            </h3>
            <p className="offer-fit">{match.eligible ? match.fitReason : preview.fitReason}</p>
            <p className="tiny">{preview.terms}</p>
          </section>
        </aside>
      </div>
    </div>
  );
}

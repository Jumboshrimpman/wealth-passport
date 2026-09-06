import { useMemo, useState } from "react";
import { formatUsd, institutions, type Institution as InstitutionRecord } from "../data/mock";
import { Badge, Disclaimer, SectionHead } from "../components/ui";

export function Institution() {
  const [activeId, setActiveId] = useState(institutions[0].id);
  const baseline = institutions.find((item) => item.id === activeId) ?? institutions[0];
  const [draft, setDraft] = useState<InstitutionRecord>(baseline);

  function selectFirm(id: string) {
    const next = institutions.find((item) => item.id === id);
    if (!next) {
      throw new Error(`MOCK FAILURE: unknown institution id "${id}".`);
    }
    setActiveId(id);
    setDraft(next);
  }

  const preview = useMemo(() => draft.offer, [draft]);

  return (
    <div className="stack">
      <SectionHead
        kicker="Institution view · paid placement"
        title="Offer console"
        lede="A bank, an asset manager, and a private-markets provider each buy a channel into consented passports. Targeting and terms stay in local component state — there is no bidding engine."
      />

      <div className="row">
        {institutions.map((firm) => (
          <button
            key={firm.id}
            type="button"
            className="badge"
            onClick={() => selectFirm(firm.id)}
            aria-pressed={firm.id === activeId}
            style={{
              cursor: "pointer",
              background: firm.id === activeId ? "var(--camel-100)" : undefined,
            }}
          >
            {firm.name}
          </button>
        ))}
      </div>

      <Disclaimer>
        Local mock controls only. Changing sliders does not call an API, reserve inventory, or
        charge bps. If a placement system is not wired, this console must stay labeled MOCK.
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
                  setDraft({
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
                  setDraft({
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
                  setDraft({
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
                  setDraft({
                    ...draft,
                    targeting: { ...draft.targeting, geography: event.target.value },
                  })
                }
              />
            </label>
            <label className="field-label">
              <span>Offer headline</span>
              <input
                value={draft.offer.title}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    offer: { ...draft.offer, title: event.target.value },
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
                  setDraft({
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
            <p className="kicker">Paid placement channel</p>
            <h3>{preview.placementLabel}</h3>
            <p>{preview.paidPlacement}</p>
            <p className="tiny muted">
              Audience: {preview.audience}. Consent required:{" "}
              {draft.targeting.consentRequired ? "yes" : "no"}. Floor{" "}
              {formatUsd(draft.targeting.minInvestable, true)} investable /{" "}
              {formatUsd(draft.targeting.liquidityMin, true)} liquidity.
            </p>
            <Badge tone="paid">Client inbox inventory · mock</Badge>
          </section>
          <section className="panel">
            <p className="kicker">Client card preview</p>
            <h3>{preview.title}</h3>
            <p>{preview.summary}</p>
            <p className="tiny">{preview.terms}</p>
            <Badge tone="paid">Institution paid for this slot</Badge>
          </section>
        </aside>
      </div>
    </div>
  );
}

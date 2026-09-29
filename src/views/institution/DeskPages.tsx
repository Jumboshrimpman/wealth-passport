import { useMemo, useRef, useState } from "react";
import { formatUsd } from "../../../shared/format.ts";
import { useInstitutional } from "../../context/InstitutionalContext";
import {
  ASSET_CLASSES,
  filterMarket,
  formatLocation,
  LISTING_NOTE,
  marketplaceRows,
  matchesNewYorkPitch,
  PITCH_SEND_USD,
  recommendationPreview,
  refFor,
  RISK_LEVELS,
  SAMPLE_CLEAN_FILE,
  SAMPLE_RECONCILE_FILE,
  statusLabel,
  statusNote,
  type DeskPitch,
  type OwnedStrategy,
} from "../../institution/desk";

export function InstitutionStrategies() {
  const desk = useInstitutional();
  const fileRef = useRef<HTMLInputElement>(null);
  const active = desk.strategies.find((strategy) => strategy.id === desk.activeStrategyId) ?? null;
  const [query, setQuery] = useState("");
  const [assetClass, setAssetClass] = useState("");
  const market = useMemo(() => {
    const rows = marketplaceRows(desk.strategies);
    return filterMarket(rows, { query, assetClass });
  }, [assetClass, desk.strategies, query]);
  const classes = useMemo(
    () => [...new Set(marketplaceRows(desk.strategies).map((row) => row.assetClass))].sort(),
    [desk.strategies],
  );

  return (
    <div className="desk-page">
      <section className="desk-block">
        <h1>Your strategies</h1>
        <p className="lede-quiet">List a strategy for free. Upload a PDF or Excel file, check the profile, then take one round of recommendations.</p>
        <div className="desk-actions">
          <button type="button" className="text-button" onClick={desk.startManual}>
            Create manually
          </button>
          <button type="button" className="text-button" onClick={() => fileRef.current?.click()}>
            Upload PDF or Excel
          </button>
          <input
            ref={fileRef}
            className="sr-only"
            type="file"
            accept=".pdf,.xlsx,.xls,.csv,application/pdf"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) desk.startUpload(file.name);
            }}
          />
        </div>
        <p className="desk-price">
          Or open a file already on the desk:{" "}
          <button type="button" className="text-button" onClick={() => desk.startUpload(SAMPLE_CLEAN_FILE)}>
            {SAMPLE_CLEAN_FILE}
          </button>
          {" · "}
          <button type="button" className="text-button" onClick={() => desk.startUpload(SAMPLE_RECONCILE_FILE)}>
            {SAMPLE_RECONCILE_FILE}
          </button>
        </p>
        {active && (active.status === "editing" || active.status === "recommendations") ? (
          <StrategyWork strategy={active} />
        ) : null}
        {active && active.status !== "editing" && active.status !== "recommendations" ? (
          <p className="desk-status-line">
            <span className={`desk-status ${active.status === "posted" ? "is-posted" : ""}`}>{statusLabel(active.status)}</span>
            {" · "}
            {active.draft.name || "Untitled strategy"}
            {". "}
            {statusNote(active.status)}
          </p>
        ) : null}
        <ul className="desk-own-list">
          {desk.strategies.map((strategy) => (
            <li key={strategy.id}>
              <button type="button" onClick={() => desk.openStrategy(strategy.id)} aria-pressed={strategy.id === desk.activeStrategyId}>
                <span>{strategy.draft.name || "Untitled strategy"}</span>
                <span className="desk-status">{statusLabel(strategy.status)}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="desk-block">
        <h2>All strategies</h2>
        <p className="lede-quiet">{LISTING_NOTE}</p>
        <div className="desk-tools">
          <label className="desk-field desk-search">
            <span className="sr-only">Search strategies</span>
            <input
              type="search"
              value={query}
              placeholder="Search name, manager, or style"
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <label className="desk-field">
            <span className="sr-only">Asset class</span>
            <select value={assetClass} onChange={(event) => setAssetClass(event.target.value)}>
              <option value="">All asset classes</option>
              {classes.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </div>
        <ul className="desk-market">
          {market.map((row) => (
            <li key={row.id}>
              <div>
                <strong>{row.name}</strong>
                {row.yours ? <span className="desk-yours">Yours</span> : null}
                <p>
                  {row.manager} · {row.assetClass} · {row.style}
                </p>
              </div>
              <div className="desk-market-meta">
                <span>{formatUsd(row.minimum, true)} min</span>
                <span>{row.feeLabel}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function StrategyWork({ strategy }: { strategy: OwnedStrategy }) {
  const { updateDraft, openRecommendations, decideRecommendation, submitStrategy, editStrategyAgain } = useInstitutional();
  const draft = strategy.draft;
  if (strategy.status === "recommendations") {
    const ready = strategy.recommendations.every((rec) => strategy.decisions[rec.id]);
    return (
      <div className="desk-work">
        <p className="desk-steps">
          <span>Edit</span>
          <span className="is-current">Recommendations</span>
          <span>Submit</span>
        </p>
        <h2>{draft.name || "Untitled strategy"}</h2>
        {draft.sourceFile ? <p className="desk-price">Read from {draft.sourceFile}</p> : null}
        <dl className="desk-facts">
          <div>
            <dt>Objective</dt>
            <dd>{draft.objective}</dd>
          </div>
          <div>
            <dt>Asset class</dt>
            <dd>
              {draft.assetClass} · {draft.style} · {draft.risk}
            </dd>
          </div>
          <div>
            <dt>Minimum AUM</dt>
            <dd>{formatUsd(draft.minAum, true)}</dd>
          </div>
          <div>
            <dt>Fee</dt>
            <dd>{draft.feeBps} bps</dd>
          </div>
          <div>
            <dt>Holdings</dt>
            <dd>{draft.holdingsSummary}</dd>
          </div>
          <div>
            <dt>ESG</dt>
            <dd>{draft.esgFlags}</dd>
          </div>
        </dl>
        <h3>Recommendations</h3>
        <ul className="desk-recs">
          {strategy.recommendations.map((rec) => {
            const decision = strategy.decisions[rec.id];
            return (
              <li key={rec.id}>
                <h3>{rec.title}</h3>
                <p>{rec.detail}</p>
                <p className="desk-price">{recommendationPreview(rec)}</p>
                <div className="desk-actions">
                  <button
                    type="button"
                    className="text-button"
                    aria-pressed={decision === "accept"}
                    onClick={() => decideRecommendation(strategy.id, rec.id, "accept")}
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    className="text-button"
                    aria-pressed={decision === "decline"}
                    onClick={() => decideRecommendation(strategy.id, rec.id, "decline")}
                  >
                    Decline
                  </button>
                  {decision ? <span className="desk-status">{decision === "accept" ? "Accepted" : "Declined"}</span> : null}
                </div>
              </li>
            );
          })}
        </ul>
        <div className="desk-actions">
          <button type="button" className="text-button" onClick={() => editStrategyAgain(strategy.id)}>
            Edit profile
          </button>
          <button type="button" className="text-button" disabled={!ready} onClick={() => submitStrategy(strategy.id)}>
            Submit for listing
          </button>
        </div>
        <p className="desk-price">Accept or decline each line. This is the only round. Listing is free.</p>
      </div>
    );
  }

  return (
    <form
      className="desk-work"
      onSubmit={(event) => {
        event.preventDefault();
        openRecommendations(strategy.id);
      }}
    >
      <p className="desk-steps">
        <span className="is-current">Edit</span>
        <span>Recommendations</span>
        <span>Submit</span>
      </p>
      <h2>{draft.sourceFile ? "Check the profile" : "New strategy"}</h2>
      {draft.sourceFile ? <p className="desk-price">Read from {draft.sourceFile}. Correct anything the read got wrong.</p> : null}
      <div className="desk-form-grid">
        <Field label="Name" value={draft.name} onChange={(name) => updateDraft(strategy.id, { name })} />
        <Field label="Objective" value={draft.objective} onChange={(objective) => updateDraft(strategy.id, { objective })} long />
        <SelectField
          label="Asset class"
          value={draft.assetClass}
          options={ASSET_CLASSES}
          onChange={(assetClass) => updateDraft(strategy.id, { assetClass })}
        />
        <SelectField label="Risk" value={draft.risk} options={RISK_LEVELS} onChange={(risk) => updateDraft(strategy.id, { risk })} />
        <Field label="Style" value={draft.style} onChange={(style) => updateDraft(strategy.id, { style })} />
        <Field label="Benchmark" value={draft.benchmark} onChange={(benchmark) => updateDraft(strategy.id, { benchmark })} />
        <Field
          label="Minimum AUM"
          value={String(draft.minAum)}
          onChange={(value) => updateDraft(strategy.id, { minAum: Number(value) })}
          numeric
        />
        <Field
          label="Fee (bps)"
          value={String(draft.feeBps)}
          onChange={(value) => updateDraft(strategy.id, { feeBps: Number(value) })}
          numeric
        />
        <Field
          label="Liquidity"
          value={draft.liquidity}
          onChange={(liquidity) => updateDraft(strategy.id, { liquidity })}
        />
        <Field
          label="Holdings summary"
          value={draft.holdingsSummary}
          onChange={(holdingsSummary) => updateDraft(strategy.id, { holdingsSummary })}
          long
        />
        <Field label="ESG flags" value={draft.esgFlags} onChange={(esgFlags) => updateDraft(strategy.id, { esgFlags })} long />
      </div>
      <button type="submit" className="text-button">
        Review recommendations
      </button>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  long = false,
  numeric = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  long?: boolean;
  numeric?: boolean;
}) {
  return (
    <label className={`desk-field ${long ? "is-wide" : ""}`}>
      <span>{label}</span>
      {long ? (
        <textarea rows={3} value={value} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input
          type={numeric ? "number" : "text"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  const choices = options.includes(value) ? options : [value, ...options];
  return (
    <label className="desk-field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {choices.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

export function InstitutionPitches() {
  const { pitches, activePitchId, openPitch, updatePitch, startPitch, sendPitch, sendPrice } = useInstitutional();
  const active = pitches.find((pitch) => pitch.id === activePitchId) ?? null;
  const [notice, setNotice] = useState<string | null>(null);

  return (
    <div className="desk-page">
      <h1>Pitches</h1>
      <p className="lede-quiet">A pitch is a name, a solution, and a price for one household. Confirm the household before it sends.</p>
      <p className="desk-price">${sendPrice.toLocaleString("en-US")} to send a pitch. Listing a strategy is free.</p>
      <button type="button" className="text-button" onClick={startPitch}>
        New pitch
      </button>
      {active ? (
        <PitchEditor
          pitch={active}
          notice={notice}
          onNotice={setNotice}
          onChange={(patch) => updatePitch(active.id, patch)}
          onSend={(clientId) => setNotice(sendPitch(active.id, clientId))}
        />
      ) : null}
      <ul className="desk-own-list">
        {pitches.map((pitch) => (
          <li key={pitch.id}>
            <button type="button" onClick={() => openPitch(pitch.id)} aria-pressed={pitch.id === activePitchId}>
              <span>{pitch.name || "Untitled pitch"}</span>
              <span className="desk-status">{pitch.sent.length ? `Sent · ${pitch.sent.length}` : "Draft"}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PitchEditor({
  pitch,
  notice,
  onNotice,
  onChange,
  onSend,
}: {
  pitch: DeskPitch;
  notice: string | null;
  onNotice: (value: string | null) => void;
  onChange: (patch: Partial<DeskPitch>) => void;
  onSend: (clientId: string) => void;
}) {
  const { book } = useInstitutional();
  const ordered = [...book].sort((a, b) => {
    const aMatch = matchesNewYorkPitch(a) && /new york/i.test(pitch.audienceNote) ? 0 : 1;
    const bMatch = matchesNewYorkPitch(b) && /new york/i.test(pitch.audienceNote) ? 0 : 1;
    return aMatch - bMatch || b.householdAum - a.householdAum;
  });

  return (
    <form
      className="desk-work"
      onSubmit={(event) => {
        event.preventDefault();
        if (!pitch.targetClientId) {
          onNotice("Choose a household. Targeting is not confirmed yet.");
          return;
        }
        onSend(pitch.targetClientId);
      }}
    >
      {pitch.audienceNote ? <p className="desk-price">{pitch.audienceNote}</p> : null}
      <div className="desk-form-grid">
        <label className="desk-field is-wide">
          <span>Name</span>
          <input value={pitch.name} onChange={(event) => onChange({ name: event.target.value })} />
        </label>
        <label className="desk-field is-wide">
          <span>Customized solution</span>
          <textarea rows={4} value={pitch.solution} onChange={(event) => onChange({ solution: event.target.value })} />
        </label>
        <label className="desk-field is-wide">
          <span>Unique pricing</span>
          <textarea rows={2} value={pitch.pricing} onChange={(event) => onChange({ pricing: event.target.value })} />
        </label>
        <label className="desk-field is-wide">
          <span>Target household</span>
        <select
          value={pitch.targetClientId ?? ""}
          onChange={(event) => onChange({ targetClientId: event.target.value || null })}
        >
          <option value="">Leave unconfirmed</option>
          {ordered.map((row) => {
            const matched = /new york/i.test(pitch.audienceNote) && matchesNewYorkPitch(row);
            return (
              <option key={row.id} value={row.id}>
                {row.ref} · age {row.age} · {formatLocation(row)} · {formatUsd(row.householdAum, true)}
                {matched ? " · matches this draft" : ""}
              </option>
            );
          })}
        </select>
        </label>
      </div>
      {/new york/i.test(pitch.audienceNote) ? (
        <p className="desk-price">
          {ordered
            .filter((row) => matchesNewYorkPitch(row))
            .map((row) => row.ref)
            .join(", ") || "No household"}{" "}
          matches this draft. Targeting stays open until you choose one.
        </p>
      ) : null}
      <div className="desk-send">
        <button type="submit" className="text-button">
          Send pitch
        </button>
        <span className="desk-price">${PITCH_SEND_USD.toLocaleString("en-US")}</span>
      </div>
      {pitch.sent.length > 0 ? (
        <p className="desk-price">
          Already sent to{" "}
          {pitch.sent
            .map((delivery) => refFor(book, delivery.clientId))
            .filter((ref): ref is string => Boolean(ref))
            .join(", ")}
          .
        </p>
      ) : null}
      {notice ? <p aria-live="polite">{notice}</p> : null}
    </form>
  );
}

export function InstitutionSettings() {
  const { email, billing, charges } = useInstitutional();
  return (
    <div className="settings-page">
      <h1>Profile</h1>
      <p className="lede-quiet">Desk profile for billing. Figures here are the demo book.</p>
      <dl>
        <div>
          <dt>Email</dt>
          <dd>{email}</dd>
        </div>
        <div>
          <dt>Billing destination</dt>
          <dd>{billing}</dd>
        </div>
      </dl>
      <h2>Recent charges</h2>
      <ul className="desk-charges">
        {charges.map((charge) => (
          <li key={charge.id}>
            <span>{charge.when}</span>
            <span>{charge.label}</span>
            <span>{formatUsd(charge.amount)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

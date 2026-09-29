import { useEffect, useMemo, useRef, useState } from "react";
import { formatUsd } from "../../../shared/format.ts";
import { StrategiesCatalog } from "../../components/StrategiesCatalog";
import { useInstitutional } from "../../context/InstitutionalContext";
import {
  ASSET_CLASSES,
  formatLocation,
  matchesNewYorkPitch,
  postedCatalogProfile,
  PITCH_SEND_USD,
  recommendationPreview,
  refFor,
  RISK_LEVELS,
  SAMPLE_CLEAN_FILE,
  SAMPLE_RECONCILE_FILE,
  sleeveTotal,
  statusLabel,
  type AllocationSleeve,
  type DeskPitch,
  type OwnedStrategy,
  type StrategyProfileDraft,
} from "../../institution/desk";

const OWN_LIST_LIMIT = 3;

export function InstitutionStrategies() {
  const desk = useInstitutional();
  const [pane, setPane] = useState<"search" | "create">(desk.preferCreate ? "create" : "search");

  useEffect(() => {
    if (!desk.preferCreate) return;
    setPane("create");
    desk.clearPreferCreate();
  }, [desk.preferCreate, desk.clearPreferCreate]);

  const posted = useMemo(
    () => desk.strategies.map(postedCatalogProfile).filter((row) => row != null),
    [desk.strategies],
  );
  const yours = useMemo(() => new Set(posted.map((row) => row.id)), [posted]);

  return (
    <div className="desk-page">
      <h1>Strategies</h1>
      <div className="desk-tabs" role="tablist" aria-label="Strategies">
        <button type="button" role="tab" aria-selected={pane === "search"} onClick={() => setPane("search")}>
          Search
        </button>
        <button type="button" role="tab" aria-selected={pane === "create"} onClick={() => setPane("create")}>
          Create
        </button>
      </div>
      {pane === "search" ? (
        <div role="tabpanel">
          <StrategiesCatalog added={posted} yours={yours} investable={null} heading={false} />
        </div>
      ) : (
        <div role="tabpanel">
          <CreatePane />
        </div>
      )}
    </div>
  );
}

function CreatePane() {
  const desk = useInstitutional();
  const fileRef = useRef<HTMLInputElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [pendingRemove, setPendingRemove] = useState<string | null>(null);
  const active = desk.strategies.find((strategy) => strategy.id === desk.activeStrategyId) ?? null;
  const hidden = Math.max(0, desk.strategies.length - OWN_LIST_LIMIT);
  const visible = expanded ? desk.strategies : desk.strategies.slice(0, OWN_LIST_LIMIT);

  return (
    <section className="desk-block">
      <h2>Your strategies</h2>
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
      {active ? <StrategyWork strategy={active} /> : null}
      <ul className="desk-own-list desk-strategy-list">
        {visible.map((strategy) => (
          <li key={strategy.id}>
            <div className="desk-own-main">
              <span>{strategy.draft.name || "Untitled strategy"}</span>
              <span className={`desk-status ${strategy.status === "posted" ? "is-posted" : ""}`}>
                {statusLabel(strategy.status)}
              </span>
            </div>
            {pendingRemove === strategy.id ? (
              <div className="desk-own-actions">
                <span className="desk-price">Remove this strategy?</span>
                <button type="button" className="text-button" onClick={() => desk.removeStrategy(strategy.id)}>
                  Remove
                </button>
                <button type="button" className="text-button" onClick={() => setPendingRemove(null)}>
                  Cancel
                </button>
              </div>
            ) : (
              <div className="desk-own-actions">
                <button type="button" className="text-button" onClick={() => desk.editListedStrategy(strategy.id)}>
                  Edit
                </button>
                <button type="button" className="text-button" onClick={() => setPendingRemove(strategy.id)}>
                  Remove
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
      {hidden > 0 ? (
        <button type="button" className="desk-more" onClick={() => setExpanded((current) => !current)}>
          {expanded ? "Show less" : `Show ${hidden} more`}
        </button>
      ) : null}
    </section>
  );
}

function StrategyWork({ strategy }: { strategy: OwnedStrategy }) {
  const { updateDraft, openRecommendations, decideRecommendation, submitStrategy, editStrategyAgain, saveListedStrategy } =
    useInstitutional();
  const draft = strategy.draft;
  const savingListing = Boolean(strategy.resumeStatus);
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
        <ProfileRead draft={draft} />
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

  const total = sleeveTotal(draft.sleeves);
  const off = Math.abs(total - 100) > 1;

  function patchSleeve(sleeveId: string, patch: Partial<AllocationSleeve>) {
    updateDraft(strategy.id, {
      sleeves: draft.sleeves.map((row) => (row.id === sleeveId ? { ...row, ...patch } : row)),
    });
  }

  return (
    <form
      className="desk-work"
      onSubmit={(event) => {
        event.preventDefault();
        if (savingListing) saveListedStrategy(strategy.id);
        else openRecommendations(strategy.id);
      }}
    >
      {savingListing ? null : (
        <p className="desk-steps">
          <span className="is-current">Edit</span>
          <span>Recommendations</span>
          <span>Submit</span>
        </p>
      )}
      <h2>{savingListing ? "Edit strategy" : draft.sourceFile ? "Check the profile" : "New strategy"}</h2>
      {draft.sourceFile ? <p className="desk-price">Read from {draft.sourceFile}. Correct anything the read got wrong.</p> : null}
      {savingListing ? (
        <p className="desk-price">
          Save updates this listing in place.{" "}
          <button type="submit" className="text-button">
            Save
          </button>
        </p>
      ) : null}

      <section className="desk-section">
        <h3>Identity</h3>
        <div className="desk-form-grid">
          <Field label="Name" value={draft.name} onChange={(name) => updateDraft(strategy.id, { name })} />
          <Field label="Vehicle" value={draft.vehicle} onChange={(vehicle) => updateDraft(strategy.id, { vehicle })} />
          <Field label="Style" value={draft.style} onChange={(style) => updateDraft(strategy.id, { style })} />
          <Field
            label="Investor profile"
            value={draft.investorProfile}
            onChange={(investorProfile) => updateDraft(strategy.id, { investorProfile })}
          />
          <Field label="Tax posture" value={draft.taxPosture} onChange={(taxPosture) => updateDraft(strategy.id, { taxPosture })} />
          <Field
            label="Benchmark adherence"
            value={draft.benchmarkAdherence}
            onChange={(benchmarkAdherence) => updateDraft(strategy.id, { benchmarkAdherence })}
          />
          <Field label="As of" value={draft.asOf} onChange={(asOf) => updateDraft(strategy.id, { asOf })} />
          <SelectField
            label="Asset class"
            value={draft.assetClass}
            options={ASSET_CLASSES}
            onChange={(assetClass) => updateDraft(strategy.id, { assetClass })}
          />
        </div>
      </section>

      <section className="desk-section">
        <h3>Objective and process</h3>
        <div className="desk-form-grid">
          <Field label="Objective" value={draft.objective} onChange={(objective) => updateDraft(strategy.id, { objective })} long />
          <Field label="Process" value={draft.process} onChange={(process) => updateDraft(strategy.id, { process })} long />
          <Field label="Horizon" value={draft.horizon} onChange={(horizon) => updateDraft(strategy.id, { horizon })} long />
        </div>
      </section>

      <section className="desk-section">
        <h3>Allocation</h3>
        <p className={`desk-total ${off ? "is-off" : ""}`}>
          {total}% of the book{off ? ". The sleeves should add to 100." : "."}
        </p>
        <ul className="desk-sleeves">
          {draft.sleeves.map((row) => (
            <li key={row.id} className="desk-sleeve">
              <Field label="Sleeve" value={row.label} onChange={(label) => patchSleeve(row.id, { label })} />
              <Field
                label="Weight %"
                value={String(row.weightPct)}
                numeric
                onChange={(value) => patchSleeve(row.id, { weightPct: Number(value) })}
              />
              <Field label="Vehicle" value={row.vehicle} onChange={(vehicle) => patchSleeve(row.id, { vehicle })} />
              <Field label="Range" value={row.range} onChange={(range) => patchSleeve(row.id, { range })} />
              <Field
                label="Holdings"
                value={row.holdingsNote}
                onChange={(holdingsNote) => patchSleeve(row.id, { holdingsNote })}
              />
              <button
                type="button"
                className="text-button desk-sleeve-remove"
                onClick={() =>
                  updateDraft(strategy.id, { sleeves: draft.sleeves.filter((item) => item.id !== row.id) })
                }
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="text-button"
          onClick={() =>
            updateDraft(strategy.id, {
              sleeves: [
                ...draft.sleeves,
                {
                  id: `sleeve-${draft.sleeves.length + 1}-${Date.now()}`,
                  label: "",
                  weightPct: 0,
                  vehicle: "SMA",
                  range: "",
                  holdingsNote: "",
                },
              ],
            })
          }
        >
          Add sleeve
        </button>
      </section>

      <section className="desk-section">
        <h3>Characteristics</h3>
        <div className="desk-form-grid">
          <Field
            label="Holdings count"
            value={draft.holdingsCount}
            onChange={(holdingsCount) => updateDraft(strategy.id, { holdingsCount })}
          />
          <Field label="Turnover" value={draft.turnover} onChange={(turnover) => updateDraft(strategy.id, { turnover })} />
          <Field
            label="Invests within"
            value={draft.investsWithin}
            onChange={(investsWithin) => updateDraft(strategy.id, { investsWithin })}
          />
          <Field label="Benchmark" value={draft.benchmark} onChange={(benchmark) => updateDraft(strategy.id, { benchmark })} />
          <Field
            label="Tracking"
            value={draft.trackingNote}
            onChange={(trackingNote) => updateDraft(strategy.id, { trackingNote })}
            long
          />
        </div>
      </section>

      <section className="desk-section">
        <h3>Risk and suitability</h3>
        <div className="desk-form-grid">
          <SelectField label="Risk" value={draft.risk} options={RISK_LEVELS} onChange={(risk) => updateDraft(strategy.id, { risk })} />
          <Field
            label="Volatility"
            value={draft.volatilityNote}
            onChange={(volatilityNote) => updateDraft(strategy.id, { volatilityNote })}
            long
          />
          <Field
            label="Suitability"
            value={draft.suitability}
            onChange={(suitability) => updateDraft(strategy.id, { suitability })}
            long
          />
        </div>
      </section>

      <section className="desk-section">
        <h3>Fee and minimum</h3>
        <div className="desk-form-grid">
          <Field
            label="Fee (bps)"
            value={String(draft.feeBps)}
            onChange={(value) => updateDraft(strategy.id, { feeBps: Number(value) })}
            numeric
          />
          <Field
            label="Minimum AUM"
            value={String(draft.minAum)}
            onChange={(value) => updateDraft(strategy.id, { minAum: Number(value) })}
            numeric
          />
          <Field label="What the fee covers" value={draft.feeNote} onChange={(feeNote) => updateDraft(strategy.id, { feeNote })} long />
          <Field label="ESG" value={draft.esgFlags} onChange={(esgFlags) => updateDraft(strategy.id, { esgFlags })} long />
          <Field
            label="Holdings summary"
            value={draft.holdingsSummary}
            onChange={(holdingsSummary) => updateDraft(strategy.id, { holdingsSummary })}
            long
          />
        </div>
      </section>

      <button type="submit" className="text-button">
        {savingListing ? "Save" : "Review recommendations"}
      </button>
    </form>
  );
}

function ProfileRead({ draft }: { draft: StrategyProfileDraft }) {
  const total = sleeveTotal(draft.sleeves);
  const off = Math.abs(total - 100) > 1;
  return (
    <>
      <p className="desk-price">
        {draft.vehicle} · {draft.investorProfile} · {draft.taxPosture} · {draft.asOf}
      </p>
      <dl className="desk-facts">
        <div>
          <dt>Objective</dt>
          <dd>{draft.objective}</dd>
        </div>
        <div>
          <dt>Process</dt>
          <dd>{draft.process}</dd>
        </div>
        <div>
          <dt>Allocation</dt>
          <dd>
            <ul className="desk-sleeve-read">
              {draft.sleeves.map((row) => (
                <li key={row.id}>
                  <span>{row.label || "Untitled sleeve"}</span>
                  <span>
                    {row.weightPct}% · {row.vehicle}
                    {row.range ? ` · ${row.range}` : ""}
                  </span>
                </li>
              ))}
            </ul>
            <p className={`desk-total ${off ? "is-off" : ""}`}>
              {total}% of the book{off ? ". The sleeves should add to 100." : "."}
            </p>
          </dd>
        </div>
        <div>
          <dt>Characteristics</dt>
          <dd>
            {draft.holdingsCount} holdings · turnover {draft.turnover} · invests within {draft.investsWithin}. Benchmark{" "}
            {draft.benchmark}. {draft.trackingNote}
          </dd>
        </div>
        <div>
          <dt>Risk</dt>
          <dd>
            {draft.risk}. {draft.volatilityNote} {draft.suitability}
          </dd>
        </div>
        <div>
          <dt>Fee</dt>
          <dd>
            {draft.feeBps} bps · minimum {formatUsd(draft.minAum, true)}. {draft.feeNote}
          </dd>
        </div>
        <div>
          <dt>ESG</dt>
          <dd>{draft.esgFlags}</dd>
        </div>
      </dl>
    </>
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

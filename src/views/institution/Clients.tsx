import { useEffect, useMemo, useState } from "react";
import { formatUsd } from "../../../shared/format.ts";
import {
  filterAnon,
  formatLocation,
  type AnonClient,
} from "../../institution/desk";
import { useInstitutional } from "../../context/InstitutionalContext";

export function InstitutionClients() {
  const { book, pitches, sendPitch } = useInstitutional();
  const [query, setQuery] = useState("");
  const [state, setState] = useState("");
  const [minAum, setMinAum] = useState(0);
  const [firmOnly, setFirmOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const states = useMemo(() => [...new Set(book.map((row) => row.state))].sort(), [book]);
  const rows = useMemo(
    () => filterAnon(book, { query, state, minAum, firmOnly }),
    [book, firmOnly, minAum, query, state],
  );
  const selected = book.find((row) => row.id === selectedId) ?? null;

  return (
    <div className="desk-page">
      <h1>Clients</h1>
      <p className="lede-quiet">
        Households on the platform, without names. Open one to see what is already at your firm, or to send a pitch.
      </p>
      <div className="desk-tools">
        <label className="desk-field desk-search">
          <span className="sr-only">Search households</span>
          <input
            type="search"
            value={query}
            placeholder="Search state, country, or age"
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <label className="desk-field">
          <span className="sr-only">State</span>
          <select value={state} onChange={(event) => setState(event.target.value)}>
            <option value="">All states</option>
            {states.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </label>
        <label className="desk-field">
          <span className="sr-only">Minimum household AUM</span>
          <select value={String(minAum)} onChange={(event) => setMinAum(Number(event.target.value))}>
            <option value="0">Any household AUM</option>
            <option value="10000000">$10M and above</option>
            <option value="25000000">$25M and above</option>
            <option value="50000000">$50M and above</option>
            <option value="100000000">$100M and above</option>
          </select>
        </label>
        <label className="desk-check">
          <input type="checkbox" checked={firmOnly} onChange={(event) => setFirmOnly(event.target.checked)} />
          Already with your firm
        </label>
      </div>
      <div className="desk-table" role="table" aria-label="Anonymized clients">
        <div className="desk-head" role="row">
          <span role="columnheader">Age</span>
          <span role="columnheader">Location</span>
          <span role="columnheader">Household AUM</span>
        </div>
        {rows.length === 0 ? <p className="lede-quiet">No households match.</p> : null}
        <ul className="desk-rows">
          {rows.map((row) => (
            <li key={row.id}>
              <button
                type="button"
                role="row"
                aria-pressed={row.id === selectedId}
                onClick={() => setSelectedId(row.id)}
              >
                <span>{row.age}</span>
                <span>{formatLocation(row)}</span>
                <span>{formatUsd(row.householdAum, true)}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      {selected ? (
        <ClientSheet
          row={selected}
          pitches={pitches.map((pitch) => ({ id: pitch.id, name: pitch.name, pricing: pitch.pricing }))}
          onClose={() => setSelectedId(null)}
          onSend={(pitchId) => sendPitch(pitchId, selected.id)}
        />
      ) : null}
    </div>
  );
}

function ClientSheet({
  row,
  pitches,
  onClose,
  onSend,
}: {
  row: AnonClient;
  pitches: { id: string; name: string; pricing: string }[];
  onClose: () => void;
  onSend: (pitchId: string) => string;
}) {
  const [pitchId, setPitchId] = useState(pitches[0]?.id ?? "");
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="desk-sheet-backdrop" onClick={onClose}>
      <aside
        className="desk-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="client-sheet-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className="text-button" onClick={onClose}>
          Close
        </button>
        <h2 id="client-sheet-title">{row.ref}</h2>
        <dl className="desk-facts">
          <div>
            <dt>Age</dt>
            <dd>{row.age}</dd>
          </div>
          <div>
            <dt>Location</dt>
            <dd>{formatLocation(row)}</dd>
          </div>
          <div>
            <dt>Household AUM</dt>
            <dd>{formatUsd(row.householdAum)}</dd>
          </div>
        </dl>
        {row.withFirm != null ? (
          <div className="desk-overlap">
            <h3>Already with your firm</h3>
            <ul>
              {row.firmAccounts.map((account) => (
                <li key={`${account.type}-${account.balance}`}>
                  {account.type} · {formatUsd(account.balance)}
                </li>
              ))}
            </ul>
            <p>With your firm {formatUsd(row.withFirm)}. Elsewhere {formatUsd(row.elsewhere ?? 0)}.</p>
          </div>
        ) : (
          <p className="lede-quiet">No account at your firm on the record.</p>
        )}
        <h3>Pitch to this client</h3>
        {pitches.length === 0 ? (
          <p className="lede-quiet">Draft a pitch first, then send it from here.</p>
        ) : (
          <form
            className="desk-form"
            onSubmit={(event) => {
              event.preventDefault();
              if (!pitchId) return;
              setNotice(onSend(pitchId));
            }}
          >
            <label className="desk-field">
              <span>Pitch</span>
              <select value={pitchId} onChange={(event) => setPitchId(event.target.value)}>
                {pitches.map((pitch) => (
                  <option key={pitch.id} value={pitch.id}>
                    {pitch.name} · {pitch.pricing}
                  </option>
                ))}
              </select>
            </label>
            <div className="desk-send">
              <button type="submit" className="text-button">
                Send pitch
              </button>
              <span className="desk-price">$1,800</span>
            </div>
            {notice ? <p aria-live="polite">{notice}</p> : null}
          </form>
        )}
      </aside>
    </div>
  );
}

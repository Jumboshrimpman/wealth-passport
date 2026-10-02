import { useState } from "react";
import { managerLine } from "../data/assistantFlow";
import { useAcceptedOffers } from "../context/AcceptedOffersContext";

/** One collapsed block for every enrollment. The catalog below is not filtered. */
export function EnrolledPin() {
  const { accepted } = useAcceptedOffers();
  const rows = Object.values(accepted);
  const [open, setOpen] = useState(false);
  if (rows.length === 0) return null;

  const summary = rows.length === 1 ? "Enrolled strategies" : `Enrolled strategies · ${rows.length}`;

  return (
    <section className="enrolled-pin" aria-label="Enrolled strategies" data-testid="enrolled-pin">
      <button type="button" className="enrolled-toggle" aria-expanded={open} onClick={() => setOpen((current) => !current)}>
        <span>{summary}</span>
        <span className="enrolled-toggle-hint">{open ? "Hide" : "Show"}</span>
      </button>
      {open ? (
        <ul className="enrolled-list">
          {rows.map((row) => (
            <li key={`${row.accountName}-${row.choiceId}`}>
              <p>
                <strong>{row.strategy}</strong>
                <span> for {row.accountName}</span>
              </p>
              <p className="enrolled-meta">{managerLine(row)}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

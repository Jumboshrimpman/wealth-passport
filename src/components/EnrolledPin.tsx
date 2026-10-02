import { useState } from "react";
import { managerLine } from "../data/assistantFlow";
import { useAcceptedOffers } from "../context/AcceptedOffersContext";

/** Collapsed by default. The catalog below still lists the same strategy. */
export function EnrolledPin() {
  const { accepted } = useAcceptedOffers();
  const rows = Object.values(accepted);
  const [open, setOpen] = useState(false);
  if (rows.length === 0) return null;

  const summary =
    rows.length === 1
      ? `Enrolled in ${rows[0].strategy} for ${rows[0].accountName}`
      : `Enrolled · ${rows.length}`;

  return (
    <section className="enrolled-pin" aria-label="Enrolled strategies" data-testid="enrolled-pin">
      <button type="button" className="enrolled-toggle" aria-expanded={open} onClick={() => setOpen((current) => !current)}>
        <span>{summary}</span>
        <span className="enrolled-toggle-hint">{open ? "Hide" : "Show"}</span>
      </button>
      {open
        ? rows.map((row) => (
            <article key={`${row.accountName}-${row.choiceId}`}>
              <p className="enrolled-flag">Enrolled</p>
              <h2>
                You&rsquo;re enrolled in {row.strategy} for {row.accountName}.
              </h2>
              <p className="enrolled-meta">{managerLine(row)}</p>
            </article>
          ))
        : null}
    </section>
  );
}

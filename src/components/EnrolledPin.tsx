import { managerLine } from "../data/assistantFlow";
import { useAcceptedOffers } from "../context/AcceptedOffersContext";

export function EnrolledPin({ presentation }: { presentation: "pin" | "ledger" }) {
  const { accepted } = useAcceptedOffers();
  const rows = Object.values(accepted);
  if (rows.length === 0) return null;

  if (presentation === "ledger") {
    return (
      <section className="enrolled-ledger" aria-label="Enrolled strategies">
        <h2>Enrolled</h2>
        <ul>
          {rows.map((row) => (
            <li key={`${row.accountName}-${row.choiceId}`}>
              <span className="enrolled-flag">Enrolled</span>
              <p>
                <strong>{row.accountName}</strong>
                <span> → {row.strategy}</span>
              </p>
              <p className="enrolled-meta">{managerLine(row)}</p>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  return (
    <section className="enrolled-pin" aria-label="Enrolled strategies">
      {rows.map((row) => (
        <article key={`${row.accountName}-${row.choiceId}`}>
          <p className="enrolled-flag">Enrolled</p>
          <h2>
            You&rsquo;re enrolled in {row.strategy} for {row.accountName}.
          </h2>
          <p className="enrolled-meta">{managerLine(row)}</p>
        </article>
      ))}
    </section>
  );
}

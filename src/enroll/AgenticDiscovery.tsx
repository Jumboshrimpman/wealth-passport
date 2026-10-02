import { useEffect, useState } from "react";
import { crawlGaps, planAgenticCrawl, type AgenticSource } from "../../shared/agenticCrawl.ts";
import { fundriseAmount } from "../../shared/marketplace.ts";
import type { ClientPassport } from "../../shared/types.ts";

const CONSENT_KEY = "wealthpass-agentic-consent-v1";

type RowStatus = "waiting" | "searching" | "found" | "missing";

interface CrawlRow extends AgenticSource {
  status: RowStatus;
}

function readRevoked(): boolean {
  try {
    return sessionStorage.getItem(CONSENT_KEY) === "revoke";
  } catch {
    return false;
  }
}

function writeConsent(value: "allow" | "revoke") {
  try {
    sessionStorage.setItem(CONSENT_KEY, value);
  } catch {
    // The checkbox still gates this tab.
  }
}

export function AgenticDiscovery({
  passport,
  onContinue,
  onBack,
}: {
  passport: ClientPassport;
  /** Full simulated result. The parent sends gaps through Plaid. */
  onContinue: (sources: AgenticSource[]) => void;
  onBack: () => void;
}) {
  const [revoked, setRevoked] = useState(readRevoked);
  const [consent, setConsent] = useState(false);
  const [stage, setStage] = useState<"consent" | "crawl">("consent");
  const [rows, setRows] = useState<CrawlRow[]>([]);
  const [done, setDone] = useState(false);

  const plan = planAgenticCrawl({
    custodians: passport.accounts.map((account) => account.custodian),
    fundrise: fundriseAmount(passport),
  });

  useEffect(() => {
    if (stage !== "crawl") return;
    setDone(false);
    setRows(plan.map((source) => ({ ...source, status: "waiting" })));
    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setRows(
        plan.map((source, sourceIndex) => {
          if (sourceIndex < index - 1) return { ...source, status: source.found ? "found" : "missing" };
          if (sourceIndex === index - 1) return { ...source, status: "searching" };
          return { ...source, status: "waiting" };
        }),
      );
      if (index > plan.length) {
        window.clearInterval(timer);
        setRows(plan.map((source) => ({ ...source, status: source.found ? "found" : "missing" })));
        setDone(true);
      }
    }, 700);
    return () => window.clearInterval(timer);
    // The plan is derived from the household on screen. Restart only when that household changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, passport.id]);

  function revoke() {
    writeConsent("revoke");
    setRevoked(true);
    setConsent(false);
    setStage("consent");
    setRows([]);
    setDone(false);
  }

  function start() {
    if (!consent) return;
    writeConsent("allow");
    setRevoked(false);
    setStage("crawl");
  }

  if (stage === "consent") {
    return (
      <section className="agentic-card" data-testid="agentic-consent">
        <h2>Local browser helper</h2>
        <p>Demo only. This is a simulation. It is not a Chrome extension, and it does not read saved passwords or the keychain.</p>
        <ul className="agentic-points">
          <li>You can opt in to a local WealthPass helper that may use allowlisted saved finance logins or sessions on this device.</li>
          <li>Credentials are not uploaded to WealthPass servers. WealthPass cloud does not read passwords.</li>
          <li>You can revoke this permission. A real helper would run locally. This screen only pretends to look.</li>
        </ul>
        {revoked ? <p className="agentic-revoke">You revoked the local helper. It stays off until you opt in again.</p> : null}
        <label className="accept-modal-check">
          <input
            type="checkbox"
            checked={consent}
            onChange={(event) => setConsent(event.target.checked)}
          />
          <span>I opt in to the simulated local helper. My passwords are not sent to WealthPass.</span>
        </label>
        <div className="enroll-actions">
          <button type="button" className="enroll-primary" disabled={!consent} onClick={start}>
            Start simulated crawl
          </button>
          <button type="button" className="text-button" onClick={onBack}>
            Use another path
          </button>
        </div>
      </section>
    );
  }

  const seen = rows.filter((row) => row.status === "found" || row.status === "missing").length;
  const gaps = crawlGaps(plan);

  return (
    <section className="agentic-card" data-testid="agentic-crawl">
      <h2>Looking on this device</h2>
      <p>
        Simulated crawl of allowlisted finance sessions. {seen} of {plan.length}. Passwords are not read. Nothing is uploaded.
      </p>
      <ol className="agentic-crawl">
        {rows.map((row) => (
          <li key={row.id} data-status={row.status}>
            <span className="agentic-name">{row.label}</span>
            <span className="agentic-status">
              {row.status === "waiting" ? "Waiting" : row.status === "searching" ? "Looking…" : row.found ? "Found" : "Not found"}
            </span>
            {row.status === "found" || row.status === "missing" ? <span className="agentic-detail">{row.detail}</span> : null}
          </li>
        ))}
      </ol>
      <div className="enroll-actions">
        <button type="button" className="enroll-primary" disabled={!done} onClick={() => onContinue(plan)}>
          {gaps.length > 0 ? "Use Plaid for what wasn’t found" : "Continue"}
        </button>
        <button type="button" className="text-button" onClick={revoke}>
          Revoke helper
        </button>
      </div>
    </section>
  );
}

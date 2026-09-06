import { useState, type FormEvent, type ReactNode } from "react";
import { DEMO_NOTICE, DEMO_PASSWORD, PRODUCT_NAME, TAGLINE } from "../data/mock";

const AUTH_KEY = "wealthpass-mock-unlocked";

function readUnlocked(): boolean {
  try {
    return sessionStorage.getItem(AUTH_KEY) === "1" || localStorage.getItem(AUTH_KEY) === "1";
  } catch {
    return false;
  }
}

function persistUnlocked() {
  try {
    sessionStorage.setItem(AUTH_KEY, "1");
    localStorage.setItem(AUTH_KEY, "1");
  } catch {
    throw new Error(
      "MOCK AUTH FAILURE: sessionStorage/localStorage is blocked. WealthPass cannot unlock this GitHub Pages demo without browser storage.",
    );
  }
}

export function PasswordGate({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(readUnlocked);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== DEMO_PASSWORD) {
      setError(
        "MOCK AUTH FAILURE: that password is wrong. This is not Clerk, SSO, or a live identity provider. The demo password is documented in the repository README.",
      );
      return;
    }
    try {
      persistUnlocked();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "MOCK AUTH FAILURE: storage write failed.");
      return;
    }
    setError("");
    setUnlocked(true);
  }

  if (unlocked) return children;

  return (
    <div className="gate">
      <div className="mock-banner" role="status">
        <div className="mock-banner-inner">
          <strong>Mock demo</strong>
          <span>{DEMO_NOTICE}</span>
        </div>
      </div>
      <main className="gate-main">
        <section className="panel gate-card">
          <p className="kicker">Password barrier · MOCK</p>
          <div className="wordmark">{PRODUCT_NAME}</div>
          <p className="lede">{TAGLINE}</p>
          <p className="muted">
            The walkthrough is blocked until the demo password is entered. Nothing is authenticated
            against a server.
          </p>
          <form className="stack" onSubmit={onSubmit}>
            <label className="field-label">
              <span>Demo password</span>
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  if (error) setError("");
                }}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? "gate-error" : undefined}
              />
            </label>
            <button type="submit" className="gate-submit">
              Unlock {PRODUCT_NAME}
            </button>
          </form>
          {error ? (
            <aside id="gate-error" className="gate-error" role="alert">
              {error}
            </aside>
          ) : null}
        </section>
      </main>
    </div>
  );
}

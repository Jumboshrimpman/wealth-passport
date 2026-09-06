import { SignIn, useAuth } from "@clerk/clerk-react";
import type { ReactNode } from "react";
import { clerkAppearance } from "../auth/clerk";
import { DEMO_NOTICE, PRODUCT_NAME, TAGLINE } from "../data/mock";

export function ClerkGate({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <GateShell>
        <p className="kicker">Clerk · connecting</p>
        <h1>Opening the WealthPass gate…</h1>
        <p className="muted">Waiting on Clerk. If this hangs, the publishable key or Clerk Frontend API is not reachable.</p>
      </GateShell>
    );
  }

  if (!isSignedIn) {
    return (
      <GateShell>
        <p className="kicker">Clerk sign-in · required</p>
        <div className="wordmark">{PRODUCT_NAME}</div>
        <p className="lede">{TAGLINE}</p>
        <p className="muted">
          The walkthrough is blocked until you sign in with Clerk. Holdings stay mock fixtures.
          There is no local password fallback.
        </p>
        <SignIn
          routing="hash"
          forceRedirectUrl={import.meta.env.BASE_URL}
          fallbackRedirectUrl={import.meta.env.BASE_URL}
          appearance={clerkAppearance}
          fallback={
            <aside className="gate-error" role="alert">
              CLERK FAILURE: the Sign-in component did not load. Check VITE_CLERK_PUBLISHABLE_KEY
              and Clerk allowed origins for this GitHub Pages host (
              https://jumboshrimpman.github.io and http://localhost:5173).
            </aside>
          }
        />
      </GateShell>
    );
  }

  return children;
}

function GateShell({ children }: { children: ReactNode }) {
  return (
    <div className="gate">
      <div className="mock-banner" role="status">
        <div className="mock-banner-inner">
          <strong>Mock demo · {PRODUCT_NAME}</strong>
          <span>{DEMO_NOTICE}</span>
        </div>
      </div>
      <main className="gate-main">
        <section className="panel gate-card">{children}</section>
      </main>
    </div>
  );
}

import { UserButton } from "@clerk/clerk-react";
import { NavLink, Outlet } from "react-router-dom";
import { clerkAppearance } from "../auth/clerk";
import { ClientSwitcher } from "./ClientSwitcher";
import { useClient } from "../context/ClientContext";
import { useMode } from "../context/ModeContext";
import { DEMO_NOTICE, MODE_NAV, PRODUCT_NAME, TAGLINE, type AppMode } from "../data/mock";

const MODE_OPTIONS: { id: AppMode; label: string }[] = [
  { id: "client", label: "Client" },
  { id: "institution", label: "Institution" },
  { id: "admin", label: "Admin" },
];

export function Layout() {
  const { mode, setMode } = useMode();
  const { source } = useClient();
  const links = MODE_NAV[mode];

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <div className="mock-banner" role="status">
        <div className="mock-banner-inner">
          <strong>Mock demo · {PRODUCT_NAME}</strong>
          <span>
            {DEMO_NOTICE} Client store: {source === "api" ? "SQLite via /api" : "bundled seed (API unreachable)"}.
          </span>
        </div>
      </div>
      <header className="site-header">
        <div className="site-header-inner">
          <div className="brand">
            <div className="wordmark">{PRODUCT_NAME}</div>
            <div className="tagline">{TAGLINE}</div>
          </div>
          <div className="header-tools">
            {mode !== "institution" ? <ClientSwitcher /> : null}
            <div className="mode-toggle" role="radiogroup" aria-label="Demo mode">
              {MODE_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={mode === option.id}
                  onClick={() => {
                    if (mode !== option.id) setMode(option.id);
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <nav className="primary" aria-label={`${MODE_OPTIONS.find((item) => item.id === mode)?.label} mode`}>
              {links.map((link) => (
                <NavLink key={link.to} to={link.to}>
                  {link.label}
                </NavLink>
              ))}
            </nav>
            <UserButton appearance={clerkAppearance} />
          </div>
        </div>
      </header>
      <main id="main" className="page">
        <Outlet />
      </main>
      <footer className="site-footer">
        <div className="site-footer-inner stack">
          <p className="kicker" style={{ color: "#c5d3bb" }}>
            Near-term · this mock
          </p>
          <h2>Disclosure and verification so institutions can pay to show a fit.</h2>
          <p>
            Banks, asset managers, and private-market providers pay for placement against a
            reusable, consented {PRODUCT_NAME} profile. One broad consent lets any paying
            institution send an offer; if it is off, the inbox is empty.
          </p>
          <p className="tiny">
            Later — mentioned only, not built — quant-driven matching and instant quotes.
            Illustrated data vendors first: Morningstar and Informa, then manager buy-in.
            Distribution is wholesaler-driven today; quantitatively driven matching is future
            work and is not implemented in this demo.
          </p>
          <p className="tiny">
            Offers are illustrative and are not advice, a solicitation, or a commitment to lend
            or allocate. Access is Clerk-gated. Holdings, KYC badges, payments, BrokerCheck
            lookups, and Morningstar / Informa names are fixtures — not live connections.
          </p>
        </div>
      </footer>
    </>
  );
}

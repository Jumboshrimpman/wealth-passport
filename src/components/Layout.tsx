import { UserButton } from "@clerk/clerk-react";
import { NavLink, Outlet } from "react-router-dom";
import { clerkAppearance } from "../auth/clerk";
import { ClientSwitcher } from "./ClientSwitcher";
import { useMode } from "../context/ModeContext";
import { MODE_NAV, PRODUCT_NAME, TAGLINE, type AppMode } from "../data/catalog";

const MODE_OPTIONS: { id: AppMode; label: string }[] = [
  { id: "client", label: "Client" },
  { id: "institution", label: "Institution" },
  { id: "admin", label: "Admin" },
];

export function Layout() {
  const { mode, setMode } = useMode();
  const links = MODE_NAV[mode];

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <div className="site-header-inner">
          <div className="brand">
            <div className="wordmark">{PRODUCT_NAME}</div>
            <div className="tagline">{TAGLINE}</div>
          </div>
          <div className="header-tools">
            {mode !== "institution" ? <ClientSwitcher /> : null}
            <div className="mode-toggle" role="radiogroup" aria-label="Workspace mode">
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
            {mode === "client" ? (
              <NavLink to="/enroll" className="enroll-cta">
                Enroll Now
              </NavLink>
            ) : null}
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
            Product
          </p>
          <h2>Disclosure and verification so institutions can pay to show a fit.</h2>
          <p>
            Banks, asset managers, and private-market providers pay for placement against a
            reusable, consented {PRODUCT_NAME} profile. Master share plus per-scope
            consent lets a paying institution send an offer against the slices the
            household still shares; if master share is off, the inbox is empty.
          </p>
          <p className="tiny">
            Quant-driven matching and instant quotes are on the roadmap. Data vendors first:
            Morningstar and Informa, then manager buy-in.
          </p>
          <p className="tiny">
            Offers are not advice, a solicitation, or a commitment to lend or allocate. Access is
            Clerk-gated.
          </p>
        </div>
      </footer>
    </>
  );
}

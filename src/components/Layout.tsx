import { NavLink, Outlet } from "react-router-dom";
import { DEMO_NOTICE, TAGLINE } from "../data/mock";

const links = [
  { to: "/passport", label: "Client Passport" },
  { to: "/trust", label: "Trust" },
  { to: "/offers", label: "Offers inbox" },
  { to: "/institution", label: "Institution" },
  { to: "/ops", label: "Ops reuse" },
  { to: "/admin", label: "Admin" },
];

export function Layout() {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <div className="mock-banner" role="status">
        <div className="mock-banner-inner">
          <strong>Mock demo</strong>
          <span>{DEMO_NOTICE}</span>
        </div>
      </div>
      <header className="site-header">
        <div className="site-header-inner">
          <div className="brand">
            <div className="wordmark">Wealth Passport</div>
            <div className="tagline">{TAGLINE}</div>
          </div>
          <nav className="primary" aria-label="Walkthrough views">
            {links.map((link) => (
              <NavLink key={link.to} to={link.to}>
                {link.label}
              </NavLink>
            ))}
          </nav>
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
            reusable, consented wealth profile. Enrollment and rollover packets reuse the same
            standardized documents instead of re-collecting them at every firm.
          </p>
          <p className="tiny">
            Later — mentioned only, not built — quant-driven matching and instant quotes.
            Illustrated data vendors first: Morningstar and Informa, then manager buy-in.
            Distribution is wholesaler-driven today; quantitatively driven matching is future
            work and is not implemented in this demo.
          </p>
          <p className="tiny">
            Offers are illustrative and are not advice, a solicitation, or a commitment to lend
            or allocate. No live APIs, custody links, KYC, payments, BrokerCheck lookups, or
            Morningstar / Informa connections exist in this application.
          </p>
        </div>
      </footer>
    </>
  );
}

import { UserButton } from "@clerk/clerk-react";
import { useEffect } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { hasClerkKey, usePortalAccess } from "../auth/access";
import { clerkAppearance } from "../auth/clerk";
import { PRODUCT_NAME } from "../data/catalog";
import { useAssistant } from "../context/AssistantContext";
import { AssistantPanel } from "./AssistantPanel";

const LINKS = [
  { to: "/assistant", label: "Assistant" },
  { to: "/offers", label: "Offers" },
  { to: "/financials", label: "Financials" },
  { to: "/settings", label: "Settings" },
];

export function PortalShell() {
  const location = useLocation();
  const { clerkSignedIn } = usePortalAccess();
  const { minimized, setMinimized } = useAssistant();
  const showDock = location.pathname !== "/assistant";
  const wide = location.pathname === "/admin" || location.pathname === "/institution";

  useEffect(() => {
    if (location.pathname === "/offers" || location.pathname === "/financials") {
      setMinimized(false);
    } else if (showDock) {
      setMinimized(true);
    }
  }, [location.pathname, setMinimized, showDock]);

  return (
    <div className="portal">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="portal-header">
        <NavLink to="/assistant" className="wordmark">
          {PRODUCT_NAME}
        </NavLink>
        <nav className="portal-nav" aria-label="Client">
          {LINKS.map((link) => (
            <NavLink key={link.to} to={link.to}>
              {link.label}
            </NavLink>
          ))}
          <NavLink to="/admin">Admin</NavLink>
        </nav>
        {hasClerkKey() && clerkSignedIn ? <UserButton appearance={clerkAppearance} /> : null}
      </header>
      <div className={`portal-frame ${showDock && !minimized ? "with-dock" : ""}`}>
        <main id="main" className={`portal-main ${wide ? "wide" : ""}`}>
          <Outlet />
        </main>
        {showDock && !minimized ? (
          <aside className="assistant-dock" aria-label="Assistant">
            <button type="button" className="text-button" onClick={() => setMinimized(true)}>
              Minimize
            </button>
            <AssistantPanel variant="dock" />
          </aside>
        ) : null}
      </div>
      {showDock && minimized ? (
        <aside className="chat-mini" aria-label="Assistant">
          <button type="button" className="text-button" onClick={() => setMinimized(false)}>
            Open
          </button>
          <AssistantPanel variant="mini" />
        </aside>
      ) : null}
    </div>
  );
}

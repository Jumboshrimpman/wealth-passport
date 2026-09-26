import { UserButton } from "@clerk/clerk-react";
import { useEffect, useRef } from "react";
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
  const roomy = location.pathname === "/offers";
  const pinned = useRef<{ path: string; minimized: boolean } | null>(null);

  useEffect(() => {
    if (!showDock) return;
    if (pinned.current?.path === location.pathname) {
      setMinimized(pinned.current.minimized);
      return;
    }
    setMinimized(!(location.pathname === "/offers" || location.pathname === "/financials"));
  }, [location.pathname, setMinimized, showDock]);

  function minimize() {
    pinned.current = { path: location.pathname, minimized: true };
    setMinimized(true);
  }

  function expand() {
    pinned.current = { path: location.pathname, minimized: false };
    setMinimized(false);
  }

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
      <div className={`portal-frame ${showDock ? "has-dock" : ""}`}>
        <main id="main" className={`portal-main ${wide ? "wide" : ""} ${roomy ? "roomy" : ""}`}>
          <div className="portal-sheet">
            <Outlet />
          </div>
        </main>
        {showDock ? (
          <aside className={`assistant-dock ${minimized ? "is-collapsed" : ""}`} aria-label="Assistant">
            {minimized ? (
              <button type="button" className="assistant-rail" aria-expanded={false} onClick={expand}>
                Assistant
              </button>
            ) : (
              <>
                <div className="assistant-dock-bar">
                  <span>Assistant</span>
                  <button type="button" className="text-button" aria-expanded={true} onClick={minimize}>
                    Minimize
                  </button>
                </div>
                <AssistantPanel variant="dock" />
              </>
            )}
          </aside>
        ) : null}
      </div>
    </div>
  );
}

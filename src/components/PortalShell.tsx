import { UserButton } from "@clerk/clerk-react";
import { useEffect, useRef } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { hasClerkKey, usePortalAccess } from "../auth/access";
import { clerkAppearance } from "../auth/clerk";
import { PRODUCT_NAME } from "../data/catalog";
import { useAssistant } from "../context/AssistantContext";
import { AssistantPanel } from "./AssistantPanel";
import { CompanionMark } from "./CompanionMark";

const LINKS = [
  { to: "/assistant", label: "Assistant" },
  { to: "/offers", label: "Pitches" },
  { to: "/strategies", label: "Strategies" },
  { to: "/financials", label: "Financials" },
  { to: "/settings", label: "Settings" },
];

export function PortalShell() {
  const location = useLocation();
  const { clerkSignedIn } = usePortalAccess();
  const { minimized, setMinimized } = useAssistant();
  const chatHome = location.pathname === "/assistant";
  const showDock = !chatHome;
  const wide = location.pathname === "/admin" || location.pathname === "/institution";
  const roomy = location.pathname === "/offers" || location.pathname === "/strategies";
  const pinned = useRef<{ path: string; minimized: boolean } | null>(null);

  useEffect(() => {
    if (!showDock) return;
    if (pinned.current?.path === location.pathname) {
      setMinimized(pinned.current.minimized);
      return;
    }
    setMinimized(
      !(
        location.pathname === "/offers" ||
        location.pathname === "/financials" ||
        location.pathname === "/strategies"
      ),
    );
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
    <div className={`portal ${chatHome ? "chat-home" : ""}`}>
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
        <main id="main" className={`portal-main ${wide ? "wide" : ""} ${roomy ? "roomy" : ""} ${chatHome ? "chat-lock" : ""}`}>
          <div className="portal-sheet">
            <Outlet />
          </div>
        </main>
        {showDock ? (
          <aside className={`assistant-dock ${minimized ? "is-collapsed" : ""}`} aria-label="Assistant">
            {minimized ? (
              <button type="button" className="assistant-rail" aria-expanded={false} aria-label="Open assistant" onClick={expand}>
                <CompanionMark />
                <span className="assistant-rail-label">Assistant</span>
                <svg className="assistant-rail-chevron" viewBox="0 0 12 12" aria-hidden="true">
                  <path
                    d="M4.65 2.15 8.5 6 4.65 9.85"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.15"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
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

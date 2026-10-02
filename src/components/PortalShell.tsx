import { UserButton } from "@clerk/clerk-react";
import { useEffect, useRef } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { hasClerkKey, usePortalAccess } from "../auth/access";
import { clerkAppearance } from "../auth/clerk";
import { MODE_HOMES, MODE_NAV, modeFromPath, PRODUCT_NAME } from "../data/catalog";
import { useAssistant } from "../context/AssistantContext";
import { useMode } from "../context/ModeContext";
import { AppInvite } from "./AppInvite";
import { AssistantPanel } from "./AssistantPanel";
import { CompanionMark } from "./CompanionMark";
import { InstitutionAssistantPanel } from "./InstitutionAssistantPanel";
import { PhoneDemoSheet } from "./PhoneDemoSheet";
import { RoleSwitcher } from "./RoleSwitcher";

const OPEN_DOCK = new Set([
  "/offers",
  "/financials",
  "/strategies",
  "/institution/clients",
  "/institution/strategies",
  "/institution/pitches",
]);

export function PortalShell() {
  const location = useLocation();
  const { mode } = useMode();
  const { clerkSignedIn } = usePortalAccess();
  const { minimized, setMinimized, expandNonce } = useAssistant();
  const routeMode = modeFromPath(location.pathname) ?? mode;
  const institutional = routeMode === "institution";
  const institutionHome = location.pathname === "/institution";
  const clientHome = location.pathname === "/assistant";
  const chatHome = institutionHome || clientHome;
  const showDock = !chatHome;
  const wide =
    location.pathname === "/admin" ||
    location.pathname === "/institution/clients" ||
    location.pathname === "/institution/strategies" ||
    location.pathname === "/institution/pitches";
  const roomy = location.pathname === "/offers" || location.pathname === "/strategies";
  const pinned = useRef<{ path: string; minimized: boolean } | null>(null);
  const links = MODE_NAV[routeMode];
  const navLabel = routeMode === "institution" ? "Institutional" : routeMode === "admin" ? "Admin" : "Client";

  useEffect(() => {
    if (!showDock) return;
    if (pinned.current?.path === location.pathname) {
      setMinimized(pinned.current.minimized);
      return;
    }
    setMinimized(!OPEN_DOCK.has(location.pathname));
  }, [location.pathname, setMinimized, showDock]);

  useEffect(() => {
    if (!showDock || expandNonce === 0) return;
    pinned.current = { path: location.pathname, minimized: false };
    setMinimized(false);
  }, [expandNonce, location.pathname, setMinimized, showDock]);

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
        <div className="portal-leading">
          <RoleSwitcher />
          <NavLink to={MODE_HOMES[routeMode]} className="wordmark">
            {PRODUCT_NAME}
          </NavLink>
        </div>
        <nav className="portal-nav" aria-label={navLabel}>
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} end>
              {link.label}
            </NavLink>
          ))}
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
                {institutional ? <InstitutionAssistantPanel variant="dock" /> : <AssistantPanel variant="dock" />}
              </>
            )}
          </aside>
        ) : null}
      </div>
      {routeMode === "client" ? <PhoneDemoSheet /> : null}
      {routeMode === "client" ? <AppInvite /> : null}
    </div>
  );
}

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MODE_HOMES, modeFromPath, type AppMode } from "../data/catalog";

const MODE_KEY = "wealthpass-mode";

type ModeContextValue = {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
};

const ModeContext = createContext<ModeContextValue | null>(null);

function isMode(value: string | null): value is AppMode {
  return value === "client" || value === "institution" || value === "admin";
}

function readStoredMode(): AppMode {
  try {
    const stored = sessionStorage.getItem(MODE_KEY) ?? localStorage.getItem(MODE_KEY);
    if (isMode(stored)) return stored;
  } catch {
    // GitHub Pages / private mode: default to Client.
  }
  return "client";
}

function persistMode(mode: AppMode) {
  try {
    sessionStorage.setItem(MODE_KEY, mode);
    localStorage.setItem(MODE_KEY, mode);
  } catch {
    // Mode still updates in memory if storage is blocked.
  }
}

export function ModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<AppMode>(readStoredMode);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const implied = modeFromPath(location.pathname);
    if (!implied || implied === mode) return;
    persistMode(implied);
    setModeState(implied);
  }, [location.pathname, mode]);

  function setMode(next: AppMode) {
    const current = modeFromPath(location.pathname) ?? mode;
    if (next === current) return;
    persistMode(next);
    setModeState(next);
    navigate(MODE_HOMES[next]);
  }

  return <ModeContext.Provider value={{ mode, setMode }}>{children}</ModeContext.Provider>;
}

export function useMode() {
  const value = useContext(ModeContext);
  if (!value) {
    throw new Error("useMode must be used inside ModeProvider.");
  }
  return value;
}

import { createContext, useContext, useState, type ReactNode } from "react";
import { defaultPassportConsent } from "../data/mock";

const CONSENT_KEY = "wealthpass-mock-consent";

type ConsentContextValue = {
  shared: boolean;
  lastChanged: string;
  scopes: string[];
  toggle: () => void;
};

const ConsentContext = createContext<ConsentContextValue | null>(null);

function readStoredConsent(): boolean {
  try {
    const stored = sessionStorage.getItem(CONSENT_KEY) ?? localStorage.getItem(CONSENT_KEY);
    if (stored === "on") return true;
    if (stored === "off") return false;
  } catch {
    // GitHub Pages / private mode: stay on the fixture default.
  }
  return defaultPassportConsent.shared;
}

function persistConsent(shared: boolean) {
  const value = shared ? "on" : "off";
  try {
    sessionStorage.setItem(CONSENT_KEY, value);
    localStorage.setItem(CONSENT_KEY, value);
  } catch {
    // In-memory toggle still works if storage is blocked.
  }
}

export function ConsentProvider({ children }: { children: ReactNode }) {
  const [shared, setShared] = useState(readStoredConsent);

  function toggle() {
    setShared((current) => {
      const next = !current;
      persistConsent(next);
      return next;
    });
  }

  return (
    <ConsentContext.Provider
      value={{
        shared,
        lastChanged: defaultPassportConsent.lastChanged,
        scopes: defaultPassportConsent.scopes,
        toggle,
      }}
    >
      {children}
    </ConsentContext.Provider>
  );
}

export function useConsent() {
  const value = useContext(ConsentContext);
  if (!value) {
    throw new Error("MOCK FAILURE: useConsent must be used inside ConsentProvider.");
  }
  return value;
}

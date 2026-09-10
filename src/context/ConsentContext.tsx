import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { patchClientConsent } from "../api/clients";
import { useClient } from "./ClientContext";

type ConsentContextValue = {
  shared: boolean;
  lastChanged: string;
  scopes: string[];
  persisted: boolean;
  toggle: () => void;
};

const ConsentContext = createContext<ConsentContextValue | null>(null);

function consentStorageKey(clientId: string) {
  return `wealthpass-consent-${clientId}`;
}

function readFallbackConsent(clientId: string, seedDefault: boolean): boolean {
  try {
    const stored =
      sessionStorage.getItem(consentStorageKey(clientId)) ?? localStorage.getItem(consentStorageKey(clientId));
    if (stored === "on") return true;
    if (stored === "off") return false;
  } catch {
    // Private mode: use the record default.
  }
  return seedDefault;
}

function persistFallbackConsent(clientId: string, shared: boolean) {
  const value = shared ? "on" : "off";
  try {
    sessionStorage.setItem(consentStorageKey(clientId), value);
    localStorage.setItem(consentStorageKey(clientId), value);
  } catch {
    // In-memory toggle still works.
  }
}

export function ConsentProvider({ children }: { children: ReactNode }) {
  const { passport, source } = useClient();
  const [shared, setShared] = useState(() =>
    source === "api" ? passport.consent.shared : readFallbackConsent(passport.id, passport.consent.shared),
  );
  const [lastChanged, setLastChanged] = useState(passport.consent.lastChanged);
  const [persisted, setPersisted] = useState(source === "api");

  useEffect(() => {
    if (source === "api") {
      setShared(passport.consent.shared);
      setLastChanged(passport.consent.lastChanged);
      setPersisted(true);
      return;
    }
    setShared(readFallbackConsent(passport.id, passport.consent.shared));
    setLastChanged(passport.consent.lastChanged);
    setPersisted(false);
  }, [passport.id, passport.consent.shared, passport.consent.lastChanged, source]);

  function toggle() {
    const next = !shared;
    setShared(next);
    const today = new Date().toISOString().slice(0, 10);
    setLastChanged(today);
    if (source !== "api") {
      persistFallbackConsent(passport.id, next);
      setPersisted(false);
      return;
    }
    void patchClientConsent(passport.id, next).then((updated) => {
      if (!updated) {
        persistFallbackConsent(passport.id, next);
        setPersisted(false);
        return;
      }
      setShared(updated.consent.shared);
      setLastChanged(updated.consent.lastChanged);
      setPersisted(true);
    });
  }

  return (
    <ConsentContext.Provider
      value={{
        shared,
        lastChanged,
        scopes: passport.consent.scopes,
        persisted,
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

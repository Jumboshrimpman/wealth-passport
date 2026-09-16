import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  normalizeScopes,
  type ConsentScopeId,
} from "../../shared/consent.ts";
import { patchClientConsent } from "../api/clients";
import { useClient } from "./ClientContext";

type ConsentContextValue = {
  shared: boolean;
  lastChanged: string;
  scopes: ConsentScopeId[];
  persisted: boolean;
  toggle: () => void;
  toggleScope: (id: ConsentScopeId) => void;
};

const ConsentContext = createContext<ConsentContextValue | null>(null);

function consentStorageKey(clientId: string) {
  return `wealthpass-consent-${clientId}`;
}

interface StoredConsent {
  shared: boolean;
  scopes: ConsentScopeId[];
}

function readFallbackConsent(
  clientId: string,
  seedDefault: boolean,
  seedScopes: string[],
): StoredConsent {
  const scopes = normalizeScopes(seedScopes);
  try {
    const stored =
      sessionStorage.getItem(consentStorageKey(clientId)) ?? localStorage.getItem(consentStorageKey(clientId));
    if (stored === "on") return { shared: true, scopes };
    if (stored === "off") return { shared: false, scopes };
    if (stored) {
      const parsed = JSON.parse(stored) as { shared?: unknown; scopes?: unknown };
      return {
        shared: typeof parsed.shared === "boolean" ? parsed.shared : seedDefault,
        scopes: Array.isArray(parsed.scopes) ? normalizeScopes(parsed.scopes) : scopes,
      };
    }
  } catch {
    // Private mode: use the record default.
  }
  return { shared: seedDefault, scopes };
}

function persistFallbackConsent(clientId: string, value: StoredConsent) {
  try {
    const encoded = JSON.stringify(value);
    sessionStorage.setItem(consentStorageKey(clientId), encoded);
    localStorage.setItem(consentStorageKey(clientId), encoded);
  } catch {
    // In-memory toggle still works.
  }
}

export function ConsentProvider({ children }: { children: ReactNode }) {
  const { passport, source, applyPassport } = useClient();
  const [shared, setShared] = useState(() =>
    source === "api"
      ? passport.consent.shared
      : readFallbackConsent(passport.id, passport.consent.shared, passport.consent.scopes).shared,
  );
  const [scopes, setScopes] = useState<ConsentScopeId[]>(() =>
    source === "api"
      ? normalizeScopes(passport.consent.scopes)
      : readFallbackConsent(passport.id, passport.consent.shared, passport.consent.scopes).scopes,
  );
  const [lastChanged, setLastChanged] = useState(passport.consent.lastChanged);
  const [persisted, setPersisted] = useState(source === "api");

  useEffect(() => {
    if (source === "api") {
      setShared(passport.consent.shared);
      setScopes(normalizeScopes(passport.consent.scopes));
      setLastChanged(passport.consent.lastChanged);
      setPersisted(true);
      return;
    }
    const fallback = readFallbackConsent(passport.id, passport.consent.shared, passport.consent.scopes);
    setShared(fallback.shared);
    setScopes(fallback.scopes);
    setLastChanged(passport.consent.lastChanged);
    setPersisted(false);
  }, [passport.id, passport.consent.shared, passport.consent.lastChanged, passport.consent.scopes, source]);

  function write(nextShared: boolean, nextScopes: ConsentScopeId[]) {
    setShared(nextShared);
    setScopes(nextScopes);
    const today = new Date().toISOString().slice(0, 10);
    setLastChanged(today);
    applyPassport({
      ...passport,
      consent: { shared: nextShared, lastChanged: today, scopes: nextScopes },
    });
    if (source !== "api") {
      persistFallbackConsent(passport.id, { shared: nextShared, scopes: nextScopes });
      setPersisted(false);
      return;
    }
    void patchClientConsent(passport.id, { shared: nextShared, scopes: nextScopes }).then((updated) => {
      if (!updated) {
        persistFallbackConsent(passport.id, { shared: nextShared, scopes: nextScopes });
        setPersisted(false);
        return;
      }
      setShared(updated.consent.shared);
      setScopes(normalizeScopes(updated.consent.scopes));
      setLastChanged(updated.consent.lastChanged);
      applyPassport(updated);
      setPersisted(true);
    });
  }

  function toggle() {
    write(!shared, scopes);
  }

  function toggleScope(id: ConsentScopeId) {
    const next = scopes.includes(id) ? scopes.filter((scope) => scope !== id) : [...scopes, id];
    write(shared, next);
  }

  return (
    <ConsentContext.Provider
      value={{
        shared,
        lastChanged,
        scopes,
        persisted,
        toggle,
        toggleScope,
      }}
    >
      {children}
    </ConsentContext.Provider>
  );
}

export function useConsent() {
  const value = useContext(ConsentContext);
  if (!value) {
    throw new Error("useConsent must be used inside ConsentProvider.");
  }
  return value;
}

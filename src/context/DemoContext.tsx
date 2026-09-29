import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { enrollmentContextFromStored } from "../../shared/householdContext.ts";
import type { DemoProfile } from "../../shared/marketplace.ts";

const PROFILE_KEY = "wealthpass-demo-profile-v1";

type DemoContextValue = {
  profile: DemoProfile | null;
  saveProfile: (profile: DemoProfile) => void;
  clearProfile: () => void;
};

const DemoContext = createContext<DemoContextValue | null>(null);

function readProfile(): DemoProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DemoProfile & { taxDocName?: string };
    if (!parsed || typeof parsed.clientId !== "string" || !parsed.fit) return null;
    const stored: DemoProfile & { taxDocName?: string } = { ...parsed };
    delete stored.taxDocName;
    const context = enrollmentContextFromStored(stored);
    return {
      ...stored,
      ...context,
      isFinancialAdvisor: stored.isFinancialAdvisor === true || context.enrolleeRole !== "client",
      irsConnected: stored.irsConnected === true,
    };
  } catch {
    return null;
  }
}

export function DemoProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<DemoProfile | null>(readProfile);
  const saveProfile = useCallback((next: DemoProfile) => {
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(next));
    } catch {
      // The in-memory profile still drives this session.
    }
    setProfile(next);
  }, []);
  const clearProfile = useCallback(() => {
    try {
      localStorage.removeItem(PROFILE_KEY);
    } catch {
      // Memory copy still clears.
    }
    setProfile(null);
  }, []);
  const value = useMemo(() => ({ profile, saveProfile, clearProfile }), [clearProfile, profile, saveProfile]);
  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo() {
  const value = useContext(DemoContext);
  if (!value) throw new Error("useDemo must be used inside DemoProvider.");
  return value;
}

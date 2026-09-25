import { useAuth } from "@clerk/clerk-react";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

const DEMO_KEY = "wealthpass-demo-access";

export function hasClerkKey(): boolean {
  return Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY?.trim());
}

type AccessContextValue = {
  demo: boolean;
  clerkLoaded: boolean;
  clerkSignedIn: boolean;
  allowDemo: () => void;
  clearDemo: () => void;
  setClerk: (next: { loaded: boolean; signedIn: boolean }) => void;
};

const AccessContext = createContext<AccessContextValue | null>(null);

function readDemo(): boolean {
  try {
    return localStorage.getItem(DEMO_KEY) === "1";
  } catch {
    return false;
  }
}

export function AccessProvider({ children }: { children: ReactNode }) {
  const [demo, setDemo] = useState(readDemo);
  const [clerkLoaded, setClerkLoaded] = useState(!hasClerkKey());
  const [clerkSignedIn, setClerkSignedIn] = useState(false);
  const clerkLoadedRef = useRef(clerkLoaded);
  clerkLoadedRef.current = clerkLoaded;

  const setClerk = useCallback((next: { loaded: boolean; signedIn: boolean }) => {
    setClerkLoaded(next.loaded);
    setClerkSignedIn(next.signedIn);
  }, []);

  useEffect(() => {
    if (!hasClerkKey()) return;
    const timer = window.setTimeout(() => {
      if (!clerkLoadedRef.current) setClerk({ loaded: true, signedIn: false });
    }, 4000);
    return () => window.clearTimeout(timer);
  }, [setClerk]);

  const allowDemo = useCallback(() => {
    try {
      localStorage.setItem(DEMO_KEY, "1");
    } catch {
      // The in-memory flag still opens the portal for this tab.
    }
    setDemo(true);
  }, []);

  const clearDemo = useCallback(() => {
    try {
      localStorage.removeItem(DEMO_KEY);
    } catch {
      // Memory flag still clears.
    }
    setDemo(false);
  }, []);

  const value = useMemo<AccessContextValue>(
    () => ({
      demo,
      clerkLoaded,
      clerkSignedIn,
      allowDemo,
      clearDemo,
      setClerk,
    }),
    [allowDemo, clearDemo, clerkLoaded, clerkSignedIn, demo, setClerk],
  );

  return <AccessContext.Provider value={value}>{children}</AccessContext.Provider>;
}

export function useAccess() {
  const value = useContext(AccessContext);
  if (!value) throw new Error("useAccess must be used inside AccessProvider.");
  return value;
}

export function usePortalAccess() {
  const access = useAccess();
  return {
    ...access,
    ready: hasClerkKey() ? access.clerkLoaded : true,
    allowed: access.clerkSignedIn || access.demo,
  };
}

/** Mount only under ClerkProvider. Copies Clerk session state into AccessProvider. */
export function ClerkBridge() {
  const { isLoaded, isSignedIn } = useAuth();
  const { setClerk } = useAccess();
  useEffect(() => {
    setClerk({ loaded: isLoaded, signedIn: Boolean(isSignedIn) });
  }, [isLoaded, isSignedIn, setClerk]);
  return null;
}

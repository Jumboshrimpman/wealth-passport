import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { fetchPiiMask, readLocalPiiMask, savePiiMask } from "../api/admin";

type PrivacyContextValue = {
  maskPii: boolean;
  toggleMask: () => void;
};

const PrivacyContext = createContext<PrivacyContextValue | null>(null);

export function PrivacyProvider({ children }: { children: ReactNode }) {
  const [maskPii, setMaskPii] = useState(readLocalPiiMask);

  useEffect(() => {
    let live = true;
    void fetchPiiMask().then((result) => {
      if (live) setMaskPii(result.maskPii);
    });
    return () => {
      live = false;
    };
  }, []);

  function toggleMask() {
    const next = !maskPii;
    setMaskPii(next);
    void savePiiMask(next);
  }

  return (
    <PrivacyContext.Provider value={{ maskPii, toggleMask }}>{children}</PrivacyContext.Provider>
  );
}

export function usePrivacy() {
  const value = useContext(PrivacyContext);
  if (!value) {
    throw new Error("usePrivacy must be used inside PrivacyProvider.");
  }
  return value;
}

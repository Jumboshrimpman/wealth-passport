import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { eligibleMatches, type OfferMatch } from "../../shared/match.ts";
import type { Institution } from "../../shared/types.ts";
import { fetchInstitutions, fetchOfferMatches } from "../api/offers";
import type { ClientDataSource } from "../api/clients";
import { useClient } from "./ClientContext";
import { useConsent } from "./ConsentContext";

type OfferContextValue = {
  institutions: Institution[];
  /** Every desk evaluated against the selected client, eligible first in paid-rank order. */
  matches: OfferMatch[];
  /** Eligible placements only — the client inbox. */
  eligible: OfferMatch[];
  source: ClientDataSource;
};

const OfferContext = createContext<OfferContextValue | null>(null);

export function OfferProvider({ children }: { children: ReactNode }) {
  const { passport } = useClient();
  const consent = useConsent();
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [matches, setMatches] = useState<OfferMatch[]>([]);
  const [source, setSource] = useState<ClientDataSource>("seed");

  useEffect(() => {
    let live = true;
    void fetchInstitutions().then((result) => {
      if (live) setInstitutions(result.institutions);
    });
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    let live = true;
    void fetchOfferMatches(passport.id, consent.shared).then((result) => {
      if (!live) return;
      setMatches(result.matches);
      setSource(result.source);
    });
    return () => {
      live = false;
    };
  }, [passport.id, consent.shared]);

  const eligible = useMemo(() => eligibleMatches(matches), [matches]);

  return (
    <OfferContext.Provider value={{ institutions, matches, eligible, source }}>
      {children}
    </OfferContext.Provider>
  );
}

export function useOffers() {
  const value = useContext(OfferContext);
  if (!value) {
    throw new Error("useOffers must be used inside OfferProvider.");
  }
  return value;
}

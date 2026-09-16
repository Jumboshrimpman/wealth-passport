import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useConsent } from "./ConsentContext";
import { useClient } from "./ClientContext";
import { INSTITUTION_SEEDS } from "../../shared/seed/institutions.ts";
import type { Offer } from "../data/catalog";
import type { OfferDecision } from "../data/chat";
import {
  fetchPlacements,
  persistLocalDecisions,
  postPlacementDecision,
  readLocalDecisions,
} from "../api/placements";

type DecisionMap = Record<string, OfferDecision>;

type OfferActionResult = { ok: true } | { ok: false; error: string };

type OfferDecisionContextValue = {
  decisions: DecisionMap;
  statusOf: (offerId: string) => OfferDecision | null;
  accept: (offerId: string) => OfferActionResult;
  decline: (offerId: string) => OfferActionResult;
};

const OfferDecisionContext = createContext<OfferDecisionContextValue | null>(null);

function assertKnownOffer(offerId: string): Offer {
  const firm = INSTITUTION_SEEDS.find((item) => item.offer.id === offerId);
  if (!firm) {
    throw new Error(`Unknown offer id "${offerId}".`);
  }
  return firm.offer;
}

/**
 * Offer decisions are placements in the client store: accepting books
 * annualized placement revenue against the household's investable assets.
 * When the API is unreachable the same decisions fall back to per-client
 * browser storage.
 */
export function OfferDecisionProvider({ children }: { children: ReactNode }) {
  const consent = useConsent();
  const { passport } = useClient();
  const [decisions, setDecisions] = useState<DecisionMap>(() => readLocalDecisions(passport.id));

  useEffect(() => {
    let live = true;
    void fetchPlacements(passport.id).then(({ placements, source }) => {
      if (!live) return;
      if (source === "api") {
        const next: DecisionMap = {};
        for (const placement of placements) next[placement.offerId] = placement.status;
        setDecisions(next);
        persistLocalDecisions(passport.id, next);
      } else {
        setDecisions(readLocalDecisions(passport.id));
      }
    });
    return () => {
      live = false;
    };
  }, [passport.id]);

  function write(offerId: string, status: OfferDecision) {
    setDecisions((current) => {
      const next = { ...current, [offerId]: status };
      persistLocalDecisions(passport.id, next);
      return next;
    });
    void postPlacementDecision(passport.id, offerId, status).then((placements) => {
      if (!placements) return;
      const next: DecisionMap = {};
      for (const placement of placements) next[placement.offerId] = placement.status;
      setDecisions(next);
      persistLocalDecisions(passport.id, next);
    });
  }

  function accept(offerId: string): OfferActionResult {
    assertKnownOffer(offerId);
    if (!consent.shared) {
      return {
        ok: false,
        error:
          "You cannot accept an offer while passport share consent is off. Turn consent on from Passport, then try again.",
      };
    }
    write(offerId, "accepted");
    return { ok: true };
  }

  function decline(offerId: string): OfferActionResult {
    assertKnownOffer(offerId);
    if (!consent.shared) {
      return {
        ok: false,
        error:
          "You cannot decline an offer while passport share consent is off. Offers are not actionable without consent.",
      };
    }
    write(offerId, "declined");
    return { ok: true };
  }

  return (
    <OfferDecisionContext.Provider
      value={{
        decisions,
        statusOf: (offerId) => decisions[offerId] ?? null,
        accept,
        decline,
      }}
    >
      {children}
    </OfferDecisionContext.Provider>
  );
}

export function useOfferDecisions() {
  const value = useContext(OfferDecisionContext);
  if (!value) {
    throw new Error("useOfferDecisions must be used inside OfferDecisionProvider.");
  }
  return value;
}

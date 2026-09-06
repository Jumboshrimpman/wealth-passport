import { createContext, useContext, useState, type ReactNode } from "react";
import { useConsent } from "./ConsentContext";
import { institutions, type Offer } from "../data/mock";
import type { OfferDecision } from "../data/chat";

const DECISION_KEY = "wealthpass-mock-offer-decisions";

const OFFER_IDS = new Set(institutions.map((firm) => firm.offer.id));

type DecisionMap = Record<string, OfferDecision>;

type OfferActionResult = { ok: true } | { ok: false; error: string };

type OfferDecisionContextValue = {
  decisions: DecisionMap;
  statusOf: (offerId: string) => OfferDecision | null;
  accept: (offerId: string) => OfferActionResult;
  decline: (offerId: string) => OfferActionResult;
};

const OfferDecisionContext = createContext<OfferDecisionContextValue | null>(null);

function isDecision(value: unknown): value is OfferDecision {
  return value === "accepted" || value === "declined";
}

function readStoredDecisions(): DecisionMap {
  let stored: string | null = null;
  try {
    stored = sessionStorage.getItem(DECISION_KEY) ?? localStorage.getItem(DECISION_KEY);
  } catch {
    return {};
  }
  if (!stored) return {};
  let parsed: unknown;
  try {
    parsed = JSON.parse(stored);
  } catch {
    throw new Error("MOCK FAILURE: offer decision storage is corrupt and cannot be read.");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("MOCK FAILURE: offer decision storage is not an object.");
  }
  const next: DecisionMap = {};
  for (const [id, value] of Object.entries(parsed as Record<string, unknown>)) {
    if (!OFFER_IDS.has(id)) {
      throw new Error(`MOCK FAILURE: offer decision storage has unknown offer id "${id}".`);
    }
    if (!isDecision(value)) {
      throw new Error(`MOCK FAILURE: offer decision storage has invalid status for "${id}".`);
    }
    next[id] = value;
  }
  return next;
}

function persistDecisions(decisions: DecisionMap) {
  const value = JSON.stringify(decisions);
  try {
    sessionStorage.setItem(DECISION_KEY, value);
    localStorage.setItem(DECISION_KEY, value);
  } catch {
    // In-memory map still updates if storage is blocked.
  }
}

function assertKnownOffer(offerId: string): Offer {
  const firm = institutions.find((item) => item.offer.id === offerId);
  if (!firm) {
    throw new Error(`MOCK FAILURE: unknown offer id "${offerId}".`);
  }
  return firm.offer;
}

export function OfferDecisionProvider({ children }: { children: ReactNode }) {
  const consent = useConsent();
  const [decisions, setDecisions] = useState<DecisionMap>(readStoredDecisions);

  function write(offerId: string, status: OfferDecision) {
    setDecisions((current) => {
      const next = { ...current, [offerId]: status };
      persistDecisions(next);
      return next;
    });
  }

  function accept(offerId: string): OfferActionResult {
    assertKnownOffer(offerId);
    if (!consent.shared) {
      return {
        ok: false,
        error:
          "MOCK FAILURE: you cannot accept an offer while passport share consent is off. This mock will not pretend the accept went through. Turn consent on from Passport, then try again.",
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
          "MOCK FAILURE: you cannot decline an offer while passport share consent is off. Offers are not actionable without consent. This mock will not record a decline.",
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
    throw new Error("MOCK FAILURE: useOfferDecisions must be used inside OfferDecisionProvider.");
  }
  return value;
}

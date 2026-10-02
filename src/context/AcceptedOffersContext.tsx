import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import {
  acceptOnRow,
  revokeOnRow,
  type AcceptableChoice,
  type AcceptVisibility,
  type RowAcceptance,
} from "../../shared/acceptOffer.ts";
import { ClientAgreementModal } from "../components/ClientAgreementModal";
import { readAcceptedOffers, writeAcceptedOffers } from "../offers/acceptedOffers";
import { useClient } from "./ClientContext";

type Signing = {
  rowKey: string;
  choice: AcceptableChoice;
  visibility: AcceptVisibility;
};

type AcceptedOffersValue = {
  accepted: Record<string, RowAcceptance>;
  beginSign: (rowKey: string, choice: AcceptableChoice, visibility?: AcceptVisibility) => void;
  revoke: (rowKey: string) => void;
};

const AcceptedOffersContext = createContext<AcceptedOffersValue | null>(null);

export function AcceptedOffersProvider({ children }: { children: ReactNode }) {
  const { passport } = useClient();
  const [clientId, setClientId] = useState(passport.id);
  const [accepted, setAccepted] = useState<Record<string, RowAcceptance>>(() => readAcceptedOffers(passport.id));
  const [signing, setSigning] = useState<Signing | null>(null);

  if (passport.id !== clientId) {
    setClientId(passport.id);
    setAccepted(readAcceptedOffers(passport.id));
    setSigning(null);
  }

  const beginSign = useCallback((rowKey: string, choice: AcceptableChoice, visibility?: AcceptVisibility) => {
    setSigning({
      rowKey,
      choice,
      visibility: visibility ?? { matchesOpen: false, offersOpen: false },
    });
  }, []);

  const revoke = useCallback(
    (rowKey: string) => {
      setAccepted((current) => {
        const next = revokeOnRow(current, rowKey);
        writeAcceptedOffers(passport.id, next);
        return next;
      });
    },
    [passport.id],
  );

  function confirmSign() {
    if (!signing) return;
    const { rowKey, choice, visibility } = signing;
    setAccepted((current) => {
      const next = acceptOnRow(current, rowKey, choice, visibility);
      writeAcceptedOffers(passport.id, next);
      return next;
    });
    setSigning(null);
  }

  return (
    <AcceptedOffersContext.Provider value={{ accepted, beginSign, revoke }}>
      {children}
      {signing ? (
        <ClientAgreementModal choice={signing.choice} onCancel={() => setSigning(null)} onSign={confirmSign} />
      ) : null}
    </AcceptedOffersContext.Provider>
  );
}

export function useAcceptedOffers() {
  const value = useContext(AcceptedOffersContext);
  if (!value) throw new Error("useAcceptedOffers must be used inside AcceptedOffersProvider.");
  return value;
}

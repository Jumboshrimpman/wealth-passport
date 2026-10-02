import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { type ServiceProductId } from "../data/assistantFlow";
import { readServiceRequests, recordServiceRequest, type ServiceRequest } from "../data/serviceRequests";
import { useClient } from "./ClientContext";

type ServiceRequestValue = {
  requests: ServiceRequest[];
  note: (productId: ServiceProductId) => { already: boolean; label: string };
};

const ServiceRequestContext = createContext<ServiceRequestValue | null>(null);

export function ServiceRequestProvider({ children }: { children: ReactNode }) {
  const { passport } = useClient();
  const [clientId, setClientId] = useState(passport.id);
  const [requests, setRequests] = useState<ServiceRequest[]>(() => readServiceRequests(passport.id));

  if (passport.id !== clientId) {
    setClientId(passport.id);
    setRequests(readServiceRequests(passport.id));
  }

  const note = useCallback(
    (productId: ServiceProductId) => {
      const result = recordServiceRequest(passport.id, productId);
      setRequests(result.requests);
      const label = result.requests.find((row) => row.id === productId)?.label ?? productId;
      return { already: result.already, label };
    },
    [passport.id],
  );

  return <ServiceRequestContext.Provider value={{ requests, note }}>{children}</ServiceRequestContext.Provider>;
}

export function useServiceRequests() {
  const value = useContext(ServiceRequestContext);
  if (!value) throw new Error("useServiceRequests must be used inside ServiceRequestProvider.");
  return value;
}

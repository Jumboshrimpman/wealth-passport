import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import {
  fetchClientPassport,
  fetchClientSummaries,
  persistClientId,
  readStoredClientId,
  type ClientDataSource,
} from "../api/clients";
import { DEFAULT_CLIENT_ID } from "../../shared/seed";
import type { ClientPassport, ClientSummary } from "../../shared/types";

type ClientContextValue = {
  clients: ClientSummary[];
  passport: ClientPassport;
  source: ClientDataSource;
  selectClient: (id: string) => void;
};

const ClientContext = createContext<ClientContextValue | null>(null);

export function ClientProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [passport, setPassport] = useState<ClientPassport | null>(null);
  const [source, setSource] = useState<ClientDataSource>("seed");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (requestedId?: string) => {
    try {
      const list = await fetchClientSummaries();
      setClients(list.clients);
      const preferred =
        requestedId ??
        readStoredClientId() ??
        list.clients.find((item) => item.id === DEFAULT_CLIENT_ID)?.id ??
        list.clients[0]?.id;
      if (!preferred) {
        throw new Error("No client records are available.");
      }
      persistClientId(preferred);
      const detail = await fetchClientPassport(preferred);
      setPassport(detail.client);
      setSource(detail.source);
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to load client records.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function selectClient(id: string) {
    persistClientId(id);
    void load(id);
  }

  if (error) {
    return (
      <section className="panel">
        <p className="kicker">Client store</p>
        <h1>Could not load client records.</h1>
        <p className="lede">{error}</p>
      </section>
    );
  }

  if (!passport) {
    return (
      <section className="panel">
        <p className="kicker">Client store</p>
        <h1>Loading client records…</h1>
      </section>
    );
  }

  return (
    <ClientContext.Provider value={{ clients, passport, source, selectClient }}>{children}</ClientContext.Provider>
  );
}

export function useClient() {
  const value = useContext(ClientContext);
  if (!value) {
    throw new Error("MOCK FAILURE: useClient must be used inside ClientProvider.");
  }
  return value;
}

import { SEEDED_PASSPORTS, seedById } from "../../shared/seed";
import { assemblePassport } from "../../shared/assemble";
import type { ClientPassport, ClientSummary } from "../../shared/types";
import { summarizeClient } from "../../shared/types";

const CLIENT_KEY = "wealthpass-client-id";

export type ClientDataSource = "api" | "seed";

export function readStoredClientId(): string | null {
  try {
    return sessionStorage.getItem(CLIENT_KEY) ?? localStorage.getItem(CLIENT_KEY);
  } catch {
    return null;
  }
}

export function persistClientId(id: string) {
  try {
    sessionStorage.setItem(CLIENT_KEY, id);
    localStorage.setItem(CLIENT_KEY, id);
  } catch {
    // Private mode: in-memory selection still works.
  }
}

export async function fetchClientSummaries(): Promise<{ clients: ClientSummary[]; source: ClientDataSource }> {
  try {
    const response = await fetch("/api/clients");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const body = (await response.json()) as { clients: ClientSummary[] };
    if (!Array.isArray(body.clients) || body.clients.length === 0) {
      throw new Error("Empty client list");
    }
    return { clients: body.clients, source: "api" };
  } catch {
    return { clients: SEEDED_PASSPORTS.map(summarizeClient), source: "seed" };
  }
}

export async function fetchClientPassport(id: string): Promise<{ client: ClientPassport; source: ClientDataSource }> {
  try {
    const response = await fetch(`/api/clients/${id}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const body = (await response.json()) as { client: ClientPassport };
    if (!body.client?.id) throw new Error("Malformed client payload");
    return { client: body.client, source: "api" };
  } catch {
    const seeded = seedById(id);
    if (!seeded) throw new Error(`No seed fallback for client "${id}".`);
    return { client: assemblePassport(seeded), source: "seed" };
  }
}

export async function patchClientConsent(id: string, shared: boolean): Promise<ClientPassport | null> {
  try {
    const response = await fetch(`/api/clients/${id}/consent`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shared }),
    });
    if (!response.ok) return null;
    const body = (await response.json()) as { client: ClientPassport };
    return body.client ?? null;
  } catch {
    return null;
  }
}

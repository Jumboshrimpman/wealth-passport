import {
  layoutPayload,
  mergeLayout,
  type WidgetLayout,
} from "../../shared/dashboardLayout.ts";
import type { AuditEvent } from "../../shared/types.ts";

export type AdminLayoutSource = "api" | "local";

export async function fetchAdminLayout(): Promise<{
  layout: WidgetLayout[];
  source: AdminLayoutSource;
}> {
  const response = await fetch("/api/admin/layout");
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const body = (await response.json()) as { layout: unknown };
  return { layout: mergeLayout({ widgets: body.layout }), source: "api" };
}

/** Returns true when the layout was stored in the client database. */
export async function saveAdminLayout(layout: WidgetLayout[]): Promise<boolean> {
  try {
    const response = await fetch("/api/admin/layout", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(layoutPayload(layout)),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/** Append-only audit trail. Events live in the client database, so there is no offline copy. */
export async function fetchEvents(limit = 100): Promise<AuditEvent[]> {
  const response = await fetch(`/api/admin/events?limit=${limit}`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const body = (await response.json()) as { events: AuditEvent[] };
  if (!Array.isArray(body.events)) throw new Error("Malformed events payload");
  return body.events;
}

const PII_STORAGE_KEY = "wealthpass-admin-pii-mask";

export function readLocalPiiMask(): boolean {
  try {
    return (localStorage.getItem(PII_STORAGE_KEY) ?? sessionStorage.getItem(PII_STORAGE_KEY)) === "on";
  } catch {
    return false;
  }
}

export function persistLocalPiiMask(mask: boolean) {
  const value = mask ? "on" : "off";
  try {
    localStorage.setItem(PII_STORAGE_KEY, value);
    sessionStorage.setItem(PII_STORAGE_KEY, value);
  } catch {
    // In-memory toggle still works.
  }
}

export async function fetchPiiMask(): Promise<{ maskPii: boolean; source: AdminLayoutSource }> {
  try {
    const response = await fetch("/api/admin/privacy");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const body = (await response.json()) as { maskPii: boolean };
    persistLocalPiiMask(body.maskPii === true);
    return { maskPii: body.maskPii === true, source: "api" };
  } catch {
    return { maskPii: readLocalPiiMask(), source: "local" };
  }
}

export async function savePiiMask(maskPii: boolean): Promise<boolean> {
  persistLocalPiiMask(maskPii);
  try {
    const response = await fetch("/api/admin/privacy", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ maskPii }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

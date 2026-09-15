import {
  layoutPayload,
  mergeLayout,
  type WidgetLayout,
} from "../../shared/dashboardLayout.ts";

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

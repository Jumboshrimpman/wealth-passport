import {
  defaultLayout,
  layoutPayload,
  mergeLayout,
  type WidgetLayout,
} from "../../shared/dashboardLayout.ts";

export {
  defaultLayout,
  mergeLayout,
  WIDGET_IDS,
  WIDGET_META,
  type VizKind,
  type WidgetId,
  type WidgetLayout,
} from "../../shared/dashboardLayout.ts";

const STORAGE_KEY = "wealthpass-admin-dashboard-v2";

/** Browser copy of the dashboard layout — offline fallback for the server-persisted layout. */
export function readStoredLayout(): WidgetLayout[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultLayout();
    return mergeLayout(JSON.parse(raw));
  } catch {
    return defaultLayout();
  }
}

export function persistLayout(layout: WidgetLayout[]) {
  const payload = JSON.stringify(layoutPayload(layout));
  try {
    localStorage.setItem(STORAGE_KEY, payload);
    sessionStorage.setItem(STORAGE_KEY, payload);
  } catch {
    // Layout still applies in memory.
  }
}

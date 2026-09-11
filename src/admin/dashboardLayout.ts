export const WIDGET_IDS = [
  "clients",
  "institutions",
  "aum",
  "placements",
  "ops",
  "modes",
  "rank-depth",
  "api",
  "clerk",
] as const;

export type WidgetId = (typeof WIDGET_IDS)[number];

export type VizKind = "bars" | "donut" | "stack" | "status";

export interface WidgetLayout {
  id: WidgetId;
  visible: boolean;
  span: 1 | 2;
  viz: VizKind;
}

export const WIDGET_META: Record<
  WidgetId,
  { title: string; allowedViz: VizKind[]; defaultViz: VizKind; defaultSpan: 1 | 2 }
> = {
  clients: {
    title: "Client records in SQLite",
    allowedViz: ["bars", "donut"],
    defaultViz: "bars",
    defaultSpan: 1,
  },
  institutions: {
    title: "Paying institutions on the board",
    allowedViz: ["donut", "bars"],
    defaultViz: "donut",
    defaultSpan: 1,
  },
  aum: {
    title: "Illustrative AUM on file",
    allowedViz: ["stack", "bars", "donut"],
    defaultViz: "stack",
    defaultSpan: 2,
  },
  placements: {
    title: "Paid placements (open)",
    allowedViz: ["stack", "bars", "donut"],
    defaultViz: "stack",
    defaultSpan: 2,
  },
  ops: {
    title: "Ops fields reused",
    allowedViz: ["donut", "bars"],
    defaultViz: "donut",
    defaultSpan: 1,
  },
  modes: {
    title: "Mock mode coverage",
    allowedViz: ["donut", "bars"],
    defaultViz: "donut",
    defaultSpan: 1,
  },
  "rank-depth": {
    title: "Inbox rank depth",
    allowedViz: ["bars", "donut"],
    defaultViz: "bars",
    defaultSpan: 1,
  },
  api: {
    title: "Client API",
    allowedViz: ["status", "bars"],
    defaultViz: "status",
    defaultSpan: 1,
  },
  clerk: {
    title: "Clerk gate",
    allowedViz: ["status", "donut"],
    defaultViz: "status",
    defaultSpan: 1,
  },
};

export function defaultLayout(): WidgetLayout[] {
  return WIDGET_IDS.map((id) => ({
    id,
    visible: true,
    span: WIDGET_META[id].defaultSpan,
    viz: WIDGET_META[id].defaultViz,
  }));
}

const STORAGE_KEY = "wealthpass-admin-dashboard-v1";

function isViz(value: unknown, id: WidgetId): value is VizKind {
  return typeof value === "string" && (WIDGET_META[id].allowedViz as string[]).includes(value);
}

function isSpan(value: unknown): value is 1 | 2 {
  return value === 1 || value === 2;
}

export function mergeLayout(stored: unknown): WidgetLayout[] {
  const base = defaultLayout();
  if (!stored || typeof stored !== "object") return base;
  const widgets = (stored as { widgets?: unknown }).widgets;
  if (!Array.isArray(widgets)) return base;

  const seen = new Set<WidgetId>();
  const merged: WidgetLayout[] = [];
  for (const row of widgets) {
    if (!row || typeof row !== "object") continue;
    const id = (row as { id?: unknown }).id;
    if (typeof id !== "string" || !WIDGET_IDS.includes(id as WidgetId) || seen.has(id as WidgetId)) continue;
    const widgetId = id as WidgetId;
    seen.add(widgetId);
    const visible = (row as { visible?: unknown }).visible !== false;
    const span = isSpan((row as { span?: unknown }).span) ? (row as { span: 1 | 2 }).span : WIDGET_META[widgetId].defaultSpan;
    const viz = isViz((row as { viz?: unknown }).viz, widgetId)
      ? ((row as { viz: VizKind }).viz)
      : WIDGET_META[widgetId].defaultViz;
    merged.push({ id: widgetId, visible, span, viz });
  }
  for (const fallback of base) {
    if (!seen.has(fallback.id)) merged.push(fallback);
  }
  return merged;
}

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
  const payload = JSON.stringify({ version: 1, widgets: layout });
  try {
    localStorage.setItem(STORAGE_KEY, payload);
    sessionStorage.setItem(STORAGE_KEY, payload);
  } catch {
    // Layout still applies in memory.
  }
}

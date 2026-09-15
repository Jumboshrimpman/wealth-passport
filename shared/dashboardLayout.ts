export const WIDGET_IDS = [
  "clients",
  "institutions",
  "aum",
  "placements",
  "revenue",
  "ops",
  "bank-ranking",
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
    title: "Client records",
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
    title: "Verified AUM",
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
  revenue: {
    title: "Placement revenue",
    allowedViz: ["bars", "donut", "stack"],
    defaultViz: "bars",
    defaultSpan: 2,
  },
  ops: {
    title: "Ops fields reused",
    allowedViz: ["donut", "bars"],
    defaultViz: "donut",
    defaultSpan: 1,
  },
  "bank-ranking": {
    title: "Bank ranking",
    allowedViz: ["bars", "donut"],
    defaultViz: "bars",
    defaultSpan: 1,
  },
};

export const LAYOUT_VERSION = 2;

export function defaultLayout(): WidgetLayout[] {
  return WIDGET_IDS.map((id) => ({
    id,
    visible: true,
    span: WIDGET_META[id].defaultSpan,
    viz: WIDGET_META[id].defaultViz,
  }));
}

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

export function layoutPayload(layout: WidgetLayout[]): { version: number; widgets: WidgetLayout[] } {
  return { version: LAYOUT_VERSION, widgets: layout };
}

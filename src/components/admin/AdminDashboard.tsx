import { useMemo, useState, type ReactNode } from "react";
import {
  BOARD_COUNT,
  OPEN_PLACEMENTS,
  WALKTHROUGH_SHOWN,
  desksByKind,
  payingBoard,
  placementMix,
  placementWeekly,
} from "../../data/adminBoard";
import {
  WIDGET_META,
  defaultLayout,
  persistLayout,
  readStoredLayout,
  type VizKind,
  type WidgetLayout,
} from "../../admin/dashboardLayout";
import { formatUsd, rankedInstitutions, type AppMode } from "../../data/mock";
import type { ClientDataSource } from "../../api/clients";
import type { ClientPassport, ClientSummary } from "../../../shared/types";
import { Badge } from "../ui";
import { BarList, Donut, Sparkline, StackedBar, StatusPanel, type ChartSlice } from "./Charts";

const MODE_SLICES: { id: AppMode; label: string; tone: ChartSlice["tone"] }[] = [
  { id: "client", label: "Client", tone: "camel" },
  { id: "institution", label: "Institution", tone: "sage" },
  { id: "admin", label: "Admin", tone: "ink" },
];

const TONES: ChartSlice["tone"][] = ["camel", "sage", "ink", "clay", "stone"];

export function AdminDashboard({
  clients,
  passport,
  source,
  mode,
  selectClient,
}: {
  clients: ClientSummary[];
  passport: ClientPassport;
  source: ClientDataSource;
  mode: AppMode;
  selectClient: (id: string) => void;
}) {
  const [layout, setLayout] = useState<WidgetLayout[]>(readStoredLayout);
  const [editing, setEditing] = useState(false);

  function update(next: WidgetLayout[]) {
    setLayout(next);
    persistLayout(next);
  }

  const visible = layout.filter((item) => item.visible);
  const hidden = layout.filter((item) => !item.visible);

  return (
    <section className="stack">
      <div className="dash-toolbar">
        <div>
          <p className="kicker" style={{ margin: 0 }}>
            Customizable dashboard
          </p>
          <p className="tiny muted" style={{ margin: "0.2rem 0 0" }}>
            Layout is saved in this browser. Live slices use the client API (or seed fallback); board
            counts stay illustrated fixtures.
          </p>
        </div>
        <div className="row">
          <button type="button" className="dash-tool" aria-pressed={editing} onClick={() => setEditing((on) => !on)}>
            {editing ? "Done" : "Customize"}
          </button>
          <button
            type="button"
            className="dash-tool"
            onClick={() => {
              update(defaultLayout());
              setEditing(true);
            }}
          >
            Reset layout
          </button>
        </div>
      </div>

      {editing && hidden.length > 0 ? (
        <div className="row">
          <span className="tiny muted">Add back:</span>
          {hidden.map((item) => (
            <button
              key={item.id}
              type="button"
              className="dash-tool"
              onClick={() =>
                update(layout.map((row) => (row.id === item.id ? { ...row, visible: true } : row)))
              }
            >
              {WIDGET_META[item.id].title}
            </button>
          ))}
        </div>
      ) : null}

      <div className="dash-grid">
        {visible.map((item) => (
          <article key={item.id} className={`dash-widget span-${item.span}`}>
            {editing ? (
              <WidgetChrome
                layout={layout}
                item={item}
                onChange={update}
              />
            ) : null}
            <WidgetBody
              item={item}
              clients={clients}
              passport={passport}
              source={source}
              mode={mode}
              selectClient={selectClient}
            />
          </article>
        ))}
      </div>
    </section>
  );
}

function WidgetChrome({
  layout,
  item,
  onChange,
}: {
  layout: WidgetLayout[];
  item: WidgetLayout;
  onChange: (next: WidgetLayout[]) => void;
}) {
  const index = layout.findIndex((row) => row.id === item.id);
  const meta = WIDGET_META[item.id];

  function move(delta: number) {
    const next = [...layout];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    const [removed] = next.splice(index, 1);
    next.splice(target, 0, removed);
    onChange(next);
  }

  function patch(partial: Partial<WidgetLayout>) {
    onChange(layout.map((row) => (row.id === item.id ? { ...row, ...partial } : row)));
  }

  return (
    <div className="dash-chrome">
      <button type="button" className="dash-icon" onClick={() => move(-1)} aria-label="Move widget up" disabled={index === 0}>
        ↑
      </button>
      <button
        type="button"
        className="dash-icon"
        onClick={() => move(1)}
        aria-label="Move widget down"
        disabled={index === layout.length - 1}
      >
        ↓
      </button>
      <label className="tiny muted">
        View
        <select
          value={item.viz}
          onChange={(event) => patch({ viz: event.target.value as VizKind })}
          aria-label={`${meta.title} visualization`}
        >
          {meta.allowedViz.map((viz) => (
            <option key={viz} value={viz}>
              {viz}
            </option>
          ))}
        </select>
      </label>
      <label className="tiny muted">
        Width
        <select
          value={item.span}
          onChange={(event) => patch({ span: Number(event.target.value) === 2 ? 2 : 1 })}
          aria-label={`${meta.title} width`}
        >
          <option value={1}>1 col</option>
          <option value={2}>2 col</option>
        </select>
      </label>
      <button type="button" className="dash-icon" onClick={() => patch({ visible: false })} aria-label={`Hide ${meta.title}`}>
        Hide
      </button>
    </div>
  );
}

function WidgetBody({
  item,
  clients,
  passport,
  source,
  mode,
  selectClient,
}: {
  item: WidgetLayout;
  clients: ClientSummary[];
  passport: ClientPassport;
  source: ClientDataSource;
  mode: AppMode;
  selectClient: (id: string) => void;
}) {
  const aumRows = useMemo<ChartSlice[]>(
    () =>
      clients.map((client, index) => ({
        label: `${client.clientFirstName} · ${client.name}`,
        value: client.householdValue,
        tone: TONES[index % TONES.length],
      })),
    [clients],
  );
  const aumTotal = aumRows.reduce((sum, row) => sum + row.value, 0);
  const kindRows = desksByKind().map((row) => ({
    label: row.label,
    value: row.count,
    tone: row.tone,
  }));
  const shownVsRest: ChartSlice[] = [
    { label: "Shown in walkthrough", value: WALKTHROUGH_SHOWN, tone: "sage" },
    { label: "On the board only", value: BOARD_COUNT - WALKTHROUGH_SHOWN, tone: "stone" },
  ];
  const placementRows: ChartSlice[] = placementMix.map((row) => ({
    label: row.label,
    value: row.count,
    tone: row.tone,
  }));
  const reused = passport.opsPacket.fields.filter((field) => field.reused).length;
  const needed = passport.opsPacket.fields.filter((field) => !field.reused).length;
  const opsRows: ChartSlice[] = [
    { label: "Reused from passport", value: reused, tone: "sage" },
    { label: "Still collected", value: needed, tone: "clay" },
  ];
  const modeRows: ChartSlice[] = MODE_SLICES.map((slice) => ({
    label: slice.label + (slice.id === mode ? " · current" : ""),
    value: 1,
    tone: slice.tone,
  }));
  const ranked = rankedInstitutions();
  const rankRows: ChartSlice[] = ranked.map((firm, index) => ({
    label: `Rank ${firm.offer.rank} · ${firm.name}`,
    value: ranked.length - index,
    tone: TONES[index % TONES.length],
  }));
  const clerkOn = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY?.trim());
  const apiOn = source === "api";

  switch (item.id) {
    case "clients":
      return (
        <MetricShell
          kicker={WIDGET_META.clients.title}
          value={String(clients.length)}
          note={clients.map((client) => client.clientFirstName).join(" · ") || "No records"}
        >
          {renderViz(item.viz, {
            bars: (
              <BarList
                rows={aumRows.length ? aumRows : [{ label: "None", value: 0, tone: "stone" }]}
                format={(n) => formatUsd(n, true)}
                selected={`${passport.household.clientFirstName} · ${passport.household.name}`}
                onSelect={(label) => {
                  const match = clients.find((client) => `${client.clientFirstName} · ${client.name}` === label);
                  if (match) selectClient(match.id);
                }}
              />
            ),
            donut: <Donut rows={clients.map((_, i) => ({ label: clients[i].clientFirstName, value: 1, tone: TONES[i] }))} center={String(clients.length)} />,
            stack: null,
            status: null,
          })}
        </MetricShell>
      );
    case "institutions":
      return (
        <MetricShell
          kicker={WIDGET_META.institutions.title}
          value={String(BOARD_COUNT)}
          note={`${WALKTHROUGH_SHOWN} shown in this walkthrough`}
        >
          {renderViz(item.viz, {
            donut: <Donut rows={shownVsRest} center={String(BOARD_COUNT)} />,
            bars: <BarList rows={kindRows} />,
            stack: null,
            status: null,
          })}
          <p className="tiny muted" style={{ marginTop: "0.7rem" }}>
            Walkthrough desks: {payingBoard.filter((desk) => desk.walkthrough).map((desk) => desk.name).join(" · ")}
          </p>
        </MetricShell>
      );
    case "aum":
      return (
        <MetricShell
          kicker={WIDGET_META.aum.title}
          value={formatUsd(aumTotal, true)}
          note={`${clients.length} passports · ${aumRows.map((row) => `${formatUsd(row.value, true)}`).join(" · ")}`}
        >
          {renderViz(item.viz, {
            stack: <StackedBar rows={aumRows} format={(n) => formatUsd(n, true)} />,
            bars: <BarList rows={aumRows} format={(n) => formatUsd(n, true)} />,
            donut: <Donut rows={aumRows} center={formatUsd(aumTotal, true)} format={(n) => formatUsd(n, true)} />,
            status: null,
          })}
        </MetricShell>
      );
    case "placements":
      return (
        <MetricShell
          kicker={WIDGET_META.placements.title}
          value={String(OPEN_PLACEMENTS)}
          note="Ranked strategy / bps / special slots — fixture mix, not a live exchange"
        >
          <Sparkline values={placementWeekly} />
          {renderViz(item.viz, {
            stack: <StackedBar rows={placementRows} />,
            bars: <BarList rows={placementRows} />,
            donut: <Donut rows={placementRows} center={String(OPEN_PLACEMENTS)} />,
            status: null,
          })}
        </MetricShell>
      );
    case "ops":
      return (
        <MetricShell
          kicker={WIDGET_META.ops.title}
          value={`${reused} / ${passport.opsPacket.total}`}
          note={`${passport.household.name} · ${passport.opsPacket.title}`}
        >
          {renderViz(item.viz, {
            donut: <Donut rows={opsRows} center={`${reused}/${passport.opsPacket.total}`} />,
            bars: <BarList rows={opsRows} />,
            stack: null,
            status: null,
          })}
        </MetricShell>
      );
    case "modes":
      return (
        <MetricShell kicker={WIDGET_META.modes.title} value="3" note="Client · Institution · Admin">
          {renderViz(item.viz, {
            donut: <Donut rows={modeRows} center="3" />,
            bars: <BarList rows={modeRows} />,
            stack: null,
            status: null,
          })}
        </MetricShell>
      );
    case "rank-depth":
      return (
        <MetricShell
          kicker={WIDGET_META["rank-depth"].title}
          value={String(ranked.length)}
          note="Portfolio-fit order, not an optimizer"
        >
          {renderViz(item.viz, {
            bars: <BarList rows={rankRows} format={(n) => String(n)} />,
            donut: (
              <Donut
                rows={rankRows.map((row) => ({ ...row, value: 1 }))}
                center={String(ranked.length)}
              />
            ),
            stack: null,
            status: null,
          })}
        </MetricShell>
      );
    case "api":
      return (
        <MetricShell
          kicker={WIDGET_META.api.title}
          value={apiOn ? "SQLite" : "Seed"}
          note="GET /api/clients · PATCH consent"
        >
          {renderViz(item.viz, {
            status: (
              <StatusPanel
                ok={apiOn}
                title={apiOn ? "SQLite API reachable" : "Bundled seed fallback"}
                detail={
                  apiOn
                    ? "Client records and consent persist in data/wealthpass.sqlite."
                    : "GitHub Pages has no API. The same two seeds are bundled in the client."
                }
              />
            ),
            bars: (
              <BarList
                rows={[
                  { label: "GET /api/clients", value: apiOn ? 1 : 0, tone: "sage" },
                  { label: "PATCH consent", value: apiOn ? 1 : 0, tone: "camel" },
                ]}
                format={(n) => (n ? "up" : "down")}
              />
            ),
            donut: null,
            stack: null,
          })}
        </MetricShell>
      );
    case "clerk":
      return (
        <MetricShell
          kicker={WIDGET_META.clerk.title}
          value={clerkOn ? "Wired" : "Missing"}
          note="VITE_CLERK_PUBLISHABLE_KEY at build"
        >
          {renderViz(item.viz, {
            status: (
              <StatusPanel
                ok={clerkOn}
                title={clerkOn ? "Publishable key present" : "Publishable key missing"}
                detail="Access is provisioned in Clerk. This demo does not fall back to a password gate."
              />
            ),
            donut: (
              <Donut
                rows={
                  clerkOn
                    ? [{ label: "Wired", value: 1, tone: "sage" }]
                    : [{ label: "Missing", value: 1, tone: "clay" }]
                }
                center={clerkOn ? "On" : "Off"}
              />
            ),
            bars: null,
            stack: null,
          })}
        </MetricShell>
      );
    default:
      return null;
  }
}

function MetricShell({
  kicker,
  value,
  note,
  children,
}: {
  kicker: string;
  value: string;
  note: string;
  children: ReactNode;
}) {
  return (
    <>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p className="kicker">{kicker}</p>
          <div className="dash-value">{value}</div>
          <p className="tiny muted" style={{ margin: "0.35rem 0 0" }}>
            {note}
          </p>
        </div>
        <Badge compact>Live + fixture</Badge>
      </div>
      <div className="dash-viz">{children}</div>
    </>
  );
}

function renderViz(viz: VizKind, parts: Record<VizKind, ReactNode>): ReactNode {
  return parts[viz] ?? parts.bars ?? parts.donut ?? parts.stack ?? parts.status;
}


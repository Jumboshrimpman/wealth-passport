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
import { formatUsd, rankedInstitutions } from "../../data/catalog";
import type { ClientPassport, ClientSummary } from "../../../shared/types";
import { BarList, Donut, Sparkline, StackedBar, type ChartSlice } from "./Charts";

const TONES: ChartSlice["tone"][] = ["camel", "sage", "ink", "clay", "stone"];

function verifiedAumTooltip(name: string, principals: string, householdValue: number): string {
  return `${name} · ${principals}\nVerified household assets ${formatUsd(householdValue)} (${formatUsd(householdValue, true)})`;
}

export function AdminDashboard({
  clients,
  passport,
  selectClient,
}: {
  clients: ClientSummary[];
  passport: ClientPassport;
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
            Reorder, resize, and switch charts. Layout is saved in this browser.
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
            {editing ? <WidgetChrome layout={layout} item={item} onChange={update} /> : null}
            <WidgetBody item={item} clients={clients} passport={passport} selectClient={selectClient} />
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
  selectClient,
}: {
  item: WidgetLayout;
  clients: ClientSummary[];
  passport: ClientPassport;
  selectClient: (id: string) => void;
}) {
  const aumRows = useMemo<ChartSlice[]>(
    () =>
      clients.map((client, index) => ({
        label: `${client.clientFirstName} · ${client.name}`,
        value: client.householdValue,
        tone: TONES[index % TONES.length],
        tooltip: verifiedAumTooltip(client.clientFirstName, client.principals, client.householdValue),
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
    { label: "On this console", value: WALKTHROUGH_SHOWN, tone: "sage" },
    { label: "Remainder of the board", value: BOARD_COUNT - WALKTHROUGH_SHOWN, tone: "stone" },
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
  const ranked = rankedInstitutions();
  const rankRows: ChartSlice[] = ranked.map((firm, index) => ({
    label: `${firm.offer.rank}. ${firm.name}`,
    value: ranked.length - index,
    tone: TONES[index % TONES.length],
    tooltip: `${firm.offer.rank}. ${firm.name} · ${firm.offer.strategy}`,
  }));

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
            donut: (
              <Donut
                rows={clients.map((client, i) => ({
                  label: client.clientFirstName,
                  value: 1,
                  tone: TONES[i],
                }))}
                center={String(clients.length)}
              />
            ),
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
          note={`${WALKTHROUGH_SHOWN} shown on this console`}
        >
          {renderViz(item.viz, {
            donut: <Donut rows={shownVsRest} center={String(BOARD_COUNT)} />,
            bars: <BarList rows={kindRows} />,
            stack: null,
            status: null,
          })}
          <p className="tiny muted" style={{ marginTop: "0.7rem" }}>
            Console desks: {payingBoard.filter((desk) => desk.walkthrough).map((desk) => desk.name).join(" · ")}
          </p>
        </MetricShell>
      );
    case "aum":
      return (
        <MetricShell
          kicker={WIDGET_META.aum.title}
          value={formatUsd(aumTotal, true)}
          note="Hover a bar to verify the person and household assets"
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
          note="Ranked strategy / bps / special slots"
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
    case "bank-ranking":
      return (
        <div className="dash-rank">
          <p className="kicker">{WIDGET_META["bank-ranking"].title}</p>
          {renderViz(item.viz, {
            bars: <BarList rows={rankRows} format={() => ""} />,
            donut: <Donut rows={rankRows.map((row) => ({ ...row, value: 1 }))} center="Rank" />,
            stack: null,
            status: null,
          })}
        </div>
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
      <div>
        <p className="kicker">{kicker}</p>
        <div className="dash-value">{value}</div>
        <p className="tiny muted" style={{ margin: "0.35rem 0 0" }}>
          {note}
        </p>
      </div>
      <div className="dash-viz">{children}</div>
    </>
  );
}

function renderViz(viz: VizKind, parts: Record<VizKind, ReactNode>): ReactNode {
  return parts[viz] ?? parts.bars ?? parts.donut ?? parts.stack ?? parts.status;
}

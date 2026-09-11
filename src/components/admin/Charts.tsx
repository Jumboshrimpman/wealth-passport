export type ChartTone = "camel" | "sage" | "ink" | "clay" | "stone";

export interface ChartSlice {
  label: string;
  value: number;
  tone: ChartTone;
}

export function BarList({
  rows,
  format,
  onSelect,
  selected,
}: {
  rows: ChartSlice[];
  format?: (value: number) => string;
  onSelect?: (label: string) => void;
  selected?: string;
}) {
  const max = Math.max(...rows.map((row) => row.value), 1);
  return (
    <ul className="dash-bars">
      {rows.map((row) => {
        const interactive = Boolean(onSelect);
        const inner = (
          <>
            <span className="dash-bar-meta">
              <span>{row.label}</span>
              <strong>{format ? format(row.value) : row.value}</strong>
            </span>
            <span className="dash-bar-track" aria-hidden="true">
              <span className={`dash-bar-fill tone-${row.tone}`} style={{ width: `${(row.value / max) * 100}%` }} />
            </span>
          </>
        );
        return (
          <li key={row.label}>
            {interactive ? (
              <button
                type="button"
                className={`dash-bar-btn ${selected === row.label ? "selected" : ""}`}
                onClick={() => onSelect?.(row.label)}
              >
                {inner}
              </button>
            ) : (
              inner
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function StackedBar({ rows, format }: { rows: ChartSlice[]; format?: (value: number) => string }) {
  const total = rows.reduce((sum, row) => sum + row.value, 0) || 1;
  return (
    <div className="dash-stack">
      <div className="allocation" aria-hidden="true">
        {rows.map((row) => (
          <span key={row.label} className={`tone-${row.tone}`} style={{ width: `${(row.value / total) * 100}%` }} />
        ))}
      </div>
      <div className="legend">
        {rows.map((row) => (
          <div className="legend-item" key={row.label}>
            <span>
              <i className={`swatch tone-${row.tone}`} />
              {row.label}
            </span>
            <strong>{format ? format(row.value) : row.value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Donut({ rows, center, format }: { rows: ChartSlice[]; center: string; format?: (value: number) => string }) {
  const total = rows.reduce((sum, row) => sum + row.value, 0) || 1;
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  const colors: Record<ChartTone, string> = {
    camel: "var(--camel-400)",
    sage: "var(--sage-300)",
    ink: "var(--camel-900)",
    clay: "#c4a484",
    stone: "#d8d2c6",
  };

  return (
    <div className="dash-donut">
      <svg viewBox="0 0 120 120" width="120" height="120" role="img" aria-label={center}>
        <g transform="rotate(-90 60 60)">
          {rows.map((row) => {
            const length = (row.value / total) * circumference;
            const circle = (
              <circle
                key={row.label}
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke={colors[row.tone]}
                strokeWidth="14"
                strokeDasharray={`${length} ${circumference - length}`}
                strokeDashoffset={-offset}
              />
            );
            offset += length;
            return circle;
          })}
        </g>
        <text x="60" y="58" textAnchor="middle" className="dash-donut-center">
          {center}
        </text>
      </svg>
      <ul className="dash-donut-legend">
        {rows.map((row) => (
          <li key={row.label}>
            <span>
              <i className={`swatch tone-${row.tone}`} />
              {row.label}
            </span>
            <strong>{format ? format(row.value) : row.value}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Sparkline({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = max - min || 1;
  const points = values
    .map((value, index) => {
      const x = values.length === 1 ? 50 : (index / (values.length - 1)) * 100;
      const y = 36 - ((value - min) / span) * 32;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg className="dash-spark" viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true">
      <polyline fill="none" stroke="var(--sage-500)" strokeWidth="2.2" points={points} />
    </svg>
  );
}

export function StatusPanel({
  ok,
  title,
  detail,
}: {
  ok: boolean;
  title: string;
  detail: string;
}) {
  return (
    <div className={`dash-status ${ok ? "ok" : "warn"}`}>
      <div className={`dash-status-pip ${ok ? "ok" : "warn"}`} aria-hidden="true" />
      <div>
        <strong>{title}</strong>
        <p className="tiny muted" style={{ margin: "0.2rem 0 0" }}>
          {detail}
        </p>
      </div>
    </div>
  );
}

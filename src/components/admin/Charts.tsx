export type ChartTone = "camel" | "sage" | "ink" | "clay" | "stone";

export interface ChartSlice {
  label: string;
  value: number;
  tone: ChartTone;
  tooltip?: string;
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
        const tip = row.tooltip ?? `${row.label}: ${format ? format(row.value) : row.value}`;
        const inner = (
          <>
            <span className="dash-bar-meta">
              <span>{row.label}</span>
              {(() => {
                const shown = format ? format(row.value) : String(row.value);
                return shown ? <strong>{shown}</strong> : null;
              })()}
            </span>
            <span className="dash-bar-track">
              <span className={`dash-bar-fill tone-${row.tone}`} style={{ width: `${(row.value / max) * 100}%` }} />
            </span>
            <span className="dash-tooltip" role="tooltip">
              {tip}
            </span>
          </>
        );
        return (
          <li key={row.label}>
            {interactive ? (
              <button
                type="button"
                className={`dash-bar-btn ${selected === row.label ? "selected" : ""}`}
                title={tip}
                onClick={() => onSelect?.(row.label)}
              >
                {inner}
              </button>
            ) : (
              <div className="dash-bar-static" title={tip}>
                {inner}
              </div>
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
      <div className="dash-stack-bar">
        {rows.map((row) => {
          const tip = row.tooltip ?? `${row.label}: ${format ? format(row.value) : row.value}`;
          return (
            <span
              key={row.label}
              className={`dash-seg tone-${row.tone}`}
              style={{ width: `${(row.value / total) * 100}%` }}
              title={tip}
              tabIndex={0}
            >
              <span className="dash-tooltip" role="tooltip">
                {tip}
              </span>
            </span>
          );
        })}
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
            const tip = row.tooltip ?? `${row.label}: ${format ? format(row.value) : row.value}`;
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
              >
                <title>{tip}</title>
              </circle>
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
          <li key={row.label} title={row.tooltip}>
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

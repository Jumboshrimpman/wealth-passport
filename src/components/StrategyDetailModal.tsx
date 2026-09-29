import { useEffect, useRef } from "react";
import { formatUsd } from "../../shared/format.ts";
import { illustrativeNav } from "../../shared/illustrativePath.ts";
import type { StrategyDetail } from "../../shared/strategyDetail.ts";

function matchColor(pct: number): string {
  if (pct >= 95) return "#0b4f2a";
  if (pct >= 92) return "#115c34";
  if (pct >= 88) return "#17683d";
  if (pct >= 84) return "#1e7546";
  if (pct >= 78) return "#26824f";
  return "#34864e";
}

export function StrategyDetailModal({ detail, onClose }: { detail: StrategyDetail; onClose: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    dialogRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const kind = [detail.category, detail.style].filter(Boolean).join(" · ");

  return (
    <div className="accept-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        ref={dialogRef}
        className="accept-modal strategy-detail-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="strategy-detail-title"
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="strategy-detail-head">
          <h2 id="strategy-detail-title">{detail.name}</h2>
          <button type="button" className="reveal-next" onClick={onClose}>
            Close
          </button>
        </div>
        {kind ? <p className="strategy-detail-line">{kind}</p> : null}
        {detail.risk ? <p className="strategy-detail-line">{detail.risk}</p> : null}
        {detail.esg ? <p className="strategy-detail-line">ESG</p> : null}
        {detail.manager ? <p className="strategy-detail-line">{detail.manager}</p> : null}
        {detail.fee ? <p className="strategy-detail-fee">{detail.fee}</p> : null}
        {detail.minimum != null ? (
          <p className="strategy-detail-line">Minimum {formatUsd(detail.minimum, true)}</p>
        ) : (
          <p className="strategy-detail-line">Minimum not listed</p>
        )}
        {detail.inception ? <p className="strategy-detail-line">Inception {detail.inception}</p> : null}
        {detail.productCode ? <p className="strategy-detail-line">Profile code {detail.productCode}</p> : null}
        {detail.eligibility ? (
          <p className={detail.eligibility === "You meet the minimum" ? "strategy-detail-fit meets" : "strategy-detail-fit above"}>
            {detail.eligibility}
          </p>
        ) : null}
        {detail.summary ? <p className="strategy-detail-summary">{detail.summary}</p> : null}
        {detail.note ? <p className="strategy-detail-summary">{detail.note}</p> : null}
        {detail.currentStrategy ? (
          <p className="strategy-from">
            <span className="from-label">Currently</span> {detail.currentStrategy}
          </p>
        ) : null}
        {detail.matchPct != null ? (
          <p className="match-line">
            <span className="match-pct" style={{ color: matchColor(detail.matchPct) }}>
              {detail.matchPct}% match
            </span>
          </p>
        ) : null}
        <p className="accept-modal-kicker">Illustrative path</p>
        <PerformanceChart seed={detail.name} name={detail.name} />
      </div>
    </div>
  );
}

function PerformanceChart({ seed, name }: { seed: string; name: string }) {
  const values = illustrativeNav(seed);
  const width = 360;
  const height = 128;
  const padX = 2;
  const padY = 12;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(max - min, 6);
  const mid = (max + min) / 2;
  const lo = mid - span / 2 - 1;
  const hi = mid + span / 2 + 1;
  const xAt = (index: number) => padX + (index / (values.length - 1)) * (width - padX * 2);
  const yAt = (value: number) => padY + (1 - (value - lo) / (hi - lo)) * (height - padY * 2);
  const line = values
    .map((value, index) => `${index === 0 ? "M" : "L"}${xAt(index).toFixed(2)},${yAt(value).toFixed(2)}`)
    .join(" ");
  const baseline = yAt(100);
  const showBaseline = baseline > padY && baseline < height - padY;
  const last = values[values.length - 1] ?? 100;

  return (
    <figure className="strategy-chart-figure">
      <svg
        className="strategy-chart"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`Illustrative index path for ${name}`}
      >
        {showBaseline ? (
          <line x1={padX} x2={width - padX} y1={baseline} y2={baseline} stroke="#ececec" strokeWidth="1" />
        ) : null}
        <path d={line} fill="none" stroke="#111" strokeWidth="1.35" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <div className="strategy-chart-ends">
        <span>Start 100</span>
        <span>Latest {last.toFixed(1)}</span>
      </div>
      <figcaption className="strategy-chart-note">
        Index starts at 100. Illustrative demo path, not a record of results.
      </figcaption>
    </figure>
  );
}

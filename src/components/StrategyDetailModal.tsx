import { useEffect, useRef } from "react";
import { formatUsd } from "../../shared/format.ts";
import { illustrativeNav } from "../../shared/illustrativePath.ts";
import { ADDITIONAL_FUND_FEE_NOTE, CATALOG_SOURCE_NOTE, securitiesLine, taxPostureLabel } from "../../shared/strategies.ts";
import type { StrategyDetail } from "../../shared/strategyDetail.ts";

function pct(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded}%` : `${rounded.toFixed(1)}%`;
}

function years(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return `${text} years`;
}

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
        {detail.manager ? <p className="strategy-detail-line">Asset manager {detail.manager}</p> : null}
        {detail.fee ? <p className="strategy-detail-fee">{detail.fee}</p> : null}
        {detail.minimum != null ? (
          <p className="strategy-detail-line">Strategy minimum {formatUsd(detail.minimum, true)}</p>
        ) : (
          <p className="strategy-detail-line">Strategy minimum not listed</p>
        )}
        {detail.householdMinimum != null ? (
          <p className="strategy-detail-line">Household minimum {formatUsd(detail.householdMinimum, true)}</p>
        ) : null}
        {detail.accountMinimum != null ? (
          <p className="strategy-detail-line">Account minimum {formatUsd(detail.accountMinimum, true)}</p>
        ) : null}
        {detail.usesAdrs != null ? (
          <p className="strategy-detail-line">{detail.usesAdrs ? "Uses ADRs" : "No ADRs"}</p>
        ) : null}
        {detail.benchmark ? (
          <p className="strategy-detail-line">
            {detail.benchmarkKind === "blended" ? "Blended benchmark" : "Single benchmark"} · {detail.benchmark}
          </p>
        ) : null}
        {detail.taxPosture.length > 0 ? (
          <p className="strategy-detail-line">{detail.taxPosture.map(taxPostureLabel).join(" · ")}</p>
        ) : null}
        {detail.fixedIncome ? (
          <p className="strategy-detail-line">
            {[
              detail.fixedIncome.avgMaturityYears != null ? `Avg maturity ${years(detail.fixedIncome.avgMaturityYears)}` : "",
              detail.fixedIncome.avgDurationYears != null ? `avg duration ${years(detail.fixedIncome.avgDurationYears)}` : "",
              detail.fixedIncome.avgCouponPct != null ? `avg coupon ${pct(detail.fixedIncome.avgCouponPct)}` : "",
              detail.fixedIncome.avgYieldPct != null ? `avg yield ${pct(detail.fixedIncome.avgYieldPct)}` : "",
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        ) : null}
        {detail.turnoverPct != null || securitiesLine(detail) ? (
          <p className="strategy-detail-line">
            {[
              detail.turnoverPct != null ? `Turnover ${pct(detail.turnoverPct)}` : "",
              securitiesLine(detail) ? `${securitiesLine(detail)} securities` : "",
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        ) : null}
        {detail.additionalFundFees ? (
          <p className="strategy-detail-note">
            {ADDITIONAL_FUND_FEE_NOTE}
            {detail.additionalFeesNote ? ` ${detail.additionalFeesNote}` : ""}
          </p>
        ) : null}
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
        <p className="strategy-detail-note">{CATALOG_SOURCE_NOTE}</p>
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

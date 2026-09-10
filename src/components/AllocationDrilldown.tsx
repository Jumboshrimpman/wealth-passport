import { useState, type ReactNode } from "react";
import type { AllocationNode } from "../../shared/types";
import { formatUsd } from "../data/mock";
import { formatPct } from "../data/holdings";
import { Badge } from "./ui";

export function AllocationDrilldown({ tree }: { tree: AllocationNode[] }) {
  return (
    <div className="drill-list">
      {tree.map((assetClass) => (
        <ExpandRow
          key={assetClass.id}
          kicker="Asset class"
          title={assetClass.label}
          value={formatUsd(assetClass.value)}
          weight={formatPct(assetClass.pct)}
          swatch={assetClass.tone}
        >
          {assetClass.sleeves.map((sleeve) => (
            <ExpandRow
              key={`${assetClass.id}-${sleeve.accountId}`}
              nested
              kicker="Sleeve / account"
              title={sleeve.accountName}
              subtitle={sleeve.custodian}
              value={formatUsd(sleeve.value)}
              weight={`${formatPct(sleeve.weightOfClass * 100)} of class`}
            >
              <table className="table drill-table">
                <thead>
                  <tr>
                    <th>Security</th>
                    <th>Kind</th>
                    <th>Value</th>
                    <th>Account wt</th>
                    <th>Book wt</th>
                  </tr>
                </thead>
                <tbody>
                  {sleeve.holdings.map((holding) => (
                    <tr key={holding.id}>
                      <td>
                        <strong>{holding.ticker}</strong>
                        <div className="tiny muted">{holding.name}</div>
                      </td>
                      <td>{holding.kind}</td>
                      <td>{formatUsd(holding.value)}</td>
                      <td>{formatPct(holding.weightOfAccount * 100)}</td>
                      <td>{formatPct(holding.weightOfBook * 100)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ExpandRow>
          ))}
        </ExpandRow>
      ))}
    </div>
  );
}

function ExpandRow({
  kicker,
  title,
  subtitle,
  value,
  weight,
  swatch,
  nested = false,
  children,
}: {
  kicker: string;
  title: string;
  subtitle?: string;
  value: string;
  weight: string;
  swatch?: string;
  nested?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`drill-row ${nested ? "nested" : ""} ${open ? "open" : ""}`}>
      <button type="button" className="drill-toggle" aria-expanded={open} onClick={() => setOpen((current) => !current)}>
        <span className="drill-toggle-copy">
          <span className="kicker" style={{ margin: 0 }}>
            {kicker}
          </span>
          <span className="drill-title">
            {swatch ? <i className={`swatch tone-${swatch}`} /> : null}
            {title}
          </span>
          {subtitle ? <span className="tiny muted">{subtitle}</span> : null}
        </span>
        <span className="drill-metrics">
          <Badge compact>{weight}</Badge>
          <strong>{value}</strong>
          <span className="drill-chevron" aria-hidden="true">
            {open ? "▾" : "▸"}
          </span>
        </span>
      </button>
      {open ? <div className="drill-body">{children}</div> : null}
    </div>
  );
}

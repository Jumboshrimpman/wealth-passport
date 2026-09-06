import type { ReactNode } from "react";

export function Badge({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: "default" | "verified" | "paid" | "warn";
}) {
  return (
    <span className={`badge ${tone === "default" ? "" : tone}`.trim()}>
      <span className="dot" aria-hidden="true" />
      {children}
    </span>
  );
}

export function Disclaimer({ children }: { children: ReactNode }) {
  return <aside className="disclaimer">{children}</aside>;
}

export function Stat({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <article className="card stat">
      <div className="label">{label}</div>
      <div className="value">{value}</div>
      {note ? <p className="tiny muted" style={{ margin: "0.45rem 0 0" }}>{note}</p> : null}
    </article>
  );
}

export function SectionHead({
  kicker,
  title,
  lede,
}: {
  kicker: string;
  title: string;
  lede: string;
}) {
  return (
    <header className="stack" style={{ gap: "0.15rem", marginBottom: "1.15rem" }}>
      <p className="kicker">{kicker}</p>
      <h1>{title}</h1>
      <p className="lede">{lede}</p>
    </header>
  );
}

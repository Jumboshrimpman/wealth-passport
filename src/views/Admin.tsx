import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import type { Enrollment, EnrollmentSummary } from "../../shared/enrollment.ts";
import type { AuditEvent } from "../../shared/types.ts";
import { fetchEvents } from "../api/admin";
import {
  fetchEnrollment,
  listEnrollments,
  resolveEnrollmentDecision,
  type EnrollmentSource,
} from "../api/enroll";
import { AdminDashboard } from "../components/admin/AdminDashboard";
import { Badge, Disclaimer, SectionHead } from "../components/ui";
import { useClient } from "../context/ClientContext";
import { useConsent } from "../context/ConsentContext";
import { useOffers } from "../context/OfferContext";
import { formatUsd, offerHeadline } from "../data/catalog";

const EVENT_KIND_LABEL: Record<AuditEvent["kind"], string> = {
  "consent.changed": "Consent",
  "placement.decided": "Placement",
  "enrollment.submitted": "Enrollment",
  "enrollment.decided": "Compliance",
  "admin.layout_updated": "Admin",
};

export function Admin() {
  const consent = useConsent();
  const { passport, clients, selectClient } = useClient();
  const { eligible } = useOffers();
  const { user } = useUser();
  const officer =
    user?.fullName ?? user?.primaryEmailAddress?.emailAddress ?? "Compliance desk";
  const household = passport.household;
  const [enrollments, setEnrollments] = useState<EnrollmentSummary[]>([]);
  const [enrollmentSource, setEnrollmentSource] = useState<EnrollmentSource>("local");
  const [events, setEvents] = useState<AuditEvent[] | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Enrollment | null>(null);
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);

  const loadEnrollments = useCallback(() => {
    return listEnrollments()
      .then((result) => {
        setEnrollments(result.enrollments);
        setEnrollmentSource(result.source);
      })
      .catch(() => setEnrollments([]));
  }, []);

  useEffect(() => {
    void loadEnrollments();
  }, [loadEnrollments]);

  function toggleReview(id: string) {
    setResolveError(null);
    if (expandedId === id) {
      setExpandedId(null);
      setDetail(null);
      return;
    }
    setExpandedId(id);
    setDetail(null);
    void fetchEnrollment(id).then(setDetail);
  }

  async function resolve(id: string, decision: "approved" | "rejected") {
    setResolving(true);
    setResolveError(null);
    const result = await resolveEnrollmentDecision(id, decision, officer);
    setResolving(false);
    if (result.error) {
      setResolveError(result.error);
      return;
    }
    setDetail(result.enrollment ?? null);
    await loadEnrollments();
    void fetchEvents().then(setEvents).catch(() => undefined);
  }

  useEffect(() => {
    let live = true;
    fetchEvents()
      .then((rows) => {
        if (live) setEvents(rows);
      })
      .catch(() => {
        if (live) setEvents(null);
      });
    return () => {
      live = false;
    };
  }, []);

  return (
    <div className="stack">
      <SectionHead
        kicker="Admin · control room"
        title="Operations dashboard"
        lede="Widgets for client records, verified AUM, institutions, placements, placement revenue, ops reuse, and bank ranking. Reorder, resize, and switch charts. Client and Institution modes stay separate; this mode is the only place that stacks both."
      />

      <AdminDashboard clients={clients} passport={passport} selectClient={selectClient} />

      <Disclaimer>
        Verified AUM is household value stored on each client record. Hover a bar to confirm the
        person and total household assets.
      </Disclaimer>

      <div className="split">
        <section className="panel">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div>
              <p className="kicker">Client side</p>
              <h2>{household.name}</h2>
            </div>
            <Link to="/passport" className="badge">
              Open passport
            </Link>
          </div>
          <p>
            {household.principals} · Account {formatUsd(household.accountValue)} · Household{" "}
            {formatUsd(household.householdValue)} · Investable {formatUsd(household.investable)} ·{" "}
            {household.risk.label}. {clients.length} client records available.
          </p>
          <div className="row">
            <Badge tone={consent.shared ? "verified" : "warn"}>
              {consent.shared
                ? "Passport share on — any paying institution may offer"
                : "Passport share off — no offers"}
            </Badge>
          </div>
          <p className="tiny muted">
            <Link to="/chat">Open chat</Link>
            {" · "}
            <Link to="/ops">Open ops reuse</Link>
            {" · "}
            <Link to="/verification">Open verification</Link>
            {" · "}
            <Link to="/offers">Open inbox</Link>
          </p>
        </section>

        <section className="panel">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div>
              <p className="kicker">Institution side</p>
              <h2>Ranked paid placements</h2>
            </div>
            <Link to="/institution" className="badge">
              Open console
            </Link>
          </div>
          <p className="tiny muted" style={{ marginTop: 0 }}>
            Matched against the {household.name} record in the client store.
          </p>
          {eligible.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Firm</th>
                  <th>Terms</th>
                </tr>
              </thead>
              <tbody>
                {eligible.map((match) => (
                  <tr key={match.institution.id}>
                    <td>{match.institution.offer.rank}</td>
                    <td>
                      <strong>{match.institution.name}</strong>
                      <div className="tiny muted">{match.institution.kindLabel}</div>
                    </td>
                    <td>
                      {offerHeadline(match.institution.offer)}
                      <div>
                        <Badge tone="paid" compact>
                          {match.institution.offer.placementLabel}
                        </Badge>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="muted">No eligible placements for this client while consent is off.</p>
          )}
        </section>
      </div>

      <section className="panel">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <div>
            <p className="kicker">Compliance</p>
            <h2>Enrollment review queue</h2>
          </div>
          <Badge>{enrollmentSource === "api" ? "From client database" : "Browser storage"}</Badge>
        </div>
        {enrollments.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>Applicant</th>
                <th>Status</th>
                <th>Risk</th>
                <th>Submitted</th>
                <th>Review</th>
              </tr>
            </thead>
            <tbody>
              {enrollments.map((enrollment) => (
                <EnrollmentRow
                  key={enrollment.id}
                  enrollment={enrollment}
                  expanded={expandedId === enrollment.id}
                  detail={expandedId === enrollment.id ? detail : null}
                  resolving={resolving}
                  resolveError={expandedId === enrollment.id ? resolveError : null}
                  onToggle={() => toggleReview(enrollment.id)}
                  onResolve={resolve}
                />
              ))}
            </tbody>
          </table>
        ) : (
          <p className="muted">
            No enrollments yet. New files submitted through <Link to="/enroll">Enroll Now</Link>{" "}
            appear here for compliance review.
          </p>
        )}
      </section>

      <section className="panel">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <div>
            <p className="kicker">Audit trail</p>
            <h2>Every decision, logged</h2>
          </div>
          <Badge>Append-only</Badge>
        </div>
        <p className="tiny muted" style={{ marginTop: 0 }}>
          Consent changes, placement decisions, enrollment submissions, and admin actions are
          written to the client database as immutable rows — the examination-ready record.
        </p>
        {events === null ? (
          <p className="muted">API offline — the audit trail lives in the client database.</p>
        ) : events.length === 0 ? (
          <p className="muted">
            No events yet. Consent toggles, offer decisions, and enrollment submissions appear
            here.
          </p>
        ) : (
          <ul className="timeline">
            {events.map((event) => (
              <li key={event.id}>
                <p className="tiny muted" style={{ marginBottom: 0 }}>
                  {new Date(event.ts).toLocaleString("en-US", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}{" "}
                  · {event.actor}
                </p>
                <div className="row" style={{ marginTop: "0.3rem" }}>
                  <Badge compact>{EVENT_KIND_LABEL[event.kind] ?? event.kind}</Badge>
                </div>
                <p style={{ marginTop: "0.3rem" }}>{event.summary}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function EnrollmentRow({
  enrollment,
  expanded,
  detail,
  resolving,
  resolveError,
  onToggle,
  onResolve,
}: {
  enrollment: EnrollmentSummary;
  expanded: boolean;
  detail: Enrollment | null;
  resolving: boolean;
  resolveError: string | null;
  onToggle: () => void;
  onResolve: (id: string, decision: "approved" | "rejected") => void;
}) {
  return (
    <>
      <tr>
        <td>
          <strong>{enrollment.fullName}</strong>
          <div className="tiny muted">{enrollment.email}</div>
        </td>
        <td>
          <Badge tone={enrollment.status === "approved" ? "verified" : "warn"} compact>
            {enrollment.status === "approved"
              ? "Approved"
              : enrollment.status === "edd"
                ? "EDD pending"
                : "Rejected"}
          </Badge>
        </td>
        <td>
          {enrollment.riskScore} / 100
          <div className="tiny muted">{enrollment.riskLevel} risk</div>
        </td>
        <td className="tiny muted">
          {new Date(enrollment.createdAt).toLocaleString("en-US", {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </td>
        <td>
          <button type="button" className="dash-tool" onClick={onToggle}>
            {expanded ? "Close" : "Review"}
          </button>
        </td>
      </tr>
      {expanded ? (
        <tr>
          <td colSpan={5}>
            {detail ? (
              <div className="stack" style={{ gap: "0.7rem", padding: "0.4rem 0" }}>
                <div className="row">
                  <Badge tone={detail.screening.sanctions.status === "no-hit" ? "verified" : "warn"} compact>
                    Sanctions: {detail.screening.sanctions.status}
                  </Badge>
                  <Badge tone={detail.screening.pep.status === "no-hit" ? "verified" : "warn"} compact>
                    PEP: {detail.screening.pep.status}
                  </Badge>
                  <Badge
                    tone={detail.screening.adverseMedia.status === "no-hit" ? "verified" : "warn"}
                    compact
                  >
                    Adverse media: {detail.screening.adverseMedia.status}
                  </Badge>
                </div>
                {detail.risk.factors.length > 0 ? (
                  <ul className="tiny" style={{ margin: 0, paddingLeft: "1.1rem" }}>
                    {detail.risk.factors.map((factor) => (
                      <li key={factor.label}>
                        {factor.label} <span className="muted">+{factor.points}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
                <ul className="tiny" style={{ margin: 0, paddingLeft: "1.1rem" }}>
                  {detail.decision.reasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
                {detail.decision.eddChecklist.length > 0 ? (
                  <div>
                    <p className="kicker" style={{ marginBottom: "0.4rem" }}>
                      EDD checklist
                    </p>
                    <ul className="tiny" style={{ margin: 0, paddingLeft: "1.1rem" }}>
                      {detail.decision.eddChecklist.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {detail.decision.accountId ? (
                  <p className="tiny" style={{ margin: 0 }}>
                    Account ID <strong>{detail.decision.accountId}</strong>
                  </p>
                ) : null}
                {detail.status === "edd" ? (
                  <div className="row">
                    <button
                      type="button"
                      className="gate-submit"
                      disabled={resolving}
                      onClick={() => onResolve(detail.id, "approved")}
                    >
                      {resolving ? "Signing off…" : "Approve & activate"}
                    </button>
                    <button
                      type="button"
                      className="offer-decline"
                      disabled={resolving}
                      onClick={() => onResolve(detail.id, "rejected")}
                    >
                      Reject
                    </button>
                  </div>
                ) : (
                  <p className="tiny muted" style={{ margin: 0 }}>
                    File resolved — {detail.status}.
                  </p>
                )}
                {resolveError ? (
                  <aside className="gate-error" role="alert">
                    {resolveError}
                  </aside>
                ) : null}
              </div>
            ) : (
              <p className="tiny muted">Loading file…</p>
            )}
          </td>
        </tr>
      ) : null}
    </>
  );
}

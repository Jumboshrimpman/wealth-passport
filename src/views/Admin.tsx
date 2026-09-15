import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { EnrollmentSummary } from "../../shared/enrollment.ts";
import { listEnrollments, type EnrollmentSource } from "../api/enroll";
import { AdminDashboard } from "../components/admin/AdminDashboard";
import { Badge, Disclaimer, SectionHead } from "../components/ui";
import { useClient } from "../context/ClientContext";
import { useConsent } from "../context/ConsentContext";
import { useOffers } from "../context/OfferContext";
import { formatUsd, offerHeadline } from "../data/catalog";

export function Admin() {
  const consent = useConsent();
  const { passport, clients, selectClient } = useClient();
  const { eligible } = useOffers();
  const household = passport.household;
  const [enrollments, setEnrollments] = useState<EnrollmentSummary[]>([]);
  const [enrollmentSource, setEnrollmentSource] = useState<EnrollmentSource>("local");

  useEffect(() => {
    let live = true;
    listEnrollments()
      .then((result) => {
        if (!live) return;
        setEnrollments(result.enrollments);
        setEnrollmentSource(result.source);
      })
      .catch(() => {
        if (live) setEnrollments([]);
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
        lede="Widgets for client records, verified AUM, institutions, placements, ops reuse, and bank ranking. Reorder, resize, and switch charts. Client and Institution modes stay separate; this mode is the only place that stacks both."
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
              </tr>
            </thead>
            <tbody>
              {enrollments.map((enrollment) => (
                <tr key={enrollment.id}>
                  <td>
                    <strong>{enrollment.fullName}</strong>
                    <div className="tiny muted">{enrollment.email}</div>
                  </td>
                  <td>
                    <Badge
                      tone={enrollment.status === "approved" ? "verified" : "warn"}
                      compact
                    >
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
                </tr>
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
    </div>
  );
}

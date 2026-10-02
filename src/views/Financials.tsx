import { useState } from "react";
import type { RowAcceptance } from "../../shared/acceptOffer.ts";
import { formatUsd } from "../../shared/format.ts";
import { describeWealth, type WealthPoint } from "../../shared/marketplace.ts";
import { documentsForSegment, segmentDocumentLine } from "../../shared/segmentDocuments.ts";
import { ServiceWaitingNote } from "../components/ServiceWaitingNote";
import { useAcceptedOffers } from "../context/AcceptedOffersContext";
import { useClient } from "../context/ClientContext";
import { useDemo } from "../context/DemoContext";
import { enrollmentMatchesPoint, managerLine } from "../data/assistantFlow";

const CONSENT_DOCS = [
  {
    id: "lpoa",
    label: "Limited power of attorney",
    note: "The manager you select sets up the Schwab brokerage. WealthPass does not hold the LPOA.",
  },
  {
    id: "agreement",
    label: "Client agreement",
    note: "On file from a consent this client has given. Not advice from WealthPass.",
  },
] as const;

function AccountEnrollment({ row }: { row: RowAcceptance }) {
  return (
    <p className="account-enrolled" data-testid="account-enrolled">
      <span className="enrolled-flag">Enrolled</span> {row.strategy}
      <span className="enrolled-meta">{managerLine(row)}</span>
    </p>
  );
}

export function Financials() {
  const { passport } = useClient();
  const { profile } = useDemo();
  const { accepted } = useAcceptedOffers();
  const [openDoc, setOpenDoc] = useState<string | null>(null);
  const active = profile && profile.clientId === passport.id ? profile : null;
  const picture = describeWealth(passport, active);
  const verifiedFlex = picture.verified > 0 ? picture.verified : 0;
  const pendingFlex = picture.pending > 0 ? picture.pending : 0;
  const entries = Object.entries(accepted);
  const matchedKeys = new Set(
    entries
      .filter(([key, row]) => picture.points.some((point) => enrollmentMatchesPoint(point, key, row)))
      .map(([key]) => key),
  );
  const unmatched = entries.filter(([key]) => !matchedKeys.has(key));

  function enrollmentsFor(point: WealthPoint): RowAcceptance[] {
    return entries.filter(([key, row]) => enrollmentMatchesPoint(point, key, row)).map(([, row]) => row);
  }

  return (
    <div className="financials-page">
      <h1>Financials</h1>
      <p className="lede-quiet">
        {passport.household.clientFirstName}&rsquo;s wealth, {formatUsd(picture.total)} in all.
        Verified is solid. Still pending is gray.
      </p>
      <ServiceWaitingNote />
      <div
        className="wealth-bar"
        role="img"
        aria-label={`${formatUsd(picture.verified)} verified, ${formatUsd(picture.pending)} still pending`}
      >
        {verifiedFlex > 0 ? <span className="wealth-verified" style={{ flex: verifiedFlex }} /> : null}
        {pendingFlex > 0 ? <span className="wealth-pending" style={{ flex: pendingFlex }} /> : null}
      </div>
      <p className="wealth-legend">
        <span>
          <i className="swatch solid" aria-hidden="true" /> {formatUsd(picture.verified)} verified
        </span>
        <span>
          <i className="swatch gray" aria-hidden="true" /> {formatUsd(picture.pending)} still pending
        </span>
      </p>
      <ul className="wealth-points">
        {picture.points.map((point) => {
          const documents = documentsForSegment(point);
          return (
            <li key={point.id}>
              <div className="wealth-copy">
                <strong>{point.label}</strong>
                {enrollmentsFor(point).map((row) => (
                  <AccountEnrollment key={row.choiceId} row={row} />
                ))}
                {point.note ? <span className="wealth-note">{point.note}</span> : null}
                {documents.length > 0 ? (
                  <p className="segment-docs">
                    {documents.map((document) => (
                      <button
                        key={document.id}
                        type="button"
                        className="doc-link"
                        aria-expanded={openDoc === document.id}
                        onClick={() => setOpenDoc((current) => (current === document.id ? null : document.id))}
                      >
                        {document.label}
                      </button>
                    ))}
                  </p>
                ) : null}
                {documents.some((document) => document.id === openDoc) ? (
                  <p className="doc-stub">{segmentDocumentLine(documents.find((document) => document.id === openDoc)?.label ?? "Document")}</p>
                ) : null}
              </div>
              <span className={point.status}>{formatUsd(point.amount)}</span>
            </li>
          );
        })}
        {unmatched.map(([key, row]) => (
          <li key={key} data-testid="account-enrolled-row">
            <div className="wealth-copy">
              <strong>{row.accountName}</strong>
              <AccountEnrollment row={row} />
            </div>
          </li>
        ))}
      </ul>
      <section className="consent-file" aria-labelledby="consent-file-title">
        <h2 id="consent-file-title">On file</h2>
        <p>Documents this client has consented to. Not advice from WealthPass.</p>
        <ul>
          {CONSENT_DOCS.map((document) => (
            <li key={document.id}>
              <button
                type="button"
                className="doc-link"
                aria-expanded={openDoc === document.id}
                onClick={() => setOpenDoc((current) => (current === document.id ? null : document.id))}
              >
                {document.label}
              </button>
              <span>{document.note}</span>
              {openDoc === document.id ? <p className="doc-stub">Demo placeholder. Nothing is stored.</p> : null}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

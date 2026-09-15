import { useMemo, useState } from "react";
import {
  emptyEnrollmentPayload,
  type Enrollment,
  type EnrollmentPayload,
} from "../../shared/enrollment.ts";
import { submitEnrollment, type EnrollmentSource } from "../api/enroll";
import { Badge, Disclaimer, SectionHead } from "../components/ui";
import { ENROLL_STEPS, stepErrors } from "../enroll/form";
import {
  AccountStep,
  EntityStep,
  FinancialStep,
  IdentityStep,
  PepStep,
  PersonalStep,
  ReviewStep,
} from "../enroll/steps";

export function Enroll() {
  const [payload, setPayload] = useState<EnrollmentPayload>(emptyEnrollmentPayload);
  const [stepIndex, setStepIndex] = useState(0);
  const [attempted, setAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitErrors, setSubmitErrors] = useState<string[]>([]);
  const [result, setResult] = useState<Enrollment | null>(null);
  const [resultSource, setResultSource] = useState<EnrollmentSource>("local");

  const step = ENROLL_STEPS[stepIndex];
  const errors = useMemo(() => stepErrors(step.id, payload), [step.id, payload]);

  function patch<K extends keyof EnrollmentPayload>(
    section: K,
    partial: Partial<EnrollmentPayload[K]>,
  ) {
    setPayload((current) => ({ ...current, [section]: { ...current[section], ...partial } }));
  }

  function goNext() {
    if (errors.length > 0) {
      setAttempted(true);
      return;
    }
    setAttempted(false);
    setStepIndex((index) => Math.min(index + 1, ENROLL_STEPS.length - 1));
  }

  function goBack() {
    setAttempted(false);
    setStepIndex((index) => Math.max(index - 1, 0));
  }

  async function submit() {
    setSubmitting(true);
    setSubmitErrors([]);
    const outcome = await submitEnrollment(payload);
    setSubmitting(false);
    if (outcome.errors) {
      setSubmitErrors(outcome.errors);
      return;
    }
    if (outcome.enrollment) {
      setResult(outcome.enrollment);
      setResultSource(outcome.source);
    }
  }

  function reset() {
    setPayload(emptyEnrollmentPayload());
    setStepIndex(0);
    setAttempted(false);
    setSubmitErrors([]);
    setResult(null);
  }

  if (result) {
    return <EnrollmentResult enrollment={result} source={resultSource} onReset={reset} />;
  }

  const isLast = stepIndex === ENROLL_STEPS.length - 1;

  return (
    <div className="stack">
      <SectionHead
        kicker="Client view · new account"
        title="Enroll in WealthPass"
        lede="KYC/AML onboarding: identity verification, beneficial ownership, PEP and sanctions disclosure, source of funds, then automated screening and a compliance decision. Low-risk enrollments auto-approve; higher-risk files route to enhanced due diligence."
      />

      <nav className="enroll-progress" aria-label="Enrollment progress">
        {ENROLL_STEPS.map((item, index) => (
          <span
            key={item.id}
            className={`enroll-step ${index === stepIndex ? "active" : ""} ${index < stepIndex ? "done" : ""}`.trim()}
          >
            {index + 1}. {item.title}
          </span>
        ))}
      </nav>

      <section className="panel stack">
        <div>
          <p className="kicker">
            Step {stepIndex + 1} of {ENROLL_STEPS.length}
          </p>
          <h2>{step.title}</h2>
          <p className="muted tiny" style={{ margin: "0.3rem 0 0" }}>
            {step.blurb}
          </p>
        </div>

        {step.id === "account" ? <AccountStep payload={payload} patch={patch} /> : null}
        {step.id === "identity" ? <IdentityStep payload={payload} patch={patch} /> : null}
        {step.id === "personal" ? <PersonalStep payload={payload} patch={patch} /> : null}
        {step.id === "entity" ? <EntityStep payload={payload} patch={patch} /> : null}
        {step.id === "pep" ? <PepStep payload={payload} patch={patch} /> : null}
        {step.id === "financial" ? <FinancialStep payload={payload} patch={patch} /> : null}
        {step.id === "review" ? <ReviewStep payload={payload} patch={patch} /> : null}

        {attempted && errors.length > 0 ? (
          <aside className="gate-error" role="alert">
            <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
              {errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </aside>
        ) : null}
        {submitErrors.length > 0 ? (
          <aside className="gate-error" role="alert">
            <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
              {submitErrors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </aside>
        ) : null}

        <div className="row" style={{ justifyContent: "space-between" }}>
          <button type="button" className="dash-tool" onClick={goBack} disabled={stepIndex === 0}>
            Back
          </button>
          {isLast ? (
            <button type="button" className="gate-submit" onClick={() => void submit()} disabled={submitting}>
              {submitting ? "Screening…" : "Submit for compliance review"}
            </button>
          ) : (
            <button type="button" className="gate-submit" onClick={goNext}>
              Continue
            </button>
          )}
        </div>
      </section>

      <Disclaimer>
        Submission runs sanctions, PEP, and adverse-media screening plus a transparent risk score
        (0–100). Approvals issue an account ID immediately; enhanced-diligence files return a
        tailored document checklist with a five-business-day timeline.
      </Disclaimer>
    </div>
  );
}

function ScreeningLine({
  label,
  outcome,
}: {
  label: string;
  outcome: Enrollment["screening"]["sanctions"];
}) {
  return (
    <div className="row" style={{ justifyContent: "space-between" }}>
      <span>{label}</span>
      {outcome.status === "no-hit" ? (
        <Badge tone="verified" compact>
          No hit
        </Badge>
      ) : (
        <Badge tone="warn" compact>
          {outcome.status === "high-confidence" ? "High-confidence hit" : "Low-confidence hit"} —{" "}
          {outcome.hits[0]?.matchedName} ({outcome.hits[0]?.list})
        </Badge>
      )}
    </div>
  );
}

function EnrollmentResult({
  enrollment,
  source,
  onReset,
}: {
  enrollment: Enrollment;
  source: EnrollmentSource;
  onReset: () => void;
}) {
  const { decision, risk, screening, payload } = enrollment;
  const tone =
    decision.status === "approved" ? "verified" : decision.status === "edd" ? "warn" : "warn";
  const headline =
    decision.status === "approved"
      ? "Approved — account active"
      : decision.status === "edd"
        ? "Enhanced due diligence required"
        : "Unable to proceed";

  return (
    <div className="stack">
      <SectionHead
        kicker="Compliance decision"
        title={headline}
        lede={
          decision.status === "approved"
            ? "The automated checks passed and the compliance acknowledgments are signed. The account is active."
            : decision.status === "edd"
              ? "The file needs additional information. Upload the documents below; the compliance team resolves EDD files within five business days."
              : "We are unable to open this account. Contact support for detail; an appeal path with compliance review is available."
        }
      />

      <section className="panel stack">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <div className="row">
            <Badge tone={tone}>
              {decision.status === "approved" ? "Approved" : decision.status === "edd" ? "EDD pending" : "Rejected"}
            </Badge>
            <Badge>
              Risk {risk.score} / 100 · {risk.level}
            </Badge>
          </div>
          <Badge>{source === "api" ? "Saved to client database" : "Saved in this browser"}</Badge>
        </div>

        {decision.accountId ? (
          <p className="lede" style={{ margin: 0 }}>
            Account ID <strong>{decision.accountId}</strong> — credentials and 2FA setup are sent
            to {payload.account.email}.
          </p>
        ) : null}

        <div className="stack" style={{ gap: "0.45rem" }}>
          <ScreeningLine label="Sanctions lists (OFAC · EU · UK · UN)" outcome={screening.sanctions} />
          <ScreeningLine label="PEP databases" outcome={screening.pep} />
          <ScreeningLine label="Adverse media" outcome={screening.adverseMedia} />
        </div>

        {risk.factors.length > 0 ? (
          <div>
            <p className="kicker" style={{ marginBottom: "0.5rem" }}>
              Risk factors
            </p>
            <ul className="tiny" style={{ margin: 0, paddingLeft: "1.1rem" }}>
              {risk.factors.map((factor) => (
                <li key={factor.label}>
                  {factor.label} <span className="muted">+{factor.points}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="tiny muted" style={{ margin: 0 }}>
            No risk factors triggered.
          </p>
        )}

        <div>
          <p className="kicker" style={{ marginBottom: "0.5rem" }}>
            Decision rationale
          </p>
          <ul className="tiny" style={{ margin: 0, paddingLeft: "1.1rem" }}>
            {decision.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </div>

        {decision.eddChecklist.length > 0 ? (
          <div>
            <p className="kicker" style={{ marginBottom: "0.5rem" }}>
              EDD checklist
            </p>
            <ul className="tiny" style={{ margin: 0, paddingLeft: "1.1rem" }}>
              {decision.eddChecklist.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="row">
          <button type="button" className="dash-tool" onClick={onReset}>
            Start another enrollment
          </button>
        </div>
      </section>
    </div>
  );
}

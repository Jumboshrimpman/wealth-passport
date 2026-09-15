import {
  decideEnrollment,
  generateAccountId,
  screenEnrollment,
  scoreEnrollment,
  validateEnrollment,
  type Enrollment,
  type EnrollmentPayload,
  type EnrollmentSummary,
} from "../../shared/enrollment.ts";

export type EnrollmentSource = "api" | "local";

const LOCAL_KEY = "wealthpass-enrollments";

function readLocalEnrollments(): Enrollment[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY) ?? sessionStorage.getItem(LOCAL_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as Enrollment[]) : [];
  } catch {
    return [];
  }
}

function writeLocalEnrollments(enrollments: Enrollment[]) {
  try {
    const value = JSON.stringify(enrollments);
    localStorage.setItem(LOCAL_KEY, value);
    sessionStorage.setItem(LOCAL_KEY, value);
  } catch {
    // Submission result still renders from memory.
  }
}

function summarize(enrollment: Enrollment): EnrollmentSummary {
  return {
    id: enrollment.id,
    createdAt: enrollment.createdAt,
    fullName: enrollment.payload.account.fullName,
    email: enrollment.payload.account.email,
    status: enrollment.status,
    riskScore: enrollment.risk.score,
    riskLevel: enrollment.risk.level,
  };
}

/**
 * The API runs screening, risk scoring, and the decision engine server-side and
 * persists the enrollment in SQLite. On the static Pages build the same shared
 * engine runs in the browser and the record is kept in local storage.
 */
export async function submitEnrollment(
  payload: EnrollmentPayload,
): Promise<{ enrollment?: Enrollment; errors?: string[]; source: EnrollmentSource }> {
  const errors = validateEnrollment(payload);
  if (errors.length > 0) return { errors, source: "local" };
  try {
    const response = await fetch("/api/enrollments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payload }),
    });
    if (response.status === 400) {
      const body = (await response.json()) as { errors?: string[] };
      return { errors: body.errors ?? ["Enrollment payload failed validation."], source: "api" };
    }
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const body = (await response.json()) as { enrollment: Enrollment };
    if (!body.enrollment?.id) throw new Error("Malformed enrollment payload");
    return { enrollment: body.enrollment, source: "api" };
  } catch {
    const screening = screenEnrollment(payload);
    const risk = scoreEnrollment(payload, screening);
    const decision = decideEnrollment(payload, screening, risk);
    const id = `local-${Date.now()}`;
    if (decision.status === "approved") decision.accountId = generateAccountId(id);
    const enrollment: Enrollment = {
      id,
      createdAt: new Date().toISOString(),
      payload,
      screening,
      risk,
      decision,
      status: decision.status,
    };
    writeLocalEnrollments([enrollment, ...readLocalEnrollments()]);
    return { enrollment, source: "local" };
  }
}

export async function listEnrollments(): Promise<{
  enrollments: EnrollmentSummary[];
  source: EnrollmentSource;
}> {
  try {
    const response = await fetch("/api/enrollments");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const body = (await response.json()) as { enrollments: EnrollmentSummary[] };
    if (!Array.isArray(body.enrollments)) throw new Error("Malformed enrollments payload");
    return { enrollments: body.enrollments, source: "api" };
  } catch {
    return { enrollments: readLocalEnrollments().map(summarize), source: "local" };
  }
}

export async function fetchEnrollment(id: string): Promise<Enrollment | null> {
  try {
    const response = await fetch(`/api/enrollments/${id}`);
    if (!response.ok) return null;
    const body = (await response.json()) as { enrollment: Enrollment };
    return body.enrollment ?? null;
  } catch {
    return readLocalEnrollments().find((enrollment) => enrollment.id === id) ?? null;
  }
}

/**
 * Manual compliance sign-off on an EDD file. Resolutions only exist in the
 * client database — there is no browser fallback, so null means try again
 * with the API running.
 */
export async function resolveEnrollmentDecision(
  id: string,
  decision: "approved" | "rejected",
  officer: string,
): Promise<{ enrollment?: Enrollment; error?: string }> {
  try {
    const response = await fetch(`/api/enrollments/${id}/decision`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision, officer }),
    });
    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      return { error: body.error ?? `HTTP ${response.status}` };
    }
    const body = (await response.json()) as { enrollment: Enrollment };
    return { enrollment: body.enrollment };
  } catch {
    return { error: "API offline — resolutions are stored in the client database." };
  }
}

import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { assemblePassport } from "../shared/assemble.ts";
import {
  layoutPayload,
  mergeLayout,
  type WidgetLayout,
} from "../shared/dashboardLayout.ts";
import { generateAccountId } from "../shared/enrollment.ts";
import type {
  Enrollment,
  EnrollmentDecision,
  EnrollmentPayload,
  EnrollmentStatus,
  EnrollmentSummary,
  RiskAssessment,
  ScreeningResult,
} from "../shared/enrollment.ts";
import { emptyCounters, withFunnel, type CampaignRow } from "../shared/campaign.ts";
import { normalizeScopes, scopeLabels } from "../shared/consent.ts";
import type { OfferMatch } from "../shared/match.ts";
import { CLIENT_SEEDS } from "../shared/seed/index.ts";
import { INSTITUTION_SEEDS } from "../shared/seed/institutions.ts";
import type { Placement } from "../shared/placements.ts";
import type {
  Account,
  Attestation,
  AuditEvent,
  AuditEventKind,
  ClientPassport,
  ClientRecord,
  ClientSummary,
  Household,
  Institution,
  InstitutionTargeting,
  Offer,
  OpsPacket,
  PassportConsent,
  SecurityHolding,
  VerifiedCustodianCopy,
} from "../shared/types.ts";

export function defaultDatabasePath(): string {
  return process.env.DATABASE_PATH ?? "data/wealthpass.sqlite";
}

export function openDatabase(path = defaultDatabasePath()): DatabaseSync {
  if (path !== ":memory:") {
    mkdirSync(dirname(path), { recursive: true });
  }
  const db = new DatabaseSync(path);
  db.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      household_json TEXT NOT NULL,
      advisor_json TEXT NOT NULL,
      consent_shared INTEGER NOT NULL,
      consent_last_changed TEXT NOT NULL,
      consent_scopes_json TEXT NOT NULL,
      ops_packet_json TEXT NOT NULL,
      verified_custodian_json TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT NOT NULL,
      client_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      custodian TEXT NOT NULL,
      balance INTEGER NOT NULL,
      verified_custodian INTEGER NOT NULL,
      sleeve TEXT NOT NULL,
      PRIMARY KEY (client_id, id),
      FOREIGN KEY (client_id) REFERENCES clients(id)
    );
    CREATE TABLE IF NOT EXISTS holdings (
      id TEXT NOT NULL,
      client_id TEXT NOT NULL,
      account_id TEXT NOT NULL,
      name TEXT NOT NULL,
      ticker TEXT NOT NULL,
      kind TEXT NOT NULL,
      asset_class TEXT NOT NULL,
      value INTEGER NOT NULL,
      PRIMARY KEY (client_id, id),
      FOREIGN KEY (client_id) REFERENCES clients(id)
    );
    CREATE TABLE IF NOT EXISTS attestations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id TEXT NOT NULL,
      sort_order INTEGER NOT NULL,
      date TEXT NOT NULL,
      kind TEXT NOT NULL,
      title TEXT NOT NULL,
      detail TEXT NOT NULL,
      FOREIGN KEY (client_id) REFERENCES clients(id)
    );
    CREATE TABLE IF NOT EXISTS institutions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      kind TEXT NOT NULL,
      kind_label TEXT NOT NULL,
      desk TEXT NOT NULL,
      targeting_json TEXT NOT NULL,
      offer_json TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS enrollments (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      status TEXT NOT NULL,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      risk_score INTEGER NOT NULL,
      risk_level TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      screening_json TEXT NOT NULL,
      risk_json TEXT NOT NULL,
      decision_json TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS placements (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL,
      offer_id TEXT NOT NULL,
      institution_id TEXT NOT NULL,
      status TEXT NOT NULL,
      matched_assets INTEGER NOT NULL,
      annual_revenue INTEGER NOT NULL,
      decided_at TEXT NOT NULL,
      snapshot_json TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ts TEXT NOT NULL,
      actor TEXT NOT NULL,
      kind TEXT NOT NULL,
      summary TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS campaign_counters (
      institution_id TEXT PRIMARY KEY,
      views INTEGER NOT NULL DEFAULT 0,
      matches INTEGER NOT NULL DEFAULT 0,
      impressions INTEGER NOT NULL DEFAULT 0
    );
  `);
  return db;
}

export function seedIfEmpty(db: DatabaseSync): void {
  const clientRows = db.prepare("SELECT COUNT(*) AS c FROM clients").get() as { c: number };
  if (clientRows.c === 0) {
    for (const client of CLIENT_SEEDS) {
      insertClient(db, client);
    }
  }
  const institutionRows = db.prepare("SELECT COUNT(*) AS c FROM institutions").get() as {
    c: number;
  };
  if (institutionRows.c === 0) {
    for (const institution of INSTITUTION_SEEDS) {
      insertInstitution(db, institution);
    }
  }
  for (const institution of listInstitutions(db)) {
    db.prepare(
      `INSERT OR IGNORE INTO campaign_counters (institution_id, views, matches, impressions)
       VALUES (?, 0, 0, 0)`,
    ).run(institution.id);
  }
}

export function insertClient(db: DatabaseSync, client: ClientRecord): void {
  db.exec("BEGIN");
  try {
    db.prepare(
      `INSERT INTO clients (
        id, household_json, advisor_json, consent_shared, consent_last_changed,
        consent_scopes_json, ops_packet_json, verified_custodian_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      client.id,
      JSON.stringify(client.household),
      JSON.stringify(client.advisor),
      client.consent.shared ? 1 : 0,
      client.consent.lastChanged,
      JSON.stringify(normalizeScopes(client.consent.scopes)),
      JSON.stringify(client.opsPacket),
      JSON.stringify(client.verifiedCustodian),
    );

    const insertAccount = db.prepare(
      `INSERT INTO accounts (id, client_id, name, type, custodian, balance, verified_custodian, sleeve)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const account of client.accounts) {
      insertAccount.run(
        account.id,
        client.id,
        account.name,
        account.type,
        account.custodian,
        account.balance,
        account.verifiedCustodian ? 1 : 0,
        account.sleeve,
      );
    }

    const insertHolding = db.prepare(
      `INSERT INTO holdings (id, client_id, account_id, name, ticker, kind, asset_class, value)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const holding of client.holdings) {
      insertHolding.run(
        holding.id,
        client.id,
        holding.accountId,
        holding.name,
        holding.ticker,
        holding.kind,
        holding.assetClass,
        holding.value,
      );
    }

    const insertAttestation = db.prepare(
      `INSERT INTO attestations (client_id, sort_order, date, kind, title, detail)
       VALUES (?, ?, ?, ?, ?, ?)`,
    );
    client.attestations.forEach((item, index) => {
      insertAttestation.run(client.id, index, item.date, item.kind, item.title, item.detail);
    });

    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function listClientSummaries(db: DatabaseSync): ClientSummary[] {
  const rows = db.prepare("SELECT id, household_json FROM clients ORDER BY id").all() as {
    id: string;
    household_json: string;
  }[];
  return rows.map((row) => {
    const household = JSON.parse(row.household_json) as Household;
    return {
      id: row.id,
      name: household.name,
      clientFirstName: household.clientFirstName,
      principals: household.principals,
      domicile: household.domicile,
      householdValue: household.householdValue,
    };
  });
}

export function getClientRecord(db: DatabaseSync, id: string): ClientRecord | undefined {
  const row = db.prepare("SELECT * FROM clients WHERE id = ?").get(id) as
    | {
        id: string;
        household_json: string;
        advisor_json: string;
        consent_shared: number;
        consent_last_changed: string;
        consent_scopes_json: string;
        ops_packet_json: string;
        verified_custodian_json: string;
      }
    | undefined;
  if (!row) return undefined;

  const accounts = (
    db.prepare("SELECT * FROM accounts WHERE client_id = ? ORDER BY balance DESC").all(id) as Array<{
      id: string;
      name: string;
      type: string;
      custodian: string;
      balance: number;
      verified_custodian: number;
      sleeve: Account["sleeve"];
    }>
  ).map(
    (account): Account => ({
      id: account.id,
      name: account.name,
      type: account.type,
      custodian: account.custodian,
      balance: account.balance,
      verifiedCustodian: account.verified_custodian === 1,
      sleeve: account.sleeve,
    }),
  );

  const holdings = (
    db.prepare("SELECT * FROM holdings WHERE client_id = ?").all(id) as Array<{
      id: string;
      account_id: string;
      name: string;
      ticker: string;
      kind: string;
      asset_class: SecurityHolding["assetClass"];
      value: number;
    }>
  ).map(
    (holding): SecurityHolding => ({
      id: holding.id,
      accountId: holding.account_id,
      name: holding.name,
      ticker: holding.ticker,
      kind: holding.kind,
      assetClass: holding.asset_class,
      value: holding.value,
    }),
  );

  const attestations = (
    db.prepare("SELECT * FROM attestations WHERE client_id = ? ORDER BY sort_order").all(id) as Array<{
      date: string;
      kind: Attestation["kind"];
      title: string;
      detail: string;
    }>
  ).map(
    (item): Attestation => ({
      date: item.date,
      kind: item.kind,
      title: item.title,
      detail: item.detail,
    }),
  );

  return {
    id: row.id,
    household: JSON.parse(row.household_json) as Household,
    advisor: JSON.parse(row.advisor_json) as Advisor,
    accounts,
    holdings,
    consent: {
      shared: row.consent_shared === 1,
      lastChanged: row.consent_last_changed,
      scopes: normalizeScopes(JSON.parse(row.consent_scopes_json)),
    },
    attestations,
    opsPacket: JSON.parse(row.ops_packet_json) as OpsPacket,
    verifiedCustodian: JSON.parse(row.verified_custodian_json) as VerifiedCustodianCopy,
  };
}

export function getClientPassport(db: DatabaseSync, id: string): ClientPassport | undefined {
  const record = getClientRecord(db, id);
  return record ? assemblePassport(record) : undefined;
}

export function updateConsent(
  db: DatabaseSync,
  id: string,
  patch: { shared?: boolean; scopes?: string[] },
): ClientPassport | undefined {
  const existing = getClientRecord(db, id);
  if (!existing) return undefined;
  const lastChanged = new Date().toISOString().slice(0, 10);
  const shared = patch.shared ?? existing.consent.shared;
  const scopes = patch.scopes !== undefined ? normalizeScopes(patch.scopes) : existing.consent.scopes;
  db.prepare(
    "UPDATE clients SET consent_shared = ?, consent_last_changed = ?, consent_scopes_json = ? WHERE id = ?",
  ).run(shared ? 1 : 0, lastChanged, JSON.stringify(scopes), id);
  return getClientPassport(db, id);
}

export type ConsentPatch = { shared?: boolean; scopes?: string[] };

export function consentChangeSummary(
  previous: { shared: boolean; scopes: string[] },
  next: { shared: boolean; scopes: string[] },
  householdName: string,
): string {
  const bits: string[] = [];
  if (previous.shared !== next.shared) {
    bits.push(`turned passport share ${next.shared ? "on" : "off"}`);
  }
  const before = scopeLabels(previous.scopes).join(", ") || "none";
  const after = scopeLabels(next.scopes).join(", ") || "none";
  if (before !== after) {
    bits.push(`set shared scopes to ${after}`);
  }
  return `${householdName} ${bits.join(" and ")}.`;
}

export function insertInstitution(db: DatabaseSync, institution: Institution): void {
  db.prepare(
    `INSERT INTO institutions (id, name, kind, kind_label, desk, targeting_json, offer_json)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    institution.id,
    institution.name,
    institution.kind,
    institution.kindLabel,
    institution.desk,
    JSON.stringify(institution.targeting),
    JSON.stringify(institution.offer),
  );
}

export function listInstitutions(db: DatabaseSync): Institution[] {
  const rows = db
    .prepare("SELECT * FROM institutions ORDER BY json_extract(offer_json, '$.rank')")
    .all() as Array<{
    id: string;
    name: string;
    kind: Institution["kind"];
    kind_label: string;
    desk: string;
    targeting_json: string;
    offer_json: string;
  }>;
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    kind: row.kind,
    kindLabel: row.kind_label,
    desk: row.desk,
    targeting: JSON.parse(row.targeting_json) as InstitutionTargeting,
    offer: JSON.parse(row.offer_json) as Offer,
  }));
}

const ADMIN_LAYOUT_KEY = "admin-dashboard-layout";

export function getAdminLayout(db: DatabaseSync): WidgetLayout[] {
  const row = db.prepare("SELECT value_json FROM settings WHERE key = ?").get(ADMIN_LAYOUT_KEY) as
    | { value_json: string }
    | undefined;
  if (!row) return mergeLayout(null);
  try {
    return mergeLayout(JSON.parse(row.value_json));
  } catch {
    return mergeLayout(null);
  }
}

export function setAdminLayout(db: DatabaseSync, layout: WidgetLayout[]): WidgetLayout[] {
  const merged = mergeLayout(layoutPayload(layout));
  db.prepare(
    `INSERT INTO settings (key, value_json, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_at = excluded.updated_at`,
  ).run(ADMIN_LAYOUT_KEY, JSON.stringify(layoutPayload(merged)), new Date().toISOString());
  return merged;
}

interface EnrollmentRow {
  id: string;
  created_at: string;
  status: EnrollmentStatus;
  full_name: string;
  email: string;
  risk_score: number;
  risk_level: RiskAssessment["level"];
  payload_json: string;
  screening_json: string;
  risk_json: string;
  decision_json: string;
}

function rowToEnrollment(row: EnrollmentRow): Enrollment {
  return {
    id: row.id,
    createdAt: row.created_at,
    payload: JSON.parse(row.payload_json) as EnrollmentPayload,
    screening: JSON.parse(row.screening_json) as ScreeningResult,
    risk: JSON.parse(row.risk_json) as RiskAssessment,
    decision: JSON.parse(row.decision_json) as EnrollmentDecision,
    status: row.status,
  };
}

export function insertEnrollment(db: DatabaseSync, enrollment: Enrollment): void {
  db.prepare(
    `INSERT INTO enrollments (
      id, created_at, status, full_name, email, risk_score, risk_level,
      payload_json, screening_json, risk_json, decision_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    enrollment.id,
    enrollment.createdAt,
    enrollment.status,
    enrollment.payload.account.fullName,
    enrollment.payload.account.email,
    enrollment.risk.score,
    enrollment.risk.level,
    JSON.stringify(enrollment.payload),
    JSON.stringify(enrollment.screening),
    JSON.stringify(enrollment.risk),
    JSON.stringify(enrollment.decision),
  );
}

export function listEnrollmentSummaries(db: DatabaseSync): EnrollmentSummary[] {
  const rows = db
    .prepare(
      `SELECT id, created_at, status, full_name, email, risk_score, risk_level
       FROM enrollments ORDER BY created_at DESC`,
    )
    .all() as Array<{
    id: string;
    created_at: string;
    status: EnrollmentStatus;
    full_name: string;
    email: string;
    risk_score: number;
    risk_level: RiskAssessment["level"];
  }>;
  return rows.map((row) => ({
    id: row.id,
    createdAt: row.created_at,
    fullName: row.full_name,
    email: row.email,
    status: row.status,
    riskScore: row.risk_score,
    riskLevel: row.risk_level,
  }));
}

export function getEnrollment(db: DatabaseSync, id: string): Enrollment | undefined {
  const row = db.prepare("SELECT * FROM enrollments WHERE id = ?").get(id) as
    | EnrollmentRow
    | undefined;
  return row ? rowToEnrollment(row) : undefined;
}

export type EnrollmentDecisionUpdate =
  | { ok: true; enrollment: Enrollment }
  | { ok: false; reason: "not-found" | "not-edd" };

/** Manual compliance sign-off on an EDD file. Only EDD files are resolvable. */
export function resolveEnrollment(
  db: DatabaseSync,
  id: string,
  decision: "approved" | "rejected",
  officer: string,
): EnrollmentDecisionUpdate {
  const existing = getEnrollment(db, id);
  if (!existing) return { ok: false, reason: "not-found" };
  if (existing.status !== "edd") return { ok: false, reason: "not-edd" };

  const today = new Date().toISOString();
  const updated: Enrollment = {
    ...existing,
    status: decision,
    decision: {
      ...existing.decision,
      status: decision,
      accountId: decision === "approved" ? generateAccountId(id) : null,
      reasons: [
        ...existing.decision.reasons,
        `Manual review: ${decision} by ${officer} on ${today.slice(0, 10)}.`,
      ],
    },
  };
  db.prepare("UPDATE enrollments SET status = ?, decision_json = ? WHERE id = ?").run(
    decision,
    JSON.stringify(updated.decision),
    id,
  );
  return { ok: true, enrollment: updated };
}

interface PlacementRow {
  snapshot_json: string;
}

function rowToPlacement(row: PlacementRow): Placement {
  return JSON.parse(row.snapshot_json) as Placement;
}

export function upsertPlacement(db: DatabaseSync, placement: Placement): void {
  db.prepare(
    `INSERT INTO placements (
      id, client_id, offer_id, institution_id, status, matched_assets, annual_revenue, decided_at, snapshot_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      status = excluded.status,
      matched_assets = excluded.matched_assets,
      annual_revenue = excluded.annual_revenue,
      decided_at = excluded.decided_at,
      snapshot_json = excluded.snapshot_json`,
  ).run(
    placement.id,
    placement.clientId,
    placement.offerId,
    placement.institutionId,
    placement.status,
    placement.matchedAssets,
    placement.annualRevenue,
    placement.decidedAt,
    JSON.stringify(placement),
  );
}

export function listPlacements(db: DatabaseSync): Placement[] {
  const rows = db
    .prepare("SELECT snapshot_json FROM placements ORDER BY decided_at DESC")
    .all() as PlacementRow[];
  return rows.map(rowToPlacement);
}

export function listPlacementsForClient(db: DatabaseSync, clientId: string): Placement[] {
  const rows = db
    .prepare("SELECT snapshot_json FROM placements WHERE client_id = ? ORDER BY decided_at DESC")
    .all(clientId) as PlacementRow[];
  return rows.map(rowToPlacement);
}

/** Append-only audit log. There is intentionally no update or delete path. */
export function appendEvent(
  db: DatabaseSync,
  event: { actor: string; kind: AuditEventKind; summary: string },
): void {
  db.prepare("INSERT INTO events (ts, actor, kind, summary) VALUES (?, ?, ?, ?)").run(
    new Date().toISOString(),
    event.actor,
    event.kind,
    event.summary,
  );
}

export function listEvents(db: DatabaseSync, limit = 100): AuditEvent[] {
  return db
    .prepare("SELECT id, ts, actor, kind, summary FROM events ORDER BY id DESC LIMIT ?")
    .all(limit) as AuditEvent[];
}

export function recordCampaignActivity(
  db: DatabaseSync,
  matches: OfferMatch[],
  consentShared: boolean,
): void {
  const upsert = db.prepare(
    `INSERT INTO campaign_counters (institution_id, views, matches, impressions)
     VALUES (?, 1, ?, ?)
     ON CONFLICT(institution_id) DO UPDATE SET
       views = views + 1,
       matches = matches + excluded.matches,
       impressions = impressions + excluded.impressions`,
  );
  for (const match of matches) {
    const isMatch = match.eligible ? 1 : 0;
    const impressed = match.eligible && consentShared ? 1 : 0;
    upsert.run(match.institution.id, isMatch, impressed);
  }
}

export function listCampaigns(db: DatabaseSync): CampaignRow[] {
  const institutions = listInstitutions(db);
  const placements = listPlacements(db);
  const counterRows = db.prepare("SELECT * FROM campaign_counters").all() as Array<{
    institution_id: string;
    views: number;
    matches: number;
    impressions: number;
  }>;
  const counters = new Map(counterRows.map((row) => [row.institution_id, row]));
  return institutions.map((firm) => {
    const raw = counters.get(firm.id);
    const base = raw
      ? {
          institutionId: firm.id,
          views: raw.views,
          matches: raw.matches,
          impressions: raw.impressions,
        }
      : emptyCounters(firm.id);
    const deskPlacements = placements.filter((row) => row.institutionId === firm.id);
    const accepts = deskPlacements.filter((row) => row.status === "accepted");
    return withFunnel(base, {
      name: firm.name,
      kindLabel: firm.kindLabel,
      accepts: accepts.length,
      declines: deskPlacements.filter((row) => row.status === "declined").length,
      bookedRevenue: accepts.reduce((sum, row) => sum + row.annualRevenue, 0),
    });
  });
}

const PII_MASK_KEY = "admin-pii-mask";

export function getPiiMask(db: DatabaseSync): boolean {
  const row = db.prepare("SELECT value_json FROM settings WHERE key = ?").get(PII_MASK_KEY) as
    | { value_json: string }
    | undefined;
  if (!row) return false;
  try {
    return JSON.parse(row.value_json) === true;
  } catch {
    return false;
  }
}

export function setPiiMask(db: DatabaseSync, mask: boolean): boolean {
  db.prepare(
    `INSERT INTO settings (key, value_json, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_at = excluded.updated_at`,
  ).run(PII_MASK_KEY, JSON.stringify(mask), new Date().toISOString());
  return mask;
}

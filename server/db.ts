import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { assemblePassport } from "../shared/assemble.ts";
import { CLIENT_SEEDS } from "../shared/seed/index.ts";
import type {
  Account,
  Attestation,
  ClientPassport,
  ClientRecord,
  ClientSummary,
  Household,
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
  `);
  return db;
}

export function seedIfEmpty(db: DatabaseSync): void {
  const row = db.prepare("SELECT COUNT(*) AS c FROM clients").get() as { c: number };
  if (row.c > 0) return;
  for (const client of CLIENT_SEEDS) {
    insertClient(db, client);
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
      JSON.stringify(client.consent.scopes),
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
      scopes: JSON.parse(row.consent_scopes_json) as string[],
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

export function updateConsent(db: DatabaseSync, id: string, shared: boolean): ClientPassport | undefined {
  const existing = getClientRecord(db, id);
  if (!existing) return undefined;
  const lastChanged = new Date().toISOString().slice(0, 10);
  db.prepare("UPDATE clients SET consent_shared = ?, consent_last_changed = ? WHERE id = ?").run(
    shared ? 1 : 0,
    lastChanged,
    id,
  );
  return getClientPassport(db, id);
}

export type ConsentPatch = Pick<PassportConsent, "shared">;

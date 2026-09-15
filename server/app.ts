import cors from "cors";
import express from "express";
import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import {
  decideEnrollment,
  generateAccountId,
  screenEnrollment,
  scoreEnrollment,
  validateEnrollment,
  type Enrollment,
  type EnrollmentPayload,
} from "../shared/enrollment.ts";
import { eligibleMatches, matchInstitutions } from "../shared/match.ts";
import {
  getAdminLayout,
  getClientPassport,
  getClientRecord,
  getEnrollment,
  insertEnrollment,
  listClientSummaries,
  listEnrollmentSummaries,
  listInstitutions,
  setAdminLayout,
  updateConsent,
} from "./db.ts";

export function createApp(db: DatabaseSync) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, store: "sqlite", scope: "client" });
  });

  app.get("/api/clients", (_req, res) => {
    res.json({ clients: listClientSummaries(db) });
  });

  app.get("/api/clients/:id", (req, res) => {
    const passport = getClientPassport(db, req.params.id);
    if (!passport) {
      res.status(404).json({ error: `No client record for "${req.params.id}".` });
      return;
    }
    res.json({ client: passport });
  });

  app.patch("/api/clients/:id/consent", (req, res) => {
    const shared = req.body?.shared;
    if (typeof shared !== "boolean") {
      res.status(400).json({ error: "Body must include boolean `shared`." });
      return;
    }
    const passport = updateConsent(db, req.params.id, shared);
    if (!passport) {
      res.status(404).json({ error: `No client record for "${req.params.id}".` });
      return;
    }
    res.json({ client: passport });
  });

  app.get("/api/institutions", (_req, res) => {
    res.json({ institutions: listInstitutions(db) });
  });

  app.get("/api/clients/:id/offers", (req, res) => {
    const record = getClientRecord(db, req.params.id);
    if (!record) {
      res.status(404).json({ error: `No client record for "${req.params.id}".` });
      return;
    }
    const matches = matchInstitutions(record, listInstitutions(db));
    res.json({ matches, eligible: eligibleMatches(matches) });
  });

  app.get("/api/admin/layout", (_req, res) => {
    res.json({ layout: getAdminLayout(db) });
  });

  app.put("/api/admin/layout", (req, res) => {
    const widgets = req.body?.widgets;
    if (!Array.isArray(widgets)) {
      res.status(400).json({ error: "Body must include a `widgets` array." });
      return;
    }
    res.json({ layout: setAdminLayout(db, widgets) });
  });

  app.post("/api/enrollments", (req, res) => {
    const payload = req.body?.payload as EnrollmentPayload | undefined;
    if (!payload || typeof payload !== "object") {
      res.status(400).json({ error: "Body must include an enrollment `payload`." });
      return;
    }
    const errors = validateEnrollment(payload);
    if (errors.length > 0) {
      res.status(400).json({ error: "Enrollment payload failed validation.", errors });
      return;
    }
    const screening = screenEnrollment(payload);
    const risk = scoreEnrollment(payload, screening);
    const decision = decideEnrollment(payload, screening, risk);
    const id = randomUUID();
    if (decision.status === "approved") {
      decision.accountId = generateAccountId(id);
    }
    const enrollment: Enrollment = {
      id,
      createdAt: new Date().toISOString(),
      payload,
      screening,
      risk,
      decision,
      status: decision.status,
    };
    insertEnrollment(db, enrollment);
    res.status(201).json({ enrollment });
  });

  app.get("/api/enrollments", (_req, res) => {
    res.json({ enrollments: listEnrollmentSummaries(db) });
  });

  app.get("/api/enrollments/:id", (req, res) => {
    const enrollment = getEnrollment(db, req.params.id);
    if (!enrollment) {
      res.status(404).json({ error: `No enrollment record for "${req.params.id}".` });
      return;
    }
    res.json({ enrollment });
  });

  return app;
}

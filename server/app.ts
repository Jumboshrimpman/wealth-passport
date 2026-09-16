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
import { formatUsd } from "../shared/format.ts";
import { eligibleMatches, matchInstitutions } from "../shared/match.ts";
import { buildPlacement, type PlacementStatus } from "../shared/placements.ts";
import {
  appendEvent,
  consentChangeSummary,
  getAdminLayout,
  getClientPassport,
  getClientRecord,
  getEnrollment,
  getPiiMask,
  insertEnrollment,
  listCampaigns,
  listClientSummaries,
  listEnrollmentSummaries,
  listEvents,
  listInstitutions,
  listPlacements,
  listPlacementsForClient,
  recordCampaignActivity,
  resolveEnrollment,
  setAdminLayout,
  setPiiMask,
  updateConsent,
  upsertPlacement,
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
    const scopes = req.body?.scopes;
    if (typeof shared !== "boolean" && !Array.isArray(scopes)) {
      res.status(400).json({ error: "Body must include boolean `shared` and/or a `scopes` array." });
      return;
    }
    if (shared !== undefined && typeof shared !== "boolean") {
      res.status(400).json({ error: "`shared` must be a boolean." });
      return;
    }
    const existing = getClientRecord(db, req.params.id);
    if (!existing) {
      res.status(404).json({ error: `No client record for "${req.params.id}".` });
      return;
    }
    const passport = updateConsent(db, req.params.id, {
      shared: typeof shared === "boolean" ? shared : undefined,
      scopes: Array.isArray(scopes) ? scopes : undefined,
    });
    if (!passport) {
      res.status(404).json({ error: `No client record for "${req.params.id}".` });
      return;
    }
    appendEvent(db, {
      actor: passport.household.name,
      kind: "consent.changed",
      summary: consentChangeSummary(existing.consent, passport.consent, passport.household.name),
    });
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
    recordCampaignActivity(db, matches, record.consent.shared);
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
    const layout = setAdminLayout(db, widgets);
    appendEvent(db, {
      actor: "admin",
      kind: "admin.layout_updated",
      summary: `Admin dashboard layout updated (${layout.filter((widget) => widget.visible).length} visible widgets).`,
    });
    res.json({ layout });
  });

  app.get("/api/admin/events", (req, res) => {
    const limit = Number(req.query.limit ?? 100);
    res.json({ events: listEvents(db, Number.isFinite(limit) ? limit : 100) });
  });

  app.get("/api/campaigns", (_req, res) => {
    res.json({ campaigns: listCampaigns(db) });
  });

  app.get("/api/admin/privacy", (_req, res) => {
    res.json({ maskPii: getPiiMask(db) });
  });

  app.put("/api/admin/privacy", (req, res) => {
    const maskPii = req.body?.maskPii;
    if (typeof maskPii !== "boolean") {
      res.status(400).json({ error: "Body must include boolean `maskPii`." });
      return;
    }
    res.json({ maskPii: setPiiMask(db, maskPii) });
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
    appendEvent(db, {
      actor: payload.account.fullName,
      kind: "enrollment.submitted",
      summary: `Enrollment submitted by ${payload.account.fullName} — ${decision.status} (risk ${risk.score}/100).`,
    });
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

  app.patch("/api/enrollments/:id/decision", (req, res) => {
    const { decision, officer } = req.body ?? {};
    if (decision !== "approved" && decision !== "rejected") {
      res.status(400).json({ error: "`decision` must be \"approved\" or \"rejected\"." });
      return;
    }
    if (typeof officer !== "string" || officer.trim().length === 0) {
      res.status(400).json({ error: "Body must include the reviewing `officer`." });
      return;
    }
    const result = resolveEnrollment(db, req.params.id, decision, officer.trim());
    if (!result.ok) {
      if (result.reason === "not-found") {
        res.status(404).json({ error: `No enrollment record for "${req.params.id}".` });
        return;
      }
      res.status(409).json({ error: "Only files in EDD review can be resolved." });
      return;
    }
    appendEvent(db, {
      actor: officer.trim(),
      kind: "enrollment.decided",
      summary: `${officer.trim()} ${decision} the enrollment for ${result.enrollment.payload.account.fullName}${
        result.enrollment.decision.accountId
          ? ` — account ${result.enrollment.decision.accountId} activated`
          : ""
      }.`,
    });
    res.json({ enrollment: result.enrollment });
  });

  app.get("/api/placements", (_req, res) => {
    res.json({ placements: listPlacements(db) });
  });

  app.get("/api/clients/:id/placements", (req, res) => {
    if (!getClientRecord(db, req.params.id)) {
      res.status(404).json({ error: `No client record for "${req.params.id}".` });
      return;
    }
    res.json({ placements: listPlacementsForClient(db, req.params.id) });
  });

  app.post("/api/placements", (req, res) => {
    const { clientId, offerId, status } = req.body ?? {};
    if (typeof clientId !== "string" || typeof offerId !== "string") {
      res.status(400).json({ error: "Body must include string `clientId` and `offerId`." });
      return;
    }
    if (status !== "accepted" && status !== "declined") {
      res.status(400).json({ error: "`status` must be \"accepted\" or \"declined\"." });
      return;
    }
    const record = getClientRecord(db, clientId);
    if (!record) {
      res.status(404).json({ error: `No client record for "${clientId}".` });
      return;
    }
    const institution = listInstitutions(db).find((firm) => firm.offer.id === offerId);
    if (!institution) {
      res.status(404).json({ error: `No offer record for "${offerId}".` });
      return;
    }
    if (!record.consent.shared) {
      res.status(403).json({ error: "Passport share consent is off for this client." });
      return;
    }
    const placement = buildPlacement(record, institution, status as PlacementStatus);
    upsertPlacement(db, placement);
    appendEvent(db, {
      actor: record.household.name,
      kind: "placement.decided",
      summary:
        status === "accepted"
          ? `${record.household.name} accepted ${institution.name} — ${institution.offer.placementFeeBps} bps on ${formatUsd(placement.matchedAssets, true)} books ${formatUsd(placement.annualRevenue)}/yr.`
          : `${record.household.name} declined ${institution.name}.`,
    });
    res.status(200).json({ placement, placements: listPlacementsForClient(db, clientId) });
  });

  return app;
}

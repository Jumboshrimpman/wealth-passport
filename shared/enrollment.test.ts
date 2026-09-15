import assert from "node:assert/strict";
import { test } from "node:test";
import {
  decideEnrollment,
  emptyEnrollmentPayload,
  screenEnrollment,
  scoreEnrollment,
  validateEnrollment,
} from "./enrollment.ts";
import { nameConfidence } from "./seed/watchlist.ts";

test("nameConfidence handles exact, reordered, partial, and unrelated names", () => {
  assert.equal(nameConfidence("Ivan Petrov", "Ivan Petrov"), 0.99);
  assert.ok(nameConfidence("Petrov Ivan", "Ivan Petrov") >= 0.9);
  const surnameOnly = nameConfidence("Ivan Petrov", "Ivan");
  assert.ok(surnameOnly >= 0.5 && surnameOnly < 0.8);
  assert.ok(nameConfidence("Jordan Reyes", "Ivan Petrov") < 0.5);
});

test("validateEnrollment catches ownership sums, expired IDs, and missing UBO detail", () => {
  const payload = emptyEnrollmentPayload();
  assert.ok(validateEnrollment(payload).length > 0);

  payload.entity.isBusiness = true;
  payload.entity.owners = [
    { name: "A", ownershipPct: 40, isEntity: false },
    { name: "B", ownershipPct: 40, isEntity: false },
  ];
  const errors = validateEnrollment(payload);
  assert.ok(errors.some((error) => error.includes("Ownership must sum to 100%")));

  payload.identity.idExpiry = "2020-01-01";
  assert.ok(validateEnrollment(payload).some((error) => error.includes("expired")));
});

test("screening flags watchlist names and passes clean names", () => {
  const clean = emptyEnrollmentPayload();
  clean.account.fullName = "Jordan Reyes";
  const cleanResult = screenEnrollment(clean);
  assert.equal(cleanResult.sanctions.status, "no-hit");
  assert.equal(cleanResult.pep.status, "no-hit");

  const hit = emptyEnrollmentPayload();
  hit.account.fullName = "Maria Santos";
  const hitResult = screenEnrollment(hit);
  assert.equal(hitResult.pep.status, "high-confidence");
  assert.equal(hitResult.pep.hits[0].list, "PEP database");

  const adverse = emptyEnrollmentPayload();
  adverse.account.fullName = "Robert Kahn";
  assert.equal(screenEnrollment(adverse).adverseMedia.status, "high-confidence");
});

test("screening covers entity names and beneficial owners", () => {
  const payload = emptyEnrollmentPayload();
  payload.account.fullName = "Jordan Reyes";
  payload.entity.isBusiness = true;
  payload.entity.legalName = "Reyes Holdings";
  payload.entity.owners = [{ name: "Ivan Petrov", ownershipPct: 100, isEntity: false }];
  assert.equal(screenEnrollment(payload).sanctions.status, "high-confidence");
});

test("risk bands follow the PRD thresholds", () => {
  const payload = emptyEnrollmentPayload();
  const screening = screenEnrollment(payload);

  const low = scoreEnrollment(payload, screening);
  assert.equal(low.score, 0);
  assert.equal(low.level, "low");

  payload.pep.highRiskIndustry = true;
  payload.financial.primaryIncomeSource = "crypto";
  const medium = scoreEnrollment(payload, screening);
  assert.equal(medium.score, 30);
  assert.equal(medium.level, "medium");

  payload.pep.sanctionedJurisdictionTies = true;
  const high = scoreEnrollment(payload, screening);
  assert.equal(high.score, 65);
  assert.equal(high.level, "medium");

  payload.pep.priorEnforcement = true;
  const veryHigh = scoreEnrollment(payload, screening);
  assert.equal(veryHigh.score, 95);
  assert.equal(veryHigh.level, "high");
});

test("decision engine: EDD triggers fire below the score band, reject at sanctions hit", () => {
  const payload = emptyEnrollmentPayload();
  payload.financial.netWorthBand = "over-10m";
  const screening = screenEnrollment(payload);
  const risk = scoreEnrollment(payload, screening);
  assert.equal(risk.level, "low");
  const decision = decideEnrollment(payload, screening, risk);
  assert.equal(decision.status, "edd");
  assert.ok(decision.reasons.some((reason) => reason.includes("$10M")));
  assert.ok(decision.eddChecklist.some((item) => item.includes("Source-of-wealth")));

  const sanctioned = emptyEnrollmentPayload();
  sanctioned.account.fullName = "Ivan Petrov";
  const sanctionedScreening = screenEnrollment(sanctioned);
  const sanctionedRisk = scoreEnrollment(sanctioned, sanctionedScreening);
  assert.equal(decideEnrollment(sanctioned, sanctionedScreening, sanctionedRisk).status, "rejected");

  const clean = emptyEnrollmentPayload();
  const cleanScreening = screenEnrollment(clean);
  const cleanRisk = scoreEnrollment(clean, cleanScreening);
  const approved = decideEnrollment(clean, cleanScreening, cleanRisk);
  assert.equal(approved.status, "approved");
});

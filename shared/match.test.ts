import assert from "node:assert/strict";
import { test } from "node:test";
import { matchInstitution, matchInstitutions } from "./match.ts";
import { elenaClient } from "./seed/elena.ts";
import { INSTITUTION_SEEDS } from "./seed/institutions.ts";

function withScopes(scopes: string[]) {
  return { ...elenaClient, consent: { ...elenaClient.consent, scopes } };
}

test("withholding a required scope blocks the desk without leaking the withheld number", () => {
  const meridian = INSTITUTION_SEEDS.find((firm) => firm.id === "meridian")!;
  const blocked = matchInstitution(withScopes(["risk", "verification", "domicile"]), meridian);
  assert.equal(blocked.eligible, false);
  assert.ok(blocked.reasons.some((reason) => reason.includes("Holdings and sleeves is not shared")));
  assert.equal(blocked.reasons.some((reason) => /Investable \$/.test(reason)), false);

  const noDomicile = matchInstitution(withScopes(["holdings", "risk", "verification"]), meridian);
  assert.equal(noDomicile.eligible, false);
  assert.ok(noDomicile.reasons.some((reason) => reason.includes("Domicile is not shared")));
  assert.equal(noDomicile.reasons.some((reason) => reason.includes("Greenwich, CT")), false);
});

test("oakridge still matches Elena when only domicile is revoked", () => {
  const matches = matchInstitutions(withScopes(["holdings", "risk", "verification"]), INSTITUTION_SEEDS);
  assert.deepEqual(
    matches.filter((row) => row.eligible).map((row) => row.institution.id),
    ["oakridge"],
  );
});

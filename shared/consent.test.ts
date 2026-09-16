import assert from "node:assert/strict";
import { test } from "node:test";
import { assemblePassport } from "./assemble.ts";
import {
  hasScope,
  normalizeScopes,
  redactPassport,
  requiredScopesFor,
  withheldScopes,
} from "./consent.ts";
import { elenaClient } from "./seed/elena.ts";
import { INSTITUTION_SEEDS } from "./seed/institutions.ts";

test("normalizeScopes maps legacy labels, drops junk, and treats missing as all scopes", () => {
  assert.deepEqual(normalizeScopes(undefined), ["holdings", "risk", "verification", "domicile"]);
  assert.deepEqual(normalizeScopes(["Holdings and sleeves", "domicile", "domicile", "nope"]), [
    "holdings",
    "domicile",
  ]);
  assert.deepEqual(normalizeScopes([]), []);
});

test("requiredScopesFor follows targeting floors without inventing extra slices", () => {
  const byId = Object.fromEntries(INSTITUTION_SEEDS.map((firm) => [firm.id, firm]));
  assert.deepEqual(requiredScopesFor(byId["first-atlantic"]!), ["holdings", "risk", "domicile"]);
  assert.deepEqual(requiredScopesFor(byId["meridian"]!), ["holdings", "risk", "domicile"]);
  assert.deepEqual(requiredScopesFor(byId["oakridge"]!), ["holdings", "risk"]);
});

test("redactPassport zeros withheld slices and does not leak verification copy", () => {
  const passport = assemblePassport(elenaClient);
  const redacted = redactPassport({
    ...passport,
    consent: { ...passport.consent, scopes: ["risk"] },
  });
  assert.equal(redacted.household.investable, 0);
  assert.equal(redacted.household.accountValue, 0);
  assert.equal(redacted.accounts.every((account) => account.balance === 0), true);
  assert.equal(redacted.holdings.length, 0);
  assert.equal(redacted.household.liquidity, 18_200_000);
  assert.equal(redacted.household.domicile, "Withheld");
  assert.equal(redacted.verifiedCustodian.badge, "Withheld");
  assert.equal(redacted.advisor.name, "Withheld");
  assert.equal(withheldScopes(["risk"]).join(","), "holdings,verification,domicile");
  assert.equal(hasScope(["risk"], "holdings"), false);
});

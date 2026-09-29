import assert from "node:assert/strict";
import { test } from "node:test";
import { SEEDED_PASSPORTS } from "./seed/index.ts";
import { recordIds } from "./recordIds.ts";

test("each seeded record has a stable client id and a separate household id", () => {
  const clients = new Set<string>();
  const households = new Set<string>();
  for (const passport of SEEDED_PASSPORTS) {
    const first = recordIds(passport.id);
    const again = recordIds(passport.id);
    assert.deepEqual(again, first);
    assert.match(first.clientId, /^CL-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{5}$/);
    assert.match(first.householdId, /^HH-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{5}$/);
    assert.notEqual(first.clientId, first.householdId);
    assert.equal(first.clientId.includes(passport.id), false);
    assert.equal(first.householdId.toLowerCase().includes(passport.household.clientFirstName.toLowerCase()), false);
    assert.equal(clients.has(first.clientId), false, first.clientId);
    assert.equal(households.has(first.householdId), false, first.householdId);
    clients.add(first.clientId);
    households.add(first.householdId);
  }
  assert.equal(clients.size, SEEDED_PASSPORTS.length);
  assert.equal(households.size, SEEDED_PASSPORTS.length);
});

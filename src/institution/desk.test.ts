import assert from "node:assert/strict";
import { test } from "node:test";
import { SEEDED_PASSPORTS } from "../../shared/seed/index.ts";
import {
  anonymizeBook,
  anonPublicText,
  applyDecisions,
  CANNED_STRATEGY_FILE,
  deskReply,
  filterAnon,
  deskGreeting,
  fittingClients,
  LISTING_NOTE,
  listingDecision,
  matchesNewYorkPitch,
  parseStrategyFile,
  recommendationsFor,
  SAMPLE_RECONCILE_FILE,
  seedPitches,
  sleeveTotal,
} from "./desk.ts";

function forbiddenNeedles(): string[] {
  const needles: string[] = [];
  for (const passport of SEEDED_PASSPORTS) {
    needles.push(
      passport.household.clientFirstName,
      passport.household.name,
      passport.household.principals,
      passport.household.entity,
      passport.advisor.name,
      passport.advisor.firm,
    );
    for (const account of passport.accounts) needles.push(account.name);
  }
  return needles.map((needle) => needle.trim()).filter((needle) => needle.length > 3);
}

test("institutional clients are anonymized and Goldman overlap is limited to firm accounts", () => {
  const book = anonymizeBook(SEEDED_PASSPORTS);
  assert.equal(book.length, SEEDED_PASSPORTS.length);
  const needles = forbiddenNeedles();
  for (const row of book) {
    const shown = anonPublicText(row).toLowerCase();
    for (const needle of needles) {
      assert.equal(shown.includes(needle.toLowerCase()), false, `${row.ref} leaked "${needle}"`);
    }
    assert.equal(shown.includes(row.id.toLowerCase()), false);
  }

  const priya = book.find((row) => row.id === "priya-shah");
  const okafor = book.find((row) => row.id === "okafor-trust");
  const elena = book.find((row) => row.id === "elena-whitmore");
  assert.ok(priya && okafor && elena);
  assert.equal(priya.withFirm, 22_400_000);
  assert.equal(priya.elsewhere, 72_000_000 - 22_400_000);
  assert.deepEqual(priya.firmAccounts.map((account) => account.type), ["Taxable joint"]);
  assert.equal(okafor.withFirm, 25_000_000);
  assert.equal(elena.withFirm, null);
  assert.equal(book.filter((row) => row.withFirm != null).length, 2);
  assert.equal(priya.state, "CA");
  assert.equal(priya.country, "United States");
  assert.equal(okafor.state, "NY");
  const london = book.find((row) => row.id === "ashworth-family");
  assert.equal(london?.state, "England");
  assert.equal(london?.country, "United Kingdom");
});

test("client name search does not find an anonymized household", () => {
  const book = anonymizeBook(SEEDED_PASSPORTS);
  for (const query of ["priya", "whitmore", "shah", "elena", "okafor", "david park"]) {
    assert.equal(filterAnon(book, { query }).length, 0, query);
  }
  const newYork = filterAnon(book, { query: "New York" });
  assert.ok(newYork.length > 0);
  assert.ok(newYork.every((row) => row.state === "NY"));
  assert.ok(filterAnon(book, { firmOnly: true }).every((row) => row.withFirm != null));
});

test("strategy upload parses into a profile and the hidden checker posts or holds", () => {
  const clean = parseStrategyFile(CANNED_STRATEGY_FILE);
  assert.equal(clean.name, "Northline Tax-Aware Allocation");
  assert.equal(clean.assetClass, "Multi-asset");
  assert.equal(clean.vehicle, "Hybrid SMA and ETF");
  assert.equal(sleeveTotal(clean.sleeves), 100);
  assert.equal(clean.feeBps, 32);
  assert.equal(clean.minAum, 10_000_000);
  assert.equal(clean.sourceFile, CANNED_STRATEGY_FILE);
  assert.ok(clean.objective.length > 40);
  assert.ok(clean.process.length > 20);
  const recs = recommendationsFor(clean);
  assert.equal(recs.length, 3);
  assert.deepEqual(
    recs.map((rec) => rec.id),
    ["objective", "fee", "allocation"],
  );
  const accepted = applyDecisions(clean, recs, { objective: "accept", fee: "accept", allocation: "accept" });
  assert.equal(accepted.feeBps, 30);
  assert.match(accepted.objective, /US 60\/40 blend/);
  assert.equal(sleeveTotal(accepted.sleeves), 100);
  assert.equal(listingDecision(accepted), "posted");

  const held = parseStrategyFile(SAMPLE_RECONCILE_FILE);
  assert.equal(held.name, "Cedar Opportunistic Credit");
  assert.equal(sleeveTotal(held.sleeves), 88);
  assert.equal(listingDecision(held), "human-review");
  const heldRecs = recommendationsFor(held);
  const footed = applyDecisions(held, heldRecs, { allocation: "accept" });
  assert.equal(sleeveTotal(footed.sleeves), 100);
  assert.equal(listingDecision(footed), "posted");

  const generic = parseStrategyFile("Global Balanced Sleeve.pdf");
  assert.equal(generic.name, "Global Balanced Sleeve");
  assert.equal(sleeveTotal(generic.sleeves), 100);
  assert.equal(listingDecision({ ...generic, name: "", holdingsSummary: "short" }), "human-review");
});

test("desk assistant actions stay anonymized and do not sell placement", () => {
  const book = anonymizeBook(SEEDED_PASSPORTS);
  const pitches = seedPitches();
  const upload = deskReply("Upload this strategy PDF and submit for review", { book, pitches });
  assert.equal(upload.effect, "upload-strategy");
  const draft = deskReply("Prepare a pitch for a client with ≥$10M in New York", { book, pitches });
  assert.equal(draft.effect, "draft-ny-pitch");
  assert.match(draft.text, /not confirmed/i);
  const fit = deskReply("Which clients fit this desk?", { book, pitches });
  assert.equal(fit.effect, null);
  const recent = deskReply("What pitches went out recently?", { book, pitches });
  const spoken = `${upload.text}\n${draft.text}\n${fit.text}\n${recent.text}\n${LISTING_NOTE}`.toLowerCase();
  assert.equal(/paid placement/.test(spoken), false);
  for (const needle of ["priya", "elena", "whitmore", "shah", "okafor", "arjun"]) {
    assert.equal(spoken.includes(needle), false, needle);
  }
  assert.ok(matchesNewYorkPitch(book.find((row) => row.id === "okafor-trust")!));
  assert.equal(fittingClients(book).some((row) => row.withFirm != null), true);
  const greeting = deskGreeting(book, pitches);
  const spokenWithGreeting = `${spoken}\n${greeting.toLowerCase()}`;
  assert.equal(/sit near/.test(spokenWithGreeting), false);
  assert.match(greeting, /household AUM of \$25M or more/);
  assert.match(fit.text, /household AUM of \$25M or more/);
});
